---
id: T-392
title: Views and catalogue steps keep only what needs a browser
objective: O-086
status: planned
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

Pending execution.

## Drift Notes

None expected.
