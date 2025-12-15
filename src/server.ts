import { CrashStep, CrashHistory, Branch, SessionEntry } from './types.js';
import { CrashConfig } from './config.js';
import { CrashFormatter } from './formatter.js';
import {
  VALID_PREFIXES,
  VALID_PURPOSES,
  COMPLETION_PHRASES,
  REQUIRED_STEP_FIELDS,
  CONFIDENCE_MIN,
  CONFIDENCE_MAX,
  LOW_CONFIDENCE_THRESHOLD,
  SESSION_CLEANUP_INTERVAL,
} from './constants.js';

export class CrashServer {
  private history: CrashHistory;
  private config: CrashConfig;
  private formatter: CrashFormatter;
  private startTime: number;
  private branches: Map<string, Branch> = new Map();
  private sessions: Map<string, SessionEntry> = new Map();
  // Performance optimization: O(1) step lookup by number
  private stepIndex: Map<number, CrashStep> = new Map();
  // Performance optimization: cached step numbers for dependency validation
  private stepNumbers: Set<number> = new Set();
  // Performance optimization: tools used as Set for efficient deduplication
  private toolsUsedSet: Set<string> = new Set();
  // Session cleanup counter for batched cleanup
  private stepsSinceCleanup: number = 0;

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
    return VALID_PREFIXES.some(prefix => thought.startsWith(prefix));
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
    return (VALID_PURPOSES as readonly string[]).includes(purpose.toLowerCase());
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

  // Pre-computed timeout in milliseconds for performance
  private get sessionTimeoutMs(): number {
    return this.config.system.sessionTimeout * 60 * 1000;
  }

  public cleanupExpiredSessions(force: boolean = false): void {
    if (!this.config.features.enableSessions) return;

    // Batch cleanup: only run every SESSION_CLEANUP_INTERVAL steps unless forced
    this.stepsSinceCleanup++;
    if (!force && this.stepsSinceCleanup < SESSION_CLEANUP_INTERVAL) {
      return;
    }
    this.stepsSinceCleanup = 0;

    const now = Date.now();
    const timeoutMs = this.sessionTimeoutMs;

    for (const [sessionId, entry] of this.sessions.entries()) {
      if (now - entry.lastAccessed > timeoutMs) {
        this.sessions.delete(sessionId);
        console.error(`🗑️ Session ${sessionId} expired and removed`);
      }
    }
  }

  public handleRevision(step: CrashStep): { valid: boolean; error?: string } {
    if (!step.revises_step || !this.config.features.enableRevisions) {
      return { valid: true };
    }

    // Validate: cannot revise a future step
    if (step.revises_step >= step.step_number) {
      const error = `Cannot revise step ${step.revises_step} from step ${step.step_number}: can only revise earlier steps`;
      console.error(`⚠️ ${error}`);
      return { valid: false, error };
    }

    // Use stepIndex for O(1) lookup instead of .find()
    const originalStep = this.stepIndex.get(step.revises_step);
    if (originalStep) {
      originalStep.revised_by = step.step_number;
      console.error(`📝 Revising step ${step.revises_step}: ${step.revision_reason || 'No reason provided'}`);
    } else {
      const availableSteps = Array.from(this.stepNumbers).sort((a, b) => a - b).join(', ');
      console.error(`⚠️ Warning: Cannot find step ${step.revises_step} to revise. Available steps: ${availableSteps || 'none'}`);
    }

    if (this.history.metadata) {
      this.history.metadata.revisions_count = (this.history.metadata.revisions_count || 0) + 1;
    }

    return { valid: true };
  }

  // Memoization cache for branch depth calculations
  private branchDepthCache: Map<number, number> = new Map();

