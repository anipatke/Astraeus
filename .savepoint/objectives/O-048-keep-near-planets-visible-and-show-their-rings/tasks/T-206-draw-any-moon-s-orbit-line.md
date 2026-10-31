---
id: T-206
objective: O-048
title: Draw any moon's orbit line
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-206, reason: 'Owner said "orchestrate O48"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o048-run-20261031}, recorded_at: '2026-10-31T08:44:04Z'}
planned_by: {role: planner, session: probe-feedback-2-20261031}
---

# Draw any moon's orbit line

## Outcome

`addBody(moon, { orbit: true })` works for any catalogued moon by one rule, its period from the catalogue's own data and drawn about its planet, instead of a list naming the Moon and Io (I-119).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `ORBITS` (`src/api/scene.ts:85`) is replaced by a rule over the catalogue (ARCH-05: the period read once from the moon's catalogue record or mean elements); the Moon and Io draw exactly as before (test).
- Europa, Titan and a small moon draw their orbit line about their planet; a moon whose data has no period or position source is refused with `no-orbit` at `toDefinition` naming why.
- Where the demos' body-set orbit layer (`src/app/OrbitSetView.ts`) already does this, reuse its drawing rather than adding a second one, or state why the composition path is the right one.
- Tests on a made-up scene; README `addBody` row; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/app/OrbitSetView.ts`, `packages/astraeus/src/core/satelliteMeanElements.ts`, `packages/astraeus/src/core/bodies/moonSystem.ts`, `packages/astraeus/tests/moonOrbits.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Read how the Moon and Io lines are composed and how the body-set layer draws moon orbits.
3. Generalise to one rule; tests; docs.

## Boundaries

No new orbit looks.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executed 2026-10-31 (builder session; no Task Check, no browser run).

Files read: scene.ts (ORBITS, #register, #moonPaths, #sunOrbitIds), compositions.ts, OrbitSetView.ts (period via osculating state over the body set; reuse rejected, see Drift), satelliteMeanElements.ts, moonSystem.ts, io.ts, moon.ts, planetMoons.ts, jupiterMoons.ts, sunOrbit.ts, moonOrbits.test.ts.

Changed: packages/astraeus/src/core/body.ts (optional `orbitPeriodDays`, `orbitLineFades` on the definition); src/core/siderealPeriod.ts (new: period rule and `recordPeriodDays`, moved out of satelliteMeanElements.ts, which re-exports); core/bodies/moon.ts, io.ts, moonSystem.ts (`mappedMoon` takes `orbitPeriodDays`), jupiterMoons.ts, planetMoons.ts (period from each moon's data/orbits record by the record's own period rule); assets/compositions.ts (month from MOON_SIDEREAL_PERIOD_DAYS); api/scene.ts (ORBITS removed; `moonOrbitPath` rule over the catalogue definition); tests/moonOrbitLines.test.ts (new), tests/publicApi.test.ts (message); README addBody row; CHANGELOG Unreleased; tools/check-packs.mjs (astraeus file limit 462 to 464, noted).

Criteria:
- ORBITS replaced by a rule over the catalogue, period read once from the record (ARCH-05): moonOrbitPath; test "draws the Moon and Io exactly as before" asserts the same paths (Moon span SIDEREAL_MONTH_MS, no look; Io span IO_PERIOD_DAYS, endFadeOn false). PASS.
- Europa (3.551 d), Titan and Mimas (small) draw about their planet; test over every catalogue moon with a period; Phobos refused with `no-orbit` at addBody naming the missing period; planet missing refused at toDefinition. PASS (tests/moonOrbitLines.test.ts 4/4).
- Body-set layer reuse: stated in Drift. 
- Tests on a made-up scene (a made-up data source providing all ids); README; CHANGELOG with size line. PASS.

Gates (repo root): npm run lint pass; npm run typecheck pass; npm run build pass; npm test 158 files, 2002 passed, 1 skipped, 0 failed (final run after last change). First download 1,617,005 to 1,617,791 raw (+786), 460,652 to 460,895 gzip (+243).

Not verified: no browser run (by instruction), so the lines of the new moons are not seen drawn; look for non-Moon moons is Io's (closed loop), not reviewed by eye. Phobos and Deimos have no mean-element record and are refused.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- CelestialBodyDefinition gains optional `orbitPeriodDays` (moon's sidereal period about its parent, from its record) and `orbitLineFades`; the scene's orbit-line rule reads them instead of a name list. New core/siderealPeriod.ts holds the period rule apart from the propagator. Deferred to the last step's Design.md reconciliation.
- OrbitSetView (demos' body-set layer) is not reused: it samples a body set's own sources with a per-frame osculating period, in the app layer; the composition path takes one static span at toDefinition, so the catalogue period is the right input there. The two paths are separate by design.
