---
id: I-043
title: The browser driver treats the moons panel's folds as Developer groups, so the Jupiter checks time out
type: defect
status: resolved
source:
  kind: check
  check: C-083
  actor: {role: checker, session: o025-orchestrator-20261019}
  at: '2026-10-19T11:40:00Z'
tasks: [T-099]
checks: [C-083, C-084]
guardrail_ids: [TEST-01, TEST-03]
resolution:
  disposition: verified
  check: C-084
  actor: {role: checker, session: o025-orchestrator-20261019}
  at: '2026-10-19T14:58:00Z'
  reason: 'Developer helpers scoped to [data-developer-panel] in tools/validate/driver.mjs; jupiter-io and embedded pass with zero console errors in the C-084 full run; driver guard test passes. Proven by C-084 (CLEAR).'
history:
  - at: '2026-10-19T11:40:00Z'
    actor: {role: checker, session: o025-orchestrator-20261019}
    kind: observed
    note: 'Full run docs/evidence/o025-check-full-20261019T112609Z: jupiter-io (browser-jupiter-io.mjs:142 moons -> openDeveloper) and embedded (browser-embedded.mjs:93 toggleDeveloper) fail with TimeoutError at tools/validate/driver.mjs:439, waiting for [data-fold-toggle] first() to be visible; it resolves to the hidden moons-panel fold data-fold-toggle="moons-inner" (T-099 reuses Collapsible, which writes data-fold-toggle).'
    check: C-083
  - at: '2026-10-19T14:19:43Z'
    actor: {role: executor, session: o025-repair-20261019}
    kind: repair_attempted
    note: "Developer helpers in tools/validate/driver.mjs (expandDeveloperGroups, developerGroupOpen, developerGroups, toggleDeveloper, toggleDeveloperGroup, openDeveloperGroup) now scope to [data-developer-panel] (new hook on the shell's developer aside, src/shell/AstraeusShell.tsx). Also fixed in the driver: moon toggle selected by aria-controls (was ambiguous), focusedOn no longer opens the phone controls drawer (it closed the info sheet), featureCollisions waits up to 2 s for panels to settle, new featureMarkerPressed readout. browser-jupiter-io.mjs phone/small-phone coverage views adjusted (narrow view crops limbs; timeline covers lower third). Results: browser-jupiter-io.mjs exit 0, browser-embedded.mjs exit 0, zero console errors; npm run typecheck, npm test (1122 passed, 1 skipped) and git diff --check clean. Evidence docs/evidence/o025-repair-20261019T114109Z/. Awaiting independent Check."
  - at: '2026-10-19T14:58:00Z'
    actor: {role: checker, session: o025-orchestrator-20261019}
    kind: rechecked
    note: 'Developer helpers scoped to [data-developer-panel] in tools/validate/driver.mjs; jupiter-io and embedded pass with zero console errors in the C-084 full run; driver guard test passes. Proven by C-084 (CLEAR).'
    check: C-084
---

# I-043: The browser driver treats the moons panel's folds as Developer groups

## Summary

`expandDeveloperGroups`, `developerGroupOpen`, `developerGroups` and `toggleDeveloper` in `tools/validate/driver.mjs` select every `[data-fold-toggle]` on the page. Since T-099 the moons panel's family folds use the same shared `Collapsible`, so on the Jupiter page the first match is a hidden moons fold and the wait times out; `expandDeveloperGroups` would also click the moons folds open, lighting families in the scene during unrelated checks.

## Evidence

`docs/evidence/o025-check-full-20261019T112609Z/jupiter-io.log` and `embedded.log`: `locator.waitFor: Timeout 10000ms exceeded ... locator resolved to hidden <button ... data-fold-toggle="moons-inner">`. Driver lines 437-452.

## Proof Needed

The Developer helpers scope to the Developer panel only (a `[data-...]` container readout, per the driver guard); `browser-jupiter-io.mjs` and `browser-embedded.mjs` pass with zero console errors; the driver guard test passes.
