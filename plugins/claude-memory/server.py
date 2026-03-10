"""
Memory MCP Server - Local SQLite-backed memory for Claude Code
Stores: conversation context, project decisions, working style & principles
"""

import json
import sqlite3
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from mcp.server.fastmcp import FastMCP

# ─── Config ───────────────────────────────────────────────────────────────────

DB_PATH = Path(os.environ.get("MEMORY_DB_PATH", Path.home() / ".claude-memory" / "memory.db"))

# ─── Database ─────────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS memories (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                category    TEXT    NOT NULL,  -- 'context' | 'decision' | 'working_style' | 'snippet'
                project     TEXT,              -- optional project scope (NULL = global)
                title       TEXT    NOT NULL,
                content     TEXT    NOT NULL,
                tags        TEXT    DEFAULT '[]',
                created_at  TEXT    NOT NULL,
                updated_at  TEXT    NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
            CREATE INDEX IF NOT EXISTS idx_memories_project  ON memories(project);

            CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
                title,
                content,
                tags,
                content=memories,
                content_rowid=id
            );

            CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
                INSERT INTO memories_fts(rowid, title, content, tags)
                VALUES (new.id, new.title, new.content, new.tags);
            END;

            CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
                INSERT INTO memories_fts(memories_fts, rowid, title, content, tags)
                VALUES ('delete', old.id, old.title, old.content, old.tags);
                INSERT INTO memories_fts(rowid, title, content, tags)
                VALUES (new.id, new.title, new.content, new.tags);
            END;

            CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
                INSERT INTO memories_fts(memories_fts, rowid, title, content, tags)
                VALUES ('delete', old.id, old.title, old.content, old.tags);
            END;
        """)

# ─── Helpers ──────────────────────────────────────────────────────────────────

VALID_CATEGORIES = {"context", "decision", "working_style", "snippet"}

def now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

def row_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["tags"] = json.loads(d.get("tags") or "[]")
    return d

def format_memory(m: dict) -> str:
    tags_str = ", ".join(m["tags"]) if m["tags"] else "—"
    project_str = m.get("project") or "global"
    return (
        f"### [{m['id']}] {m['title']}\n"
        f"**Category**: {m['category']} | **Project**: {project_str}\n"
        f"**Tags**: {tags_str}\n"
        f"**Updated**: {m['updated_at']}\n\n"
        f"{m['content']}"
    )

# ─── MCP Server ───────────────────────────────────────────────────────────────

mcp = FastMCP("memory_mcp")
init_db()

# ── Tool: store_memory ──────────────────────────────────────────────────────

class StoreInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: str = Field(..., description="Short descriptive title, e.g. 'Decision: use Zod for validation'", min_length=1, max_length=200)
    content: str = Field(..., description="The full memory content to store", min_length=1)
    category: str = Field(..., description="One of: context | decision | working_style | snippet")
    project: Optional[str] = Field(None, description="Project name/slug to scope this memory (None = global)")
    tags: Optional[List[str]] = Field(default_factory=list, description="Optional tags for filtering, e.g. ['architecture', 'java']")

@mcp.tool(
    name="memory_store",
    annotations={
        "title": "Store a Memory",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
async def memory_store(params: StoreInput) -> str:
    """Store a new memory entry in the local SQLite database.

    Use this to remember:
    - **context**: Conversation summaries, session context, ongoing work
    - **decision**: Architecture decisions, tech choices, ADRs
    - **working_style**: Stefan's principles, preferred approaches, workflow habits
    - **snippet**: Reusable code patterns, commands, templates

    Args:
        params (StoreInput): title, content, category, optional project + tags

    Returns:
        str: Confirmation with the new memory ID
    """
    if params.category not in VALID_CATEGORIES:
        return f"Error: category must be one of {sorted(VALID_CATEGORIES)}"

    ts = now_iso()
    tags_json = json.dumps(params.tags or [])

    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO memories (category, project, title, content, tags, created_at, updated_at) VALUES (?,?,?,?,?,?,?)",
            (params.category, params.project, params.title, params.content, tags_json, ts, ts)
        )
        memory_id = cur.lastrowid

    return f"✅ Memory stored (ID: {memory_id})\n**Title**: {params.title}\n**Category**: {params.category}\n**Project**: {params.project or 'global'}"


# ── Tool: search_memories ───────────────────────────────────────────────────

class SearchInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    query: Optional[str] = Field(None, description="Full-text search query across title, content, tags")
    category: Optional[str] = Field(None, description="Filter by category: context | decision | working_style | snippet")
    project: Optional[str] = Field(None, description="Filter by project name (None = search all)")
    tags: Optional[List[str]] = Field(None, description="Filter by any of these tags")
    limit: int = Field(default=10, description="Max results to return", ge=1, le=50)

@mcp.tool(
    name="memory_search",
    annotations={
        "title": "Search Memories",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def memory_search(params: SearchInput) -> str:
    """Search stored memories using full-text search and/or filters.

    Supports combining: free-text query + category + project + tags filters.
    Returns formatted memory entries sorted by relevance or recency.

    Args:
        params (SearchInput): query, optional category/project/tags filters, limit

    Returns:
        str: Markdown-formatted list of matching memories
    """
    with get_db() as conn:
        if params.query:
            rows = conn.execute(
                """
                SELECT m.* FROM memories m
                JOIN memories_fts fts ON m.id = fts.rowid
                WHERE memories_fts MATCH ?
                ORDER BY rank
                LIMIT ?
                """,
                (params.query, params.limit * 3)  # fetch more for post-filtering
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM memories ORDER BY updated_at DESC LIMIT ?",
                (params.limit * 3,)
            ).fetchall()

    memories = [row_to_dict(r) for r in rows]

    # Post-filter
    if params.category:
        memories = [m for m in memories if m["category"] == params.category]
    if params.project is not None:
        memories = [m for m in memories if m.get("project") == params.project]
    if params.tags:
        filter_tags = set(params.tags)
        memories = [m for m in memories if filter_tags.intersection(set(m["tags"]))]

    memories = memories[:params.limit]

    if not memories:
        return "No memories found matching your query."

    result = f"## Found {len(memories)} memor{'y' if len(memories)==1 else 'ies'}\n\n"
    result += "\n\n---\n\n".join(format_memory(m) for m in memories)
    return result


# ── Tool: get_memory ────────────────────────────────────────────────────────

class GetInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: int = Field(..., description="Memory ID to retrieve", ge=1)

@mcp.tool(
    name="memory_get",
    annotations={
        "title": "Get Memory by ID",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def memory_get(params: GetInput) -> str:
    """Retrieve a specific memory by its ID.

    Args:
        params (GetInput): id of the memory

    Returns:
        str: Full memory content formatted as Markdown
    """
    with get_db() as conn:
        row = conn.execute("SELECT * FROM memories WHERE id = ?", (params.id,)).fetchone()

    if not row:
        return f"Error: No memory found with ID {params.id}"

    return format_memory(row_to_dict(row))


# ── Tool: update_memory ─────────────────────────────────────────────────────

class UpdateInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    id: int = Field(..., description="Memory ID to update", ge=1)
    title: Optional[str] = Field(None, description="New title (leave None to keep existing)", max_length=200)
    content: Optional[str] = Field(None, description="New content (leave None to keep existing)")
    tags: Optional[List[str]] = Field(None, description="New tags list (leave None to keep existing)")

@mcp.tool(
    name="memory_update",
    annotations={
        "title": "Update a Memory",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def memory_update(params: UpdateInput) -> str:
    """Update an existing memory's title, content, or tags.

    Only provided fields are updated; others remain unchanged.

    Args:
        params (UpdateInput): id + any subset of title, content, tags

    Returns:
        str: Confirmation of what was updated
    """
    with get_db() as conn:
        row = conn.execute("SELECT * FROM memories WHERE id = ?", (params.id,)).fetchone()
        if not row:
            return f"Error: No memory found with ID {params.id}"

        existing = row_to_dict(row)
        new_title   = params.title   if params.title   is not None else existing["title"]
        new_content = params.content if params.content is not None else existing["content"]
        new_tags    = json.dumps(params.tags) if params.tags is not None else existing["tags"] if isinstance(existing["tags"], str) else json.dumps(existing["tags"])

        conn.execute(
            "UPDATE memories SET title=?, content=?, tags=?, updated_at=? WHERE id=?",
            (new_title, new_content, new_tags, now_iso(), params.id)
        )

    return f"✅ Memory {params.id} updated: **{new_title}**"


# ── Tool: delete_memory ─────────────────────────────────────────────────────

class DeleteInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: int = Field(..., description="Memory ID to delete", ge=1)

@mcp.tool(
    name="memory_delete",
    annotations={
        "title": "Delete a Memory",
        "readOnlyHint": False,
        "destructiveHint": True,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def memory_delete(params: DeleteInput) -> str:
    """Permanently delete a memory by ID.

    Args:
        params (DeleteInput): id of the memory to delete

    Returns:
        str: Confirmation of deletion
    """
    with get_db() as conn:
        row = conn.execute("SELECT title FROM memories WHERE id = ?", (params.id,)).fetchone()
        if not row:
            return f"Error: No memory found with ID {params.id}"
        title = row["title"]
        conn.execute("DELETE FROM memories WHERE id = ?", (params.id,))

    return f"🗑️ Deleted memory {params.id}: **{title}**"


# ── Tool: list_projects ─────────────────────────────────────────────────────

@mcp.tool(
    name="memory_list_projects",
    annotations={
        "title": "List All Projects",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def memory_list_projects() -> str:
    """List all projects that have stored memories, with memory counts per category.

    Returns:
        str: Markdown table of projects and their memory counts
    """
    with get_db() as conn:
        rows = conn.execute("""
            SELECT
                COALESCE(project, 'global') AS project,
                category,
                COUNT(*) AS cnt
            FROM memories
            GROUP BY project, category
            ORDER BY project, category
        """).fetchall()

    if not rows:
        return "No memories stored yet."

    # Group by project
    projects: dict = {}
    for r in rows:
        p = r["project"]
        projects.setdefault(p, {})
        projects[p][r["category"]] = r["cnt"]

    lines = ["## Projects with Memories\n", "| Project | context | decision | working_style | snippet | Total |", "|---------|---------|----------|---------------|---------|-------|"]
    for proj, cats in sorted(projects.items()):
        ctx  = cats.get("context", 0)
        dec  = cats.get("decision", 0)
        ws   = cats.get("working_style", 0)
        snip = cats.get("snippet", 0)
        total = ctx + dec + ws + snip
        lines.append(f"| {proj} | {ctx} | {dec} | {ws} | {snip} | **{total}** |")

    return "\n".join(lines)


# ── Tool: stats ─────────────────────────────────────────────────────────────

@mcp.tool(
    name="memory_stats",
    annotations={
        "title": "Memory Stats",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def memory_stats() -> str:
    """Show overall memory statistics: total count, by category, recent activity.

    Returns:
        str: Markdown summary of memory stats
    """
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) AS n FROM memories").fetchone()["n"]
        by_cat = conn.execute("""
            SELECT category, COUNT(*) AS n FROM memories GROUP BY category
        """).fetchall()
        recent = conn.execute("""
            SELECT title, category, updated_at FROM memories ORDER BY updated_at DESC LIMIT 5
        """).fetchall()

    if total == 0:
        return "No memories stored yet. Start by using `memory_store`!"

    lines = [f"## Memory Stats\n**Total**: {total} memories\n"]
    lines.append("### By Category")
    for r in by_cat:
        lines.append(f"- **{r['category']}**: {r['n']}")

    lines.append("\n### Recently Updated")
    for r in recent:
        lines.append(f"- [{r['category']}] **{r['title']}** — {r['updated_at']}")

    lines.append(f"\n📁 **Database**: `{DB_PATH}`")
    return "\n".join(lines)


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run()
