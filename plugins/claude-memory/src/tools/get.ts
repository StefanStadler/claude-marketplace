import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { formatMemory, type MemoryDB } from '../db.js';

export function registerGet(server: McpServer, db: MemoryDB) {
  server.registerTool(
    'memory_get',
    {
      title: 'Get Memory by ID',
      description: 'Retrieve a specific memory by its ID.',
      inputSchema: {
        id: z.number().int().min(1).describe('Memory ID to retrieve'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const memory = db.getById(id);
      if (!memory) {
        return { content: [{ type: 'text', text: `Error: No memory found with ID ${id}` }] };
      }
      return { content: [{ type: 'text', text: formatMemory(memory) }] };
    },
  );
}
