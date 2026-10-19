---
id: I-046
title: The front page, assets page and README still carry out-of-date claims (Jupiter and Io card, Io row, panel count, shower address, page-size table)
type: drift
status: resolved
source:
  kind: check
  check: C-085
  actor: {role: checker, session: o016-check-20261020}
  at: '2026-10-19T20:45:00Z'
tasks: [T-064, T-057]
checks: [C-085, C-086, C-087]
guardrail_ids: [PROV-01]
severity: medium
resolution:
  disposition: verified
  check: C-087
  actor: {role: checker, session: o016-recheck2-20261020}
  at: '2026-10-19T21:40:00Z'
  reason: 'C-087 CLEAR: assets.html:337 now says twelve observed, three modelled, one illustrative (16), matching an independent count of data/stories/*/panels.json; the new test fails with "Thirteen" restored; items 1, 2, 4, 5, alt text and address verified in C-086 and unchanged since.'
history:
  - at: '2026-10-19T20:45:00Z'
    actor: {role: checker, session: o016-check-20261020}
    kind: observed
    note: 'Found by the O-016 Full Objective Check C-085 at HEAD 92e7068. T-064 outcome: "Every credit and figure on the pages matches the code and data as they stand ... No stand-in or out-of-date claim remains." Later Objectives (O-020 T-089/T-091/T-092, O-024 T-093, O-025 T-098/T-101) changed the app without updating these lines.'
    check: C-085
  - at: '2026-10-20T09:00:00Z'
    actor: {role: executor, session: i046-repair-20261020}
    kind: owner_decision
    note: 'Owner decision 2026-10-20 (recorded on instruction from the coordinating session): the owner chose "astraeus.anipatke.com" as the site address, https://astraeus.anipatke.com/. Every astraeus.curiouscode.ai in index.html, assets.html and README.md is replaced.'
  - at: '2026-10-20T09:10:00Z'
    actor: {role: executor, session: i046-repair-20261020}
    kind: repair_attempted
    note: 'Direct repair; not verified, left open for a checker. See "Repair evidence" in the body.'
  - at: '2026-10-19T21:35:00Z'
    actor: {role: checker, session: o016-recheck-20261020}
    kind: rechecked
    note: 'C-086 (NEEDS WORK): items 1, 2, 4, 5, the README alt text and the address change verified against code and data. Item 3 not fixed: assets.html:337 now says "Thirteen panels are marked observed"; the badges in data/stories/*/panels.json give 12 observed (7 apollo11, 1 perseids, 2 geminids, 2 jupiter-io), 3 modelled, 1 illustrative = 16. Repair: "Twelve", ideally with a test that counts badges from the data. Left open.'
    check: C-086
  - at: '2026-10-19T21:34:00Z'
    actor: {role: executor, session: o016-coordinator-20261020}
    kind: repair_attempted
    note: 'Item 3 repaired after C-086: assets.html:337 "Thirteen" -> "Twelve" (owner chose "Fix it and add a test"). New test in tests/assetsPageCredits.test.ts counts the panels and badges in data/stories/{apollo11,geminids,jupiter-io,perseids}/panels.json and requires the row total (16) and the sentence "twelve panels are marked observed, three modelled and one illustrative"; with "Thirteen" restored it fails, with "Twelve" it passes. Gates at 2026-10-19T21:33Z: typecheck pass; vitest 77 files, 1123 passed, 1 skipped; npm run build pass; ASTRAEUS_PUBLIC_BUILD=1 npm run build pass; public-build-assets.mjs ok; git diff --check clean. No browser run: page text and a test only. Not verified, left open for a checker.'
  - at: '2026-10-19T21:40:00Z'
    actor: {role: checker, session: o016-recheck2-20261020}
    kind: rechecked
    note: 'C-087 (CLEAR): independent count of data/stories/*/panels.json gives 16 panels, 12 observed, 3 modelled, 1 illustrative; assets.html:337 matches. Mutation "Twelve"->"Thirteen" fails the new test, restored byte-for-byte. Gates, public build and validator pass fresh. Resolved as verified.'
    check: C-087
