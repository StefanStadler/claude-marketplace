import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MemoryDB } from '../db.js';

export function registerListProjects(server: McpServer, db: MemoryDB) {
  server.registerTool(
    'memory_list_projects',
    {
      title: 'List All Projects',
      description: 'List all projects that have stored memories, with memory counts per category.',
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const projects = db.listProjects();

      if (projects.length === 0) {
        return { content: [{ type: 'text', text: 'No memories stored yet.' }] };
      }

      const lines = [
        '## Projects with Memories\n',
        '| Project | context | decision | working_style | snippet | Total |',
        '|---------|---------|----------|---------------|---------|-------|',
        ...projects.map(p =>
          `| ${p.project} | ${p.context} | ${p.decision} | ${p.working_style} | ${p.snippet} | **${p.total}** |`
        ),
      ];

      return { content: [{ type: 'text', text: lines.join('\n') }] };
    },
  );
}
