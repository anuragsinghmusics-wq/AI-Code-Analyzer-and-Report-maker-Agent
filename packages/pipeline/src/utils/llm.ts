import OpenAI from 'openai';
import { z, type ZodSchema } from 'zod';
import { config } from '@code-analyzer/shared/config';
import { createPipelineLogger } from '@code-analyzer/shared/logger';
import { sleep } from '@code-analyzer/shared/utils';

interface ProviderConfig {
  id: string;
  client: OpenAI;
  model: string;
}

let availableProviders: ProviderConfig[] = [];
let currentProviderIndex = 0;
let providersInitialized = false;

const initProviders = () => {
  if (providersInitialized) return;
  
  if (config.NVIDIA_API_KEY) {
    availableProviders.push({
      id: 'nvidia',
      client: new OpenAI({ baseURL: 'https://integrate.api.nvidia.com/v1', apiKey: config.NVIDIA_API_KEY }),
      model: 'meta/llama-3.1-70b-instruct'
    });
  }
  if (config.OPENROUTER_API_KEY) {
    availableProviders.push({
      id: 'openrouter',
      client: new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: config.OPENROUTER_API_KEY, defaultHeaders: { 'HTTP-Referer': 'https://deebug.analyzer', 'X-Title': 'Deebug Code Analyzer' } }),
      model: 'google/gemini-2.5-flash'
    });
  }
  if (config.GOOGLE_API_KEY) {
    availableProviders.push({
      id: 'google',
      client: new OpenAI({ baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/', apiKey: config.GOOGLE_API_KEY }),
      model: 'gemini-2.5-flash'
    });
  }
  if (config.OPENCODE_API_KEY) {
    availableProviders.push({
      id: 'opencode',
      client: new OpenAI({ baseURL: 'https://opencode.ai/zen/v1', apiKey: config.OPENCODE_API_KEY }),
      model: 'deepseek-v4-flash-free'
    });
  }
  if (config.GROQ_API_KEY) {
    const keys = config.GROQ_API_KEY.split(',').map(k => k.trim()).filter(Boolean);
    keys.forEach((key, index) => {
      availableProviders.push({
        id: `groq-${index + 1}`,
        client: new OpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: key }),
        model: 'llama-3.3-70b-versatile'
      });
    });
  }

  if (availableProviders.length === 0) {
    availableProviders.push({
      id: 'openrouter-default',
      client: new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY || '' }),
      model: 'google/gemini-2.5-flash'
    });
  }
  providersInitialized = true;
};

const getClientAndModel = (rotate = false): ProviderConfig => {
  initProviders();
  if (rotate && availableProviders.length > 1) {
    currentProviderIndex = (currentProviderIndex + 1) % availableProviders.length;
  }
  return availableProviders[currentProviderIndex];
};

export async function callLLM(
  prompt: string,
  systemPrompt: string,
  maxTokens: number = 8192,
  temperature: number = 0.2,
  jobId: string = 'system'
): Promise<string> {
  const log = createPipelineLogger(jobId, 'llm');
  const start = Date.now();
  let attempt = 0;
  let provider = getClientAndModel();

  const MAX_PROMPT_CHARS = 20_000;
  const truncatedPrompt = prompt.length > MAX_PROMPT_CHARS
    ? prompt.substring(0, MAX_PROMPT_CHARS) + '\n\n... [Prompt truncated to fit context window]'
    : prompt;

  const maxAttempts = 10;
  while (attempt < maxAttempts) {
    try {
      const response = await Promise.race([
        provider.client.chat.completions.create({
          model: provider.model,
          max_tokens: maxTokens,
          temperature,
          messages: [
            { role: 'system', content: systemPrompt + '\n\nCRITICAL INSTRUCTION: You MUST NOT think for more than 500 tokens. Output the JSON array IMMEDIATELY. Keep your <think> block extremely short. If you think too long, you will run out of tokens and the system will crash!' },
            { role: 'user', content: truncatedPrompt }
          ],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LLM timeout')), 180_000)
        ),
      ]);

      const text = response.choices[0]?.message?.content || '';

      if (!text) {
        console.error("LLM returned empty text! Full response:", JSON.stringify(response));
      }

      log.info({
        event: 'llm_call_complete',
        providerId: provider.id,
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        durationMs: Date.now() - start,
      });

      return text;
    } catch (error: any) {
      attempt++;
      log.warn({ attempt, providerId: provider.id, error: error.message }, 'LLM call failed');
      
      if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit') || error.status === 429) {
        // Rotate to the next available provider on rate limit
        log.warn(`Rate limit hit on ${provider.id}. Switching to next API provider...`);
        provider = getClientAndModel(true);
        await sleep(2000);
        if (attempt < maxAttempts) continue;

        const match = error.message?.match(/try again in (\d+(?:\.\d+)?)s/i);
        const waitSeconds = match ? Math.ceil(parseFloat(match[1])) + 2 : 15;
        log.warn({ attempt, waitSeconds, error: error.message }, `Rate limit encountered. Waiting ${waitSeconds}s before retrying...`);
        if (attempt < maxAttempts) {
          await sleep(waitSeconds * 1000);
          continue;
        }
      }

      if (attempt === maxAttempts) throw error;
      await sleep(Math.min(Math.pow(2, attempt) * 1000, 30_000));
    }
  }
  throw new Error(`LLM call failed after ${maxAttempts} attempts`);
}

