---
id: T-387
title: Views and catalogue state checks proved in the fast suite
objective: O-086
status: done
depends_on: []
check_waiver: {task: T-387, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: vitest-moves
planned_reads: [packages/astraeus-site/tools/validate/journey-views.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tools/validate/catalogue-lines.mjs, packages/astraeus/tests/viewsDom.test.ts, packages/astraeus/tests/syntheticViews.test.ts, packages/astraeus/tests/synthetic/syntheticViewsDefinition.ts, packages/astraeus/tests/domSetup.ts, packages/astraeus-site/src/synthetic/syntheticViewsScene.ts, packages/astraeus-site/tests/shelfCatalogue.test.ts]
planned_writes: [packages/astraeus/tests/viewsJourneyState.test.ts, packages/astraeus-site/tests/catalogueEntries.test.ts]
---

# Views and catalogue state checks proved in the fast suite

## Outcome

Every state and text assertion of the `views` and `catalogue` browser steps that does not need a real browser (menu contents, timeline rows, panel markers, clock and speed unchanged by a switch, host change records; catalogue entry names, fold state, import/add lines, shown code, out-of-the-box list) is proved by a Vitest case, so draft 11 can remove it from the browser scripts (Objective: "views/catalogue state and text checks moved to Vitest before removal"; Claude audit I.3 views SIMPLIFY, OpenAI catalogue SIMPLIFY).

## User Check

None visual.

## Done When

- A mapping table in Technical Evidence lists every `assert*` in `journey-views.mjs` and `journey-catalogue.mjs` with one of: **moves** (named Vitest file and case that now proves it, new or existing), or **stays** (needs a real browser: layout fit and overlap, button size in px, the camera stay/follow readouts, drawn path visibility from the scene readout, one viewer at a time on real mounts, chart bars and the live tile). Draft 11 removes only the **moves** rows.
- Planner's expected **moves** (confirm or correct with reasons): views `expectView` menu, event-row and panel-marker asserts for each view; `viewChoice` option list and opening view; clock and speed unchanged by a visitor switch and by `setView`; the host change records (`hostChanges` view/cause); catalogue part list and order, idle at open, out-of-the-box list, entry name, closed fold, import line, add line, `holdsAddLines` shown code.
- Where an existing case already proves a **moves** row exactly (for example in `viewsDom.test.ts`, `syntheticViews.test.ts`, `shelfCatalogue.test.ts`), the table names that file and case (TEST-03) and no new case is written for it.
- Remaining rows are proved in two new files (no existing test file edited; owner rule): `packages/astraeus/tests/viewsJourneyState.test.ts` (happy-dom, the real shell through `tests/domSetup.ts`, the made-up views scene definition from `tests/synthetic/syntheticViewsDefinition.ts`) and `packages/astraeus-site/tests/catalogueEntries.test.ts` (the catalogue built from `data/shelf-catalogue.json` and the `@shelf` comments the way `components.html` is filled at build; reuse `catalogue-lines.mjs`'s `holdsAddLines`).
- Each new case is shown to fail on a planted fault matching its browser twin (for example a view that leaks a hidden body into the menu; an add line missing the part), local edit, run, revert; one line each in evidence.
- No browser script changes in this Task.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tools/validate/journey-views.mjs` (whole, ~175 lines)
- `packages/astraeus-site/tools/validate/journey-catalogue.mjs` (whole, ~160 lines)
- `packages/astraeus/tests/viewsDom.test.ts` (case titles; read cases as needed)
- `packages/astraeus/tests/syntheticViews.test.ts` (case titles)
- `packages/astraeus/tests/synthetic/syntheticViewsDefinition.ts`
- `packages/astraeus/tests/domSetup.ts` (exports)
- `packages/astraeus-site/tests/shelfCatalogue.test.ts` (case titles)
- `packages/astraeus-site/tools/validate/catalogue-lines.mjs`

## Design References

`.savepoint/Design.md` under `Views of one scene` and `Views fixes for a multi-probe app`. `docs/BROWSER_CHECKS.md` under `The fast tests that replaced the old sets`.

## Guardrails

TEST-01, TEST-03, ARCH-04, STYLE-01, STYLE-07.

## Implementation Plan

1. Build the mapping table from the two scripts.
2. Search the existing tests for each row; mark exact covers.
3. Write the two new files for the rest; plant each fault; revert.
4. Gates.

## Boundaries

New test files only; no source, script, driver or baseline change. If a **moves** row cannot be proved without a browser, mark it **stays** with the reason. The engine test must not import the site package (ARCH-04 / the engine-alone gate); the site test may import the engine.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/viewsJourneyState.test.ts packages/astraeus-site/tests/catalogueEntries.test.ts`; `npm run check:engine-alone` (a new engine test file). Handoff: `quality_gates`. No browser run.

## Technical Evidence

### Mapping table (every `assert*` in the two scripts)

journey-views.mjs
| Assert | Verdict | Proved by |
|---|---|---|
| view options ids, order, labels | moves | viewsJourneyState.test.ts "offers the three views in order, labelled, and opens on the first" |
| scene opens on first view (shownView) | moves | same case; "opens on view a with ..." |
| hostView reports the view showing | moves | viewerHostDom.test.ts "publishes the view..." (handle.view after setView) and hostCallOrder.test.ts "setTime and setView take effect" |
| view choice inside window, no overlaps | stays | layout needs a real browser |
| view button size in px | stays | real pixel size |
| expectView: Object list holds / leaves out bodies | moves | viewsJourneyState.test.ts "switching to %s ..." (a, b, both) and the opening-view case |
| expectView: timeline event rows | moves | same cases |
| expectView: story panel marker ids | moves | same cases |
| expectView: probe path line drawn / hidden | stays | scene readout of the drawn path |
| visitor switch: button shown as chosen | moves | viewsJourneyState.test.ts "switching to %s" |
| visitor switch leaves clock and speed | moves | viewsJourneyState.test.ts "switching to %s" (clock snapshot time, rate, playing equal); also viewsDom.test.ts "keeps time, speed and playing state across a switch" |
| host hears visitor switch (view b, cause visitor) | moves | viewerHostDom.test.ts "publishes the view: cause host for setView, visitor for the view choice, ..." |
| camera: Earth moves while following probe b | stays | camera readout |
| camera: Earth holds still in the stay view | stays | camera readout |
| clock ran on while views were switched | stays | real running clock in the browser |
| host setView: hostView, buttons follow | moves | viewerHostDom.test.ts (same case; buttons: "AstraeusScene applies the view prop ..." area line 535) |
| host setView leaves clock | moves | viewerHostDom.test.ts "publishes the view ..." (time and rate equal) |
| host hears its own switch as host | moves | viewerHostDom.test.ts "publishes the view ..." |

journey-catalogue.mjs
| Assert | Verdict | Proved by |
|---|---|---|
| one entry per part, in order | moves | catalogueEntries.test.ts "has one entry for each part ..."; also shelfCatalogue.test.ts "has an entry, a run button ..." |
| no example runs at open (all idle) | moves | catalogueEntries.test.ts same case |
| no viewer drawn at open | moves | catalogueEntries.test.ts same case (no canvas in the page text) |
| out-of-the-box list (exact, ordered) | moves | catalogueEntries.test.ts "lists what comes out of the box, in the catalogue's order" |
| entry opens with its plain name | moves | catalogueEntries.test.ts "%s: opens with its plain name ..." ; shelfCatalogue.test.ts "opens each entry ..." |
| For developers fold starts closed | moves | catalogueEntries.test.ts same case |
| import line names the part | moves | catalogueEntries.test.ts "%s: the import line names the part ..." |
| add line holds the part | moves | same case |
| shown code holds the add lines (holdsAddLines) | moves | same case; shelfCatalogue.test.ts "the journey's shown-code check holds ..." |
| Run button size in px | stays | real pixel size |
| fit: no sideways scroll, no overlaps, viewer box inside | stays | layout |
| first example runs alone, one viewer, part's own words | stays | real viewer mounts |
| starting another stops the first; stop leaves none | stays | one viewer at a time on real mounts |
| every example starts, one viewer | stays | real mounts |
| chart bars and label | stays | live chart |
| tile area, inside box, text, value changes, strip/sheet/card/leftHalf | stays | live tile and layout |

Planner's expectation confirmed, with one correction: the host-change rows and the host `view` rows are proved by existing viewerHostDom.test.ts cases (exact), so no new case was written for them; draft 11 may remove them from the browser step.

### Done When -> evidence
- Mapping table: above.
- Existing exact covers named, no duplicate case: host rows (viewerHostDom.test.ts), clock/speed under a paused switch also in viewsDom.test.ts.
- Two new files only, no existing test edited: packages/astraeus/tests/viewsJourneyState.test.ts (engine-only imports), packages/astraeus-site/tests/catalogueEntries.test.ts. `npx vitest run` on both: 23 passed.
- Planted faults (local edit, run, revert; both files restored, git shows them unmodified):
  - views: view a's objects leaked probe-b into its list -> 2 cases failed (switching to a; opens on view a).
  - catalogue: panel example's `panel(` renamed -> "panel: the import line names the part, the add line holds it, ..." failed (1 of 18).
- No browser script changed.
- Gates: `npm run lint` over the two new files (prettier --check) clean; the repo-wide lint shows prettier warnings only in other files (badTime, fitOrbit, publicApi*, renamedInputs, shownDuring, stateOfBodies tests; not mine, not touched). `npm run typecheck`: no error in my files (errors seen in packagePacks.test.ts belong to T-382 in flight). `npm run check:engine-alone`: first run failed at test on another builder's in-flight packagePacks file; rerun passed with no failure lines. `npm run build` and the full `npm test` were not run by this builder (queue behind other builders; no source changed).
- Extra reads: viewerHostDom.test.ts (cases near 535-620), hostCallOrder.test.ts (setup), src/catalogue/page.ts and sourceLines.ts, tools/site/shelf-catalogue.mjs (renderCatalogueMain), driver.mjs helper bodies; reason: find existing exact covers and the DOM hooks.
- Limitations: the catalogue test cuts import/add lines with the same `importLines`/`addPartsStatement` the page script uses, not by running the page script in a DOM.

## Drift Notes

None. The mapping table is the input of draft 11.

Coordinator (orchestrate-g024-20261121): its two files pass prettier, typecheck and their 23 cases (planted faults fail); build and the full suite run at the Full Check (no source changed). The repo-wide prettier warnings it saw are a Prettier second-pass instability in files untouched since the reformat, fixed by a separate format-only commit. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
