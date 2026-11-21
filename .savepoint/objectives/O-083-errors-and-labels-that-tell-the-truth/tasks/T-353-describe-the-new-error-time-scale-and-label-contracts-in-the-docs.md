---
id: T-353
title: Describe the new error, time, scale and label contracts in the docs
objective: O-083
status: planned
depends_on: [{task: T-343, requires: clear}, {task: T-344, requires: clear}, {task: T-345, requires: clear}, {task: T-346, requires: clear}, {task: T-347, requires: clear}, {task: T-348, requires: clear}, {task: T-349, requires: clear}, {task: T-350, requires: clear}, {task: T-351, requires: clear}, {task: T-352, requires: clear}]
check_waiver: {task: T-353, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: docs
planned_reads: [packages/astraeus/src/api/errors.ts, packages/astraeus/src/core/timeInput.ts, packages/astraeus/src/core/scalePolicy.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus-site/tests/migrationTable.test.ts]
planned_writes: [packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/src/api/scene.ts]
---

# Describe the new error, time, scale and label contracts in the docs

## Outcome

The engine README and the 0.10.0 CHANGELOG section describe what O-083 changed, with every breaking change named and a one-line migration for each, so a host upgrading from 0.9.5 knows what to change.

## User Check

None visual. A reader of the CHANGELOG's 0.10.0 section finds a "Breaking changes" list naming: zone-less date-time text refused (`bad-time`); `out-of-span`/`bad-time` from `stateOf` where a raw error was thrown; new codes `bad-scene` and `too-many-bodies`; `bad-data` for unreadable packages; `ScaleId` and the closed scale types; `AstraeusScene` logging without `onError`; orientation labels and card limitations changed for 13 moons and the planets; composed states may now carry velocity; the reverse-pacing outcome (fixed, or confirmed unreachable).

## Done When

- `packages/astraeus/CHANGELOG.md`: the open `## 0.10.0 (proposed)` section (added by O-082; read only that section) gains O-083's entries in the file's `Fixed:`/`Changed:`/`Added:` style and a `Breaking changes` list with a migration line each. If the section is missing when this Task starts, add it at the top with the same heading. If `migrationTable.test.ts` requires a migration-table row for a surface change (`ScaleId`), add it as the test directs.
- `packages/astraeus/README.md`, read and edited by heading only: `Numbers without a viewer` (`stateOf` answers over the data's years; refusals; velocity "where every leg has it"), `In a React app` (errors go to the console without `onError`), `Reading and setting the time` and `Clock and changes` (accepted moment text, with a `Z` example), `Bodies and paths` (the `time is ISO text` sentences of `addTrajectory`), `Page address` (`t` must carry a zone), `Errors` (prose around the generated table only; the table stays generated), `Drawing it` (`parseElementsBodyRecord` throws `bad-element`). Do not hand-edit the generated error table.
- `Scene.stateOf`'s doc comment in `api/scene.ts`: the velocity sentence matches the resolver change (Task 09) and the span sentence matches Task 01.
- `npm run api:errors` leaves the README unchanged (table already current); the README API tables check (`apiRules.test.ts` `readmeApiBreaks`), `apiSurface`, `migrationTable` green.
- Collect every O-083 Task's Drift Notes into this Task's evidence as a list for the orchestrator's Design reconciliation before the Full Objective Check (memory rule: reconcile Design before Full Check); this Task does not edit `.savepoint/Design.md`.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/CHANGELOG.md` (the `## 0.10.0 (proposed)` section only: `grep -n '^## ' packages/astraeus/CHANGELOG.md`)
- `packages/astraeus/README.md` under the headings named in Done When only
- `packages/astraeus/src/api/scene.ts` (`stateOf` doc comment)
- The Technical Evidence and Drift Notes of O-083's Tasks 01–10

## Design References

`.savepoint/Design.md` under `Decisions`: `Public API shape (G-016, owner 2026-11-01)` (the `Compatibility` bullet: one CHANGELOG migration table).

## Guardrails

API-07, PROV-01, STYLE-09, TEST-03.

## Implementation Plan

1. Read each prior Task's evidence for the final behaviour (do not restate the plan; describe what landed).
2. Write the CHANGELOG entries and the breaking-change list.
3. Edit the named README sections and the `stateOf` doc comment.
4. Run `npm run api:errors`, the README/surface tests, then the gates.

## Boundaries

No code behaviour change; no version bump or data-package peer change (owner's release steps); no edits outside the named headings; no Design.md edit.

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/migrationTable.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

The collected O-083 drift list for Design reconciliation goes here.
