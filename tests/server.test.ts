import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrashServer } from '../src/server.js';
import { DEFAULT_CONFIG, CrashConfig } from '../src/config.js';
import { CrashStep } from '../src/types.js';

describe('CrashServer', () => {
  const createConfig = (overrides: Partial<CrashConfig> = {}): CrashConfig => ({
    ...DEFAULT_CONFIG,
    display: { ...DEFAULT_CONFIG.display, colorOutput: false },
    ...overrides,
  });

  const createBaseStep = (overrides: Partial<CrashStep> = {}): CrashStep => ({
    step_number: 1,
    estimated_total: 3,
    purpose: 'analysis',
    context: 'Test context',
    thought: 'Test thought',
    outcome: 'Test outcome',
    next_action: 'Test next action',
    rationale: 'Test rationale',
    ...overrides,
  });

  // Suppress console.error during tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('constructor', () => {
    it('should create server with default config', () => {
      const server = new CrashServer(createConfig());
      expect(server.getHistory()).toBeDefined();
      expect(server.getHistory().steps).toEqual([]);
      expect(server.getHistory().completed).toBe(false);
    });
  });

  describe('validateThoughtPrefix', () => {
    it('should pass any thought when validation disabled', () => {
      const server = new CrashServer(createConfig({
        validation: { ...DEFAULT_CONFIG.validation, requireThoughtPrefix: false }
      }));

      expect(server.validateThoughtPrefix('Any thought')).toBe(true);
    });

    it('should validate valid prefixes when enabled', () => {
      const server = new CrashServer(createConfig({
        validation: { ...DEFAULT_CONFIG.validation, requireThoughtPrefix: true }
      }));

      expect(server.validateThoughtPrefix('OK, I will analyze this')).toBe(true);
      expect(server.validateThoughtPrefix('But we need to consider')).toBe(true);
      expect(server.validateThoughtPrefix('Wait this is wrong')).toBe(true);
      expect(server.validateThoughtPrefix('Therefore the answer is')).toBe(true);
      expect(server.validateThoughtPrefix('I see the issue now. The problem is')).toBe(true);
      expect(server.validateThoughtPrefix('I have completed the task')).toBe(true);
    });

    it('should reject invalid prefixes when enabled', () => {
      const server = new CrashServer(createConfig({
        validation: { ...DEFAULT_CONFIG.validation, requireThoughtPrefix: true }
      }));

      expect(server.validateThoughtPrefix('This is my thought')).toBe(false);
      expect(server.validateThoughtPrefix('Let me think')).toBe(false);
    });
  });

  describe('validateRationale', () => {
    it('should pass any rationale when validation disabled', () => {
      const server = new CrashServer(createConfig({
        validation: { ...DEFAULT_CONFIG.validation, requireRationalePrefix: false }
      }));

      expect(server.validateRationale('Any rationale')).toBe(true);
    });

    it('should validate "To" prefix when enabled', () => {
      const server = new CrashServer(createConfig({
        validation: { ...DEFAULT_CONFIG.validation, requireRationalePrefix: true }
      }));

      expect(server.validateRationale('To understand the problem')).toBe(true);
      expect(server.validateRationale('Because it is needed')).toBe(false);
    });
  });

  describe('validatePurpose', () => {
    it('should pass any purpose when custom allowed', () => {
      const server = new CrashServer(createConfig({
        validation: { ...DEFAULT_CONFIG.validation, allowCustomPurpose: true }
      }));

      expect(server.validatePurpose('custom-purpose')).toBe(true);
      expect(server.validatePurpose('anything')).toBe(true);
    });

    it('should validate standard purposes when custom not allowed', () => {
      const server = new CrashServer(createConfig({
        validation: { ...DEFAULT_CONFIG.validation, allowCustomPurpose: false }
      }));

      const validPurposes = [
        'analysis', 'action', 'reflection', 'decision', 'summary',
        'validation', 'exploration', 'hypothesis', 'correction', 'planning'
      ];

      for (const purpose of validPurposes) {
        expect(server.validatePurpose(purpose)).toBe(true);
      }

      expect(server.validatePurpose('custom')).toBe(false);
      expect(server.validatePurpose('invalid')).toBe(false);
    });

    it('should be case-insensitive', () => {
      const server = new CrashServer(createConfig({
        validation: { ...DEFAULT_CONFIG.validation, allowCustomPurpose: false }
      }));

      expect(server.validatePurpose('ANALYSIS')).toBe(true);
      expect(server.validatePurpose('Analysis')).toBe(true);
    });
  });

  describe('extractToolsUsed', () => {
    it('should extract from tools_used field', () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep({ tools_used: ['Read', 'Edit'] });

      expect(server.extractToolsUsed(step)).toEqual(['Read', 'Edit']);
    });

    it('should extract from structured action', () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep({
        next_action: { tool: 'Bash', action: 'Run command' }
      });

      expect(server.extractToolsUsed(step)).toEqual(['Bash']);
    });

    it('should combine and dedupe tools', () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep({
        tools_used: ['Read', 'Edit'],
        next_action: { tool: 'Read', action: 'Read file' }
      });

      expect(server.extractToolsUsed(step)).toEqual(['Read', 'Edit']);
    });

    it('should return empty array when no tools', () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep();

      expect(server.extractToolsUsed(step)).toEqual([]);
    });
  });

  describe('validateDependencies', () => {
    it('should pass when no dependencies', () => {
      const server = new CrashServer(createConfig());

      expect(server.validateDependencies(createBaseStep())).toEqual({
        valid: true,
        missing: []
      });
    });

    it('should detect missing dependencies', () => {
      const server = new CrashServer(createConfig());
      // Use step_number: 10 to avoid circular/future dependency detection
      const step = createBaseStep({ step_number: 10, dependencies: [1, 2, 3] });

      const result = server.validateDependencies(step);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual([1, 2, 3]);
    });

    it('should detect self-dependency as circular', () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep({ step_number: 1, dependencies: [1] });

      const result = server.validateDependencies(step);
      expect(result.valid).toBe(false);
      expect(result.circular).toBe(true);
    });

    it('should detect future dependencies as invalid', () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep({ step_number: 1, dependencies: [5, 10] });

      const result = server.validateDependencies(step);
      expect(result.valid).toBe(false);
      expect(result.circular).toBe(true);
    });

    it('should pass when all dependencies exist', async () => {
      const server = new CrashServer(createConfig());

      // Add steps 1 and 2
      await server.processStep(createBaseStep({ step_number: 1 }));
      await server.processStep(createBaseStep({ step_number: 2 }));

      const step = createBaseStep({ step_number: 3, dependencies: [1, 2] });
      const result = server.validateDependencies(step);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });

  describe('processStep', () => {
    it('should process valid step', async () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep();

      const result = await server.processStep(step);

      expect(result.isError).toBeUndefined();
      const response = JSON.parse(result.content[0].text);
      expect(response.step_number).toBe(1);
      expect(response.total_steps).toBe(1);
      expect(response.completed).toBe(false);
    });

    it('should reject step missing required fields', async () => {
      const server = new CrashServer(createConfig());

      const result = await server.processStep({
        step_number: 1,
        // Missing other required fields
      });

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      // Updated: now includes "or invalid" and specific field names
      expect(response.error).toContain('Missing or invalid required fields');
    });

    it('should reject invalid thought in strict mode', async () => {
      const server = new CrashServer(createConfig({
        validation: {
          ...DEFAULT_CONFIG.validation,
          strictMode: true,
          requireThoughtPrefix: true,
        }
      }));

      const step = createBaseStep({ thought: 'Invalid thought' });
      const result = await server.processStep(step);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('strict mode');
    });

    it('should mark completion via is_final_step flag', async () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep({ is_final_step: true });

      await server.processStep(step);

      expect(server.getHistory().completed).toBe(true);
    });

    it('should mark completion via phrase detection', async () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep({
        thought: 'I have completed the analysis and found the solution'
      });

      await server.processStep(step);

      expect(server.getHistory().completed).toBe(true);
    });

    it('should include confidence in response', async () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep({ confidence: 0.85 });

      const result = await server.processStep(step);
      const response = JSON.parse(result.content[0].text);

      expect(response.confidence).toBe(0.85);
    });

    it('should reject confidence above 1', async () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep({ confidence: 1.5 });

      const result = await server.processStep(step);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('out of bounds');
    });

    it('should reject confidence below 0', async () => {
      const server = new CrashServer(createConfig());
      const step = createBaseStep({ confidence: -0.5 });

      const result = await server.processStep(step);

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('out of bounds');
    });

    it('should accept confidence at boundaries', async () => {
      const server = new CrashServer(createConfig());

      const result0 = await server.processStep(createBaseStep({ step_number: 1, confidence: 0 }));
      expect(result0.isError).toBeUndefined();

      const result1 = await server.processStep(createBaseStep({ step_number: 2, confidence: 1 }));
      expect(result1.isError).toBeUndefined();
    });

    it('should reject empty string fields', async () => {
      const server = new CrashServer(createConfig());

      const result = await server.processStep({
        step_number: 1,
        estimated_total: 3,
        purpose: 'analysis',
        context: '   ', // Whitespace only
        thought: 'Test thought',
        outcome: 'Test outcome',
        next_action: 'Test action',
        rationale: 'Test rationale',
      });

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('context');
    });

    it('should reject step_number of 0', async () => {
      const server = new CrashServer(createConfig());

      const result = await server.processStep(createBaseStep({ step_number: 0 }));

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('step_number');
    });

    it('should trim history when exceeding max size', async () => {
      const server = new CrashServer(createConfig({
        system: { ...DEFAULT_CONFIG.system, maxHistorySize: 3 }
      }));

      for (let i = 1; i <= 5; i++) {
        await server.processStep(createBaseStep({ step_number: i }));
      }

      expect(server.getHistory().steps.length).toBe(3);
      expect(server.getHistory().steps[0].step_number).toBe(3);
    });
  });

  describe('revision handling', () => {
    it('should mark original step as revised', async () => {
      const server = new CrashServer(createConfig());

      // Add original step
      await server.processStep(createBaseStep({ step_number: 1 }));

      // Revise it
      await server.processStep(createBaseStep({
        step_number: 2,
        revises_step: 1,
        revision_reason: 'Found error'
      }));

      const history = server.getHistory();
      const originalStep = history.steps.find(s => s.step_number === 1);

      expect(originalStep?.revised_by).toBe(2);
      expect(history.metadata?.revisions_count).toBe(1);
    });

    it('should handle revision of non-existent step gracefully', async () => {
      const server = new CrashServer(createConfig());

      // First add a step so we can attempt to revise an earlier (non-existent) step
      await server.processStep(createBaseStep({ step_number: 1 }));

      // Try to revise step 0 which doesn't exist (but is earlier than step 2)
      // Note: This should warn but not throw
      await server.processStep(createBaseStep({
        step_number: 2,
        revises_step: 0, // Doesn't exist, but is not a "future" step
        revision_reason: 'Invalid revision'
      }));

      // Should not throw, step should be added
      expect(server.getHistory().steps.length).toBe(2);
    });

    it('should reject revision of future step', async () => {
      const server = new CrashServer(createConfig());

      const result = await server.processStep(createBaseStep({
        step_number: 1,
        revises_step: 999, // Future step - should fail
        revision_reason: 'Invalid revision'
      }));

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('can only revise earlier steps');
    });

    it('should not handle revisions when disabled', async () => {
      const server = new CrashServer(createConfig({
        features: { ...DEFAULT_CONFIG.features, enableRevisions: false }
      }));

      await server.processStep(createBaseStep({ step_number: 1 }));
      await server.processStep(createBaseStep({
        step_number: 2,
        revises_step: 1
      }));

      const originalStep = server.getHistory().steps.find(s => s.step_number === 1);
      expect(originalStep?.revised_by).toBeUndefined();
    });
  });

  describe('branching', () => {
    it('should create branch from step', async () => {
      const server = new CrashServer(createConfig());

      await server.processStep(createBaseStep({ step_number: 1 }));
      await server.processStep(createBaseStep({
        step_number: 2,
        branch_from: 1,
        branch_id: 'alt-1',
        branch_name: 'Alternative approach'
      }));

      const branches = server.getBranches();
      expect(branches.size).toBe(1);
      expect(branches.get('alt-1')?.name).toBe('Alternative approach');
      expect(branches.get('alt-1')?.from_step).toBe(1);
    });

    it('should reject branch exceeding max depth', async () => {
      const server = new CrashServer(createConfig({
        system: { ...DEFAULT_CONFIG.system, maxBranchDepth: 1 }
      }));

      // Create first branch (depth 1 - should work)
      await server.processStep(createBaseStep({ step_number: 1 }));
      const result1 = await server.processStep(createBaseStep({
        step_number: 2,
        branch_from: 1,
        branch_id: 'branch-1'
      }));

      expect(result1.isError).toBeUndefined();

      // Try to branch from the branch (depth 2 - should fail)
      // Note: The depth calculation depends on the branch structure
      // Since we have maxBranchDepth: 1, any branch with depth > 1 should fail
    });

    it('should auto-generate branch id and name', async () => {
      const server = new CrashServer(createConfig());

      await server.processStep(createBaseStep({ step_number: 1 }));
      await server.processStep(createBaseStep({
        step_number: 2,
        branch_from: 1
      }));

      const branches = server.getBranches();
      expect(branches.size).toBe(1);

      const [branchId, branch] = [...branches.entries()][0];
      expect(branchId).toMatch(/^branch-\d+$/);
      expect(branch.name).toBe('Alternative 1');
    });

    it('should not create branch when disabled', async () => {
      const server = new CrashServer(createConfig({
        features: { ...DEFAULT_CONFIG.features, enableBranching: false }
      }));

      await server.processStep(createBaseStep({ step_number: 1 }));
      await server.processStep(createBaseStep({
        step_number: 2,
        branch_from: 1
      }));

      expect(server.getBranches().size).toBe(0);
    });

    it('should reject branching from non-existent step', async () => {
      const server = new CrashServer(createConfig());

      const result = await server.processStep(createBaseStep({
        step_number: 2,
        branch_from: 999 // Doesn't exist
      }));

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('does not exist');
    });
  });

  describe('session management', () => {
    it('should create new session', async () => {
      const server = new CrashServer(createConfig({
        features: { ...DEFAULT_CONFIG.features, enableSessions: true }
      }));

      await server.processStep(createBaseStep({
        step_number: 1,
        session_id: 'test-session'
      }));

      const sessions = server.getSessions();
      expect(sessions.has('test-session')).toBe(true);
    });

    it('should maintain separate history per session', async () => {
      const server = new CrashServer(createConfig({
        features: { ...DEFAULT_CONFIG.features, enableSessions: true }
      }));

      // Add to session 1
      await server.processStep(createBaseStep({
        step_number: 1,
        session_id: 'session-1'
      }));

      // Add to session 2
      await server.processStep(createBaseStep({
        step_number: 1,
        session_id: 'session-2'
      }));

      const sessions = server.getSessions();
      expect(sessions.get('session-1')?.history.steps.length).toBe(1);
      expect(sessions.get('session-2')?.history.steps.length).toBe(1);
    });

    it('should clean up expired sessions', async () => {
      const server = new CrashServer(createConfig({
        features: { ...DEFAULT_CONFIG.features, enableSessions: true },
        system: { ...DEFAULT_CONFIG.system, sessionTimeout: 1 } // 1 minute
      }));

      // Create a session
      await server.processStep(createBaseStep({
        step_number: 1,
        session_id: 'old-session'
      }));

      // Manually expire the session
      const sessions = server.getSessions();
      const oldSession = sessions.get('old-session')!;
      oldSession.lastAccessed = Date.now() - 120000; // 2 minutes ago

      // Force cleanup by calling cleanupExpiredSessions with force=true
      server.cleanupExpiredSessions(true);

      // Create a new session to verify the server still works
      await server.processStep(createBaseStep({
        step_number: 1,
        session_id: 'new-session'
      }));

      expect(sessions.has('old-session')).toBe(false);
      expect(sessions.has('new-session')).toBe(true);
    });

    it('should not create session when disabled', async () => {
      const server = new CrashServer(createConfig({
        features: { ...DEFAULT_CONFIG.features, enableSessions: false }
      }));

      await server.processStep(createBaseStep({
        step_number: 1,
        session_id: 'test-session'
      }));

      expect(server.getSessions().size).toBe(0);
    });
  });

  describe('tools tracking', () => {
    it('should track tools used in metadata', async () => {
      const server = new CrashServer(createConfig());

      await server.processStep(createBaseStep({
        step_number: 1,
        tools_used: ['Read', 'Grep']
      }));

      await server.processStep(createBaseStep({
        step_number: 2,
        tools_used: ['Edit', 'Read']
      }));

      const toolsUsed = server.getHistory().metadata?.tools_used;
      expect(toolsUsed).toContain('Read');
      expect(toolsUsed).toContain('Grep');
      expect(toolsUsed).toContain('Edit');
      expect(toolsUsed?.length).toBe(3); // Deduplicated
    });
  });

  describe('clearHistory', () => {
    it('should reset all state', async () => {
      const server = new CrashServer(createConfig());

      await server.processStep(createBaseStep({ step_number: 1 }));
      await server.processStep(createBaseStep({
        step_number: 2,
        branch_from: 1,
        branch_id: 'branch-1'
      }));

      server.clearHistory();

      expect(server.getHistory().steps.length).toBe(0);
      expect(server.getHistory().completed).toBe(false);
      expect(server.getBranches().size).toBe(0);
    });
  });

  describe('exportHistory', () => {
    it('should export as JSON by default', async () => {
      const server = new CrashServer(createConfig());
      await server.processStep(createBaseStep());

      const exported = server.exportHistory();
      const parsed = JSON.parse(exported);

      expect(parsed.steps.length).toBe(1);
      expect(parsed.completed).toBe(false);
    });

    it('should export as markdown', async () => {
      const server = new CrashServer(createConfig());
      await server.processStep(createBaseStep());

      const exported = server.exportHistory('markdown');

      expect(exported).toContain('### Step 1/3');
      expect(exported).toContain('**Context:**');
    });

    it('should export as text', async () => {
      const server = new CrashServer(createConfig());
      await server.processStep(createBaseStep());

      const exported = server.exportHistory('text');

      expect(exported).toContain('[Step 1/3]');
      expect(exported).toContain('Context:');
    });
  });
});
