---
id: T-406
title: Which build fault wins, checked by code
objective: O-088
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-406, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: scene-errors
planned_reads: [packages/astraeus/tests/scenePin.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/publicErrorContract.test.ts, packages/astraeus/tests/errorRule.test.ts, packages/astraeus/src/api/definitionOf.ts]
planned_writes: [packages/astraeus/tests/sceneFaultOrder.test.ts]
---

# Which build fault wins, checked by code

## Outcome

Every bad build the scene pin records (its `badBuilds` table, about 80 rows, and the "two faults" rows that fix which error wins) is covered by a focused case that asserts the error `code` and the stage that throws (the call, the check, or the load), in both planet-series orders where the pin checks both, with no message text (API-05: the code, never the message). This replaces the error half of the scene pin (AH-33; Claude: "202 error messages pinned verbatim").

## User Check

None visual. `npx vitest run packages/astraeus/tests/sceneFaultOrder.test.ts` passes.

## Done When

- A row-by-row map of `scenePin.test.ts` `badBuilds()` (~772 onward) is recorded in Technical Evidence: each row is either "covered by" an exact existing case (`publicErrorContract.test.ts` row name, or another file and case name, TEST-03) or "new row in sceneFaultOrder.test.ts". Today's expected stage and code for each row are read from `fixtures/scenePin.json` (`errorsSeriesLoaded`, `errorsSeriesNotLoaded`).
- New `packages/astraeus/tests/sceneFaultOrder.test.ts`: one table (`it.each`) over the uncovered rows, each asserting `{ stage, code }` through the public API (`Scene` builders, `scene.check({ data })`, `scene.load({ data })`), using the pin's made-up inputs (ARCH-03). No `message` assertion and no message regex.
- The "two faults" rows (the order in which a build's checks run) are all in the table, each asserting the code of the fault that wins.
- The rows the pin also runs on a fresh module graph (its `DEFERRED` set, ~1326: out-of-span, Sun orbit, fitOrbit, clump, planet series) are asserted in both orders: series loaded, and a fresh graph (`vi.resetModules()` then dynamic `import("astraeus")`, asserting the series are not loaded, as the pin's `freshGraph` does).
- Planted break, recorded then reverted: swap the order of two of the checks the "two faults" rows cover (in the scene's build check) and show at least one row fails naming the wrong code.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/scenePin.test.ts` (`outcome`, `badBuilds`, `freshGraph`, `DEFERRED` only)
- `packages/astraeus/tests/fixtures/scenePin.json` (the `errorsSeriesLoaded` and `errorsSeriesNotLoaded` keys only; read with a JSON query, not whole)
- `packages/astraeus/tests/publicErrorContract.test.ts` (row names and the table pattern)
- `packages/astraeus/src/api/definitionOf.ts` (read only, to locate the check order for the planted break)

## Design References

`.savepoint/Design.md` under `Errors and labels that tell the truth (O-083)`.

## Guardrails

API-05, ARCH-03, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Extract the pin's expected `{stage, code}` per row with a scratch `node -e` over the JSON.
2. Map rows to existing cases; record.
3. Write the table for the uncovered rows and the two-order rows.
4. Planted break; record; revert.
5. Focused run, gates.

## Boundaries

New test file only. Do not edit `scenePin.test.ts`, its fixture or `publicErrorContract.test.ts` (no duplicated rows: a covered row stays where it is). No production change. Scene outputs are draft 06's; load-order equality is draft 07's.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/sceneFaultOrder.test.ts packages/astraeus/tests/publicErrorContract.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Extra reads: packages/astraeus/src/api/scene.ts (check/load doc, ~850-870) and src/api/assembleScene.ts (~137-160), to locate the check order for the planted break.

Method: the new file copies the pin's made-up inputs and its `badBuilds()` builders unchanged (ARCH-03), and a table `FAULTS` holds the expected `{ stage, code }` per row, taken from `fixtures/scenePin.json` (`errorsSeriesLoaded`, `errorsSeriesNotLoaded`). Stage names: pin `call` = call, `toDefinition` = `scene.check({ data })`, `prepare` = `await scene.load({ data })`. No message assertion.

| Done When | Evidence |
|---|---|
| Row-by-row map, no empty rows | Below: 202 pin rows; 201 are new rows in sceneFaultOrder.test.ts, 1 is covered by publicErrorContract.test.ts ("addTrajectory with samples that are not a list", bad-trajectory). The other contract rows are stateOf/mount/parse/load faults, not builds. |
| One it.each table over uncovered rows, stage+code, public API | `FAULTS` + "planet series loaded" it.each (201 cases); guard test: every bad build has a row and every row a build |
| All "two faults" rows in the table | 16 "two faults" rows (including "two faults at the call"), each asserting the winning code |
| DEFERRED rows in both orders | "fresh module graph" it.each (vi.resetModules, dynamic import of astraeus, asserts planetSeriesLoaded() false): 20 rows; the one that differs (planet series: stateOf before loaded: none vs missing-data at the call) asserts both |
| Planted break | swapped `plan.checkData(data)`/`bodySets.checkData(data)` with `groupPlan.checkReadouts()` in assembleScene.ts: 1 failed / 221 passed, "two faults: missing data package and a bad group readout" expected missing-data, got bad-readout. Restored; the diff on that file then held only another builder's lines (done under the gate lock) |
| Gates | focused: 222 passed. lint: eslint clean on the new file, prettier clean on it; repo-wide prettier warns on 3 files not mine (streamCheck.test.ts, computedLook.test.ts, sceneBuildContract.test.ts). typecheck clean after removing an unused const. build ok. npm test: 9 failures, all outside my file (8 computedLook.test.ts = T-410's files; scenePin.test.ts, which another builder's in-flight assembleScene.ts change affects) |

Row map (pin row -> where covered):
```
addBody: orbit on a body with no orbit -> new row
addBody: unknown id -> new row
addBody: repeated id -> new row
addBody: labelReach not positive -> new row
addBody: enlarge below 1 -> new row
addBody: showLabel not a boolean -> new row
addBody: colour not hex -> new row
addBody: knownLimitations with an empty text -> new row
addBody: moon orbit with its planet absent -> new row
addBody: Sun orbit with the Sun absent -> new row
addBody: Sun orbit line id taken by a path (path added second) -> new row
addBody: Sun orbit line id taken (path added first) -> new row
addBodyFromElements: reserved id auto -> new row
addBodyFromElements: bad record -> new row
addBodyFromElements: record not an object -> new row
addBodyFromElements: id already in the catalogue -> new row
addBodyFromElements: id already in the scene -> new row
addBodyFromElements: a bad option -> new row
addBodyFromElements: orbit asked, then the Sun is absent -> new row
addTrajectory: empty id -> new row
addTrajectory: id of a body -> new row
addTrajectory: id of a group -> new row
addTrajectory: repeated id -> new row
addTrajectory: centre not catalogued -> new row
addTrajectory: first body not built-in (centre falls back to earth) -> new row
addTrajectory: labelReach not positive -> new row
addTrajectory: plane not known -> new row
addTrajectory: sample time not a moment -> new row
addTrajectory: samples too few -> new row
addTrajectory: samples out of order -> new row
addTrajectory: sample position not three numbers -> new row
addTrajectory: samples not a list -> covered by publicErrorContract.test.ts row "addTrajectory with samples that are not a list" (bad-trajectory, at the call)
addTrajectory: provider without stateAt -> new row
addTrajectory: provider bounds not moments -> new row
addTrajectory: provider bounds missing -> new row
addTrajectory: provider bounds end before start -> new row
addTrajectory: provenanceSpans not a list -> new row
addTrajectory: provenanceSpans bad time -> new row
addTrajectory: provenanceSpans bad provenance -> new row
addTrajectory: provenanceSpans end before start -> new row
addTrajectory: provenanceSpans outside the path -> new row
addTrajectory: provenanceSpans overlapping -> new row
addTrajectory: lineFixedTo a number -> new row
addTrajectory: lineFixedTo a stretch without a body -> new row
addTrajectory: lineFixedTo stretches overlapping -> new row
addTrajectory: lineFixedTo a body the scene lacks (at toDefinition) -> new row
addTrajectory: lineFixedTo a stretch body the scene lacks -> new row
addTrajectory: readouts not a list -> new row
addTrajectory: readout of an unknown kind -> new row
addTrajectory: readout distance without a body -> new row
addTrajectory: readout altitude without a body -> new row
addTrajectory: readout names an uncatalogued body -> new row
addTrajectory: readout names a body the scene lacks -> new row
addTrajectory: anchors not a list -> new row
addTrajectory: anchor without an id -> new row
addTrajectory: anchor twice -> new row
addTrajectory: anchor time not a moment -> new row
addTrajectory: anchor outside the path -> new row
addGroup: no id -> new row
addGroup: no orbits -> new row
addGroup: an orbit without an id -> new row
addGroup: an orbit twice -> new row
addGroup: colour not hex -> new row
addGroup: dot size not positive -> new row
addGroup: refillAfterMs not positive -> new row
addGroup: refillSliceMs negative -> new row
addGroup: knownLimitations with an empty text -> new row
addGroup: clump near an uncatalogued body -> new row
addGroup: clump fraction above 1 -> new row
addGroup: clump width above 180 -> new row
addGroup: readouts not a list -> new row
addGroup: readout of an unknown kind -> new row
addGroup: readout activity not a text -> new row
addGroup: centre not catalogued -> new row
addGroup: id of a body -> new row
addGroup: id of a path -> new row
addGroup: centre the scene lacks (at toDefinition) -> new row
addGroup: clump body the scene lacks -> new row
addGroup: clump near its own centre -> new row
addGroup: rate readout with no activity -> new row
addGroup: rate readout naming a missing activity -> new row
addGroup: an orbit the engine refuses -> new row
addGroup: reference time not a moment -> new row
addGroup: an orbit time not a moment -> new row
addGroup: reads the planet series but the window is outside them -> new row
addActivity: no id -> new row
addActivity: no label -> new row
addActivity: no unit -> new row
addActivity: one sample -> new row
addActivity: empty peakLabel -> new row
addActivity: repeated id -> new row
addActivity: sample time not a moment -> new row
addActivity: negative rate -> new row
addActivity: peak outside -> new row
addActivity: start not a moment -> new row
addActivity: provenance span not a moment -> new row
addActivity: provenance malformed -> new row
addActivity: samples not a list -> new row
setTime: not a moment -> new row
setTime: invalid Date -> new row
setScale: not a scale -> new row
setScale: nothing -> new row
setScale: solar-system without a Sun-centred scene -> new row
setScale: solar-system without an enlarged body -> new row
addEvents: not a list -> new row
addEvents: no id -> new row
addEvents: no label -> new row
addEvents: repeated id -> new row
addEvents: repeated across calls -> new row
addEvents: time not a moment -> new row
addEvents: object not a text -> new row
addEvents: own provenance malformed -> new row
addEvents: batch provenance malformed -> new row
addEvents: object not in the scene (at toDefinition) -> new row
addStoryPanels: event not there -> new row
addStoryPanels: anchor not there -> new row
addStoryPanels: object not in the scene -> new row
addStoryPanels: time outside the timeline -> new row
addStoryPanels: source type not one -> new row
addStoryPanels: no sources -> new row
addStoryPanels: repeated id -> new row
addStoryPanels: panels not a list -> new row
setStoryPanelPlayback: pauseSeconds out of range -> new row
addStoryPanels: no body -> new row
addStoryPanels: undefined -> new row
setTimeline: not an object -> new row
setTimeline: rate zero -> new row
setTimeline: loop not a boolean -> new row
setTimeline: none with a bad moment -> new row
setTimeline: start not a moment -> new row
setTimeline: end before start -> new row
setTimeline: rates empty -> new row
setTimeline: a rate not positive -> new row
setTimeline: pacing not a list -> new row
setTimeline: pacing piece not an object -> new row
setTimeline: pacing rate not positive -> new row
setTimeline: pacing ramp negative -> new row
setTimeline: pacing near without a type -> new row
setTimeline: pacing near within not positive -> new row
setTimeline: pacing piece without from and to -> new row
setTimeline: pacing to before from -> new row
setTimeline: pacing spans overlapping -> new row
setTimeline: pacing rule matching no event (at toDefinition) -> new row
setTime outside the timeline (at toDefinition) -> new row
setTime outside a frozen-at timeline -> new row
setSwitches: not an object -> new row
setSwitches: unknown switch -> new row
setSwitches: bad place -> new row
setSwitches: on not a boolean -> new row
setViews: not a list -> new row
setViews: empty -> new row
setViews: bad place -> new row
setViews: options missing -> new row
setViews: view not an object -> new row
setViews: no id -> new row
setViews: no label -> new row
setViews: repeated id -> new row
setViews: ids not a list -> new row
setViews: camera malformed -> new row
setViews: camera a string that is not a rule -> new row
setViews: start not a view -> new row
setViews: id the scene lacks (at toDefinition) -> new row
setViews: body the scene lacks -> new row
setViews: event the scene lacks -> new row
setViews: panel the scene lacks -> new row
setViews: camera target the view does not show -> new row
camera.follow: unknown id -> new row
camera.focus: unknown id -> new row
camera.follow: up not known -> new row
camera.setReach: zero -> new row
camera.setReach: not a number -> new row
camera.setReach: infinite -> new row
camera.fitOrbit: unknown id -> new row
camera.fitOrbit: a body that does not circle the Sun -> new row
camera.fitOrbit: the Sun itself -> new row
toDefinition: empty scene -> new row
toDefinition: a data package not passed -> new row
toDefinition: a listed moon's data package not passed -> new row
stateOf: unknown id -> new row
stateOf: time not a moment -> new row
stateOf: outside a path -> new row
provenanceOf: unknown id -> new row
planet series: stateOf a planet before they are loaded -> new row
out-of-span: planets and a window outside the planet series (prepare rejects) -> new row
out-of-span: orbit lines and a window outside the series -> new row
out-of-span: a fit and a window outside the series -> new row
two faults: empty scene and a bad group readout -> new row
two faults: missing data package and a bad group readout -> new row
two faults: bad group readout and a moon orbit with no planet -> new row
two faults: moon orbit with no planet and a bad scale -> new row
two faults: bad scale and a path line fixed to a missing body -> new row
two faults: path line fixed to a missing body and a readout naming a missing body -> new row
two faults: readout naming a missing body and setTime outside the timeline -> new row
two faults: setTime outside the timeline and a Sun orbit with no Sun -> new row
two faults: Sun orbit with no Sun and a bad story panel -> new row
two faults: bad story panel and a group centre the scene lacks -> new row
two faults: group centre the scene lacks and an event object the scene lacks -> new row
two faults: event object the scene lacks and a view id the scene lacks -> new row
two faults: view id the scene lacks and a pacing rule matching no event -> new row
two faults: out-of-span and a group centre the scene lacks -> new row
two faults: out-of-span and an event object the scene lacks -> new row
two faults at the call: the first throws -> new row
```

Limitations: the 201 rows' expected codes were generated from the pin, not re-derived, so a frozen defect would be frozen here too (none spotted: every row but 3 throws a coded SceneError; the 3 "none" rows assert nothing throws).

## Drift Notes

None.

## Coordinator (gates)

Set done by the orchestrating session after the combined handoff gates passed with T-402..T-404 and T-406..T-412 together (owner: "I mark them as they pass", O-038; G-024 decision 7 "Orchestrate each objective to completion"; owner 2026-11-22 "I am remote now, add park the check and move on"): lint and Prettier clean, typecheck clean, `npm test` 324 files, 5319 passed, 2 skipped; `npm run check:pack` pass, engine 1,836,372 B raw (cap 1,838,000), 525,692 B gzip (cap 527,000).
