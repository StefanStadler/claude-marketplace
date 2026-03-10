import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MemoryDB } from '../db.js';

export function registerStats(server: McpServer, db: MemoryDB) {
  server.registerTool(
    'memory_stats',
    {
      title: 'Memory Stats',
      description: 'Show overall memory statistics: total count, by category, recent activity.',
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const { total, byCategory, recent } = db.stats();

      if (total === 0) {
        return { content: [{ type: 'text', text: 'No memories stored yet. Start by using `memory_store`!' }] };
      }

      const lines = [
        `## Memory Stats\n**Total**: ${total} memories\n`,
        '### By Category',
        ...Object.entries(byCategory).map(([cat, n]) => `- **${cat}**: ${n}`),
        '\n### Recently Updated',
        ...recent.map(r => `- [${r.category}] **${r.title}** — ${r.updated_at}`),
        `\n📁 **Database**: \`${db.dbPath}\``,
      ];

      return { content: [{ type: 'text', text: lines.join('\n') }] };
    },
  );
}
