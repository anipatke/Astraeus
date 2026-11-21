---
id: T-349
title: Label each moon's orientation with the model that turns it
objective: O-083
status: planned
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

Pending execution.

## Drift Notes

Record for Design reconciliation: mapped moons pair definition and binding from one record.
