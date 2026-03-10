#!/usr/bin/env node
/**
 * Stop hook — automatically extracts and stores durable memories
 * from the conversation transcript using Claude Haiku.
 * Runs silently after every response, never blocks.
 *
 * Requires ANTHROPIC_API_KEY in environment.
 * Reads MEMORY_DB_PATH (default: ~/.claude-memory/memory.db).
 */
import { join, basename } from 'path';
import { homedir } from 'os';
import { readFileSync } from 'fs';
import { MemoryDB } from '../db.js';
import type { StopInput } from '../types.js';

async function readStdin(): Promise<string> {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => String(b.text ?? ''))
      .join(' ');
  }
  return '';
}

const raw = await readStdin();
const input: StopInput = JSON.parse(raw);

// Prevent infinite loop
if (input.stop_hook_active) process.exit(0);

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) process.exit(0);

// Read and format the last 20 transcript messages
let conversation = '';
try {
  const transcript = JSON.parse(
    readFileSync(input.transcript_path, 'utf8')
  ) as Array<{ role: string; content: unknown }>;

  conversation = transcript
    .slice(-20)
    .map(m => `${m.role.toUpperCase()}: ${extractText(m.content)}`)
    .join('\n\n')
    .trim();
} catch {
  process.exit(0);
}

if (!conversation) process.exit(0);

// Ask Haiku to extract durable memories from the conversation
const SYSTEM = `You analyze software development conversations and extract durable knowledge worth remembering across future sessions.

Extract ONLY:
- **decision**: Architecture choices, tech selections, patterns chosen, ADRs
- **working_style**: Developer preferences, principles, recurring approaches, habits
- **snippet**: Reusable commands, code patterns, configs, templates

Do NOT extract:
- Temporary session context or in-progress work
- Trivial exchanges or questions without a clear resolution
- Anything that would be stale or irrelevant in a future session

Return a JSON array (empty [] if nothing worth saving):
[
  {
    "title": "short descriptive title (max 80 chars)",
    "content": "full detail worth remembering",
    "category": "decision | working_style | snippet",
    "tags": ["relevant", "tags"]
  }
]

Return ONLY the JSON array, no explanation, no markdown fences.`;

interface ExtractedMemory {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

let memories: ExtractedMemory[] = [];

try {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Extract memories from this conversation:\n\n${conversation}`,
      }],
    }),
  });

  if (!response.ok) process.exit(0);

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content.find(b => b.type === 'text')?.text ?? '[]';

  // Strip markdown fences if Haiku wraps the JSON anyway
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned);
  if (Array.isArray(parsed)) memories = parsed;
} catch {
  process.exit(0);
}

if (memories.length === 0) process.exit(0);

// Store extracted memories in the local DB
const dbPath = process.env.MEMORY_DB_PATH ?? join(homedir(), '.claude-memory', 'memory.db');
const project = basename(input.cwd).toLowerCase();
const VALID = new Set(['decision', 'working_style', 'snippet']);

try {
  const db = new MemoryDB(dbPath);
  let saved = 0;

  for (const m of memories) {
    if (!m.title?.trim() || !m.content?.trim()) continue;
    const category = VALID.has(m.category) ? m.category : 'decision';
    db.insert({
      title: m.title.slice(0, 200),
      content: m.content,
      category,
      project,
      tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
    });
    saved++;
  }

  if (saved > 0) {
    process.stderr.write(
      `[claude-memory] Auto-saved ${saved} memor${saved === 1 ? 'y' : 'ies'} for project "${project}"\n`
    );
  }
} catch {
  // Silent failure — never block Claude
}

process.exit(0);
