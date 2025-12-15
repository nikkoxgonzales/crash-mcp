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
import { loadConfig } from './config.js';
import { CrashServer } from './server.js';

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

// Load configuration
const config = loadConfig();

// Show configuration on startup
console.error('🚀 CRASH MCP Server Starting...');
console.error(`📋 Configuration:`);
console.error(`   - Strict Mode: ${config.validation.strictMode}`);
console.error(`   - Revisions: ${config.features.enableRevisions ? 'Enabled' : 'Disabled'}`);
console.error(`   - Branching: ${config.features.enableBranching ? 'Enabled' : 'Disabled'} (max depth: ${config.system.maxBranchDepth})`);
console.error(`   - Sessions: ${config.features.enableSessions ? 'Enabled' : 'Disabled'} (timeout: ${config.system.sessionTimeout}min)`);
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
  console.error('🧠 CRASH - Cascaded Reasoning with Adaptive Step Handling');
  console.error('📚 Use "crash" tool for structured reasoning');

  if (config.validation.strictMode) {
    console.error('⚠️ Running in STRICT MODE - validation rules enforced');
  } else {
    console.error('🎯 Running in FLEXIBLE MODE - natural language allowed');
  }
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});