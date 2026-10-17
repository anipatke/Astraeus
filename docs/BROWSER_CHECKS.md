# Browser checks: what runs, what moved, where each scenario is covered

Owner direction, 2026-10-17: "One 10sec visual inspection beats 40mins of auto browser checks." Automation keeps only what eyes cannot judge: crashes and console errors on every page, shipped-data and licence rules, numbers and credits a picture cannot show, and a pixel comparison against the before pictures. The look is judged by the contact sheet.

Environment for every command: `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`.

## The three tiers

| Tier | When | Command | Time |
|------|------|---------|------|
| Lite | Task handoff, Quick Task Checks | `node tools/validate/browser-lite.mjs` (dev server, fresh `ASTRAEUS_EVIDENCE_DIR`), plus the area's own script if you touched one | about 1.5 min |
| Full | Full Objective Checks, before a release or merge | `tools/validate/run-full.sh` (starts its own servers and evidence directory; three lanes) | see the last run below |
| On request | Changing the code the script measures | `node tools/validate/on-request/<script>.mjs` | each 1 to 2 min |

The full run also takes the pictures from the public build, compares them with the before set, and writes `contact-sheet.png` (before beside after, desktop and phone, with the differing-pixel figure). Look at that one page for about 10 seconds.

## In the full run

`browser-lite`, `public-build-assets` (the licence and shipped-data gate), `browser-public-showers`, `capture-experience-pictures` + `diff-screenshots` + `contact-sheet`, `browser-spike02` (Apollo telemetry numbers), `browser-spike03`, `browser-shell`, `browser-anchor-labels`, `browser-synthetic`, `-ring`, `-listed`, `browser-view-link`, `browser-earth-moon`, `browser-jupiter-io`, `browser-story-panels`, and the two trimmed scripts below. Last measured run: see the Task T-071 evidence.

## Trimmed in place

| Script | Before | Now | Scenario no longer repeated, and where it is still asserted |
|--------|--------|-----|-----|
| `browser-showers.mjs` (Perseids, Geminids) | every scenario at desktop and phone | desktop runs everything; phone runs the plain load, the peak (stream drawn, details, GMN credit, member count, clump and not-shown statements), zoomed-out and window details | phone start and end stream drawn, rate rising to the peak, Sun-Earth, bodies and labels, whole orbit, crossing, year sweep, loop, ecliptic flat: desktop run (same scene geometry; the phone layout is the part that differs, and it is checked once) |
| `browser-sky.mjs` | Apollo, Earth-Moon, Perseids at both sizes (6 combinations) | Apollo at both sizes (2 combinations) | Earth-Moon and Perseids sky (any size): one shared sky component (`SkyView`), covered by the Apollo runs; canvas drawing on the phone by `browser-lite` and the pictures |

## Moved to on request (`tools/validate/on-request/`)

| Script | Why not in the full run | Where its scenarios are covered now |
|--------|-------------------------|--------------------------------------|
| `browser-sun.mjs` | A look check: halo size and brightness, live sliders | Look: contact sheet (the Perseids picture shows the Sun). Settings parsing and limits: `tests/sunLook.test.ts`. Mounts and console errors: lite. "No stray Sun in other experiences": lite opens each (a stray halo is a picture difference). Run it after changing the Sun's look |
| `browser-synthetic-belt.mjs` | Dots drawn in a made-up belt | Lite opens it at both sizes (canvas lit, panel, no errors); camera reach rules: `tests/experienceDefinition.test.ts`, `tests/compositions.test.ts` |
| `browser-synthetic-eccentric.mjs` | Marker rule, solar-system scale and framing of a made-up orbit; precision | Marker rule: `tests/bodyMarkers.test.ts`; the experience loads in lite; precision: the `browser-precision.mjs` method. Run it after changing marker or framing code |
| `browser-marker-existing.mjs` | Measurement only (records screenshots, asserts only that views mount) | Mounts: lite; look: pictures |
| `browser-precision.mjs` | Measurement of floating-origin wobble in pixels | Run after changing the camera, floating origin or scale code |

## Archived (`tools/archive/validate/`, one-off tools of finished work)

`conversion-proof.mjs` and `anchor-consistency.mjs` audited the Apollo 11 anchor data (Spike 02, O-002) and read only committed data; `capture-apollo-compare.mjs` shot a one-off comparison. Nothing imports them. The two strings in `tools/apollo11/config.json` and `data/apollo11/normalised/anchors.json` that name `tools/validate/anchor-consistency.mjs` are data text and were left unchanged to keep that data byte-identical.

Superseded briefs `docs/ASTRAEUS_SPIKE_02_BRIEF.md`, `..._03_BRIEF.md`, `..._03_METRIC_VISUALS_BRIEF.md` and `..._04_BRIEF.md` moved to `docs/archive/`; links in the docs that cite them were updated.

## Not asserted any more by automation

Nothing else was dropped. `capture-site-pictures.mjs` stays (it makes the site and README pictures).

## Unit test moved out of the default run

The 30,000-member frame-time assertions in `tests/listedOrbitGroup.test.ts` flaked twice under load. They run only with `ASTRAEUS_PERF=1 npm test -- listedOrbitGroup`; the fill itself (30,000 finite positions) and the bit-identical output test still run by default.
