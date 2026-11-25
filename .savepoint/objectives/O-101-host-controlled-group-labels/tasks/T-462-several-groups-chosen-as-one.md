---
id: T-462
title: Several groups chosen as one
objective: O-101
status: done
depends_on: [{task: T-461, requires: clear}]
check_waiver: {task: T-462, reason: 'Owner said "orchestrate the rest of the goal" (G-027, 2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g027-20261124}, recorded_at: '2026-11-24T10:13:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o101-20261124}
lane: draw
planned_reads: [packages/astraeus/src/app/sceneTargets.ts, packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/app/hostLabels.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/scenePicking.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/planLabels.ts, packages/astraeus/src/api/viewerSelection.ts, packages/astraeus/src/shell/experience.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/clickOpensInfo.test.ts, packages/astraeus/README.md]
planned_writes: [packages/astraeus/src/app/GroupSetTarget.ts, packages/astraeus/src/app/sceneTargets.ts, packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/app/hostLabels.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/scenePicking.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/planLabels.ts, packages/astraeus/src/api/viewerSelection.ts, packages/astraeus/tests/groupSetSelection.test.ts, packages/astraeus/README.md, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tests/publicBuild.test.ts]
---

# Several groups chosen as one

## Outcome

A label whose `selects.groups` names two or more groups is a selection of its own (G-027 Decision 2, "Host's own card"): a tap on it, or `handle.setSelected(<label id>)`, selects it like any object; the camera focuses and frames the groups' combined dots; the info card shows the label's text as its title with the host's `description`, `provenance` and `knownLimitations`. `handle.selected` and `onSelect` report the label's id on both embedding paths (API-02).

## User Check

None beyond the Objective's (the owner taps a swarm label in the made-up group-labels scene after the browser Task).

## Done When

- **One object per such label.** At build (`api/assembleScene.ts`, from the checked labels of `planLabels.ts`) each label with `selects.groups` of two or more ids becomes an unlisted object (`listed: false`) of the scene: id the label's id, `label` its text, its colour, and the card fields given. It is a camera target and selectable through the existing paths (`cameraTargets`, `setSelected`, the Object list showing it while selected, the info card); it is not in the camera menu. Its name on screen is the host label itself: the label layer holds one entry per id (no second label for the object).
- **Combined focus and framing.** New `packages/astraeus/src/app/GroupSetTarget.ts`, built from the groups' `PointsView`s: `drawn` when any of them is; `absolute()` the member-count-weighted mean of their centroids; `extentUnits(policy)` the largest of (distance from that mean to a group's centroid + that group's extent), so every group's dots are inside the framed sphere. `focusAbsoluteOf` and `framedViewOf` (`app/sceneTargets.ts`) answer its id from an optional `SceneTargets` field (absent: none), so existing fixtures stand. `sceneCamera.ts` changes only if its framed-view type must name the new class; say so in the evidence if it does.
- **Tap.** A shown several-group label is a label-only tap target whose pick is its own id (`onPickObject(<label id>)`), so the card opens on a wide screen and the camera flies to the groups on a phone, as for any object. A drag starting on it moves the camera and selects nothing.
- **Selection API.** `setSelected` (`api/viewerSelection.ts`) accepts the id because it is a camera target; its doc comment adds "or a label that selects several groups (`addLabels`)". `handle.selected` and `onSelect` (`cause` `host` or `visitor`) report the id. A view that hides every one of its groups hides the label and makes `setSelected(<label id>)` throw `bad-selection` (the existing rule for hidden objects).
- **Unit test**, new `packages/astraeus/tests/groupSetSelection.test.ts` (TEST-01, ARCH-03, API-02, made-up scenes only), one case list run against both embedding paths with the `describe.each([mount, react])` pattern of `tests/lifecycle.test.ts` (copied into the new file): `setSelected(<label id>)` → `selected` and one `onSelect` with `cause: "host"`; a tap on the label → `cause: "visitor"` and, at desktop width, the card with the label's title, description and provenance; the camera's focus at the weighted mean of the groups' centroids and every group's extent sphere inside the framed view; the Object list does not offer it until it is selected; a view hiding all its groups → label hidden and `bad-selection`; a drag from the label → camera moved, selection unchanged. Existing tests unchanged; if one turns red, stop and report.
- **README** (`## The handle: lifecycle, time and events`): one sentence where `setSelected` is described: "`setSelected` also takes the id of a label that selects several groups (`addLabels`): the camera frames their dots together and the card is the label's."
- **Size:** `npm run check:pack`. If T-461 raised the gzip cap, stay under 529,000 B gzip; over it, stop and report. If T-461 did not raise it and this Task's figure is over 527,000 B, make the change exactly as T-461's Done When describes (2,000 B, dated comment with the measured figures, `publicBuild.test.ts` line 168). Raw over 1,838,000 B: stop and report unless the owner has approved a raw raise by then (the coordinator says which).
- Configured gates pass; evidence recorded under `docs/agents/verification.md`. If `sceneCamera.ts` changed, run `npm run check:browser -- --step look-out --step views` once before hand-off (Camera paths) and record the result.

