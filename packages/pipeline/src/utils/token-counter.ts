import { getEncoding } from "js-tiktoken";

// Standard OpenAI encoding for gpt-4/gpt-3.5-turbo models
const encoding = getEncoding("cl100k_base");

/**
 * Counts the number of tokens in a given text string.
 * @param text The input text to count tokens for
 * @returns The number of tokens
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  return encoding.encode(text).length;
}

/**
 * Truncates a text string to a maximum number of tokens.
 * @param text The input text to truncate
 * @param maxTokens The maximum number of tokens allowed
 * @returns The truncated text
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  if (!text || maxTokens <= 0) return "";
  
  const tokens = encoding.encode(text);
  if (tokens.length <= maxTokens) {
    return text;
  }
  
  // Decode only up to the maxTokens limit
  return encoding.decode(tokens.slice(0, maxTokens));
}
