---
id: T-349
title: Label each moon's orientation with the model that turns it
objective: O-083
status: done
depends_on: [{task: T-344, requires: clear}]
check_waiver: {task: T-349, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: provenance
planned_reads: [packages/astraeus/src/core/body.ts, packages/astraeus/src/core/bodyOrientation.ts, packages/astraeus/src/core/bodies/listedMoonBodies.ts, packages/astraeus/src/core/bodies/planetRecords.ts, packages/astraeus/src/app/catalogueItem.ts, packages/astraeus/tests/scenePin.test.ts, packages/astraeus-demo-planets/src/experiences/planets/planetSettings.ts]
planned_writes: [packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/core/bodies/jupiterMoons.ts, packages/astraeus/src/core/bodies/planetMoons.ts, packages/astraeus/src/core/bodies/io.ts, packages/astraeus-demo-planets/data/planets/jupiter.json, packages/astraeus/tests/jupiterIo.test.ts, packages/astraeus/tests/planetMoonSystems.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/orientationLabels.test.ts]
---

# Label each moon's orientation with the model that turns it

## Outcome

A moon's `orientation` field and its card's orientation sentence describe the model its state source actually runs: the 13 moons turned by IAU rotation records (Io, Europa, Ganymede, Callisto, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton, Charon) say `iau-rotation` with an IAU sentence; moons turned from their orbit (Phobos, Deimos, listed moons) keep `tidal-lock` and its sentence. Label and model come from one record, so they cannot drift apart again (AH-05 part 1; Claude CQ-10, Gemini SCI-03; PROV-01).

## User Check

None visual. Titan's card no longer says "approximate tidal lock … no libration"; Phobos's still does.

## Done When

- `createMoonSystem`'s `mappedMoon` takes the moon's rotation record (optional `rotation` in `MappedMoonFacts`) and returns the definition and its state-source binding together (as `listedMoonBodies.ts` already pairs them), so `orientation` and `orientationLimitations` are set from whether a rotation record drives the binding. No caller passes a rotation separately to `binding(...)` for a mapped moon any more.
- The IAU sentence is written from what `iauOrientation` computes for these records (read `core/bodyOrientation.ts` and one moon record under `data/orbits/` to state whether periodic terms are included); one sentence source per model, no per-moon copies.
- Io: its definition in `io.ts` and its fitted binding (`IO_FITTED_BINDING`, `IO_ROTATION`) come from the same facts; if the mean-element Io trajectory in `io.ts` is still reachable as a state source, record which source the catalogue binds and label for that one; record the finding.
- The planets demo's `data/planets/jupiter.json` drops its restated Io tidal-lock limitation (it overrides the catalogue's sentence with the wrong one); the demo's tests unchanged and green.
- New `tests/orientationLabels.test.ts`: for every built-in catalogue body with a parent, the label matches the model: `iau-rotation` ⇔ its binding was built with a rotation record (or, if not observable, its state orientation equals `iauOrientation` of its record within 1e-9 at two dates), `tidal-lock` ⇔ orbit-derived; and every label's card sentence is the model's sentence. It fails against today's catalogue (show it).
- `tests/jupiterIo.test.ts` line ~31 and `tests/planetMoonSystems.test.ts` line ~58 assert the old wrong label; change only those assertions to the per-moon expected label (record each changed line and why in evidence; setups untouched). Regenerate `tests/fixtures/scenePin.json` with `npx vitest run packages/astraeus/tests/scenePin.test.ts -u` and show the diff holds only the orientation sentences.
- Other existing tests unchanged and green, including `moonLibration`, `mapOrientation`, `moonOrbits`, `listedMoonBodies` and the Apollo `rebuildComparison`.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/bodies/moonSystem.ts` (around `tidalLockNote` line ~161, `trajectory` ~258, `binding`, `mappedMoon` ~302)
- `packages/astraeus/src/core/bodies/jupiterMoons.ts` (lines ~40–58)
- `packages/astraeus/src/core/bodies/planetMoons.ts` (lines ~41–73)
- `packages/astraeus/src/core/bodies/io.ts` (lines ~60–140)
- `packages/astraeus/src/core/bodies/listedMoonBodies.ts` (the definition-plus-binding pattern, lines ~30–43)
- `packages/astraeus/src/core/bodyOrientation.ts` (`iauOrientation`)
- `packages/astraeus/src/core/body.ts` (`OrientationModel`)
- `packages/astraeus-demo-planets/data/planets/jupiter.json` (the `moons.mapped` Io entry)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `Every listed moon addable` and `Core layers and demos`.

## Guardrails

PROV-01, ARCH-05, STYLE-07, STYLE-09, TEST-01..04.

## Implementation Plan

1. Write `orientationLabels.test.ts`; show it failing for the 13 moons.
2. Change `mappedMoon` to take the rotation and return definition plus binding; update the Jupiter, Saturn, Neptune and Pluto moon modules and Io.
3. Write the IAU sentence from the code; drop the demo's override.
4. Correct the two wrong assertions; regenerate the scene pin and review its diff.
5. Focused tests, then gates.

## Boundaries

No change to any orientation computed, to positions, or to which moons have rotation records. No new orientation model. Planet limitations are the next Task's.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/orientationLabels.test.ts packages/astraeus/tests/jupiterIo.test.ts packages/astraeus/tests/planetMoonSystems.test.ts packages/astraeus/tests/scenePin.test.ts packages/astraeus/tests/moonLibration.test.ts packages/astraeus-demo-planets/tests`. Handoff: `quality_gates`. No browser run (card text only; the browser driver does not read limitation text — planner grep of `packages/astraeus-site/tools/validate/` found none; re-check).

