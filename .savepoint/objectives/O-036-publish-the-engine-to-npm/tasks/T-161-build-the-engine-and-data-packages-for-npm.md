---
id: T-161
title: Build the engine and data packages for npm
objective: O-036
status: done
depends_on: [{task: T-160, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o036-planning-20261023}
check_waiver:
    task: T-161
    reason: 'owner chose no per-step checks, one Full Objective Check at the end of O-036; quote: "Same as O-035 (Recommended)"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T07:45:01Z"
---

# Build the engine and data packages for npm

## Outcome

`astraeus` builds to compiled JavaScript with types and packs small; new data packages carry the rest — `astraeus-data` (moon pictures, Venus 8k, the Milky Way) and `astraeus-data-jupiter`, `-saturn`, `-uranus`, `-neptune`, `-mars`, `-pluto` (moon positions), per the owner's choices in docs/NPM_PACKAGING.md; a standing fast check packs all of them and fails on unexpected contents or sizes.

## User Check

Run the pack check from the repository root and see both packages listed with their sizes under the limits.

## Done When

- An engine build command (named in the decision note) writes compiled ESM and `.d.ts` to the package's output folder; `package.json` points `exports`, `types` and `files` at it, with version `0.1.0`, licence, repository, keywords and the dependency/peer split the note decided.
- `packages/astraeus-data/` and the six `packages/astraeus-data-<planet>/` packages hold the data the note moved (with `git mv`), each with its own `package.json` (version `0.1.0`), README, licences and credit records for what it ships; the engine finds it when installed and offers only what it has when it is not (no invented data, DATA-01).
- The compiled package ships or injects the engine's styles (`app/style.css`), which `mount` does not import today (T-160 evidence).
- The demos and the site still build and behave the same (they may keep using source); public build file list and load budget unchanged.
- A root script (for example `npm run check:pack`) runs the build and `npm pack --dry-run --json` for every published package and fails on files outside an allow-list or sizes above the note's limits; it is fast, in the configured gates or the test suite, and documented.
- Configured gates and `npm run check:engine-alone` pass. No browser runs.

## Context Files

`docs/NPM_PACKAGING.md`, `packages/astraeus/package.json`, `package.json`, `tsconfig.json`, `tools/check-engine-alone.mjs`, `packages/astraeus/data/ephemerides/README.md`, `packages/astraeus-site/vite.config.ts`, and the previous steps' Technical Evidence.

## Design References

Design: Components/Codebase Map; Public site and launch (O-016); Current Technical State (O-035).

## Guardrails

ARCH-04, PROV-01, PROV-02, DATA-01, TEST-01, TEST-03.

## Implementation Plan

1. Add the build; point the manifest at its output.
2. Create `astraeus-data` and move the data with `git mv`; teach the engine to find it.
3. Add the pack check; record sizes.
4. Gates, engine-alone, public build and load budget.

## Boundaries

No API changes beyond what packaging needs; no example app or docs (next step); no publishing (`npm publish` is never run). If the data move changes what the demos or the public site show, stop and report.

## Technical Verification

Configured gates, `npm run check:engine-alone`, the new pack check, public build and load budget at hand-off. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-23 (builder, no commit; stage left at audit for the coordinator). Gates all pass: `npm run lint`, `npm run typecheck`, `npm run build` (normal, restored last), `npm test` (118 files, 1555 passed, 1 skipped; includes the new packagePacks and extended packageBoundaries tests), `npm run check:engine-alone` (14 s), `npm run check:pack` (about 12 s). No browser run, no screenshots, nothing published.
- Build: `node tools/build-packages.mjs` (`npm run build:packages`): tsc (TypeScript 7, under 1 s) to `<pkg>/dist`, picture and `?url` imports rewritten to `new URL(..., import.meta.url).href` with the files copied, `__PUBLIC_BUILD__` set false, css copied, manifest rewritten from the source manifest's `x-publish` block (exports, files; source `exports` stay on `.ts` for the demos and site). `dist/` is the folder to pack/publish (T-162 workflow: `npm publish packages/<name>/dist`). Version 0.1.0, MIT, repository, keywords, `types`. Engine publish exports: `.` and `./style.css`; `mount` also imports `app/style.css` itself, so the styles are shipped and injected by the bundler.
- Packs (npm pack --dry-run, packed / unpacked / files vs limit): astraeus 6.98 MB / 8.64 MB / 405 (8 / 9.5 / 450); astraeus-data 38.62 / 38.83 / 25 (39 / 39 / 40); -jupiter 20.85 / 22.93 / 2328 (25 / 25.5 / 2400); -saturn 36.23 / 40.10 / 5857 (44 / 44.5 / 6000); -uranus 30.75 / 32.58 / 588 (36 / 36.5 / 700); -neptune 16.63 / 17.77 / 348 (20 / 20.5 / 400); -mars 5.16 / 5.50 / 68 (6.1 / 6.2 / 80); -pluto 1.48 / 1.79 / 128 (2 / 2.1 / 140). The engine is smaller than the note's 12 MB limit because Milky Way and moon pictures moved; its limit was re-set to about 10% over the new measure.
- Pack check: `tools/check-packs.mjs` (`npm run check:pack`, also `packages/astraeus-site/tests/packagePacks.test.ts` in `npm test`): per-package allow-list of files, forbidden patterns (tests, tools, caches, maps, tsconfig, .ts source), manifest fields, `exports` targets packed, README/LICENSE/NOTICE, sizes and counts; the test also proves it fails on a planted test file, .ts file and stray file.
- How the engine finds data: explicit. `astraeus-data` exports `dataSource` (pictures) and `PICTURES`; each `astraeus-data-<planet>` exports `dataSource` (provides the moon ids, `moonPositions` = centre, `loadIndex`, `chunkUrls` with one literal URL per chunk, generated at build into `dist/src/chunks.js`). `mount(..., { data })` (`src/api/data.ts installData`) registers pictures (`src/assets/pictures.ts`), hands the index reader to the moon system (`MoonSystem.provideIndex`), and loads the window's chunks for the scene's moons. Moon refs (`io`..`deimos`, new in `api/bodies.ts`) carry `requires: "astraeus-data-<planet>"`, also for `addBody("titan")` by id (`readyMade`); without the package `mount` throws `missing-data` naming it. The pictures package alone does not satisfy a moon (provides []). Without `astraeus-data` a moon is a flat-coloured sphere, Venus uses 2k at all widths, the sky shows catalogue stars without the Milky Way (the visuals read their picture lazily: `withPicture`, `milkyWayTiles()`).
- What moved (git mv): 6 moon-position sets `packages/astraeus/data/ephemerides/<p>-moons` to `packages/astraeus-data-<p>/data/<p>-moons`; 17 pictures (callisto, charon, dione, enceladus, europa, ganymede, iapetus, io, mimas, milky-way-left/right, pluto, rhea, tethys, titan, triton, venus-8k) to `packages/astraeus-data/src/textures`. The picture records with their licence text (Galilean, Io, Saturn-system moons, Triton, Pluto, Charon, Venus 8k, Milky Way) moved to `astraeus-data/src/pictures.ts`; NOTICE per package. Deviation to note: the moon definitions and visual shells (colour, roughness, yaw, lighting) stay in the engine (bodies are physics plus a colour), only the picture and its licence moved, and the position index no longer imports from `data/`.
- Demos and site: planet systems keep their own year-selecting globs, repointed to `astraeus-data-<p>/data/<p>-moons/`, and call `provideIndex` with a dynamic import of `astraeus-data-<p>/index.json`; the site registers `PICTURES` first in `main.tsx` (`src/registerData.ts`, inlined into the entry chunk). Demos and site depend on the data packages as workspaces.
- Tests moved or repointed: vitest.setup.ts registers pictures and reads indexes/chunks from the installed data packages; tests/moonData.ts; fit-error and catalogue tests, venusMap, homePage, jupiterMoonCatalogue, planetSystems read the new paths; jupiter-view-before.json picture URLs now name astraeus-data. Boundary test: 12 packages; data packages import only the engine; the engine's code imports none but its tests and vitest.setup.ts may; demos and the site may import them; `data/*` globs into data packages allowed (DATA-OF-DATA-PACKAGE); new case tests. `check:engine-alone` now copies and links the data packages too.
- Public build (`ASTRAEUS_PUBLIC_BUILD=1 npm run build`), before / after: 99 / 93 files, 25,994,416 / 24,870,539 B. Same file list by name (hashes aside) except (1) the five outer-planet moon index chunks `mars/neptune/pluto/saturn/uranus-moons.js` are gone: before they were built because the engine's core imported them lazily and were never fetched (load-budget.mjs said so); now only the planet systems that the public site does not offer import them, so they drop out (1.0 MB less in dist, nothing a page fetched); (2) `ephemerisProvenance.js` folded into another chunk (chunk-graph effect; added to the `SPLIT_CHUNKS` "listed when present, not required" set in load-budget.mjs). Load budget: index 14 files / 403,908 B, assets 22 / 617,758, Apollo 10 files / 4,198,320 (was 11 / 4,197,737), Jupiter 45 / 6,802,829 (was 6,801,697), showers 19 / 9,946,122 (was 20 / 9,945,542), geminids 19 / 12,432,698; all under limits; public-build-assets ok. A normal `npm run build` was run last.
- Tools: importer scripts (`horizons-moons.mjs`, `planet-moon-catalogues.mjs`, `jupiter-moon-catalogue.mjs`, `home-curve-fit.mjs`, `horizons-moons-measure.mjs`, `moon-fit-errors.mjs`) point at the new data folders; they were not run (Horizons cache not used).
- Not verified (no browser): that a customer's Vite/webpack build copies the rewritten `new URL` assets from the compiled packages (the T-159 spike proved it for Vite); `mount` with real moon data end to end (unit-tested to the definition and installData only); `data/moons/*.json` still carry the old `data/ephemerides/<p>-moons/index.json` path string in their `ephemeris.path` metadata (a record of origin; changing it would change the shipped bytes).

## Drift Notes

- Moon definitions and visual shells stayed in the engine; only pictures and their licence records moved (the plan said "visual records/definitions"). Reason: the definitions are physics (parent, radius, GM, bindings) the core needs, and the shells are a colour; only the picture needs the data package. Coordinator may want it noted in Design.
- Engine README, Design Codebase Map and AGENTS.md Codebase Map still describe `data/ephemerides` as moon positions and the engine as source only; the Codebase Map needs rows for `astraeus-data*` (not edited: Design/AGENTS are not this Task's files).
- The T-160 note "every catalogued body is still offered" is now true only for bodies without a data requirement; `Scene.addBody` by id applies `readyMade` refs.

Coordinator spot check (2026-10-23T07:45:01Z): gates, engine-alone and check:pack re-run, all pass; dev preview restarted on :5490 and five pages (Apollo, Showers, Planets Jupiter/Saturn/Venus) loaded headless with no page errors (load only, no screenshots; looks are the owner's and the Full Check's).
