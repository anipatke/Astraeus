---
id: T-459
title: Group names sit on their dots
objective: O-101
status: planned
depends_on: []
check_waiver: {task: T-459, reason: 'Owner said "orchestrate the rest of the goal" (G-027, 2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g027-20261124}, recorded_at: '2026-11-24T10:13:49Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-o101-20261124}
lane: place
planned_reads: [packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/KeplerPoints.ts, packages/astraeus/src/app/sceneTargets.ts, packages/astraeus/src/app/PathView.ts, packages/astraeus/src/app/StoryMarkers.ts, packages/astraeus/tests/sceneTargets.test.ts, packages/astraeus/tests/pointsKepler.test.ts, packages/astraeus/tests/pointsLookAhead.test.ts, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/app/groupLabelPoint.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/sceneTargets.ts, packages/astraeus/tests/groupLabelPoint.test.ts, packages/astraeus/tests/sceneTargets.test.ts, packages/astraeus/CHANGELOG.md]
---

# Group names sit on their dots

## Outcome

A point group's name sits on its dots, not at their centroid, so a ring or a swarm round the Sun is named on the ring or the swarm rather than at the Sun, and the name follows the dots as time moves (G-027 Decision 4, "Yes, all groups"). The rule is one small module the host labels reuse for labels anchored on several groups. The camera's focus and framing of a group (centroid and extent) do not change.

## User Check

Start `npm run preview:owner`, then on `localhost:5490`:

1. `?experience=synthetic-belt`: the belt's name sits on the belt's dots, not on the Sun. Press play at a high rate: the name moves with the dots and never jumps across the Sun.
2. `?experience=synthetic-ring`: the ring's name sits on the ring.
3. `?experience=synthetic-lookout`: the "lantern-field" name still sits on its field and a tap on it still selects it.

Say whether the place on a ring (where the ring crosses the direction of the vernal equinox, see below) reads well, or name a better spot.

## Done When

- **One rule, one module.** New `packages/astraeus/src/app/groupLabelPoint.ts` (pure, no Three.js scene objects, ARCH-01 generic) holds the placement: for the members of one fill, each member's unit direction from its group's own centre (`km` minus the centre offset the fill added) is summed into a resultant `R` with count `n`. The label's direction `d` is `R / |R|` when `|R| >= 0.25 n` (a swarm: a clear mean direction); otherwise (a ring or a shell) it is the direction held from the group's previous choice, and at the first choice the J2000 +x direction (the vernal equinox), so a ring's name does not wander between fills. The anchor member is the one whose direction has the largest cosine with `d` (one pass per fill). The functions take plain arrays and can pool several groups (sums added, the best member across them), which T-461 uses; export what pooling needs.
- **At the fill cadence, not per frame.** `PointsView` computes the sum and the anchor member when it makes an exact fill (whole or look-ahead, CPU or graphics-chip mode: the fills it already makes for the centroid and extent), keeps the member chosen on the earlier fill of the pair, and each frame places the label at that member's position blended between the two fills with the dots' own factor, mapped through the scale policy as the centroid is. New `labelAnchor(): RenderVector` on `PointsView` (as `PathView` has); before any fill and outside the group's bounds it holds what `absolute()` holds today. `PointsView` also exposes, for pooling, the current pair's sum and count, a number that changes when the pair changes, and the blended place of a given member.
- **Wired once.** `labelPositionOf` in `app/sceneTargets.ts` answers a drawn group with `labelAnchor()`. `focusAbsoluteOf`, `framedViewOf`, `absolute()` and `extentUnits` are unchanged, so the camera still focuses and frames the centroid. A story marker anchored on a group (it uses the same `positionFor`) moves with the name; say so in the CHANGELOG line.
- **Unit test**, new `packages/astraeus/tests/groupLabelPoint.test.ts` (TEST-01, ARCH-03, made-up orbits only), one table across: a full ring of circular orbits at 3 AU about a made-up centre (the label is within the ring's radial spread of 3 AU from the centre while the centroid is within 0.1 AU of it; successive fills keep the same place, the hold rule); a swarm spread 30 degrees about a direction (the label lies inside the swarm's angular spread, and after half its period it lies inside the swarm's new spread); several groups pooled (the label lies inside the union); a one-member group (the member). Each case runs through a real `PointsView` on both the graphics-chip policy and a non-linear policy (the two fill paths), using the setup patterns of `tests/pointsKepler.test.ts` in the new file.
- **Open for the owner (existing test setup).** `packages/astraeus/tests/sceneTargets.test.ts` line 19, the made-up group `{ id: "group", drawn: true, absolute: () => [1, 2, 3] }`, gains `labelAnchor: () => [1, 2, 3]`, because `labelPositionOf` now asks a group for `labelAnchor()`. No assertion changes (line 80 still expects `[1, 2, 3]`). Make this one edit only after the coordinator confirms the owner's OK; until then stop at this point and report. Every other existing test passes unedited; if any other turns red (a pinned label position anywhere, including a browser script's), stop and report it with its file and line.
- **CHANGELOG** (one bullet in the `## 0.12.0 (unreleased)` list): "Fixed: a point group's name now sits on its dots (the dot nearest the dots' mean direction from their centre, or on a ring where it crosses the vernal-equinox direction) and follows them, instead of at their centroid, where a ring round the Sun was named at the Sun. A story marker on a group moves with it. The camera still focuses on the centroid."
- **Size:** `npm run check:pack`; report the engine figure (expected +200 to +400 B gzip).
- Configured gates pass; evidence recorded under `docs/agents/verification.md`. Because `PointsView.ts` is on the browser policy's Shaders list, also run `npm run check:browser -- --step look-out --step orbit-lines` once before hand-off and record the result: `look-out` taps the "lantern-field" group name, and `orbit-lines` (`browser-smoke.mjs` `groupLabelChecks`) needs the made-up belt's "dust-belt" name shown at the opening view, then drags from it and taps it. If either fails because the name moved, stop and report; do not edit the scripts.

