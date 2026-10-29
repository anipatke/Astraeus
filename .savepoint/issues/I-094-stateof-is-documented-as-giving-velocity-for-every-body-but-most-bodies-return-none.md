---
id: I-094
title: stateOf is documented as giving velocity for every body, but most bodies return none
type: defect
status: open
source:
  kind: check
  check: C-120
  actor: {role: checker, session: o045-full-check-20261029}
  at: '2026-10-29T10:34:00Z'
tasks: [T-185, T-188]
checks: [C-120]
severity: low
history:
  - at: '2026-10-29T10:34:00Z'
    actor: {role: checker, session: o045-full-check-20261029}
    kind: observed
    note: 'Found in the O-045 Full Objective Check: T-185 widened stateOf to catalogue and elements bodies, whose state sources give position only; the README row (rewritten in T-188) and the stateOf doc comment still promise velocity for any body.'
    check: C-120
---

# I-094: stateOf is documented as giving velocity for every body, but most bodies return none

## Summary

O-045 widened `Scene.stateOf(id, time)` from `addTrajectory` paths to every body in the scene (T-185). The returned `State` matches what the viewer draws, but for planets, Earth, the Sun, built-in Swift-Tuttle and bodies from `addBodyFromElements` it carries no `velocityKmS` (the field is optional on `State`). Only paths with velocities and fitted moons (Io) return one.

The documentation was widened along with the call but still promises velocity for any body:

- `packages/astraeus/README.md:65` (`stateOf` row, rewritten by T-188): "The state (position km, velocity km/s) of any body in the scene at a moment, for figures a story quotes".
- `packages/astraeus/src/api/scene.ts:381-383` (doc comment, which the API reference page is generated from): "The state of a body in the scene at a moment (position in km, velocity in km/s) ... Figures a story quotes, such as a peak speed or a distance from the Sun, come from here."

A site that follows the README and reads a body's speed gets `undefined` (and `NaN` from any arithmetic on it).

Violated requirement: T-188 Done When "Every README claim matches the code at this commit (no claims for features not shipped)"; O-045 Success Condition "Documentation" (every new call on the API reference page). Guardrail PROV-01 is not involved (no data is shown as more exact than it is); this is a documentation accuracy defect.

## Evidence

- Smallest scenario (C-120 probe, 2026-10-29, HEAD `40a65cc0`, planet series loaded as in `vitest.setup.ts`): `const s = new Scene().addBody(sun).addBody(earth).addBody(moon).addBody("mars").addBody("jupiter").addBody("io").addBody("swift-tuttle").addBodyFromElements(record); s.stateOf(id, Date.UTC(2016, 5, 3, 7, 13, 11, 500)).velocityKmS` for each id. Expected per README/doc comment: a 3-vector in km/s. Actual: `undefined` for earth, moon, mars, jupiter, swift-tuttle and the elements body; a 3-vector for io only. Positions equal the viewer's resolver exactly (0 km difference), so position behaviour is correct.
- No test covers velocity from `stateOf` for a catalogue body; `tests/stateOfBodies.test.ts` checks position and centre only.

## Proof Needed

- The README `stateOf` row and the `stateOf` doc comment say which bodies return velocity (for example: position always; velocity where the source gives it, such as a path sampled with velocities or a moon from its fits; not for planets, the Sun, the built-in comet or elements bodies), or the engine returns velocity for those bodies and a test proves it for a catalogue body and an elements body.
- If the doc route is taken, "such as a peak speed" no longer implies a body's speed is available, or names paths as its source.
- Hand-off gates green, including the API reference doc-comment test (`packages/astraeus-site/tests/apiReference.test.ts`).
