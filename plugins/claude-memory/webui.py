"""Simple Web UI for Claude Memory - runs on http://localhost:7700"""

import json
import sqlite3
import os
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
import uvicorn

DB_PATH = Path(os.environ.get("MEMORY_DB_PATH", Path.home() / ".claude-memory" / "memory.db"))
VALID_CATEGORIES = ["context", "decision", "working_style", "snippet"]

def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def row_to_dict(row):
    d = dict(row)
    d["tags"] = json.loads(d.get("tags") or "[]")
    return d

app = FastAPI()

HTML = """<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claude Memory</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #0f1117; color: #e2e8f0; min-height: 100vh; }
  header { background: #1a1d2e; border-bottom: 1px solid #2d3748; padding: 1rem 2rem;
           display: flex; align-items: center; gap: 1rem; }
  header h1 { font-size: 1.25rem; font-weight: 600; color: #a78bfa; }
  header span { font-size: 0.8rem; color: #64748b; }
  .layout { display: grid; grid-template-columns: 260px 1fr; min-height: calc(100vh - 57px); }
  sidebar { background: #1a1d2e; border-right: 1px solid #2d3748; padding: 1.5rem 1rem; }
  .filter-group { margin-bottom: 1.5rem; }
  .filter-group label { display: block; font-size: 0.75rem; font-weight: 600;
                        color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
                        margin-bottom: 0.5rem; }
  .filter-group input, .filter-group select {
    width: 100%; padding: 0.5rem 0.75rem; border-radius: 6px;
    border: 1px solid #2d3748; background: #0f1117; color: #e2e8f0;
    font-size: 0.875rem; }
  .filter-group input:focus, .filter-group select:focus {
    outline: none; border-color: #7c3aed; }
  .btn { display: inline-block; padding: 0.5rem 1rem; border-radius: 6px;
         font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none;
         text-decoration: none; transition: all 0.15s; }
  .btn-primary { background: #7c3aed; color: white; }
  .btn-primary:hover { background: #6d28d9; }
  .btn-sm { padding: 0.25rem 0.6rem; font-size: 0.75rem; }
  .btn-danger { background: #991b1b; color: white; }
  .btn-danger:hover { background: #7f1d1d; }
  .btn-ghost { background: transparent; border: 1px solid #2d3748; color: #94a3b8; }
  .btn-ghost:hover { border-color: #4b5563; color: #e2e8f0; }
  main { padding: 1.5rem 2rem; overflow-y: auto; }
  .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .top-bar h2 { font-size: 1rem; color: #94a3b8; }
  .cards { display: grid; gap: 1rem; }
  .card { background: #1a1d2e; border: 1px solid #2d3748; border-radius: 10px;
          padding: 1.25rem; transition: border-color 0.15s; }
  .card:hover { border-color: #4b5563; }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start;
                 margin-bottom: 0.75rem; gap: 1rem; }
  .card-title { font-weight: 600; font-size: 0.95rem; color: #e2e8f0; }
  .card-meta { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
  .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px;
           font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
  .badge-context { background: #1e3a5f; color: #60a5fa; }
  .badge-decision { background: #3b2a00; color: #fbbf24; }
  .badge-working_style { background: #1a3a2a; color: #34d399; }
  .badge-snippet { background: #2d1b4e; color: #c084fc; }
  .card-content { font-size: 0.875rem; color: #94a3b8; line-height: 1.6;
                  white-space: pre-wrap; word-break: break-word; }
  .card-footer { display: flex; justify-content: space-between; align-items: center;
                 margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #2d3748; }
  .tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
  .tag { background: #1e293b; color: #64748b; padding: 0.15rem 0.4rem;
         border-radius: 4px; font-size: 0.7rem; }
  .card-date { font-size: 0.7rem; color: #4b5563; }
  .card-project { font-size: 0.75rem; color: #6d28d9; }
  /* Modal */
  .modal-bg { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7);
              z-index: 100; align-items: center; justify-content: center; }
  .modal-bg.open { display: flex; }
  .modal { background: #1a1d2e; border: 1px solid #2d3748; border-radius: 12px;
           padding: 2rem; width: min(560px, 95vw); max-height: 90vh; overflow-y: auto; }
  .modal h3 { margin-bottom: 1.5rem; color: #a78bfa; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { display: block; font-size: 0.8rem; color: #94a3b8;
                      margin-bottom: 0.4rem; }
  .form-group input, .form-group select, .form-group textarea {
    width: 100%; padding: 0.6rem 0.75rem; border-radius: 6px;
    border: 1px solid #2d3748; background: #0f1117; color: #e2e8f0;
    font-size: 0.875rem; font-family: inherit; resize: vertical; }
  .form-group textarea { min-height: 120px; }
  .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
    outline: none; border-color: #7c3aed; }
  .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
  .empty { text-align: center; padding: 4rem 2rem; color: #4b5563; }
  .empty p { margin-top: 0.5rem; font-size: 0.875rem; }
</style>
</head>
<body>
<header>
  <h1>🧠 Claude Memory</h1>
  <span>{{db_path}}</span>
</header>
<div class="layout">
<sidebar>
  <form method="get" action="/">
    <div class="filter-group">
      <label>Suche</label>
      <input type="text" name="q" value="{{q}}" placeholder="Volltext...">
    </div>
    <div class="filter-group">
      <label>Kategorie</label>
      <select name="cat">
        <option value="">Alle</option>
        <option value="context" {{sel_context}}>Context</option>
        <option value="decision" {{sel_decision}}>Decision</option>
        <option value="working_style" {{sel_working_style}}>Working Style</option>
        <option value="snippet" {{sel_snippet}}>Snippet</option>
      </select>
    </div>
    <div class="filter-group">
      <label>Projekt</label>
      <input type="text" name="proj" value="{{proj}}" placeholder="Projektname...">
    </div>
    <button type="submit" class="btn btn-primary" style="width:100%">Filtern</button>
    <a href="/" class="btn btn-ghost" style="width:100%;text-align:center;margin-top:0.5rem">Reset</a>
  </form>
</sidebar>
<main>
  <div class="top-bar">
    <h2>{{count}} Erinnerungen</h2>
    <button class="btn btn-primary" onclick="openModal()">+ Neu</button>
  </div>
  <div class="cards">
{{cards_html}}
  </div>
</main>
</div>

<!-- Create/Edit Modal -->
<div class="modal-bg" id="modal">
  <div class="modal">
    <h3 id="modal-title">Neue Erinnerung</h3>
    <form method="post" action="/save" id="modal-form">
      <input type="hidden" name="id" id="edit-id">
      <div class="form-group">
        <label>Titel *</label>
        <input type="text" name="title" id="edit-title" required>
      </div>
      <div class="form-group">
        <label>Kategorie *</label>
        <select name="category" id="edit-category">
          <option value="context">context</option>
          <option value="decision">decision</option>
          <option value="working_style">working_style</option>
          <option value="snippet">snippet</option>
        </select>
      </div>
      <div class="form-group">
        <label>Projekt (optional)</label>
        <input type="text" name="project" id="edit-project">
      </div>
      <div class="form-group">
        <label>Tags (kommagetrennt)</label>
        <input type="text" name="tags" id="edit-tags" placeholder="tag1, tag2">
      </div>
      <div class="form-group">
        <label>Inhalt *</label>
        <textarea name="content" id="edit-content" required></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Abbrechen</button>
        <button type="submit" class="btn btn-primary">Speichern</button>
      </div>
    </form>
  </div>
</div>

<script>
function openModal(data) {
  document.getElementById('modal-title').textContent = data ? 'Bearbeiten' : 'Neue Erinnerung';
  document.getElementById('edit-id').value = data ? data.id : '';
  document.getElementById('edit-title').value = data ? data.title : '';
  document.getElementById('edit-category').value = data ? data.category : 'context';
  document.getElementById('edit-project').value = data ? (data.project || '') : '';
  document.getElementById('edit-tags').value = data ? data.tags : '';
  document.getElementById('edit-content').value = data ? data.content : '';
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
}
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});
</script>
</body>
</html>"""

