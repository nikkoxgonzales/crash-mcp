# CRASH - Cascaded Reasoning with Adaptive Step Handling

Heavily inspired by [MCP Sequential Thinking Server](https://github.com/modelcontextprotocol/servers/blob/main/src/sequentialthinking).
An advanced MCP (Model Context Protocol) server that facilitates structured, iterative reasoning for complex problem-solving and analysis. CRASH v2.0 introduces flexible validation, confidence tracking, revision mechanisms, and branching support while maintaining backward compatibility.

## Claude Code's Experience
```
## Question
> /ask is running… does crash mcp helped you or you could have done better with your internal planning mechanisms?

● CRASH MCP helped significantly for this specific task. Here's my honest assessment:

Where CRASH helped:
- Systematic analysis: It forced me to break down the GitHub issue methodically, understanding the exact problem before jumping to solutions
- Solution exploration: I explored multiple approaches (preprocessing, decorators, direct modification) before settling on the best one
- Planning validation: Each step built on the previous one logically, ensuring I didn't miss critical aspects

Where my internal planning would have been sufficient:
- Implementation execution: Once I had the plan, the actual coding was straightforward - I could have done that without CRASH
- Code pattern recognition: I could have immediately recognized this as a parameter serialization issue

The key difference:
CRASH forced me to be more thorough in the analysis phase. Without it, I might have rushed to implement the first solution that came to mind (like using Union[str, dict] parameters) rather than exploring the cleaner parse_tool_input() helper approach.

Verdict: CRASH added value here because this was a complex problem requiring systematic analysis of multiple solution paths. For simpler coding tasks, my internal planning would be sufficient and faster.
```

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

### Requirements

- Node.js >= v18.0.0
- Cursor, Claude Code, VSCode, Windsurf or another MCP Client

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

Pasting the following configuration into your Cursor `~/.cursor/mcp.json` file is the recommended approach. You may also install in a specific project by creating `.cursor/mcp.json` in your project folder. See [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) for more info.

#### Cursor Local Server Connection

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

#### Cursor with Environment Variables

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

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command. See [Claude Code MCP docs](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/tutorials#set-up-model-context-protocol-mcp) for more info.

#### Claude Code Local Server Connection

```sh
claude mcp add crash -- npx -y crash-mcp
```

or if you are using powershell:
```sh
claude mcp add crash '--' npx -y crash-mcp
```

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add this to your Windsurf MCP config file. See [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp) for more info.

#### Windsurf Local Server Connection

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"],
      "env": {
        "MAX_HISTORY_SIZE": "100",
        "CRASH_STRICT_MODE": "false",
        "CRASH_OUTPUT_FORMAT": "console"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in VS Code</b></summary>

Add this to your VS Code MCP config file. See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

#### VS Code Local Server Connection

```json
"mcp": {
  "servers": {
    "crash": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

</details>

<details>
<summary>
<b>Install in Cline</b>
</summary>

Add this to your Cline MCP configuration:

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"],
      "env": {
        "CRASH_STRICT_MODE": "false",
        "MAX_HISTORY_SIZE": "100"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zed</b></summary>

Add this to your Zed `settings.json`. See [Zed Context Server docs](https://zed.dev/docs/assistant/context-servers) for more info.

```json
{
  "context_servers": {
    "CRASH": {
      "command": {
        "path": "npx",
        "args": ["-y", "crash-mcp"]
      },
      "settings": {
        "env": {
          "CRASH_STRICT_MODE": "false",
          "MAX_HISTORY_SIZE": "100"
        }
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Augment Code</b></summary>

To configure CRASH MCP in Augment Code, you can use either the graphical interface or manual configuration.

### **A. Using the Augment Code UI**

1. Click the hamburger menu.
2. Select **Settings**.
3. Navigate to the **Tools** section.
4. Click the **+ Add MCP** button.
5. Enter the following command:

   ```
   npx -y crash-mcp
   ```

6. Name the MCP: **CRASH**.
7. Click the **Add** button.

### **B. Manual Configuration**

1. Press Cmd/Ctrl Shift P or go to the hamburger menu in the Augment panel
2. Select Edit Settings
3. Under Advanced, click Edit in settings.json
4. Add the server configuration to the `mcpServers` array in the `augment.advanced` object

```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "crash",
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  ]
}
```

</details>

<details>
<summary><b>Install in Roo Code</b></summary>

Add this to your Roo Code MCP configuration file. See [Roo Code MCP docs](https://docs.roocode.com/features/mcp/using-mcp-in-roo) for more info.

#### Roo Code Local Server Connection

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Gemini CLI</b></summary>

See [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html) for details.

1. Open the Gemini CLI settings file. The location is `~/.gemini/settings.json` (where `~` is your home directory).
2. Add the following to the `mcpServers` object in your `settings.json` file:

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

If the `mcpServers` object does not exist, create it.

</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

#### Local Server Connection

Open Claude Desktop developer settings and edit your `claude_desktop_config.json` file to add the following configuration. See [Claude Desktop MCP docs](https://modelcontextprotocol.io/quickstart/user) for more info.

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

</details>

<details>
<summary><b>Install in Opencode</b></summary>

Add this to your Opencode configuration file. See [Opencode MCP docs](https://opencode.ai/docs/mcp-servers) docs for more info.

#### Opencode Local Server Connection

```json
{
  "mcp": {
    "crash": {
      "type": "local",
      "command": ["npx", "-y", "crash-mcp"],
      "enabled": true
    }
  }
}
```

</details>

<details>
<summary><b>Install in OpenAI Codex</b></summary>

See [OpenAI Codex](https://github.com/openai/codex) for more information.

Add the following configuration to your OpenAI Codex MCP server settings:

```toml
[mcp_servers.crash]
args = ["-y", "crash-mcp"]
command = "npx"
```

</details>

<details>
<summary><b>Install in JetBrains AI Assistant</b></summary>

See [JetBrains AI Assistant Documentation](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html) for more details.

1. In JetBrains IDEs go to `Settings` -> `Tools` -> `AI Assistant` -> `Model Context Protocol (MCP)`
2. Click `+ Add`.
3. Click on `Command` in the top-left corner of the dialog and select the As JSON option from the list
4. Add this configuration and click `OK`

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

5. Click `Apply` to save changes.
6. The same way CRASH could be added for JetBrains Junie in `Settings` -> `Tools` -> `Junie` -> `MCP Settings`

</details>

<details>
<summary><b>Install in Kiro</b></summary>

See [Kiro Model Context Protocol Documentation](https://kiro.dev/docs/mcp/configuration/) for details.

1. Navigate `Kiro` > `MCP Servers`
2. Add a new MCP server by clicking the `+ Add` button.
3. Paste the configuration given below:

```json
{
  "mcpServers": {
    "CRASH": {
      "command": "npx",
      "args": ["-y", "crash-mcp"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

4. Click `Save` to apply the changes.

</details>

<details>
<summary><b>Install in Trae</b></summary>

Use the Add manually feature and fill in the JSON configuration information for that MCP server.
For more details, visit the [Trae documentation](https://docs.trae.ai/ide/model-context-protocol?_lang=en).

#### Trae Local Server Connection

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Using Bun or Deno</b></summary>

Use these alternatives to run the local CRASH MCP server with other runtimes. These examples work for any client that supports launching a local MCP server via command + args.

#### Bun

```json
{
  "mcpServers": {
    "crash": {
      "command": "bunx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

#### Deno

```json
{
  "mcpServers": {
    "crash": {
      "command": "deno",
      "args": [
        "run",
        "--allow-env=NO_DEPRECATION,TRACE_DEPRECATION,MAX_HISTORY_SIZE,CRASH_STRICT_MODE,CRASH_OUTPUT_FORMAT,CRASH_NO_COLOR",
        "--allow-net",
        "npm:crash-mcp"
      ]
    }
  }
}
```

</details>

<details>
<summary><b>Using Docker</b></summary>

If you prefer to run the MCP server in a Docker container:

1. **Build the Docker Image:**

   First, create a `Dockerfile` in the project root (or anywhere you prefer):

   <details>
   <summary>Click to see Dockerfile content</summary>

   ```Dockerfile
   FROM node:18-alpine

   WORKDIR /app

   # Install the latest version globally
   RUN npm install -g crash-mcp

   # Set environment variables
   ENV MAX_HISTORY_SIZE=100
   ENV CRASH_STRICT_MODE=false
   ENV CRASH_OUTPUT_FORMAT=console
   ENV CRASH_NO_COLOR=false

   # Default command to run the server
   CMD ["crash-mcp"]
   ```

   </details>

   Then, build the image using a tag (e.g., `crash-mcp`). **Make sure Docker Desktop (or the Docker daemon) is running.** Run the following command in the same directory where you saved the `Dockerfile`:

   ```bash
   docker build -t crash-mcp .
   ```

2. **Configure Your MCP Client:**

   Update your MCP client's configuration to use the Docker command.

   _Example for a cline_mcp_settings.json:_

   ```json
   {
     "mcpServers": {
       "CRASH": {
         "autoApprove": [],
         "disabled": false,
         "timeout": 60,
         "command": "docker",
         "args": ["run", "-i", "--rm", "crash-mcp"],
         "transportType": "stdio"
       }
     }
   }
   ```

</details>

<details>
<summary><b>Install in Windows</b></summary>

The configuration on Windows is slightly different compared to Linux or macOS (_`Cline` is used in the example_). The same principle applies to other editors; refer to the configuration of `command` and `args`.

```json
{
  "mcpServers": {
    "crash": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "crash-mcp"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

</details>

<details>
<summary><b>Install in Amazon Q Developer CLI</b></summary>

Add this to your Amazon Q Developer CLI configuration file. See [Amazon Q Developer CLI docs](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-mcp-configuration.html) for more details.

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Warp</b></summary>

See [Warp Model Context Protocol Documentation](https://docs.warp.dev/knowledge-and-collaboration/mcp#adding-an-mcp-server) for details.

1. Navigate `Settings` > `AI` > `Manage MCP servers`.
2. Add a new MCP server by clicking the `+ Add` button.
3. Paste the configuration given below:

```json
{
  "CRASH": {
    "command": "npx",
    "args": ["-y", "crash-mcp"],
    "env": {
      "CRASH_STRICT_MODE": "false",
      "MAX_HISTORY_SIZE": "100"
    },
    "working_directory": null,
    "start_on_launch": true
  }
}
```

4. Click `Save` to apply the changes.

</details>

<details>
<summary><b>Install in LM Studio</b></summary>

See [LM Studio MCP Support](https://lmstudio.ai/blog/lmstudio-v0.3.17) for more information.

#### Manual set-up:

1. Navigate to `Program` (right side) > `Install` > `Edit mcp.json`.
2. Paste the configuration given below:

```json
{
  "mcpServers": {
    "CRASH": {
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

3. Click `Save` to apply the changes.
4. Toggle the MCP server on/off from the right hand side, under `Program`, or by clicking the plug icon at the bottom of the chat box.

</details>

<details>
<summary><b>Install in Visual Studio 2022</b></summary>

You can configure CRASH MCP in Visual Studio 2022 by following the [Visual Studio MCP Servers documentation](https://learn.microsoft.com/visualstudio/ide/mcp-servers?view=vs-2022).

Add this to your Visual Studio MCP config file (see the [Visual Studio docs](https://learn.microsoft.com/visualstudio/ide/mcp-servers?view=vs-2022) for details):

```json
{
  "mcp": {
    "servers": {
      "crash": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "crash-mcp"]
      }
    }
  }
}
```

For more information and troubleshooting, refer to the [Visual Studio MCP Servers documentation](https://learn.microsoft.com/visualstudio/ide/mcp-servers?view=vs-2022).

</details>

<details>
<summary><b>Install in Crush</b></summary>

Add this to your Crush configuration file. See [Crush MCP docs](https://github.com/charmbracelet/crush#mcps) for more info.

#### Crush Local Server Connection

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "crash": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in BoltAI</b></summary>

Open the "Settings" page of the app, navigate to "Plugins," and enter the following JSON:

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

Once saved, you can use the `crash` tool for structured reasoning in your chats. More information is available on [BoltAI's Documentation site](https://docs.boltai.com/docs/plugins/mcp-servers). For BoltAI on iOS, [see this guide](https://docs.boltai.com/docs/boltai-mobile/mcp-servers).

</details>

<details>
<summary><b>Install in Rovo Dev CLI</b></summary>

Edit your Rovo Dev CLI MCP config by running the command below -

```bash
acli rovodev mcp
```

Example config -

#### Local Server Connection

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zencoder</b></summary>

To configure CRASH MCP in Zencoder, follow these steps:

1. Go to the Zencoder menu (...)
2. From the dropdown menu, select Agent tools
3. Click on the Add custom MCP
4. Add the name and server configuration from below, and make sure to hit the Install button

```json
{
  "command": "npx",
  "args": ["-y", "crash-mcp"]
}
```

Once the MCP server is added, you can easily continue using it.

</details>

<details>
<summary><b>Install in Qodo Gen</b></summary>

See [Qodo Gen docs](https://docs.qodo.ai/qodo-documentation/qodo-gen/qodo-gen-chat/agentic-mode/agentic-tools-mcps) for more details.

1. Open Qodo Gen chat panel in VSCode or IntelliJ.
2. Click Connect more tools.
3. Click + Add new MCP.
4. Add the following configuration:

#### Qodo Gen Local Server Connection

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Perplexity Desktop</b></summary>

See [Local and Remote MCPs for Perplexity](https://www.perplexity.ai/help-center/en/articles/11502712-local-and-remote-mcps-for-perplexity) for more information.

1. Navigate `Perplexity` > `Settings`
2. Select `Connectors`.
3. Click `Add Connector`.
4. Select `Advanced`.
5. Enter Server Name: `CRASH`
6. Paste the following JSON in the text area:

```json
{
  "args": ["-y", "crash-mcp"],
  "command": "npx",
  "env": {
    "CRASH_STRICT_MODE": "false",
    "MAX_HISTORY_SIZE": "100"
  }
}
```

7. Click `Save`.
</details>

## ⚙️ Configuration

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

## 🚨 Troubleshooting

<details>
<summary><b>Module Not Found Errors</b></summary>

If you encounter `ERR_MODULE_NOT_FOUND`, try using `bunx` instead of `npx`:

```json
{
  "mcpServers": {
    "crash": {
      "command": "bunx",
      "args": ["-y", "crash-mcp"]
    }
  }
}
```

This often resolves module resolution issues in environments where `npx` doesn't properly install or resolve packages.

</details>

<details>
<summary><b>ESM Resolution Issues</b></summary>

For errors like `Error: Cannot find module`, try the `--experimental-vm-modules` flag:

```json
{
  "mcpServers": {
    "crash": {
      "command": "npx",
      "args": ["-y", "--node-options=--experimental-vm-modules", "crash-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>General MCP Client Errors</b></summary>

1. Try adding `@latest` to the package name
2. Use `bunx` as an alternative to `npx`
3. Consider using `deno` as another alternative
4. Ensure you're using Node.js v18 or higher for native support

</details>

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
