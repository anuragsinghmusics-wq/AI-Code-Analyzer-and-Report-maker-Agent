// packages/shared/src/constants/index.ts — Constants barrel export

export {
  CATEGORY_WEIGHTS,
  computeOverallScore,
  GRADE_THRESHOLDS,
  SCORING_CATEGORIES,
  scoreToGrade,
} from './scoring.constants.js';

export {
  getPhaseIndex,
  getPhaseProgress,
  LLM_PHASES,
  OPTIONAL_PHASES,
  PHASE_LABELS,
  PHASES,
  TOTAL_PHASES,
} from './phases.constants.js';

export {
  CACHE_DEFAULTS,
  FILE_LIMITS,
  IGNORED_PATTERNS,
  LLM_MODELS,
  PIPELINE_LIMITS,
  SUPPORTED_EXTENSIONS,
} from './limits.constants.js';

export { SYSTEM_PROMPT } from './prompts.constants.js';
