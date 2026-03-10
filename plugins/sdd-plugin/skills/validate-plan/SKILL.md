---
description: Validate that an implementation matches its plan, verify success criteria, identify issues
---

# Validate Plan

You are tasked with validating that an implementation plan was correctly executed — verifying all success criteria and identifying any deviations or issues.

## Initial Setup

When invoked:

1. **Determine context** — are you in an existing implementation session or starting fresh?
   - If existing: review what was implemented in this conversation
   - If fresh: discover what was done through git history and codebase analysis

2. **Locate the plan**:
   - If plan path provided, use it
   - Otherwise, search recent commits for plan references or ask the user

3. **Gather implementation evidence**:
   ```bash
   # Check recent commits
   git log --oneline -n 20
   git diff HEAD~N..HEAD   # where N covers implementation commits

   # Run comprehensive checks
   make check test         # or project-appropriate equivalent
   ```

## Validation Process

### Step 1: Context Discovery

1. **Read the implementation plan completely.**
2. **Identify what should have changed**: files to modify, success criteria, key functionality.
3. **Spawn parallel research agents** to discover the implementation:
   - Verify database/schema changes match the plan
   - Compare actual code changes to plan specifications (file by file)
   - Check if tests were added/modified as specified
   - Run test commands and capture results

### Step 2: Systematic Validation

For each phase in the plan:

1. **Check completion status** — look for checkmarks (`- [x]`); verify actual code matches.
2. **Run automated verification** — execute each command from the plan's "Automated Verification" section; document pass/fail.
3. **Assess manual criteria** — list what needs manual testing with clear steps for the user.
4. **Think critically about edge cases** — error conditions, missing validations, potential regressions.

### Step 3: Validation Report

Generate a comprehensive report:

```markdown
## Validation Report: [Plan Name]

### Implementation Status
✓ Phase 1: [Name] — Fully implemented
✓ Phase 2: [Name] — Fully implemented
⚠️ Phase 3: [Name] — Partially implemented (see issues)

### Automated Verification Results
✓ Build passes: `<command>`
✓ Tests pass: `<command>`
✗ Linting issues: `<command>` — [description of failures]

### Code Review Findings

#### Matches Plan:
- [What was implemented correctly with file:line reference]

#### Deviations from Plan:
- [Deviation with file:line and explanation]

#### Potential Issues:
- [Issue that could cause problems]

### Manual Testing Required:
1. [ ] [Specific manual test step]
2. [ ] [Another manual test step]

### Recommendations:
- [Fix before merge]
- [Consider adding]
- [Document]
```

## Guidelines

1. **Be thorough but practical** — focus on what matters for correctness and maintainability.
2. **Run all automated checks** — don't skip verification commands from the plan.
3. **Document everything** — both successes and issues; be honest about gaps.
4. **Think critically** — does the implementation truly solve the problem?
5. **Consider maintenance** — will this be maintainable long-term?

## Validation Checklist

Always verify:
- [ ] All phases marked complete are actually implemented
- [ ] Automated tests pass
- [ ] Code follows existing project patterns
- [ ] No regressions introduced
- [ ] Error handling is robust
- [ ] Manual test steps are clear and actionable

## Recommended Workflow

```
/create-plan     → create the plan
/implement-plan  → execute it phase by phase
/validate-plan   → verify correctness
/commit          → create atomic commits
```

Good validation catches issues before they reach production. Be constructive but thorough.