## Context Files

- `packages/astraeus/src/app/sceneTargets.ts`
- `packages/astraeus/src/app/sceneCamera.ts` (the `framedViewOf` use only)
- `packages/astraeus/src/app/hostLabels.ts`
- `packages/astraeus/src/app/PointsView.ts` (`absolute`, `extentUnits`, `drawn` only)
- `packages/astraeus/src/api/assembleScene.ts`
- `packages/astraeus/src/api/planLabels.ts`
- `packages/astraeus/src/api/viewerSelection.ts`
- `packages/astraeus/src/shell/experience.ts` (`ExperienceObject` only)
- `packages/astraeus/tests/lifecycle.test.ts` (the drivers at the top and `describe.each` only)
- `packages/astraeus/README.md` (`## The handle: lifecycle, time and events` only)

## Design References

`.savepoint/Design.md` under `One handle, one lifecycle` and `Viewer interface`; G-027 Release.md finding 2 and Decision 2.

## Guardrails

API-01, API-02, API-05, ARCH-02, ARCH-03, PROV-01, CODE-01, TEST-01, TEST-03, STYLE-01, STYLE-02.

## Implementation Plan

1. Write the dual-path case list; see `setSelected(<label id>)` throw today.
2. The unlisted objects at build; one label entry per id.
3. `GroupSetTarget` and the two target lookups.
4. Tap routing to the label's own id; doc comment and README sentence.
5. `check:pack` (and the cap rule); browser steps only if `sceneCamera.ts` changed.

## Boundaries

No new handle method or React prop (the existing selection carries it); no camera-menu items, story-panel `object` support or hit-testing of dots; no change to how one group is selected.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/groupSetSelection.test.ts packages/astraeus/tests/hostLabels.test.ts packages/astraeus/tests/hostLabelsTap.test.ts packages/astraeus/tests/sceneTargets.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/clickOpensInfo.test.ts`. Handoff: the configured gates, `npm run check:pack`. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Done When -> evidence (all in `packages/astraeus/tests/groupSetSelection.test.ts`, 12 cases, both paths via `describe.each([mount, AstraeusScene])` for the first five):

| Done When | Evidence |
|---|---|
| One object per such label (unlisted, card fields, no second label) | `assembleScene.ts` `severalGroupsObject`; case "the Object list does not offer it until it is selected" (listed: false; offered once selected); `SceneLabels` drops an object whose id is a host label id (`HostLabelSet.ids`), so one entry per id; metrics for it answer `[]` |
| Combined focus and framing | `GroupSetTarget.ts`; `hostLabels.groupSetOf`; `sceneTargets.ts` focusAbsoluteOf/framedViewOf; case "focuses the member-weighted mean ... frames every group's dots" (mean 7.5; radius 9.5 holds both groups), "is drawn while any group is, and a single-group label is no set" |
| Tap | case "a tap on it is a visitor selection and opens the label's own card" (title, description, provenance on the card, cause visitor); case "a drag from the label moves the camera and selects nothing" |
| Selection API | `viewerSelection.ts` doc comment; case "setSelected(<label id>) selects it and reports one host change"; case "a view hiding all its groups hides it, and selecting it is bad-selection" |
| Unit test | new file, runs on both paths |
| README | `## The handle` table row for `handle.selected` / `setSelected` carries the sentence |
| Size | `npm run check:pack`: 1,845,846 B raw / 529,441 B gzip, over T-461's caps (1,845,000 / 529,000); raised per owner approval (measured, rounded up to next 1,000 B) to 1,846,000 / 530,000 in `engine-budget.mjs` (dated comment) and `publicBuild.test.ts`; check:pack then passes |
| Gates | see below |

