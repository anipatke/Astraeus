---
id: I-023
title: Three regression browser scripts have no phone run
type: defect
status: resolved
source:
  kind: check
  check: C-024
  actor: {role: checker, session: o014-orchestrator-check-20261012}
  at: '2026-10-12T10:51:00Z'
tasks: [T-050]
checks: [C-024, C-025]
resolution:
  disposition: verified
  check: C-025
  actor: {role: checker, session: o014-orchestrator-check-20261013}
  at: '2026-10-13T08:15:00Z'
  reason: Phone runs added to the three scripts with every desktop assertion kept; all twelve scripts pass in a fresh run; proven by C-025 (CLEAR).
history:
  - at: '2026-10-12T10:51:00Z'
    actor: {role: checker, session: o014-orchestrator-check-20261012}
    kind: observed
    note: Found in the T-050 Task Check (C-024). T-050 Done When 2 and O-014 success condition 5 require every browser script at 1280×800 and 390×844; browser-spike02.mjs, browser-anchor-labels.mjs and browser-synthetic-ring.mjs drive 1280×800 only.
  - at: '2026-10-12T10:52:00Z'
    actor: {role: owner, session: owner-chat-o014-20261012}
    kind: owner_decision
    note: 'Owner chose "Add phone runs to the three" (Apollo mission, anchor labels, test ring) rather than an exception. Recorded by the orchestrator on the owner''s direct instruction.'
  - at: '2026-10-13T08:13:52Z'
    actor: {role: executor, session: o014-t050-exec-repair}
    kind: repair_attempted
    note: 'Added 390x844 runs to browser-spike02.mjs, browser-anchor-labels.mjs and browser-synthetic-ring.mjs (every desktop assertion unchanged; desktop to phone map in each script header; one phone counterpart differs with reason: anchor labels on screen are 1 to 40 on the phone against all 40 on desktop; 40 elements are created at both sizes). No app source changed. Fresh run docs/evidence/o014-t050-repair-20261013T080032/: all twelve browser scripts exit 0 with zero console errors, typecheck/build/test (568 tests) and the public-build gate pass, no committed evidence changed. Awaiting a fresh Check.'
  - at: '2026-10-13T08:15:00Z'
    actor: {role: checker, session: o014-orchestrator-check-20261013}
    kind: rechecked
    note: C-025 CLEAR; checker diffed the three scripts (no desktop assertion removed or loosened) and confirmed all twelve scripts pass in docs/evidence/o014-t050-repair-20261013T080032/. Closed as verified.
    check: C-025
---

# I-023: Three regression browser scripts have no phone run

## Summary

T-050 Done When 2 ("All eleven browser scripts pass … at 1280×800 and 390×844") and O-014 success condition 5 require both sizes. In the T-050 run (`docs/evidence/o014-t050-20261012T103336/`), `browser-spike02.mjs`, `browser-anchor-labels.mjs` and `browser-synthetic-ring.mjs` drive 1280×800 only (none has ever had a phone mode; `git show 8fc6fce:tools/validate/browser-spike02.mjs` has no 390 viewport). `browser-precision.mjs` is fixed at 1280×800 by T-045 Done When 5, and `browser-lighting.mjs` (added by T-049) is a fixed-viewport measurement outside the "eleven"; neither is in this Issue's scope.

## Proof Needed

- `browser-spike02.mjs`, `browser-anchor-labels.mjs` and `browser-synthetic-ring.mjs` also run at 390×844, keeping every existing desktop assertion unchanged and mapping each to its phone counterpart (or stating why a desktop-only assertion has no phone equivalent).
- All twelve scripts pass with zero console errors in a fresh run directory, with output-directory arguments, and no committed evidence changes.
- Configured gates pass.
