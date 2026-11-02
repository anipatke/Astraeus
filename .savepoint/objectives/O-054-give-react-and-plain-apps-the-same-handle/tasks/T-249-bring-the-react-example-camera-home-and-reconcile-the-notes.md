---
id: T-249
title: Bring the React example camera home and reconcile the notes
objective: O-054
status: done
depends_on: [{task: T-248, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-249, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o054-run-20261101}, recorded_at: '2026-11-01T09:29:52Z'}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Bring the React example camera home and reconcile the notes

## Outcome

`examples/hello-react` puts the camera back after an encounter through the handle, the CHANGELOG carries one migration note for every O-054 break, and Design.md describes the handle and lifecycle as built, ready for the Full Objective Check (O-054 Success Conditions 9 and 10; I-130).

## User Check

Not owner-facing as a step: the React example's camera return is proven by the DOM test and the example build. No owner look at `hello-react` (owner, 2026-11-01).

## Done When

- `examples/hello-react/src/main.jsx` keeps the handle from `ref` or `onReady(handle)`, saves `handle.camera` before following the encounter's probe and calls `handle.setCamera(saved)` when the zone is left with `via: "time"`, as the vanilla example does; it still opens following the probe (the `hello-react` browser step's readouts unchanged). `node tools/build-example.mjs hello-react` builds from the packed tarball.
- A named DOM test in `packages/astraeus/tests/hostCameraDom.test.ts` performs the same composition through `AstraeusScene` and its handle: follow on enter, pose restored on leave.
- The README "camera to the encounter" section shows the React form through the handle.
- `packages/astraeus/CHANGELOG.md` Unreleased opens with one O-054 migration paragraph for app makers: `not-mounted` replaces `missing-data` before `ready` and after `unmount`; `ready` rejects after an early `unmount`; React `onReady` receives the handle and `ref` gives it; repeated activity ids throw `duplicate-id`; edits to a mounted scene throw `scene-mounted`; new `bad-data`, `playing`/`setPlaying`, `selected`/`onSelect`, `onCameraChange`.
- `.savepoint/Design.md` reconciled: `Interfaces and Data Flow` and the codebase map name `ViewerHandle`, the shared handle helper, the listener helper and `viewerSelection.ts`; `Public API shape` Lifecycle bullet matches the code; each earlier O-054 Task's Drift Notes entry is accounted for here as reflected in Design.md or non-architectural, with a reason (AGENTS.md, Deferred Design reconciliation).
- `npm run test:full`, `npm run check:pack`, `npm run check:node-consumer` and `npm run check:engine-alone` pass (results recorded); `npm run check:react-consumer` passes when the network is reachable (else recorded as not run). No browser run (that is the Full Objective Check's one `check:browser`).
- **Nothing public moved here:** `git diff --exit-code -- packages/astraeus/api-surface.lock.json` is empty after this step's edits (the earlier steps already recorded the surface); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`examples/hello-react/src/main.jsx`, `examples/hello-scene/src/main.js` under the camera-to-the-encounter code, `packages/astraeus/tests/hostCameraDom.test.ts`, `packages/astraeus/README.md` under `camera to the encounter`, `packages/astraeus/CHANGELOG.md` under `Unreleased`, `.savepoint/Design.md` under `Components/Codebase Map`, `Interfaces and Data Flow` and `Public API shape (G-016, owner 2026-11-01)`, and the Drift Notes of every earlier O-054 Task.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F2, F10).

## Guardrails

API-01, API-02, API-07, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Change hello-react to use the handle; build it.
3. Add the React restore test.
4. Write the README React form and the CHANGELOG migration paragraph.
5. Reconcile Design.md and account for every deferred drift note.
6. Run the gates and the full and package checks listed.

## Boundaries

No new API. Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Changed: `examples/hello-react/src/main.jsx` (handle from `ref`; saves `handle.camera` on enter, follows the probe, `setCamera(saved)` on a `via: "time"` leave; still opens following the probe through `scene.camera.follow("probe")`), `packages/astraeus/tests/hostCameraDom.test.ts` (new case), `packages/astraeus/README.md` (React form), `packages/astraeus/CHANGELOG.md` (one O-054 migration paragraph at the top of Unreleased; per-Task entries kept), `.savepoint/Design.md` (codebase map line, new "One handle, one lifecycle (O-054)" paragraph in Interfaces and Data Flow, Lifecycle bullet).

| Done When | Evidence |
|---|---|
| hello-react uses handle, restores camera, builds from tarball | `main.jsx` edited; `node tools/build-example.mjs hello-react` built (vite, packed tarball) |
| Named DOM test through AstraeusScene and handle | `hostCameraDom.test.ts` "camera to the encounter and back through AstraeusScene and its handle": follow request on enter, pose request with the saved pose on leave; file 18 tests pass |
| README React form | "camera to the encounter" section now has a `tsx` block using `ref` |
| CHANGELOG one migration paragraph | Unreleased opens with it; covers not-mounted, ready rejection, onReady/ref, duplicate-id, scene-mounted, bad-data, playing/setPlaying, selected/onSelect, onCameraChange, listener isolation |
| Design.md reconciled | See the accounting under Drift Notes |
| test:full, check:pack, check:node-consumer, check:engine-alone, check:react-consumer | all pass (test:full coverage lines 94.68%; engine alone pass 22.9 s; pack pass; node consumer 9 tests; react consumer pass with React 19.3.1) |
| Nothing public moved | `git diff --exit-code -- packages/astraeus/api-surface.lock.json` empty; apiSurface, apiRules, allowlistGrowth, packageBoundaries: 4 files, 40 tests pass |
| Gates | lint, typecheck, build pass; `npm test`: 190 files, 2325 passed, 1 skipped. No browser run. |

Limitations: no pin entries changed; no allowlist entry added.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).

