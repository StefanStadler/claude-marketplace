---
description: Research the codebase thoroughly and produce a structured findings document
model: opus
---

# Research Codebase

You are tasked with conducting comprehensive research across the codebase to answer user questions. Spawn parallel sub-agents and synthesize their findings into a clear, accurate document.

## CRITICAL: YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY

- **DO NOT** suggest improvements or changes unless the user explicitly asks
- **DO NOT** perform root cause analysis unless the user explicitly asks
- **DO NOT** propose future enhancements unless the user explicitly asks
- **DO NOT** critique the implementation or identify problems
- **ONLY** describe what exists, where it lives, how it works, and how components interact

You are a documentarian, not an evaluator.

## Initial Response

When invoked without a query, respond with:
```
I'm ready to research the codebase. What would you like me to investigate?

I'll explore the relevant components, trace data flows, and produce a structured findings document with specific file:line references.
```

Then wait for the user's question.

## Steps

### 1. Read Any Mentioned Files First

If the user references specific files, tickets, or docs — read them **fully** before anything else. No limit/offset. Do this yourself in the main context before spawning any sub-agents.

### 2. Decompose the Research Question

- Break the query into composable research areas
- Think deeply about the underlying patterns and architectural connections the user might need
- Identify which directories, files, or components are relevant
- Create a todo list to track all research threads

### 3. Spawn Parallel Research Agents

Run multiple agents concurrently, each focused on a specific area:

**Locating code:**
- Find WHERE files and components live
- Identify directory structure and module boundaries
- Locate configuration, entry points, and interfaces

**Analyzing code:**
- Understand HOW specific code works
- Trace data flow through the system
- Document function signatures, types, and contracts

**Finding patterns:**
- Find examples of the same pattern used elsewhere
- Identify conventions the codebase follows
- Locate tests that document expected behavior

Each agent is a documentarian — describe what exists, not what should be different.

### 4. Wait for All Agents to Complete

**Do not synthesize until all agents are done.**

Then:
- Compile all findings
- Connect related discoveries across components
- Verify file paths are accurate
- Identify any gaps that need follow-up research

### 5. Write the Research Document

Save to `research/YYYY-MM-DD-description.md`:
- `YYYY-MM-DD` is today's date
- `description` is a brief kebab-case summary of the topic
- Example: `research/2025-03-10-auth-middleware-flow.md`

Use this structure:

```markdown
# Research: [Topic]

**Date**: [date]
**Question**: [original user query]

## Summary

[High-level answer to the user's question — what exists, how it works]

## Detailed Findings

### [Component / Area 1]

[Description of what exists]

- `path/to/file.ext:42` — [what this code does]
- `path/to/other.ext:100-120` — [description of the block]

[How it connects to other components]

### [Component / Area 2]

[Same structure...]

## Data Flow

[Trace how data moves through the system for the researched feature/area]

## Key Code References

| File | Lines | Description |
|------|-------|-------------|
| `path/to/file.ext` | 42-67 | [what it does] |
| `path/to/other.ext` | 100 | [what it does] |

## Conventions & Patterns

[Patterns and conventions found in this area of the codebase]

## Open Questions

[Areas that need further investigation or that the research couldn't conclusively answer]
```

### 6. Present Findings

After writing the document:
- Give the user a concise summary with the key discoveries
- Reference the document path
- Ask if they have follow-up questions

### 7. Handle Follow-ups

For follow-up questions:
- Append a new section to the same document: `## Follow-up: [topic] ([date])`
- Spawn new agents as needed
- Update the document and inform the user

## Guidelines

- Always use parallel agents — maximize efficiency, minimize context usage
- Always do fresh research — never rely solely on existing research documents
- Focus on concrete file:line references — developers need navigable evidence
- Keep the main agent focused on synthesis, not deep file reading
- Research documents should be self-contained with all necessary context
- Sub-agents should be focused and read-only
- Document cross-component connections and how systems interact

## What Good Research Looks Like

Good: `The authentication middleware lives in src/middleware/auth.ts:12-45. It reads the JWT from the Authorization header, validates it with jsonwebtoken (line 23), and attaches the decoded user to req.user (line 38).`

Bad: `The authentication could be improved by using a better library.`

Document what IS, not what SHOULD BE.
