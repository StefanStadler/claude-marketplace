import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { homedir } from 'os';
import { join } from 'path';
import { MemoryDB } from './db.js';
import { registerStore } from './tools/store.js';
import { registerSearch } from './tools/search.js';
import { registerGet } from './tools/get.js';
import { registerUpdate } from './tools/update.js';
import { registerDelete } from './tools/delete.js';
import { registerListProjects } from './tools/listProjects.js';
import { registerStats } from './tools/stats.js';

const dbPath = process.env.MEMORY_DB_PATH ?? join(homedir(), '.claude-memory', 'memory.db');
const db = new MemoryDB(dbPath);

const server = new McpServer({ name: 'memory_mcp', version: '2.0.0' });

registerStore(server, db);
registerSearch(server, db);
registerGet(server, db);
registerUpdate(server, db);
registerDelete(server, db);
registerListProjects(server, db);
registerStats(server, db);

const transport = new StdioServerTransport();
await server.connect(transport);
