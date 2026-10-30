---
id: T-191
title: Open a scene on the enlarged planets view
objective: O-046
status: planned
depends_on: [{task: T-190, requires: clear}]
owner_validation: {required: false}
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

Pending execution.

## Drift Notes

Record for the last step's Design reconciliation.
