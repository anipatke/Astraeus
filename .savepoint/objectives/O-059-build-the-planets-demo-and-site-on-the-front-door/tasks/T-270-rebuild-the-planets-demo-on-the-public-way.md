---
id: T-270
objective: O-059
title: Rebuild the planets demo on the public way
status: planned
depends_on: [{task: T-269, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
---

# Rebuild the planets demo on the public way

## Outcome

The planets demo builds a `Scene` with public calls only, in source and tests, and every planet keeps what it shows today.

## User Check

`npx vitest run packages/astraeus-demo-planets` passes, and the deep-import count for the demo is 0.

## Done When

`buildPlanetDefinition` is replaced by a scene builder; all nine planets build; provenance and accuracy words are unchanged; Jupiter-only public globs still work; `DEEP_IMPORT_COUNTS` for `astraeus-demo-planets` is 0; tests of engine internals moved to `packages/astraeus/tests/` and pass `check:engine-alone`. The engine's unpacked limit in `tools/check-packs.mjs` is back at 9.5 MB and `check:pack` passes (owner, 2026-11-06: raised briefly at T-267, restored here once the moon lists leave). Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus-demo-planets/src/experiences/planets/planetDefinition.ts`, `packages/astraeus-demo-planets/src/experiences/planets/planetSettings.ts`, `packages/astraeus-demo-planets/src/experiences/planets/planetChoice.ts`, `packages/astraeus-demo-planets/src/experiences/planets/planetSystemParts.ts`, `packages/astraeus-demo-planets/src/experiences/planets/systems/jupiter.ts`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Scene.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, ARCH-01, ARCH-03, ARCH-05, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Compare old and new output planet by planet before removing the old builder. 2. Move each system file to public calls and data packages. 3. Rewrite or move tests. 4. Add the demo to `PUBLIC_API_DEMOS` and lower its count to 0.

## Boundaries

No new look, data or planets. A gap in the public API returns REPLAN REQUIRED rather than a private import.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.
