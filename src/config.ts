export interface CrashConfig {
  // Validation settings
  validation: {
    requireThoughtPrefix: boolean;
    requireRationalePrefix: boolean;
    allowCustomPurpose: boolean;
    strictMode: boolean; // Legacy compatibility mode
  };
  
  // Feature flags
  features: {
    enableRevisions: boolean;
    enableBranching: boolean;
    enableConfidence: boolean;
    enableStructuredActions: boolean;
    enableSessions: boolean;
  };
  
  // Display settings
  display: {
    colorOutput: boolean;
    outputFormat: 'console' | 'json' | 'markdown';
  };
  
  // System settings
  system: {
    maxHistorySize: number;
    maxBranchDepth: number;
    sessionTimeout: number; // in minutes
  };
}

export const DEFAULT_CONFIG: CrashConfig = {
  validation: {
    requireThoughtPrefix: false, // Changed from true for flexibility
    requireRationalePrefix: false, // Changed from true for flexibility
    allowCustomPurpose: true,
    strictMode: false, // Set to true for legacy behavior
  },
  features: {
    enableRevisions: true,
    enableBranching: true,
    enableConfidence: true,
    enableStructuredActions: true,
    enableSessions: false, // Disabled by default for simplicity
  },
  display: {
    colorOutput: true,
    outputFormat: 'console',
  },
  system: {
    maxHistorySize: 100,
    maxBranchDepth: 5,
    sessionTimeout: 60,
  },
};

// Valid output formats for validation
const VALID_OUTPUT_FORMATS = ['console', 'json', 'markdown'] as const;

/**
 * Safely parse an integer from environment variable with validation
 * Returns undefined if invalid, allowing fallback to default
 */
function parseIntEnv(value: string | undefined, min: number = 1): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < min) return undefined;
  return parsed;
}

export function loadConfig(): CrashConfig {
  // Deep clone to avoid mutating DEFAULT_CONFIG
  const config: CrashConfig = {
    validation: { ...DEFAULT_CONFIG.validation },
    features: { ...DEFAULT_CONFIG.features },
    display: { ...DEFAULT_CONFIG.display },
    system: { ...DEFAULT_CONFIG.system },
  };

  // Override from environment variables
  if (process.env.CRASH_STRICT_MODE === 'true') {
    config.validation.strictMode = true;
    config.validation.requireThoughtPrefix = true;
    config.validation.requireRationalePrefix = true;
    config.validation.allowCustomPurpose = false;
  }

  // Parse MAX_HISTORY_SIZE with validation (must be >= 1)
  const maxHistorySize = parseIntEnv(process.env.MAX_HISTORY_SIZE, 1);
  if (maxHistorySize !== undefined) {
    config.system.maxHistorySize = maxHistorySize;
  }

  // Validate output format against allowed values
  if (process.env.CRASH_OUTPUT_FORMAT) {
    const format = process.env.CRASH_OUTPUT_FORMAT.toLowerCase();
    if (VALID_OUTPUT_FORMATS.includes(format as typeof VALID_OUTPUT_FORMATS[number])) {
      config.display.outputFormat = format as typeof VALID_OUTPUT_FORMATS[number];
    } else {
      console.error(`⚠️ Invalid CRASH_OUTPUT_FORMAT '${process.env.CRASH_OUTPUT_FORMAT}', using default 'console'. Valid options: ${VALID_OUTPUT_FORMATS.join(', ')}`);
    }
  }

  if (process.env.CRASH_NO_COLOR === 'true') {
    config.display.colorOutput = false;
  }

  // Parse CRASH_SESSION_TIMEOUT with validation (must be >= 1 minute)
  const sessionTimeout = parseIntEnv(process.env.CRASH_SESSION_TIMEOUT, 1);
  if (sessionTimeout !== undefined) {
    config.system.sessionTimeout = sessionTimeout;
  }

  // Parse CRASH_MAX_BRANCH_DEPTH with validation (must be >= 1)
  const maxBranchDepth = parseIntEnv(process.env.CRASH_MAX_BRANCH_DEPTH, 1);
  if (maxBranchDepth !== undefined) {
    config.system.maxBranchDepth = maxBranchDepth;
  }

  if (process.env.CRASH_ENABLE_SESSIONS === 'true') {
    config.features.enableSessions = true;
  }

  return config;
}