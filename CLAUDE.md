# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## What This Repo Is

A Claude Code plugin marketplace. Plugins live in `plugins/<plugin-name>/` and are installed via:

```
/plugin marketplace add StefanStadler/claude-marketplace
/plugin install <plugin-name>
```

## Plugin Structure

Each plugin follows this layout:

```
plugins/<plugin-name>/
├── .claude-plugin/plugin.json   # metadata (name, version, description, license, author, keywords)
├── README.md                    # user-facing docs with usage examples
└── skills/<skill-name>/
    └── SKILL.md                 # skill definition with frontmatter (description, model)
```

**`plugin.json`** fields: `name`, `version`, `description`, `license`, `author.name`, `keywords[]`

**`SKILL.md`** frontmatter: `description` (shown in skill picker), optionally `model` (e.g. `opus` to force a specific model)

## Current Plugins

### `sdd-plugin` — Spec-Driven Development

Five skills that enforce a research → plan → implement → validate workflow:

| Skill | What it does |
|-------|-------------|
| `/create-plan` | Researches codebase via parallel agents, asks focused questions, proposes phase structure, writes plan to `plans/YYYY-MM-DD-description.md` |
| `/implement-plan` | Executes a plan phase by phase, runs automated verification after each phase, pauses for manual confirmation before continuing |
| `/iterate-plan` | Makes surgical edits to an existing plan based on feedback, with targeted research for technical changes |
| `/validate-plan` | Checks implementation against plan via git history, runs automated checks, produces a pass/fail report |
| `/research-codebase` | Decomposes a question into parallel research tasks, synthesizes findings with `file:line` refs, saves to `research/YYYY-MM-DD-topic.md` |

Plans output to `plans/`, research output to `research/` (created in the consuming project, not this repo).

## Adding a New Plugin

1. Create `plugins/<plugin-name>/.claude-plugin/plugin.json`
2. Create skills in `plugins/<plugin-name>/skills/<skill-name>/SKILL.md`
3. Add a `README.md` with usage examples
4. List the plugin in the root `README.md` table
