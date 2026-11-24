---
id: T-461
title: Host labels show and answer taps
objective: O-101
status: planned
depends_on: [{task: T-459, requires: clear}, {task: T-460, requires: clear}]
check_waiver: {task: T-461, reason: 'Owner said "orchestrate the rest of the goal" (G-027, 2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g027-20261124}, recorded_at: '2026-11-24T10:13:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o101-20261124}
lane: draw
planned_reads: [packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/src/app/sceneTargets.ts, packages/astraeus/src/app/scenePicking.ts, packages/astraeus/src/app/scenePointer.ts, packages/astraeus/src/app/groupLabelPoint.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/displaySwitches.ts, packages/astraeus/src/app/sceneLayout.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/shell/useShelfPanels.tsx, packages/astraeus/tests/sceneLabelsLayout.test.ts, packages/astraeus/tests/scenePicking.test.ts, packages/astraeus/tests/sceneFrame.test.ts, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tests/publicBuild.test.ts]
planned_writes: [packages/astraeus/src/app/hostLabels.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/src/app/sceneTargets.ts, packages/astraeus/src/app/scenePicking.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/tests/hostLabels.test.ts, packages/astraeus/tests/hostLabelsTap.test.ts, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tests/publicBuild.test.ts]
---

# Host labels show and answer taps

## Outcome

The labels a host adds with `addLabels` are drawn in the one label layout, on their fixed point or on their groups' dots, and follow them as time moves; they collide and keep their place by the same rule and priorities as every other label. A group a host label is anchored on draws no name of its own. A tap on a label that selects one group selects it exactly as the Object list does; on a label that selects a panel, opens that panel; a label with no `selects` is text only. A drag that starts on any label moves the camera. Labels that select several groups are T-462's.

## User Check

None beyond the Objective's (the owner looks at the made-up group-labels scene after the browser Task).

## Done When

- **Placed by one rule.** New `packages/astraeus/src/app/hostLabels.ts` answers where each host label is this frame, or null:
  - fixed point: `positionKm` turned from its `plane` into the engine's EQJ frame (the `eclipticJ2000ToEqjMatrix` rotation the groups use, `core/orbitGroup.ts`), added to its `center`'s offset from the scene centre (`sceneOffsetKm`), mapped through the scale policy, as a group's member is;
  - groups: the pooled rule of `app/groupLabelPoint.ts` over the anchored groups' `PointsView`s (sums added, best member across them), the member chosen again only when one of their fill pairs changes, and the label at that member's blended place each frame (no per-frame pass over members). Null when none of its groups is drawn (outside their time bounds, or hidden by the showing view or `shownDuring`).
  `labelPositionOf` answers a host label id through it, from an optional field of `SceneTargets` (absent: no host labels), so existing fixtures stand.
