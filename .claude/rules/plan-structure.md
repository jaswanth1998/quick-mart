# Plan Structure

All improvement plans live in `.claude/plans/` as Markdown files. Every plan file **must** follow this structure:

## YAML Frontmatter

Each plan starts with YAML frontmatter containing:

```yaml
---
name: "Short plan name"
description: "Brief description of what this plan aims to achieve"
status: "not-started" # one of: not-started | in-progress | continued | completed | blocked | error
completed_items: [] # list of completed tasks or milestones
notes:
  went_well: [] # list of things that went well during execution
  went_wrong: [] # list of things that went wrong during execution
  blockers: [] # list of any blockers encountered during execution
---
```

**Status values:**
- `not-started` — Plan created but work hasn't begun
- `in-progress` — Currently being worked on
- `continued` — Paused and will be picked up in a future session
- `completed` — All work finished successfully
- `blocked` — Cannot proceed due to a dependency or issue
- `error` — Something went wrong during execution

## Plan Body

Below the frontmatter, include a brief summary of the plan's current state and any relevant context not captured in the frontmatter.
