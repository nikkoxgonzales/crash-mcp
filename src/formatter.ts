import chalk from 'chalk';
import { CrashStep, CrashHistory, Branch, StructuredAction } from './types.js';
import { PURPOSE_COLORS, DEFAULT_PURPOSE_COLOR } from './constants.js';

export class CrashFormatter {
  private colorEnabled: boolean;

  constructor(colorEnabled: boolean = true) {
    this.colorEnabled = colorEnabled;
  }

  private color(text: string, colorFn: typeof chalk.blue): string {
    return this.colorEnabled ? colorFn(text) : text;
  }

  private getPurposeColor(purpose: string): typeof chalk.blue {
    // Use static PURPOSE_COLORS from constants (avoids recreating object on every call)
    return PURPOSE_COLORS[purpose.toLowerCase()] || DEFAULT_PURPOSE_COLOR;
  }

  private formatConfidence(confidence?: number): string {
    if (confidence === undefined) return '';
    
    const percentage = Math.round(confidence * 100);
    let symbol = '●';
    let color = chalk.green;
    
    if (confidence < 0.3) {
      color = chalk.red;
      symbol = '○';
    } else if (confidence < 0.7) {
      color = chalk.yellow;
      symbol = '◐';
    }
    
    return this.colorEnabled ? color(` ${symbol} ${percentage}%`) : ` [${percentage}%]`;
  }

  private formatStructuredAction(action: string | StructuredAction): string {
    if (typeof action === 'string') {
      return action;
    }
    
    let result = action.action;
    if (action.tool) {
      result = `[${action.tool}] ${result}`;
    }
    if (action.parameters && Object.keys(action.parameters).length > 0) {
      result += ` (${JSON.stringify(action.parameters)})`;
    }
    return result;
  }

  formatStepConsole(step: CrashStep): string {
    const color = this.getPurposeColor(step.purpose);
    const purposeText = step.purpose.toUpperCase();
    
    // Build header with step info
    let header = this.color(`[Step ${step.step_number}/${step.estimated_total}] ${purposeText}`, color);
    header += this.formatConfidence(step.confidence);
    
    // Add revision/branch indicators
    if (step.revises_step) {
      header += this.color(` ↻ Revises #${step.revises_step}`, chalk.yellow);
    }
    if (step.branch_from) {
      header += this.color(` ⟿ Branch from #${step.branch_from}`, chalk.magenta);
      if (step.branch_name) {
        header += this.color(` (${step.branch_name})`, chalk.gray);
      }
    }
    
    // Format main content
    const lines: string[] = [header];
    
    if (step.context) {
      lines.push(this.color('Context:', chalk.gray) + ' ' + step.context);
    }
    
    lines.push(this.color('Thought:', chalk.white) + ' ' + step.thought);
    
    if (step.uncertainty_notes) {
      lines.push(this.color('Uncertainty:', chalk.yellow) + ' ' + step.uncertainty_notes);
    }
    
    if (step.revision_reason) {
      lines.push(this.color('Revision Reason:', chalk.yellow) + ' ' + step.revision_reason);
    }
    
    lines.push(this.color('Outcome:', chalk.gray) + ' ' + step.outcome);
    
    const nextAction = this.formatStructuredAction(step.next_action);
    lines.push(this.color('Next:', chalk.gray) + ' ' + nextAction + ' - ' + step.rationale);
    
    if (step.tools_used && step.tools_used.length > 0) {
      lines.push(this.color('Tools Used:', chalk.gray) + ' ' + step.tools_used.join(', '));
    }
    
    if (step.dependencies && step.dependencies.length > 0) {
      lines.push(this.color('Depends On:', chalk.gray) + ' Steps ' + step.dependencies.join(', '));
    }
    
    lines.push(this.color('─'.repeat(60), chalk.gray));
    
    return lines.join('\n');
  }

