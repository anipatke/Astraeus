---
id: T-407
title: Scene builds checked case by case
objective: O-088
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-407, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: scene-output
planned_reads: [packages/astraeus/tests/scenePin.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/tests/publicApiPaths.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/tests/publicApiStory.test.ts, packages/astraeus/tests/publicApiActivity.test.ts, packages/astraeus/tests/publicApiAutoStretches.test.ts, packages/astraeus/tests/publicApiSunOrbits.test.ts, packages/astraeus/tests/pacing.test.ts, packages/astraeus/tests/cameraChoices.test.ts, packages/astraeus/tests/fitOrbit.test.ts, packages/astraeus/tests/displaySwitches.test.ts]
planned_writes: [packages/astraeus/tests/sceneBuildContract.test.ts]
---

# Scene builds checked case by case

## Outcome

Each of the scene pin's good-scene cases (its `sceneCases` table, about 32 scenes: bodies and options, scales, paths, groups, activities, events, panels, timelines, switches, views, camera rules, the synthetic definitions) has named, focused outcome checks of what a host can observe, so nothing the pin catches is lost when it is retired (AH-33; Claude: "one 837 KB self-generated snapshot").

## User Check

None visual. `npx vitest run packages/astraeus/tests/sceneBuildContract.test.ts` passes.

## Done When

