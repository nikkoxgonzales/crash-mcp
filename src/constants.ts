import chalk from 'chalk';

// Valid thought prefixes for strict mode validation
export const VALID_PREFIXES = [
  'OK, I ',
  'But ',
  'Wait ',
  'Therefore ',
  'I see the issue now. ',
  'I have completed '
] as const;

// Valid purpose types
export const VALID_PURPOSES = [
  'analysis',
  'action',
  'reflection',
  'decision',
  'summary',
  'validation',
  'exploration',
  'hypothesis',
  'correction',
  'planning'
] as const;

// Phrases that indicate task completion
export const COMPLETION_PHRASES = [
  'I have completed',
  'Task completed',
  'Solution found'
] as const;

// Pre-computed lowercase completion phrases for O(1) matching
export const COMPLETION_PHRASES_LOWER = COMPLETION_PHRASES.map(p => p.toLowerCase());

// Pre-computed Set for O(1) purpose validation
export const VALID_PURPOSES_SET = new Set(VALID_PURPOSES.map(p => p.toLowerCase()));

// Purpose-to-color mapping for console output
export const PURPOSE_COLORS: Record<string, typeof chalk.blue> = {
  analysis: chalk.blue,
  action: chalk.green,
  reflection: chalk.yellow,
  decision: chalk.magenta,
  summary: chalk.cyan,
  validation: chalk.greenBright,
  exploration: chalk.yellowBright,
  hypothesis: chalk.blueBright,
  correction: chalk.redBright,
  planning: chalk.cyanBright,
};

// Default color for unknown purposes
export const DEFAULT_PURPOSE_COLOR = chalk.white;

// Required fields for CrashStep validation
export const REQUIRED_STEP_FIELDS = [
  'step_number',
  'estimated_total',
  'purpose',
  'context',
  'thought',
  'outcome',
  'next_action',
  'rationale'
] as const;

// Confidence bounds
export const CONFIDENCE_MIN = 0;
export const CONFIDENCE_MAX = 1;
export const LOW_CONFIDENCE_THRESHOLD = 0.5;

// Session cleanup interval (number of steps between cleanups)
export const SESSION_CLEANUP_INTERVAL = 10;
