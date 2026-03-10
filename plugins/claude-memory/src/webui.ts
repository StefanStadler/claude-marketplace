#!/usr/bin/env node
/**
 * claude-memory Web UI
 * Run: node --import tsx/esm src/webui.ts
 * Opens: http://localhost:3847
 */
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { homedir } from 'os';
import { join } from 'path';
import { MemoryDB } from './db.js';

const PORT = Number(process.env.PORT ?? 3847);
const dbPath = process.env.MEMORY_DB_PATH ?? join(homedir(), '.claude-memory', 'memory.db');
const db = new MemoryDB(dbPath);

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>claude-memory</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f0f0f; --surface: #1a1a1a; --border: #2a2a2a;
    --text: #e8e8e8; --muted: #888; --accent: #d97706;
    --tag: #1e293b; --tag-text: #94a3b8;
    --decision: #854d0e; --working_style: #14532d; --snippet: #1e3a5f; --context: #3b1f5e;
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
  header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 16px 24px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; position: sticky; top: 0; z-index: 10; }
  header h1 { font-size: 1.1rem; font-weight: 600; color: var(--accent); white-space: nowrap; }
  .controls { display: flex; gap: 8px; flex: 1; flex-wrap: wrap; }
  input[type=search] { flex: 1; min-width: 200px; padding: 7px 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.875rem; outline: none; }
  input[type=search]:focus { border-color: var(--accent); }
  select { padding: 7px 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.875rem; cursor: pointer; }
  .stats { color: var(--muted); font-size: 0.8rem; white-space: nowrap; }
  main { padding: 20px 24px; max-width: 960px; margin: 0 auto; }
  .grid { display: grid; gap: 12px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; cursor: pointer; transition: border-color .15s; }
  .card:hover { border-color: #444; }
  .card.open .body { display: block; }
  .card-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .card-title { font-size: 0.925rem; font-weight: 500; flex: 1; }
  .badge { font-size: 0.7rem; font-weight: 600; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: .04em; }
  .badge-decision { background: var(--decision); color: #fbbf24; }
  .badge-working_style { background: var(--working_style); color: #86efac; }
  .badge-snippet { background: var(--snippet); color: #93c5fd; }
  .badge-context { background: var(--context); color: #c4b5fd; }
  .card-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 6px; }
  .project { font-size: 0.75rem; color: var(--muted); }
  .project::before { content: "📁 "; }
  .date { font-size: 0.72rem; color: var(--muted); }
  .tags { display: flex; gap: 4px; flex-wrap: wrap; }
  .tag { font-size: 0.7rem; background: var(--tag); color: var(--tag-text); padding: 1px 6px; border-radius: 3px; }
  .body { display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .body pre { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8rem; white-space: pre-wrap; word-break: break-word; line-height: 1.6; color: #ccc; }
  .empty { text-align: center; padding: 60px 0; color: var(--muted); }
  #count { margin-bottom: 12px; font-size: 0.8rem; color: var(--muted); }
</style>
</head>
<body>
<header>
  <h1>claude-memory</h1>
  <div class="controls">
    <input type="search" id="q" placeholder="Search…" oninput="render()">
    <select id="cat" onchange="render()">
      <option value="">All categories</option>
      <option value="decision">decision</option>
      <option value="working_style">working_style</option>
      <option value="snippet">snippet</option>
      <option value="context">context</option>
    </select>
    <select id="proj" onchange="render()">
      <option value="">All projects</option>
    </select>
  </div>
  <span class="stats" id="stats"></span>
</header>
<main>
  <div id="count"></div>
  <div class="grid" id="grid"></div>
</main>
<script>
let memories = [];

async function load() {
  const res = await fetch('/api/memories');
  memories = await res.json();

  const projects = [...new Set(memories.map(m => m.project || 'global'))].sort();
  const sel = document.getElementById('proj');
  projects.forEach(p => {
    const o = document.createElement('option');
    o.value = p; o.textContent = p;
    sel.appendChild(o);
  });

  const total = memories.length;
  const cats = {};
  memories.forEach(m => cats[m.category] = (cats[m.category]||0)+1);
  document.getElementById('stats').textContent =
    total + ' memories · ' + Object.entries(cats).map(([k,v]) => k+': '+v).join(' · ');

  render();
}

function render() {
  const q = document.getElementById('q').value.toLowerCase();
  const cat = document.getElementById('cat').value;
  const proj = document.getElementById('proj').value;

  const filtered = memories.filter(m => {
    if (cat && m.category !== cat) return false;
    if (proj && (m.project||'global') !== proj) return false;
    if (q) {
      const hay = (m.title+' '+m.content+' '+(m.tags||[]).join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  document.getElementById('count').textContent = filtered.length + ' of ' + memories.length + ' shown';

  const grid = document.getElementById('grid');
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty">No memories found</div>';
    return;
  }

  grid.innerHTML = filtered.map(m => \`
    <div class="card" onclick="this.classList.toggle('open')">
      <div class="card-head">
        <span class="card-title">\${esc(m.title)}</span>
        <span class="badge badge-\${m.category}">\${m.category}</span>
      </div>
      <div class="card-meta">
        <span class="project">\${esc(m.project||'global')}</span>
        <span class="date">\${m.updated_at.slice(0,10)}</span>
        \${m.tags.length ? '<div class="tags">'+m.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join('')+'</div>' : ''}
      </div>
      <div class="body"><pre>\${esc(m.content)}</pre></div>
    </div>
  \`).join('');
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

load();
</script>
</body>
</html>`;

function handler(req: IncomingMessage, res: ServerResponse): void {
  if (req.url === '/api/memories') {
    const memories = db.search({ limit: 500 });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(memories));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
}

const server = createServer(handler);
server.listen(PORT, '127.0.0.1', () => {
  console.error(`[claude-memory] Web UI → http://localhost:${PORT}`);
});
