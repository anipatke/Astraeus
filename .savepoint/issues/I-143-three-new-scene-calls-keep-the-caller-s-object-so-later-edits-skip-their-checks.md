---
id: I-143
title: Three new scene calls keep the caller's object, so later edits skip their checks
type: defect
status: resolved
source:
  kind: check
  check: C-148
  actor: {role: checker, session: o059-check-20261107}
  at: '2026-11-06T19:51:42Z'
tasks: [T-267, T-268]
checks: [C-148, C-149, C-150, C-151]
guardrail_ids: [API-04]
severity: low
resolution:
  disposition: verified
  check: C-151
  actor: {role: checker, session: o059-recheck3-20261106}
  at: '2026-11-06T22:01:22Z'
  reason: 'C-151 CLEAR: the five C-150 scenarios hold on addBody and addBodyFromElements through public calls; 1436 one-leaf edits over 25 rows run; removing either options copy fails its rows, and leaving only readouts uncopied fails the one-leaf row. Browser not re-run (owner decision).'
history:
  - at: '2026-11-06T19:51:42Z'
    actor: {role: checker, session: o059-check-20261107}
    kind: observed
    note: 'Full Objective Check matrix, input axis "mutation after validation".'
    check: C-148
  - at: '2026-11-07T07:05:00Z'
    actor: {role: executor, session: o059-repair-20261107}
    kind: repair_attempted
    note: 'Repair: new api/frozenCopy.ts (deep frozen copy of plain data, lists, dates and typed arrays; providers and class instances kept). addPlaces, setMoonPanel and addBodySet now keep a frozen copy at the call, as setPicker does. The general test tests/sceneInputCopies.test.ts (55 cases: 18 object-taking Scene calls, each input alone, edit-after-call and one object for two scenes) also caught addTrajectory (provenance, anchors, samples), addGroup, addStoryPanels, setTimeline and setScale (kept the caller''s object); all fixed the same way (setScale keeps the library scale). Four existing tests that asserted provenance identity (toBe) now compare by value. Mutations: removing each of the three copies fails its two rows; making frozenCopy the identity fails 14 rows (7 calls x 2). Gates: lint, typecheck, build, npm test (227 files, 2999 passed), check:engine-alone, check:pack pass. Unverified: check:browser not run; the recheck runs it.'
    check: C-148
  - at: '2026-11-06T20:15:58Z'
    actor: {role: checker, session: o059-recheck-20261106}
    kind: rechecked
    note: 'C-149 NEEDS WORK; stays open. Proven: the five scenarios, every leaf of addBodySet, setMoonPanel and addPlaces edited alone, one object for two scenes, and removing each copy fails its rows. Not proven: the general test. It is a hand-written list, so a scratch setZed that keeps its input passes sceneInputCopies and lifecycle (100 of 100); and addBody and addBodyFromElements keep options.knownLimitations (planBodies.ts:172), a field the row leaves out. Still needed: the table walks Scene.prototype so a call with no row fails, and the addBody row carries knownLimitations with a copy at the call.'
    check: C-149
  - at: '2026-11-06T21:28:36Z'
    actor: {role: executor, session: o059-repair2-20261107}
    kind: repair_attempted
    note: 'Second repair for C-149 (stays open for the recheck). sceneInputCopies.test.ts now walks Scene.prototype and SceneCamera.prototype: a public call with no row fails unless it is on a short named list of calls that keep nothing, each with a reason (stateOf, provenanceOf, load, check, missingData, toDefinition); the list must not hold a mutator-named call, a call that also has a row, or a name that is not a call; the four data-taking listed calls are also tested to keep nothing. Camera rows added for follow, lookAt, setStartView, setFollowChoices, setReach and fitOrbit; the walk caught camera.follow and camera.lookAt keeping the caller''s view object (planCamera.ts), now frozenCopy. addBody and addBodyFromElements rows now set every option (plus a lap-orbit row); options.knownLimitations was kept as given (planBodies.ts), now a frozen copy at the call; no other option leaked. Mutations: scratch Scene.setZed that keeps its input fails the has-a-row test; the same on SceneCamera fails; setZed or addPlaces wrongly added to the keeps-nothing list fails the list test; removing the knownLimitations copy fails 4 rows; removing the camera copy fails 4 rows. Residual: a call wrongly listed under a non-mutator name (a scratch keepZed) is not caught by the walk; only the visible reason guards it. Gates: lint, typecheck, build, npm test (227 files, 3028 passed), check:engine-alone, check:pack pass. check:browser not run.'
    check: C-149
  - at: '2026-11-06T21:43:18Z'
    actor: {role: checker, session: o059-recheck2-20261106}
    kind: rechecked
    note: 'C-150 NEEDS WORK; stays open. Proven: a Scene or SceneCamera call with no row fails the walk, under an add/set name or not; a mutator on the keeps-nothing list fails; removing the knownLimitations or camera copy fails 4 rows each. Not proven: the addBody row. addBody and addBodyFromElements still keep options.readouts (readoutsOf returns its input, planPaths.ts:128, stored at planBodies.ts:161): kind edited to an unknown value or a pushed item skips the call check, a pushed distance row reaches createMetrics, and one object for two scenes makes the first throw bad-readout. The table misses it because scribble edits kind and to together, so the build check skips the entry, and observe prints createMetrics as fn. Every other field of 42 rows holds under 934 single-leaf edits. In scratch one copy in readoutsOf clears all of it. Convergence limit reached: owner chooses fix now, follow-up work or acceptance.'
    check: C-150
  - at: '2026-11-06T21:52:33Z'
    actor: {role: executor, session: o059-repair3-20261107}
    kind: repair_attempted
    check: C-150
    note: 'addBody and addBodyFromElements take one frozenCopy of the whole input at the entry, the same as the other calls; sceneInputCopies edits each leaf alone (1436 edits, 25 rows) and observe calls createMetrics. Owner asked to avoid browser tests this round.'
  - at: '2026-11-06T22:01:22Z'
    actor: {role: checker, session: o059-recheck3-20261106}
    kind: rechecked
    note: 'C-151 CLEAR; closed verified. Proven on plain input, the supported form. Observation, not an Issue: options built as a class or holding a function keep readouts and, since 664da238, knownLimitations as given; no caller or doc builds them so. Browser evidence is from 0925202e.'
    check: C-151
