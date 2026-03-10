import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { formatMemory, type MemoryDB } from '../db.js';
import { VALID_CATEGORIES } from '../types.js';

export function registerSearch(server: McpServer, db: MemoryDB) {
  server.registerTool(
    'memory_search',
    {
      title: 'Search Memories',
      description: 'Search stored memories using full-text search and/or filters. Supports combining: free-text query + category + project + tags.',
      inputSchema: {
        query: z.string().optional().describe('Full-text search query across title, content, tags'),
        category: z.enum(VALID_CATEGORIES).optional().describe('Filter by category'),
        project: z.string().optional().describe('Filter by project name (omit = search all)'),
        tags: z.array(z.string()).optional().describe('Filter by any of these tags'),
        limit: z.number().int().min(1).max(50).default(10).describe('Max results to return'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ query, category, project, tags, limit }) => {
      const memories = db.search({ query, category, project, tags, limit });

      if (memories.length === 0) {
        return { content: [{ type: 'text', text: 'No memories found matching your query.' }] };
      }

      const header = `## Found ${memories.length} memor${memories.length === 1 ? 'y' : 'ies'}\n\n`;
      const body = memories.map(formatMemory).join('\n\n---\n\n');
      return { content: [{ type: 'text', text: header + body }] };
    },
  );
}