T-249 reconciliation (every earlier O-054 Drift Note, accounted for in Design.md "One handle, one lifecycle (O-054)" unless marked):
- T-240 (bad-data, duplicate-id, internal-fault classes in core/): reflected.
- T-241 (ViewerHandle, not-mounted, close rejects whenAttached): reflected. Its `ready` no-op catch: reflected as a known choice and flagged below.
- T-242 (viewerHandleOf, ViewerLink.reopen): reflected.
- T-243 (listener registration exempt from not-mounted): reflected in the paragraph and the Lifecycle bullet. The flushSync driver fix: non-architectural (test-only driver, no engine change), noted in one sentence.
- T-244 (listeners.ts): reflected, plus codebase map.
- T-245 (sceneFreeze.ts, scene-mounted): reflected.
- T-246 (playable, setPlaying on ViewerControl): reflected.
- T-247 (ViewerState.selected, viewerSelection part, timeUtcMs, cause host): reflected, plus codebase map.
- T-248 (stateful ViewerCamera, fourth publish part): reflected.
- allowlistGrowth per-group rule (owner): already in Design.md Decisions; the new paragraph points to it.

RESOLVED (owner decision, 2026-11-01, "Only hide the expected 'taken down early' case"): `mount` now marks `ready` handled only for a `SceneError` `not-mounted` rejection; any other rejection (a failed load) stays unhandled when nobody awaits `ready`. Design.md note replaced with the decision. Tests in `lifecycle.test.ts` ("mount's ready and unhandled rejections", 3 cases, observed through `process` `unhandledRejection`): unawaited early unmount raises none; unawaited load failure is observed; awaited, both still reject and nothing is reported unhandled. Mutation check: marking every rejection handled fails the load-failure case. lifecycle file run 10 times, 36 of 36 each. lint, typecheck, `npm test` re-run (see Technical Evidence addendum below). Changed: `packages/astraeus/src/api/mount.ts`, `packages/astraeus/tests/lifecycle.test.ts`.

Flake grep (T-243 pattern, fixed microtask or timer waits on React commits in happy-dom tests): not fixed, outside this Task. Fixed-count `for (i<5) await Promise.resolve()` inside `act` in `domSetup.ts` (`drawn`) and `hostCameraDom.test.ts` (settle, ready case); single `await Promise.resolve()` in `act` in `viewerHostDom.test.ts` (several), `eventZonesDom.test.ts:196`, `sceneHooksDom.test.ts`, `hostPageDom.test.ts`, `publicApi.test.ts`; real `setTimeout` waits of 0 to 20 ms in `viewerHostReady.test.ts:147`, `panelLoadBoundary.test.ts`, `addressDom.test.ts`, `publicApi.test.ts` and `astraeus-demo-planets/tests/domMoonPanel.test.ts`. They are wrapped in `act`, which flushes effects, so they look safe, but they depend on a fixed number of promise hops; none flaked in this Task's runs (npm test and test:full each once).
