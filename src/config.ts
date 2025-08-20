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
    showProgressBar: boolean;
    verboseLogging: boolean;
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
    showProgressBar: false,
    verboseLogging: false,
  },
  system: {
    maxHistorySize: 100,
    maxBranchDepth: 5,
    sessionTimeout: 60,
  },
};

export function loadConfig(): CrashConfig {
  const config = { ...DEFAULT_CONFIG };
  
  // Override from environment variables
  if (process.env.CRASH_STRICT_MODE === 'true') {
    config.validation.strictMode = true;
    config.validation.requireThoughtPrefix = true;
    config.validation.requireRationalePrefix = true;
    config.validation.allowCustomPurpose = false;
  }
  
  if (process.env.MAX_HISTORY_SIZE) {
    config.system.maxHistorySize = parseInt(process.env.MAX_HISTORY_SIZE);
  }
  
  if (process.env.CRASH_OUTPUT_FORMAT) {
    config.display.outputFormat = process.env.CRASH_OUTPUT_FORMAT as any;
  }
  
  if (process.env.CRASH_NO_COLOR === 'true') {
    config.display.colorOutput = false;
  }
  
  return config;
}