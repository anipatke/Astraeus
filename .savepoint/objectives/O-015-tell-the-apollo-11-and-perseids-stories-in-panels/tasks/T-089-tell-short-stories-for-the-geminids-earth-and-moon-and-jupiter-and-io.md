---
id: T-089
title: Tell short stories for the Geminids, Earth and Moon, and Jupiter and Io
objective: O-015
status: done
depends_on: [{task: T-087, requires: clear}]
owner_validation: {required: true, accepted_check: C-068, accepted_by: {role: owner, session: owner-chat-20261018}}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Tell short stories for the Geminids, Earth and Moon, and Jupiter and Io

## Outcome

The three demos without a story get about three panels each, in the same warm, plain voice, opening at moments inside each demo's own timeline, with figures and sources in the folded details.

## User Check

Play each of the three demos on the preview: panels open at their moments and read easily; markers reopen them.

## Done When

1. Owner, 2026-10-18: "Extend stories to all demos" (O-015 Decision 6). Same voice and rules as the Apollo/Perseids rewrite (two to four short sentences, at most one everyday number, figures and caveats in `details`, sources with every fact, a badge per panel).
2. Proposed moments (the owner may change them at the read):
   - Geminids (`shower-geminids`): the "rock comet" 3200 Phaethon as the parent; why the Geminids are the year's best shower; Earth's December crossing at the peak.
   - Earth–Moon (`earth-moon`, window January to March 2025): why we always see the same face; the Moon drifting slowly away; the total lunar eclipse of 14 March 2025, inside the window.
   - Jupiter–Io (`jupiter-io`, window 1 to 15 January 2000): the most volcanic place in the solar system; the tug-of-war with Jupiter that heats it; its rhythm with Europa and Ganymede.
3. Panel files are story data, not engine (owner rule): one file per story under `data/stories/<story>/`; wiring follows the existing generic panel path with no story wording in engine or shell (ARCH-01). If an experience cannot take panels without code, the generic path is extended once, for all, with a test.
4. Every panel time falls inside its demo's timeline and validates (named error otherwise); the Geminids panels respect the shower's narrowed `span=activity` view as the Perseids do (C-041 observation).
5. Facts come from published sources named in each panel's sources (NASA, IAU, JPL and similar); nothing is invented. The eclipse time is checked against a published table.
6. Browser story-panels check covers each new story (panels open in order, badge and sources present, details folded); full run passes.
7. Owner validation: the owner reads all three on the preview; wording changes from that read are made here.

## Context Files

`data/stories/perseids/panels.json` (the pattern), `src/experiences/showers/showerDefinition.ts`, `src/experiences/earth-moon/earthMoonExplorer.ts`, `src/experiences/jupiter-io/jupiterIo.ts`, `src/experiences/apollo11/apollo11.ts` (how a story is wired), `src/shell/storyPanels.ts`, `tools/validate/browser-story-panels.mjs`, `.savepoint/objectives/O-015-tell-the-apollo-11-and-perseids-stories-in-panels/Objective.md`.

## Design References

O-015 Decisions 4-8; Design.md story layer.

## Guardrails

PROV-01, ARCH-01, ARCH-03, TEST-01, TEST-03.

## Implementation Plan

1. Research and write the nine panels with sources.
2. Wire each story through the generic path; browser check; owner read.

## Boundaries

Three new stories; no new data sources for the scene itself.

## Technical Verification

Configured gates, browser-story-panels, full run, owner read. Evaluated under `agent-skills/references/check-method.md`.

## Evidence

Executor: builder in worktree lane `o015-t089` (/home/user/code/astraeus-t089), 2026-10-18. Lane rules followed: router not edited, no Tasks/Checks/Issues created.

### Files read

Context Files: `data/stories/perseids/panels.json`, `src/experiences/showers/showerDefinition.ts`, `src/experiences/earth-moon/earthMoonExplorer.ts`, `src/experiences/jupiter-io/jupiterIo.ts`, `src/experiences/apollo11/apollo11.ts` (wiring lines), `src/shell/storyPanels.ts`, `tools/validate/browser-story-panels.mjs`, O-015 `Objective.md`.

Extra reads (logged): `agent-skills/savepoint-task/SKILL.md` (the skill); `.savepoint/Guardrails.md` rows PROV-01, ARCH-01/03/04, TEST-01/03; `data/showers/geminids.json` (to add the `story` block and read the activity window and peak); `src/experiences/showers/showerSettings.ts` and `showerBasics.ts` (the `story.panels` path rule and the year/activity bounds); `src/experiences/showers/showerBodies.ts` (object ids); `tests/showers.test.ts` and `tests/storyPanels.test.ts` (existing story tests; one Geminids assertion had to change); `.savepoint/checks/C-041-*` (the span=activity observation); `T-088` Task file (sibling voice rules); `src/core/bodies/moon.ts` and `io.ts` (orientation limitations for honest details); `tools/validate/driver.mjs` exports, `browser-lite.mjs`, `capture-experience-pictures.mjs`, `diff-screenshots.mjs`, `run-full.sh`, `docs/BROWSER_CHECKS.md` (how the new panels meet existing scripts); `src/main.tsx`, `src/app/App.tsx`, `src/shell/AstraeusShell.tsx` grep (experience ids, `span` param, the generic `storyPanels` read).

