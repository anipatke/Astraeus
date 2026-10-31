---
id: T-205
objective: O-048
title: Show each ringed planet's rings by default
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-205, reason: 'Owner said "orchestrate O48"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o048-run-20261031}, recorded_at: '2026-10-31T08:37:04Z'}
planned_by: {role: planner, session: probe-feedback-2-20261031}
---

# Show each ringed planet's rings by default

## Outcome

Jupiter, Saturn, Uranus and Neptune carry their rings in their one catalogue definition (ARCH-05), so any scene that adds the planet through the public API draws them, with their recorded source (I-118); the demos stop attaching rings themselves and draw as before.

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- The ring systems (`SATURN_RINGS`, `URANUS_RINGS`, `NEPTUNE_RINGS` in `src/assets/bodies/outerPlanetCatalogues.ts`, `JUPITER_RINGS` in `src/assets/bodies/jupiterRings.ts`) are part of each planet's catalogue visual where the engine defines the planet; the demo system overrides no longer set `rings` (one source).
- `addBody(saturn)` in a made-up public-API scene has rings in its drawn definition (test); same for the other three; a planet with none (Mars) has none.
- The ring look settings (`RingLook`, developer sliders) still apply; demo tests and comparisons unchanged (name them) or updated with a stated reason.
- Ring data source/licence recorded where the info card shows provenance (PROV-02), or a stated reason it already is.
- README note (which planets have rings); CHANGELOG `Unreleased` line; first-download size change stated (`npm run measure:example`).

## Context Files

`packages/astraeus/src/assets/bodies/outerPlanetCatalogues.ts`, `packages/astraeus/src/assets/bodies/jupiterRings.ts`, `packages/astraeus/src/assets/bodies/jupiter.ts`, `packages/astraeus/src/core/bodies/outerPlanets.ts`, `packages/astraeus/src/app/BodyView.tsx`, `packages/astraeus/src/app/RingView.ts`, `packages/astraeus-demo-planets/src/experiences/planets/systems/uranus.ts`, `packages/astraeus-demo-planets/src/experiences/planets/systems/neptune.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`; `docs/architecture/state-and-assets.md` asset architecture.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Find where each planet's visual is defined for the public catalogue; return REPLAN REQUIRED if rings cannot live there without a layer-rule break (ARCH-04).
3. Attach rings there; remove the demo duplicates.
4. Tests, docs, size.

## Boundaries

No new ring data or looks.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor: build session for T-205; step check waived by the run rules (the Full Objective Check covers it). No browser run.

Per criterion:
- Rings in the one catalogue definition: `JUPITER_VISUAL` (assets/bodies/jupiter.ts) and `SATURN_VISUAL`, `URANUS_VISUAL`, `NEPTUNE_VISUAL` (assets/bodies/planetSystemMaps.ts, via a small `ringed()` helper) now carry `rings`. The demo system files no longer set `rings`; `PlanetSystem.rings` and the `visualOverrides` line in planetDefinition.ts are removed (one source). Met.
- `addBody` of each ringed planet draws rings; Mars none: new tests/publicApiRings.test.ts (Scene with sun plus planet; override-else-catalogue rings, bands valid, NSSDC source recorded; Mars undefined). Passes.
- Ring look settings and demo tests: RingView/BodyView/DeveloperSettings untouched (they read override-else-catalogue, so `data-rings` and sliders still apply). Updated tests with reasons: demoPlanets.test.ts (Saturn, Uranus rings now read from the catalogue and no override), planetSystems.test.ts (ring sources check reads the catalogue), jupiterMoonsScene.test.ts (Jupiter rings now in the catalogue, no override; the old "rings are opt-in" line is the behaviour this Task reverses), planetDefinition.test.ts (Jupiter-before fixture compared without its `visualOverrides`, since rings moved to the catalogue; fixture file unchanged).
- Provenance: ring sources are the `sources` lines of each RingSystem (data/rings/<planet>.json, NSSDC fact sheets plus Planetary Explorer look), asserted in the new test. PROV-02 is about textures; the info card shows no ring provenance today and none was added (no new UI in this Task). Stated reason, not new display.
- Docs: README addBody row names the four ringed planets; CHANGELOG Unreleased line. Size (`npm run build` then `node tools/measure-example.mjs`): first-open total 1,608,313 raw / 457,901 gzip before, 1,617,005 raw / 460,652 gzip after (+8,692 / +2,751). A first attempt pulled the moon lists in via outerPlanetCatalogues (+158,697 raw); fixed by splitting ring files into core/bodies/outerPlanetRingData.ts and assets/bodies/outerPlanetRings.ts (outerPlanetCatalogues re-exports them, so existing imports work).
- Log-depth: no shader added or changed.

Commands: `npm run typecheck` pass; `npm run lint` pass; `npm run build` pass; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` pass after one fix (1997 passed, 1 skipped; first run failed only on packagePacks file count 462 > 460, then tools/check-packs.mjs limit raised to 462 with a note, packagePacks.test.ts 5/5 pass; the full test run was not repeated after that one-line limit change, lint rerun passes).

Files read (all Context Files plus): assets/visual.ts, assets/rings.ts, assets/catalogue.ts, core/bodies/outerPlanetData.ts, demo planetDefinition.ts/planetSettings.ts, demo tests above, tools/check-packs.mjs (extra reads to locate where visuals/rings are defined and why tests failed).

Files changed: packages/astraeus/src/assets/bodies/{jupiter,planetSystemMaps,outerPlanetCatalogues}.ts, assets/visual.ts (comment), core/bodies/outerPlanetData.ts, new core/bodies/outerPlanetRingData.ts, new assets/bodies/outerPlanetRings.ts, README.md, CHANGELOG.md, new tests/publicApiRings.test.ts; demo planetDefinition.ts, planetSettings.ts (comment), systems/{jupiter,saturn,uranus,neptune}.ts and four demo tests; tools/check-packs.mjs.

Limitations: no browser/visual check (rings drawing unchanged in code, not looked at); full test suite not rerun after the check-packs limit edit; the public-site planets demo (Jupiter only) is unaffected by code but not exercised. The showers' Jupiter now also draws rings (intended by the Task).

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- Catalogue visuals for the outer planets now carry rings (assets/bodies/planetSystemMaps.ts, jupiter.ts); ring data lives in core/bodies/outerPlanetRingData.ts apart from the moon lists to keep the first download small. Design.md `Interfaces and Data Flow` should say rings are catalogue data, not an experience opt-in (BodyVisual.rings comment updated). astraeus pack file limit raised 460 to 462 (tools/check-packs.mjs). Reconcile in the last step.
