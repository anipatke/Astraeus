---
id: T-106
title: Fix the links and wording on the portfolio's Astraeus page
objective: O-016
status: in_progress
stage: audit
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o016-portfolio-planning-20261020}
check_waiver:
  task: T-106
  reason: 'Owner skipped the optional Task Check for a text-and-links change and will judge the page on the local dev server ("Skip it, I''ll look myself").'
  actor: {role: owner, session: o016-portfolio-planning-20261020}
  recorded_at: '2026-10-20T00:00:00Z'
---

# Fix the links and wording on the portfolio's Astraeus page

## Outcome

Every card on https://anipatke.com/astraeus opens the demo it names, every fact on the page matches what the live Astraeus app shows today, and the text reads in plain words. The layout is unchanged.

## User Check

Run the portfolio locally (`npm run dev` in `/home/user/code/main-portfolio`) and open `/astraeus`. Click each demo card and its open button: Apollo 11, the Perseids, the Geminids and Jupiter each open their own demo, not Apollo. There is no Earth & Moon card. Read the card text and the page's other text: dates, counts and descriptions match the app, and nothing reads like jargon.

## Done When

1. Each preset's `url` uses an experience id the app accepts (read from `src/main.tsx`): Apollo 11 the default, the Perseids `?experience=showers`, the Geminids `?experience=showers&shower=geminids`, Jupiter `?experience=jupiter-io`. A headless load of each URL on the local public build (`ASTRAEUS_PUBLIC_BUILD=1`) opens that experience, read through `tools/validate/driver.mjs` readouts, not by picture. Output goes to a fresh scratch or `docs/evidence/` run directory.
2. The Earth & Moon preset is removed, with nothing left pointing at it (selectors, thumbnails, keyboard order, counts like "five demos").
3. Stale facts corrected against the app and `assets.html`: the Jupiter card describes what the Jupiter page shows now (Jupiter first, its 115 catalogued moons by family, the four mapped moons); the shower dates match the app's own shower settings; star counts, orbit counts, event and panel counts, and the source names in each telemetry line match the shipped data. Each corrected fact is listed in the evidence with its source in the app.
4. A plain-words pass over every visible string on the page: short sentences, no internal names, step IDs or file paths, nothing claimed that the app doesn't do. Card count and layout unchanged apart from the removed card.
5. Other links on the page (GitHub, assets page, the app's home, the sibling app links) checked to return a page; any dead one is reported to the owner, not guessed at.
6. In `/home/user/code/main-portfolio`: `npm run lint` and `npm run build` pass. Nothing committed, pushed or deployed there.

## Context Files

`/home/user/code/main-portfolio/components/astraeus/AstraeusBridge.tsx`, `/home/user/code/main-portfolio/app/astraeus/page.tsx`, `/home/user/code/main-portfolio/package.json`, `src/main.tsx`, `index.html`, `assets.html`, `tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

Design: Components/Codebase Map; Interfaces and Data Flow, Experience plug-in boundary.

## Guardrails

PROV-01, PROV-02, STYLE-01..10 (advisory).

## Implementation Plan

1. Read the experience ids the app accepts in `src/main.tsx`; if Perseids, Geminids or Jupiter cannot be opened by URL on the public build, stop and report (REPLAN REQUIRED) rather than linking around it.
2. Fix each preset `url`; remove the Earth & Moon preset and everything that refers to it.
3. Collect each fact on the page, look it up in the app (front page, assets page, experience data), and correct or cut it. Record the list.
4. Plain-words pass over all visible text, keeping the page's structure.
5. Check the remaining links; load each demo URL headless once on the local public build through the shared driver (one browser job at a time, no screenshots).
6. Run the portfolio's lint and build; record results and hand the page to the owner to look at on the local dev server.

## Boundaries

Text, links and preset data in the portfolio's Astraeus page only. No layout or style redesign, no changes to the Astraeus app itself (a fault found there becomes an Issue), no commit, push or deploy of the portfolio repository, no screenshots.

## Technical Verification

Portfolio `npm run lint` and `npm run build`; Astraeus `ASTRAEUS_PUBLIC_BUILD=1 npm run build` to serve the demos for the link check; the headless link check through `tools/validate/driver.mjs`. The owner's look at the page is required before closing. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session, 2026-10-20. Stage audit; nothing committed in either repository; no Check written; no Issues created.

### Per-criterion outcomes

1. Met. `src/main.tsx`: `?experience=showers` opens the lowest-`order` shower (Perseids, order 1), `&shower=geminids` picks the Geminids, `?experience=jupiter-io` opens Jupiter, anything else (including the old `shower-perseids`, `shower-geminids`, `earth-moon`) falls back to Apollo. Presets now use the bare `app.html`, `?experience=showers`, `?experience=showers&shower=geminids`, `?experience=jupiter-io`. Headless load of each on the local public build (`ASTRAEUS_PUBLIC_BUILD=1`, `vite preview` on port 5471) through `driver.mjs` (`waitForShell`, `pageText`, `clockText`) plus the page title: Apollo 11 (clock 1969-07-16), Perseids (clock 2019-10), Geminids (clock 2019-10), Jupiter and Io (clock 2016-11-04); each 0 console errors. Control: the old `?experience=shower-perseids` loaded "Apollo 11", confirming the fault. The driver has no single "which experience loaded" readout, so the page title was read from the page and the clock through the driver; no screenshots. Script was in the scratchpad (`links.mjs`), not the repository, so no run directory was written.
2. Met. Earth & Moon preset removed. Nothing else referenced it (selector pills, boot text and the footer/card render from `PRESETS`; no count text such as "five demos" existed; grep for `earth-moon` found nothing else on the page). Four presets remain.
3. Met. Corrections (before -> after, source):
   - Perseids URL and epoch: `experience=shower-perseids` -> `experience=showers`; epoch "AUGUST 2027" -> "PEAK 12 AUGUST" (`data/showers/perseids.json` activity.peakUtc 2020-08-12T15:41:56Z, IAU solar longitude 140.1; the app's own timeline is a year from 2019-09-21, so no 2027 exists).
   - Geminids URL and epoch: `shower-geminids` -> `showers&shower=geminids`; "DECEMBER 2026" -> "PEAK 14 DECEMBER" (`data/showers/geminids.json` peakUtc 2019-12-14T04:33:33Z, peak night Dec 13-14).
   - Orbit counts 25,588 and 51,115 kept (assets.html "Global Meteor Network"; docs/ASTRONOMY_VALIDATION.md lines 250 and 267; index.html).
   - Stars 8,920 kept (assets.html "STARS - HYG database v4.2"; docs/DONOR_PROVENANCE.md). Dropped the "HYG v4.2" jargon but kept the number.
   - Comet orbit out to 51 AU kept (assets.html, Comet 109P/Swift-Tuttle).
   - Geminid parent "rock-comet" -> "asteroid 3200 Phaethon" (assets.html, index.html call it an asteroid).
   - Story panel counts added: Apollo 7, Perseids 3, Geminids 3, Jupiter 3 (`data/stories/*/panels.json`; assets.html "Seven panels for Apollo 11 and three for the Perseids"). The Apollo 7 and 30 events kept (assets.html, index.html).
   - Telemetry source names rewritten from what the data cards cite: Apollo "NASA mission report" (MSC-00171); showers "Global Meteor Network" (IAU #7 and #4 in `stream.iauCode`, kept in plain form as the network's name); Jupiter "NASA JPL Horizons, Solar System Scope maps, USGS Io map" (assets.html Jupiter's moons, surface pictures, Io). Removed "USGS Galileo & Voyager mosaics over the 8,920-star HYG sky" and "VSOP87A Theory" claims from the Jupiter line: the stale "Io in high-velocity orbital lock" is gone.
   - Jupiter card: now "Opens on Jupiter. Browse all 115 of its catalogued moons by family, and look closer at the four large ones: Io, Europa, Ganymede and Callisto." (assets.html "All 115 moons JPL Horizons lists ... by family, as of 18 October 2026"; `data/moons/jupiter.json` 115 moons, asOf 2026-10-18; `jupiterIo.ts` four mapped moons). Epoch "LIVE NOW" -> "NOVEMBER 2016" (`JUPITER_WINDOW` starts 2016-11-04; driver clock read 2016-11-04). Badge "JOVIAN SYSTEM" -> "115 MOONS". Apollo/shower epochs "LIVE NOW" for Earth-Moon removed with the card.
   - Header blurb no longer claims "J2000 reference frames, floating-origin rendering" in jargon; lineage paragraph reworded (same four layers, same question as index.html).
4. Met. Plain-words pass over every visible string: card summaries, telemetry lines, boot lines, badges, header and lineage text, donor-app roles, button labels ("Launch Full-Screen 3D" -> "Open Full Screen", "Load Embedded 3D Here" -> "Show It Here", "Open Dedicated Tab" -> "Open In New Tab", "Exit Embedded View" -> "Close", "DONOR APP" -> "EARLIER APP", "STORY //" -> "DEMO //", "CORE PILLAR // SPACE STORY ENGINE" -> "SPACE STORY ENGINE", "EVOLUTION // FROM VIBE APPS TO ENGINE" -> "FROM SMALL APPS TO ONE ENGINE"). "BUILT WITH SAVEPOINT" removed from the footer (internal workflow name). Layout, classes and styles unchanged; card order unchanged; four cards.
5. Met, with one note. HTTP 200 (curl -L): github.com/anipatke/Astraeus, astraeus.anipatke.com/, /assets.html, /app.html, planetary-explorer.anipatke.com, orbit.anipatke.com, solar-system-scale.anipatke.com, galaxy.anipatke.com. No dead links. Not checked: the portfolio's own `/` and `/vibe-logs` routes (built into the site; `npm run build` listed `/vibe-logs`). Note: the deployed astraeus.anipatke.com is whichever build is live; the shower and Jupiter URLs only work there once the current app is deployed (not tested against the live host, only the local public build).
6. Met. `npm run lint` in `/home/user/code/main-portfolio`: 0 errors, 5 warnings, all in other files (quiz widgets, eslint.config.mjs), none in the Astraeus files. `npm run build`: succeeded. Nothing committed, pushed or deployed (`git status`: only `components/astraeus/AstraeusBridge.tsx` modified).

### Commands run
- `ASTRAEUS_PUBLIC_BUILD=1 npm run build` (Astraeus): built.
- `npx vite preview --port 5471` plus scratchpad `links.mjs` with `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`: results in criterion 1. One browser job; preview stopped afterwards.
- `npm run lint`, `npm run build` (main-portfolio): results above.
- `curl -s -o /dev/null -w '%{http_code}' -L <url>` for the eight links.

### Files read
Astraeus: agent-skills/savepoint-task/SKILL.md, the Task, Objective.md (Planned Decisions), `src/main.tsx` (grep), `index.html`, `assets.html` (text extracted), `tools/validate/driver.mjs` (grep), `docs/BROWSER_CHECKS.md` (head), `tools/validate/browser-public-showers.mjs` (head). main-portfolio: `components/astraeus/AstraeusBridge.tsx`, `app/astraeus/page.tsx`.
Extra reads (logged, outside the Context Files): `data/showers/perseids.json` and `geminids.json` (dates, panel and orbit settings), `data/stories/*/panels.json` (panel counts), `data/moons/jupiter.json` (115 moons), `src/experiences/jupiter-io/jupiterIo.ts` (grep: window start, mapped moons), `src/experiences/showers/showerBasics.ts` (grep: timeline bounds), `docs/ASTRONOMY_VALIDATION.md` and `docs/DONOR_PROVENANCE.md` (grep: orbit and star counts). Reason: confirm each card fact against shipped data.
Not read: `package.json` (only ran its scripts).
### Files changed
`/home/user/code/main-portfolio/components/astraeus/AstraeusBridge.tsx`; this Task file.

### App-side findings for the owner (not fixed, no Issue created)
- `index.html` Jupiter demo card is stale: it says "January 2000", "Io goes round in about 42 hours ... published mean elements, an approximate demonstration", and its title "Jupiter and Io"; the app now opens on Jupiter in November 2016 with 115 moons. The app's own page title still reads "Jupiter and Io".
- `JUPITER_WINDOW` is commented as temporary (T-098: starts 4 Nov 2016), so the "NOVEMBER 2016" epoch on the card should be revisited if the window changes.
- The Geminids card reuses the Perseids banner image (`/vibe-banners/astraeus-perseids.jpg`); left as is (image change is outside text/links scope).

### Limitations
- Owner's look on the local dev server (`npm run dev`, `/astraeus`) is still required; no visual check was done.
- Card text was not tested at phone width (text lengths are similar to before, but Jupiter and Geminids summaries differ in length).
- The live host was only checked for page existence, not for the demo URLs.

## Drift Notes

None expected: the portfolio repository is outside Astraeus's Design. Record any app-side fault as an Issue.