- **One layout.** Host labels are entries of `SceneLabelLayer` built from the definition, as sky labels are (`SceneLabels.ts`), never a second layer: own colour or the label layer's default; `labelPriority` (default 80) in the same sort, overlap padding and reappear margin; `data-label-id` set to the label id; the selected bonus and selected look when its own id or the one group it selects is the selected object; hover brightens it when its tap target is hovered.
- **Cover rule** (G-027 Decision 1): a group named in any label's `anchor.groups` has no entry in the label layer, whatever its `showLabel`, the Labels switch or `?labels=` say; it stays in the Object list, the camera menu and selectable. Host label ids join the ids the Labels switch turns off and on (`displaySwitches`), and `?labels=<labelId>:off|on` applies to them.
- **Taps** (the #33 rules, O-095): a shown label with `selects.groups` of one id, or `selects.panel`, is a label-only tap target (`scenePicking.ts` `pickCandidatesOf`). A tap on a one-group label makes the same pick request the group's own name or the Object list would (`onPickObject(groupId)`, so the card opens on a wide screen and the camera only flies on a phone, as today). A tap on a panel label opens the story panel (the story-marker path) or the shelf panel (the host request path of `useShelfPanels`). A label with no `selects` is no tap target: a tap there selects whatever is under it, or nothing. A press that moves past the tap slop starting on any label is a camera drag and selects nothing.
- **Unit tests**, new files only (TEST-01, ARCH-03, made-up scenes only):
  - `packages/astraeus/tests/hostLabels.test.ts`, one table across the anchor kinds: a fixed point in each `plane`, with and without a `center` that is not the scene centre (render place equals the hand-computed one); a label on one group, on a ring group about the centre (within the ring, not at the centre) and on four groups (within their union), each again after the clock moves (still within the moved dots); hidden when its groups are out of bounds or hidden by a view; a covered group has no label entry while still listed and a camera target; Labels switch off hides host labels and on shows them; `?labels=<id>:off`; a host label with priority above a body's wins an overlap and below it loses (the layout of `sceneLabelsLayout.test.ts`, in the new file).
  - `packages/astraeus/tests/hostLabelsTap.test.ts`, one table across the `selects` kinds on a mounted made-up scene (the happy-dom viewer driver pattern of `tests/clickOpensInfo.test.ts`, in the new file): one group → that group selected and its card open at desktop width, selected with no card at phone width; story panel → open; shelf panel → open; none → nothing selected; a drag starting on each label → the camera moved and nothing selected.
  - Existing tests unchanged; if one turns red, stop and report.
- **Size, and the cap change** (G-027 Decision 5, owned by this Task): run `npm run check:pack` with this Task's code in the tree. If the engine's first download is over 527,000 B gzip, raise `gzipLimit` in `packages/astraeus-site/tools/validate/engine-budget.mjs` by 2,000 B to 529,000 B, adding a dated line to the comment above it with the measured raw and gzip figures and "owner decision 'Raise by 2,000 B', G-027 Decision 5, O-101", and change the pinned value in `packages/astraeus-site/tests/publicBuild.test.ts` line 168 to match (the owner's decision covers this one line). If the raw figure is over 1,838,000 B, stop and report it with the figure: the owner has not approved a raw raise (asked separately). If it is under both caps, change nothing and record the figure; T-462 then owns the change by the same rule.
- No CHANGELOG line (T-460's Added line covers drawing and taps); no README change.
- Configured gates pass; evidence recorded under `docs/agents/verification.md`. Run `npm run check:browser -- --step look-out --step two-viewers --step orbit-lines` once before hand-off (the label layer, the group-name tap of `groupLabelChecks` and `sceneContentsHooks.ts` are on their paths) and record the result.

## Context Files

- `packages/astraeus/src/app/SceneLabels.ts`
- `packages/astraeus/src/app/sceneFrame.ts` (`updateOverlays` and `shownUnderView` only)
- `packages/astraeus/src/app/sceneContentsHooks.ts` (`useOverlayLayers` only)
- `packages/astraeus/src/app/sceneTargets.ts`
- `packages/astraeus/src/app/scenePicking.ts` (`PickFrame`, `pickCandidatesOf`, the tap slop)
- `packages/astraeus/src/app/scenePointer.ts`
- `packages/astraeus/src/app/groupLabelPoint.ts`, `PointsView.ts` (the pooling accessors only)
- `packages/astraeus/src/app/App.tsx` (`hiddenLabelsFrom`, `requestPick`, `requestPanel`, the shelf panel request)
- `packages/astraeus/src/app/displaySwitches.ts` (`SwitchBindings.labels`, `setLabels`)
- `packages/astraeus/src/shell/useShelfPanels.tsx` (the `request` input only)
- `packages/astraeus/tests/sceneLabelsLayout.test.ts`, `tests/clickOpensInfo.test.ts` (setup only, as models)
- `packages/astraeus-site/tools/validate/engine-budget.mjs`, `packages/astraeus-site/tests/publicBuild.test.ts` (line 168)

## Design References

`.savepoint/Design.md` under `Viewer interface` and `Interfaces and Data Flow`; viewer-interface section 6 (behaviour changes, #33 tap and drag); G-027 Release.md finding 2 and Decisions 1 and 5.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, API-03, CODE-01, CODE-02, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-02, STYLE-07.

## Implementation Plan

1. Write both table tests; see no host labels drawn.
2. `hostLabels.ts`: fixed and pooled places; `labelPositionOf` through it.
3. Layer entries, cover rule, switch and address ids.
4. Tap targets and routing for one group and panels; drag unchanged.
5. `check:pack` and, only if over, the gzip cap; the two browser steps.

## Boundaries

No several-group selection, card or framing (T-462); no change to bodies' labels, sky labels or the camera; no second label layer; no new public name.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/hostLabels.test.ts packages/astraeus/tests/hostLabelsTap.test.ts packages/astraeus/tests/sceneLabelsLayout.test.ts packages/astraeus/tests/sceneLabelsHysteresis.test.ts packages/astraeus/tests/scenePicking.test.ts packages/astraeus/tests/sceneFrame.test.ts packages/astraeus/tests/clickOpensInfo.test.ts packages/astraeus/tests/displaySwitches.test.ts packages/astraeus-site/tests/publicBuild.test.ts`. Handoff: the configured gates, `npm run check:pack`, `npm run check:browser -- --step look-out --step two-viewers --step orbit-lines`. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Expected for Design.md (Viewer interface, labels): host labels are entries of the one label layer, placed by `app/hostLabels.ts`; the cover rule. Reconciled before the Full Objective Check.
