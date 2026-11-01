---
id: T-233
title: Move body planning out of the scene builder
objective: O-058
status: planned
depends_on: [{task: T-232, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o058-planning-20261101}
---

# Move body planning out of the scene builder

## Outcome

Everything `Scene` does to plan its bodies lives in `packages/astraeus/src/api/planBodies.ts`; `addBody`, `addBodyFromElements` and the body parts of `toDefinition` call it (O-058 Success Condition 2, bodies).

## User Check

Not owner-facing: an internal refactor with no change a host or visitor can see. The owner sees the result at the end of the Objective.

## Done When

- `planBodies.ts` holds: registering a body and its options (`#register`, `checkBodyLook`, `checkLabelReach`, the option maps for orbits, looks, shape, notes, label reaches and own elements), listed moons (`#addListedMoon`), elements records (`parseRecord`), the moon and Sun orbit lines (`moonOrbitPath`, `#moonPaths`, `#sunOrbitIds`, `#sunPath`, `#earlySunPaths`), the label rule (`#labelReach`), the body's shell item (`#bodyObject`), enlargements (`visualOverridesEntry`, `#enlargedInSun`, `#checkSolarSystemScale`, `#checkSunCentred`) and data needs (`missingData`'s rule, `#checkData`). `Scene.missingData` stays a public method with the same signature, delegating.
- `grep -nE "function (moonOrbitPath|checkBodyLook|parseRecord|visualOverridesEntry)|#register|#bodyObject|#sunPath" packages/astraeus/src/api/scene.ts` finds nothing; `planBodies.ts` is at most 300 lines.
- **Nothing public moved:** `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/` is empty (lock, every O-053 allowlist and `DEEP_IMPORT_COUNTS` unchanged), and `git diff --name-only --diff-filter=M main -- '*.test.ts' '*.test.tsx'` is empty (no existing test edited). `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Same output:** `npx vitest run packages/astraeus/tests/scenePin.test.ts` passes without `-u`, and `git status` shows `packages/astraeus/tests/fixtures/scenePin.json` unmodified.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/planPaths.ts`, `packages/astraeus/src/api/bodies.ts`, `packages/astraeus/src/api/sunOrbit.ts`, `packages/astraeus/src/api/data.ts`, `packages/astraeus/src/app/catalogueItem.ts`, `packages/astraeus/tests/scenePin.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-058 Objective under `Architectural Considerations` (planned module layout).

## Guardrails

API-01, API-05, ARCH-05, ARCH-06, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Move code as-is: same function bodies, same `SceneError` codes and message text, same order of checks and of definition fields. No new public member on `Scene` or `SceneCamera` (the lock records them); planners take what they need as arguments or through internal objects. Public input types, `TrajectoryBase` and `stateOf` stay in `scene.ts` (O-053 allowlist entries are keyed to that file). New modules sit flat in `packages/astraeus/src/api/` so the O-053 scans read them. No CHANGELOG entry.
3. Move the body functions and option maps into one internal body plan the `Scene` holds; the scene's catalogue (which `addBody` and `addBodyFromElements` extend) moves with it or is passed in, as fits.
4. Run the pin, the O-053 tests and the gates.

## Boundaries

Bodies only. `stateOf`, `provenanceOf` and their helpers (`#catalogueSource`, `#sunState`) stay in `scene.ts`. No behaviour, message or public change.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: each Done When item with its command and result, files read and changed, and limitations.

## Drift Notes

Record any architecture delta here and name the last Task of O-058 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
