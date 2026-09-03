// packages/shared/src/config.ts — Zod-validated environment configuration
//
// Usage:
//   import { config } from '@code-analyzer/shared/config';
//   console.log(config.ANTHROPIC_API_KEY);
//
// Validates all env vars at import-time. The process will crash immediately
// with a clear error message if required variables are missing or malformed.
// This is intentional — fail fast, not at 3 AM in a pipeline node.

import { z } from 'zod';

// ── Schema ────────────────────────────────────────────────────────────

const configSchema = z.object({
  // ── LLM ─────────────────────────────────────────────────
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .default(''),
  OPENROUTER_API_KEY: z
    .string()
    .optional()
    .default(''),
  OPENAI_API_KEY: z
    .string()
    .optional()
    .default(''),
  GOOGLE_API_KEY: z
    .string()
    .optional()
    .default(''),
  GROQ_API_KEY: z
    .string()
    .optional()
    .default(''),
  NVIDIA_API_KEY: z
    .string()
    .optional()
    .default(''),
  OPENCODE_API_KEY: z
    .string()
    .optional()
    .default(''),

  // ── Database ────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required'),

  // ── Redis ───────────────────────────────────────────────
  REDIS_URL: z
    .string()
    .url('REDIS_URL must be a valid URL')
    .default('redis://localhost:6379'),

  // ── Storage ─────────────────────────────────────────────
  S3_BUCKET_NAME: z.string().optional().default(''),
  S3_REGION: z.string().optional().default(''),
  S3_ACCESS_KEY_ID: z.string().optional().default(''),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(''),
  S3_ENDPOINT: z.string().optional().default(''),
  LOCAL_STORAGE_PATH: z.string().optional().default('./uploads'),

  // ── Auth ────────────────────────────────────────────────
  NEXTAUTH_SECRET: z
    .string()
    .optional()
    .default(''),
  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL must be a valid URL')
    .default('http://localhost:3000'),
  GITHUB_CLIENT_ID: z
    .string()
    .optional()
    .default(''),
  GITHUB_CLIENT_SECRET: z
    .string()
    .optional()
    .default(''),

  // ── Security ────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .optional()
    .default(''),
  GITHUB_PAT_ENCRYPTION_KEY: z
    .string()
    .optional()
    .default(''),

  // ── App ─────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default('http://localhost:3000'),
  WORKER_CONCURRENCY: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(50))
    .default('5'),
  MAX_FILE_SIZE_BYTES: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default('512000'),
  MAX_ARCHIVE_SIZE_BYTES: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default('10485760'),
  CACHE_TTL_SECONDS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default('86400'),
  FILE_DELETION_DELAY_MS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default('3600000'),

  // ── Runtime ─────────────────────────────────────────────
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

/**
 * Inferred config type — use this when you need to type-hint config values.
 */
export type AppConfig = z.infer<typeof configSchema>;

// ── Validation ────────────────────────────────────────────────────────

function loadConfig(): AppConfig {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    // eslint-disable-next-line no-console
    console.error(
      `\n❌ Invalid environment configuration:\n${formatted}\n\n` +
      `Ensure all required variables are set in .env or the environment.\n` +
      `See .env.example for reference.\n`,
    );

    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

/**
 * Validated application configuration.
 * Crashes the process at import-time if env vars are invalid.
 *
 * In test environments, use `loadConfigFromEnv()` to validate a custom env object.
 */
export const config: AppConfig = loadConfig();

/**
 * Validate and return config from a custom env object.
 * Useful for testing without polluting `process.env`.
 */
export function loadConfigFromEnv(env: Record<string, string | undefined>): AppConfig {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    throw new Error(
      `Invalid config: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
    );
  }
  return result.data;
}
