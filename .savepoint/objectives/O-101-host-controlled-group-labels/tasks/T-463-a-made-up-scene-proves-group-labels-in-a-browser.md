---
id: T-463
title: A made-up scene proves group labels in a browser
objective: O-101
status: planned
depends_on: [{task: T-458, requires: clear}, {task: T-462, requires: clear}]
check_waiver: {task: T-463, reason: 'Owner said "orchestrate the rest of the goal" (G-027, 2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g027-20261124}, recorded_at: '2026-11-24T10:13:49Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-o101-20261124}
lane: browser
planned_reads: [packages/astraeus-site/src/synthetic/syntheticBeltScene.ts, packages/astraeus-site/src/synthetic/madeUpOrbits.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/tools/validate/journey-two-viewers.mjs, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, tools/gate-limits.json, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, packages/astraeus/README.md]
planned_writes: [packages/astraeus-site/src/synthetic/syntheticGroupLabelsScene.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/tools/validate/public-build-assets.mjs, packages/astraeus-site/tools/validate/journey-group-labels.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/driver.mjs, tools/gate-limits.json, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, packages/astraeus/README.md]
---

# A made-up scene proves group labels in a browser

## Outcome

A made-up scene, `?experience=synthetic-group-labels`, draws two swarms as four brightness groups each (the belt's Trojans, invented), every group with `showLabel: false`, and two host labels anchored on and selecting each swarm's four groups with the host's card; plus one ring group showing its own name on its dots and one text-only label on a fixed point. A new full-tier browser step, `group-labels`, proves at 1440x900 and 390x844 that the two labels sit on their swarms, a tap opens the card on the wide screen and selects on the phone, and a drag from a label moves the camera. The owner judges the look on the preview.

## User Check

Start `npm run preview:owner`, then on `localhost:5490/?experience=synthetic-group-labels`, at a desktop window and in the browser's phone view (390x844):

1. Two swarm names show, each on its swarm's dots; none of the eight brightness groups shows a name of its own. The ring's name sits on the ring; the fixed-point label sits where it should and does nothing when tapped.
2. Press play at a high rate: each swarm name rides with its swarm round the Sun.
3. Desktop: tap a swarm name. Its card opens with the label as title and the scene's description and source; the camera frames all four of its groups. Phone: the same tap selects it and the camera flies there, with no card.
4. Drag starting on a swarm name: the view turns and nothing is selected.
5. Turn Labels off and on in the switch panel: the swarm, ring and fixed-point names go and come back; the eight groups' names never appear.

Say whether the names read well where they sit, and whether a label's colour or size needs a setting.

## Done When

- **Scene** (new `packages/astraeus-site/src/synthetic/syntheticGroupLabelsScene.ts`, public Scene API only, ARCH-01: invented names and orbits, illustrative provenance): the Sun; a made-up planet at about 5 AU (`madeUpOrbitRecord`); eight groups of made-up orbits sharing the planet's orbit, four clustered about 60 degrees ahead of it and four about 60 degrees behind (measured `meanAnomalyDeg` per orbit, spread of a few degrees), each group one shade of one colour and `showLabel: false`; one ring group of circular orbits at about 3 AU with its own name; `addLabels` with "Swarm ahead (made up)" and "Swarm behind (made up)" anchored on and selecting their four groups, each with a `description` and illustrative `provenance`, and one text-only fixed-point label. Registered in `src/main.tsx` (`SYNTHETIC` and the comment) and in `SYNTHETIC_KEYS` of `tools/validate/public-build-assets.mjs` (the public build leaves it out; `tests/publicBuild.test.ts` line 132 compares the two lists and needs no edit). Not added to the smoke step's views (no smoke cost).
- **Step** `group-labels`, tier full, new script `packages/astraeus-site/tools/validate/journey-group-labels.mjs` modelled on `journey-two-viewers.mjs`, touching the interface only through `driver.mjs` (driver guard). At 1440x900 (mouse) and 390x844 (touch), paused at the opening time:
  - both swarm labels are in `shownSceneLabelIds`, and none of the eight groups' ids is;
  - each swarm label's centre (`labelCentre`) lies inside the screen box of its four groups' in-view dots (`scenePointGroup` `minX`..`maxY`, unioned, as shares of the view) grown by 24 px;
  - a drag from a swarm label (`dragFromLabel`) moves another shown label more than 5 px and leaves the selection and the card unchanged (as `groupLabelChecks` in `browser-smoke.mjs` reads it);
  - a tap (`tapLabel`) → `waitForPicked(<label id>)`; wide: the card opens and `infoTargetId` is the label id; phone: no card.
  A new driver function is allowed only if no existing one reads what is needed; adding one changes no existing function, so no other step reruns.
- **Wiring and limits:** `browser-steps.mjs` gains the step after `two-viewers` with a `scene` line; `tools/gate-limits.json` `browser.steps["group-labels"]: 15` (`gateLimits.test.ts` keeps the two together; the 450 s total stands); `docs/BROWSER_CHECKS.md` gains the step's row; `docs/agents/browser-policy.md`'s full-tier step list gains `group-labels` with its own paths: `packages/astraeus/src/app/SceneLabels.ts`, `hostLabels.ts`, `groupLabelPoint.ts`, `GroupSetTarget.ts`, `packages/astraeus/src/api/labelInput.ts`, `planLabels.ts`, the new scene and the new script.
- **Run it:** `npm run check:browser -- --step group-labels`; record seconds (expected 8 to 12 s), the evidence folder and its `results.json`. Record the projected full-tier total (430 s measured on 2026-11-24 plus this step) against the 450 s limit; if the projection is above 450 s, report it, do not raise the limit.
- Configured gates pass (`gateLimits.test.ts`, `publicBuild.test.ts`, `browserDriverGuard.test.ts` among them); `npm run check:public-build` passes (the scene is not in the public build). Evidence recorded under `docs/agents/verification.md`.
- **Owner look** (User Check above) recorded after the step passes.

## Context Files

- `packages/astraeus-site/src/synthetic/syntheticBeltScene.ts` (`startSunScene` only) and `madeUpOrbits.ts`
- `packages/astraeus-site/src/main.tsx` (the `SYNTHETIC` table and its comment)
- `packages/astraeus-site/tools/validate/journey-two-viewers.mjs`
- `packages/astraeus-site/tools/validate/browser-smoke.mjs` (`groupLabelChecks` only)
- `packages/astraeus-site/tools/validate/browser-steps.mjs`
- `packages/astraeus-site/tools/validate/driver.mjs` (the label, pick, info and point-group readouts only)
- `packages/astraeus-site/tools/validate/public-build-assets.mjs` (`SYNTHETIC_KEYS` only)
- `tools/gate-limits.json`
- `docs/BROWSER_CHECKS.md` (`## What each class of step protects`, the step table)
- `docs/agents/browser-policy.md` (Browser tiers)
- `packages/astraeus/README.md` (`### Sky, camera, looks and views`, the `addLabels` row, for the input shape)

## Design References

`.savepoint/Design.md` under `Verification in tiers (O-086)`; G-027 Release.md (brief's browser check).

## Guardrails

ARCH-01, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-01.

## Implementation Plan

1. The scene; look at it on the dev server.
2. The journey script and the step wiring; run it alone.
3. Limits, docs and policy rows; gates; the owner's look.

## Boundaries

No engine change (a fault found here goes back to the Task that owns it, through the coordinator); no edit to any existing browser script or existing step's assertions; no new smoke view; no screenshots.

## Technical Verification

`npm run check:browser -- --step group-labels`; focused `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts packages/astraeus-site/tests/publicBuild.test.ts packages/astraeus-site/tests/browserDriverGuard.test.ts`; the configured gates and `npm run check:public-build`. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Expected for Design.md (Verification in tiers): the `group-labels` step. Reconciled before the Full Objective Check.
