---
id: T-116
title: Add the outer planets and the mapped moons as real bodies
objective: O-033
status: done
depends_on: [{task: T-114, requires: clear}, {task: T-115, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
lane: data
check_waiver:
  task: T-116
  reason: Owner waived the optional Task Checks for O-033 ('waive checks for tasks one big check at end'); the Full Objective Check covers it.
  actor: {role: owner, session: 827ddc8a-e534-43b0-98b9-9af4e2acda26}
  recorded_at: '2026-10-20T13:18:11Z'
planned_writes: [src/core/bodies/jupiterMoons.ts, src/core/bodies/io.ts, src/core/satelliteMeanElements.ts, src/core/bodies/index.ts, src/assets/catalogue.ts]
---

# Add the outer planets and the mapped moons as real bodies

## Outcome

Saturn, Uranus, Neptune and Pluto, the newly mapped moons (Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton, Charon) and Mars's Phobos and Deimos are catalogued bodies placed from the curve fits, each turned the right way, with its map and licence, ready for any experience to show.

## User Check

Read the Task evidence: per body its source, measured error, map licence and size, and the facing test result.

## Done When

1. The Jupiter-only moon loader (`src/core/bodies/jupiterMoons.ts`) becomes a generic per-system loader over any `data/ephemerides/<planet>-moons/` (fit-backed bindings, chunk fetch for a window, `chunksNeeded` refusal), Jupiter unchanged by test.
2. Planet definitions for Saturn, Uranus, Neptune (planet series) and Pluto (its fit), with radii, GM and IAU rotation cited; mapped moons and Phobos and Deimos defined once (ARCH-05), with `accuracy.validUtc` 2010-2030.
3. One generic tidal-lock wrapper reads the IAU rotation records in `data/orbits/` for synchronous moons; a test proves for one moon per system that the sub-planet point sits at the record's prime-meridian longitude within a stated tolerance. Io and the Galilean moons move onto it without visible change.
4. Io's duplicated constants resolved: `data/orbits/io.json` is the one record; `trueAnomalyFromMean` lives in a generic module (T-078 ARCH-05 note).
5. Visual records with maps copied from the donor (byte-identical where shippable, SHA-256 equal to `map.json`) or resized within the load budget (Triton 14,138 px and Pluto 5,926 px resized; resize recorded), each with a recorded licence (PROV-02, read from the donor README entries); Saturn, Uranus and Neptune maps Solar System Scope CC BY 4.0; Phobos and Deimos as grey balls at true size (no map). Name check passes.

## Context Files

`src/core/bodies/jupiterMoons.ts`, `src/core/bodies/io.ts`, `src/core/bodies/jupiter.ts`, `src/core/bodies/planetRecords.ts`, `src/core/bodies/planetTrajectory.ts`, `src/core/bodies/index.ts`, `src/core/satelliteMeanElements.ts`, `src/core/iauRotation.ts`, `src/core/body.ts`, `src/assets/catalogue.ts`, `src/assets/bodies/galileanMoons.ts`, `src/assets/licence.ts`, `src/assets/visual.ts`, `data/orbits/io.json`, `data/orbits/titan.json`, `data/bodies/README.md`, `docs/DONOR_PROVENANCE.md`, `docs/MOON_ORBITS.md`, `tests/jupiterMoonsScene.test.ts`, `tests/moonOrbits.test.ts`, `tests/nameCheck.test.ts`.

## Design References

Design: core and assets rows, Jupiter and Io, Texture rights, Name rule, Moon `validUtc`.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, ARCH-05, PROV-01, PROV-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Generalise the loader; prove Jupiter unchanged.
2. Planet and moon definitions; tidal-lock wrapper and facing tests; Io cleanup.
3. Maps, visual records and licences; name check.

## Boundaries

Core and asset layers only; no experience, panel or shelf changes. Additional extra reads of donor texture READMEs are allowed when logged.

## Technical Verification

Configured gates; facing and loader tests; evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder session, 2026-10-21 (stage build -> test -> audit). Per-criterion outcomes:

1. **Generic loader (met).** `src/core/bodies/moonSystem.ts` (`createMoonSystem`, `chunksNeeded`, `moonFitSource`, `MOON_FIT_SPAN`) holds the index import, chunk fetch for a window, history chunks, decode slicing, the `chunksNeeded` refusal, the fitted-moon trajectory and the mapped-moon definition. `jupiterMoons.ts` is now one configuration of it with its exported names kept (`loadJupiterMoons`, `jupiterMoonEphemeris`, `osculatingPeriodMs`, `chunksNeeded`, `JUPITER_MOON_FIT_SPAN`, `FITTED_MOON_TIDAL_LOCK`, ...). Jupiter unchanged by test: `tests/planetDefinition.test.ts` (view equal to `tests/fixtures/jupiter-view-before.json`), `tests/jupiterMoonsScene.test.ts`, `tests/jupiterMoonsEphemeris.test.ts` pass unedited; `tests/planetMoonSystems.test.ts` "the generic loader" loads a fresh Mars system with a window and shows only that window's chunks are fetched (`mars/2018.bin`, `phobos/2018.bin`), and that a window whose chunks are not shipped is refused.
2. **Planets and moons defined once (met).** `src/core/bodies/outerPlanets.ts`: Saturn, Uranus, Neptune (spheroids, radii and GM from the Horizons headers saved in each moon index, IAU pole and meridian from pck00011 saved at docs/evidence/o019-t078-iau-rotation-*; position from the planet fits) and Pluto (sphere 1188.3 km, GM 869.326). `src/core/bodies/planetMoons.ts`: five system configurations, Phobos, Deimos, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton, Charon, all `validUtc` 2010-2030 (`MOON_FIT_SPAN`), one binding each; registered in `src/core/bodies/index.ts` and `src/assets/catalogue.ts`. Test: `tests/planetMoonSystems.test.ts` "the mapped moons of the other planets" (each worst figure equals its index's `<centre>CentredUtc.worstM`; each Horizons radius and GM string appears in the saved header).
3. **One tidal-lock wrapper on IAU records (met).** `MoonSystem.trajectory(body, adapter, rotation?)` takes an `IauRotationElements` built by `iauElementsFromRecord` from the `rotation` block of `data/orbits/<moon>.json`; Io, Europa, Ganymede, Callisto, Mimas to Iapetus, Triton and Charon use it; Phobos and Deimos (no IAU record in `data/orbits/`) keep the orbit-derived near side. `src/core/iauRotation.ts` gained the report's periodic terms (optional `periodic`, sine for RA and W, cosine for Dec): Triton's 32-degree pole term made the linear model 21 degrees off the planet; with the terms it is 2.8. Facing test (`tests/planetMoonSystems.test.ts`, 2016-02-10 to 2016-12-30, 219 dates each): angle between the body's prime-meridian axis and the direction to its planet, worst: Io 0.8, Titan 5.4, Triton 2.8, Charon 1.5 degrees; limits 1, 6, 3, 2. Titan's includes its optical libration (about 3.3 degrees). Phobos (orbit-derived) is under 0.0001. The Io test in `tests/jupiterIo.test.ts` ("keeps its near side towards Jupiter") was 1e-4 degrees with the orbit-derived lock; it is now 1 degree (measured 0.8), a deliberate edit.
4. **Io's constants (met).** `IO_MEAN_ELEMENTS` is read from `data/orbits/io.json` (the one record; the copy of the numbers is gone, `citation` is built from the record's source fields); `trueAnomalyFromMean` moved to `src/core/keplerAnomaly.ts` (Io still re-exports it for `tests/jupiterIo.test.ts`; `swiftTuttle.ts`, `elementsBody.ts`, `satelliteMeanElements.ts` import it from the new module). Io's binding is the generic one with Io's IAU record. `IO_PERIOD_DAYS`, `IO_EPOCH_UTC_MS`, `siderealPeriodDays` unchanged and still tested.
5. **Maps, visuals, licences (met, see table).** `src/assets/bodies/planetSystemMaps.ts` (visual and licence per body, in the catalogue). Name check passes (`tests/nameCheck.test.ts`); `tests/textureLicence.test.ts` list extended to the 13 new textured bodies and passes.

Maps (donor `/home/user/code/planetary-explorer/public/textures/`, read only; every SHA-256 equal to its `data/bodies/<body>/map.json` entry before copying):

| Body | File shipped | Size px | Bytes | Licence recorded | Source of the licence |
|---|---|---|---|---|---|
| Saturn | saturn-2k.jpg, byte-identical | 2048x1024 | 164,486 | CC BY 4.0 (Solar System Scope) | donor README (saturn-4k entry; 2k derived from it) |
| Uranus | uranus-2k.jpg, byte-identical | 2048x1024 | 77,751 | CC BY 4.0 | Astraeus record (no donor README entry) |
| Neptune | neptune-2k.jpg, byte-identical | 2048x1024 | 241,580 | CC BY 4.0 | Astraeus record (no donor README entry) |
| Pluto | pluto-4k.jpg, RESIZED from 5926x2963 (3,972,946 B) | 4096x2048 | 1,424,083 | NASA/JPL image use policy, credit NASA/JHUAPL/SwRI (PIA11707) | Astraeus record only (docs/DONOR_TEXTURE_INVENTORY.md section C); the donor has no README entry |
| Mimas | mimas-4k.jpg, byte-identical | 5760x2880 | 1,605,648 | NASA/JPL, credit required (PIA17214) | donor README + credits |
| Enceladus | enceladus-4k.jpg, byte-identical | 4096x2048 | 3,656,613 | same (PIA18435) | donor README + credits |
| Tethys | tethys-4k.jpg, byte-identical | 4096x2048 | 2,567,473 | same (PIA18439) | donor README + credits |
| Dione | dione-4k.jpg, RESIZED from 14134x7067 (10,255,303 B) | 4096x2048 | 2,508,467 | same (PIA18434) | donor README + credits |
| Rhea | rhea-4k.jpg, byte-identical | 4096x2048 | 3,013,416 | same (PIA18438) | donor README + credits |
| Titan | titan-4k.jpg, byte-identical | 4096x2048 | 1,477,417 | same (PIA19658) | donor README + credits |
| Iapetus | iapetus-4k.jpg, byte-identical | 4096x2048 | 1,635,347 | same (PIA18436, Wikimedia page) | donor README + credits |
| Triton | triton-4k.jpg, RESIZED from 14138x7069 (4,281,065 B) | 4096x2048 | 922,021 | NASA/JPL, credit required (PIA18668, public-domain Wikimedia copy) | donor README + credits |
| Charon | charon-2k.jpg, byte-identical | 1024x512 | 69,352 | USGS "please cite authors" | Astraeus record only (no donor README entry) |
| Phobos, Deimos | none (grey spheres, mean radius 11.08 and 6.2 km) | - | - | n/a | n/a |

Resize tool and size recorded in each licence `source`: ImageMagick 6.9.12 `convert -resize 4096x2048! -quality 90`, 2026-10-21. Dione's resize is beyond the Task's named list (its donor file is 10 MB wide at 14,134 px); Mimas (5,760 px, 1.6 MB) was kept byte-identical. `textureYawRad` is 0 for every new map: none has been compared with its body's prime meridian (owner look, T-118/T-119).

Per body source and error (position): Saturn, Uranus, Neptune planet fits within 1 km of VSOP87A (VSOP87A against Horizons 2,256, 19,070, 36,192 km, tests/outerPlanetFits.test.ts); Pluto barycentre fit 0.78 km against Horizons body 9; Pluto placed with its offset measured 0.075 km from Horizons body 999 at 2010-07-01 and within 1.5 km at 2024-01-01; without its system loaded it is the barycentre, 2,132 km from Pluto's centre. Moons (Horizons ephemerides, Planet-centred worst over 1,001 dates, index figures): Phobos 0.0593 m, Deimos 0.5101 m (mar099); Mimas 0.091, Enceladus 0.0874, Tethys 0.0865, Dione 0.0886, Rhea 0.0725, Titan 0.55, Iapetus 0.0579 m (sat441l); Triton 0.5121 m (nep098_merged); Charon 0.6237 m (plu060_merged).

**Pluto size decision (carried out).** `tools/import/planet-fits.mjs` now fits Horizons body 9 (Pluto system barycentre, `CENTER=500@10`) instead of 999; `planets.json` is 329,210 bytes on disk (329 KB; was 511 KB after T-114, 214 KB before the outer planets); Pluto's own chunk 15,108 base64 bytes (11,329 raw), worst 0.78 km; the other seven planets re-fitted byte-identically. Size bound in `tests/planetFits.test.ts` lowered from 520,000 to 340,000 (stored data 325,832). Pluto's placement is barycentre plus its own offset from `data/ephemerides/pluto-moons` through the new `ChebyshevEphemeris.centreOffsetKm`, added by `PLUTO_BINDING` (`planetMoons.ts`) once that system is loaded; before that Pluto sits at the barycentre (stated in its position record). `createPlanetSunTrajectory` takes an optional offset callback. `tests/outerPlanetFits.test.ts` Pluto bound is now "within the offset's size" (2,200 km, 0.12 arcsec); the kilometre check moved to `tests/planetMoonSystems.test.ts`.

Commands run (all green at handoff): `npm run typecheck`; `npm run build`; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` (83 files, 1200 passed, 1 skipped; `junit.xml` is git-ignored); a public build (`ASTRAEUS_PUBLIC_BUILD=1 npx vite build`) for the size of the shared app chunk: 1,327,540 B before to 1,358,061 B after (+30 KB raw: the 13 IAU rotation blocks, which Vite keeps whole, and the new definitions and visuals); no browser run and no screenshot.

Files read beyond Context Files (extra reads, with reason): `src/core/chebyshevEphemeris.ts` (the centre's offset), `src/core/astronomyAdapter.ts` (adapter interface), `src/core/planetModels.ts`, `src/core/planetSeries.ts`, `tools/import/planet-fits.mjs` (Pluto fit), `tests/planetFits.test.ts`, `tests/outerPlanetFits.test.ts`, `tests/planets.test.ts`, `tests/assets.test.ts`, `tests/stateResolver.test.ts`, `tests/experiences.test.ts`, `tests/compositions.test.ts`, `tests/textureLicence.test.ts`, `tests/jupiterIo.test.ts`, `vitest.setup.ts` (lists of bodies and setup the new bodies change); `src/experiences/showers/showerBodies.ts`, `showerPaths.ts`, `showerBasics.ts` (see Drift); `src/experiences/planets/planetDefinition.ts`, `planetSettings.ts`, `systems/jupiter.ts` (T-117 note); `data/ephemerides/<planet>-moons/index.json` and `data/moons/*.json` (radii, GM, worst figures); every `data/bodies/<body>/map.json` for the 13 maps and `tools/import/planetary-explorer-map-sources.json` (licences); `docs/evidence/o019-t078-iau-rotation-*/pck00011.tpc` (planet constants); `src/assets/bodies/{galileanMoons,jupiter,io,mars}.ts` (pattern).

Limitations: no browser run, so no map has been seen on its body or checked for the right way round (`textureYawRad` 0 everywhere); the IAU model is linear plus the report's periodic terms only (no libration beyond them, Titan 5.4 and Charon 1.5 degrees from the fitted direction); Phobos and Deimos GM is the Horizons header's mass times G (few digits); Uranus has no mapped moon so its system configuration is untested beyond building; the new bodies are in the global catalogue and add about 20 MB of texture files to the repository and `dist/assets` (loaded only by an experience that draws them).

Files changed: see the report below the Drift Notes in the commit; main ones `src/core/bodies/{moonSystem,jupiterMoons,io,outerPlanets,planetMoons,index,planetTrajectory}.ts`, `src/core/{iauRotation,keplerAnomaly,chebyshevEphemeris}.ts`, `src/assets/{catalogue.ts,bodies/planetSystemMaps.ts}`, `src/assets/textures/*` (13 new), `data/ephemerides/planets/planets.json`, `tools/import/planet-fits.mjs`, `vitest.setup.ts`, `tests/planetMoonSystems.test.ts` (new) and the list-update edits in 8 existing tests.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.

- **Boundary exception (showers).** The Showers experience takes every Sun-circling sphere in the catalogue as a planet (`showerComposition`, `planetIdsOf`, `createPlanetOrbitPathLayers`), so adding Saturn to Pluto would have changed the Perseids and other shower views (and failed `tests/showers.test.ts` on the orbit-turn search past 2045). Three one-line edits keep them unchanged: `BEYOND_SHOWER_VIEWS` in `src/experiences/showers/showerBasics.ts`, used in `showerBodies.ts` and `showerPaths.ts`. Reconcile with the Showers experience's owner intent (does the owner want outer planets in the shower overview?).
- **Design.md (deferred to the integration Task).** Core row: generic moon-system loader (`moonSystem.ts`), `outerPlanets.ts`, `planetMoons.ts`, `keplerAnomaly.ts`; the planet fits now hold the Pluto system barycentre, with Pluto's offset added once its system is loaded; IAU rotation gained periodic terms; the catalogue now holds Saturn to Pluto, eleven moons and 13 textures (about 20 MB more of texture files).
- **For T-118.** `systems/jupiter.ts` could not shrink to nothing in a small change: the per-planet pieces left are the moon list (`data/moons/<planet>.json` parser/catalogue), the composition (`src/assets/compositions.ts`), the tagged-place packages and rings, and a literal `import.meta.glob` for the shipped chunks, which Vite needs written out per planet. Suggested: one `systems/<planet>.ts` of the same shape as Jupiter's (about 15 lines) using the system's `load`/`ephemeris` from `planetMoons.ts` (`SATURN_MOON_SYSTEM.load`, `.ephemeris`, `.tidalLockNote`, `.config.fitSource`, `.config.centreGmKm3S2`). Jupiter's file still imports `loadJupiterMoons` and friends, which now forward to `JUPITER_MOON_SYSTEM`.
- **For T-119.** Saturn's rings need data (none exists); no map has a checked `textureYawRad`; Pluto and Charon maps have no donor README entry (licences from the Astraeus record); the shower views leave out the outer planets by `BEYOND_SHOWER_VIEWS`.

## Owner Completion

Marked done by the coordinator on 2026-10-20T13:20:31Z under the owner's instruction for the O-033 overnight run (owner, 2026-10-20: "waive checks for tasks one big check at end"; chose "Yes, mark them done" once build and tests pass). Gates passed (typecheck, build, 1200 tests). For the owner: Io now faces Jupiter by the IAU model (within 0.8 degrees, test tolerance 1 degree); Pluto and Charon map licence wording from Astraeus's own source records; outer planets kept out of the shower views (`BEYOND_SHOWER_VIEWS`). Carried to T-118: Saturn's index is a 908 KB dynamic chunk (load budget), Iapetus's map is flagged 180 degrees off its marker frame, Saturn/Uranus/Neptune ring data, Pluto views load `pluto-moons` first.