---

# I-046: The front page, assets page and README still carry out-of-date claims

## Summary

O-016 promises a launch-ready public site whose pages describe the product as it stands (T-064 outcome and Done When 2-3; PROV-01: approximated data is never presented wrongly). Work after T-064 moved the app on, and five page claims no longer match the code and data. The most visible is the Jupiter demo card on the front page, which describes the old Jupiter demo; the same page's own curve-fit section contradicts it.

## Evidence

All at HEAD `92e7068` (2026-10-20), working tree clean apart from `.savepoint/` records.

1. **Front page Jupiter card** (`index.html:340-342`): eyebrow "January 2000"; text "Io goes round in about 42 hours. Its orbit comes from published mean elements, an approximate demonstration, and Io's info panel says so." Actual: the demo opens on Jupiter at 2016-11-04 (`src/experiences/jupiter-io/jupiterIo.ts:33` `JUPITER_WINDOW`, `startView` focus jupiter at line 198), lists 115 moons by family with four mapped moons (`data/moons/jupiter.json`), and Io is placed from the JPL Horizons curve fits, not mean elements (`src/core/bodies/io.ts:136` `position: fittedMoonPosition("Io", 0.0994)`, line 146-147 `IO_BINDING` uses `createFittedMoonTrajectory`). Io's info panel therefore no longer says "approximate demonstration". The same page's curve-fit section (`tests/homePage.test.ts` "draws Io's real fitted pieces") shows Io from the fits, so the page contradicts itself. The portfolio page (T-106) was already corrected to "Opens on Jupiter ... 115 ... moons"; the app's own front page was not. The 42-hour period is still true.
2. **Assets page Io row** (`assets.html:229-233`): "Io — Mean orbit about Jupiter. A simple model, checked against JPL Horizons. Good for showing, not for navigating. JPL published values." Actual: Horizons curve fits, as above (Design.md line 81 states the change since T-098).
3. **Assets page story-panel row** (`assets.html:336-338`): "Apollo 11 · Perseids", "Seven panels for Apollo 11 and three for the Perseids", "10 panels". Actual: `data/stories/{apollo11,perseids,geminids,jupiter-io}/panels.json` hold 7, 3, 3 and 3 panels (16), added by T-089/T-092.
4. **README shower address** (`README.md:39`): "A new file in that folder becomes `?experience=shower-<name>`." Actual since T-091: `?experience=showers&shower=<name>` (`src/main.tsx:30`); `shower-<name>` is a retired address that falls back to Apollo (`src/main.tsx:55`, `tools/validate/public-addresses.mjs` retired list).
5. **README page-size table** (`README.md:108-120`): says each limit is the one the validator enforces, but lists the 2026-10-17 limits. Today `node tools/validate/public-build-assets.mjs` enforces, for example, Jupiter-Io raw 6,960,000 B (README 4,000,000 B), assets 274,000 B (README 260,000 B), showers 10,090,000 B (README 11,190,000 B), whole build 25,360,000 B (README 22,500,000 B); Design.md line 172 names this README table as the place the limits are listed.

Minor, same pass: the README picture `site/apollo-moon.jpg` has alt text "... with the touchdown story panel open" (`README.md:17`), but since T-076 that file is the owner's clean screenshot with no panel open.

Missing test evidence: `tests/assetsPageCredits.test.ts` checks credit rows against licence records only; `tests/homePage.test.ts` checks addresses, pictures and the curve-fit section but no card text; nothing checks the Io model row, panel counts, README addresses or the README budget table against their sources.

## Proof Needed

