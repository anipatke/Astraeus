---
id: T-211
title: Let addBody take any listed moon
objective: O-049
status: done
depends_on: [{task: T-210, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-211, reason: 'Owner said "orchestrate O49"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o049-run-20261031}, recorded_at: '2026-10-31T12:09:16Z'}
planned_by: {role: planner, session: probe-feedback-3-20261031}
---

# Let addBody take any listed moon

## Outcome

`scene.addBody(id)` resolves every moon in the slim table as a catalogue body by one rule, drawn from its data package's fit set, with `{ orbit: true }` drawing one lap about its planet; the existing detailed moons are unchanged (I-122).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- One rule turns a slim-table entry into a body definition (label, mean radius with source, parent, `requires` its data package, `orbitPeriodDays`, grey sphere unless the picture pack has a picture); the detailed definitions (Io, Europa, Ganymede, Callisto, Phobos, Deimos, Saturn's seven, Triton, Charon) win where they exist. No moon id appears in the rule.
- Its position binds through the planet's moon system (`moonSystem.ts` `mappedMoon`/`binding`) only when the scene adds it, so an unused moon costs nothing at runtime.
- `addBody("miranda")` in a made-up Sun-first scene with Uranus and `astraeus-data-uranus` builds a definition; `{ orbit: true }` gives a span of its period; without the data package, or outside its span, it fails as today (`missing-data`, `out-of-span`); a moon without a period refuses `{ orbit: true }` with `no-orbit`.
- The `unknown-body` message stays readable with hundreds of moons (names the planets and how to list moons, not every id); `catalogue`/`bodies` listing in `src/api/bodies.ts` includes the listed moons with `requires`.
- README `addBody` row and the `astraeus-data-uranus` README line ("no ready-made moon bodies yet"); CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/bodies.ts`, `packages/astraeus/src/core/bodies/index.ts`, `packages/astraeus/src/core/bodies/planetMoons.ts`, `packages/astraeus/src/core/bodies/moonSystem.ts`, `packages/astraeus/src/core/body.ts`, `packages/astraeus/tests/moonOrbitLines.test.ts`, `packages/astraeus/README.md`, `packages/astraeus-data-uranus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-03, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Confirm the slim table from the previous step exists; return REPLAN REQUIRED if not.
3. Add the rule and lazy binding; keep detailed moons first.
4. Errors and listing; tests on made-up scenes; README, CHANGELOG.

## Boundaries

No new pictures, looks or data; no change to the detailed moons.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Started 2026-10-31: `status: in_progress` / `stage: build` set first; router not edited (brief). Final stage `audit` (ready for a Check; not passed).

Per criterion:
- One rule, no moon id: `core/bodies/listedMoonBodies.ts` `listedMoonBody(moon)` builds the definition through the planet's moon system `mappedMoon` (label, mean radius, parent, `orbitPeriodDays` when the table has one, `validUtc` the 1950 span when the table's `early` flag is set, else the 2010 span; radius and period sources in the dimensions provenance) and its state source `system.binding(id)`; `assets/bodies/listedMoons.ts` gives a grey sphere via `withPicture(id, ...)` (the picture pack's picture when one is registered under the id). `requires` is the table's `astraeus-data-<parent>` (API `moonRef` in `api/bodies.ts`). Detailed moons are in the built-in catalogue first, so `Scene.#addListedMoon` skips them (test "keeps the detailed definitions" checks the catalogue definition is the built-in object for io, europa, ganymede, callisto, phobos, deimos, mimas, titan, iapetus, triton, charon).
- Lazy: the definition and binding are made in `Scene.addBody` only (`extendCatalogueWithMoons` on the scene's own catalogue; rolled back if the add fails). The built-in catalogue gains none (test: `catalogue.has("miranda")` false before and after a scene adds it; a scene without a listed moon carries no `catalogue`). `toDefinition` now passes `catalogue` whenever the scene's differs from the built-in one (was: elements bodies only); `installData` takes the scene's catalogue so the moon's chunks load.
- Miranda in Sun + Uranus + `astraeus-data-uranus`: builds, `{ orbit: true }` span equals the table period; no package -> `missing-data` (also Pan of Saturn); window 2040 -> `out-of-span` naming the package (uranus real index); null-period moon `{ orbit: true }` -> `no-orbit` (none of the 458 has a null period, so that test is vacuous today and the existing Phobos case covers the refusal); planet not in scene -> `no-orbit ... about uranus`. Miranda placed from the committed 1986 chunks: 1.2e5 to 1.4e5 km from Uranus on 1986-01-24, ephemeris provenance.
- Errors and listing: `unknown-body` message is the built-in ids plus "`listedMoons(planet)`" (under 600 characters); new public `listedMoons(planet?)` in `api/bodies.ts` returns all 458 refs with `requires` (README and tests). `readyMade` falls back to the table, so `missing-data` works for every listed moon.
- Docs: README `addBody` row and `listedMoons` mention; `astraeus-data-uranus` README line; CHANGELOG Unreleased line with the new size.

Support change: `tools/import/moon-lookup.mjs` now also records, per planet, which moons' fits start before 2010 (read from the data packages' own `index.json`, per-body span else package span) as `early`; `listedMoons.ts` regenerated (Uranus: ariel, umbriel, titania, oberon, miranda; the other planets as shipped). `MoonSystem.position` / `MappedMoonFacts.worstM` is now optional (a listed moon has no engine-held worst figure; its text then points to the package index).

Size (`npm run build`, `node tools/measure-example.mjs`): first-open 1,638,210 B raw / 468,709 B gzip against 0.5.1's 1,618,563 / 461,100: +19,647 raw, +7,609 gzip (the lookup +17.7 kB / +7.1 kB from T-210 plus the rule, catalogue extension and `early` lists). Within the 25 kB / 8 kB budget quoted in T-210.

Commands run: focused `npx vitest run tests/listedMoonBodies.test.ts tests/listedMoons.test.ts` (11 + existing pass); `npm run lint` clean; `npm run typecheck` clean; `npm run build`; `npm run build:packages`; `npm run check:pack` (pass after raising astraeus files limit 466 -> 470, noted in tools/check-packs.mjs); `npm run check:engine-alone` pass; `npm test` last run after final change: 161 files, 2026 passed, 1 skipped. No browser run.

Files read: the Task, Objective via brief, T-210's evidence, Context Files (`api/scene.ts`, `api/bodies.ts`, `core/bodies/index.ts`, `planetMoons.ts`, `moonSystem.ts`, `tests/moonOrbitLines.test.ts`, READMEs). Extra reads (path, reason): `src/assets/catalogue.ts` (extend the catalogue like elements bodies); `src/api/data.ts` (installData uses the global catalogue); `src/assets/bodies/planetSystemMaps.ts` and `src/assets/pictures.ts` (grey sphere / picture rule); `src/api/index.ts` (public export); data package `index.json` spans via script (which moons start in 1950); `tests/dataSpans.test.ts`, `tests/planetMoonSystems.test.ts`, `tests/moonData.ts` (test patterns); `tools/check-packs.mjs`.

Files changed: packages/astraeus/src/{api/bodies.ts, api/data.ts, api/index.ts, api/scene.ts, assets/catalogue.ts, core/bodies/listedMoons.ts (regenerated), core/bodies/moonSystem.ts}; new src/core/bodies/listedMoonBodies.ts, src/assets/bodies/listedMoons.ts, tests/listedMoonBodies.test.ts; tests/listedMoons.test.ts (`early` field); tools/import/moon-lookup.mjs; tools/check-packs.mjs; packages/astraeus/{README.md, CHANGELOG.md}; packages/astraeus-data-uranus/README.md.

Limitations: no browser/visual check (owner looks at the end of the Objective). Orientation of an irregular (non-synchronous) listed moon is the approximate tidal lock the moon system gives every fitted moon without an IAU record; a grey sphere shows no feature, and the dimensions note says the rotation is not modelled. No GM held for listed moons. Europa/Io: detailed definitions keep their own periods (the 0.73% / 0.36% JPL difference does not reach them). `fitBody === id` for all 458 is asserted by a test because the catalogue joins binding and definition by id. Info-panel provenance does not show the period (unchanged).

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- Design.md (`Interfaces and Data Flow`): the scene's catalogue can now be extended by listed moons at `addBody` time (`assets/catalogue.extendCatalogueWithMoons`, `core/bodies/listedMoonBodies`); `toDefinition` passes `catalogue` whenever it differs from the built-in one; `installData` takes it; `MOON_SYSTEMS` moved from `api/data.ts` to `core/bodies/listedMoonBodies.ts`; `listedMoons.ts` carries an `early` (fit starts 1950) flag generated from the data packages' indexes; public `listedMoons(planet?)`. Deferred to the last step.
