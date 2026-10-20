---
id: T-119
title: Put Mercury, Venus, Earth and Mars in the planet switch
objective: O-033
status: done
depends_on: [{task: T-116, requires: clear}, {task: T-117, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
check_waiver:
    task: T-119
    reason: "Owner waived the optional Task Checks for O-033 ('waive checks for tasks one big check at end'); the Full Objective Check covers it."
    actor:
        role: owner
        session: 827ddc8a-e534-43b0-98b9-9af4e2acda26
    recorded_at: "2026-10-20T13:28:19Z"
---

# Put Mercury, Venus, Earth and Mars in the planet switch

## Outcome

Picking Mercury, Venus, Earth or Mars in the switch opens that planet with its tagged places; Earth with the Moon and its places, Mars with Phobos and Deimos on their real orbits.

## User Check

On the preview, switch to each of the four; tap a place on Mars and on the Moon; find Phobos close to Mars.

## Done When

1. One settings file per planet; the existing Earth, Moon, Mercury, Venus and Mars catalogue bodies and their feature packages (Earth 20, Moon 30, Mercury 16, Venus 19, Mars 32 places, carried bit for bit), no new body definitions except what T-116 added.
2. Earth's view uses the existing Earth-Moon state sources; Apollo unchanged (its tests pass untouched).
3. Each view downloads only its own data (no moon chunks for Mercury and Venus; the planet series only where needed); test per view.
4. Browser check scenario written (not run) for one inner planet's switch and a place tap.

## Context Files

`src/experiences/jupiter-io/jupiterIo.ts`, `src/assets/compositions.ts`, `src/core/bodies/earth.ts`, `src/core/bodies/moon.ts`, `src/core/bodies/mars.ts`, `src/app/planetNeeds.ts`, `src/app/FeatureMarkers.ts`, `tools/validate/driver.mjs`.

## Design References

Design: Compositions and scene centre, Planets, feature-marker row.

## Guardrails

ARCH-01, ARCH-05, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Settings files for the four planets.
2. Data-loading tests per view; Apollo regression.
3. Browser scenario through the driver.

## Boundaries

Data and settings only; a builder gap returns REPLAN REQUIRED.

## Technical Verification

Configured gates; no browser runs (owner rule); evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built in worktree lane `worktree-agent-a2bb9faf31b6f6d1a` from main at f641d414; no router, status or stage edits.

1. One settings file per planet: `data/planets/{mercury,venus,earth,mars}.json` (order 1 to 4, same 2016-11-04 to 2016-11-18 window, rates and clock as Jupiter so a switch keeps one time), each with a story panels file (`data/stories/<planet>/panels.json`, no panels yet). Each planet's system is a small module in `src/experiences/planets/systems/`: `mercury.ts` and `venus.ts` (the planet alone, its package), `earth.ts` (the existing `earthMoonSystem` composition, Earth and Moon packages), `mars.ts` (Mars, Phobos, Deimos with their own loops, `MARS_MOON_SYSTEM` from T-116, `data/moons/mars.json`, 2016 chunks). No new body definitions; the five feature packages are not edited.
2. Earth uses the existing Earth-Moon composition and the astronomy adapter's Moon exactly as Apollo does. `git diff` touches no Apollo file and no existing test; the full suite passes.
3. Data per view (`tests/planetSwitchInner.test.ts`): Mercury, Venus and Earth fetch nothing in `prepare` (fetch stubbed, zero calls); Mars fetches only `mars-moons/{mars,phobos,deimos}/2016` files (Mars's fits uninstalled for the test, then restored); `needsPlanetSeries` is true for Mercury, Venus, Mars and false for Earth. Tagged places shown: Earth 20, Moon 30, Mercury 16, Venus 19, Mars 30 (the package has 32; its `phobos` and `deimos` entries are the moons' orbit rings with no latitude or longitude, so they are not markers), each id, latitude, longitude and description equal to the package.
4. Browser scenario written, not run: `tools/validate/browser-planet-switch.mjs` (driver only; opens Mercury, switches to Mars, checks the Object list holds Phobos and Deimos, turns Mars until a place shows and presses it; laptop and phone; no screenshot). Not added to `run-demo.mjs`, `run-engine.mjs` or `docs/BROWSER_CHECKS.md`.

Generic change (smallest that expresses the four planets), tested in `tests/planetSwitchInner.test.ts`:
- `planetSettings.ts`: `moons` optional; `listSource` and `featuredFamilyId` optional as a pair; `bodyFeatures` may name the centre as well as a mapped moon. Jupiter's file parses as before.
- `planetDefinition.ts`: `PlanetSystem` moon-list parts (`catalogue`, `ephemeris`, `fitSource`, `tidalLockNote`, `centreGmKm3S2`) optional as a group (a partial group or a list source without a list throws `PlanetBuildError`); no moon panel when there is no list; no small-moon layer when there is no dot moon and no moon to batch (Mars, whose moons have own loops); camera presets for a moon only when there is one; a package entry without a latitude and longitude is not a marker, and a missing `details` is an empty list. Jupiter's view snapshot test (`tests/planetDefinition.test.ts`) passes unchanged.

Gates (in the lane): `npm run typecheck` clean; `npm run build` ok; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 84 files, 1207 passed, 1 skipped (existing).

Extra reads: `src/experiences/planets/planetDefinition.ts`, `planetSettings.ts`, `planetChoice.ts`, `systems/jupiter.ts` (builder to extend), `src/main.tsx` (how planets and systems are found by file name), `src/core/bodies/planetMoons.ts` and `moonSystem.ts` (Mars's moon system), `src/assets/moonCatalogue.ts`, `src/shell/bodyFeatures.ts` (the feature type), `tests/planetDefinition.test.ts`, `tests/planetMoonSystems.test.ts`, `tools/validate/browser-jupiter-io.mjs` and `browser-jupiter-tap.mjs` (scenario pattern), `data/bodies/*/features.json` heads, `data/ephemerides/mars-moons` listing.

Not exercised without a browser: how Phobos and Deimos, the Moon's places and the switch look and behave; the owner's User Check on the preview.

## Drift Notes

- Design (Planets / feature-marker row): the planet builder now allows a planet with no moon list or no moon, places on the centre as well as on moons, and skips package entries with no position. Architecture-relevant for the Design's Planets section; reconcile in the integration Task.
- Mars's feature package carries two non-place entries (Phobos, Deimos) from the donor; they stay in the package, unshown.
- Mars's moon orbit lines use `composition.paths` (Phobos 0.3189 d, Deimos 1.2624 d, rounded from the fit index's periodDays); not browser-checked.
- Another builder adds Saturn to Pluto and the clock-keeping on main; `data/planets/*.json` order values 1 to 4 here are below Jupiter's 5 and may need reordering with theirs.

## Owner Completion

Marked done by the coordinator on 2026-10-20T13:34:07Z under the owner's instruction for the O-033 overnight run (owner, 2026-10-20: "waive checks for tasks one big check at end"; chose "Yes, mark them done" once build and tests pass). Lane gates passed (1207 tests); merged with T-118 on main, the two builders' optional-moons changes combined in `planetSettings.ts` and `planetDefinition.ts` (no moons for Mercury and Venus; no mapped moon for Uranus); fresh gates on the merge: typecheck, build, 85 files, 1222 passed, 1 skipped. T-121 owns wiring `browser-planet-switch.mjs` into the planets demo set.
