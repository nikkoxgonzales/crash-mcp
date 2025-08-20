#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { CRASH_TOOL } from './schema.js';
import { CrashStep, CrashHistory, Branch, StructuredAction } from './types.js';
import { CrashConfig, loadConfig } from './config.js';
import { CrashFormatter } from './formatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
);
const { name, version } = pkg;

// Create MCP server instance with tools capability
const server = new Server(
  {
    name,
    version,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

class CrashServer {
  private history: CrashHistory;
  private config: CrashConfig;
  private formatter: CrashFormatter;
  private startTime: number;
  private branches: Map<string, Branch> = new Map();
  private sessions: Map<string, CrashHistory> = new Map();

  constructor(config: CrashConfig) {
    this.config = config;
    this.formatter = new CrashFormatter(config.display.colorOutput);
    this.history = this.createNewHistory();
    this.startTime = Date.now();
  }

  private createNewHistory(): CrashHistory {
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

  private validateThoughtPrefix(thought: string): boolean {
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

  private validateRationale(rationale: string): boolean {
    if (!this.config.validation.requireRationalePrefix) {
      return true; // Skip validation if not required
    }
    return rationale.startsWith('To ');
  }

  private validatePurpose(purpose: string): boolean {
    if (this.config.validation.allowCustomPurpose) {
      return true; // Any string is valid
    }
    
    const validPurposes = [
      'analysis', 'action', 'reflection', 'decision', 'summary',
      'validation', 'exploration', 'hypothesis', 'correction', 'planning'
    ];
    return validPurposes.includes(purpose.toLowerCase());
  }

  private extractToolsUsed(step: CrashStep): string[] {
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

  private handleRevision(step: CrashStep): void {
    if (step.revises_step && this.config.features.enableRevisions) {
      // Mark the original step as revised
      const originalStep = this.history.steps.find(s => s.step_number === step.revises_step);
      if (originalStep) {
        console.error(`📝 Revising step ${step.revises_step}: ${step.revision_reason || 'No reason provided'}`);
      }
      
      if (this.history.metadata) {
        this.history.metadata.revisions_count = (this.history.metadata.revisions_count || 0) + 1;
      }
    }
  }

  private handleBranching(step: CrashStep): void {
    if (step.branch_from && this.config.features.enableBranching) {
      const branchId = step.branch_id || `branch-${Date.now()}`;
      const branchName = step.branch_name || `Alternative ${this.branches.size + 1}`;
      
      if (!this.branches.has(branchId)) {
        const newBranch: Branch = {
          id: branchId,
          name: branchName,
          from_step: step.branch_from,
          steps: [],
          status: 'active',
          created_at: new Date().toISOString()
        };
        
        this.branches.set(branchId, newBranch);
        this.history.branches = this.history.branches || [];
        this.history.branches.push(newBranch);
        
        if (this.history.metadata) {
          this.history.metadata.branches_created = (this.history.metadata.branches_created || 0) + 1;
        }
        
        console.error(`🌿 Created branch "${branchName}" from step ${step.branch_from}`);
      }
      
      // Add step to branch
      const branch = this.branches.get(branchId);
      if (branch) {
        step.branch_id = branchId;
        branch.steps.push(step);
      }
    }
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
      
      // Handle session management
      if (step.session_id && this.config.features.enableSessions) {
        if (!this.sessions.has(step.session_id)) {
          this.sessions.set(step.session_id, this.createNewHistory());
        }
        this.history = this.sessions.get(step.session_id)!;
      }

      // Check if completed
      const completionPhrases = ['I have completed', 'Task completed', 'Solution found'];
      if (completionPhrases.some(phrase => step.thought.toLowerCase().includes(phrase.toLowerCase()))) {
        this.history.completed = true;
      }

      // Handle special features
      this.handleRevision(step);
      this.handleBranching(step);

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
}

// Load configuration
const config = loadConfig();

// Show configuration on startup
console.error('🚀 CRASH MCP Server Starting...');
console.error(`📋 Configuration:`);
console.error(`   - Strict Mode: ${config.validation.strictMode}`);
console.error(`   - Revisions: ${config.features.enableRevisions ? 'Enabled' : 'Disabled'}`);
console.error(`   - Branching: ${config.features.enableBranching ? 'Enabled' : 'Disabled'}`);
console.error(`   - Confidence Tracking: ${config.features.enableConfidence ? 'Enabled' : 'Disabled'}`);
console.error(`   - Output Format: ${config.display.outputFormat}`);
console.error(`   - Max History: ${config.system.maxHistorySize} steps`);

const crashServer = new CrashServer(config);

// Expose tool
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [CRASH_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'crash') {
    return crashServer.processStep(request.params.arguments);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${request.params.name}`,
      },
    ],
    isError: true,
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ CRASH MCP Server running on stdio');
  console.error('🧠 CRASH - Cascaded Reasoning with Adaptive Step Handling v2.0');
  console.error('📚 Use "crash" tool for structured reasoning');
  
  if (config.validation.strictMode) {
    console.error('⚠️ Running in STRICT MODE - legacy behavior enforced');
  } else {
    console.error('🎯 Running in FLEXIBLE MODE - enhanced features available');
  }
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});