  formatStepMarkdown(step: CrashStep): string {
    const lines: string[] = [];
    
    // Header
    lines.push(`### Step ${step.step_number}/${step.estimated_total}: ${step.purpose.toUpperCase()}`);
    
    // Metadata badges
    const badges: string[] = [];
    if (step.confidence !== undefined) {
      badges.push(`![Confidence](https://img.shields.io/badge/confidence-${Math.round(step.confidence * 100)}%25-blue)`);
    }
    if (step.revises_step) {
      badges.push(`![Revises](https://img.shields.io/badge/revises-step%20${step.revises_step}-yellow)`);
    }
    if (step.branch_from) {
      badges.push(`![Branch](https://img.shields.io/badge/branch-from%20${step.branch_from}-purple)`);
    }
    if (badges.length > 0) {
      lines.push(badges.join(' '));
    }
    
    // Content
    lines.push('');
    lines.push(`**Context:** ${step.context}`);
    lines.push('');
    lines.push(`**Thought:** ${step.thought}`);
    
    if (step.uncertainty_notes) {
      lines.push('');
      lines.push(`> ⚠️ **Uncertainty:** ${step.uncertainty_notes}`);
    }
    
    if (step.revision_reason) {
      lines.push('');
      lines.push(`> 🔄 **Revision Reason:** ${step.revision_reason}`);
    }
    
    lines.push('');
    lines.push(`**Outcome:** ${step.outcome}`);
    lines.push('');
    
    const nextAction = this.formatStructuredAction(step.next_action);
    lines.push(`**Next Action:** ${nextAction}`);
    lines.push(`- *Rationale:* ${step.rationale}`);
    
    if (step.tools_used && step.tools_used.length > 0) {
      lines.push('');
      lines.push(`**Tools Used:** ${step.tools_used.join(', ')}`);
    }
    
    lines.push('');
    lines.push('---');
    
    return lines.join('\n');
  }

  formatStepJSON(step: CrashStep): string {
    return JSON.stringify(step, null, 2);
  }

  formatHistorySummary(history: CrashHistory): string {
    const lines: string[] = [];
    
    lines.push(this.color('=== CRASH Session Summary ===', chalk.bold));
    lines.push(`Total Steps: ${history.steps.length}`);
    lines.push(`Status: ${history.completed ? '✓ Completed' : '⟳ In Progress'}`);
    
    if (history.metadata) {
      const meta = history.metadata;
      if (meta.revisions_count) {
        lines.push(`Revisions: ${meta.revisions_count}`);
      }
      if (meta.branches_created) {
        lines.push(`Branches Created: ${meta.branches_created}`);
      }
      if (meta.total_duration_ms) {
        lines.push(`Duration: ${(meta.total_duration_ms / 1000).toFixed(2)}s`);
      }
      if (meta.tools_used && meta.tools_used.length > 0) {
        lines.push(`Tools Used: ${meta.tools_used.join(', ')}`);
      }
    }
    
    // Show confidence distribution
    const confidenceSteps = history.steps.filter(s => s.confidence !== undefined);
    if (confidenceSteps.length > 0) {
      const avgConfidence = confidenceSteps.reduce((sum, s) => sum + (s.confidence || 0), 0) / confidenceSteps.length;
      lines.push(`Average Confidence: ${Math.round(avgConfidence * 100)}%`);
    }
    
    // Show branches if any
    if (history.branches && history.branches.length > 0) {
      lines.push('');
      lines.push('Branches:');
      history.branches.forEach(branch => {
        const status = branch.status === 'active' ? '●' : branch.status === 'merged' ? '✓' : '✗';
        lines.push(`  ${status} ${branch.name} (${branch.steps.length} steps)`);
      });
    }
    
    lines.push(this.color('='.repeat(30), chalk.gray));
    
    return lines.join('\n');
  }

  formatBranchTree(history: CrashHistory): string {
    const lines: string[] = [];
    lines.push('Branch Structure:');

    // Pre-index branches by from_step for O(1) lookup (optimization)
    const branchesByStep = new Map<number, Branch[]>();
    if (history.branches) {
      for (const branch of history.branches) {
        const existing = branchesByStep.get(branch.from_step) || [];
        existing.push(branch);
        branchesByStep.set(branch.from_step, existing);
      }
    }

    // Create a visual tree of branches
    const mainSteps = history.steps.filter(s => !s.branch_id);
    lines.push('Main:');
    mainSteps.forEach(step => {
      lines.push(`  └─ Step ${step.step_number}: ${step.purpose}`);

      // Use pre-indexed lookup instead of filtering all branches
      const branchesFromStep = branchesByStep.get(step.step_number) || [];
      branchesFromStep.forEach(branch => {
        lines.push(`     └─ Branch: ${branch.name}`);
        branch.steps.forEach(bStep => {
          lines.push(`        └─ Step ${bStep.step_number}: ${bStep.purpose}`);
        });
      });
    });

    return lines.join('\n');
  }
}