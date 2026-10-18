---
id: T-088
title: Rewrite the Apollo 11 and Perseids panels in warm, plain words
objective: O-015
status: done
depends_on: [{task: T-087, requires: clear}]
owner_validation: {required: true, accepted_check: C-069, accepted_by: {role: owner, session: owner-chat-20261018}}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Rewrite the Apollo 11 and Perseids panels in warm, plain words

## Outcome

Apollo 11's seven panels and the Perseids' three read like a good museum label: short, friendly, no jargon or stat lists. Every exact figure and honesty note moves, unchanged, into the folded details.

## User Check

Play Apollo 11 and the Perseids on the preview and read each panel as it opens; nothing should need a science background. Open the details on one panel: the exact figures and sources are all there.

## Done When

1. Owner, 2026-10-18: "Stories need to be plainsplained ... we want people to engage with it, not be turned off by stats and numbers". Voice (O-015 Decision 4), as approved in the owner's sample: "Leaving Earth behind. The rocket's last stage fires one final time and flings the crew out of Earth's orbit. They're now moving about 40,000 km an hour, fast enough to coast all the way to the Moon. Three days of coasting start here."
2. Each `body` is two to four short sentences, at most one everyday number or comparison, no acronyms (S-IVB, GET, UTC, AU, ZHR, IAU), no decimals or coordinates. Titles are plain and inviting.
3. Every figure, time and caveat removed from `body` appears in the panel's `details` with its wording intact or more precise (PROV-01); sources unchanged unless a new fact adds one. Badges unchanged. A test asserts the removed figures are present in `details` (no fact lost).
4. Any comparison added (for example "London to Sydney in 25 minutes") is computed from the panel's own figures and the working shown in `details`.
5. I-031: the powered-descent and touchdown panels no longer put two scene markers on top of each other (for example powered descent names no scene object, or markers for one object merge into one that lists both); every panel stays reachable from the scene and the timeline.
6. Browser story-panels check passes with the new text (it asserts structure, not wording); full run passes.
7. Owner validation: the owner reads both stories on the preview; wording changes from that read are made in this Task.

## Context Files

`data/stories/apollo11/panels.json`, `data/stories/perseids/panels.json`, `.savepoint/issues/I-031-stacked-story-markers-on-one-object-hide-each-other.md` (the overlapping markers), `src/shell/storyPanels.ts`, `tools/validate/browser-story-panels.mjs`, `docs/APOLLO11_SOURCES.md`, `.savepoint/objectives/O-015-tell-the-apollo-11-and-perseids-stories-in-panels/Objective.md`.

## Design References

O-015 Decisions 4-8; the Idea's principle: reliable where data exists, plausible where it doesn't, explicit about the difference.

## Guardrails

PROV-01, ARCH-01, TEST-01, TEST-03.

## Implementation Plan

1. Rewrite, moving figures to `details`; the no-fact-lost test.
2. I-031 marker fix; browser check; owner read.

## Boundaries

Copy for Apollo 11 and Perseids and the I-031 marker fix; no new panels.

## Technical Verification

Configured gates, browser-story-panels, full run, owner read. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (executor, lane o015-t088)

Changed: `data/stories/apollo11/panels.json` and `data/stories/perseids/panels.json` (new titles and bodies; every old figure, time and honesty note moved into `details`; comparison working in `details`; three new source lines for new facts: A-11 ignition for "three days" on tli-cutoff, lunar lift-off for "nearly a whole day" on touchdown, drogue deployment E-29 for the parachutes on splashdown; `object` added to powered-descent and ascent-docking (eagle) and tei (columbia)); `src/app/StoryMarkers.ts` (I-031: `groupStoryMarkers`, `panelForMarkerPress`, one marker per object with `data-panel-ids`); `src/app/App.tsx` (spec carries the panel time); `src/app/AstraeusScene.tsx` (marker update receives the clock time); `tools/validate/driver.mjs` (`sceneStoryMarker` matches `data-panel-ids~=`, `sceneStoryMarkerPanelIds`, `pressSceneStoryMarkerOnce`, `pressSceneStoryMarker` presses until the panel opens, `storyPanelDetailsShown`); `tools/validate/browser-story-panels.mjs` (title read from the settings file instead of the old wording; details shown only once the section opens, for the first panel and every Apollo and Perseids panel; one Eagle marker carries all Eagle panels and each opens from it); new `tests/storyMarkers.test.ts`; `tests/storyPanels.test.ts` (no-fact-lost and plain-words tests); new frozen fixture `tests/fixtures/storyPanelBodiesBeforeT088.json` (the bodies before this Task); `.savepoint/issues/I-031-…` (repair_attempted entry).