## Context Files

- `packages/astraeus/src/app/PointsView.ts`
- `packages/astraeus/src/app/sceneTargets.ts`
- `packages/astraeus/src/app/PathView.ts` (`labelAnchor` only, as the model)
- `packages/astraeus/tests/sceneTargets.test.ts`
- `packages/astraeus/tests/pointsKepler.test.ts` (setup at the top)
- `packages/astraeus/CHANGELOG.md` (top section only)
- `docs/agents/browser-policy.md` (Browser tiers, the Shaders list)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (point groups); G-027 Release.md finding 2 and Decision 4.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, CODE-01, CODE-02, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-02.

## Implementation Plan

1. Write the table test against the module and `PointsView`; see the ring's label at the centre today.
2. `groupLabelPoint.ts`: sums, direction with the hold rule, best member; pooling-ready.
3. `PointsView`: compute at each fill, keep the member for the pair, `labelAnchor()`; the pooling accessors.
4. `labelPositionOf` → `labelAnchor()`; the one owner-approved fixture line.
5. CHANGELOG, `check:pack`, `--step look-out --step orbit-lines`.

## Boundaries

No change to the camera's focus or framing, the label layout (`SceneLabels.ts`), picking, dots drawing or the shader; no per-frame pass over members; no host labels (T-460 to T-462).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/groupLabelPoint.test.ts packages/astraeus/tests/sceneTargets.test.ts packages/astraeus/tests/pointsKepler.test.ts packages/astraeus/tests/pointsLookAhead.test.ts packages/astraeus/tests/syntheticRing.test.ts packages/astraeus/tests/sceneFrame.test.ts`. Handoff: the configured gates, `npm run check:pack`, `npm run check:browser -- --step look-out --step orbit-lines`. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Expected for Design.md (Interfaces and Data Flow, point groups): a group's label place is its anchor dot, not its centroid; new module `app/groupLabelPoint.ts`. Reconciled before the Full Objective Check.
