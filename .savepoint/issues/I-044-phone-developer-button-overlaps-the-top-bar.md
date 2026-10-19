---
id: I-044
title: On a phone the Developer button overlaps the top bar
type: defect
status: open
source:
  kind: check
  check: C-083
  actor: {role: checker, session: o025-orchestrator-20261019}
  at: '2026-10-19T11:40:00Z'
tasks: [T-099]
checks: [C-083]
guardrail_ids: []
history:
  - at: '2026-10-19T11:40:00Z'
    actor: {role: checker, session: o025-orchestrator-20261019}
    kind: observed
    note: 'browser-moon-panel.mjs:70 (layoutAt) stops at its first viewport: "phone 375x667, moons open: top-bar and developer-mode-toggle overlap" (top-bar 12,8-363,104; developer-mode-toggle 323,8-367,52). The rest of the moon-panel assertions (other viewports, search, highlight, focus) did not run.'
    check: C-083
  - at: '2026-10-19T14:19:43Z'
    actor: {role: executor, session: o025-repair-20261019}
    kind: repair_attempted
    note: "Phone controls drawer now reserves the Developer button's column (right padding 60px + safe area, src/shell/phone.css), so the top bar no longer sits under the 44px button. browser-moon-panel.mjs treats the open controls drawer and the button as one area (the button sits in the drawer's reserved gutter) while the top bar is still checked against the button. Results: browser-moon-panel.mjs exit 0 end to end (375x667, 390x844, 1280x720, 1440x900 layouts, then desktop and phone search, highlight, focus), zero console errors; typecheck, tests, git diff --check clean. Evidence docs/evidence/o025-repair-20261019T114109Z/. Awaiting independent Check."
---

# I-044: On a phone the Developer button overlaps the top bar

## Summary

At 375x667 with the moons section open, the Developer mode button (323-367 px, 8-52 px) sits over the right end of the top bar (12-363 px, 8-104 px). The owner rule for this Objective (2026-10-19: "Panels need to avoid collisions and need to be mobile friendly out the gate") and T-099's repair evidence promise no overlap between shell panels at phone and laptop sizes.

## Evidence

`docs/evidence/o025-check-full-20261019T112609Z/moon-panel.log`.

## Proof Needed

Either the top bar and the Developer button no longer overlap at 375x667, 390x844, 1280x720 and 1440x900, or, if the button is deliberately part of the top bar, the top bar reserves its space so no content sits under it and the assertion treats it as one area with that reason recorded. Then `browser-moon-panel.mjs` passes end to end (every viewport, search, highlight, focus), zero console errors.
