# Worktree lanes

## Worktree Lanes

The owner may run independent Tasks or Issue repairs side by side in git worktrees, starting each lane by pasting its `Next` line. A lane is a worktree the owner names as one, or any checkout where `git rev-parse --git-dir` differs from `git rev-parse --git-common-dir`. In a lane:

- Do not edit `.savepoint/router.md`; skip every router write the active skill would make. The owner sets the router on the main branch after merging.
- Do not create Tasks, Checks, or Issues. Their IDs are allocated per checkout and would collide at merge. Record a needed one as a note in the Task or Issue evidence for the owner.
- Commit on the lane branch; do not push or merge. Optional Task Checks and the Full Objective Check run on the main branch after the lane merges.

When `features.parallel_planning` is on, `savepoint-design` may suggest lanes and read/write manifests; they are advisory, owners and agents may ignore them, and this section only sets what an agent may write inside a lane.
