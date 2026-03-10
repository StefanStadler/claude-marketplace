import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MemoryDB } from '../db.js';

export function registerDelete(server: McpServer, db: MemoryDB) {
  server.registerTool(
    'memory_delete',
    {
      title: 'Delete a Memory',
      description: 'Permanently delete a memory by ID.',
      inputSchema: {
        id: z.number().int().min(1).describe('Memory ID to delete'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const title = db.delete(id);
      if (!title) {
        return { content: [{ type: 'text', text: `Error: No memory found with ID ${id}` }] };
      }
      return { content: [{ type: 'text', text: `🗑️ Deleted memory ${id}: **${title}**` }] };
    },
  );
}
