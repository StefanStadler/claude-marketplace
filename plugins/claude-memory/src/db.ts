import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import type { Memory, MemoryRow, SearchParams, InsertParams, UpdateParams } from './types.js';

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function rowToMemory(row: MemoryRow): Memory {
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    category: row.category as Memory['category'],
  };
}

export function formatMemory(m: Memory): string {
  const tags = m.tags.length > 0 ? m.tags.join(', ') : '—';
  const project = m.project ?? 'global';
  return [
    `### [${m.id}] ${m.title}`,
    `**Category**: ${m.category} | **Project**: ${project}`,
    `**Tags**: ${tags}`,
    `**Updated**: ${m.updated_at}`,
    '',
    m.content,
  ].join('\n');
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS memories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category    TEXT    NOT NULL,
    project     TEXT,
    title       TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    tags        TEXT    DEFAULT '[]',
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
  CREATE INDEX IF NOT EXISTS idx_memories_project  ON memories(project);

  CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    title, content, tags,
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
`;

export class MemoryDB {
  private db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(SCHEMA);
  }

  insert(params: InsertParams): number {
    const ts = nowIso();
    const result = this.db.prepare(
      'INSERT INTO memories (category, project, title, content, tags, created_at, updated_at) VALUES (?,?,?,?,?,?,?)'
    ).run(
      params.category,
      params.project ?? null,
      params.title,
      params.content,
      JSON.stringify(params.tags),
      ts,
      ts,
    );
    return result.lastInsertRowid as number;
  }

  getById(id: number): Memory | undefined {
    const row = this.db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as MemoryRow | undefined;
    return row ? rowToMemory(row) : undefined;
  }

  search(params: SearchParams): Memory[] {
    let rows: MemoryRow[];

    if (params.query) {
      rows = this.db.prepare(`
        SELECT m.* FROM memories m
        JOIN memories_fts fts ON m.id = fts.rowid
        WHERE memories_fts MATCH ?
          AND (? IS NULL OR m.category = ?)
          AND (? IS NULL OR m.project = ?)
        ORDER BY rank
        LIMIT ?
      `).all(
        params.query,
        params.category ?? null, params.category ?? null,
        params.project !== undefined ? params.project : null,
        params.project !== undefined ? params.project : null,
        params.limit,
      ) as MemoryRow[];
    } else {
      rows = this.db.prepare(`
        SELECT * FROM memories
        WHERE (? IS NULL OR category = ?)
          AND (? IS NULL OR project = ?)
        ORDER BY updated_at DESC
        LIMIT ?
      `).all(
        params.category ?? null, params.category ?? null,
        params.project !== undefined ? params.project : null,
        params.project !== undefined ? params.project : null,
        params.limit,
      ) as MemoryRow[];
    }

    let memories = rows.map(rowToMemory);

    if (params.tags && params.tags.length > 0) {
      const filterTags = new Set(params.tags);
      memories = memories.filter(m => m.tags.some(t => filterTags.has(t)));
    }

    return memories;
  }

  update(params: UpdateParams): Memory | undefined {
    const existing = this.getById(params.id);
    if (!existing) return undefined;

    const newTitle   = params.title   ?? existing.title;
    const newContent = params.content ?? existing.content;
    const newTags    = params.tags    ?? existing.tags;

    this.db.prepare(
      'UPDATE memories SET title=?, content=?, tags=?, updated_at=? WHERE id=?'
    ).run(newTitle, newContent, JSON.stringify(newTags), nowIso(), params.id);

    return this.getById(params.id);
  }

  delete(id: number): string | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;
    this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    return existing.title;
  }

  listProjects(): Array<{ project: string; context: number; decision: number; working_style: number; snippet: number; total: number }> {
    const rows = this.db.prepare(`
      SELECT
        COALESCE(project, 'global') AS project,
        category,
        COUNT(*) AS cnt
      FROM memories
      GROUP BY project, category
      ORDER BY project, category
    `).all() as Array<{ project: string; category: string; cnt: number }>;

    const map = new Map<string, Record<string, number>>();
    for (const r of rows) {
      if (!map.has(r.project)) map.set(r.project, {});
      map.get(r.project)![r.category] = r.cnt;
    }

    return Array.from(map.entries()).sort().map(([project, cats]) => {
      const context = cats['context'] ?? 0;
      const decision = cats['decision'] ?? 0;
      const working_style = cats['working_style'] ?? 0;
      const snippet = cats['snippet'] ?? 0;
      return { project, context, decision, working_style, snippet, total: context + decision + working_style + snippet };
    });
  }

  stats(): { total: number; byCategory: Record<string, number>; recent: Array<{ title: string; category: string; updated_at: string }> } {
    const total = (this.db.prepare('SELECT COUNT(*) AS n FROM memories').get() as { n: number }).n;

    const byCategory: Record<string, number> = {};
    const catRows = this.db.prepare('SELECT category, COUNT(*) AS n FROM memories GROUP BY category').all() as Array<{ category: string; n: number }>;
    for (const r of catRows) byCategory[r.category] = r.n;

    const recent = this.db.prepare(
      'SELECT title, category, updated_at FROM memories ORDER BY updated_at DESC LIMIT 5'
    ).all() as Array<{ title: string; category: string; updated_at: string }>;

    return { total, byCategory, recent };
  }

  pruneOldContext(olderThanDays: number): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const cutoffIso = cutoff.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const result = this.db.prepare(
      "DELETE FROM memories WHERE category = 'context' AND updated_at < ?"
    ).run(cutoffIso) as { changes: number };
    return result.changes;
  }

  get dbPath(): string {
    return this.db.name;
  }
}
