---
id: T-432
title: A lost graphics context can come back
objective: O-092
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-432, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "Carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:52:00Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: context
planned_reads: [packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/tests/patchedShaders.test.ts, packages/astraeus/tests/glowAndHooksDom.test.ts]
planned_writes: [packages/astraeus/tests/contextLoss.test.ts]
---

# A lost graphics context can come back

## Outcome

The rule that lets a lost graphics context be restored (the `webglcontextlost` event's default is prevented) is pinned by a test against three.js's own renderer source in the installed peer, and the engine's renderer is the stock one that carries it. The audits' "no `webglcontextlost` handling" (AH-13; Gemini RND-05) is checked: the planner found that three 0.169's `WebGLRenderer` already calls `event.preventDefault()` in its own `onContextLost` (`node_modules/three/src/renderers/WebGLRenderer.js` ~661–663, re-checked 2026-11-22; nothing in `packages/astraeus/src` listens for `webglcontextlost`, and O-087/O-089 added no context handling) and that `AstraeusScene` lets react-three-fiber build that stock renderer (`AstraeusScene.tsx` ~225, a plain options object). The real-browser lose-and-restore is draft 01's step.

## User Check

None visual.

## Done When

- New `tests/contextLoss.test.ts`, in the style of `patchedShaders.test.ts` (checks run against three's own source so a peer change fails a test, not a user's page):
  - reads the installed three's `src/renderers/WebGLRenderer.js` (resolved from the `three` package, not a hard-coded path) and asserts that it adds a `webglcontextlost` listener whose handler calls `preventDefault()`, and a `webglcontextrestored` listener (installed 0.169.0: listeners ~243–244, `onContextLost` ~661–663, `onContextRestore` ~671). The match must not depend on 0.169's exact text, because the peer range is `>=0.169.0 <0.181.0` and `npm run check:three-newest` runs the engine tests against the newest three in it (O-091 T-415); record that the newest admitted three still has the listener (read its source on npm or in the check's scratch copy).
  - asserts that `AstraeusScene`'s `<Canvas gl={...}>` is given an options object and not a renderer factory (a factory could build a renderer without that listener), by rendering `AstraeusScene` with react-three-fiber's `Canvas` mocked to a recorder (the pattern of `firstDraw.test.ts` ~9–16) and checking the recorded `gl` prop is a plain object.
- The existing restore-wake case in `glowAndHooksDom.test.ts` (~207–231) is named in Technical Evidence as the evidence that a restored context wakes the draw rule (TEST-03).
- If draft 01's recorded run shows the second viewer does not draw again after `restoreContext()`, this Task stops and returns REPLAN REQUIRED with that evidence (an engine fix would then be planned, not improvised here).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/AstraeusScene.tsx` (the `Canvas` ~222–240)
- `packages/astraeus/tests/patchedShaders.test.ts` (top ~1–20: the house pattern of checking against what the installed three ships, there its shader chunks)
- `packages/astraeus/tests/firstDraw.test.ts` (the `Canvas` mock ~9–16)
- `node_modules/three/src/renderers/WebGLRenderer.js` (listeners ~243–244, `onContextLost` ~661, `onContextRestore` ~671; read only)

## Design References

`.savepoint/Design.md` under `Good guest`.

## Guardrails

TEST-01, TEST-03, STYLE-05.

## Implementation Plan

1. If draft 01's Technical Evidence is in, read its restore result. If it failed, return REPLAN REQUIRED.
2. Write the two checks; confirm the first fails when pointed at a copy of the source with the `preventDefault()` line removed (scratch copy, not committed; record the result).
3. Gates.

## Boundaries

Test only: no engine change, no new event listener (three already prevents the default; adding a second would be duplicated logic, STYLE-07). No browser run (draft 01's step covers the real browser).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/contextLoss.test.ts packages/astraeus/tests/glowAndHooksDom.test.ts packages/astraeus/tests/firstDraw.test.ts`, plus `npm run typecheck`, eslint (`node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js <changed files>`) and `npx prettier --check <changed files>` (builder rule 7). Engine size unaffected (test only). `check:three-newest` (network) is the Full Check's, not this Task's (see draft 07).

## Technical Evidence

| Done When | Evidence |
|---|---|
| Test reads installed three's WebGLRenderer.js, handler for `webglcontextlost` calls `preventDefault()`, `webglcontextrestored` listener exists, no dependence on 0.169 text | `tests/contextLoss.test.ts` "prevents the default..." (resolves the three package folder from its entry file, finds the handler named in the `addEventListener` call, checks its body). Newest admitted three: three@0.180.0 packed from npm into scratch; it has the same listeners (lines 359-360) and `event.preventDefault()` in `onContextLost` (line 1014). |
| Red-first: fails without the `preventDefault()` line | Test "fails on a copy of the source without the preventDefault call" strips the call from the source in memory and asserts the same matcher then finds none (the matcher is shown to be able to fail). |
| `gl` is a plain options object, not a factory | `tests/contextLoss.test.ts` "gives the Canvas an options object..." renders HostScene with Canvas mocked to a recorder; checks typeof object and plain prototype. |
| Restore-wake evidence | The existing restore-wake case in `glowAndHooksDom.test.ts` (~207-231) (TEST-03), run green. |
| Draft 01 restore result | Not read (no browser run here); no REPLAN trigger known. |

Commands: `npx prettier --write` on the new file; eslint (use-typescript6) on it: clean; `npm run typecheck`: no errors in contextLoss.test.ts (errors only in another builder's `ownedPictures.test.ts`); `npx vitest run packages/astraeus/tests/contextLoss.test.ts packages/astraeus/tests/glowAndHooksDom.test.ts packages/astraeus/tests/firstDraw.test.ts`: 3 files, 20 tests passed.

Files changed: `packages/astraeus/tests/contextLoss.test.ts` (new). Extra reads: `tests/firstDraw.test.ts` lines 40-100 (Canvas mock render pattern).

Limitations: the real-browser lose-and-restore is draft 01's step; check:three-newest not run (network, Full Check's).

## Drift Notes

Design `Good guest` gains: context loss is handled by three's own renderer, pinned by `tests/contextLoss.test.ts` (reconciled by draft 07).

## Coordinator (gates)

Combined wave-1 gate with T-427, T-428, T-431, T-432 together: typecheck clean; `npm run lint` (ESLint + Prettier) clean; `npm test` 332 files, 5443 passed, 2 skipped. Engine 1,826,394 B raw (cap 1,838,000). Set done by the orchestrating session (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "Carry on").
