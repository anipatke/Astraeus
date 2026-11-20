---
id: T-324
title: Let a host restyle a group's dots without rebuilding
objective: O-078
status: done
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

Executor session exec-t324-20261120 (same session as planning; the Full Objective Check runs in a fresh session). Branch `feat/set-group-look`.

**Per criterion (O-078 Success Conditions):**
- Input and errors: `checkedGroupLook` (`src/api/groupLookInput.ts`) via `ViewerLooks.setGroupLook`. Tests `tests/groupLookHandle.test.ts`, both paths (`mount`, `AstraeusScene`): "throws bad-group naming the id for an unknown or non-group id" (`nope`, `earth` (a body), `""`, a number; message lists the groups); "throws bad-group naming the field for %s, and changes nothing" (10 rows: non-hex and non-text colour, size 0, negative, Infinity, NaN, text, unknown field, no object, array); "throws not-mounted after unmount, and reads undefined"; "before ready ... throws not-mounted and groupLook reads undefined (mount)". Lifecycle suite (`tests/lifecycle.test.ts`, both paths): `setGroupLook` joins `CALLS` (not-mounted whenever unusable), `groupLook` joins new `READ_CALLS` (undefined whenever unusable); member table updated.
- Read-back: "reads the scene's own look until changed" (addGroup's `#ff8800`/3, defaults `#9de3a8`/2.5); undefined for a non-group id.
- Colour only / size only / both / `{}`: "sets the colour only, the size only, and both; a field left out keeps its value", also asserting the map the frame applies.
- Call order: "lands in call order: the last call wins, and the read is immediate". Two viewers: `tests/twoViewers.test.ts` setter table row `setGroupLook` (A changes, B's reads and listeners unchanged, no listener hears it).
- Both draw paths, next frame, paused, no rebuild: `tests/groupLookRender.test.ts` "on the shader places the dots (GPU path)" and "on the blend of exact fills (CPU path)": after `applyGroupLooks` and one more `sync`/`place` at the same time, both materials read the new colour and size; sampled `memberLocalPosition` equal before/after; `fillCount` unchanged; same geometry and material objects; `material.version` unchanged (no program rebuild); `state.wakes` +1 once, unchanged look adds nothing. "a group that switches way of drawing (a scale change) keeps the look".
- Presentation only: "is presentation only: no change report, and scene.groups keeps describing the scene" (no `onChange`/`onSelect`, time unchanged, `scene.groups` JSON unchanged). The stage touches only material colour/size and label CSS.
- Label: "gives the group's scene label the colour, and leaves other labels alone" (real `SceneLabelLayer`, happy-dom). The info card renders no group colour (`src/shell/InfoPanel.tsx`, `infoModel.ts` read no `color`), so unchanged, documented in README and the handle doc.
- No-call regression: "without any setGroupLook a group is drawn exactly as before" (materials carry the layer colour/size; empty map applies nothing); `controls.groupLooks` empty until a call; the whole existing suite passes unchanged apart from the two table rows.
- Rebuild: "a viewer rebuilt with a new scene starts from the new scene's own looks (AstraeusScene)".
- Timing (measurement, not a threshold): Node v24.16.0, 25 groups × 5,040 = 126,000 dots, 25 checked looks + one `applyGroupLooks`: median 0.012 ms, worst 0.045 ms over 20 runs (`[O-078 scale]` log). Headless Chromium 147 with SwiftShader (`--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`), a scratch Vite build of the engine source mounting 25 measured-phase groups of 5,040 orbits about the Sun, 25 `handle.setGroupLook` calls per run (2 bright, 23 dim), 10 runs: calls median 0.1 ms, worst 0.3 ms (timer resolution 0.1 ms); the frame after the calls median 16.7 ms (baseline 16.7 ms); the first three runs' next frame was 33 ms (one skipped vsync, still within 3 s of the opening `setCamera` focus, not separated from settling); no page errors; `groupLook` read back the set value. Probe files in the session scratchpad (not committed; no screenshots).
- Docs: README handle row, mount member list, example (dim all but two, restore); CHANGELOG "0.9.4 (proposed, unreleased)"; doc comments (shortened to keep the /api page under its 46,000 B gzip budget, which the first full run exceeded at 46,245 B); `npm run api:lock` (added `ViewerHandle.groupLook`, `setGroupLook`, `GroupLookInput`, `GroupLookRead`, and the same on `MountedScene`); `docs/architecture/groups-and-time.md` gains a "Live group looks" paragraph (Design reconciliation). No version bump. `bad-group`/`not-mounted` reused; no error code change.

**Gates** (fresh, 2026-11-20T20:25:03Z–20:26:52Z, Node v24.16.0): `npm run lint` 0, `npm run typecheck` 0, `npm run build` 0, `npm test` (junit) 0 (267 files, 4104 passed, 2 skipped), `npm run check:engine-alone` 0 (196 files, 2998 passed, 2 skipped), `npm run check:pack` 0 (astraeus packed 7.31 MB / 8.0, unpacked 9.47 MB / 9.5). An earlier full run failed 4 tests (lifecycle member table, README mount list parse of `setGroupLook(id, look)`, the /api gzip budget); fixed by the table rows, README `setGroupLook(id)`, and shorter doc comments, no budget change.

**Files read:** the planned reads, plus (logged extra reads) `src/app/dotMaterial.ts`, `src/app/keplerShader.ts` (uniform names), `src/shell/Label.tsx` (label colour variable), `src/shell/InfoPanel.tsx`/`infoModel.ts` (no card colour), `src/app/sceneHooks.ts` (PointsView lifetime), `tests/pointsKepler.test.ts`, `tests/pointsLookAhead.test.ts`, `tests/helpers/frameContext.ts`, `tests/twoViewers.test.ts`, `tests/lifecycle.test.ts` (setter and member tables), `src/api/skyTraceInput.ts` (checker pattern), `src/api/index.ts`, `docs/architecture/groups-and-time.md` (groups section), `packages/astraeus-site/tools/validate/harness.mjs` (SwiftShader flags), `docs/RELEASING.md` (version rule), `docs/agents/browser-policy.md`.
**Files changed:** `packages/astraeus/src/api/{groupLookInput.ts (new), group.ts (export HEX), index.ts, viewerHandle.ts, viewerLink.ts, viewerLooks.ts}`, `src/app/{App.tsx, AstraeusScene.tsx, PointsView.ts, SceneLabels.ts, sceneFrame.ts, viewerPort.ts}`, `tests/{groupLookHandle.test.ts (new), groupLookRender.test.ts (new), lifecycle.test.ts, twoViewers.test.ts}`, `README.md`, `CHANGELOG.md`, `api-surface.lock.json`, `docs/architecture/groups-and-time.md`.

**Limitations:** no pixel-level proof that the drawn colour changed (browser policy: no screenshots); the browser timing came from a scratch probe, not a repo browser script; `npm run check:browser` is left to the Full Check. The astraeus unpacked size is 9.47 of 9.5 MB (0.03 MB headroom). The belt app has not tried the change.

## Drift Notes

- Planned writes changed: `KeplerPoints.ts` needed no change (its material is set through `PointsView.setLook`); added `src/api/groupLookInput.ts`, `src/api/group.ts` (exports the one `HEX` pattern, reused), `src/api/index.ts`, `tests/lifecycle.test.ts` and `tests/twoViewers.test.ts` (the handle tables a new member must join; `twoViewers` makeScene gained one small group for its row), `docs/architecture/groups-and-time.md`.
- `ViewerControl.groups`, `groupLook` and `setGroupLook` are optional members, so the existing test stand-ins of the control stay unchanged (as `skyFigures` is optional).
- Design: reconciled in `docs/architecture/groups-and-time.md` ("Live group looks"), linked from Design.md "Groups and the `points` layer"; Design.md itself needs no change.

## Owner Decision

Owner 2026-11-20 (session plan-g022-20261120), after the handoff gates passed: "Mark done, run final check (Recommended)". Status set to done by the executor on that instruction; the mandatory Full Objective Check follows in a fresh session.
