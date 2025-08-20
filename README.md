# CRASH - Cascaded Reasoning with Adaptive Step Handling

An advanced MCP (Model Context Protocol) server that facilitates structured, iterative reasoning for complex problem-solving and analysis. CRASH v2.0 introduces flexible validation, confidence tracking, revision mechanisms, and branching support while maintaining backward compatibility.

## 🚀 Key Features

### Core Capabilities
- 🎯 **Flexible Purpose Types**: Extended set including validation, exploration, hypothesis, correction, planning, plus custom purposes
- 📝 **Natural Language Flow**: No forced prefixes or rigid formatting (configurable)
- 🔄 **Revision Mechanism**: Correct and improve previous reasoning steps
- 🌿 **Branching Support**: Explore multiple solution paths in parallel
- 📊 **Confidence Tracking**: Express uncertainty with confidence scores (0-1 scale)
- 🔧 **Structured Actions**: Enhanced tool integration with parameters and expected outputs
- 💾 **Session Management**: Multiple concurrent reasoning chains with unique IDs
- 📋 **Multiple Output Formats**: Console, JSON, and Markdown formatting

### Configuration Options
- **Strict Mode**: Legacy compatibility with original rigid validation
- **Flexible Mode**: Full access to enhanced features (default)
- **Customizable Validation**: Toggle prefix requirements independently
- **Environment Variables**: Easy configuration without code changes

## 📦 Installation

```bash
npm install crash-mcp
```

Or use directly with npx:

```bash
npx crash-mcp
```

