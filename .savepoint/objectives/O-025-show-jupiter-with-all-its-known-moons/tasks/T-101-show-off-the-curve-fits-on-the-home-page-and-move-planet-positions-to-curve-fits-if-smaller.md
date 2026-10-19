---
id: T-101
title: Show off the curve fits on the home page, and move planet positions to curve fits if smaller
objective: O-025
status: in_progress
stage: audit
depends_on: [{task: T-096, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
check_waiver:
    task: T-101
    reason: "Owner waived the optional Task Check for O-025 ('Skip, one check at the end'); the Full Objective Check covers it."
    actor:
        role: owner
        session: t101-builder-lane-20261019
    recorded_at: "2026-10-19T00:00:00Z"
---

# Show off the curve fits on the home page, and move planet positions to curve fits if smaller

## Outcome

The Astraeus home page gains a short "how it works" section that explains curve fits in plain words with a small live picture built from the real fitted data; and the planet position series move to the same format if that is smaller at equal accuracy.

## User Check

Open the home page: a short section shows one moon's path drawn from many dots and from a few curve pieces, with a slider through time and the real size saving and accuracy beside it.

## Done When

1. O-025 Decision 10 (owner: "Sounds like a cool thing to show off on the main page"): plain words (the "photos versus recipes" explanation the owner liked), a small live visual from real T-096 data, the measured size saving and accuracy against NASA; within the home page's load budget; reduced-motion friendly; phone layout.
2. O-025 Decision 11: the planet position series (`planetModels` chunk, about 1.4 MB) are refitted as curve fits; if smaller at equal accuracy (C-022/C-023 checks still pass) they replace the series, otherwise the measurement is recorded and the series stay.
3. Browser checks through the shared driver (the section renders, the slider moves); full run passes; owner look.

## Context Files

`index.html`, `src/core/planetModels.ts`, `src/core/planetSeries.ts`, `tools/validate/load-budget.mjs`, `tools/validate/capture-site-pictures.mjs`, `tests/homePage.test.ts`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

O-025 Decisions 10-11.

## Guardrails

PROV-01, ARCH-01, TEST-01.

## Implementation Plan

1. Home page section and live visual.
2. Planet refit measured; swap if smaller.

## Boundaries

Home page section and planet position format only.

## Technical Verification

Configured gates, accuracy tests, home page browser check, full run. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (lane o025-t101, builder session t101-builder-lane-20261019)

Base commit `4b62ea9`. Run folder: `docs/evidence/o025-t101-20261019/` (`planet-fits.json`, `planets-size.json`). Browser checks deferred to the Full Objective Check (owner, 2026-10-19): `browser-home-curve-fits.mjs` is written, added to `run-full.sh` (lane B) and `docs/BROWSER_CHECKS.md`, and was NOT run. Owner skipped the optional Task Check (`check_waiver` above).

### Per-criterion outcomes

1. Decision 10, home page section. **Met in code and unit tests; the look and the browser run are open (owner look, Full Objective Check).** A "Photos, or a recipe." section (`#curve-fits`, after the four-layers band) explains it in plain words and draws Io's orbit twice from the real committed data: 325 table dots (a row every 10 minutes, what a table needs to stay within a metre) and the fitted curve of 2 of Io's pieces (96 numbers) with Jupiter's one piece (48 numbers) subtracted, with joint markers. A slider (0 to 54 hours) moves a marker on both and a readout gives hours and Io's distance from Jupiter. Measured figures beside it: 47x smaller for Io (1,077,981 B of fits against 50,492,208 B as a six-float64 table, 2010-2030), Io's worst difference from Horizons 3.5 cm (index), all 115 moons within 1 m (worst 0.989 m), and the planets (below). Numbers come from `tools/import/home-curve-fit.mjs`, which writes the `fit-data` block in `index.html` from `data/ephemerides/jupiter-moons/` and the T-096 `measure.json`; `tests/homePage.test.ts` (5 new tests) checks the page's coefficients equal the committed 2016 chunks, Io stays 400,000 to 445,000 km from Jupiter and in its plane across the window, every quoted figure equals its source, the CSS rules for phone first, and runs the page script against a stub DOM (325 dots, the marker moves, the readout reads "Hour 54.0"). Within the load budget: `index.html` 410,384 B raw (limit 600,000), 367,828 B gzip (limit 530,000), measured on the public build; no limit raised. Reduced motion: the section has no animation or transition of its own (test), the slider is the only mover.
2. Decision 11, planets. **Met: swapped.** Curve fits are smaller at equal accuracy, so they replace the series. `planetModels` chunk of the public build: 1,391,805 B to 214,459 B raw, 560,550 B to 148,907 B gzip (6.5x raw). Four fits of the full VSOP87A series (Mercury 48-day pieces, degree 23, 99,050 B; Venus 192 days, degree 25, 25,504 B; Mars 192 days, degree 20, 18,861 B; Jupiter 256 days, degree 29, 14,914 B; quantum 0.1 km) over 1969-01-01 to 2045-01-01. Worst difference from the series at independent dates 0.71, 0.63, 0.80, 0.57 km (target 1 km); the Horizons maxima in `docs/ASTRONOMY_VALIDATION.md` (30.4, 50.1, 95.8, 1269.4 km) are against model errors 40 to 1000 times larger. `tests/planets.test.ts` (the C-022/C-023 accuracy scope) passes unchanged on the fits; `tests/planetFits.test.ts` (4 new) compares the fits with the series (under 1 km, 1972-2045 across the leap seconds; under 8 km 1969-1971) and checks the out-of-span error. Orb's UTC to TT adds each leap second as a step, which a smooth fit cannot follow, so the fit is a function of TT and the runtime converts with a table stored beside the data. Dates outside 1969-2045 now throw RangeError instead of being extrapolated (the span covers every date the repo uses, including the full-turn orbit searches to 2039).
3. Browser checks through the shared driver. **Written, not run (deferred).** `tools/validate/browser-home-curve-fits.mjs` through new driver functions `openHomeCurveFits`, `curveFitSetMinutes`, `curveFitReadout`, `curveFitLayout`; the driver guard test passes.

### Phone first, no collisions (owner rule 2026-10-19)

Designed for 375 px first: the panels are one column (`grid-template-columns: minmax(0, 1fr)`), two only from 760 px; the pictures are SVG at `width: 100%` with a 1:1 aspect ratio (no fixed widths anywhere in the section's CSS; a test asserts it); every grid child has `min-width: 0` and long text `overflow-wrap: anywhere`; the slider row is a full-width range input with `min-height: 44px` and a real `<label for>`; text is 12.5 px or more (the smallest text is the 0.78rem mono label and readout); the three figures use `repeat(auto-fit, minmax(min(100%, 220px), 1fr))` so they stack on a phone. Collisions: the section is its own `.band` in normal flow (no absolute or fixed positioning, no negative margins), the readout is below the slider rather than over the picture, and nothing is layered over other page content. `browser-home-curve-fits.mjs` asserts all of this at 375, 320 and 1280 px (and with reduced motion): no sideways scroll, nothing past the screen edge, slider at least 44 px, text at least 12 px, one or two panel columns, no two pieces of the section overlapping, no overlap with the sections above and below. Not run yet.

### Commands run (lane, 2026-10-19)

- `npm run typecheck` 11:20:18 UTC: exit 0.
- `npm run build` 11:20:18 UTC: exit 0 (the existing chunk-size warning only).
- `npm test` 11:20:19 UTC: 75 files, 1107 passed, 1 skipped, 0 failed (rerun after the last edits below, see the commit).
- `git diff --check`: clean.
- `node tools/validate/load-budget.mjs <public build>`: all seven sets ok; `scales.js` removed from the shared page set because the build no longer makes that chunk (it was split out only by the planet module's Orb imports; the page set list was out of date, no limit changed).
- `node tools/import/planet-fits.mjs --write --report docs/evidence/o025-t101-20261019/planet-fits.json`, `node tools/import/home-curve-fit.mjs --planets docs/evidence/o025-t101-20261019/planets-size.json`.
- No browser, no screenshots, no headless Chromium.

### Files

Read (Context Files): `index.html`, `src/core/planetModels.ts`, `src/core/planetSeries.ts`, `tools/validate/load-budget.mjs`, `tests/homePage.test.ts`, the Objective. `tools/validate/capture-site-pictures.mjs` is archived (T-102), ignored. Extra reads (logged): `src/core/chebyshev*.ts`, `src/core/timeScale.ts`, `src/core/astronomyAdapter.ts` (planet method), `node_modules/@lizard-isana/orb/src/orb-time.js` and `orb-planet.js` (how Orb turns UTC into TT: the leap steps), the T-096 Task evidence and `docs/evidence/o025-t096-*/measure.json` (the table figures), `tools/validate/driver.mjs`, `driver-guard.mjs`, `run-full.sh`, `docs/BROWSER_CHECKS.md` (conventions), `docs/ASTRONOMY_VALIDATION.md` (planet section), `tests/jupiterIo.test.ts` (the full-turn span that needs dates to 2039).
Changed: `index.html`, `src/core/planetModels.ts`, `src/core/planetSeries.ts` (comments), `data/ephemerides/planets/planets.json`, `tools/import/planet-fits.mjs`, `tools/import/home-curve-fit.mjs`, `tools/validate/driver.mjs`, `tools/validate/browser-home-curve-fits.mjs`, `tools/validate/run-full.sh`, `tools/validate/load-budget.mjs`, `docs/BROWSER_CHECKS.md`, `docs/ASTRONOMY_VALIDATION.md`, `tests/homePage.test.ts`, `tests/planetFits.test.ts`, this Task, the run folder. The shell files of T-099 were not touched.

### Limitations

- The browser check and the owner's look at the section are open. Layout is asserted only by the unwritten-run script and by CSS tests; no headless render was made.
- The fit is checked against the VSOP87A series it replaces and (through `tests/planets.test.ts`) against Horizons at six dates, not against Horizons at many dates. Before 1972 the fits differ from Orb by a few km (Orb's monthly TT - UTC steps), within the Horizons test limits.
- Dates outside 1969-2045 throw where the old series extrapolated.
- The `index.html` figures are static text with a script that rewrites them from the data; with scripts off the text shows the generated defaults (matching today's data) and the picture is empty.
- The load-budget limits for the app pages now have 1.2 MB (showers) of headroom after the planet chunk shrank; lowering them to the new measurement plus 5% is an owner decision (not done).

### Drift Notes

- **Design reconciliation (deferred to the O-025 integration Task):** `.savepoint/Design.md` should say planet positions are curve fits (`data/ephemerides/planets/`, `planetModels.ts`) of VSOP87A over 1969-2045 in TT, not the Orb planet series loaded lazily; and the home page has a data-driven section fed by `tools/import/home-curve-fit.mjs`.
- No Task, Check or Issue created (lane rules).
