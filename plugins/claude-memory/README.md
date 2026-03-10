# claude-memory

Persistent, local memory for Claude Code — SQLite-backed MCP server that **automatically extracts and stores** decisions, working style, and snippets from your conversations.

## Features

- **Automatic capture** — after each response, Claude Haiku silently reads the transcript and extracts durable memories (decisions, preferences, snippets) without blocking you
- **Full-text search** across all memories (SQLite FTS5)
- **Project scoping** — memories can be global or scoped to a project
- **Category system** — `context`, `decision`, `working_style`, `snippet`
- **Session injection** — relevant memories are loaded into Claude's context at session start
- **Auto-pruning** — stale context memories (>60 days) are cleaned up automatically

## Requirements

- Node.js 18+
- `ANTHROPIC_API_KEY` — used by the Stop hook to extract memories via Claude Haiku (automatic capture only; the MCP server itself does not require it)

## Installation

### 1. Install dependencies

```bash
cd plugins/claude-memory
npm install
```

### 2. Register the MCP server

```bash
claude mcp add-json memory \
  '{"command":"node","args":["--import","tsx/esm","src/index.ts"],"env":{"MEMORY_DB_PATH":"'"$HOME"'/.claude-memory/memory.db"}}'
```

Or add manually to `~/.claude.json`:

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["--import", "tsx/esm", "/path/to/plugins/claude-memory/src/index.ts"],
      "env": {
        "MEMORY_DB_PATH": "/Users/you/.claude-memory/memory.db"
      }
    }
  }
}
```

### 3. Register lifecycle hooks (recommended)

Add to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node --import tsx/esm /path/to/plugins/claude-memory/src/hooks/session-start.ts"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "ANTHROPIC_API_KEY=your-key node --import tsx/esm /path/to/plugins/claude-memory/src/hooks/stop.ts"
          }
        ]
      }
    ]
  }
}
```

The **Stop hook** is what enables automatic capture — it runs after every Claude response, reads the transcript, calls Claude Haiku to extract anything worth remembering, and saves it silently. If `ANTHROPIC_API_KEY` is not set, it exits without doing anything.

## How automatic capture works

1. Claude finishes a response → Stop hook fires
2. Hook reads the last 20 messages from the session transcript
3. Sends them to Claude Haiku with a structured extraction prompt
4. Haiku returns a JSON array of memories (or `[]` if nothing worth saving)
5. Memories are stored directly in the local SQLite DB
6. Next session: SessionStart hook injects relevant memories into Claude's context

## MCP Tools

You can also store and query memories manually:

| Tool | Description |
|------|-------------|
| `memory_store` | Store a new memory |
| `memory_search` | Full-text search + category/project/tag filters |
| `memory_get` | Retrieve a memory by ID |
| `memory_update` | Update title, content, or tags |
| `memory_delete` | Permanently delete a memory |
| `memory_list_projects` | List all projects with memory counts |
| `memory_stats` | Overview and recent activity |

## Categories

| Category | Use for | Captured automatically |
|----------|---------|------------------------|
| `context` | Session summaries, ongoing tasks | No (manual only) |
| `decision` | Architecture decisions, tech choices, ADRs | Yes |
| `working_style` | Principles, preferred approaches, habits | Yes |
| `snippet` | Reusable code patterns, commands, templates | Yes |

## Database

Default path: `~/.claude-memory/memory.db`
Override with the `MEMORY_DB_PATH` environment variable.

Inspect directly with `sqlite3 ~/.claude-memory/memory.db` or any SQLite GUI.
