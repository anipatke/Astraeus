---
id: T-344
title: Turn the other reviewed raw throws into coded errors
objective: O-083
status: planned
depends_on: [{task: T-343, requires: clear}]
check_waiver: {task: T-344, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: contract
planned_reads: [packages/astraeus/src/api/prepared.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/core/elementsBody.ts, packages/astraeus/src/core/readBytes.ts, packages/astraeus/src/api/frozenCopy.ts, packages/astraeus-site/tests/apiErrors.allowlist.json, packages/astraeus-site/tests/apiSurface.test.ts]
planned_writes: [packages/astraeus/src/api/definitionOf.ts, packages/astraeus/src/api/views.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/elementsRecord.ts, packages/astraeus/src/api/index.ts, tools/api-rules.mjs, tools/api-rules.d.mts, packages/astraeus-site/tests/apiRules.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/tests/publicErrorContract.test.ts, packages/astraeus/tests/fixtures/scenePin.json]
---

# Turn the other reviewed raw throws into coded errors

## Outcome

The other raw throws the audits reached through the public API arrive as coded `SceneError`s, and the API-05 scan also reads the functions `astraeus` re-exports from outside `src/api`, so a helper like `parseElementsBodyRecord` can no longer leak an internal error class unseen (AH-04 parts b and c: Claude CQ-5(b)(c), Gemini CQ-03 items 2–4).

## User Check

None visual. `mount(element, {})` throws `bad-scene`; `scene.setViews([{ id: "a", label: "A", objects: [() => 1] }], { place: "top-bar" })` throws `bad-view`; `parseElementsBodyRecord({})` throws `bad-element`.

## Done When

- `mount`, `AstraeusScene` and every route through `definitionOf`/`missingDataOf` (`api/definitionOf.ts`) given something that is not a `Scene` throw `SceneError("bad-scene")` (new code; planner decision, see PLAN.md) instead of a `TypeError`.
- `setViews` with a value `structuredClone` cannot copy (a function, a symbol) throws `bad-view` naming the call, not a `DataCloneError` (`api/views.ts` around `viewsOf`).
- `addTrajectory(null)` (or any non-object) throws `bad-trajectory`; a `samples` that is not an array throws `bad-trajectory` (`api/scene.ts` `addTrajectory`, `api/planPaths.ts` `sampledBody`).
- `parseElementsBodyRecord` is exported from a thin `src/api/elementsRecord.ts` wrapper that turns `ElementsBodyError` into `SceneError("bad-element")`; `api/index.ts` re-exports the wrapper, not the core function. Its signature is unchanged.
- A data package whose bytes cannot be read (fetch failure, HTTP status, unreadable `file:` address) or that fails its own parse rejects `ready`/`load` with `bad-data` naming the package (planner decision); `MoonOutOfSpanError` keeps `out-of-span`; a `SceneError` passes through (`api/data.ts` around `outOfSpan`).
- `tools/api-rules.mjs` `errorBreaks` also judges the throw statements in every function or class `src/api/index.ts` re-exports from a file outside `src/api` (shelf factories, `classifyPositionError`, and so on); `apiRules.test.ts` gains a sample case proving a re-exported core function with a raw throw is reported. `apiErrors.allowlist.json` stays empty (fix any new find instead of listing it).
- `errors.ts`: `bad-scene` added with its doc comment; `bad-data`'s comment says "malformed or cannot be read". README error table regenerated with `npm run api:errors`; lock regenerated with `npm run api:lock` and the diff reviewed (only `SceneErrorCode` and the re-export source should move).
- `tests/publicErrorContract.test.ts` gains one row per case above (code asserted, never message text); show the rows failing first.
- `tests/fixtures/scenePin.json` pins `"addTrajectory: samples not a list"` as a raw `TypeError` (`input.samples.map is not a function`, line ~15187): regenerate the pin (`npx vitest run packages/astraeus/tests/scenePin.test.ts -u`) and show the diff holds only that entry (now `bad-trajectory`) and any other raw error this Task replaces.
- Existing tests unchanged and green, including `apiRules`, `apiSurface`, `allowlistGrowth`, `publicApi`, `elementsBody` (showers) and `lifecycle`.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/api/definitionOf.ts`
- `packages/astraeus/src/api/prepared.ts` (`prepareScene`)
- `packages/astraeus/src/api/views.ts` (around `viewsOf`, line ~46)
- `packages/astraeus/src/api/scene.ts` (around `addTrajectory`, line ~345)
- `packages/astraeus/src/api/planPaths.ts` (around `buildTracked`, `sampledBody`)
- `packages/astraeus/src/api/data.ts` (around the moon load and `outOfSpan`, lines ~55–75)
- `packages/astraeus/src/core/readBytes.ts` (what a failed read throws)
- `packages/astraeus/src/core/elementsBody.ts` (around `ElementsBodyError`, `parseElementsBodyRecord`; read only)
- `packages/astraeus/src/api/index.ts` (line ~36)
- `packages/astraeus/src/api/errors.ts`
- `tools/api-rules.mjs` (around `errorBreaks`, line ~145)
- `packages/astraeus-site/tests/apiRules.test.ts` (the `errorBreaks` sample case, line ~115)
- `packages/astraeus/README.md` under `Errors` (generated table) and the `parseElementsBodyRecord` sentence under `Drawing it`

## Design References

`.savepoint/Design.md` under `Decisions`: `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-04, API-05, API-07, STYLE-06, STYLE-07, CODE-01, TEST-01..04.

## Implementation Plan

1. Add the failing rows to `publicErrorContract.test.ts` and the failing re-export sample to `apiRules.test.ts`.
2. Extend `errorBreaks`; run it (`npm run api:errors` shows breaks via `node tools/api-rules.mjs errors`) and fix what it finds.
3. Add the guards and the `elementsRecord.ts` wrapper; add `bad-scene`; widen `bad-data`.
4. Regenerate the README error table and the lock; review both diffs.
5. Focused tests, then gates.

## Boundaries

No change to `core/elementsBody.ts` (O-082 owns it), to the error class hierarchy (a `SceneError` stays a `RangeError`), or to messages of existing coded errors. No catch-all that turns every unknown error into a code: each mapping names its cause. Listener isolation (`api/listeners.ts`) unchanged.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/publicErrorContract.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Record for Design reconciliation (`O-053 checks`): the API-05 scan now covers re-exported helpers; the new `bad-scene` code.
