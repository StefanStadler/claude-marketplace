#!/usr/bin/env node
/**
 * Stop hook — prompts Claude to store significant decisions before ending a response.
 * Only blocks when strong decision signals are detected to avoid noise.
 */
import type { StopInput } from '../types.js';

async function readStdin(): Promise<string> {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
  });
}

const raw = await readStdin();
const input: StopInput = JSON.parse(raw);

// Prevent infinite loop: if the hook is already active, exit immediately
if (input.stop_hook_active) {
  process.exit(0);
}

// Heuristic: only block if the transcript signals a meaningful decision
const DECISION_SIGNALS = [
  /\b(architektur|architecture|entscheid|decided?|decision|going with|wir (nehmen|verwenden|nutzen)|we('ll| will) use|ADR)\b/i,
  /\b(tech.?stack|framework choice|migration|refactor(ing)?)\b/i,
];

const transcriptPath = input.transcript_path;
let lastMessages = '';

try {
  const { readFileSync } = await import('fs');
  const transcript = JSON.parse(readFileSync(transcriptPath, 'utf8')) as Array<{ role: string; content: unknown }>;
  // Look at last few assistant messages
  const recent = transcript
    .filter(m => m.role === 'assistant')
    .slice(-3)
    .map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
    .join(' ');
  lastMessages = recent;
} catch {
  process.exit(0);
}

const shouldCapture = DECISION_SIGNALS.some(re => re.test(lastMessages));

if (shouldCapture) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: 'Before stopping: please use memory_store to save any significant decisions, architecture choices, or context from this session that should be remembered in future sessions.',
  }));
} else {
  process.exit(0);
}
