---
id: T-216
title: Pick the stretches automatically by sphere of influence
objective: O-050
status: done
depends_on: [{task: T-213, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-216, reason: 'Owner said "orchestrate O50"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o050-run-20261101}, recorded_at: '2026-10-31T21:24:21Z'}
planned_by: {role: planner, session: probe-switch-20261101}
---

# Pick the stretches automatically by sphere of influence

## Outcome

`lineFixedTo: "auto"` builds a path's stretches from its own samples. Each sample's line is fixed to the innermost body in the scene whose sphere of influence holds the probe, else the scene centre. Any flyby or orbiter is then one path without the app working out switch times (I-125, automatic half).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `"auto"` resolves to the same stretch list the previous step draws, so drawing, menu and follow need no second path.
- Sphere of influence of a body about its parent: `r = a (m / M)^(2/5)`, from the GM of the body and its parent in the one catalogue definition (ARCH-05). `a` is the body's distance from its parent at the sample time. Innermost wins (a moon inside its planet's sphere). Consecutive samples on one body merge.
- Bodies without a GM are skipped and the API comment says so. Where a body the rule needs is missing, a test records which built-in bodies lack a GM. Adding GMs for planets with a cited source is in scope; moons without a published GM are not.
- Stretches resolve once when body states are available (`prepare`/`mount`), never per frame. A scene that cannot resolve them (body data missing) fails with today's named error.
- No body is named in the rule (ARCH-01, ARCH-06). Tests on made-up configurations: a synthetic flyby enters and leaves a planet's sphere (boundary within one sample of the analytic crossing); a Moon orbit in an Earth-centred scene resolves to the Moon; a path far from everything stays on the scene centre.
- README and API comment; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts` (TrajectoryBase, `#buildTracked`), `packages/astraeus/src/app/mission.ts`, `packages/astraeus/src/core/body.ts`, `packages/astraeus/src/core/bodies/earth.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Confirm the previous step's stretch list exists; return REPLAN REQUIRED if not.
3. Audit which catalogue bodies carry a GM; add missing planet GMs with sources.
4. Implement the sphere-of-influence resolution as one pure function with tests, then wire `"auto"`.
5. README, CHANGELOG.

## Boundaries

No per-frame frame switching, no hysteresis tuning beyond merging, no new moon GMs without a published source, no app or demo changes.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built (stage build to audit), 2026-11-01:

- New `packages/astraeus/src/api/sphereOfInfluence.ts`: pure `sphereOfInfluenceKm` (a (m/M)^(2/5); NaN where a GM is missing), `innermostHolding` (smallest sphere wins), `influenceStretches` (merge runs, a stretch opens at its first sample and closes where the next run opens or at the last sample; unheld samples uncovered). No body names.
- `scene.ts`: `lineFixedTo: "auto"` stored as `Tracked.auto`; `#autoStretches` builds candidates from the scene's bodies (root body holds everything; a body with parent GM and own GM from the catalogue definition, ARCH-05; others skipped) and `#autoPaths` resolves once into the same `TrackedBody.lineFixedTo` list: in `toDefinition` when the planet series are loaded, else in `prepare` after `loadPlanetSeries`, through `#deferredRead`/`#planetRead` (today's out-of-span/missing-data errors). Nothing runs per frame; drawing, menu and follow read the unchanged LineStretch list.
- `tools/check-packs.mjs`: astraeus file-count limit 470 to 472 (one new module and its declaration), comment extended per the file's convention.
- README (addTrajectory row) and CHANGELOG Unreleased line.
- GM audit: every built-in planet, the Sun, the Moon and all built-in moons carry a GM; only `swift-tuttle` (comet) lacks one (test records it). Moons added by id from the moon lists carry none and are skipped. No GMs added, so no new sources.
- Tests: `packages/astraeus/tests/publicApiAutoStretches.test.ts` (9): formula, NaN, merge/innermost, synthetic flyby crossing within one sample of the analytic radius (Sun, Mars, Sun), Moon orbit in Earth scene resolves to the Moon, far path stays uncovered, auto equals the explicit list, GM audit.

Gates: `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test` 166 files passed, 2057 passed, 1 skipped (first run failed packagePacks file count 472 over 470, fixed by the limit change above). No browser run.


Follow-up (coordinator gaps), same day: added three tests to `publicApiAutoStretches.test.ts` under "when the planet series load after the scene is built" (fresh module registry so the series are not loaded; real `prepareScene` and `prepare`): resolves in prepare to the explicit form's list and the object menu (one entry), `trackedBodiesOf` and `TrackedBodyView` input carry the resolved stretches; an auto path dated outside the planet series fails with `out-of-span` in prepare (late-load and already-loaded instances). Before prepare the tracked `lineFixedTo` is undefined (not "auto"); the viewer (`mount`, `AstraeusScene`) renders only after `ready`, so it never reads that. `out-of-span` is the named error the existing setup reads give; the auto resolution adds no new error. Gates rerun: lint clean, typecheck clean, `npm test` 166 files passed, 2060 passed, 1 skipped. Stage stays audit.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- `api/sphereOfInfluence.ts` is a new pure module beside `pathProvenance.ts`; `"auto"` resolves in `Scene.toDefinition`/`prepare` (like the Sun paths and fit distance) into the same `lineFixedTo` list. Design.md Interfaces and Data Flow: add "auto" resolution, the root-body-holds-everything rule, and GM-less bodies skipped. `tracked` (trackedBodies) entries are replaced in `prepare` when the series load late.
- Moons added by id (listed moons) have no GM, so they cannot hold a probe; Pluto/Charon and other main moons can.
