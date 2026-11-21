---
id: T-392
title: Views and catalogue steps keep only what needs a browser
objective: O-086
status: done
depends_on: [{task: T-387, requires: clear}, {task: T-389, requires: clear}, {task: T-391, requires: clear}]
check_waiver: {task: T-392, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus/tests/viewsJourneyState.test.ts, packages/astraeus-site/tests/catalogueEntries.test.ts, packages/astraeus-site/tools/validate/assertion-list.mjs, packages/astraeus-site/tests/fixtures/browserAssertionsBaseline.json]
planned_writes: [packages/astraeus-site/tools/validate/journey-views.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tests/browserAssertions.test.ts, docs/BROWSER_CHECKS.md]
---

# Views and catalogue steps keep only what needs a browser

## Outcome

The `views` and `catalogue` browser steps drop the state and text assertions that draft 06 now proves in Vitest, keeping layout fit, button sizes, the real camera stay/follow readouts, drawn paths and one-viewer-at-a-time on real mounts; the assertion baseline names each retired site and its replacement (owner decision 4: retire only after replacement; Objective: "moved to Vitest before removal").

## User Check

None visual.

## Done When

- Every row marked **moves** in draft 06's mapping table (its Technical Evidence) is removed from `journey-views.mjs` / `journey-catalogue.mjs`, and only those rows; every **stays** row is untouched. Code that only fed a removed assertion goes with it (for example `expectView`'s menu and event-row reads); readouts still used stay.
- `browserAssertions.test.ts` gains a `RETIRED` list beside `REVIEWED`: each entry `{ script, was, movedTo: "<file> > <case title>", reason }`; `missing()` forgives a baseline site only when it is in `RETIRED` and the named test file exists and contains that case title (the test reads the file and checks the title text is present). A new case proves a `RETIRED` entry naming a missing case fails. The baseline JSON and `assertion-list.mjs` are not changed (O-088 retires them).
- Both steps still exercise both sizes; `views` still proves the visitor switch and host `setView` move the shown view (one each), the stay/follow camera rule, path visibility and button fit; `catalogue` still proves the fit, sizes, mount/replace/stop and the chart and tile readouts.
- `docs/BROWSER_CHECKS.md`: the `views` and `catalogue` bullets say what they now check and name the two Vitest files for the rest; the retired-scenario map gains one row for the moved checks.
- Browser runs (one browser job at a time; nothing else running): `npm run check:browser -- --step views --step catalogue` before and after, same machine; green; times recorded.
- Gates per `docs/agents/verification.md`.

## Context Files

- Draft 06's Task file, `Technical Evidence` (the mapping table)
- `packages/astraeus-site/tools/validate/journey-views.mjs`, `journey-catalogue.mjs` (whole)
- `packages/astraeus-site/tests/browserAssertions.test.ts` (whole)
- `docs/BROWSER_CHECKS.md` under `What it runs` and `Retired scripts, and where each scenario went`

## Design References

None.

## Guardrails

TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Time the two steps.
2. Remove the **moves** rows; tidy now-unused reads.
3. Add `RETIRED` and its check; prove the check fails on a wrong case title.
4. Focused tests; the two steps; gates.

## Boundaries

Only the mapped rows; no driver change (dead driver exports are O-088's), no baseline rebuild, no other script.

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/browserAssertions.test.ts packages/astraeus/tests/viewsJourneyState.test.ts packages/astraeus-site/tests/catalogueEntries.test.ts`. Browser: the step run above, after draft 10's runs and never alongside another browser job. Handoff: `quality_gates`.

## Technical Evidence

### Done When -> evidence
| Done When | Evidence |
|---|---|
| Every **moves** row removed, **stays** untouched, orphaned reads gone | `journey-views.mjs` lost the options, opening-view, host-view, menu, event-row, panel-marker, clock, speed, pressed-button and host-change asserts (17 sites) and their reads (`IN_VIEW` lists, `viewChoice`, `watchHostChanges`, `hostChanges`, `speed`, event-list reads); path-drawn, fit, button size, camera stay/follow, clock-ran-on kept. `journey-catalogue.mjs` lost the part list, idle, viewer-at-open, out-of-the-box, name, fold, import, add and shown-code asserts and the `holdsAddLines` import; Run-button size, fit, one viewer, chart, tile kept. |
| `RETIRED` + `missing()` forgiveness + failing-case proof | `browserAssertions.test.ts`: `RETIRED` (17 entries, all journey-views; the catalogue script was not in the baseline), `provesIt()` reads the named file for the case title; case "each retired site names a real baseline site, a present test file and the case in it"; planted case adds: forgiven with the true case, not forgiven with no entry, with a wrong case title, with a missing file. 6 tests pass. Baseline JSON and `assertion-list.mjs` unchanged. |
| Both sizes, visitor switch and host setView each move the view, stay/follow, paths, button fit; catalogue fit, sizes, mount/replace/stop, chart and tile | Both steps green at both sizes (runs below). Views: after each visitor switch (b, both, a) and after host `setView("b")`, `expectView` reads each probe's drawn path. |
| `docs/BROWSER_CHECKS.md` | `views` and `catalogue` bullets rewritten naming the two Vitest files (and viewerHostDom); retired-map row added; timing rows updated. |
| Browser runs before and after | `npm run check:browser -- --step views --step catalogue` under the flock: before (HEAD scripts swapped in, then restored) views 25 s, catalogue 6 s, total 33 s, green; after views 21 s, catalogue 6 s, total 28 s, green. Evidence folders deleted. |
| Gates | `npm run lint` clean (prettier included), `typecheck` clean, `build` ok, `npm test`: 316 files, 5116 passed, 3 skipped. |

### Deviation
The existing planted case in `browserAssertions.test.ts` used the real assertion `ui.shownView(page), "a", "the scene opens on its first view"` as its sample line, which is now retired. Two sample lines (script text of the planted case, not a fixture or tolerance) were changed to a made-up `"z"` line so the case still proves removal is caught; its expectations are unchanged.

### Extra reads
`viewerHostDom.test.ts` (case titles near 526-560), `viewsJourneyState.test.ts` (titles): to name exact case titles for `RETIRED`.

### Limitations
`browser-steps.mjs` step descriptions (not in planned_writes) still say the old wording for `views` and `catalogue` ("import and add lines"). Dead driver exports (`viewChoice`, `watchHostChanges`, `hostChanges`, `speed`, `catalogueBasics`, ...) left for O-088.


## Drift Notes

None.

Coordinator (orchestrate-g024-20261121): gates green (lint, typecheck, build; `npm test` 316 files, 5116 passed); views and catalogue steps green. Accepted: the planted case's sample script line changed to a made-up line because its old sample was itself retired (expectations unchanged). Step descriptions and dead driver exports go to T-393 / O-088. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