## ⚙️ Configuration

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"],
      "env": {
        "MAX_HISTORY_SIZE": "100",
        "CRASH_STRICT_MODE": "false",
        "CRASH_OUTPUT_FORMAT": "console",
        "CRASH_NO_COLOR": "false"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `CRASH_STRICT_MODE` | Enable legacy validation rules | `false` | `true`, `false` |
| `MAX_HISTORY_SIZE` | Maximum steps to retain | `100` | Any positive integer |
| `CRASH_OUTPUT_FORMAT` | Output display format | `console` | `console`, `json`, `markdown` |
| `CRASH_NO_COLOR` | Disable colored output | `false` | `true`, `false` |

## 🛠️ Tool Usage

### Basic Parameters (Required)

- **step_number**: Sequential step number
- **estimated_total**: Current estimate of total steps (adjustable)
- **purpose**: Step purpose (see Purpose Types below)
- **context**: What is already known to avoid redundancy
- **thought**: Current reasoning (natural language)
- **outcome**: Expected/actual result
- **next_action**: Next tool or action (string or structured object)
- **rationale**: Why this action is chosen

### Enhanced Parameters (Optional)

#### Confidence & Uncertainty
- **confidence**: 0-1 scale confidence level
- **uncertainty_notes**: Describe doubts or concerns

#### Revision Support
- **revises_step**: Step number to revise
- **revision_reason**: Why revision is needed

#### Branching
- **branch_from**: Step to branch from
- **branch_id**: Unique branch identifier
- **branch_name**: Descriptive branch name

#### Tool Integration
- **tools_used**: Array of tools used
- **external_context**: External data/outputs
- **dependencies**: Step numbers this depends on

#### Session Management
- **session_id**: Group related reasoning chains

## 📝 Purpose Types

### Standard Purposes
- `analysis` - Analyzing information
- `action` - Taking an action
- `reflection` - Reflecting on progress
- `decision` - Making a decision
- `summary` - Summarizing findings
- `validation` - Validating results
- `exploration` - Exploring options
- `hypothesis` - Forming hypotheses
- `correction` - Correcting errors
- `planning` - Planning approach

### Custom Purposes
When not in strict mode, any string can be used as a purpose.

## 💡 Examples

### Basic Usage

```json
{
  "step_number": 1,
  "estimated_total": 3,
  "purpose": "analysis",
  "context": "User requested optimization of database queries",
  "thought": "I need to first understand the current query patterns",
  "outcome": "Identified slow queries for optimization",
  "next_action": "analyze query execution plans",
  "rationale": "Understanding execution plans will reveal bottlenecks"
}
```

### With Confidence Tracking

```json
{
  "step_number": 2,
  "estimated_total": 5,
  "purpose": "hypothesis",
  "context": "Slow queries identified, need optimization strategy",
  "thought": "The main issue appears to be missing indexes",
  "outcome": "Hypothesis about missing indexes formed",
  "next_action": "validate hypothesis with EXPLAIN",
  "rationale": "Need to confirm before making changes",
  "confidence": 0.7,
  "uncertainty_notes": "Could also be due to table statistics"
}
```

### Revision Example

```json
{
  "step_number": 4,
  "estimated_total": 5,
  "purpose": "correction",
  "context": "Previous analysis was incomplete",
  "thought": "I missed an important join condition",
  "outcome": "Corrected analysis with complete information",
  "next_action": "re-evaluate optimization strategy",
  "rationale": "New information changes the approach",
  "revises_step": 2,
  "revision_reason": "Overlooked critical join in initial analysis"
}
```

### Branching Example

```json
{
  "step_number": 3,
  "estimated_total": 6,
  "purpose": "exploration",
  "context": "Two possible optimization approaches identified",
  "thought": "Let me explore the indexing approach first",
  "outcome": "Branch created for index optimization",
  "next_action": "test index performance",
  "rationale": "This approach has lower risk",
  "branch_from": 2,
  "branch_id": "index-optimization",
  "branch_name": "Index-based optimization"
}
```

### Structured Action Example

```json
{
  "step_number": 5,
  "estimated_total": 7,
  "purpose": "action",
  "context": "Ready to implement optimization",
  "thought": "Implementing the index creation",
  "outcome": "Index created successfully",
  "next_action": {
    "tool": "sql_executor",
    "action": "CREATE INDEX",
    "parameters": {
      "table": "users",
      "columns": ["email", "created_at"]
    },
    "expectedOutput": "Index created on users table"
  },
  "rationale": "This index will optimize the most common query pattern",
  "tools_used": ["sql_executor"],
  "confidence": 0.9
}
```

## 🔄 Backward Compatibility

### Strict Mode
Enable strict mode for legacy behavior:

```bash
export CRASH_STRICT_MODE=true
```

In strict mode:
- Thoughts must start with required prefixes
- Rationale must start with "To "
- Only predefined purpose types allowed
- Original validation rules enforced

### Migration Guide

1. **From v1.x to v2.0**: No changes required - fully backward compatible
2. **To use new features**: Set `CRASH_STRICT_MODE=false` (default)
3. **Gradual adoption**: Enable features individually through configuration

## 🏗️ Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Start built server
npm start
```

## 🎯 Use Cases

### When to Use CRASH

1. **Complex Problem Solving**: Multi-step tasks requiring systematic approach
2. **Code Analysis & Optimization**: Understanding and improving codebases
3. **System Design**: Planning architecture with multiple considerations
4. **Debugging**: Systematic error investigation with hypothesis testing
5. **Research & Exploration**: Investigating multiple solution paths
6. **Decision Making**: Evaluating options with confidence tracking

### When NOT to Use CRASH

1. **Simple, single-step tasks**: Direct action is more efficient
2. **Pure information retrieval**: No reasoning required
3. **Time-critical operations**: Overhead of structured reasoning
4. **Deterministic procedures**: No uncertainty or exploration needed

## 🔍 Comparison with Sequential Thinking

| Feature | CRASH v2.0 | Sequential Thinking |
|---------|------------|-------------------|
| Structure | Flexible, configurable | May be more rigid |
| Validation | Optional prefixes | Depends on implementation |
| Revisions | Built-in support | Varies |
| Branching | Native branching | Varies |
| Confidence | Explicit tracking | May not have |
| Tool Integration | Structured actions | Varies |
| Token Efficiency | Optimized, no code in thoughts | Depends on usage |
| Output Formats | Multiple (console, JSON, MD) | Varies |

## 📊 Performance

- **Memory**: Configurable history size prevents unbounded growth
- **Processing**: Minimal overhead (~1-2ms per step)
- **Token Usage**: Optimized prompts, no code generation in thoughts
- **Scalability**: Session management for concurrent chains

## 🎯 Credits & Inspiration

CRASH is an adaptation and enhancement of the sequential thinking tools from the Model Context Protocol ecosystem:

- **Primary Source**: [MCP Sequential Thinking Server](https://github.com/modelcontextprotocol/servers/blob/main/src/sequentialthinking) - Official MCP implementation
- **Secondary Inspiration**: [MCP Sequential Thinking Tools](https://github.com/spences10/mcp-sequentialthinking-tools) - Community adaptation

CRASH builds upon these foundations by adding flexible validation, confidence tracking, revision mechanisms, branching support, and enhanced tool integration while maintaining the core structured reasoning approach.

## 👨‍💻 Author

**Nikko Gonzales**
- Email: nikkoxgonzales@gmail.com
- GitHub: [nikkoxgonzales](https://github.com/nikkoxgonzales)

## 🤝 Contributing

Contributions welcome! Areas for enhancement:

1. **Visualization**: Graph/tree view for branches
2. **Persistence**: Save/load reasoning sessions
3. **Analytics**: Pattern recognition in reasoning
4. **Integration**: More MCP tool integrations
5. **Templates**: Pre-built reasoning templates

## 📄 License

MIT

## 🔗 Links

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Original Sequential Thinking Server](https://github.com/modelcontextprotocol/servers/blob/main/src/sequentialthinking)
- [Community Sequential Thinking Tools](https://github.com/spences10/mcp-sequentialthinking-tools)

## 📈 Version History

### v2.0.0 (Current)
- Flexible validation system
- Confidence tracking
- Revision mechanism
- Branching support
- Structured actions
- Multiple output formats
- Session management
- Backward compatibility

### v1.0.0
- Initial release
- Basic structured reasoning
- Required prefixes
- Five purpose types
- Console output only