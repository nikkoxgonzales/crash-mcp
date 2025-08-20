# CRASH - Enhanced Reasoning Tool

## Overview

CRASH (Cascaded Reasoning with Adaptive Step Handling) v2.0 is an advanced MCP tool for structured, iterative reasoning. It has been significantly enhanced from its original version to provide flexible validation, confidence tracking, revision mechanisms, and branching support.

**📦 Public Availability:**
- **npm Package**: `crash-mcp` - Available for installation via `npm install crash-mcp` or direct usage with `npx crash-mcp`
- **GitHub Repository**: [https://github.com/nikkoxgonzales/crash-mcp](https://github.com/nikkoxgonzales/crash-mcp)
- **Open Source**: MIT Licensed, contributions welcome

## When to Use CRASH

The LLM should use CRASH when:
- User says "use crash" or similar phrases
- Complex multi-step reasoning is required
- Systematic problem-solving is needed
- Exploring multiple solution paths
- High uncertainty requires confidence tracking
- Previous reasoning needs correction/revision
- Tool integration with structured parameters is beneficial

## Key Features & Capabilities

### 1. Flexible Validation
- **Flexible Mode** (default): Natural language, no forced prefixes
- **Strict Mode**: Legacy compatibility with rigid validation
- **Custom Purposes**: Beyond the 10 standard types
- **Configurable**: Environment variables control behavior

### 2. Confidence & Uncertainty
- **Confidence Scale**: 0-1 numerical confidence levels
- **Uncertainty Notes**: Express doubts and concerns
- **Low Confidence Warnings**: Automatic alerts below 50%
- **Validation Support**: Track confidence in hypotheses

### 3. Revision Mechanism
- **Error Correction**: Revise any previous step
- **Revision Tracking**: Maintain history of changes
- **Reason Documentation**: Explain why revision was needed
- **Non-Destructive**: Original steps preserved for reference

### 4. Branching Support
- **Parallel Exploration**: Multiple solution paths simultaneously
- **Branch Management**: Named branches with unique IDs
- **Alternative Strategies**: Explore different approaches
- **Merge Capability**: Combine insights from branches

### 5. Enhanced Tool Integration
- **Structured Actions**: Objects with tool, action, parameters
- **Expected Outputs**: Define what to expect from tools
- **Tool Tracking**: Automatic logging of tools used
- **Parameter Passing**: Structured data for tool calls

## Usage Patterns

### Basic Reasoning
```
Purpose: analysis, action, reflection, decision, summary
Natural thought expression without forced prefixes
Clear context and outcome definition
```

### Advanced Features
```
Confidence tracking for uncertain situations
Revision of previous steps when errors found
Branching for exploring alternatives
Structured actions for tool integration
```

### Purpose Types
- **Standard**: analysis, action, reflection, decision, summary
- **Extended**: validation, exploration, hypothesis, correction, planning
- **Custom**: Any descriptive string in flexible mode

## Installation & Setup

### For LLM Use in Claude Desktop

Add to Claude Desktop configuration:

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"],
      "env": {
        "CRASH_STRICT_MODE": "false",
        "CRASH_OUTPUT_FORMAT": "console",
        "MAX_HISTORY_SIZE": "100"
      }
    }
  }
}
```

### Direct Installation

```bash
# Install globally
npm install -g crash-mcp

# Or use directly
npx crash-mcp
```

## Configuration

The tool respects these environment variables:
- `CRASH_STRICT_MODE`: Enable legacy validation (default: false)
- `CRASH_OUTPUT_FORMAT`: console|json|markdown (default: console)
- `CRASH_NO_COLOR`: Disable colored output (default: false)
- `MAX_HISTORY_SIZE`: Maximum steps to retain (default: 100)

## Best Practices for LLMs

### 1. Start Simple
Begin with basic reasoning structure, add advanced features as needed.

### 2. Use Confidence Appropriately
- Express uncertainty with confidence scores
- Use uncertainty_notes to explain doubts
- Consider revision when confidence is low

### 3. Leverage Revisions
- Correct errors immediately when discovered
- Provide clear revision reasons
- Don't hesitate to revise multiple steps

### 4. Strategic Branching
- Branch when multiple viable approaches exist
- Use descriptive branch names
- Consider branching early in complex problems

### 5. Structured Actions
- Use structured actions for complex tool calls
- Specify expected outputs for validation
- Track tool dependencies

## Example Scenarios

### Problem Solving
1. **Analysis**: Break down the problem
2. **Hypothesis**: Form potential solutions (with confidence)
3. **Exploration**: Branch to test different approaches
4. **Validation**: Verify solutions
5. **Correction**: Revise if needed
6. **Decision**: Choose best approach
7. **Action**: Implement solution

### Code Optimization
1. **Analysis**: Understand current performance
2. **Planning**: Identify optimization targets
3. **Exploration**: Branch for different optimization strategies
4. **Validation**: Test each approach (with confidence levels)
5. **Correction**: Revise based on test results
6. **Implementation**: Execute chosen optimization

### Research & Investigation
1. **Exploration**: Investigate multiple angles
2. **Hypothesis**: Form theories (with uncertainty notes)
3. **Validation**: Test hypotheses
4. **Revision**: Correct based on findings
5. **Summary**: Consolidate learnings

## Error Handling

The tool provides helpful error messages and hints:
- Missing required fields are identified
- Validation failures include suggestions
- Strict mode guidance provided
- Configuration tips for common issues

## Output Formats

### Console (Default)
Colored, formatted output with symbols and visual hierarchy

### JSON
Structured data suitable for processing or storage

### Markdown
Documentation-ready format with badges and formatting

## Backward Compatibility

CRASH v2.0 maintains full backward compatibility:
- All v1.x parameters work unchanged
- Strict mode preserves original behavior
- New fields are optional
- Environment variable controls migration

## Performance Considerations

- Minimal overhead (~1-2ms per step)
- Configurable history limits prevent memory issues
- Session management for concurrent chains
- Efficient branch tracking

This tool significantly enhances reasoning capabilities while maintaining the token efficiency and clarity of the original CRASH system.