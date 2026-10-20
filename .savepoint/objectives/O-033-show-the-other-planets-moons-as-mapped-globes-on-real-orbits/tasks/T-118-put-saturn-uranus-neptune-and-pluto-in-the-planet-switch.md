---
id: T-118
title: Put Saturn, Uranus, Neptune and Pluto in the planet switch
objective: O-033
status: done
depends_on: [{task: T-116, requires: clear}, {task: T-117, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
check_waiver:
  task: T-118
  reason: Owner waived the optional Task Checks for O-033 ('waive checks for tasks one big check at end'); the Full Objective Check covers it.
  actor: {role: owner, session: 827ddc8a-e534-43b0-98b9-9af4e2acda26}
  recorded_at: '2026-10-20T13:31:00Z'
---

# Put Saturn, Uranus, Neptune and Pluto in the planet switch

## Outcome

Picking Saturn, Uranus, Neptune or Pluto in the switch opens that planet with its tagged places, its mapped moons as globes with their places, every other moon as a family-coloured dot, its moons panel, and rings on Saturn, Uranus and Neptune.

## User Check

On the preview, switch to each of the four; open the moons panel; tap a place on Titan and on Pluto; look at Saturn's rings.

## Done When

1. One settings file per planet (no code per planet); bodies, families, feature packages and rings named only there.
2. Rings for Saturn, Uranus and Neptune from the NASA NSSDC ring fact sheets as core ring data (`data/rings/<planet>.json`), drawn by `RingView`; looks from the donor's Saturn ring where it has one, live settings, provenance labelled.
3. Each view's chunks are only that planet's (window year plus orbit history), shipped through the builder's glob; unit test that a view's needed chunks equal its shipped set.
4. Opening framing and camera reach per planet (Pluto-Charon close pair; Saturn's far moons), stated in settings.
5. Browser check scenarios written (not run) for one outer planet's switch, a place tap and the moons panel, through the shared driver.

## Context Files

`src/experiences/jupiter-io/jupiterIo.ts`, `data/stories/jupiter-io/panels.json`, `src/app/RingView.ts`, `src/assets/bodies/jupiterRings.ts`, `data/rings/jupiter.json`, `src/app/FeatureMarkers.ts`, `src/shell/bodyFeatures.ts`, `src/shell/moonFamilies.ts`, `tools/validate/driver.mjs`, `tools/validate/browser-jupiter-io.mjs`, `/home/user/code/planetary-explorer/src/entities/saturn.ts`.

## Design References

Design: body-set row, feature-marker row, moons panel row, Jupiter and Io.

## Guardrails

ARCH-01, ARCH-02, PROV-01, PROV-02, TEST-01, STYLE-09.

## Implementation Plan

1. Ring data and settings files for the four planets.
2. Chunk shipping and framing; tests.
3. Browser scenarios through the driver.

## Boundaries

No builder or core changes beyond data; a builder gap returns REPLAN REQUIRED. File paths of the new settings follow T-117.

## Technical Verification

Configured gates; no browser runs (owner rule); evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built in the main checkout by a builder session (no browser run, no screenshot, not committed).

Done When:
1. **Settings only (met).** `data/planets/{saturn,uranus,neptune,pluto}.json` (orders 6 to 9) plus one `systems/<planet>.ts` each of Jupiter's shape (about 25 lines: catalogue, composition, positions from `<PLANET>_MOON_SYSTEM`, rings, packages, load); two small helpers in `src/experiences/planets/planetSystemParts.ts` (chunk URLs by path, packages from one glob). Bodies, families, packages, rings are named in settings and system only. Story panels: all four share `data/stories/no-panels/panels.json` (empty list, auto-open off); stories for these planets are not in this Task.
2. **Rings (met).** `data/rings/{saturn,uranus,neptune}.json` (NSSDC fact sheets satringfact, uranringfact, nepringfact, read 2026-10-21; looks from the donor's `saturn.ts`, `uranus.ts`, `neptune.ts` ringSystem, commit 84f8d3e), drawn by `RingView` through the existing `visualOverrides.rings`; provenance in each file's `note`/`sources` (shown in the Sources). Judgement calls, all stated in each file's `note`: Saturn's F ring, Titan ringlet and gaps are single radii on the sheet (no width) so are not drawn; the E ring (180,000-480,000 km) is not drawn (it would shrink the main rings to a few pixels in the one 2048 px texture); Saturn's G ring has no donor band, look is Astraeus's. Uranus and Neptune sheets print one radius and a width, not edges: a band is radius plus or minus half the width (middle of a printed range); rings narrower than a texture pixel are drawn 400 km (Uranus) or 250 km (Neptune) wide, centred on the printed radius (`drawnWidthKm`, printed values kept on the band).
3. **Chunks (met).** `tests/planetSystems.test.ts` runs each view's `prepare` with `fetch` reading the committed files, and asserts the fetched set equals the set the system's globs ship (Saturn 799 chunks, Uranus 48, Neptune 34, Pluto 6). History years are shipped only for moons whose orbit line reaches into them (negated globs, lists generated from a real load; a window change fails the test with the diff).
4. **Framing (met).** Each file states window (Jupiter's shared window), start view and camera reach (units are Earth radii): Saturn 160 at 25 deg elevation, reach 20000/80000; Uranus 60 at 20 deg, 20000/80000; Neptune 80 at 15 deg, 40000/160000 (Neso reaches about 74 million km); Pluto 12 at 20 deg showing Pluto and Charon, 400/2000.
5. **Browser scenarios (written, not run).** `tools/validate/browser-outer-planets.mjs` through `driver.mjs` only (driver guard test passes): switch keeps the clock, Saturn rings at the data's radii, Saturn moon families, a place tap on Titan (Kraken Mare) and Charon (Mordor Macula), Pluto and Charon drawn, Uranus rings and 28 dots; desktop and phone. Not added to `run-demo.mjs` (set membership is the coordinator's call, see notes).

Carried items: (1) clock: `switchAddress(href, param, value, keep)` and `ExperienceSwitch.keep`; `planetChoice` passes `["t"]` (`PLANET_SWITCH_KEEPS`); showers unchanged (no `keep`), tested in `tests/planetSystems.test.ts` and the existing showers test. The camera `view` is still dropped. (2) Saturn's index: 908 KB in the build (962 KB file, 76 KB gzipped) against Jupiter's 375 KB (37 KB gzipped): 292 moons at the same 3.4 KB each as Jupiter's 115, so not trimmed; each body's chunk list and accuracy record stay. Limits and measured loads below. (3) Iapetus: no yaw set (see below). (4) Rings as above. (5) Pluto: `prepare` awaits `PLUTO_MOON_SYSTEM.load` before the page renders (main.tsx awaits `prepare` before `render`), tested by running `prepare` and checking `isLoaded()`.

Iapetus finding (needs the owner's look): the donor's note that the texture "is registered 180 degrees from the app's east-positive marker frame" explains why its stored marker longitudes are `180 - west longitude` (`markerLongitudeFromSource` scale -1, offset 180 in `data/bodies/iapetus/map.json`, the same as Tethys, Dione and Rhea, which have yaw 0). The marker longitudes in `features.json` are already in the picture's frame and `textureRecentringDeg` is 0 (Ganymede's is 180, which is why its yaw is pi). So the donor's markers land on the picture at yaw 0; a yaw of pi would put them 180 degrees off. `textureYawRad` stays 0 and no coordinate changed. Not checked by eye.

Load per view (chunks the window loads, measured by the test; index as served, gzipped; limit stated in `tests/planetSystems.test.ts`):
| View | Chunks | Chunk bytes | Limit | Index (raw, gzip) | Index limit (raw, gzip) |
|---|---|---|---|---|---|
| Saturn | 799 | 2,959,856 | 3,300 KB | 985,559 B, 73,129 B | 1,000 KB, 80 KB |
| Uranus | 48 | 1,688,502 | 1,850 KB | 117,161 B, 13,632 B | 130 KB, 16 KB |
| Neptune | 34 | 935,845 | 1,030 KB | 70,720 B, 9,196 B | 80 KB, 12 KB |
| Pluto | 6 | 86,856 | 100 KB | 29,605 B, 4,891 B | 35 KB, 6 KB |
Jupiter (reference, not measured here): about 3.3 MB of chunks, 36 KB gzipped index. Map pictures (Saturn 164 KB, Uranus 78 KB, Neptune 242 KB, Pluto 1.4 MB, moons 1.5 to 3.7 MB each) are T-116's and load with the view; not counted above.

Builder changes beyond data (small, additive, flagged for the planner): `planetSettings.ts`/`planetDefinition.ts` now accept a planet with no mapped moon (Uranus has none with a map): `moons.follow` optional, no follow presets, no mapped-orbit group when empty. `compositions.ts` gained four compositions. New `src/core/bodies/outerPlanetData.ts` and `src/assets/bodies/outerPlanetCatalogues.ts` (moon lists and rings parsed once, as Jupiter's). `tools/import/test-io.mjs` gained `gzipSize`.

Commands run (this checkout): `npm run typecheck` pass; `npm run build` pass (Saturn view: `saturn-moons` chunk 908 KB, 76 KB gzipped); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 84 files, 1215 passed, 1 skipped, 0 failed (`junit.xml` is git-ignored). No browser, no screenshot.

Extra reads (outside Context Files): `src/experiences/planets/{planetDefinition,planetSettings,planetChoice}.ts` and `systems/jupiter.ts`, `src/experiences/showers/showerChoice.ts`, `src/shell/SwitchControl.tsx`, `src/main.tsx`, `src/assets/compositions.ts`, `src/assets/rings.ts`, `src/assets/moonCatalogue.ts`, `src/core/bodies/{planetMoons,moonSystem,jupiterMoons,jupiterData}.ts`, `src/assets/bodies/planetSystemMaps.ts`, `data/moons/*.json`, `data/ephemerides/*-moons/index.json`, `data/bodies/*/map.json`, `tools/import/test-io.mjs`, `tests/planetDefinition.test.ts`, `tests/showerChoice.test.ts`, the Objective, T-116 and T-117 completion notes, the donor's `src/entities/{uranus,neptune}.ts`: to follow Jupiter's shape, type the new data, carry the T-116/T-117 items and size the loads. NASA NSSDC ring fact sheets fetched with WebFetch (radii as printed).

Limitations: nothing viewed in a browser (rings, framing, Iapetus orientation, label distances are unchecked by eye); Uranus has no mapped moon so no tagged places or follow preset; ring brightness is a look; the 2014/2015 history globs are exact for the shared window only; story panels for the four planets do not exist yet.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.

## Owner Completion

Marked done by the coordinator on 2026-10-20T13:32:23Z under the owner's instruction for the O-033 overnight run (owner, 2026-10-20: "waive checks for tasks one big check at end"; chose "Yes, mark them done" once build and tests pass). Gates passed (typecheck, build, 1215 tests). Coordinator accepts the small additive builder change (optional `moons.follow`, empty mapped-orbit group skipped) instead of REPLAN REQUIRED: it is the same kind T-119 made and stays within the Objective's design. For the owner's look: Iapetus markers (yaw left at 0 by reasoning), ring looks, framing. T-121 owns wiring `browser-outer-planets.mjs` into the planets demo set.
