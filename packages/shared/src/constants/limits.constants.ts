// packages/shared/src/constants/limits.constants.ts — Application limits and defaults

/**
 * File size limits (in bytes).
 */
export const FILE_LIMITS = {
  /** Max single file size — 20 MB */
  MAX_FILE_SIZE_BYTES: 20_971_520,
  /** Max archive (zip) size — 20 MB */
  MAX_ARCHIVE_SIZE_BYTES: 20_971_520,
} as const;

/**
 * Pipeline and LLM limits.
 */
export const PIPELINE_LIMITS = {
  /** Max concurrent BullMQ jobs per worker */
  DEFAULT_WORKER_CONCURRENCY: 5,
  /** LLM call timeout in milliseconds */
  LLM_TIMEOUT_MS: 60_000,
  /** Max LLM retry attempts */
  LLM_MAX_RETRIES: 3,
  /** Default max tokens for LLM response */
  LLM_DEFAULT_MAX_TOKENS: 4096,
  /** Max files to analyze per job (to prevent runaway costs) */
  DEFAULT_MAX_FILES: 100,
  /** Default question count */
  DEFAULT_QUESTION_COUNT: 20,
  /** Min/max question count range */
  MIN_QUESTION_COUNT: 10,
  MAX_QUESTION_COUNT: 30,
} as const;

/**
 * Cache and storage defaults.
 */
export const CACHE_DEFAULTS = {
  /** Cache TTL in seconds — 24 hours */
  CACHE_TTL_SECONDS: 86_400,
  /** How long to wait before deleting uploaded files — 1 hour */
  FILE_DELETION_DELAY_MS: 3_600_000,
} as const;

/**
 * Supported file extensions for analysis, grouped by language.
 */
export const SUPPORTED_EXTENSIONS: Record<string, string[]> = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  python:     ['.py', '.pyw', '.ipynb'],
  java:       ['.java'],
  go:         ['.go'],
  rust:       ['.rs'],
  cpp:        ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
  c:          ['.c', '.h'],
  csharp:     ['.cs'],
  ruby:       ['.rb'],
  php:        ['.php'],
  swift:      ['.swift'],
  kotlin:     ['.kt', '.kts'],
  html:       ['.html', '.htm'],
  css:        ['.css', '.scss', '.sass', '.less'],
  vue:        ['.vue'],
  svelte:     ['.svelte'],
  astro:      ['.astro'],
  markdown:   ['.md', '.mdx'],
  json:       ['.json'],
  yaml:       ['.yaml', '.yml'],
  toml:       ['.toml'],
  ini:        ['.ini'],
  xml:        ['.xml'],
  docker:     ['Dockerfile', '.dockerignore'],
  terraform:  ['.tf', '.tfvars'],
  shell:      ['.sh', '.bash', '.zsh'],
  powershell: ['.ps1'],
  sql:        ['.sql'],
  prisma:     ['.prisma'],
  dart:       ['.dart'],
  scala:      ['.scala'],
  objective_c: ['.m', '.mm'],
  lua:        ['.lua'],
  elixir:     ['.ex', '.exs'],
  r:          ['.R', '.r'],
} as const;

/**
 * File patterns to always ignore during ingestion.
 */
export const IGNORED_PATTERNS: readonly string[] = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '__pycache__',
  '.pytest_cache',
  'vendor',
  'target',
  '.turbo',
  'coverage',
  '.nyc_output',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.DS_Store',
  'Thumbs.db',
] as const;

/**
 * LLM model identifiers.
 */
export const LLM_MODELS = {
  PRIMARY: 'claude-sonnet-4-6' as const,
  FALLBACK: 'gpt-4o' as const,
} as const;
