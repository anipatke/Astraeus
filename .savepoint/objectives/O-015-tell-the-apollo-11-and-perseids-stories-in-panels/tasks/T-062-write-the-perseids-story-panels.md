---
id: T-062
title: Write the Perseids story panels
objective: O-015
status: done
depends_on: [{task: T-059, requires: clear}]
owner_validation: {required: true, accepted_check: C-041, accepted_by: {role: owner, session: owner-chat-20261018}}
planned_by: {role: planner, session: o015-plan-20261016}
---

# Write the Perseids story panels

## Outcome

Three Perseids panels: the stream's shape (a wide ribbon of dust along Swift–Tuttle's orbit, drawn from measured orbits); Earth's crossing (active mid-July to late August, peak 12–13 August, about 100 an hour at best, radiant in Perseus); and Swift–Tuttle (about 26 km across, a 133-year orbit, last perihelion 1992, next 2126).

## User Check

Play Perseids through the year. Each panel opens at the right moment and the camera context makes sense for it. Facts match their named sources.

## Done When

1. The panels are in the Perseids story settings (data/showers/perseids.json or its story file), with no code.
2. Every figure is sourced: IAU MDC for the shower, JPL Small-Body Database for Swift–Tuttle, docs/ASTRONOMY_VALIDATION.md for the GMN figures. Badges say illustrative wherever dot places are illustrative.
3. Plain, non-cheesy wording.
4. The Geminids get no panels, but a test shows a shower settings file can carry panels with no code.
5. Browser evidence in a fresh evidence directory.

## Context Files

`data/showers/perseids.json`, `src/experiences/showers/showerSettings.ts`, `src/experiences/showers/showerDefinition.ts`, `docs/ASTRONOMY_VALIDATION.md`.

## Design References

Experience definitions; shower settings.

## Guardrails

ARCH-01, ARCH-03, PROV-01, STYLE-09, TEST-01.

## Implementation Plan

1. Gather the figures and their sources.
2. Write the panel entries.
3. Run the story-panels and showers browser scripts.

## Boundaries

No new data sources. Don't fetch meteorshowers.org (owner rule). No shell or engine changes.

## Technical Verification

Gates plus the story-panels and showers browser scripts. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-16 by a builder session (Sonnet), no router writes, nothing committed or set done. Extra reads: `src/shell/storyPanels.ts`, `src/shell/experience.ts`, `src/app/StoryMarkers.ts`, `src/main.tsx` (how a shower file is mounted), `tests/showers.test.ts`, `tests/swiftTuttle.test.ts` (names only), `tests/fixtures/swift-tuttle-horizons-source.txt` (archived SBDB response).