---

# I-143: Three new scene calls keep the caller's object, so later edits skip their checks

## Summary

`Scene.addPlaces`, `Scene.setMoonPanel` and `Scene.addBodySet` check their input and then keep the caller's own object, reading it again when the scene is built. An edit after the call reaches the viewer unchecked, and one object reused for two scenes changes the first scene. API-04 says inputs are checked early, at the call that received them. `Scene.setPicker` (same Objective) and `setLook` already keep a frozen copy.

## Evidence

Violated: API-04 ("typed inputs checked early"; "shape errors throw at the call that received them").

Keeping the object: `packages/astraeus/src/api/planPlaces.ts:68`, `packages/astraeus/src/api/planMoonPanel.ts:60`, `packages/astraeus/src/api/planBodySets.ts:81`. The copy to match: `packages/astraeus/src/api/planPicker.ts:29`.

Smallest scenarios, run through the public calls:

| Scenario | Expected | Actual |
|---|---|---|
| `addPlaces("moon", input)`, then `input.places[0].latitudeDeg = 999` | scene keeps 12, or a typed error | `check()` passes; 999 reaches the definition's `bodyFeatures` |
| `addBodySet(input)`, then `input.members[0].radiusKm = -1` | scene keeps 4 | `check()` passes; `radiusKm: -1` reaches the definition |
| `setMoonPanel(input)`, then `input.label = ""` | scene keeps the label | `check()` passes; empty heading |
| one panel object: label "One", scene a; label "Two", scene b | a shows One | a and b both show Two |
| the same edit on `setPicker` | scene unchanged | scene unchanged |

No test edits an input after these calls.

## Proof Needed

Each of the three calls keeps its own frozen copy at the call, as `setPicker` does. Tests on a made-up scene edit the input after each call (nested lists and items too) and prove the reads, `check()` and `toDefinition` output are unchanged, and that one object reused for two scenes keeps them apart. Under Strategic fix first, also add a general test that walks every object-taking `Scene` call, so a new call cannot keep the caller's object.
