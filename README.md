# Stefan's Claude Marketplace

A Claude Code plugin marketplace by [StefanStadler](https://github.com/StefanStadler) — productivity and workflow tools for software development.

## Installation

```
/plugin marketplace add StefanStadler/claude-marketplace
```

## Plugins

| Plugin | Description |
|--------|-------------|
| [sdd-plugin](./plugins/sdd-plugin/) | Spec-Driven Development: plan → implement → validate |
| [claude-memory](./plugins/claude-memory/) | Persistent SQLite memory MCP server with lifecycle hooks |

## Installing a Plugin

After adding the marketplace, install individual plugins with:

```
/plugin install sdd-plugin
```

---

## Contributing

Plugins live in `plugins/<plugin-name>/` and follow the Claude Code plugin format:
- `.claude-plugin/plugin.json` — plugin metadata
- `skills/<skill-name>/SKILL.md` — skill definitions
