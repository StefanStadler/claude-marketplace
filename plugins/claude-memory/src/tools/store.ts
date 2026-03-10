import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MemoryDB } from '../db.js';
import { VALID_CATEGORIES } from '../types.js';

export function registerStore(server: McpServer, db: MemoryDB) {
  server.registerTool(
    'memory_store',
    {
      title: 'Store a Memory',
      description: `Store a new memory entry in the local SQLite database.

Use this to remember:
- **context**: Conversation summaries, session context, ongoing work
- **decision**: Architecture decisions, tech choices, ADRs
- **working_style**: Stefan's principles, preferred approaches, workflow habits
- **snippet**: Reusable code patterns, commands, templates`,
      inputSchema: {
        title: z.string().min(1).max(200).describe("Short descriptive title, e.g. 'Decision: use Zod for validation'"),
        content: z.string().min(1).describe('The full memory content to store'),
        category: z.enum(VALID_CATEGORIES).describe('One of: context | decision | working_style | snippet'),
        project: z.string().optional().describe('Project name/slug to scope this memory (omit = global)'),
        tags: z.array(z.string()).optional().default([]).describe("Optional tags for filtering, e.g. ['architecture', 'java']"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ title, content, category, project, tags }) => {
      const id = db.insert({ title, content, category, project, tags: tags ?? [] });
      return {
        content: [{
          type: 'text',
          text: `✅ Memory stored (ID: ${id})\n**Title**: ${title}\n**Category**: ${category}\n**Project**: ${project ?? 'global'}`,
        }],
      };
    },
  );
}
