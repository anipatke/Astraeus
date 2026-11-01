---
id: T-238
title: Split the host link into clock, views, camera and zones
objective: O-058
status: planned
depends_on: [{task: T-237, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o058-planning-20261101}
---

# Split the host link into clock, views, camera and zones

## Outcome

`ViewerLink`'s four jobs are separate parts, each in its own module, joined by the same `ViewerLink` the host already gets from `mount` and `AstraeusScene` (O-058 Success Condition 3).

## User Check

Not owner-facing: an internal refactor with no change a host or visitor can see. The owner sees the result at the end of the Objective.

## Done When

- `packages/astraeus/src/api/viewerClock.ts` (time, rate, playing, `rateSource`, `setTime`, `setRate`, `onChange` and the change publish), `viewerViews.ts` (`view`, `setView`), `viewerCamera.ts` (`camera`, `setCamera`, the camera-request check) and `viewerZones.ts` (`eventZones`, `onEventZone`, the zone publish) each hold one job, moved as-is; `viewerLink.ts` keeps the public types, the attach, detach, close and `whenAttached` lifecycle and the `NOT_OPEN` guard, and delegates every member (same names, signatures, order of publish: change then zones).
- `ViewerLink` still `implements ViewerPort`; `mount.ts`, `AstraeusScene.tsx` and `index.ts` are unchanged; `viewerLink.ts` and each part are at most 150 lines.
- `npx vitest run packages/astraeus/tests/viewerHostDom.test.ts packages/astraeus/tests/viewerHostReady.test.ts packages/astraeus/tests/eventZonesDom.test.ts packages/astraeus/tests/hostCameraDom.test.ts packages/astraeus/tests/pacingDom.test.ts packages/astraeus/tests/hostPageDom.test.ts` passes (names recorded).
- **Nothing public moved:** `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/` is empty (lock, every O-053 allowlist and `DEEP_IMPORT_COUNTS` unchanged), and `git diff --name-only --diff-filter=M main -- '*.test.ts' '*.test.tsx'` is empty (no existing test edited). `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Same output:** `npx vitest run packages/astraeus/tests/scenePin.test.ts` passes without `-u`, and `git status` shows `packages/astraeus/tests/fixtures/scenePin.json` unmodified.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/tests/viewerHostDom.test.ts`, `packages/astraeus/tests/eventZonesDom.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-058 Objective under `Architectural Considerations` (planned module layout).

## Guardrails

API-01, API-02, API-05, ARCH-02, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Move code as-is: same `SceneError` codes and messages, same listener copying (a listener added or removed during a report behaves as today), same reset of rate source and zones on attach. The parts share the one attached control through an internal accessor, not a second copy of it. No CHANGELOG entry.
3. Split clock, views, camera and zones; `ViewerLink` composes them.
4. Run the host-link tests, the pin, the O-053 tests and the gates.

## Boundaries

Host link only. No new member, callback or behaviour; the public types stay in `viewerLink.ts`.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: each Done When item with its command and result, files read and changed, and limitations.

## Drift Notes

Record any architecture delta here and name the last Task of O-058 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
