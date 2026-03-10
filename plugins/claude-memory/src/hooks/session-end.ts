#!/usr/bin/env node
/**
 * SessionEnd hook — lightweight cleanup.
 * Runs async (non-blocking) after session ends.
 */
import { homedir } from 'os';
import { join } from 'path';
import { MemoryDB } from '../db.js';

async function readStdin(): Promise<string> {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

await readStdin();

const dbPath = process.env.MEMORY_DB_PATH ?? join(homedir(), '.claude-memory', 'memory.db');

try {
  const db = new MemoryDB(dbPath);
  const pruned = db.pruneOldContext(60);
  if (pruned > 0) {
    process.stderr.write(`[claude-memory] Pruned ${pruned} stale context memories (>60 days)\n`);
  }
} catch {
  // Silent failure — hook runs in background
}

process.exit(0);
