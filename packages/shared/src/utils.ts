// packages/shared/src/utils.ts — Shared utility functions

import type { ZodSchema } from 'zod';

/**
 * Parse raw LLM text output as JSON and validate against a Zod schema.
 * Handles the common case where the model wraps JSON in markdown fences
 * despite being instructed not to.
 *
 * Matches memory.md §8 pattern exactly.
 *
 * @throws {SyntaxError} if the cleaned string is not valid JSON
 * @throws {ZodError} if the parsed object doesn't match the schema
 */
export function parseLLMJson<T>(raw: string, schema: ZodSchema<T>): T {
  // Strip markdown fences if model wrapped in them despite instructions
  const cleaned = raw
    .replace(/^```json\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  const parsed: unknown = JSON.parse(cleaned);
  return schema.parse(parsed);
}

/**
 * Sleep for the given number of milliseconds.
 * Used in retry loops (LLM calls, queue operations).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Compute SHA-256 hash of a string (for content-based cache keys).
 * Returns lowercase hex string.
 */
export async function sha256(content: string): Promise<string> {
  // Use Node.js crypto — dynamic import to keep this module isomorphic
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

/**
 * Truncate a string to a maximum length, appending '…' if truncated.
 * Useful for log messages and UI display.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Chunk an array into smaller arrays of a given size.
 * Used for batching LLM calls (e.g., file analysis in groups of N).
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Detect language from a file extension.
 * Returns 'unknown' for unsupported extensions.
 */
export function detectLanguageFromExtension(
  filePath: string,
): string {
  const { SUPPORTED_EXTENSIONS } = require('./constants/limits.constants.js') as {
    SUPPORTED_EXTENSIONS: Record<string, string[]>;
  };

  const ext = '.' + filePath.split('.').pop()?.toLowerCase();
  for (const [language, extensions] of Object.entries(SUPPORTED_EXTENSIONS)) {
    if (extensions.includes(ext)) return language;
  }
  return 'unknown';
}