CARD_TPL = """    <div class="card">
      <div class="card-header">
        <div class="card-title">{title}</div>
        <div class="card-meta">
          <span class="badge badge-{category}">{category}</span>
          <button class="btn btn-sm btn-ghost" onclick='openModal({json})'>✏️</button>
          <form method="post" action="/delete" style="display:inline">
            <input type="hidden" name="id" value="{id}">
            <button class="btn btn-sm btn-danger" onclick="return confirm('Löschen?')">🗑</button>
          </form>
        </div>
      </div>
      {project_line}
      <div class="card-content">{content}</div>
      <div class="card-footer">
        <div class="tags">{tags_html}</div>
        <span class="card-date">{updated_at}</span>
      </div>
    </div>"""


def render_cards(memories):
    if not memories:
        return '    <div class="empty"><h3>Keine Erinnerungen</h3><p>Erstelle deine erste mit dem Button oben.</p></div>'
    html = []
    for m in memories:
        tags_html = "".join(f'<span class="tag">{t}</span>' for t in m["tags"])
        project_line = f'<div class="card-project" style="margin-bottom:0.5rem">📁 {m["project"]}</div>' if m.get("project") else ""
        js_data = json.dumps({
            "id": m["id"], "title": m["title"], "category": m["category"],
            "project": m.get("project") or "", "tags": ", ".join(m["tags"]),
            "content": m["content"]
        })
        html.append(CARD_TPL.format(
            id=m["id"], title=m["title"], category=m["category"],
            content=m["content"][:500] + ("…" if len(m["content"]) > 500 else ""),
            tags_html=tags_html or '<span class="tag" style="color:#2d3748">keine Tags</span>',
            updated_at=m["updated_at"][:10],
            project_line=project_line, json=js_data
        ))
    return "\n".join(html)


