---
id: I-020
title: The synthetic-belt browser script fails "Earth's path is drawn" at desktop True scale
type: defect
status: open
source:
  kind: check
  check: C-015
  actor: {role: checker, session: o014-orchestrator-check-20261011}
  at: '2026-10-11T09:45:28Z'
tasks: [T-045]
checks: [C-015]
history:
  - at: '2026-10-11T09:45:28Z'
    actor: {role: checker, session: o014-orchestrator-check-20261011}
    kind: observed
    note: Found during the T-042 Task Check (C-015). Pre-existing at HEAD 8fc6fce; not introduced by T-042. Routed to T-045, which owns path drawing and writes tools/validate/browser-synthetic-belt.mjs.
---

# I-020: The synthetic-belt browser script fails "Earth's path is drawn" at desktop True scale

## Summary

`tools/validate/browser-synthetic-belt.mjs` fails its assertion `desktop/True: Earth's path is drawn (16)` (line 133 requires more than 40 drawn path points). The T-042 executor reproduced the same failure on a detached worktree of HEAD `8fc6fce`, i.e. on the uncommitted-then-committed T-041 seed code (`src/app/SunCentredView.ts`, the belt fixture), before any O-014 change. T-042 touches only `src/core/` and does not change the belt's output (its unit tests are unchanged and pass), so the failure is not attributable to it.

## Evidence

- T-042 executor run: `/tmp/claude-1000/-home-user-code-Astraeus/799ecb79-0f69-48bf-a70b-760f5eb7b12e/scratchpad/t042-browser-20261011T093824Z` (scratch; all other browser scripts passed with zero console errors).
- Assertion: `tools/validate/browser-synthetic-belt.mjs:133`.

## Proof Needed

- `browser-synthetic-belt.mjs` passes at 1280×800 and 390×844 in a fresh run directory with zero console errors after T-045's path layer lands (or the assertion is shown to be wrong and corrected with a stated reason mapped to the new path rule, per the Browser regression maintenance rule).
