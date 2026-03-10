---
description: Update an existing implementation plan based on feedback with targeted research
model: opus
---

# Iterate Implementation Plan

You are tasked with updating existing implementation plans based on user feedback. Be skeptical, thorough, and ensure changes are grounded in actual codebase reality.

## Initial Response

When invoked:

1. **Parse the input** to identify:
   - Plan file path (e.g., `plans/2025-03-10-feature.md`)
   - Requested changes or feedback

2. **Handle different scenarios**:

   **No plan file provided**:
   ```
   Which plan would you like to update? Please provide the path (e.g., `plans/2025-03-10-feature.md`).

   You can list available plans with: ls plans/
   ```

   **Plan file provided, no feedback**:
   ```
   I've found the plan at [path]. What changes would you like to make?

   Examples:
   - "Add a phase for error handling"
   - "Update success criteria to include performance tests"
   - "Reduce scope — exclude feature X"
   - "Split Phase 2 into backend and frontend phases"
   ```

   **Both plan and feedback provided**: Proceed immediately to Step 1.

## Process Steps

### Step 1: Read and Understand Current Plan

1. **Read the existing plan file COMPLETELY** — no limit/offset.
2. **Understand the requested changes** — identify what needs to add/modify/remove and whether it requires codebase research.

### Step 2: Research If Needed

Only spawn research agents if the changes require new technical understanding.

If needed, use parallel research agents to:
- Find relevant files for the new/changed areas
- Understand implementation details
- Find similar patterns in the codebase

Be specific about directories. Don't research for simple wording changes.

### Step 3: Confirm Understanding Before Changing

```
Based on your feedback, I understand you want to:
- [Change 1 with specific detail]
- [Change 2 with specific detail]

My research found:
- [Relevant code pattern or constraint]
- [Discovery that affects the change]

I plan to update the plan by:
1. [Specific modification]
2. [Another modification]

Does this align with your intent?
```

Get user confirmation before making changes.

### Step 4: Update the Plan

1. **Make focused, precise edits** using the Edit tool — surgical changes, not rewrites.
2. **Maintain existing structure** unless explicitly changing it.
3. **Keep all file:line references accurate.**
4. **Ensure consistency**:
   - If adding a phase, follow the existing phase format
   - If modifying scope, update the "What We're NOT Doing" section
   - If changing approach, update "Implementation Approach"
   - Maintain the automated vs manual success criteria distinction

### Step 5: Present Changes

```
I've updated the plan at `plans/[filename].md`

Changes made:
- [Specific change 1]
- [Specific change 2]

The updated plan now:
- [Key improvement]
- [Another improvement]

Would you like any further adjustments?
```

## Guidelines

1. **Be Skeptical** — question changes that seem problematic; verify feasibility with code research.
2. **Be Surgical** — precise edits, not wholesale rewrites; preserve good content.
3. **Be Thorough** — read the entire plan before making changes; verify success criteria remain measurable.
4. **Be Interactive** — confirm intent before acting; don't disappear into research silently.
5. **No Open Questions** — if a change raises questions, research or ask immediately before updating.

## Success Criteria Format

Always maintain the two-category structure when updating criteria:

**Automated Verification** (runnable commands):
```markdown
#### Automated Verification:
- [ ] Tests pass: `<test command>`
- [ ] Linting: `<lint command>`
```

**Manual Verification** (human testing required):
```markdown
#### Manual Verification:
- [ ] Feature works correctly in the UI
- [ ] Performance is acceptable
```
