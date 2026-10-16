---
id: I-020
title: The synthetic-belt browser script fails "Earth's path is drawn" at desktop True scale
type: defect
status: resolved
source:
  kind: check
  check: C-015
  actor: {role: checker, session: o014-orchestrator-check-20261011}
  at: '2026-10-11T09:45:28Z'
tasks: [T-045]
checks: [C-015, C-019]
resolution:
  disposition: verified
  check: C-019
  actor: {role: checker, session: o014-orchestrator-check-20261012}
  at: '2026-10-12T08:45:00Z'
  reason: Draw-order repair in T-045 proven by C-019 (CLEAR); browser-synthetic-belt.mjs passes unchanged at desktop and phone, True and Readable.
history:
  - at: '2026-10-11T09:45:28Z'
    actor: {role: checker, session: o014-orchestrator-check-20261011}
    kind: observed
    note: Found during the T-042 Task Check (C-015). Pre-existing at HEAD 8fc6fce; not introduced by T-042. Routed to T-045, which owns path drawing and writes tools/validate/browser-synthetic-belt.mjs.
  - at: '2026-10-12T08:30:00Z'
    actor: {role: executor, session: o014-t045-executor}
    kind: repair_attempted
    note: "T-045 repair, not an assertion fix. Cause: draw order. The assertion counts blue pixels of Earth's path (1 AU circle) in the Sun view; the belt's amber dots sit over that circle and were rendered after the line (both are transparent, so they are depth-sorted by object centre, not drawn in declaration order), painting over it, so only 16 (desktop True) and 29 (phone True) line pixels survived. Fix: every PathView line has renderOrder 1 (data dots 0), so a path overlay is drawn after the data it crosses, under the new path rule (PathView.ts). The assertion and its threshold (>40) are unchanged. Controlled check: with the new PathView and renderOrder 0 the script fails identically (phone/True 29); with renderOrder 1 it passes with Earth path pixel counts 102 / 108 / 114 / 113 (desktop True/Readable, phone True/Readable) in the final fresh run docs/evidence/o014-t045-20261012T075844/run/synthetic-belt/. The HEAD script on the before tree fails at phone/True (29): docs/evidence/o014-t045-20261012T075844/before/. Neighbouring cases re-run: all nine tools/validate/browser-*.mjs scripts pass with zero console errors (docs/evidence/o014-t045-20261012T075844/run/results.txt). Not run: other GPUs or real-browser rendering (headless software renderer only). Status left open for the checker."
  - at: '2026-10-12T08:45:00Z'
    actor: {role: checker, session: o014-orchestrator-check-20261012}
    kind: rechecked
    note: "C-019 CLEAR. Checker re-ran the gates; the executor's fresh run docs/evidence/o014-t045-20261012T075844/run/results.txt shows all nine browser scripts exit 0 with zero console errors, belt Earth-path pixel counts 102/108/114/113 against the unchanged >40 threshold; checker viewed run/synthetic-belt/desktop-composition-true-start-earth-on-path.png (Earth's path line visible). Closed as verified."
---

# I-020: The synthetic-belt browser script fails "Earth's path is drawn" at desktop True scale

## Summary

`tools/validate/browser-synthetic-belt.mjs` fails its assertion `desktop/True: Earth's path is drawn (16)` (line 133 requires more than 40 drawn path points). The T-042 executor reproduced the same failure on a detached worktree of HEAD `8fc6fce`, i.e. on the uncommitted-then-committed T-041 seed code (`src/app/SunCentredView.ts`, the belt fixture), before any O-014 change. T-042 touches only `src/core/` and does not change the belt's output (its unit tests are unchanged and pass), so the failure is not attributable to it.

## Evidence

- T-042 executor run: `/tmp/claude-1000/-home-user-code-Astraeus/799ecb79-0f69-48bf-a70b-760f5eb7b12e/scratchpad/t042-browser-20261011T093824Z` (scratch; all other browser scripts passed with zero console errors).
- Assertion: `tools/validate/browser-synthetic-belt.mjs:133`.

## Proof Needed

- `browser-synthetic-belt.mjs` passes at 1280×800 and 390×844 in a fresh run directory with zero console errors after T-045's path layer lands (or the assertion is shown to be wrong and corrected with a stated reason mapped to the new path rule, per the Browser regression maintenance rule).