Criteria:
1. Voice: tli-cutoff uses the owner's sample nearly word for word ("nearly 40,000 km an hour" instead of "about 40,000": 10.84 km/s × 3,600 = 39,024 km/h). The other nine panels follow it; full text in the hand-off report.
2. Every body is two or three sentences, at most one number, no acronyms, jargon, decimals, coordinates or timestamps; titles have no digits or acronyms and at most six words. Test: `tests/storyPanels.test.ts` › "warm, plain words with every figure kept in details (T-088 Done When 2-4)" › "%s: the body reads like a museum label" (one case per panel, 10).
3. No fact lost: same describe › "%s: no fact lost from the old body" checks every number in each frozen old body appears in `details`, and every old sentence appears verbatim in `details` except three listed in `madeMorePrecise`, whose more precise wording must appear (touchdown adds "(Landing Site 2)"; earth-crossing adds the 17 July to 24 August dates from its AMS source and what ZHR 100 means; swift-tuttle explains 51 AU). Badges unchanged ("keeps every panel's badge, with at least one source line"); every earlier source line kept, three added as listed above.
4. Comparisons and their working in `details`: nearly 40,000 km an hour (tli-cutoff, 10.84 km/s × 3,600; splashdown, 11.03 km/s × 3,600 = 39,708), three days (2:50:03.2 to 75:49:50.4 = 72 h 59 min 47.2 s), about six minutes (5 min 57.6 s), about 12 and a half minutes (12 min 34.8 s), nearly a whole day (102:45:39.9 to 124:22:00.8 = 21 h 36 min 20.9 s), under four hours (124:22:00.8 to 128:03:00.0 = 3 h 40 min 59.2 s), about two and a half minutes (2 min 31.4 s), more than 25,000 (25,588 bound orbits drawn). The body test also requires every number in a body to appear in its `details`.
5. I-031: panels naming one object share one scene marker; a press opens the panel the clock has reached (or the first), a press while one of them is open opens the next, wrapping round. Generic, no object names. Tests: `tests/storyMarkers.test.ts` › "stacked story markers on one object (I-031)" (synthetic story, three panels on one object: one marker, clock rule, every panel reached by repeated presses, single-panel marker) and › "the demo stories' scene markers (T-088 Done When 5)" (every Apollo panel has a scene marker; no object has two markers; Eagle carries powered-descent, touchdown, ascent-docking). Browser: story-panels "scene marker on the named body reopens its panel; a shared marker reaches every panel on it (powered-descent, touchdown, ascent-docking)". Every panel stays on the timeline ("timeline shows a marker per panel (7)").
6. Browser story-panels passes with the new text: docs/evidence/o015-t088-story-panels-20261017T232200Z (19 ok, zero console errors), including the C-066 details-shown assertion. Full run: see Commands.
7. Owner read: pending; not something this session can do.

Commands: `npx tsc --noEmit` clean; `npx vitest run` 62 files, 998 passed, 1 skipped (includes the driver guard `tests/browserDriverGuard.test.ts` and `nameCheck`); `npm run build` ok; story-panels alone as above.
Full run: `PLAYWRIGHT_CORE=… DEV_PORT=5571 PUBLIC_PORT=5572 bash tools/validate/run-full.sh docs/evidence/o015-t088-full-20261017T235957Z` (2026-10-17 23:59Z to 00:11Z), 24/24 steps exit 0, error-lines 0; story-panels 19 ok. Picture diff is identical to T-087's accepted run (max 12.3861% over 16 levels against the 2026-10-17 baseline, against 12.3855% in docs/evidence/o015-t087-full-20261017T225429Z, file by file the same to within 0.001 points): the copy and marker change leave the pictures untouched. The owner contact sheet is `docs/evidence/o015-t088-full-20261017T235957Z/contact-sheet.png`.
An earlier full run, docs/evidence/o015-t088-full-20261017T232632Z, failed one step: sky, "apollo-desktop: stars are drawn (bright pixels 6238 vs 11166)", under load from parallel builders (the load average was 30 just before). The same script alone straight after passed (docs/evidence/o015-t088-sky-20261017T234647Z, errors 0), and sky passed in the final run. Read as a load-timing flake in the sky check, which closes the auto-opening Apollo panel with a 1.5 s timeout; not caused by this Task. It is kept as historical evidence.

Extra reads (logged): `src/app/StoryMarkers.ts`, `src/app/App.tsx`, `src/app/AstraeusScene.tsx` (the marker code I-031 names, and its wiring); `src/shell/AstraeusShell.tsx` (whether a scene-marker press seeks the clock: it does not); `tools/validate/driver.mjs` (shared driver rule); `tests/storyPanels.test.ts`; `data/apollo11/generated/events.json`, `data/apollo11/raw/events.json` (E-29 drogue deployment and its source, for the parachute sentence); `vite.config.ts` (test environment is node); `tools/validate/run-full.sh`, `tools/validate/browser-sky.mjs` (full-run steps; the sky failure).

Limitations: the owner's read on the preview (Done When 7) has not happened. The test counts sentences and numbers but cannot judge warmth; that is the owner's call. "For the first time, people have landed on another world", "a huge lump of ice and rock" and "sheds a little more dust" are plain general statements with no new source line. No Check run here; the lane has not been merged.

Drift notes: none architectural. Scene markers now group by object (one marker, several panels): a shell-adapter behaviour change worth a line in Design.md's story-panel notes at the O-015 integration. A shared marker's press rule (the panel the clock has reached, then the next) is not shown to the person beyond the tooltip and label that list every panel title.

## Owner Completion — 2026-10-18

Owner read the stories on the preview ("3 good"; the Apollo panel was offered as part of item 3) and was told this Task would be counted done once its Check came back clear unless the owner said otherwise. Quick Task Check C-069 CLEAR.
