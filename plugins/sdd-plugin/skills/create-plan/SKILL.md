---
description: Create detailed implementation plans through interactive research and iteration
model: opus
---

# Create Implementation Plan

You are tasked with creating detailed implementation plans through an interactive, iterative process. Be skeptical, thorough, and work collaboratively with the user.

## Initial Response

When this command is invoked:

1. **Check if parameters were provided**:
   - If a file path or description was provided, immediately begin research
   - Read any provided files FULLY before asking questions

2. **If no parameters provided**, respond with:
```
I'll help you create a detailed implementation plan.

Please provide:
1. The task/feature description (or path to a spec/ticket file)
2. Any relevant context, constraints, or requirements
3. Links to related research or previous implementations

Tip: You can also invoke this command with a file directly:
  /create-plan path/to/spec.md
For deeper analysis:
  /create-plan think deeply about path/to/spec.md
```

Then wait for user input.

## Process Steps

### Step 1: Context Gathering & Initial Analysis

1. **Read all mentioned files immediately and FULLY** — never use limit/offset, you need the whole file.

2. **Spawn parallel research agents** before asking questions:
   - Use subagents to find all files related to the task
   - Analyze how the current implementation works
   - Find similar patterns already in the codebase
   - Look for existing tests or examples to follow

3. **Read all files identified by research** fully into main context.

4. **Present informed understanding and focused questions**:
   ```
   Based on the description and my codebase research, I understand we need to [accurate summary].

   I've found:
   - [Current implementation detail with file:line reference]
   - [Relevant pattern or constraint]
   - [Potential complexity or edge case]

   Questions my research couldn't answer:
   - [Specific technical question needing human judgment]
   - [Business logic clarification]
   - [Design preference that affects implementation]
   ```

   Only ask questions you genuinely cannot answer through code investigation.

### Step 2: Research & Discovery

After initial clarifications:

1. **If the user corrects a misunderstanding** — spawn new research to verify, don't just accept it.

2. **Spawn parallel agents** for comprehensive research:
   - Find all files related to the implementation area
   - Understand existing patterns and conventions
   - Find similar features to model after
   - Identify integration points and dependencies

3. **Wait for ALL research to complete** before proceeding.

4. **Present findings and design options**:
   ```
   Based on my research:

   **Current State:**
   - [Key discovery with file:line reference]
   - [Pattern or convention to follow]

   **Design Options:**
   1. [Option A] — [pros/cons]
   2. [Option B] — [pros/cons]

   **Open Questions:**
   - [Technical uncertainty]
   - [Design decision needed]

   Which approach aligns with your vision?
   ```

### Step 3: Plan Structure Development

Once aligned on approach:

1. **Propose plan structure** — don't write details yet:
   ```
   Here's my proposed plan structure:

   ## Overview
   [1-2 sentence summary]

   ## Phases:
   1. [Phase name] — [what it accomplishes]
   2. [Phase name] — [what it accomplishes]
   3. [Phase name] — [what it accomplishes]

   Does this phasing make sense? Should I adjust the order or granularity?
   ```

2. **Get feedback before writing details.**

### Step 4: Detailed Plan Writing

After structure approval, write the plan to `plans/YYYY-MM-DD-description.md`:

- `YYYY-MM-DD` is today's date
- `description` is a brief kebab-case description
- Examples: `plans/2025-03-10-add-auth-middleware.md`, `plans/2025-03-10-refactor-user-model.md`

Use this template:

````markdown
# [Feature/Task Name] Implementation Plan

## Overview

[Brief description of what we're implementing and why]

## Current State Analysis

[What exists now, what's missing, key constraints discovered]

## Desired End State

[Specification of the desired end state and how to verify it]

### Key Discoveries:
- [Important finding with file:line reference]
- [Pattern to follow]
- [Constraint to work within]

## What We're NOT Doing

[Explicitly list out-of-scope items to prevent scope creep]

## Implementation Approach

[High-level strategy and reasoning]

## Phase 1: [Descriptive Name]

### Overview
[What this phase accomplishes]

### Changes Required:

#### 1. [Component/File Group]
**File**: `path/to/file.ext`
**Changes**: [Summary of changes]

```language
// Specific code to add/modify
```

### Success Criteria:

#### Automated Verification:
- [ ] Tests pass: `<test command>`
- [ ] Type checking passes: `<typecheck command>`
- [ ] Linting passes: `<lint command>`
- [ ] Build succeeds: `<build command>`

#### Manual Verification:
- [ ] Feature works as expected in the UI/CLI
- [ ] Edge case handling verified
- [ ] No regressions in related features

**Implementation Note**: After completing this phase and all automated checks pass, pause for manual confirmation before proceeding to the next phase.

---

## Phase 2: [Descriptive Name]

[Same structure...]

---

## Testing Strategy

### Unit Tests:
- [What to test]
- [Key edge cases]

### Integration Tests:
- [End-to-end scenarios]

### Manual Testing Steps:
1. [Specific step to verify feature]
2. [Another verification step]
3. [Edge case to test manually]

## References

- Related spec/ticket: `path/to/spec.md`
- Similar implementation: `[file:line]`
````

### Step 5: Review & Iterate

1. **Present the plan location**:
   ```
   I've created the implementation plan at:
   `plans/YYYY-MM-DD-description.md`

   Please review it and let me know:
   - Are the phases properly scoped?
   - Are the success criteria specific enough?
   - Any technical details that need adjustment?
   - Missing edge cases or considerations?
   ```

2. **Iterate based on feedback** until the user is satisfied.

## Guidelines

1. **Be Skeptical** — question vague requirements, verify with code, don't assume.
2. **Be Interactive** — get buy-in at each step, don't write the full plan in one shot.
3. **Be Thorough** — read files completely, include file:line references, write measurable criteria.
4. **Be Practical** — focus on incremental, testable changes; include "what we're NOT doing".
5. **No Open Questions in Final Plan** — if questions arise, research or ask immediately. Do NOT write the plan with unresolved issues.

## Success Criteria Format

Always separate success criteria into two categories:

**Automated Verification** (can be run without human interaction):
```markdown
#### Automated Verification:
- [ ] Tests pass: `npm test`
- [ ] Linting: `npm run lint`
- [ ] Type check: `npm run typecheck`
```

**Manual Verification** (requires human testing):
```markdown
#### Manual Verification:
- [ ] Feature appears correctly in the UI
- [ ] Performance is acceptable
- [ ] Error messages are user-friendly
```