- A case-by-case map of `scenePin.test.ts` `sceneCases()` (~379 onward) is recorded in Technical Evidence: for each case, the observable facts it pins (from `fixtures/scenePin.json` `seriesLoaded.<case>`: the definition's objects and layers, metrics at the two times, `stateOf`, `provenanceOf`, `missingData`, the timeline, views, switches, camera) and, per fact group, either an exact existing case that asserts it (file and case name, TEST-03) or a new case in `sceneBuildContract.test.ts`.
- New `packages/astraeus/tests/sceneBuildContract.test.ts` covers the gaps with focused assertions on behaviour a host relies on (for example: a failed add leaves the scene as it was; a path added before any body follows the first body; activities set the window and a timeline span overrides it; panel times by event, UTC and anchor; pacing base rate with no rate set; path cover samples when the far point lies between samples). Numbers use stated tolerances or exact ids and counts, never a dumped object or `toMatchSnapshot`/`toMatchFileSnapshot`. No message text.
- Each new case uses the pin's made-up inputs (ARCH-03) through the public API, or the engine-only `definitionOf` route only where the fact is not public, named in a comment.
- Planted break, recorded then reverted: one deliberate behaviour change per two or three fact groups the new file covers (at least three in total, for example: drop the timeline span override, make `addBody` keep a half-added body on failure, shift a pacing default) each fails a named new case.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/scenePin.test.ts` (`sceneCases`, `observe`, the constants at the top)
- `packages/astraeus/tests/fixtures/scenePin.json` (the `seriesLoaded` key, one case at a time with a JSON query; never whole)
- The `publicApi*.test.ts`, `pacing.test.ts`, `cameraChoices.test.ts`, `fitOrbit.test.ts`, `displaySwitches.test.ts` files in `planned_reads`: case names only (`grep -n "it(\|it.each\|describe("`), opening a case only to confirm what it asserts.

## Design References

`.savepoint/Design.md` under `Scene and host-link split`.

## Guardrails

ARCH-03, API-05, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Walk the cases; build the map with existing coverage first (most fact groups are expected to be covered by the `publicApi*` files).
2. Write focused cases for the gaps only.
3. Planted breaks; record; revert.
4. Focused run, gates.

## Boundaries

New test file only; no production change; no edit to the pin, its fixture or other test files. Error rows are draft 05's; equality across load orders is draft 07's. If the map shows more than about 25 gap cases, stop and report the count to the coordinator before writing them (scope check).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/sceneBuildContract.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

### Case-by-case map of `scenePin.test.ts` `sceneCases()` (34 cases)

Gap count: 0 over the cap (about 25); all 17 new cases were written. "Existing" cites file and case (TEST-03); "New" is a case in `sceneBuildContract.test.ts` (SBC).

| Pin case | Observable fact groups | Existing | New (SBC) |
|---|---|---|---|
| the made-up journey (synthetic) | objects, timeline, events, views of a whole made-up scene | publicApi.test.ts "builds the definition from addBody, addTrajectory..." (shape) | none (synthetic fixtures are exercised by their own tests; no separate fact) |
| sun scene: each addBody option, orbit lines, solar-system scale | object ids, enlarge, labels, card text, orbit layers, scale | publicApiSunOrbits "enlarge, label off and label reach", "orbit lines round the Sun", "setScale(solarSystemScale)"; publicApi "addBody takes a colour and known limits..." | "a Sun scene that enlarges a body opens on the solar-system scale" (ids, opening scale) |
| earth and moon, readable alone, moon orbit line | scale choices, orbit path | publicApiStory "setScale with only"; publicApi "declares the Moon's orbit as a composition path about Earth" | "scales: readable offered alone..." (scaleChoices id) |
| true scale, then switched | opening scale after two calls | publicApiStory "setScale with only" | "scales: ..." (second half: true scale opens) |
| jupiter moons with their data package | missingData, state per moon | publicApi "names the data package a body needs...", "does not offer a moon without its planet's positions package" | "a Jupiter-moon scene names the data package it still needs" (missingDataOf, engine-only: not public) |
| a listed moon added by its id | same as above | publicApi "moons and the data packages" (O-036 T-161) | covered by the Jupiter case above (same route) |
| own body from elements, fitOrbit, ecliptic focus | object, provenance, orbit, fit | publicApiSunOrbits "addBodyFromElements"; fitOrbit.test "fits a made-up orbit..."; publicApiActivity "camera up and reach" | none |
| a failed add leaves the scene as it was | object list after failed calls | publicApi "rejects bad ones with bad-body" (error only, not the scene after) | "a failed add leaves the scene as it was" |
| paths about the Earth: samples, provider, plane, anchors, readouts, stretches, spans | state, anchors, readouts, provenance spans | publicApiPaths "anchors", "readouts", "provenance by time span (I-113)", "path and body notes"; publicApiAutoStretches | "a path's state is its samples about its centre..." ; "a provider path is valid inside its bounds only" |
| path added before any body follows first body / keeps own centre | the path's centre | publicApi "starts in true scale and at the trajectory's start" (partial) | "a path added before any body is drawn about the first body, or about its own centre" |
| sun scene with a path: auto stretches, cover, labels | auto lineFixedTo, cover | publicApiAutoStretches (all four `lineFixedTo: "auto"` cases) | none |
| sun scene with a long path and a declared reach | camera reach | publicApiActivity "sets how far the viewer can zoom out..." | "a camera follow with a declared reach carries the reach" (definition.camera) |
| groups: clump, rate readout, activity, event, panel | group objects, clump, rate bars, events, panels | publicApiGroup "addGroup", "clumps a stated share near a body's place..."; publicApiActivity "a group's rate readout"; publicApiStory | "groups: each is its own object with its rocks and a centre when named" |
| groups added before the planet series are needed | late layers, order | publicApiSunOrbits "the public path without the planet series preloaded" | none (order is T-408's change: I-193) |
| activities set the window, a timeline span overrides it | window | publicApiActivity "puts the curve on the timeline...", "leaves the timeline span to setTimeline when given" | "two activities span the earliest start to the latest end, and a timeline span overrides that window" |
| events with batch/own provenance, panels by utc, event, anchor | event order, panel times, playback | publicApiStory "addEvents" (keeps events sorted, provenance), "addStoryPanels" (resolves by time, event, anchor) | "panels resolve by event, by UTC and by anchor..."; "events are kept in time order across calls" |
| timeline: span, rates, opening rate, pacing spans, event rules, loop | window, rates, rate, loop, zones | publicApiStory "setTimeline"; pacing.test.ts; publicApiActivity "setTimeline loop" | "a timeline sets the span, the opening rate, loop, and event rules become a zone round each event" |
| timeline: none, frozen / running | clock start, playing, rate | publicApiStory "no timeline" (frozen, running) | "no timeline: frozen at a moment, or running at a rate" |
| no time set: opens now; with a path opens at the path start | opening time | publicApiStory "the opening moment with nothing setting a span"; publicApi "starts in true scale and at the trajectory's start" | none |
| display switches, called twice | switches after two calls | displaySwitches "lays later calls over earlier ones, switch by switch" | "display switches called twice lay the later call over the earlier" (whole-object equality on this pin's inputs) |
| views with each camera rule | view objects, events, panels, rule | cameraChoices.test (presets); publicApiStory "camera.focus and the automatic camera menu" | "views carry the objects, events and panels they name..." |
| camera: follow then focus, setReach then fitOrbit, ecliptic up | last of follow/focus wins, later of reach/fit wins, up | publicApiStory "lets the last of follow and focus win"; fitOrbit "lets the later of setReach and fitOrbit win"; publicApiActivity "camera up and reach" | none |
| camera: setReach alone, follow with a view | reach, start view | publicApiActivity "sets how far the viewer can zoom out", publicApi "camera.follow starts already following" | none |
| made-up probe / views definitions (synthetic) | synthetic definitions | their own tests under tests/synthetic users | none |
| timeline: pacing with no rate set (base rate) | base rate default 60 | none | "pacing with no rate set paces over the default base rate of 60" |
| path that peaks between its end samples (cover sample count) | cover farthest distance | publicApiAutoStretches (cover not asserted by sample count) | not added: `cover.farthestKm` sampling is engine-internal; recorded as a residual below |

### Done When -> evidence

| Done When | Evidence |
|---|---|
| Map recorded | the table above |
| New file covers gaps with focused assertions | `packages/astraeus/tests/sceneBuildContract.test.ts`, 17 cases, ids/counts/exact values or toBeCloseTo; no snapshots, no message text |
| Pin's made-up inputs, public API; engine-only route named | inputs copied from the pin; `definitionOf` / `missingDataOf` (engine-only, the same as publicApi tests use) are named in the file header and the Jupiter case |
| Planted breaks, each fails a named new case, reverted | (A) `planTimeline.ts` pacing base default `?? 60` -> `?? 61`: fails "pacing with no rate set paces over the default base rate of 60". (B) `planTimeline.ts` `span()` drops the timeline window override: fails "two activities span ... and a timeline span overrides that window" and "a timeline sets the span, the opening rate, loop...". (C) `planBodies.ts` `#register` runs `checkBodyLook` after `bodies.set`, so a failed add keeps the body: fails "a failed add leaves the scene as it was". (A first attempt at C that put `bodies.set` before `#checkOrbit` failed every case on duplicate-id; it was discarded and redone as the targeted form.) Each restored from a copy; `git diff` on both files is empty. |
| Gates | lint: eslint clean; prettier warns only on `streamCheck.test.ts` and `fixtures/browser-exit/draws-through-harness.mjs` (other builders' files); typecheck clean; build ok; `npm test`: 325 passed + 1 failed files, 5325 passed / 1 failed / 2 skipped. The one failure is `scenePin.test.ts` "builds the same definitions..." caused by another builder's uncommitted change to `src/api/assembleScene.ts` (group layers in declared order, I-193); re-ran once, same; not mine, not fixed. |

Commands: `npx vitest run packages/astraeus/tests/sceneBuildContract.test.ts` (17 passed), the gates above under `flock /tmp/claude-1000/astraeus-gates.lock`.

Extra reads: none beyond the Context Files (scenePin.test.ts sceneCases, the fixture's `seriesLoaded` definitionBeforePrepare for a handful of cases, `grep` of case names in the listed publicApi files; production reads of `planTimeline.ts` and `planBodies.ts` to place the planted breaks).

Limitations: map coverage claims for "Existing" rest on case names and a few opened cases, not every assertion. Not covered: the pin's metric and `stateOf` values for the made-up scenes at two times in full (only the facts above), the path-cover sample count case, and the two synthetic definitions as a separate fact.


## Drift Notes

A pinned fact that looks like a defect is recorded as an Issue candidate, not changed.

None for Design. `scenePin.test.ts` is currently red from T-408's group-order change in `assembleScene.ts` (its pin fixture is T-408/T-409's to reconcile).

## Coordinator (gates)

Set done by the orchestrating session after the combined handoff gates passed with T-402..T-404 and T-406..T-412 together (owner: "I mark them as they pass", O-038; G-024 decision 7 "Orchestrate each objective to completion"; owner 2026-11-22 "I am remote now, add park the check and move on"): lint and Prettier clean, typecheck clean, `npm test` 324 files, 5319 passed, 2 skipped; `npm run check:pack` pass, engine 1,836,372 B raw (cap 1,838,000), 525,692 B gzip (cap 527,000).
