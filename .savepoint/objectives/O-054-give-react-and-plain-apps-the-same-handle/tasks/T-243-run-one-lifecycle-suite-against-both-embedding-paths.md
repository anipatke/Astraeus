---
id: T-243
title: Run one lifecycle suite against both embedding paths
objective: O-054
status: planned
depends_on: [{task: T-242, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Run one lifecycle suite against both embedding paths

## Outcome

One test file runs the Design lifecycle contract against `mount` and `AstraeusScene` with the same cases, so the two paths cannot drift again (O-054 Success Condition 8; API-02; O-053 Boundaries put this suite in O-054).

## User Check

Not owner-facing: the change shows only to a host page's code and its tests. The owner sees the result at the end of the Objective.

## Done When

- New `packages/astraeus/tests/lifecycle.test.ts` (happy-dom, the 3D scene mocked as in `viewerHostReady.test.ts`, outside `act`) defines one adapter per path (`mount`; `AstraeusScene` in a React root) with the same shape (open a scene, get the handle, await ready or `onReady`, collect errors, unmount) and runs every case through `describe.each` over both.
- Cases, each named: build fault (an empty scene: `mount` throws `empty-scene`, React reports it to `onError`); load fault (ready rejects or `onError`, handle unusable); unmount before the load and after the load but before attach (`ready` rejects `not-mounted`; React fires neither `onReady` nor `onError`); every handle call before ready and after unmount throws `not-mounted` and every read is undefined (the call list is read from one table of handle members, so a new member must join it); no `onChange` or `onEventZone` callback after unmount; a rebuild (React: new `scene` prop; mount: unmount and mount again) works; StrictMode (React only).
- Placeholders named `it.todo` for the cases later O-054 steps fill: a throwing listener does not stop the others; a mounted scene is frozen; `setPlaying`; `onSelect`; `onCameraChange`.
- All cases pass for both paths. A case that fails exposes a lifecycle bug: fix it here when it is inside `mount.ts`, `AstraeusScene.tsx` or `viewerLink.ts` and small, recording it; otherwise return REPLAN REQUIRED.
- **Nothing public moved:** `git diff --exit-code -- packages/astraeus/api-surface.lock.json` is empty; `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts` passes; no CHANGELOG entry unless a source fix was needed (then one entry with its migration line).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/tests/viewerHostReady.test.ts`, `packages/astraeus/tests/viewerHostDom.test.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/api/viewerLink.ts`, `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` (the Lifecycle bullet).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F2, F8).

## Guardrails

API-02, API-05, TEST-01, TEST-03, STYLE-02, STYLE-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Write the two adapters and the member table.
3. Write each case once over both paths; keep the existing host tests as they are.
4. Run; fix small lifecycle bugs found, or return REPLAN REQUIRED.
5. Gates.

## Boundaries

Tests, plus only the small lifecycle fixes the suite exposes. No new public member.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read and changed, and limitations, recorded after the work lands.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
