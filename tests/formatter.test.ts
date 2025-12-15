import { describe, it, expect } from 'vitest';
import { CrashFormatter } from '../src/formatter.js';
import { CrashStep, CrashHistory } from '../src/types.js';

describe('CrashFormatter', () => {
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

  describe('formatStepConsole', () => {
    it('should format basic step without colors', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep();
      const output = formatter.formatStepConsole(step);

      expect(output).toContain('[Step 1/3] ANALYSIS');
      expect(output).toContain('Context: Test context');
      expect(output).toContain('Thought: Test thought');
      expect(output).toContain('Outcome: Test outcome');
      expect(output).toContain('Next: Test next action - Test rationale');
    });

    it('should include confidence when provided', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({ confidence: 0.85 });
      const output = formatter.formatStepConsole(step);

      expect(output).toContain('[85%]');
    });

    it('should show revision info when revising another step', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({
        revises_step: 2,
        revision_reason: 'Found error in step 2',
      });
      const output = formatter.formatStepConsole(step);

      expect(output).toContain('Revises #2');
      expect(output).toContain('Revision Reason: Found error in step 2');
    });

    it('should show branch info when branching', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({
        branch_from: 1,
        branch_name: 'Alternative approach',
      });
      const output = formatter.formatStepConsole(step);

      expect(output).toContain('Branch from #1');
      expect(output).toContain('(Alternative approach)');
    });

    it('should show uncertainty notes when provided', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({
        uncertainty_notes: 'Not sure about this approach',
      });
      const output = formatter.formatStepConsole(step);

      expect(output).toContain('Uncertainty: Not sure about this approach');
    });

    it('should show tools used when provided', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({
        tools_used: ['Read', 'Grep', 'Edit'],
      });
      const output = formatter.formatStepConsole(step);

      expect(output).toContain('Tools Used: Read, Grep, Edit');
    });

    it('should show dependencies when provided', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({
        dependencies: [1, 2, 3],
      });
      const output = formatter.formatStepConsole(step);

      expect(output).toContain('Depends On: Steps 1, 2, 3');
    });

    it('should format structured action', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({
        next_action: {
          tool: 'Read',
          action: 'Read the config file',
          parameters: { path: '/config.ts' },
        },
      });
      const output = formatter.formatStepConsole(step);

      expect(output).toContain('[Read] Read the config file');
      expect(output).toContain('{"path":"/config.ts"}');
    });

    it('should handle all purpose types', () => {
      const formatter = new CrashFormatter(false);
      const purposes = [
        'analysis', 'action', 'reflection', 'decision', 'summary',
        'validation', 'exploration', 'hypothesis', 'correction', 'planning',
      ];

      for (const purpose of purposes) {
        const step = createBaseStep({ purpose });
        const output = formatter.formatStepConsole(step);
        expect(output).toContain(`[Step 1/3] ${purpose.toUpperCase()}`);
      }
    });

    it('should handle custom purpose types', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({ purpose: 'custom-purpose' });
      const output = formatter.formatStepConsole(step);

      expect(output).toContain('[Step 1/3] CUSTOM-PURPOSE');
    });
  });

  describe('formatStepMarkdown', () => {
    it('should format step as markdown', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep();
      const output = formatter.formatStepMarkdown(step);

      expect(output).toContain('### Step 1/3: ANALYSIS');
      expect(output).toContain('**Context:** Test context');
      expect(output).toContain('**Thought:** Test thought');
      expect(output).toContain('**Outcome:** Test outcome');
      expect(output).toContain('**Next Action:** Test next action');
      expect(output).toContain('*Rationale:* Test rationale');
      expect(output).toContain('---');
    });

    it('should include confidence badge', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({ confidence: 0.75 });
      const output = formatter.formatStepMarkdown(step);

      expect(output).toContain('![Confidence]');
      expect(output).toContain('75%');
    });

    it('should include revision badge', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({ revises_step: 2 });
      const output = formatter.formatStepMarkdown(step);

      expect(output).toContain('![Revises]');
      expect(output).toContain('step%202');
    });

    it('should include branch badge', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({ branch_from: 3 });
      const output = formatter.formatStepMarkdown(step);

      expect(output).toContain('![Branch]');
      expect(output).toContain('from%203');
    });

    it('should show uncertainty as blockquote', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({
        uncertainty_notes: 'High uncertainty here',
      });
      const output = formatter.formatStepMarkdown(step);

      expect(output).toContain('> ⚠️ **Uncertainty:** High uncertainty here');
    });

    it('should show revision reason as blockquote', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({
        revises_step: 1,
        revision_reason: 'Previous analysis was incorrect',
      });
      const output = formatter.formatStepMarkdown(step);

      expect(output).toContain('> 🔄 **Revision Reason:** Previous analysis was incorrect');
    });

    it('should show tools used', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({
        tools_used: ['Bash', 'Read'],
      });
      const output = formatter.formatStepMarkdown(step);

      expect(output).toContain('**Tools Used:** Bash, Read');
    });
  });

  describe('formatStepJSON', () => {
    it('should return valid JSON', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep();
      const output = formatter.formatStepJSON(step);

      const parsed = JSON.parse(output);
      expect(parsed.step_number).toBe(1);
      expect(parsed.estimated_total).toBe(3);
      expect(parsed.purpose).toBe('analysis');
    });

    it('should include all optional fields', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep({
        confidence: 0.9,
        revises_step: 1,
        branch_from: 2,
        tools_used: ['Test'],
      });
      const output = formatter.formatStepJSON(step);

      const parsed = JSON.parse(output);
      expect(parsed.confidence).toBe(0.9);
      expect(parsed.revises_step).toBe(1);
      expect(parsed.branch_from).toBe(2);
      expect(parsed.tools_used).toEqual(['Test']);
    });
  });

  describe('formatHistorySummary', () => {
    it('should show basic summary', () => {
      const formatter = new CrashFormatter(false);
      const history: CrashHistory = {
        steps: [createBaseStep()],
        completed: false,
      };
      const output = formatter.formatHistorySummary(history);

      expect(output).toContain('CRASH Session Summary');
      expect(output).toContain('Total Steps: 1');
      expect(output).toContain('In Progress');
    });

    it('should show completed status', () => {
      const formatter = new CrashFormatter(false);
      const history: CrashHistory = {
        steps: [createBaseStep()],
        completed: true,
      };
      const output = formatter.formatHistorySummary(history);

      expect(output).toContain('✓ Completed');
    });

    it('should show metadata when present', () => {
      const formatter = new CrashFormatter(false);
      const history: CrashHistory = {
        steps: [createBaseStep()],
        completed: false,
        metadata: {
          revisions_count: 2,
          branches_created: 1,
          total_duration_ms: 5000,
          tools_used: ['Read', 'Edit'],
        },
      };
      const output = formatter.formatHistorySummary(history);

      expect(output).toContain('Revisions: 2');
      expect(output).toContain('Branches Created: 1');
      expect(output).toContain('Duration: 5.00s');
      expect(output).toContain('Tools Used: Read, Edit');
    });

    it('should show average confidence', () => {
      const formatter = new CrashFormatter(false);
      const history: CrashHistory = {
        steps: [
          createBaseStep({ confidence: 0.8 }),
          createBaseStep({ step_number: 2, confidence: 0.6 }),
        ],
        completed: false,
      };
      const output = formatter.formatHistorySummary(history);

      expect(output).toContain('Average Confidence: 70%');
    });

    it('should show branches when present', () => {
      const formatter = new CrashFormatter(false);
      const history: CrashHistory = {
        steps: [createBaseStep()],
        completed: false,
        branches: [
          {
            id: 'branch-1',
            name: 'Alternative A',
            from_step: 1,
            steps: [createBaseStep({ step_number: 2 })],
            status: 'active',
            created_at: new Date().toISOString(),
            depth: 1,
          },
        ],
      };
      const output = formatter.formatHistorySummary(history);

      expect(output).toContain('Branches:');
      expect(output).toContain('● Alternative A (1 steps)');
    });

    it('should show different branch status symbols', () => {
      const formatter = new CrashFormatter(false);
      const history: CrashHistory = {
        steps: [],
        completed: false,
        branches: [
          {
            id: 'active',
            name: 'Active Branch',
            from_step: 1,
            steps: [],
            status: 'active',
            created_at: '',
            depth: 1,
          },
          {
            id: 'merged',
            name: 'Merged Branch',
            from_step: 1,
            steps: [],
            status: 'merged',
            created_at: '',
            depth: 1,
          },
          {
            id: 'abandoned',
            name: 'Abandoned Branch',
            from_step: 1,
            steps: [],
            status: 'abandoned',
            created_at: '',
            depth: 1,
          },
        ],
      };
      const output = formatter.formatHistorySummary(history);

      expect(output).toContain('● Active Branch');
      expect(output).toContain('✓ Merged Branch');
      expect(output).toContain('✗ Abandoned Branch');
    });
  });

  describe('formatBranchTree', () => {
    it('should show main steps', () => {
      const formatter = new CrashFormatter(false);
      const history: CrashHistory = {
        steps: [
          createBaseStep({ step_number: 1, purpose: 'analysis' }),
          createBaseStep({ step_number: 2, purpose: 'action' }),
        ],
        completed: false,
      };
      const output = formatter.formatBranchTree(history);

      expect(output).toContain('Branch Structure:');
      expect(output).toContain('Main:');
      expect(output).toContain('Step 1: analysis');
      expect(output).toContain('Step 2: action');
    });

    it('should show branches from steps', () => {
      const formatter = new CrashFormatter(false);
      const branchStep = createBaseStep({
        step_number: 2,
        purpose: 'exploration',
        branch_id: 'branch-1',
      });
      const history: CrashHistory = {
        steps: [createBaseStep({ step_number: 1 }), branchStep],
        completed: false,
        branches: [
          {
            id: 'branch-1',
            name: 'Alt approach',
            from_step: 1,
            steps: [branchStep],
            status: 'active',
            created_at: '',
            depth: 1,
          },
        ],
      };
      const output = formatter.formatBranchTree(history);

      expect(output).toContain('Branch: Alt approach');
    });
  });

  describe('color handling', () => {
    it('should respect color disabled flag', () => {
      const formatter = new CrashFormatter(false);
      const step = createBaseStep();
      const output = formatter.formatStepConsole(step);

      // When colors are disabled, no ANSI escape codes
      expect(output).not.toMatch(/\x1b\[/);
      expect(output).toContain('[Step 1/3] ANALYSIS');
    });

    it('should create formatter with color enabled flag', () => {
      // We can't reliably test color output in non-TTY environments
      // because chalk auto-detects and may disable colors
      // Instead, we test that the formatter accepts the flag
      const formatterWithColor = new CrashFormatter(true);
      const formatterNoColor = new CrashFormatter(false);

      const step = createBaseStep();
      const outputWithColor = formatterWithColor.formatStepConsole(step);
      const outputNoColor = formatterNoColor.formatStepConsole(step);

      // Both should contain the content
      expect(outputWithColor).toContain('[Step 1/3]');
      expect(outputNoColor).toContain('[Step 1/3]');

      // The no-color output should definitely have no ANSI codes
      expect(outputNoColor).not.toMatch(/\x1b\[/);
    });
  });
});
