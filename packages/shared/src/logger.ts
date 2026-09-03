// packages/shared/src/logger.ts — Pino logger configuration
//
// Usage:
//   import { logger } from '@code-analyzer/shared/logger';
//   logger.info({ event: 'job_started', jobId }, 'Processing analysis job');
//   logger.error({ err, phase: 'parse' }, 'AST extraction failed');
//
// In production, outputs newline-delimited JSON (structured logging).
// In development, outputs pretty-printed human-readable logs.

import pino from 'pino';

/**
 * Log level — defaults to 'info', overridable via LOG_LEVEL env var.
 * Reading directly from process.env to avoid circular dependency with config.ts
 * (config.ts may log validation errors before the logger is ready).
 */
const level = process.env['LOG_LEVEL'] ?? 'info';

/**
 * Whether we're in a development environment.
 */
const isDev = process.env['NODE_ENV'] !== 'production';

/**
 * Application-wide Pino logger.
 *
 * - In development: pretty-printed with timestamps and colors (via pino-pretty, if installed)
 * - In production: JSON lines for structured log aggregation (Grafana/Loki)
 *
 * All log entries automatically include:
 * - `service`: 'code-analyzer'
 * - `pid`, `hostname`, `time` (pino defaults)
 */
export const logger = pino({
  name: 'code-analyzer',
  level,
  // Use ISO timestamps instead of epoch ms for human readability
  timestamp: pino.stdTimeFunctions.isoTime,
  // Serializers for common fields
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  // In dev, use pino-pretty transport if available
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});

/**
 * Create a child logger scoped to a specific component.
 *
 * @example
 * const nodeLogger = createChildLogger('file-analysis');
 * nodeLogger.info({ fileId }, 'Starting file analysis');
 */
export function createChildLogger(component: string): pino.Logger {
  return logger.child({ component });
}

/**
 * Create a child logger scoped to a specific job + phase.
 * Used inside pipeline nodes for structured correlation.
 *
 * @example
 * const log = createPipelineLogger('job-123', 'parse');
 * log.info({ filesCount: 42 }, 'Parsing started');
 */
export function createPipelineLogger(jobId: string, phase: string): pino.Logger {
  return logger.child({ jobId, phase });
}
