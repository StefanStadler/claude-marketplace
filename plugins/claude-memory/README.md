# claude-memory

Persistent, local memory for Claude Code — SQLite-backed MCP server that remembers context, decisions, working style, and reusable snippets across sessions.

## Features

- **Full-text search** across all memories (SQLite FTS5)
- **Project scoping** — memories can be global or scoped to a project
- **Category system** — `context`, `decision`, `working_style`, `snippet`
- **Lifecycle hooks** — auto-injects relevant memories at session start, prunes stale context, and prompts to capture decisions before stopping
- **Web UI** — optional local browser interface (`webui.py`)

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

### 3. Register lifecycle hooks (optional but recommended)

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
            "command": "node --import tsx/esm /path/to/plugins/claude-memory/src/hooks/stop.ts"
          }
        ]
      }
    ]
  }
}
```

## MCP Tools

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

| Category | Use for |
|----------|---------|
| `context` | Session summaries, ongoing tasks, conversation context |
| `decision` | Architecture decisions, tech choices, ADRs |
| `working_style` | Principles, preferred approaches, workflow habits |
| `snippet` | Reusable code patterns, commands, templates |

## Database

Default path: `~/.claude-memory/memory.db`
Override with the `MEMORY_DB_PATH` environment variable.

Inspect directly with `sqlite3 ~/.claude-memory/memory.db` or any SQLite GUI.
