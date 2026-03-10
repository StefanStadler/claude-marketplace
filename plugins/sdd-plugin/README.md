# sdd-plugin — Spec-Driven Development

A Claude Code plugin that enforces a structured, plan-first development workflow. Instead of jumping straight to code, you research → plan → implement → validate, with human checkpoints at each stage.

## Installation

```
/plugin marketplace add StefanStadler/claude-marketplace
/plugin install sdd-plugin
```

## Skills

### `/create-plan` — Research & Plan
Interactively creates a detailed implementation plan through codebase research and iteration.

```
/create-plan
/create-plan path/to/spec.md
/create-plan think deeply about path/to/ticket.md
```

**What it does:**
1. Reads any provided files fully
2. Spawns parallel agents to research the codebase
3. Presents findings and asks only questions it can't answer through code
4. Proposes a phase structure and gets your approval
5. Writes the plan to `plans/YYYY-MM-DD-description.md`

---

### `/implement-plan` — Execute Phase by Phase
Implements an approved plan from `plans/`, verifying each phase before moving on.

```
/implement-plan
/implement-plan plans/2025-03-10-add-auth.md
```

**What it does:**
1. Reads the plan and all referenced files
2. Implements each phase fully
3. Runs automated verification (tests, lint, type check)
4. Pauses for your manual verification before proceeding
5. Checks off completed items in the plan file

---

### `/iterate-plan` — Update an Existing Plan
Updates a plan based on feedback, with targeted codebase research for technical changes.

```
/iterate-plan plans/2025-03-10-add-auth.md add error handling phase
/iterate-plan plans/2025-03-10-add-auth.md reduce scope, drop feature X
```

**What it does:**
1. Reads the existing plan
2. Researches the codebase if the change requires technical context
3. Confirms the proposed changes with you before editing
4. Makes surgical edits — not rewrites

---

### `/validate-plan` — Verify the Implementation
Checks that the implementation matches the plan, runs all automated checks, and lists what needs manual testing.

```
/validate-plan
/validate-plan plans/2025-03-10-add-auth.md
```

**What it does:**
1. Reads the plan and examines git history
2. Compares actual code changes to plan specifications
3. Runs all automated verification commands
4. Produces a validation report with pass/fail status and manual testing steps

---

### `/research-codebase` — Deep Codebase Research
Investigates any question about the codebase and writes a structured findings document to `research/`.

```
/research-codebase
/research-codebase how does authentication work?
/research-codebase where is the payment flow handled?
```

**What it does:**
1. Decomposes your question into research areas
2. Spawns parallel agents to explore the codebase concurrently
3. Synthesizes findings with concrete `file:line` references
4. Saves a document to `research/YYYY-MM-DD-topic.md`

---

## Recommended Workflow

```
/create-plan       ← research & plan the feature
/implement-plan    ← execute phase by phase
/validate-plan     ← verify correctness
/commit            ← create atomic commits
```

Use `/iterate-plan` any time you need to adjust the plan mid-way.

## Output Files

| Directory | Created by | Contents |
|-----------|-----------|----------|
| `plans/` | `/create-plan` | Implementation plans |
| `research/` | `/research-codebase` | Codebase research documents |
