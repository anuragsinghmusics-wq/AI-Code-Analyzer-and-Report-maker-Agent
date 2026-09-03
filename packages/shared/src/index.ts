// packages/shared/src/index.ts — Package entry point
//
// Usage from other packages:
//   import { config } from '@code-analyzer/shared/config';
//   import { logger } from '@code-analyzer/shared/logger';
//   import type { CodeFile, Phase } from '@code-analyzer/shared';

// ── Types & Schemas ─────────────────────────────────────────────────────
export type * from './types/index.js';
export * from './types/diagnostic.types.js';

// ── Constants ─────────────────────────────────────────────────────────
export * from './constants/index.js';

// ── Config ────────────────────────────────────────────────────────────
export { config, loadConfigFromEnv } from './config.js';
export type { AppConfig } from './config.js';

// ── Logger ────────────────────────────────────────────────────────────
export { createChildLogger, createPipelineLogger, logger } from './logger.js';

// ── Utilities ─────────────────────────────────────────────────────────
export {
  chunk,
  detectLanguageFromExtension,
  parseLLMJson,
  sha256,
  sleep,
  truncate,
} from './utils.js';