- `index.html` Jupiter card describes the current demo (opening date and what it shows) and makes no mean-element or "approximate demonstration" claim for Io; `assets.html` Io row names the Horizons curve fits; the story-panel row counts all four stories' panels from the data; `README.md` gives the `?experience=showers&shower=<name>` address and a page-size table equal to `tools/validate/load-budget.mjs` (or points to it instead of copying numbers); the README Apollo alt text matches the picture.
- Preferably a test that reads panel counts and the README budget rows from their sources, so they cannot drift again.
- `npm test`, `ASTRAEUS_PUBLIC_BUILD=1 npm run build` and `node tools/validate/public-build-assets.mjs` pass; a checker confirms by reading the pages against the code.

## Repair evidence (executor, 2026-10-20)

Stale claims, new text, source:
1. Front page Jupiter card (`index.html`): eyebrow "January 2000" is now "November 2016" (`JUPITER_WINDOW`, 4 to 18 Nov 2016, `src/experiences/jupiter-io/jupiterIo.ts:33`). Text now: opens on Jupiter, lists its 115 known moons by family (`data/moons/jupiter.json`, 115 moons), Io, Europa, Ganymede and Callisto mapped (the four pictures in `tools/validate/load-budget.mjs`), Io about 42 hours, position from the JPL Horizons curve fits "described above" (the curve-fit section, `src/core/bodies/io.ts` `fittedMoonPosition`/`IO_BINDING`). Mean-element and "approximate demonstration" claims removed.
2. Assets page Io row: sub "Curve fits to JPL Horizons"; text says the path about Jupiter is rebuilt from short fitted pieces of Horizons positions, within centimetres over the demo window (the front page's own curve-fit section gives 3.5 cm worst case).
3. Assets page story-panel row: counted from `data/stories/*/panels.json`: apollo11 7 (7 observed), perseids 3 (1 observed, 1 modelled, 1 illustrative), geminids 3 (2 observed, 1 modelled), jupiter-io 3 (2 observed, 1 modelled). Total 16: 13 observed, 3 modelled, 1 illustrative. Row now says 16 panels, names all four stories.
4. README shower address: now `?experience=showers&shower=<name>`, and `?experience=showers` opens the first shower (`src/main.tsx:27-30`).
5. README page-size table: re-measured with `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `node tools/validate/load-budget.mjs dist`; limits copied from `PAGES` and `BUILD_LIMIT` in `tools/validate/load-budget.mjs` (index 600,000, assets 274,000, Apollo 4,370,000, Jupiter-Io 6,960,000, showers 10,090,000, geminids 12,700,000, build 25,360,000 raw). Sentence about "measurement plus 5%" narrowed to the app pages and whole build, since the two site-page limits are older and sit above their measurements.
6. README Apollo picture alt text no longer says the touchdown panel is open.
7. Address: every astraeus.curiouscode.ai replaced by astraeus.anipatke.com (index.html canonical, og:url, og:image; assets.html canonical; README try-it links, assets link, deploy note). `grep curiouscode` over the three files and tests/ now finds nothing.

Commands run (all passed): `npm run typecheck`; `ASTRAEUS_PUBLIC_BUILD=1 npm run build`; `node tools/validate/public-build-assets.mjs` (ok, 75 files checked); `node tools/validate/load-budget.mjs dist` on the public build (all pages under their limits); `npx vitest run` (77 files, 1122 passed, 1 skipped); `npm run build` (plain, last, so `dist/` is the non-public build).

Files changed: `index.html`, `assets.html`, `README.md`, this Issue. No tests changed.

Unreferenced images (C-085 observation, not deleted; the owner decides): `site/apollo-phone.jpg`, `site/geminids-gmn.jpg`.

Limitations: no new test added that reads panel counts or README budget rows from their sources (the Issue's "preferably"); the stale lines could drift again. `tools/validate/browser-lite.mjs` not run: no scene, camera, control or UI code changed, only page text, README and an address. No app fault found. Page-size table measured on this machine's public build, not on the deployed one.
