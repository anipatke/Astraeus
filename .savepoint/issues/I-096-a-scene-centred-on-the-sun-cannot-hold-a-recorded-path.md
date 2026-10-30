---
id: I-096
title: 'A scene centred on the Sun cannot hold a recorded path, so interplanetary paths cannot be drawn fixed to the Sun'
type: other
status: resolved
source:
  kind: report
  actor: {role: owner, session: voyager-feedback-20261030}
  at: '2026-10-30T20:08:15Z'
escalated_to: O-046
resolution:
  disposition: escalated
  actor: {role: planner, session: o046-planning-20261030}
  at: '2026-10-30T20:40:00Z'
  reason: Repair promoted into O-046 (owner-confirmed plan, 2026-10-30).
severity: high
history:
  - at: '2026-10-30T20:08:15Z'
    actor: {role: planner, session: voyager-feedback-20261030}
    kind: observed
    note: 'Reported from the Voyager downstream app (astraeus@0.3.0 from npm, public API only, JPL Horizons data), pasted by the owner.'
  - at: '2026-10-30T20:40:00Z'
    actor: {role: planner, session: o046-planning-20261030}
    kind: escalated
    note: 'Promoted into O-046 (Draw a spacecraft path across the solar system), G-013.'
---

# I-096: A scene centred on the Sun cannot hold a recorded path, so interplanetary paths cannot be drawn fixed to the Sun

## Summary

Priority finding. `addTrajectory` is refused in a Sun-first scene, so an interplanetary path (launch planet to target planet, measured from the Sun) cannot be drawn. The only workaround, an Earth-first scene, draws the line relative to the scene centre at each sample's own time, so a Sun-measured path appears as its track seen from Earth and slides as Earth orbits: right for Apollo, wrong for any interplanetary story. Because the enlarged "Solar system" scale is offered only in a Sun-first scene, no scene today can show a path and enlarged planets together; the downstream app needs two scenes.

## Evidence

- Reported call: `new Scene().addBody(sun).addBody(earth).addTrajectory({ id: "probe", center: "sun", samples }).toDefinition()` throws SceneError `bad-trajectory`: `addTrajectory("probe"): a scene centred on the Sun cannot hold a tracked path yet; centre the scene on Earth or another body`.
- Confirmed in code: `packages/astraeus/src/api/scene.ts:504` throws it; `scene.ts:501` documents the rule.
- Confirmed in code: `packages/astraeus/src/app/TrackedBodyView.ts:80` fixes `pathRule` to `{ kind: "trail", frame: "relative" }`. An `inertial` trail rule already exists (`src/app/experienceDefinition.ts:100`, `src/app/PathView.ts:102`, `inertialTrailKm` in `src/app/pathRules`).
- Reporter's fix (must): allow `addTrajectory` in a Sun-first scene, at least for `center: "sun"`. Nice to have: let a path choose the body its line is fixed to (for example a `lineFrame` option, or default to the path's own `center`), and document the current "relative to the scene centre" rule.
- Downstream workaround in place: Earth-first scene for the path plus a second Sun-first scene for enlarged planets.

## Proof Needed

- A Sun-first scene with enlarged planets and a heliocentric `addTrajectory` path builds without error and offers the "Solar system" scale.
- While time plays, the path's line stays fixed against the Sun (it does not slide with Earth).
- The probe's marker meets the target planet at the flyby time (closest-approach distance from `stateOf` within the sampling error).
- Existing Earth-centred paths (Apollo 11) draw exactly as before.
- The README states which body a path's line is fixed to.
