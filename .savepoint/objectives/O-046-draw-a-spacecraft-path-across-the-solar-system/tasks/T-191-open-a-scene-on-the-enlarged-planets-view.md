---
id: T-191
title: Open a scene on the enlarged planets view
objective: O-046
status: done
depends_on: [{task: T-190, requires: clear}]
owner_validation: {required: false}
check_waiver:
  task: T-191
  reason: 'Owner said "orchestrate O-46"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o046-run-20261030}
  recorded_at: '2026-10-30T20:55:18Z'
planned_by: {role: planner, session: o046-planning-20261030}
---

# Open a scene on the enlarged planets view

## Outcome

`solarSystemScale` is exported beside `trueScale` and `readableScale` and accepted by `setScale`, so a Sun-centred scene with an enlarged body can open on the "Solar system" view (I-098).

## User Check

Not owner-facing on its own.

## Done When

- `setScale(solarSystemScale)` in a Sun-centred scene with an enlarged body opens on it; the viewer still offers true scale second unless `{ only: true }`.
- In any other scene `toDefinition` throws `bad-scale` saying the Solar system scale needs a Sun-centred scene with an enlarged body.
- The scale is one engine scale policy (a real `ScalePolicy` the viewer uses), not a string special case in the API, so `scaleChoicesOf` and the viewer share it; if that is not possible without a design change, return REPLAN REQUIRED.
- `setScale`'s error message names all three scales; made-up tests for opening, the second choice and the refusals; README `setScale` row, doc comment, API reference entry, CHANGELOG line.
- Note in Technical Evidence whether the `ScalePolicy` "apps may supply their own" doc (I-104) is now true or still not; do not fix I-104 here.

## Context Files

`packages/astraeus/src/api/scene.ts` (`SCALES`, `setScale`, `scaleChoicesOf`), `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/core/scalePolicy.ts`, `packages/astraeus/tests/publicApiSunOrbits.test.ts`, `packages/astraeus-site/tools/site/api-reference.mjs`, `packages/astraeus/README.md` (`setScale` row).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Find where the viewer builds the "solar-system" scale today; make it an exported policy.
3. Accept it in `setScale` with the scene check in `toDefinition`.
4. Tests, docs.

## Boundaries

No new scales; no change to how enlargement is drawn.

## Technical Verification

Focused tests while iterating; configured gates at hand-off. No browser run. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Per criterion:
- `setScale(solarSystemScale)` opens a Sun-centred enlarged scene on it; true scale second unless `{ only: true }`: test "opens a Sun-centred scene..." in publicApiSunOrbits.test.ts (choices `["solar-system","true-scale"]`, `["solar-system"]`, and true-first still `["true-scale","solar-system"]`).
- Other scenes: `toDefinition` throws `bad-scale` naming the Solar system scale needs a Sun-centred scene with an enlarged body (no enlargement; non-Sun scene), tested.
- One policy: `solarSystemScale` (core/scalePolicy.ts, built by the existing `createSolarSystemScale`, id "solar-system") is exported from api/index.ts and added to `SCALES`; `scaleChoicesOf` uses it instead of the string. No design change. The viewer (App.tsx) still builds its working policy with the same factory from the scene's override factors and selects it by the same id; the exported one enlarges nothing itself (factors come from the scene). App.tsx not changed.
- Error message names all three scales (tested); README row, setScale doc comment, API reference list (api-reference.mjs adds solarSystemScale to "Scale and state"), CHANGELOG line done.
- I-104 (ScalePolicy "apps may supply their own" doc): still not true; not fixed. Policy lookup stays id-based in the viewer (scalePolicyFor) and setScale refuses unknown ids.

Commands: npm run lint (clean after moving the check to private `#checkSolarSystemScale`, since toDefinition hit complexity 21), npm run typecheck (clean), npm run build (ok), npm test (145 files, 1899 passed, 1 skipped). No browser run.
Files read: Context Files plus src/shell/scaleModel.ts and src/app/App.tsx (extra reads: locate where the viewer builds the solar-system policy). Changed: src/core/scalePolicy.ts, src/api/index.ts, src/api/scene.ts, tests/publicApiSunOrbits.test.ts, README.md, CHANGELOG.md, packages/astraeus-site/tools/site/api-reference.mjs.
Limitations: viewer draw of the opened scale not browser-checked; the API reference rendering was not regenerated or checked.

## Drift Notes

Record for the last step's Design reconciliation. Scale choices: `solarSystemScale` is now a public exported policy (shared id with the viewer's per-experience policy); Design Interfaces note may need the new export named.
