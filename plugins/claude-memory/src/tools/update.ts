import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MemoryDB } from '../db.js';

export function registerUpdate(server: McpServer, db: MemoryDB) {
  server.registerTool(
    'memory_update',
    {
      title: 'Update a Memory',
      description: "Update an existing memory's title, content, or tags. Only provided fields are updated; others remain unchanged.",
      inputSchema: {
        id: z.number().int().min(1).describe('Memory ID to update'),
        title: z.string().max(200).optional().describe('New title (omit to keep existing)'),
        content: z.string().optional().describe('New content (omit to keep existing)'),
        tags: z.array(z.string()).optional().describe('New tags list (omit to keep existing)'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, title, content, tags }) => {
      const updated = db.update({ id, title, content, tags });
      if (!updated) {
        return { content: [{ type: 'text', text: `Error: No memory found with ID ${id}` }] };
      }
      return { content: [{ type: 'text', text: `✅ Memory ${id} updated: **${updated.title}**` }] };
    },
  );
}