### Files changed

- New story data: `data/stories/geminids/panels.json`, `data/stories/earth-moon/panels.json`, `data/stories/jupiter-io/panels.json` (three panels each, with `details` and `sources`).
- `data/showers/geminids.json`: `story.panels` names the Geminids panels file (the same settings-only path the Perseids use).
- `src/experiences/earth-moon/earthMoonExplorer.ts`, `src/experiences/jupiter-io/jupiterIo.ts`: import their story's panels file and pass it through the generic `parseStoryPanels` with the experience's events, objects and window, exactly as Apollo 11 does. No shell, engine or generic code changed: the shell already reads `experience.storyPanels` for any experience, so the generic path did not need extending (ARCH-01, ARCH-03 unaffected; nameCheck green).
- `tests/storyStoriesAllDemos.test.ts` (new); `tests/showers.test.ts` ("carries no panels unless the settings name them" now strips the Geminids' new `story` block instead of asserting the Geminids have none).
- `tools/validate/browser-story-panels.mjs`: covers the three new stories through `driver.mjs` only.

### Research (facts and sources)

Every fact is in a panel's `sources`. Checked on 2026-10-18 against: JPL Small-Body Database API for 3200 Phaethon (tp JD 2461285.616438 TDB = 2026-09-02 02:47:40 TDB, about 02:46:31 UTC; q 0.140278 au; diameter 6.25 km); NASA Science Geminids page (rock comet, 5.10 km, 120/h, 9-10 p.m. start, 35 km/s, Gemini radiant, IRAS discovery 1983-10-11); NSSDC Mercury fact sheet (perihelion 46.0 million km); Jewitt and Li 2010 (AJ 140); Zhang et al. 2023 (PSJ 4, 70: sodium, not dust); NASA Science Moon facts and Tidal locking pages; NSSDC Moon fact sheet (27.3217 d, 29.53 d, 1737.4 km); NASA 2020 laser-ranging article (fingernails, 3.8 cm/yr) and JPL 2019 article (Apollo 11/14/15 reflectors); NASA phases table 2001-2100 (full Moon 2025 Jan 13 22:27 UT; 2025 Mar 14 06:55 t); NASA Science Io page (most volcanically active, hundreds of volcanoes, tug-of-war); NSSDC Jovian satellite fact sheet (Io 1821.5 km, e 0.004, periods 1.769138/3.551181/7.154553 d); NASA Photojournal PIA02545 (Tvashtar, 25 Nov 1999, fountains to 1.5 km); NASA Galileo mission page (orbit 7 Dec 1995 to 21 Sep 2003); Peale, Cassen and Reynolds 1979 (Science 203, 892); Morabito 2012 (arXiv 1211.2554).

Eclipse time check (Done When 5): NASA's Catalog of Lunar Eclipses 2001-2100 (Espenak and Meeus), entry 09706, 2025 Mar 14, greatest eclipse 06:59:56 UT, Delta T 75 s, Saros 123, total, umbral magnitude 1.1784, partial 218.3 min, total 65.4 min; the 2021-2030 decade table gives the same instant and totality 01h05m. NASA Science gives totality 06:26 to 07:31 UTC. The `red-moon` panel opens at 2025-03-14T06:59:56Z and its details record these.

### Moments chosen (each inside its demo's own timeline)

- Geminids (year window about 2026-06-14 to 2027-06-14; activity 4 to 18 Dec 2026): `phaethon` at Phaethon's perihelion 2026-09-02T02:46Z (JPL tp, rounded down to the minute); `best-shower` at 2026-12-06T00:00Z (two days into the activity, strictly after the narrowed start so forward playback from the start opens it); `earth-crossing` at the `geminids-peak` event (2026-12-13T23:31:44Z). With `span=activity` the September panel is left out and the two December panels stay, as the Perseids do (C-041).
- Earth–Moon (1 Jan to 1 Apr 2025, plays at 1 hour per second): `same-face` at 2025-01-01T03:00Z so the first panel opens about three seconds after play (details say nothing special happens then); `drifting-away` at the full Moon of 2025-01-13 22:27 UT; `red-moon` at greatest eclipse 2025-03-14 06:59:56 UT.
- Jupiter–Io (1 to 15 Jan 2000): `volcanoes` at 2000-01-01T04:00Z (opens soon after play); `squeezed` at 2000-01-04T00:00Z (pacing; said so in details); `rhythm` at 2000-01-08T00:00Z, seven days in, when Io has gone round about four times.
- Scene markers: no two panels in one story name the same object (avoids the I-031 stacking); `drifting-away` and `rhythm` name no object and are reached from the timeline.

### Generic path

No experience needed new code to take panels beyond naming its own panels file: the shell reads `experience.storyPanels` for any experience. One generic change was needed elsewhere: with three new panels files the bundler now splits the same-named `panels.json` modules into several `panels-<hash>.js` chunks, and the public-build load budget (`tools/validate/load-budget.mjs`) matched one file per stem, so the first full run failed `public-build-assets` ("imports assets/panels-…js, which the page set does not list"). Repair, once for all stories: a stem that names several hashed chunks now admits exactly those a listed script imports at load (followed through a chain), and fails when none is imported; the Earth–Moon and Jupiter–Io page sets list `panels.js`. Proof with made-up chunks (ARCH-03): `proveSameStemChunks()` in `load-budget.mjs`, test "lists only the same-named chunks a page's scripts import when the bundler splits one stem into several" in `tests/publicBuild.test.ts`. No page limit changed; measured: Earth–Moon 3,715,487 B raw / 2,615,729 B gzip, Jupiter–Io 3,846,204 / 1,908,091, Perseids 10,703,974 / 7,090,945, Geminids 13,188,447 / 7,897,155 (all within limits).

### Per-criterion outcomes

1. Voice: nine panels, each body two to four sentences, at most one everyday number or comparison, no acronyms, decimals, times or coordinates; figures and caveats in `details`; sources on every panel; a badge per panel. Test: `tests/storyStoriesAllDemos.test.ts` "%s reads in the plain voice…" (sentence count, no capitals-acronyms, no decimals, no clock times, no degrees/UTC/AU). The "one everyday number" and the warmth are for the owner's read.
2. Proposed moments: all nine used as proposed (see Moments chosen).
3. Story data under `data/stories/geminids|earth-moon|jupiter-io/panels.json`; Geminids wired by settings only; Earth–Moon and Jupiter–Io wired as Apollo is; no story wording in engine or shell (nameCheck test green in the full suite).
4. Times inside each timeline: test "%s carries three sourced panels, in time order, on its own objects and inside its own timeline"; a time outside throws the named `StoryPanelError` (existing tests). Geminids `span=activity`: test "opens the Geminids Earth panel at the shower's peak, and keeps the two December panels in the narrowed (activity) view" and the browser step "Geminids activity view keeps the two December panels".
5. Published sources for every fact (see Research); eclipse time checked against NASA's catalogue: test "opens the eclipse panel at greatest eclipse in NASA's table…".
6. Browser: `browser-story-panels` now opens every panel of the three stories in order on playback, checks badge, title, a source line, one folded section closed by default holding details, and that a timeline marker reopens a panel. Full run passes (below).
7. Owner validation: not done; the owner reads the three stories on the preview. Pending.

### Commands

- `npx tsc --noEmit`: clean.
- `npx vitest run`: 62 files, 981 passed, 1 skipped (includes `tests/browserDriverGuard.test.ts`, 4 passed: the new browser steps use `driver.mjs` only).
- `npm run build`: built (the usual chunk-size warning only).
- Focused iteration: `browser-story-panels.mjs` against a dev server on 5580, all steps ok, zero console errors (scratch output, not evidence).
- Full run 1, `DEV_PORT=5581 PUBLIC_PORT=5582 bash tools/validate/run-full.sh docs/evidence/o015-t089-full-20261017T232632Z` (2026-10-17 23:26Z): 22 of 24 passed; `public-build-assets` failed (the load-budget stem issue above) and `spike02` timed out on a click the Developer panel intercepted while three lanes ran. Kept as historical evidence. `spike02` re-run alone on a quiet machine passed (scratch output).
- Full run 2, same command, `docs/evidence/o015-t089-full-20261017T234644Z` (2026-10-17 23:46Z to 23:58Z, 726 s): all 24 steps exit 0, error-lines 0; `story-panels/results.json` passed: true.

### Limitations

- Picture check: the contact sheet (`docs/evidence/o015-t089-full-20261017T234644Z/contact-sheet.png`) shows every experience differing from the 2026-10-17 before set, including Apollo 11 (3.3% desktop) and Perseids (4.6%), which this Task did not touch; the three demos' figures are of the same order (Earth–Moon 3.1-3.3% desktop, Jupiter–Io 2.9-3.1%, Geminids 8.4%; phone 6.5-12.3%). The before set predates other merged timeline and phone work, so these figures cannot isolate this Task's markers; the owner's look decides.
- Machine rule: before the first focused browser run my check and the run were in one command, and another builder's headless Chrome had started in between (6 processes seen at launch). Both full runs and the spike02 re-run were gated properly (no headless Chrome, load under 6).
- Owner read (Done When 7) outstanding; wording changes from it belong in this Task.

### Drift Notes

- Design.md story layer: stories now exist for all five demos, and the load budget admits several same-named story chunks per page; for the O-015 integration account (non-architectural beyond the budget rule).
- `showerDefinition.ts` reads every `data/stories/*/panels.json` eagerly through its glob, so shower pages also carry the Apollo, Earth–Moon and Jupiter–Io panels chunks (a few kilobytes); a narrower load is possible later but would need the generic path to know shower stories by name.

## Owner Completion — 2026-10-18

Owner read the new stories on the preview (Jupiter–Io first panel and its folded details): "3 good". Quick Task Check C-068 CLEAR.