@app.get("/", response_class=HTMLResponse)
def index(q: str = "", cat: str = "", proj: str = ""):
    with get_db() as conn:
        if q:
            rows = conn.execute(
                "SELECT m.* FROM memories m JOIN memories_fts fts ON m.id=fts.rowid WHERE memories_fts MATCH ? ORDER BY rank LIMIT 100",
                (q,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM memories ORDER BY updated_at DESC LIMIT 200").fetchall()

    memories = [row_to_dict(r) for r in rows]
    if cat:
        memories = [m for m in memories if m["category"] == cat]
    if proj:
        memories = [m for m in memories if (m.get("project") or "").lower() == proj.lower()]

    sel = {c: "selected" if c == cat else "" for c in VALID_CATEGORIES}
    page = HTML.replace("{{cards_html}}", render_cards(memories)) \
               .replace("{{count}}", str(len(memories))) \
               .replace("{{q}}", q).replace("{{cat}}", cat).replace("{{proj}}", proj) \
               .replace("{{db_path}}", str(DB_PATH)) \
               .replace("{{sel_context}}", sel["context"]) \
               .replace("{{sel_decision}}", sel["decision"]) \
               .replace("{{sel_working_style}}", sel["working_style"]) \
               .replace("{{sel_snippet}}", sel["snippet"])
    return HTMLResponse(page)


@app.post("/save")
async def save(request: Request):
    form = await request.form()
    id_ = form.get("id", "").strip()
    title = form.get("title", "").strip()
    content = form.get("content", "").strip()
    category = form.get("category", "context").strip()
    project = form.get("project", "").strip() or None
    tags_raw = form.get("tags", "").strip()
    tags = json.dumps([t.strip() for t in tags_raw.split(",") if t.strip()])
    ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    with get_db() as conn:
        if id_:
            conn.execute(
                "UPDATE memories SET title=?,content=?,category=?,project=?,tags=?,updated_at=? WHERE id=?",
                (title, content, category, project, tags, ts, int(id_))
            )
        else:
            conn.execute(
                "INSERT INTO memories (category,project,title,content,tags,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
                (category, project, title, content, tags, ts, ts)
            )
    return RedirectResponse("/", status_code=303)


@app.post("/delete")
async def delete(request: Request):
    form = await request.form()
    id_ = int(form.get("id"))
    with get_db() as conn:
        conn.execute("DELETE FROM memories WHERE id=?", (id_,))
    return RedirectResponse("/", status_code=303)


if __name__ == "__main__":
    print(f"🧠 Claude Memory UI → http://localhost:7700")
    print(f"   DB: {DB_PATH}")
    uvicorn.run(app, host="127.0.0.1", port=7700, log_level="warning")