Deviation from plan: a view that hides every group of the label must hide the label, which the plan's files could not do. Added optional `ExperienceObject.partOfAll` (`shell/experience.ts`) and one rule in `hiddenByView` (`app/viewHiding.ts`): an object is hidden when every id in `partOfAll` is hidden. `sceneCamera.ts` unchanged (its `framed` type widens by itself; only `extentUnits` and `instanceof PathView` are used), so no browser steps. The tap needed no change to `scenePicking.ts`: the label's object is in `labelObjects`, so the existing object loop makes its shown name a label-only target with the label's id, and `routeLabelPick` passes an id with no group/panel tap through. `SceneTargets` has no new field: `HostLabelPlacer.groupSetOf(groupViews, id)` answers it (cached per group-view array), so `sceneFrame.ts` is untouched and existing fixtures stand.

Commands run: `npm run typecheck` (clean); eslint (typescript6 shim) on all changed .ts/.mjs files: clean; `npx prettier --check` on changed files plus README and CHANGELOG: clean; `npx vitest run` on groupSetSelection plus the 40 test files that mention viewHiding/hostLabels/sceneTargets/SceneLabels/assembleScene/viewerSelection/partOf (734 passed); `npx vitest run` lifecycle, clickOpensInfo, apiImports, packageBoundaries, sceneInputCopies, publicBuild (255 passed); `npm run check:pack` pass; `npm run api:lock` (lock file unchanged: public surface did not change).

Files changed: packages/astraeus/src/app/GroupSetTarget.ts (new), src/app/hostLabels.ts, src/app/sceneTargets.ts, src/app/SceneLabels.ts, src/app/viewHiding.ts, src/shell/experience.ts, src/api/assembleScene.ts, src/api/viewerSelection.ts, tests/groupSetSelection.test.ts (new), README.md, CHANGELOG.md; packages/astraeus-site/tools/validate/engine-budget.mjs, tests/publicBuild.test.ts.

Limitations: the camera case drives the real focus/framing lookups with made-up point-group views (the 3D scene is a stand-in); no browser run. A label whose groups are all out of their time bounds (not view-hidden) stays selectable.

## Drift Notes

Expected for Design.md (One handle, one lifecycle; Viewer interface): a several-group label is an unlisted selectable object framed by `GroupSetTarget`. Reconciled before the Full Objective Check. Also: `ExperienceObject.partOfAll` (hidden with its ids when a view hides all of them), and `HostLabelPlacer.groupSetOf` answering the camera lookups instead of a `SceneTargets` field.

Marked done by the coordinator under the owner's "orchestrate O-101" (2026-11-25) after the wave gate passed on 2026-11-25T07:57Z: `npm run typecheck`, `npm run lint`, `npm test` 358 files 5736 passed 2 skipped, `npm run build`, `npm run check:pack` 1,845,846 raw (limit 1,846,000) / 529,441 gzip (limit 530,000; second owner-approved raise), `npm run check:shelf-split` ok. Two files outside planned_writes (shell/experience.ts `partOfAll`, app/viewHiding.ts) accepted by the coordinator as needed for the view-hiding rule.
