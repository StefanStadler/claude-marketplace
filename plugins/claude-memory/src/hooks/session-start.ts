#!/usr/bin/env node
/**
 * SessionStart hook — injects relevant memories into Claude's context
 * at the beginning of every session.
 */
import { homedir } from 'os';
import { join, basename } from 'path';
import { MemoryDB, formatMemory } from '../db.js';
import type { SessionStartInput } from '../types.js';

async function readStdin(): Promise<string> {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

const raw = await readStdin();
const input: SessionStartInput = JSON.parse(raw);

const dbPath = process.env.MEMORY_DB_PATH ?? join(homedir(), '.claude-memory', 'memory.db');

let db: MemoryDB;
try {
  db = new MemoryDB(dbPath);
} catch {
  process.exit(0);
}

const project = basename(input.cwd).toLowerCase();

const workingStyles = db.search({ category: 'working_style', project: null, limit: 5 });
const projectContext = db.search({ category: 'context', project, limit: 5 });
const globalDecisions = db.search({ category: 'decision', project: null, limit: 3 });
const projectDecisions = db.search({ category: 'decision', project, limit: 5 });

const allMemories = [...workingStyles, ...globalDecisions, ...projectContext, ...projectDecisions];

if (allMemories.length === 0) {
  process.exit(0);
}

const sections: string[] = [`# Memory Context (Project: ${project})\n`];

if (workingStyles.length > 0) {
  sections.push('## Working Style & Principles\n');
  sections.push(...workingStyles.map(formatMemory));
}

if (globalDecisions.length > 0 || projectDecisions.length > 0) {
  sections.push('\n## Decisions\n');
  sections.push(...[...globalDecisions, ...projectDecisions].map(formatMemory));
}

if (projectContext.length > 0) {
  sections.push('\n## Project Context\n');
  sections.push(...projectContext.map(formatMemory));
}

const additionalContext = sections.join('\n\n---\n\n');

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext,
  },
}));