  /**
   * Calculate the depth of a branch starting from a given step.
   * Uses memoization for performance.
   *
   * Depth 1 = branching from main history
   * Depth 2 = branching from a depth-1 branch
   * etc.
   */
  public calculateBranchDepth(stepNumber: number): number {
    // Check cache first
    if (this.branchDepthCache.has(stepNumber)) {
      return this.branchDepthCache.get(stepNumber)!;
    }

    // Check if stepNumber is in any branch's steps
    for (const branch of this.branches.values()) {
      const isInBranch = branch.steps.some(s => s.step_number === stepNumber);
      if (isInBranch) {
        // This step is in a branch, so new branch from here would be branch.depth + 1
        const depth = branch.depth + 1;
        this.branchDepthCache.set(stepNumber, depth);
        return depth;
      }
    }

    // Step is in main history (not in any branch), so branching from here is depth 1
    this.branchDepthCache.set(stepNumber, 1);
    return 1;
  }

  /**
   * Clear branch depth cache when branches are modified
   */
  private invalidateBranchDepthCache(): void {
    this.branchDepthCache.clear();
  }

  public handleBranching(step: CrashStep): { success: boolean; error?: string } {
    if (!step.branch_from || !this.config.features.enableBranching) {
      return { success: true };
    }

    // Validate that branch_from step exists
    if (!this.stepNumbers.has(step.branch_from)) {
      const availableSteps = Array.from(this.stepNumbers).sort((a, b) => a - b).join(', ');
      const error = `Cannot branch from step ${step.branch_from}: step does not exist. Available steps: ${availableSteps || 'none'}`;
      console.error(`⚠️ ${error}`);
      return { success: false, error };
    }

    const branchId = step.branch_id || `branch-${Date.now()}`;
    const branchName = step.branch_name || `Alternative ${this.branches.size + 1}`;

    if (!this.branches.has(branchId)) {
      // Calculate depth and check against max
      const depth = this.calculateBranchDepth(step.branch_from);
      if (depth > this.config.system.maxBranchDepth) {
        const error = `Branch depth ${depth} exceeds maximum ${this.config.system.maxBranchDepth}. Max allowed: ${this.config.system.maxBranchDepth}`;
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
      // Invalidate depth cache since branch structure changed
      this.invalidateBranchDepthCache();

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

    return { success: true };
  }

  public validateDependencies(step: CrashStep): { valid: boolean; missing: number[]; circular?: boolean } {
    if (!step.dependencies || step.dependencies.length === 0) {
      return { valid: true, missing: [] };
    }

    // Check for self-dependency (simplest circular dependency)
    if (step.dependencies.includes(step.step_number)) {
      console.error(`⚠️ Circular dependency: step ${step.step_number} cannot depend on itself`);
      return { valid: false, missing: [], circular: true };
    }

    // Check for dependencies on future steps
    const futureDeps = step.dependencies.filter(dep => dep >= step.step_number);
    if (futureDeps.length > 0) {
      console.error(`⚠️ Invalid dependencies: step ${step.step_number} cannot depend on future steps ${futureDeps.join(', ')}`);
      return { valid: false, missing: futureDeps, circular: true };
    }

    // Use cached stepNumbers Set for O(1) lookups instead of rebuilding
    const missing = step.dependencies.filter(dep => !this.stepNumbers.has(dep));

    if (missing.length > 0) {
      const availableSteps = Array.from(this.stepNumbers).sort((a, b) => a - b).join(', ');
      console.error(`⚠️ Missing dependencies: steps ${missing.join(', ')} not found. Available: ${availableSteps || 'none'}`);
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

  /**
   * Validate that a string field is non-empty
   */
  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Validate required fields with detailed error messages
   */
  private validateRequiredFields(step: CrashStep): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    // Check step_number is a positive integer (not just truthy, since 0 would fail)
    if (typeof step.step_number !== 'number' || step.step_number < 1 || !Number.isInteger(step.step_number)) {
      missing.push('step_number (must be positive integer >= 1)');
    }

    // Check estimated_total is a positive integer
    if (typeof step.estimated_total !== 'number' || step.estimated_total < 1 || !Number.isInteger(step.estimated_total)) {
      missing.push('estimated_total (must be positive integer >= 1)');
    }

    // Check string fields are non-empty
    if (!this.isNonEmptyString(step.purpose)) missing.push('purpose');
    if (!this.isNonEmptyString(step.context)) missing.push('context');
    if (!this.isNonEmptyString(step.thought)) missing.push('thought');
    if (!this.isNonEmptyString(step.outcome)) missing.push('outcome');
    if (!this.isNonEmptyString(step.rationale)) missing.push('rationale');

    // Check next_action is either non-empty string or valid object
    if (typeof step.next_action === 'string') {
      if (!this.isNonEmptyString(step.next_action)) {
        missing.push('next_action');
      }
    } else if (typeof step.next_action === 'object' && step.next_action !== null) {
      if (!this.isNonEmptyString(step.next_action.action)) {
        missing.push('next_action.action');
      }
    } else {
      missing.push('next_action');
    }

    return { valid: missing.length === 0, missing };
  }

  /**
   * Validate confidence is within bounds if provided
   */
  private validateConfidence(step: CrashStep): { valid: boolean; error?: string } {
    if (step.confidence === undefined) {
      return { valid: true };
    }

    if (typeof step.confidence !== 'number' || isNaN(step.confidence)) {
      return { valid: false, error: `Confidence must be a number, got ${typeof step.confidence}` };
    }

    if (step.confidence < CONFIDENCE_MIN || step.confidence > CONFIDENCE_MAX) {
      return {
        valid: false,
        error: `Confidence ${step.confidence} out of bounds [${CONFIDENCE_MIN}, ${CONFIDENCE_MAX}]`
      };
    }

    return { valid: true };
  }

  /**
   * Trim history and clean up orphaned references
   */
  private trimHistory(): void {
    if (this.history.steps.length <= this.config.system.maxHistorySize) {
      return;
    }

    const oldSteps = this.history.steps.slice(0, -this.config.system.maxHistorySize);
    const removedStepNumbers = new Set(oldSteps.map(s => s.step_number));

    // Trim the steps array
    this.history.steps = this.history.steps.slice(-this.config.system.maxHistorySize);

    // Update stepIndex and stepNumbers caches
    for (const stepNum of removedStepNumbers) {
      this.stepIndex.delete(stepNum);
      this.stepNumbers.delete(stepNum);
    }

    // Clean up branches that reference removed steps
    for (const [branchId, branch] of this.branches.entries()) {
      if (removedStepNumbers.has(branch.from_step)) {
        this.branches.delete(branchId);
        console.error(`🗑️ Branch "${branch.name}" removed (from_step ${branch.from_step} was trimmed)`);
      }
    }

    // Invalidate branch depth cache since structure may have changed
    this.invalidateBranchDepthCache();

    console.error(`📋 History trimmed to ${this.config.system.maxHistorySize} steps (removed ${removedStepNumbers.size} old steps)`);
  }

  public async processStep(input: unknown): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const step = input as CrashStep;
      const stepStartTime = Date.now();

      // Validate required fields with detailed error messages
      const fieldValidation = this.validateRequiredFields(step);
      if (!fieldValidation.valid) {
        throw new Error(`Missing or invalid required fields: ${fieldValidation.missing.join(', ')}`);
      }

      // Validate confidence bounds
      const confidenceValidation = this.validateConfidence(step);
      if (!confidenceValidation.valid) {
        throw new Error(confidenceValidation.error);
      }

      // Apply strict mode if enabled
      if (this.config.validation.strictMode) {
        if (!this.validateThoughtPrefix(step.thought)) {
          throw new Error(`Thought must start with one of: ${VALID_PREFIXES.join(', ')} (strict mode)`);
        }
        if (!this.validateRationale(step.rationale)) {
          throw new Error('Rationale must start with "To " (strict mode)');
        }
        if (!this.validatePurpose(step.purpose)) {
          throw new Error(`Invalid purpose "${step.purpose}". Valid: ${VALID_PURPOSES.join(', ')} (strict mode)`);
        }
      } else {
        // Flexible validation
        if (!this.validatePurpose(step.purpose)) {
          console.error(`⚠️ Using custom purpose: ${step.purpose}`);
        }
      }

      // Add timestamp
      step.timestamp = new Date().toISOString();

      // Handle session management with batched cleanup
      if (step.session_id && this.config.features.enableSessions) {
        this.cleanupExpiredSessions(); // Uses batched cleanup internally

        if (!this.sessions.has(step.session_id)) {
          this.sessions.set(step.session_id, {
            history: this.createNewHistory(),
            lastAccessed: Date.now()
          });
          // Reset indexes for new session
          this.stepIndex.clear();
          this.stepNumbers.clear();
          this.toolsUsedSet.clear();
        }
        const sessionEntry = this.sessions.get(step.session_id)!;
        sessionEntry.lastAccessed = Date.now();
        this.history = sessionEntry.history;
      }

      // Validate dependencies (uses cached stepNumbers)
      const depValidation = this.validateDependencies(step);
      if (depValidation.circular) {
        throw new Error(`Circular dependency detected for step ${step.step_number}`);
      }
      if (!depValidation.valid) {
        console.error(`⚠️ Proceeding with missing dependencies: ${depValidation.missing.join(', ')}`);
      }

      // Check if completed - explicit flag takes priority
      if (step.is_final_step === true) {
        this.history.completed = true;
      } else {
        // Fallback to phrase detection using constant
        const thoughtLower = step.thought.toLowerCase();
        if (COMPLETION_PHRASES.some(phrase => thoughtLower.includes(phrase.toLowerCase()))) {
          this.history.completed = true;
        }
      }

      // Handle revision with validation
      const revisionResult = this.handleRevision(step);
      if (!revisionResult.valid) {
        throw new Error(revisionResult.error);
      }

      // Handle branching with depth validation
      const branchResult = this.handleBranching(step);
      if (!branchResult.success) {
        throw new Error(branchResult.error);
      }

      // Track tools used efficiently with Set
      const toolsUsed = this.extractToolsUsed(step);
      for (const tool of toolsUsed) {
        this.toolsUsedSet.add(tool);
      }
      if (this.history.metadata) {
        this.history.metadata.tools_used = Array.from(this.toolsUsedSet);
      }

      // Add to history and update indexes
      this.history.steps.push(step);
      this.stepIndex.set(step.step_number, step);
      this.stepNumbers.add(step.step_number);

      // Update metadata
      if (this.history.metadata) {
        step.duration_ms = Date.now() - stepStartTime;
        this.history.metadata.total_duration_ms = Date.now() - this.startTime;
      }
      this.history.updated_at = new Date().toISOString();

      // Trim history if needed (with orphaned reference cleanup)
      this.trimHistory();

      // Display formatted step
      const formattedOutput = this.formatOutput(step);
      console.error(formattedOutput);

      // Show confidence warning if low
      if (step.confidence !== undefined && step.confidence < LOW_CONFIDENCE_THRESHOLD) {
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
    this.stepIndex.clear();
    this.stepNumbers.clear();
    this.toolsUsedSet.clear();
    this.branchDepthCache.clear();
    this.stepsSinceCleanup = 0;
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
    // Derive branches array from Map (single source of truth)
    const exportableHistory: CrashHistory = {
      ...this.history,
      branches: Array.from(this.branches.values()),
    };

    switch (format) {
      case 'markdown':
        return exportableHistory.steps.map(step => this.formatter.formatStepMarkdown(step)).join('\n\n');
      case 'text':
        return exportableHistory.steps.map(step => this.formatter.formatStepConsole(step)).join('\n\n');
      default:
        return JSON.stringify(exportableHistory, null, 2);
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
