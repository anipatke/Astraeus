---
id: T-061
title: Write the Apollo 11 story panels
objective: O-015
status: done
depends_on: [{task: T-059, requires: clear}]
owner_validation: {required: true, accepted_check: C-040, accepted_by: {role: owner, session: owner-chat-20261018}}
planned_by: {role: planner, session: o015-plan-20261016}
---

# Write the Apollo 11 story panels

## Outcome

About seven panels tell the Apollo 11 story as playback reaches them: translunar injection, lunar orbit insertion, powered descent, landing at Tranquility Base, ascent and docking, trans-Earth injection, and splashdown.

## User Check

Play Apollo 11 from launch at a brisk rate. Each panel opens at its moment, reads plainly in a few sentences, and its facts match the sources it names.

## Done When

1. The panels are in Apollo 11's story settings (data, not code), tied to the existing timed anchors by id.
2. Every number in the text (times, distances, speeds) comes from the anchors file or the NASA sources already cited for it, and the source line says which. Badges are honest: observed for recorded events, modelled for trajectory-derived figures.
3. Plain, non-cheesy wording, two to four sentences each.
4. Browser evidence: each panel opens in order on playback, in a fresh evidence directory.

## Context Files

`data/apollo11/normalised/anchors.json`, `data/apollo11/generated/events.json`, `src/experiences/apollo11/apollo11.ts`, `docs/ASTRONOMY_VALIDATION.md`.

## Design References

Experience definitions.

## Guardrails

ARCH-01, PROV-01, STYLE-09, TEST-01.

## Implementation Plan

1. Pick the anchors and read their source records.
2. Write the panel entries in the story data.
3. Run the story-panels browser script on Apollo.

## Boundaries

No new data sources. No shell or engine changes; if the capability is missing something, report it rather than patch it.

## Technical Verification

Gates plus the story-panels and spike03 browser scripts. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-16 by a builder session (Sonnet), no router writes, nothing committed or set done. No extra reads beyond Context Files except: `src/shell/storyPanels.ts`, `src/shell/experience.ts`, `src/app/StoryMarkers.ts` and `src/app/App.tsx` (how panels and scene markers are wired), `docs/APOLLO11_SOURCES.md` (page of Table 3-I lift-off, and Table 7-VII splashdown position), `tests/storyPanels.test.ts`, `tools/validate/browser-story-panels.mjs`.

1. Panels are data, tied to anchors by id: `data/stories/apollo11/panels.json` now holds 7 panels, no code change to read them. `tli-cutoff` (A-02, kept), `loi` (A-11), `powered-descent` (A-20), `touchdown` (A-LND, kept), `ascent-docking` (A-21), `tei` (A-31), `splashdown` (event E-30). Scene markers (object): tli-cutoff on columbia, loi on moon, touchdown on eagle, splashdown on earth; powered-descent, ascent-docking and tei name no object, because markers for several panels on one object draw on top of each other and the topmost swallows clicks (found when the browser script could not click the touchdown marker with ascent-docking also on Eagle). Timeline markers open all 7. Vitest `tests/storyPanels.test.ts` "the demo wiring" asserts the seven ids in order, time order, anchor times, and a Mission Report table and page in a source line of every panel.
2. Numbers: every figure is copied from `data/apollo11/normalised/anchors.json` (GET, altitude, inertial speed, UTC from timeUtcMs) or `data/apollo11/generated/events.json` (E-30 splashdown), and each source line names the table and page the anchor cites: Table 7-II p. 7-9 (A-11, A-12, A-20, A-21, A-27, A-31, A-32), Table 5-IV p. 5-10 (A-LND), Table 7-VII p. 7-12 (A-36), Table 3-I p. 3-4 (lift-off 124:22:00.8, via docs/APOLLO11_SOURCES.md). Derived by subtraction only: LOI burn 5 min 57.6 s; PDI to touchdown 12 min 34.8 s; surface stay 21 h 36 min; lift-off to docking 3 h 41 min; TEI burn 2 min 31.4 s; entry interface to splashdown 15 min 29 s. Splashdown position 13.30 N 169.15 W is not in the anchors file; it comes from docs/APOLLO11_SOURCES.md (Table 7-VII p. 7-12, guidance value) and the source line says so. Badges: all observed (recorded events and the published postflight table); the panels that touch reconstructed paths (powered-descent, ascent-docking, splashdown) say in the text that the path between the recorded times is a reconstruction. No panel uses modelled because none states a trajectory-derived figure.
3. Wording: 2 paragraphs, 3 to 5 sentences each, plain; read every screenshot.
4. Browser (fresh dir `docs/evidence/o015-t061-20261016T120743Z`, command `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://localhost:5408/app.html ASTRAEUS_OUT=docs/evidence/o015-t061-20261016T120743Z node tools/validate/browser-story-panels.mjs`, 2026-10-16 UTC, passed, zero console errors): all seven open in order on playback (tli-cutoff > loi > powered-descent > touchdown > ascent-docking > tei > splashdown), each with its badge, title and source line asserted; screenshots `apollo-desktop-<id>.png` (1440x900, all 7) and phone 390x844 `apollo-phone-ascent-docking.png`, `apollo-phone-splashdown.png`, plus the earlier T-059 scenarios (auto-open, pause, Continue, scrub, markers, settings, swipe) still pass. The script was extended (marker count from the data, ordered playback of every panel, Perseids section, settling waits and a pause before the settings checks, which seven panels made necessary). Earlier failed attempts of the extended script wrote to scratch dirs I deleted (all mine, none historical).
Gates: `npm run typecheck` clean; `npm run build` ok; `npx vitest run` 48 files, 894 passed, 1 skipped; `browser-spike03.mjs` passed, zero errors (`docs/evidence/o015-t061-20261016T120743Z/spike03`). Name check is part of vitest and green.

Not done by me: set done, commit, router writes, optional Task Check.

## Drift Notes

None yet.

## Owner Completion — 2026-10-18

Accepted with the rewritten copy, as recorded in O-015 Decision 8, after the owner read the stories on the preview ("3 good"). Quick Task Check C-040 CLEAR. The copy this Task wrote was later rewritten in plain words by T-088 (C-069).
