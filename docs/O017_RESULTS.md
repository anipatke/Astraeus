# O-017 results: before and after

Measured on 2026-10-17 on the final tree of branch `o017-simplify` (T-072). "Before" is the T-066 baseline in `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` section 3 (`docs/evidence/o017-before-20261016T205125Z/first-load.json`, `docs/evidence/objective-check-20261016T190443Z/summary.txt`). Lines are `cat | wc -l`, as before. Evidence for the after figures: `docs/evidence/o017-t072-full-20261017T034453Z/` (full browser run, pictures, contact sheet), `docs/evidence/o017-t072-gates-20261017T035747Z/` (gates), `docs/evidence/o017-t072-vs-original-20261017T034637Z/` (pictures against the original set).

## Size of the code

| Area | Before (files / lines) | After (files / lines) |
|---|---|---|
| `src/` total (`.ts`, `.tsx`, `.css`) | 122 / 14,552 | 141 / 15,232 |
| `src/app/` | 36 / 4,921 | 46 / 5,565 |
| `src/shell/` | 18 / 2,703 | 18 / 2,702 |
| `src/core/` | 36 / 3,092 | 38 / 3,254 |
| `src/experiences/` | 12 / 2,097 | 18 / 2,098 |
| `src/assets/` (code) | 14 / 953 | 14 / 827 |
| `src/synthetic/` | 4 / 620 | 4 / 620 |
| `tests/` | 76 / 13,196 | 80 / 13,436 |
| `tools/` | 56 / 10,461 | 55 / 9,884 |

The source grew (+680 lines, +19 files): the splits of T-069 add files and headers, and the graphics-chip path of T-073 and T-075 adds about 700 lines of new capability. Removing CAMS, Yale, the NASA map and the switches took out code in `src/assets/` (-126) and `tools/` (-577); the biggest functions are smaller (see the Task checks). Tests: 919 passed and 1 skipped (before: 907 and 1).

## Address switches the app reads

21 before; 16 after: `experience`, `view`, `t`, `scale`, `up`, `span`, `orbits`, `milkyway`, `milkywaybrightness`, `sky`, `markerpx`, `sunglow`, `sunbrightness`, `sunglowscale`, `labels`, `loop`. Removed: `source`, `stars`, `skymap`, `lighting`, `sunLight`. (The candidates page expected 17; `stars` and `source` were counted once each and `skymap` was removed with them.)

## First-load bytes per page (public build; same method as before: files fetched until 4 s after the scene settled)

| Page | Before raw | After raw | Before gzip | After gzip |
|---|---|---|---|---|
| `index.html` | 630,024 | 750,590 | 577,211 | 683,045 |
| `assets.html` (phone) | 551,506 (530,438) | 549,797 (528,729) | 509,886 (488,845) | 509,479 (488,438) |
| Apollo 11 (default) | 4,046,212 | 4,048,704 | 2,724,405 | 2,723,964 |
| `earth-moon` | 3,678,856 | 3,681,640 | 2,605,465 | 2,605,312 |
| `jupiter-io` | 3,809,334 | 3,812,121 | 1,898,009 | 1,897,880 |
| `shower-perseids` | 10,922,682 | 10,658,580 | 7,313,022 | 7,076,355 |
| `shower-geminids` | 13,692,592 | 13,143,053 | 8,372,209 | 7,882,565 |
| Whole public build on disk | 22,107,479 | 21,397,574 (raw), 14,127,571 (gzip) | | |

The Perseids and Geminids pages are 2.4% and 4.0% lighter raw, 3.2% and 5.8% lighter gzip (lossless column layout of the stream files, T-070). Textures were kept at their original quality by owner decision. The home page is heavier by design: it now shows five demo pictures (T-074, T-076) where the before set had fewer; the budget tool (`tools/validate/load-budget.mjs`) counts the home page at 530,611 B raw (limit 600,000), 479,624 gzip (limit 530,000) because it lists only the files a visitor downloads on first view, while the picture tool above waits until the lazy pictures have loaded. App files per page: 11 to 19 (before 13 to 24).

## Test and browser run times

| | Before | After |
|---|---|---|
| `npx vitest run` | 30 s | 36 s (919 tests in 55 files, run alone) |
| Full browser run | 37 min 56 s (23 scripts, one after another) | 9 min 26 s (`tools/validate/run-full.sh`, 566 s including servers and the public build; pictures alone first, then three lanes) |
| Typecheck, build, public build | about 1 s together | typecheck, build and public build all pass (not timed) |

## Shower frame figures (software rendering, 12 s at one week per second; from C-053 and C-055)

| Run | Before T-073 | After T-073 (slicing and GPU blend) | After T-075 (Kepler on the graphics chip) |
|---|---|---|---|
| Desktop Perseids, frames over 60 ms | 7 (max 83 ms) | 0 to 1 (max 50 ms) | 0 (max 50 ms) |
| Desktop Geminids, frames over 90 ms | 28 (max 117 ms) | 0 | 0 |
| 2x slowdown, Geminids, over 90 ms, median | 28 | 28, 66.6 ms (not improved) | 1, 50.0 ms |
| 4x slowdown, Perseids, over 90 ms | not measured | 28 (T-075 start) | 0 |
| 4x slowdown, Geminids, over 90 ms, median | about 3 frames a second | 29, 366.7 ms (about 3 frames a second) | 13, 66.6 ms (about 15 frames a second) |

These are software-rendered figures on a busy desktop; a real phone is the real test and is still owed by the owner.

## Pictures

Against the approved baseline (`docs/evidence/o017-baseline-20261017/`): 20 pictures, 7 identical, largest difference 0.0231% of pixels more than 16 levels off (tolerance 0.024%); nothing flagged. Against the original T-066 set: 5 identical, 4 site pictures differ in size on purpose, 4 shower pictures are above tolerance as expected (the dots now sit on their true orbits near the Sun: Geminids 0.2108% desktop and 0.0319% phone, Perseids 0.2522% and 0.0972%), and the rest are within tolerance (the largest is 0.0231%, Jupiter-Io wide on the phone). Contact sheet: `docs/evidence/o017-t072-full-20261017T034453Z/contact-sheet.html` (and `.png`).
