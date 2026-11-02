---
id: I-138
title: The listener scan does not cover the selection part
type: defect
status: resolved
source:
  kind: check
  check: C-141
  actor: {role: checker, session: o054-check-20261101}
  at: '2026-11-01T09:55:00Z'
tasks: [T-244, T-247]
checks: [C-141, C-142, C-143]
guardrail_ids: [TEST-01, API-02]
severity: low
resolution:
  disposition: verified
  check: C-143
  actor: {role: checker, session: o054-recheck2-20261102}
  at: '2026-11-02T08:33:00Z'
history:
  - at: '2026-11-01T09:55:00Z'
    actor: {role: checker, session: o054-check-20261101}
    kind: observed
    note: 'Found by the O-054 Full Objective Check (C-141) on ad3d724b. Planted break B made ViewerSelection.publish loop over its own listeners instead of calling callListeners. The whole fast suite still passed: its only failures were 3 packagePacks cases, which pass on a clean re-run and have nothing to do with listeners. The shipped code is correct today; the guard is missing.'
    check: C-141
  - at: '2026-11-01T11:00:00Z'
    actor: {role: executor, session: o054-repair}
    kind: repair_attempted
    note: 'Repair (executor, o054-repair): the scan in listeners.test.ts now takes every src/api/*.ts that holds a listener set (except listeners.ts) by rule, asserts the known parts are in it (clock, zones, selection, camera) so the rule cannot go empty, forbids a loop or forEach over the set, and requires callListeners( in each part with an add(listener) set. Added link-level case: a throwing onSelect listener does not stop the next one, reportError receives the error (3 reports), plus the cause naming. Planted break B re-run (viewerSelection.publish looping its own listeners): listeners.test.ts fails 2 cases (the scan names viewerSelection.ts, and the link case); restored by copy, git diff shows only the doc-comment edit. Gates as for I-137 (npm test 191 files, 2339 passed). Not a Check; the Issue stays open for a checker.'
  - at: '2026-11-01T10:10:00Z'
    actor: {role: checker, session: o054-recheck-20261101}
    kind: rechecked
    note: 'Recheck C-142 (NEEDS WORK, for I-137) at HEAD 9f5a726d: Proof Needed met. The scan set is derived (viewerCamera, viewerClock, viewerLink, viewerSelection, viewerZones) with the known four guarded; planted break B (for-of loop in ViewerSelection.publish) fails 2 listeners.test.ts cases (scan names viewerSelection.ts; the throwing-onSelect link case); variant [...this.#listeners].forEach fails the callListeners( requirement and the link case; both restored, git diff --quiet. Left open only because C-142 is NEEDS WORK; verified closure goes with the CLEAR Check, as for I-049/C-092.'
    check: C-142
  - at: '2026-11-02T08:33:00Z'
    actor: {role: checker, session: o054-recheck2-20261102}
    kind: rechecked
    note: 'Recheck C-143 (CLEAR) at HEAD 46d73ad0: repair unchanged since C-142, where Proof Needed was met. Planted break B (for-of loop in ViewerSelection.publish) re-run: listeners.test.ts + lifecycle.test.ts 2 failed, 42 passed (scan names viewerSelection.ts; throwing-onSelect link case); restored, git diff --quiet. Verified.'
    check: C-143
---

# I-138: The listener scan does not cover the selection part

## Summary

O-054 Success Condition 4 says a throwing listener "(`onChange`, `onEventZone` and the new signals)" does not stop the others. T-244's Done When says "no part loops over its listeners by itself (a named test or scan fails if one does)".

The scan in `packages/astraeus/tests/listeners.test.ts:91-99` reads a fixed list of files: `viewerClock`, `viewerZones`, `viewerLink`, `viewerViews` and `viewerCamera`. It requires `callListeners(` only in `viewerClock` and `viewerZones`. T-247 added `src/api/viewerSelection.ts`, a fifth host-link part with its own listener set, but did not add it to the scan. No test makes an `onSelect` listener throw. (`onCameraChange` has one in `lifecycle.test.ts` and `viewerLinkPin.test.ts`; `onChange` and `onEventZone` have theirs in `listeners.test.ts` and `lifecycle.test.ts`.)

The shipped `ViewerSelection.publish` does call `callListeners` (`viewerSelection.ts:44`). Checker probe P7, a throwing `onSelect` listener on a real scene, passes: the next listener hears the pick and `reportError` receives the error. So today's behaviour is correct, but nothing would catch a regression.

## Smallest Reproduction

Planted break B (checker, restored with `git checkout --`): in `viewerSelection.ts`, replace `callListeners(this.#listeners, {...})` with `const change = {...}; for (const listener of this.#listeners) listener(change);`.

- `npx vitest run packages/astraeus/tests/listeners.test.ts packages/astraeus/tests/lifecycle.test.ts`: `Tests 42 passed (42)`.
- The whole fast suite: 189 of 190 files pass. The only failures were 3 `packagePacks.test.ts` cases, which pass on a clean re-run (`Tests 9 passed`) and do not involve listeners.
- Expected: a named test or scan fails.

## Proof Needed

- Make the scan cover every host-link part by rule rather than by a fixed list (for example, every `src/api/viewer*.ts` file that declares a `#listeners` set must call `callListeners(` and must not loop over it). A new part can then not escape, as the lifecycle member table already ensures for handle members (Strategic fix first).
- Add a throwing-`onSelect`-listener case: the next listener still hears the change and `reportError` receives the error. It can be a lifecycle case on both paths, or a link-level case as for the camera.
- Re-run planted break B and show that it now fails.
