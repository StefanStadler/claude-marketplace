---
description: Implement an approved implementation plan phase by phase with verification
---

# Implement Plan

You are tasked with implementing an approved plan from `plans/`. These plans contain phases with specific changes and success criteria.

## Getting Started

When invoked with a plan path:
- Read the plan completely and note any existing checkmarks (`- [x]`)
- Read all files mentioned in the plan **fully** — never use limit/offset
- Think deeply about how the pieces fit together
- Create a todo list to track progress
- Begin implementing

If no plan path is provided, ask for one:
```
Which plan would you like to implement? Please provide the path (e.g., `plans/2025-03-10-add-auth.md`).

You can list available plans with: ls plans/
```

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:
- Follow the plan's intent while adapting to what you actually find in the code
- Implement each phase **fully** before moving to the next
- Verify your work makes sense in the broader codebase context
- Update checkboxes in the plan as you complete sections using the Edit tool

When things don't match the plan exactly, think about why and communicate clearly:

```
Issue in Phase [N]:
Expected: [what the plan says]
Found: [actual situation]
Why this matters: [explanation]

How should I proceed?
```

**Do not proceed past a mismatch without confirmation.**

## Verification Approach

After implementing a phase:

1. **Run all automated verification commands** from the plan's success criteria
2. **Fix any issues** before moving on
3. **Check off completed items** in the plan file using the Edit tool
4. **Pause for human verification**:
   ```
   Phase [N] Complete — Ready for Manual Verification

   Automated checks passed:
   - [list of commands that passed]

   Please perform the manual verification steps from the plan:
   - [list manual items]

   Let me know when manual testing is complete so I can proceed to Phase [N+1].
   ```

**Important**: Do not check off manual verification items until the user confirms them.

If instructed to execute multiple phases consecutively, skip the pause until the final phase.

## Resuming Work

If the plan already has checkmarks:
- Trust that completed work is done
- Pick up from the first unchecked item
- Only re-verify previous work if something seems off

## If You Get Stuck

- Re-read all relevant code thoroughly first
- Consider if the codebase evolved since the plan was written
- Present the mismatch clearly and ask for guidance
- Use research subagents sparingly — mainly for targeted debugging

## Process

1. Read the plan fully
2. Read all referenced files fully
3. Create a todo list for phases and steps
4. For each phase (in order):
   a. Read all files you'll be modifying
   b. Make the changes
   c. Run automated verification
   d. Fix any failures
   e. Check off completed items in the plan
   f. Pause for manual verification (unless batching phases)
5. Present a summary when done

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind.
