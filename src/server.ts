import { CrashStep, CrashHistory, Branch, SessionEntry } from './types.js';
import { CrashConfig } from './config.js';
import { CrashFormatter } from './formatter.js';

export class CrashServer {
  private history: CrashHistory;
  private config: CrashConfig;
  private formatter: CrashFormatter;
  private startTime: number;
  private branches: Map<string, Branch> = new Map();
  private sessions: Map<string, SessionEntry> = new Map();

  constructor(config: CrashConfig) {
    this.config = config;
    this.formatter = new CrashFormatter(config.display.colorOutput);
    this.history = this.createNewHistory();
    this.startTime = Date.now();
  }

  public createNewHistory(): CrashHistory {
    return {
      steps: [],
      branches: [],
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        total_duration_ms: 0,
        revisions_count: 0,
        branches_created: 0,
        tools_used: [],
      }
    };
  }

  public validateThoughtPrefix(thought: string): boolean {
    if (!this.config.validation.requireThoughtPrefix) {
      return true; // Skip validation if not required
    }

    const validPrefixes = [
      'OK, I ',
      'But ',
      'Wait ',
      'Therefore ',
      'I see the issue now. ',
      'I have completed '
    ];
    return validPrefixes.some(prefix => thought.startsWith(prefix));
  }

  public validateRationale(rationale: string): boolean {
    if (!this.config.validation.requireRationalePrefix) {
      return true; // Skip validation if not required
    }
    return rationale.startsWith('To ');
  }

  public validatePurpose(purpose: string): boolean {
    if (this.config.validation.allowCustomPurpose) {
      return true; // Any string is valid
    }

    const validPurposes = [
      'analysis', 'action', 'reflection', 'decision', 'summary',
      'validation', 'exploration', 'hypothesis', 'correction', 'planning'
    ];
    return validPurposes.includes(purpose.toLowerCase());
  }

  public extractToolsUsed(step: CrashStep): string[] {
    const tools: string[] = [];

    // From explicit tools_used field
    if (step.tools_used) {
      tools.push(...step.tools_used);
    }

    // From structured action
    if (typeof step.next_action === 'object' && step.next_action.tool) {
      tools.push(step.next_action.tool);
    }

    return [...new Set(tools)]; // Remove duplicates
  }

  public cleanupExpiredSessions(): void {
    if (!this.config.features.enableSessions) return;

    const now = Date.now();
    const timeoutMs = this.config.system.sessionTimeout * 60 * 1000; // Convert minutes to ms

    for (const [sessionId, entry] of this.sessions.entries()) {
      if (now - entry.lastAccessed > timeoutMs) {
        this.sessions.delete(sessionId);
        console.error(`🗑️ Session ${sessionId} expired and removed`);
      }
    }
  }

  public handleRevision(step: CrashStep): void {
    if (step.revises_step && this.config.features.enableRevisions) {
      // Mark the original step as revised
      const originalStep = this.history.steps.find(s => s.step_number === step.revises_step);
      if (originalStep) {
        originalStep.revised_by = step.step_number;
        console.error(`📝 Revising step ${step.revises_step}: ${step.revision_reason || 'No reason provided'}`);
      } else {
        console.error(`⚠️ Warning: Cannot find step ${step.revises_step} to revise`);
      }

      if (this.history.metadata) {
        this.history.metadata.revisions_count = (this.history.metadata.revisions_count || 0) + 1;
      }
    }
  }

  public calculateBranchDepth(stepNumber: number): number {
    // Find if this step is part of a branch, and trace back to calculate depth
    let depth = 0;
    let currentStep = stepNumber;

    // Check each branch to see if it contains steps branching from other branches
    for (const branch of this.branches.values()) {
      if (branch.from_step === currentStep) {
        // Find if from_step itself is in another branch
        for (const otherBranch of this.branches.values()) {
          if (otherBranch.steps.some(s => s.step_number === branch.from_step)) {
            depth = Math.max(depth, otherBranch.depth + 1);
          }
        }
      }
    }

    return depth + 1;
  }

  public handleBranching(step: CrashStep): { success: boolean; error?: string } {
    if (step.branch_from && this.config.features.enableBranching) {
      const branchId = step.branch_id || `branch-${Date.now()}`;
      const branchName = step.branch_name || `Alternative ${this.branches.size + 1}`;

      if (!this.branches.has(branchId)) {
        // Calculate depth and check against max
        const depth = this.calculateBranchDepth(step.branch_from);
        if (depth > this.config.system.maxBranchDepth) {
          const error = `Branch depth ${depth} exceeds maximum ${this.config.system.maxBranchDepth}`;
          console.error(`⚠️ ${error}`);
          return { success: false, error };
        }

        const newBranch: Branch = {
          id: branchId,
          name: branchName,
          from_step: step.branch_from,
          steps: [],
          status: 'active',
          created_at: new Date().toISOString(),
          depth: depth
        };

        this.branches.set(branchId, newBranch);
        this.history.branches = this.history.branches || [];
        this.history.branches.push(newBranch);

        if (this.history.metadata) {
          this.history.metadata.branches_created = (this.history.metadata.branches_created || 0) + 1;
        }

        console.error(`🌿 Created branch "${branchName}" from step ${step.branch_from} (depth: ${depth})`);
      }

      // Add step to branch
      const branch = this.branches.get(branchId);
      if (branch) {
        step.branch_id = branchId;
        branch.steps.push(step);
      }
    }
    return { success: true };
  }

  public validateDependencies(step: CrashStep): { valid: boolean; missing: number[] } {
    if (!step.dependencies || step.dependencies.length === 0) {
      return { valid: true, missing: [] };
    }

    const existingStepNumbers = new Set(this.history.steps.map(s => s.step_number));
    const missing = step.dependencies.filter(dep => !existingStepNumbers.has(dep));

    if (missing.length > 0) {
      console.error(`⚠️ Missing dependencies: steps ${missing.join(', ')} not found in history`);
    }

    return { valid: missing.length === 0, missing };
  }

  private formatOutput(step: CrashStep): string {
    switch (this.config.display.outputFormat) {
      case 'json':
        return this.formatter.formatStepJSON(step);
      case 'markdown':
        return this.formatter.formatStepMarkdown(step);
      default:
        return this.formatter.formatStepConsole(step);
    }
  }

  public async processStep(input: unknown): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const step = input as CrashStep;
      const stepStartTime = Date.now();

      // Validate required fields
      if (!step.step_number || !step.estimated_total || !step.purpose ||
          !step.context || !step.thought || !step.outcome ||
          !step.next_action || !step.rationale) {
        throw new Error('Missing required fields');
      }

      // Apply strict mode if enabled
      if (this.config.validation.strictMode) {
        if (!this.validateThoughtPrefix(step.thought)) {
          throw new Error('Thought must start with one of the required phrases (strict mode)');
        }
        if (!this.validateRationale(step.rationale)) {
          throw new Error('Rationale must start with "To " (strict mode)');
        }
        if (!this.validatePurpose(step.purpose)) {
          throw new Error(`Invalid purpose: ${step.purpose} (strict mode)`);
        }
      } else {
        // Flexible validation
        if (!this.validatePurpose(step.purpose)) {
          console.error(`⚠️ Using custom purpose: ${step.purpose}`);
        }
      }

      // Add timestamp and duration
      step.timestamp = new Date().toISOString();

      // Handle session management with timeout cleanup
      if (step.session_id && this.config.features.enableSessions) {
        this.cleanupExpiredSessions();

        if (!this.sessions.has(step.session_id)) {
          this.sessions.set(step.session_id, {
            history: this.createNewHistory(),
            lastAccessed: Date.now()
          });
        }
        const sessionEntry = this.sessions.get(step.session_id)!;
        sessionEntry.lastAccessed = Date.now();
        this.history = sessionEntry.history;
      }

      // Validate dependencies
      const depValidation = this.validateDependencies(step);
      if (!depValidation.valid) {
        console.error(`⚠️ Proceeding with missing dependencies: ${depValidation.missing.join(', ')}`);
      }

      // Check if completed - explicit flag takes priority
      if (step.is_final_step === true) {
        this.history.completed = true;
      } else {
        // Fallback to phrase detection
        const completionPhrases = ['I have completed', 'Task completed', 'Solution found'];
        if (completionPhrases.some(phrase => step.thought.toLowerCase().includes(phrase.toLowerCase()))) {
          this.history.completed = true;
        }
      }

      // Handle special features
      this.handleRevision(step);

      // Handle branching with depth validation
      const branchResult = this.handleBranching(step);
      if (!branchResult.success) {
        throw new Error(branchResult.error);
      }

      // Track tools used
      const toolsUsed = this.extractToolsUsed(step);
      if (toolsUsed.length > 0 && this.history.metadata) {
        this.history.metadata.tools_used = [
          ...new Set([...(this.history.metadata.tools_used || []), ...toolsUsed])
        ];
      }

      // Add to history
      this.history.steps.push(step);

      // Update metadata
      if (this.history.metadata) {
        step.duration_ms = Date.now() - stepStartTime;
        this.history.metadata.total_duration_ms = Date.now() - this.startTime;
      }
      this.history.updated_at = new Date().toISOString();

      // Trim history if needed
      if (this.history.steps.length > this.config.system.maxHistorySize) {
        this.history.steps = this.history.steps.slice(-this.config.system.maxHistorySize);
        console.error(`History trimmed to ${this.config.system.maxHistorySize} steps`);
      }

      // Display formatted step
      const formattedOutput = this.formatOutput(step);
      console.error(formattedOutput);

      // Show confidence warning if low
      if (step.confidence !== undefined && step.confidence < 0.5) {
        console.error(`⚠️ Low confidence (${Math.round(step.confidence * 100)}%): ${step.uncertainty_notes || 'Consider verification'}`);
      }

      // Prepare response
      const responseData: any = {
        step_number: step.step_number,
        estimated_total: step.estimated_total,
        completed: this.history.completed,
        total_steps: this.history.steps.length,
        next_action: step.next_action,
      };

      // Add optional response fields
      if (step.confidence !== undefined) {
        responseData.confidence = step.confidence;
      }
      if (step.revises_step) {
        responseData.revised_step = step.revises_step;
      }
      if (step.branch_id) {
        responseData.branch = {
          id: step.branch_id,
          name: step.branch_name,
          from: step.branch_from
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(responseData, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: 'failed',
                hint: this.config.validation.strictMode
                  ? 'Strict mode is enabled. Set CRASH_STRICT_MODE=false for flexible validation.'
                  : 'Check that all required fields are provided.',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  public clearHistory(): void {
    this.history = this.createNewHistory();
    this.branches.clear();
    this.startTime = Date.now();
    console.error('🔄 CRASH history cleared');
  }

  public getHistorySummary(): string {
    return this.formatter.formatHistorySummary(this.history);
  }

  public getBranchTree(): string {
    return this.formatter.formatBranchTree(this.history);
  }

  public exportHistory(format: 'json' | 'markdown' | 'text' = 'json'): string {
    switch (format) {
      case 'markdown':
        return this.history.steps.map(step => this.formatter.formatStepMarkdown(step)).join('\n\n');
      case 'text':
        return this.history.steps.map(step => this.formatter.formatStepConsole(step)).join('\n\n');
      default:
        return JSON.stringify(this.history, null, 2);
    }
  }

  // Getters for testing
  public getHistory(): CrashHistory {
    return this.history;
  }

  public getSessions(): Map<string, SessionEntry> {
    return this.sessions;
  }

  public getBranches(): Map<string, Branch> {
    return this.branches;
  }

  public getConfig(): CrashConfig {
    return this.config;
  }
}