1. Panels carried by data with no code: `data/stories/perseids/panels.json` (3 panels) named by one new key in `data/showers/perseids.json`, `story.panels: "data/stories/perseids/panels.json"` (only my key touched; re-read before writing). Wiring (generic, names no shower): `showerSettings.ts` gains optional `story.panels`, either a path matching `data/stories/<story>/panels.json` or the panels object inline, validated with named `ShowerSettingsError`s (`story.panels must be a path like ...`, `story.panels.panels`); `showerDefinition.ts` gains `showerStoryPanels` which reads the path from a `import.meta.glob` of `data/stories/*/panels.json`, runs the shell's `parseStoryPanels` against the shower's own events (`<id>-start/-peak/-end`), objects (bodies plus the stream when drawn) and timeline window, rethrows panel errors as `shower settings story.panels: <panel>: <field> ...`, and sets `experience.storyPanels`. Apollo's path is untouched. Panels: `stream-shape` (utc 2027-03-01, object perseids-stream, illustrative), `earth-crossing` (event perseids-peak, object earth, observed), `swift-tuttle` (utc 2027-10-01, object swift-tuttle, observed).
2. Sources: IAU Meteor Data Center (peak solar longitude 140.1, radiant RA 47.9 Dec +57.9, accessed 2026-10-13 as already recorded in perseids.json); American Meteor Society calendar for the dates (Jul 17 - Aug 24, peak Aug 12-13) and ZHR 100 (accessed 2026-10-11, as recorded in perseids.json; note IAU MDC is cited for the radiant and peak longitude, not for dates or rate); docs/ASTRONOMY_VALIDATION.md GMN section for 25,588 orbits ("about 25,600"), stream nearest Earth 0.09 d (about 2.2 h) before the peak instant, radiant 0.04 deg off. JPL SBDB for Swift-Tuttle: fetching https://ssd.jpl.nasa.gov/ with WebFetch on 2026-10-16 (sbdb_lookup.html and sbdb.cgi) returned only the page shell with no data (the lookup is script-driven), so the values are those of the SBDB API response already archived in the repo (`tests/fixtures/swift-tuttle-horizons-source.txt`, fetched 2026-10-15T08:39Z, solution SB405-CPV-2): diameter 26 km (Lamy et al. 2004, Comets II), period 48681.19346262312 d (133.28 yr), perihelion tp JD 2448968.499784556 TDB (1992-12-11), aphelion 51.2246 au. Next perihelion is tp + one period = JD about 2497650, 2126-03 as a two-body figure; the panel says only 2126 and its source line says it is two-body, not a perturbed prediction. meteorshowers.org was not fetched. Badges: stream-shape illustrative (dot places along orbits are illustrative; the text says so plainly), earth-crossing observed (published values; the GMN checks are measured-orbit consistency checks), swift-tuttle observed.
3. Wording read in the screenshots; plain, 2 paragraphs each. The crossing panel's source lines were shortened after a first screenshot showed a long URL overflowing the panel and the Continue button pushed under the timeline.
4. Geminids carry no panels (`geminids.json` has no `story`; test asserts `experience.storyPanels` is undefined). Test in `tests/showers.test.ts` "story panels carried by shower settings (ARCH-03)": a made-up shower (`test-drift`, made-up parent and source) carries inline panels with an event time, a UTC time, a catalogued object and its stream, with no code; Perseids reads its path and gets the three panels; and 8 named-error cases (path outside a story folder, path to no file, panels not a list, story not an object, unknown object, unknown event, time outside the timeline, no sources).
5. Browser: the extended `browser-story-panels.mjs` run recorded under T-061 (`docs/evidence/o015-t061-20261016T120743Z`, passed, zero console errors) includes the Perseids section: loads `?experience=shower-perseids`, the three panels open in order on playback (stream-shape > earth-crossing > swift-tuttle), badges and sources asserted; screenshots `perseids-desktop-<id>.png` (1440x900, all 3) and `perseids-phone-stream-shape.png`, `perseids-phone-earth-crossing.png` (390x844). `browser-showers.mjs` (both showers) into fresh `docs/evidence/o015-t062-20261016T121016Z`: **geminids passed; perseids FAILED at `checkEclipticFlat`** ("the path's major axis is horizontal within 8 deg (-10.4)", desktop). The cause is not the panels: `data/showers/perseids.json` now carries another builder's `look.startView` (`azimuthDeg 100, elevationDeg 40`), which tilts the ecliptic-flat check, and the same check fails when my `story` key is removed (phone -21.5; run output in the scratchpad, key restored). The check needs updating or the start view reconciled by the owner of that change; I did not touch it. The checks before that point in the Perseids run passed.
Gates: typecheck clean; build ok; vitest 48 files, 894 passed, 1 skipped (name check included).

Not done by me: set done, commit, router writes, optional Task Check.

## Drift Notes

- Design.md: shower settings gain optional `story.panels` (path or inline), read in `showerDefinition.ts`. Belongs in the Experience definitions / shower settings notes; name the integration Task that reflects it before the Full Objective Check.
- Capability gap for the owner: scene markers for several panels on one object stack at one point, so only the top one is clickable (T-059 capability; not patched, per Boundaries).

## Owner Completion — 2026-10-18

Accepted with the rewritten copy, as recorded in O-015 Decision 8, after the owner read the stories on the preview ("3 good"). Quick Task Check C-041 CLEAR. The copy this Task wrote was later rewritten in plain words by T-088 (C-069).
