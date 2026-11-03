---
id: T-262
title: Change looks, scale and switches on a running viewer
objective: O-056
status: planned
depends_on: [{task: T-261, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o056-planning-20261103}
---

# Change looks, scale and switches on a running viewer

## Outcome

A host changes the look, the scale and the display switches of a running viewer and reads them back, the same way from `mount` and React, and a planet can carry info-card readouts (O-056 Success Conditions 4, live half, and 5; review F10 rest, F11; owner decision 1).

## User Check

Not owner-facing yet; the owner tries it in the example at the last step.

## Done When

- `ViewerHandle` gains `look` (the current look, defaults filled) and `setLook(look: LookInput)` (replaces the whole look; checked as `Scene.setLook`), `scale` and `setScale(id)` (one of `scene.scales`; unknown throws the code `Scene.setScale` uses), and `switches` and `setSwitch(id, on)` (a display switch of the scene; unknown throws `bad-switch` or the existing switches code). Each change is presentation only (ARCH-02) and is reported through `onChange` with cause `host` (the Developer drawer and the visitor's own controls report `visitor`), the reads compared in `ViewerLink.publish` like `view`. Exact member names recorded in Technical Evidence and kept to the verb grammar.
- The Developer drawer's look sliders and the visitor's scale and switch controls go through the same seam, so a visitor change is read back by `handle.look` / `scale` / `switches`.
- `AddBodyOptions.readouts` takes the `ReadoutInput` list paths take, drawn on the body's info card by the same code (no copy); a named body not in the scene throws as on `addTrajectory`.
- `lifecycle.test.ts` (both paths) and `twoViewers.test.ts` (setter table) cover every new handle member: before ready / after unmount `not-mounted`, set then read, A does not change B.
- **Surface:** `npm run api:lock` regenerated and the lock diff limited to the members this step adds; CHANGELOG (Unreleased) and the README API tables updated in the same change; `apiSurface`, `apiRules` and `allowlistGrowth` tests pass (no allowlist group grows).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/api/scene.ts` (`ReadoutInput`, `AddBodyOptions`), `packages/astraeus/src/api/planBodies.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/tests/twoViewers.test.ts`, `.savepoint/Design.md` under `Interfaces and Data Flow` ("One handle, one lifecycle (O-054").

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` ("The engine signals, the host decides", "Lifecycle").

## Guardrails

API-01, API-02, API-04, API-05, API-06, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, STYLE-02, STYLE-07, STYLE-10, CODE-01, API-03.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Extend the viewer seam (`viewerPort.ts`) with look, scale and switches; route the visitor's controls through it.
3. Add the handle members in `viewerHandleOf` only (one builder, both paths).
4. Add body readouts reusing the path readout code.
5. Lifecycle and two-viewer table rows; lock, README, CHANGELOG; gates.

## Boundaries

Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files. No renames of existing members and no removal of `toDefinition` (O-057). No new React props for these (the handle covers React through `ref` / `onReady`).

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus the named `check:*` scripts. No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; T-264 reconciles them into Design.md.