## Technical Evidence

### Done When -> evidence

| Done When | Evidence |
|---|---|
| `mappedMoon` takes the rotation record, returns definition + binding together | `moonSystem.ts`: `MappedMoonFacts.rotation?`, `mappedMoon` returns `MappedMoon {definition, binding}`; `orientation`/`orientationLimitations` come from `orientationFacts(rotation)`, the binding from `binding(id, rotation)`. `jupiterMoons.ts`, `planetMoons.ts`, `listedMoonBodies.ts` take both from the result; no caller passes a rotation separately to `binding` for a mapped moon. `orientationLabels.test.ts` (33 tests) green. |
| One IAU sentence per model, written from the code | `orientationFacts` is the only source of both sentences. `iauOrientation`/`iauAnglesAt` apply the record's periodic terms when the record has them (`iauElementsFromRecord` carries `periodicTerms`); records of Io, Europa, Ganymede, Callisto, Mimas, Tethys, Rhea, Titan, Triton have them, Enceladus, Dione, Iapetus, Charon do not (checked `data/orbits/*.json`), so the sentence says "with its periodic terms where the report gives them". |
| Io: definition and binding from the same facts; record which source is bound | `io.ts`: `IO_ORIENTATION = JUPITER_MOON_SYSTEM.orientationFacts(IO_ROTATION)` and `IO_BINDING = JUPITER_MOON_SYSTEM.binding("io", IO_ROTATION)`. Finding: the catalogue binds the fitted source (`IO_BINDING`); the mean-element `createIoTrajectory` is reachable only from tests (`moonOrbits`, `jupiterIo`), not bound. `IO_FITTED_BINDING` and `IO_TIDAL_LOCK_LIMITATION` removed (no other users). |
| Demo drops its Io tidal-lock override | `astraeus-demo-planets/data/planets/jupiter.json`: `knownLimitations` removed from the Io entry; demo tests unchanged and green in the full run. |
| New `orientationLabels.test.ts`, fails on today's catalogue | 33 tests: per moon the label is checked against the observed state (IAU: quaternion within 1e-9 of `iauOrientation` at two 2016 dates; tidal-lock: body +X within 1e-3 deg of the planet direction) and the card sentence equals the model's sentence. Run against HEAD versions of the five source files (copied back after): 29 failed, including the label+state test for all 13 IAU moons (io, europa, ganymede, callisto, mimas, enceladus, tethys, dione, rhea, titan, iapetus, triton, charon). |
| Two wrong assertions corrected | `jupiterIo.test.ts:31` before `expect(IO.orientation).toBe("tidal-lock");` after `toBe("iau-rotation");` (Io has an IAU record and its binding uses it). `planetMoonSystems.test.ts:58` before `toBe("tidal-lock")` after `toBe(["phobos","deimos"].includes(moon.id) ? "tidal-lock" : "iau-rotation")` (only Phobos and Deimos lack a record). Setups untouched. |
| scenePin regenerated, diff only orientation sentences | `scenePin.test.ts -u`: 17 lines changed in `tests/fixtures/scenePin.json`, all `knownLimitations` sentences (Jupiter, Saturn moons to IAU; Io's own sentence to IAU). |
| Other tests unchanged and green | Full run below. |
| Gates | lint, typecheck, build clean; `npm test`: 299 files passed, 4997 tests passed, 2 skipped. |

Files changed: `core/bodies/moonSystem.ts`, `jupiterMoons.ts`, `planetMoons.ts`, `io.ts`, `listedMoonBodies.ts`; `astraeus-demo-planets/data/planets/jupiter.json`; `tests/orientationLabels.test.ts` (new), `tests/jupiterIo.test.ts`, `tests/planetMoonSystems.test.ts`, `tests/fixtures/scenePin.json`. Exports removed: `FITTED_MOON_TIDAL_LOCK`, `IO_FITTED_BINDING`, `IO_TIDAL_LOCK_LIMITATION`, `MoonSystem.tidalLockNote`; `PHOBOS` etc. are still exported as definitions.
Extra reads: `packages/astraeus/src/core/iauRotation.ts` (iauAnglesAt, periodic terms), `data/orbits/*.json` (which records have periodicTerms), `packages/astraeus/src/app/catalogueItem.ts` (card route), `vitest.config.ts` (preloaded project) for the test setup. Browser grep of `packages/astraeus-site/tools/validate/` for tidal/libration/orientation wording: none, no driver migration, no browser run.
Limitations: the IAU sentence is generic across the 13 moons (periodic terms "where the report gives them"); Titan's real optical libration is not in the model, the sentence says libration is only as exact as the model.


## Drift Notes

Mapped moons pair definition and binding from one record of facts (`mappedMoon` returns both; `orientationFacts` owns label and sentence per model). Design.md `Every listed moon addable` / `Core layers and demos` should say so; the Io mean-element trajectory is test-only, not a bound source.

Coordinator (orchestrate-g024-20261121): hand-off gates green (lint, typecheck, build; `npm test` 299 files, 4997 passed, 2 skipped); the two changed assertion lines are the ones the Task names (Objective decision 9). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
