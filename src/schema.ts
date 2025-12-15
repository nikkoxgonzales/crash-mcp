import { Tool } from '@modelcontextprotocol/sdk/types.js';

const TOOL_DESCRIPTION = `Record a structured reasoning step for complex problem-solving.

Use this tool to break down multi-step problems into trackable reasoning steps. Each step captures your current thinking, expected outcome, and planned next action.

WHEN TO USE:
- Multi-step analysis, debugging, or planning tasks
- Tasks requiring systematic exploration of options
- Problems where you need to track confidence or revise earlier thinking
- Exploring multiple solution paths via branching

WORKFLOW:
1. Start with step_number=1, estimate your total steps
2. Describe your thought process, expected outcome, and next action
3. Continue calling for each reasoning step, adjusting estimated_total as needed
4. Use confidence (0-1) when uncertain about conclusions
5. Use revises_step to correct earlier reasoning when you find errors
6. Use branch_from to explore alternative approaches
7. Set is_final_step=true when reasoning is complete

Returns JSON summary with step count, completion status, and next action.`;

export const CRASH_TOOL: Tool = {
  name: 'crash',
  description: TOOL_DESCRIPTION,
  inputSchema: {
    type: 'object',
    properties: {
      // Core required fields
      step_number: {
        type: 'integer',
        description: 'Sequential step number starting from 1. Increment for each new reasoning step.',
        minimum: 1
      },
      estimated_total: {
        type: 'integer',
        description: 'Current estimate of total steps needed. Adjust as you learn more about the problem.',
        minimum: 1
      },
      purpose: {
        type: 'string',
        description: 'Category of this reasoning step. Standard values: analysis (examining information), action (taking an action), reflection (reviewing progress), decision (making a choice), summary (consolidating findings), validation (checking results), exploration (investigating options), hypothesis (forming theories), correction (fixing errors), planning (outlining approach). Custom strings allowed in flexible mode.'
      },
      context: {
        type: 'string',
        description: 'What is already known or has been completed. Include relevant findings from previous steps to avoid redundant work.'
      },
      thought: {
        type: 'string',
        description: 'Your current reasoning process. Express naturally - describe what you are thinking and why.'
      },
      outcome: {
        type: 'string',
        description: 'The expected or actual result from this step. What did you learn or accomplish?'
      },
      next_action: {
        oneOf: [
          {
            type: 'string',
            description: 'Simple description of your next action'
          },
          {
            type: 'object',
            description: 'Structured action with tool details',
            properties: {
              tool: { type: 'string', description: 'Name of tool to use' },
              action: { type: 'string', description: 'Specific action to perform' },
              parameters: { type: 'object', description: 'Parameters to pass to the tool' },
              expectedOutput: { type: 'string', description: 'What you expect this action to return' }
            },
            required: ['action']
          }
        ],
        description: 'What you will do next. Can be a simple string or structured object with tool details.'
      },
      rationale: {
        type: 'string',
        description: 'Why you chose this next action. Explain your reasoning for the approach.'
      },

      // Completion
      is_final_step: {
        type: 'boolean',
        description: 'Set to true to explicitly mark this as the final reasoning step. The reasoning chain will be marked complete.'
      },

      // Confidence tracking
      confidence: {
        type: 'number',
        description: 'Your confidence in this step (0-1 scale). Use lower values when uncertain: 0.3 = low confidence, 0.5 = moderate, 0.8+ = high confidence.',
        minimum: 0,
        maximum: 1
      },
      uncertainty_notes: {
        type: 'string',
        description: 'Describe specific uncertainties or doubts. What assumptions are you making? What could be wrong?'
      },

      // Revision support
      revises_step: {
        type: 'integer',
        description: 'Step number you are revising or correcting. The original step will be marked as revised.',
        minimum: 1
      },
      revision_reason: {
        type: 'string',
        description: 'Why you are revising the earlier step. What was wrong or incomplete?'
      },

      // Branching support
      branch_from: {
        type: 'integer',
        description: 'Step number to branch from for exploring an alternative approach. Creates a new solution path.',
        minimum: 1
      },
      branch_id: {
        type: 'string',
        description: 'Unique identifier for this branch. Auto-generated if not provided.'
      },
      branch_name: {
        type: 'string',
        description: 'Human-readable name for this branch (e.g., "Alternative A: Use caching")'
      },

      // Tool integration
      tools_used: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of tools you used during this step for tracking purposes.'
      },
      external_context: {
        type: 'object',
        description: 'External data or tool outputs relevant to this step. Store important results here.'
      },
      dependencies: {
        type: 'array',
        items: { type: 'integer' },
        description: 'Step numbers this step depends on. Validated against existing steps in history.'
      },

      // Session support
      session_id: {
        type: 'string',
        description: 'Session identifier for grouping related reasoning chains. Sessions expire after configured timeout.'
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
