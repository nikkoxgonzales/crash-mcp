import { Tool } from '@modelcontextprotocol/sdk/types.js';

const TOOL_DESCRIPTION = `Facilitates structured, iterative reasoning for complex problem-solving and analysis. Use this to organize thoughts, break down tasks, and plan actions step-by-step. This tool is ideal for scenarios requiring careful consideration of multiple factors, such as code optimization, system design, or strategic planning.

When to use CRASH:
- When user says "use crash" or similar phrases
- For multi-step or complex tasks requiring careful breakdown
- For understanding, planning, or analyzing codes or content
- When systematic reasoning is needed
- When you need to revise or correct previous reasoning
- When exploring multiple solution paths

Key Features:
- Flexible purpose types (analysis, action, validation, exploration, hypothesis, etc.)
- Confidence tracking for uncertain situations
- Revision mechanism to correct previous steps
- Branching support for parallel exploration
- Structured tool integration
- No rigid formatting requirements (configurable)

Instructions:
- Each step must specify a clear purpose and reasoning approach
- Track context to avoid redundancy
- Use confidence scores when uncertain (0-1 scale)
- Revise previous steps when needed using revises_step
- Branch to explore alternatives using branch_from
- Continue until task completion or solution found`;

export const CRASH_TOOL: Tool = {
  name: 'crash',
  description: TOOL_DESCRIPTION,
  inputSchema: {
    type: 'object',
    properties: {
      // Core required fields
      step_number: {
        type: 'integer',
        description: 'Sequential step number',
        minimum: 1
      },
      estimated_total: {
        type: 'integer',
        description: 'Current estimate of total steps needed (can be adjusted)',
        minimum: 1
      },
      purpose: {
        type: 'string',
        description: 'What this step accomplishes (analysis, action, validation, exploration, hypothesis, correction, planning, or custom)',
      },
      context: {
        type: 'string',
        description: 'What is already known or has been completed to avoid redundancy'
      },
      thought: {
        type: 'string',
        description: 'Current reasoning. Express naturally without forced prefixes.'
      },
      outcome: {
        type: 'string',
        description: 'Expected or actual result from this step'
      },
      next_action: {
        oneOf: [
          {
            type: 'string',
            description: 'Simple next action description'
          },
          {
            type: 'object',
            description: 'Structured action with tool integration',
            properties: {
              tool: { type: 'string', description: 'Tool name if applicable' },
              action: { type: 'string', description: 'Action to perform' },
              parameters: { type: 'object', description: 'Parameters for the action' },
              expectedOutput: { type: 'string', description: 'What we expect from this action' }
            },
            required: ['action']
          }
        ],
        description: 'Next tool or action to use (string or structured object)'
      },
      rationale: {
        type: 'string',
        description: 'Why using this next action (natural language, no prefix required)'
      },
      
      // Optional enhancement fields
      confidence: {
        type: 'number',
        description: 'Confidence level in this step (0-1 scale)',
        minimum: 0,
        maximum: 1
      },
      uncertainty_notes: {
        type: 'string',
        description: 'Notes about uncertainties or doubts'
      },
      
      // Revision support
      revises_step: {
        type: 'integer',
        description: 'Step number being revised/corrected',
        minimum: 1
      },
      revision_reason: {
        type: 'string',
        description: 'Why this revision is needed'
      },
      
      // Branching support
      branch_from: {
        type: 'integer',
        description: 'Step number to branch from for alternative exploration',
        minimum: 1
      },
      branch_id: {
        type: 'string',
        description: 'Unique identifier for this branch'
      },
      branch_name: {
        type: 'string',
        description: 'Descriptive name for this branch'
      },
      
      // Tool integration
      tools_used: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tools used in this step'
      },
      external_context: {
        type: 'object',
        description: 'External data or tool outputs relevant to this step'
      },
      dependencies: {
        type: 'array',
        items: { type: 'integer' },
        description: 'Step numbers this step depends on'
      },
      
      // Session support
      session_id: {
        type: 'string',
        description: 'Session identifier for grouping related reasoning chains'
      }
    },
    required: [
      'step_number',
      'estimated_total',
      'purpose',
      'context',
      'thought',
      'outcome',
      'next_action',
      'rationale'
    ]
  }
};