export function parseLLMJson<T>(raw: string, schema: z.ZodSchema<T>): T {
  try {
    let cleaned = raw;
    
    const normalizeKeys = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(normalizeKeys);
      } else if (obj !== null && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
          // Check if key is snake_case or PascalCase and convert to camelCase
          // Only do basic conversion to not break things like acronyms if possible, 
          // but robust enough for file_id -> fileId, FilePath -> filePath
          let newKey = key;
          if (newKey.includes('_')) {
             newKey = newKey.replace(/_([a-z0-9])/gi, (_, letter) => letter.toUpperCase());
          }
          if (newKey.length > 0 && newKey[0] === newKey[0].toUpperCase()) {
             newKey = newKey.charAt(0).toLowerCase() + newKey.slice(1);
          }
          newObj[newKey] = normalizeKeys(obj[key]);
        }
        return newObj;
      }
      return obj;
    };

    // 1. Remove <think>...</think> blocks entirely
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // 2. Remove markdown code blocks if present
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      cleaned = jsonBlockMatch[1];
    }
    
    cleaned = cleaned.trim();

    let startIdx = cleaned.indexOf('[');
    const startObj = cleaned.indexOf('{');

    if (startIdx === -1 || (startObj !== -1 && startObj < startIdx)) {
      startIdx = startObj;
    }

    let endIdx = cleaned.lastIndexOf(']');
    const endObj = cleaned.lastIndexOf('}');

    if (endIdx === -1 || (endObj !== -1 && endObj > endIdx)) {
      endIdx = endObj;
    }

    const jsonStr = startIdx !== -1 && endIdx !== -1 ? cleaned.substring(startIdx, endIdx + 1) : cleaned;

    let parsed = JSON.parse(jsonStr);
    parsed = normalizeKeys(parsed);

    const mapAliases = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(mapAliases);
      } else if (obj !== null && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
          let newKey = key;
          if (newKey === 'id' && !obj['fileId']) newKey = 'fileId';
          if ((newKey === 'path' || newKey === 'file' || newKey === 'filename' || newKey === 'fileName') && !obj['filePath']) newKey = 'filePath';
          if (newKey === 'name' && !obj['title']) newKey = 'title';
          if (newKey === 'desc' && !obj['description']) newKey = 'description';
          newObj[newKey] = mapAliases(obj[key]);
        }
        return newObj;
      }
      return obj;
    };
    parsed = mapAliases(parsed);
    
    // Recursive search to find the core array if the LLM wrapped it deeply (e.g., { "analysis": { "files": [...] } })
    const findArray = (obj: any): any[] | null => {
      if (Array.isArray(obj)) {
        if (obj.length > 0 && typeof obj[0] === 'object' && !Array.isArray(obj[0])) return obj;
      }
      if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const key in obj) {
          if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
            return obj[key];
          }
        }
        for (const key in obj) {
          const nested = findArray(obj[key]);
          if (nested) return nested;
        }
      }
      return null;
    };

    if (schema instanceof z.ZodArray && !Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
      const foundArray = findArray(parsed);
      if (foundArray) {
        parsed = foundArray;
      } else {
        const values = Object.values(parsed);
        if (values.length > 0 && values.every(v => v && typeof v === 'object' && !Array.isArray(v))) {
          parsed = values;
        } else {
          parsed = [parsed];
        }
      }
    }

    // Auto-wrap array into object if schema expects object but got array
    if (schema instanceof z.ZodObject && Array.isArray(parsed)) {
      const shape = (schema as any).shape;
      if (shape) {
        const arrayKey = Object.keys(shape).find(k => shape[k] instanceof z.ZodArray);
        if (arrayKey) {
          parsed = { [arrayKey]: parsed };
        }
      }
    }

    // Aggressive Auto-unwrap array items
    if (schema instanceof z.ZodArray && Array.isArray(parsed)) {
      parsed = parsed.map(item => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          // If item already contains expected fields, don't unwrap
          if ('fileId' in item || 'filePath' in item || 'purpose' in item || 'title' in item || 'description' in item || 'text' in item) {
            return item;
          }
          const keys = Object.keys(item);
          // Standard single-key unwrap
          if (keys.length === 1 && typeof item[keys[0]] === 'object' && !Array.isArray(item[keys[0]])) {
            return item[keys[0]];
          }
          // Search for a nested object that looks like what we want
          for (const key of keys) {
            const nested = item[key];
            if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
              if ('fileId' in nested || 'filePath' in nested || 'purpose' in nested || 'title' in nested || 'description' in nested || 'text' in nested) {
                return nested;
              }
            }
          }
        }
        return item;
      });
    }

    return schema.parse(parsed);
  } catch (error) {
    console.error("JSON PARSING FAILED! LLM OUTPUT PREVIEW (First 500 / Last 500 chars):");
    console.error("FIRST 500:", JSON.stringify(raw.substring(0, 500)));
    console.error("LAST 500:", JSON.stringify(raw.substring(raw.length - 500)));
    console.error("ZOD ERROR:", error);
    throw error;
  }
}

