---
id: T-324
title: Let a host restyle a group's dots without rebuilding
objective: O-078
status: in_progress
stage: build
depends_on: []
check_waiver: {task: T-324, reason: 'Owner chose "Skip step check, one final (Recommended)" for the single build step of O-078; the mandatory Full Objective Check covers the same diff.', actor: {role: owner, session: plan-g022-20261120}, recorded_at: '2026-11-20T20:15:18Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g022-20261120}
planned_reads: [packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerLooks.ts, packages/astraeus/src/api/group.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/KeplerPoints.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/tests/hostCallOrder.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerLooks.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/KeplerPoints.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/tests/groupLookHandle.test.ts, packages/astraeus/tests/groupLookRender.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json]
---

# Let a host restyle a group's dots without rebuilding

## Outcome

`handle.setGroupLook(id, { color?, dotSizePx? })` and `handle.groupLook(id)` exist on both embedding paths and meet every O-078 Success Condition.

## User Check

None required; proven by Node tests and the Full Check's one browser run. The belt app tests a packed tarball separately.

## Done When

Every O-078 Success Condition has named test evidence; configured gates plus `npm run check:engine-alone` and `npm run check:pack` pass; `npm run api:lock` updated; 25-call timing on ~126,000 dots recorded below.

## Context Files

The planned reads above; `packages/astraeus/README.md` under the handle table only; `packages/astraeus/CHANGELOG.md` top section only; `docs/agents/build.md`.

## Design References

`.savepoint/Design.md` under "Public API shape (G-016, owner 2026-11-01)".

## Guardrails

API-01..API-07, ARCH-02, TEST rules, STYLE (advisory).

## Implementation Plan

1. `PointsView.setLook(color, sizePx)` sets colour and size on the blend material and, when present, the Kepler material; returns whether anything changed; `look` getter. No geometry, fill or recompile.
2. `SceneControls.groupLooks: Map<id, {color, dotSizePx}>` (live, host-owned); a frame stage applies each entry to its `PointsView` before `place`, and bumps `state.wakes` on a change so a paused viewer draws it; the label stage sets the group label's `--label-color` via a new `SceneLabelLayer.setColor`.
3. `ViewerControl.groupLook(id)` (the look in force, from the map or the layer's values; undefined for a non-group) and `setGroupLook(id, look)` (already checked, full values), wired in `App.tsx`.
4. `ViewerLooks.setGroupLook` / `groupLook` validate (`bad-group` naming id or field, `not-mounted` via `open`); `ViewerLink` and `ViewerHandle` / `viewerHandleOf` expose them with doc comments.
5. Tests: handle (colour only, size only, both, read-back, errors, not-mounted before ready and after unmount, last call wins, both embedding paths); render (both materials carry the look, positions/blend inputs and geometry identity unchanged, path switch keeps it, paused wake, no-call regression, label colour); 25-group ~126,000-dot timing.
6. README handle row + example, CHANGELOG "0.9.4 (proposed, unreleased)", `npm run api:lock`, gates.

## Boundaries

O-078 Boundaries. No new error code; no change to `scene.groups` or the card.

## Technical Verification

Focused vitest during iteration; configured gates, `check:engine-alone`, `check:pack` at handoff. Evaluated by the Full Objective Check (`agent-skills/references/check-method.md`), which runs `npm run check:browser` once.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
