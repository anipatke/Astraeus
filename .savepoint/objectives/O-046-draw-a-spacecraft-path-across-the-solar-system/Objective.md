---
id: O-046
title: Draw a spacecraft path across the solar system
status: done
depends_on: []
release: G-013
priority: high
---

# O-046: Draw a spacecraft path across the solar system

## Outcome

A recorded path (`addTrajectory`) can be drawn as an interplanetary journey: it can sit in a Sun-centred scene beside enlarged planets, its line can be fixed to any body in the scene (the Sun for a probe, the scene centre by default), its positions can be given in the ecliptic plane that JPL Horizons publishes, a scene can open on the enlarged "Solar system" scale, and the path's own label shows at its marker at any distance. The Voyager app's three workarounds (an Earth-first scene for the path, a second Sun-first scene for enlarged planets, rotating every sample to equatorial) can all be removed.

## Why

G-013, priority finding I-096 plus I-097, I-098 and I-100 from the Voyager app (owner, 2026-10-30). The O-042 decision to refuse a path in a Sun-centred scene "rather than half-supported" (`src/api/scene.ts:504`) is now the blocker a real consumer hit. The engine already has the pieces: an inertial (Sun-fixed) trail rule beside the relative one (`src/app/pathRules.ts`, `PathRule` in `src/app/experienceDefinition.ts:100`), a `plane` option on `addGroup` (`src/api/group.ts:58`), and the "solar-system" scale choice (`scaleChoicesOf`, `src/api/scene.ts:692`).

## Success Conditions

Settled with the owner, 2026-10-30 (planning session o046-planning-20261030; three decisions, then "Yes, write the steps"; standing owner rule the same day: always prefer the long-term strategic fix over a short-term one):

- **Paths in Sun-centred scenes (I-096, must).** `addTrajectory` is accepted in a scene whose first body is the Sun (the `bad-trajectory` refusal goes); a Sun-centred path's line then stays fixed against the Sun while time plays, and the "Solar system" scale is offered beside it when a body is enlarged. Earth-centred scenes (Apollo 11, hello-scene) draw exactly as before.
- **Line fixed to any body (owner: "Also a per-path choice"; strategic form).** A path option `lineFixedTo` names the body its line is drawn against: any body in the scene, default the scene centre (today's behaviour). `"sun"` in an Earth-centred scene gives a Sun-fixed line; a body not in the scene throws `bad-trajectory` naming the field. One general line rule in the presentation layer, not a Sun special case. The README states the rule.
- **Path frame (I-097).** The README and `TrajectorySampleInput` state that positions and velocities are equatorial J2000 (EQJ) about `center`; a path option `plane: "EQJ" | "ecliptic-j2000"` (same words as `addGroup`'s `plane`; default `"EQJ"`, today's behaviour) rotates ecliptic input once where samples are read, in the state layer, so `stateOf` and drawing agree (ARCH-02).
- **Open on enlarged planets (I-098).** `solarSystemScale` is exported beside `trueScale` and `readableScale` and accepted by `setScale`; it is valid only in a Sun-centred scene with an enlarged body (else `bad-scale` saying why), and the viewer can still switch to true scale unless `{ only: true }`. The `ScalePolicy` doc is left for I-104 unless the change makes it true.
- **Path labels (I-100).** A path's label shows at its marker and follows `setSwitches({ labels })`, at any distance the scene's scale makes reasonable: label reach is derived from the scene (as it is for bodies: unlimited in a Sun-centred scene, the camera reach otherwise) instead of the fixed `labelMaxDistance: 4` on path items (`src/api/scene.ts:590`), unless the investigation finds a different cause, which is then recorded.
- **Proof.** Each change proven on a made-up configuration (ARCH-03): a made-up probe on a made-up two-planet transfer, Sun-centred and Earth-centred. Tests show the line's drawn points do not move with time when fixed to the Sun, the marker meets the target planet at the flyby time within the sampling error, ecliptic and pre-rotated EQJ input give the same `stateOf`, and the label's visibility rules. `npm run check:node-consumer` exercises a Sun-centred path on the packed package. One `npm run check:browser` gains a Sun-centred path case. **One owner look on `localhost:5490`** at the end, before the Full Objective Check (owner, 2026-10-30).
- **Documentation.** README rows, doc comments (API reference page), CHANGELOG `Unreleased`, the `hello-scene` example or a README example showing a Sun-centred path; Design reconciled.

## Architectural Considerations

Additions go through `packages/astraeus/src/api/` as a thin layer over the engine (O-036 decision). ARCH-01 (no mission names: the fixture is a made-up probe), ARCH-02 (the frame rotation happens in State, never in presentation; scale and line rule never change State), ARCH-03, ARCH-04, ARCH-05, PROV-01. The line rule is one generalised `trail` rule: `relativeTrailKm` already shifts samples from the path's centre to the scene centre at each sample's time; fixing the line to another body generalises the target of that shift (the scene centre case and the inertial Sun case become instances of it), so `TrackedBodyView.pathRule` stops being a fixed constant. Probe data stays out of the engine.

## Boundaries

**In scope:**
- I-096, I-097, I-098, I-100 as above; their README, CHANGELOG, API reference and example lines.

**Out of scope:**
- I-099 (host reads or sets the time), I-101 (interpolation docs and bend warning), I-102 (public planet loader), I-103, I-104, I-105, I-106, I-107: stay open for a later Objective.
- Any Voyager, Pioneer or New Horizons data; publishing a release.
