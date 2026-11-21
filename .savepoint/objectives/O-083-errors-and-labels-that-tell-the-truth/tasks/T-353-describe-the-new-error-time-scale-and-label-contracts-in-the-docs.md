---
id: T-353
title: Describe the new error, time, scale and label contracts in the docs
objective: O-083
status: done
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

| Done When | Evidence |
|---|---|
| CHANGELOG 0.10.0 entries and `Breaking changes` list with migration lines; migration-table row | `packages/astraeus/CHANGELOG.md`: 10 new bullets (Fixed/Added/Changed) after O-082's two, then `### Breaking changes in 0.10.0` (9 lines, each with its migration); new `changed` row for `ScalePolicy.id` in the 0.7.0-to-0.8.0 migration table (the one table `migrationTable.test.ts` parses) |
| README by heading: `Numbers without a viewer`, `In a React app`, `Reading and setting the time`/`Clock and changes`, `Bodies and paths`, `Page address`, `Errors` (prose only), `Drawing it` | Edits: `scene.stateOf` row (spans, refusals, composed velocity); `onError` prop text (console default, prop errors); `handle.setTime` row (accepted forms, `Z` example); `addTrajectory` row (`time is ISO text with a zone`); `t` row; Errors prose line after the table intro; `parseElementsBodyRecord` sentence. Claims checked against `core/timeInput.ts`, `api/time.ts`, `app/viewLink.ts` (`timeFromSearch` returns undefined for NaN), `api/AstraeusScene.tsx` (`report`), `api/scene.ts` (`#catalogueRefusal`), `core/stateResolver.ts` |
| `Scene.stateOf` doc comment | `api/scene.ts`: velocity sentence extended for composed legs (T-351); span sentence already matched T-343 (read, unchanged) |
| `npm run api:errors` leaves README table unchanged; apiRules, apiSurface, migrationTable green | `npm run api:errors` rewrote the table with no change to it (README diff is only the 7 prose lines); `npx vitest run` of the three files: 3 files, 139 tests passed |
| Coordinator decision: `ScalePolicy.id` | Removed its WIDENED entry from `packages/astraeus-site/tests/migrationTable.test.ts` (only change to that file) and added the CHANGELOG row; the test passes with the row (the "has a row for every removed or changed name" and "changed" rows cover it) |
| Drift Notes collected | below |
| Gates | lint, typecheck, build clean; `npm test`: 301 files, 5025 passed, 2 skipped, 0 failed |

Files changed: `packages/astraeus/CHANGELOG.md`, `packages/astraeus/README.md`, `packages/astraeus/src/api/scene.ts` (doc comment only), `packages/astraeus-site/tests/migrationTable.test.ts` (WIDENED entry removed). Extra reads: T-343..T-352 Technical Evidence/Drift Notes (named in Context Files); `core/timeInput.ts`, `api/time.ts`, `app/viewLink.ts`, `api/AstraeusScene.tsx`, `api/scene.ts` stateOf (to check claims). Limitation: the `bad-view`/`bad-trajectory`/`bad-element` breaking line says "a raw error" because the evidence names the previous error class only for `addTrajectory` (TypeError).

## Drift Notes

Collected for the orchestrator's Design reconciliation (this Task edits no Design.md):
- T-343: `stateOf` refusals by cause: `out-of-span` for data years (planet series, moon data), `bad-time` for a moon's moment outside the loaded window; Earth and the Sun have no cut-off. Reflect in `Answers for sites`.
- T-344: API-05 scan covers re-exported helpers (`O-053 checks`); new `bad-scene` code; `parseElementsBodyRecord` lives in `api/elementsRecord.ts`; `bad-data` also covers unreadable moon packages.
- T-345: the lit-body limit (`MAX_LIT_BODIES`) is a build-time `too-many-bodies` refusal.
- T-346: the scale is a closed `ScaleId` in the public types; shell-side inputs stay `string`, validated at runtime.
- T-347: optional Design line under `One handle, one lifecycle`: without `onError` the component reports to `console.error`.
- T-348: accepted moment text is `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM[:SS[.fraction]]` plus `Z` or `+-HH:MM`; zone-less and free forms are NaN from `timeInputMs` (`bad-time` / `bad-panels` / ignored page `t`); `isZonelessDateTime` is exported from `core/timeInput.ts`.
- T-349: mapped moons pair definition and binding from one record (`mappedMoon` returns both; `orientationFacts` owns label and sentence per model); Design `Every listed moon addable` / `Core layers and demos` should say so; the Io mean-element trajectory is test-only, not a bound source.
- T-350: body definitions carry `accuracy.positionLimitations`; cards show position then orientation limits.
- T-351: the resolver composes velocity when every leg has it (implemented; nothing further).
- T-352: pacing works on rate magnitude and keeps its sign (negative opening `rate` with `pacing` reachable; fixed in `core/pacing.ts`); non-architectural, at most a note.
- T-353: none beyond the above.

Coordinator (orchestrate-g024-20261121): the `ScalePolicy.id` row sits in the 0.7.0→0.8.0 table only because `migrationTable.test.ts` reads that table alone (it compares the 0.7.0 surface with today's lock); the coordinator prefixed the row "From 0.10.0 (O-083):" so it does not read as 0.8.0 history (test still 110 passed). Design.md was reconciled by the coordinator (commit 4cdcc2bb). Hand-off gates green (lint, typecheck, build; `npm test` 301 files, 5025 passed). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
