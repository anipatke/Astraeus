---
id: T-249
title: Bring the React example camera home and reconcile the notes
objective: O-054
status: planned
depends_on: [{task: T-248, requires: clear}]
owner_validation: {required: false}
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

Pending execution: named cases, results, files read and changed, and limitations, recorded after the work lands.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
