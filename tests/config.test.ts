import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config.js';

// Note: We dynamically import loadConfig in each test to ensure fresh env var reading

describe('config', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have flexible mode defaults', () => {
      expect(DEFAULT_CONFIG.validation.strictMode).toBe(false);
      expect(DEFAULT_CONFIG.validation.requireThoughtPrefix).toBe(false);
      expect(DEFAULT_CONFIG.validation.requireRationalePrefix).toBe(false);
      expect(DEFAULT_CONFIG.validation.allowCustomPurpose).toBe(true);
    });

    it('should have features enabled by default', () => {
      expect(DEFAULT_CONFIG.features.enableRevisions).toBe(true);
      expect(DEFAULT_CONFIG.features.enableBranching).toBe(true);
      expect(DEFAULT_CONFIG.features.enableConfidence).toBe(true);
      expect(DEFAULT_CONFIG.features.enableStructuredActions).toBe(true);
    });

    it('should have sessions disabled by default', () => {
      expect(DEFAULT_CONFIG.features.enableSessions).toBe(false);
    });

    it('should have sensible system defaults', () => {
      expect(DEFAULT_CONFIG.system.maxHistorySize).toBe(100);
      expect(DEFAULT_CONFIG.system.maxBranchDepth).toBe(5);
      expect(DEFAULT_CONFIG.system.sessionTimeout).toBe(60);
    });
  });

  describe('loadConfig', () => {
    it('should return default config when no env vars set', async () => {
      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    describe('CRASH_STRICT_MODE', () => {
      it('should enable strict mode when set to true', async () => {
        vi.stubEnv('CRASH_STRICT_MODE', 'true');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.validation.strictMode).toBe(true);
        expect(config.validation.requireThoughtPrefix).toBe(true);
        expect(config.validation.requireRationalePrefix).toBe(true);
        expect(config.validation.allowCustomPurpose).toBe(false);
      });

      it('should not enable strict mode when set to false', async () => {
        vi.stubEnv('CRASH_STRICT_MODE', 'false');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.validation.strictMode).toBe(false);
      });

      it('should not enable strict mode when not set', async () => {
        // Explicitly not stubbing CRASH_STRICT_MODE
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.validation.strictMode).toBe(false);
      });
    });

    describe('MAX_HISTORY_SIZE', () => {
      it('should set max history size from env var', async () => {
        vi.stubEnv('MAX_HISTORY_SIZE', '50');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.system.maxHistorySize).toBe(50);
      });

      it('should handle large values', async () => {
        vi.stubEnv('MAX_HISTORY_SIZE', '1000');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.system.maxHistorySize).toBe(1000);
      });

      it('should use default for NaN values', async () => {
        vi.stubEnv('MAX_HISTORY_SIZE', 'abc');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.system.maxHistorySize).toBe(100); // Default
      });

      it('should use default for zero values', async () => {
        vi.stubEnv('MAX_HISTORY_SIZE', '0');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.system.maxHistorySize).toBe(100); // Default
      });

      it('should use default for negative values', async () => {
        vi.stubEnv('MAX_HISTORY_SIZE', '-5');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.system.maxHistorySize).toBe(100); // Default
      });
    });

    describe('CRASH_OUTPUT_FORMAT', () => {
      it('should set output format to json', async () => {
        vi.stubEnv('CRASH_OUTPUT_FORMAT', 'json');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.display.outputFormat).toBe('json');
      });

      it('should set output format to markdown', async () => {
        vi.stubEnv('CRASH_OUTPUT_FORMAT', 'markdown');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.display.outputFormat).toBe('markdown');
      });

      it('should set output format to console', async () => {
        vi.stubEnv('CRASH_OUTPUT_FORMAT', 'console');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.display.outputFormat).toBe('console');
      });

      it('should use default for invalid output format', async () => {
        vi.stubEnv('CRASH_OUTPUT_FORMAT', 'invalid');
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.display.outputFormat).toBe('console'); // Default
      });

      it('should be case-insensitive', async () => {
        vi.stubEnv('CRASH_OUTPUT_FORMAT', 'JSON');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.display.outputFormat).toBe('json');
      });
    });

    describe('CRASH_NO_COLOR', () => {
      it('should disable colors when set to true', async () => {
        vi.stubEnv('CRASH_NO_COLOR', 'true');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.display.colorOutput).toBe(false);
      });

      it('should keep colors enabled when not set', async () => {
        // Explicitly not stubbing CRASH_NO_COLOR
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.display.colorOutput).toBe(true);
      });
    });

    describe('CRASH_SESSION_TIMEOUT', () => {
      it('should set session timeout from env var', async () => {
        vi.stubEnv('CRASH_SESSION_TIMEOUT', '30');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.system.sessionTimeout).toBe(30);
      });
    });

    describe('CRASH_MAX_BRANCH_DEPTH', () => {
      it('should set max branch depth from env var', async () => {
        vi.stubEnv('CRASH_MAX_BRANCH_DEPTH', '3');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.system.maxBranchDepth).toBe(3);
      });
    });

    describe('CRASH_ENABLE_SESSIONS', () => {
      it('should enable sessions when set to true', async () => {
        vi.stubEnv('CRASH_ENABLE_SESSIONS', 'true');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.features.enableSessions).toBe(true);
      });

      it('should keep sessions disabled when set to false', async () => {
        vi.stubEnv('CRASH_ENABLE_SESSIONS', 'false');
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.features.enableSessions).toBe(false);
      });

      it('should keep sessions disabled when not set', async () => {
        // Explicitly not stubbing CRASH_ENABLE_SESSIONS
        const { loadConfig } = await import('../src/config.js');
        const config = loadConfig();

        expect(config.features.enableSessions).toBe(false);
      });
    });

    it('should handle multiple env vars together', async () => {
      vi.stubEnv('CRASH_STRICT_MODE', 'true');
      vi.stubEnv('MAX_HISTORY_SIZE', '200');
      vi.stubEnv('CRASH_OUTPUT_FORMAT', 'markdown');
      vi.stubEnv('CRASH_SESSION_TIMEOUT', '120');
      vi.stubEnv('CRASH_MAX_BRANCH_DEPTH', '10');
      vi.stubEnv('CRASH_ENABLE_SESSIONS', 'true');

      const { loadConfig } = await import('../src/config.js');
      const config = loadConfig();

      expect(config.validation.strictMode).toBe(true);
      expect(config.system.maxHistorySize).toBe(200);
      expect(config.display.outputFormat).toBe('markdown');
      expect(config.system.sessionTimeout).toBe(120);
      expect(config.system.maxBranchDepth).toBe(10);
      expect(config.features.enableSessions).toBe(true);
    });
  });
});
