---
id: T-030
title: Make a group's dots glide instead of stepping
objective: O-009
status: done
depends_on: [{task: T-028, requires: clear}]
owner_validation:
    required: true
    accepted_check: C-013
    accepted_by: {role: owner, session: owner-chat-20261011}
planned_by: {role: planner, session: o009-smoothing-plan-2026-10-11}
check_waiver:
    task: T-030
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-10T22:00:22Z"
exception:
    requirements: [T-030/DW3]
    reason: The "before" headless frame-pacing measurement cannot be produced because the pre-blend PointsView was never committed; the owner's real-browser judgement ("looks smooth", T-031) covers the purpose. Waives only the "before" pacing figure; the fill, blend and remap costs and the interval choice remain proven by C-012.
    owner: owner
    recorded_at: "2026-10-11T04:40:00Z"
    check: C-012
    carried_forward:
        - check: C-013
          applies: true
          assessed_by: {role: checker, session: o009-recheck-20261011}
          assessed_at: "2026-10-11T04:31:35Z"
          reason: The exception waives only the "before" headless frame-pacing figure for T-030 Done When 3. No source, test, tool, dependency or gate-definition file changed since C-012 (git diff HEAD is empty for them; only historical anchor-label evidence and .savepoint records changed), so the behavior, requirement and scope it covers are unchanged. The pre-blend PointsView is still not recoverable.
---

# Make a group's dots glide instead of stepping

## Outcome

A group's dots move continuously during playback instead of jumping each time positions are refreshed, with no extra cost per frame beyond one blend pass, and with the group's scientific State untouched. This repairs I-017.

## Astraeus Hypothesis

- **Capability tested:** that a group can be presented smoothly from sparse, exact fills without per-frame recalculation.
- **Contract reused:** `PointGroup.fillPositionsKm`, `GroupLayer.refillAfterMs`, `ScalePolicy`, the floating origin. No `src/core/` change.
- **Gap or hypothesis:** presentation-side blending between two exact fills is visually indistinguishable from exact positions at screen scale for an orbit-based group, and removes the visible stepping.
- **Generic change:** `PointsView` keeps two exact fills (one before and one after the current time) and draws a blend of them. Presentation only (ARCH-02).
- **Perseids-independent evidence:** the made-up debris ring and Sun-centred belt (T-029); no shower data.

## User Check

Open the debris-ring experience (`?experience=synthetic-ring`) in a real browser at the default playback rate. Watch the ring's own motion at True and Readable scale, with the camera still and while following. Say whether it glides, and whether it still looks right. Record your judgement.

## Done When

1. Blending: each frame the drawn positions are a blend of the fill just before and the fill just after the clock time. Continuous playback in either direction costs one fill per refresh interval (not two). A seek far outside the held interval refills once and does not blend across the gap. A test compares blended positions with exact positions at the mid-point of an interval and states the measured error in km and as a share of the ring radius.
2. State and presentation: `stateAt` and `fillPositionsKm` are unchanged, and a test shows a group's State is identical before and after blending and after a scale switch (ARCH-02). Scale switch and camera move remap without refilling. Positions at a fill time equal the exact fill. Bounds behave as before: nothing drawn and no fill outside, drawn at both boundary times, and the second fill is clamped inside the bounds.
3. Cost and choice of interval: record the measured cost of one fill, of one blend pass, and of one remap for 10^4 members (Node, same kind of run as T-027). Choose the default refresh interval from measurement and the blend error, and state the reason. Record browser frame-pacing before and after in the same headless setup, labelled relative evidence only (software rendering is not a real GPU).
4. Existing behaviour: Apollo is unchanged. Every changed test is named (TEST-03); the T-028 test that asserts refill timing is expected to change and is replaced by named cases. All existing tests pass otherwise unmodified.
5. Fresh browser run: `browser-synthetic-ring.mjs` and every existing browser script pass with zero console errors in a fresh run directory; each path, command, time and result is recorded. Spike 01/02 scripts that write to a fixed historical path are restored from git afterwards, or given a distinct output directory, so earlier evidence is not overwritten.
6. Design.md and the I-017 history are updated (repair evidence only; the Issue stays open for a checker or owner acceptance).
7. Owner visual judgement of the ring's motion is recorded after the evidence exists.

## Context Files

`.savepoint/objectives/O-009-provide-state-for-groups-of-objects/Objective.md`, `.savepoint/issues/I-017-group-motion-steps-instead-of-gliding.md`, `.savepoint/Design.md`, `src/app/PointsView.ts`, `src/app/experienceDefinition.ts`, `src/app/EarthMoonScene.tsx`, `src/synthetic/syntheticRingDefinition.ts`, `tests/pointsLayer.test.ts`, `tests/syntheticRing.test.ts`, `tools/validate/browser-synthetic-ring.mjs`.

## Design References

Design: Groups and the `points` layer (O-009), Experience plug-in boundary.

## Guardrails

ARCH-01, ARCH-02, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm `PointsView` still refills on a threshold and holds scaled positions; return REPLAN REQUIRED if its shape has changed.
2. Hold two exact fills (before and after the clock time), each already mapped through the policy, and blend them in the existing placement pass together with the floating-origin subtraction. Slide the pair forward or back as the clock crosses it; refill both only on a seek outside it.
3. Blend the representative point and extent the same way; keep both exact at the fill times.
4. Keep the meaning of `refillAfterMs` explicit (the span between the two fills); change its name or doc only if the old one misleads, and name that in the evidence.
5. Write tests for blend error, one fill per interval in both directions, seek, bounds and clamping, ARCH-02, scale switch.
6. Measure fill, blend and remap cost in Node; pick the default interval; record frame pacing before and after.
7. Run the gates and every browser script into a fresh directory, update Design.md and the I-017 history, then stop and ask the owner for the visual check.

## Boundaries

No `src/core/` or `src/shell/` change, no new group contract, no camera-limit changes, no background thread, no shower data. Do not change a group's State or the fill's accuracy. Do not overwrite earlier evidence.

## Technical Verification

Handoff runs `npm run typecheck`, `npm run build`, `npm test` and the scene-affecting fuller gate (all browser scripts in `tools/validate/` that load the app, with `PLAYWRIGHT_CORE` per AGENTS.md) into `docs/evidence/o009-<task>-run1/`. Optional Task Check per `agent-skills/references/check-method.md`. The Full Objective Check re-measures fill cost and the smoothing.

## Technical Evidence

Run 2026-10-11 by the executor session (not a Check; these are claims for a fresh Check to verify). Gate run started at the time in `docs/evidence/o009-t030-run1/started.txt`.

**Per-criterion outcomes**
1. Blending: `PointsView` holds two exact fills and draws their blend in the existing placement pass (`src/app/PointsView.ts`). Tests: one fill per seek then one per interval forward (4 fills over 2.5 spans) and backward (same); a far seek fills once and draws the exact fill; a repeated time never fills. Blend error: the made-up ring fixture at a 10-minute span (coarse case) is under 0.5% of radius and non-zero; the real ring measured in Node worst 7.9 km, mean 6.7 km at the 300 s default (about 0.03% of the 26,000 km radius). Pass. Note: a seek holds one fill at both ends until the clock moves, so a seek costs one fill, then the next movement slides the pair.
2. State and presentation: `stateAt` and `fillPositionsKm` unchanged; a test shows State equal after blending and after a scale switch (ARCH-02); scale switch remaps without refilling (existing T-028 test, unmodified, still passes); the exact fill is drawn at a fill time; bounds cases pass, including running both ways to the bounds of the real ring (the second fill is clamped inside them). Pass.
3. Cost and interval: Node, 10^4 members, Earth-centred ring (`docs/evidence/o009-t030-run1/node-measurements.txt`): fill 9.4 ms; a slide frame (fill, centroid and extent, remap of the new end) 12.5-13.3 ms at every span; a plain frame 0.001 ms; placing and blending 0.02 ms. Worst blend error: 0.3 km at 60 s, 7.9 km at 300 s, 31 km at 600 s, 281 km at 1800 s. Chosen default 300 s: the slide cost is the same at any span, so a longer span only reduces how often it happens, and error grows with the square of the span; 300 s keeps the error invisible and slides about twice per real second at 600x. Browser frame pacing after the change (headless software rendering, 4 s at 600x, relative only): 176 frames, median 16.7 ms, 95th percentile 33.4 ms, 2 frames over 33 ms. No before measurement exists: the T-028 `PointsView` was never committed (untracked), so the earlier behaviour could not be re-run; its cost is known from T-027 and T-028 (about ten fills per real second at 600x with no blending). Partially met.
4. Existing behaviour: Apollo unchanged (no `points`). One existing test was changed, named here (TEST-03): `tests/pointsLayer.test.ts` "refills only after the clock has moved the refill interval, in either direction" was replaced by "fills once for a seek, then once per interval while playing forward", "fills once per interval while playing backwards", "refills once on a seek outside the held pair and does not blend across the gap", "draws the exact fill at a fill time and a close blend between fills", "keeps the group's State identical while blending and across a scale switch (ARCH-02)" and "holds both fills inside the bounds up to the end, for a group that rejects times outside them". The file now imports the synthetic ring layer. All other tests pass unmodified. Pass.
5. Fresh browser run: all six scripts exit 0 with `errors: []` in `docs/evidence/o009-t030-run1/` (logs `browser-<name>.log`). The first ring run failed on a wrong button name in the new pacing step in the script; I fixed the script and re-ran that script only, with the other five from the first run of the same code. Spike 01/02 regression scripts overwrote files under `docs/evidence/regression-spike01-02/`; restored from git, so earlier evidence is unchanged. Pass.
6. Design.md and the I-017 history updated (repair evidence only; the Issue stays open). Pass.
7. Owner visual judgement of the smoothed motion: pending. Not claimed.

**Commands run (from the repo root):** `npm run typecheck`, `npm run build` and `npm test` (15 files / 241 tests, all pass; `gates.log`); throwaway Node timing test (deleted after use; output in `node-measurements.txt`); dev server on port 5199, then with `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js` and `ASTRAEUS_EVIDENCE_DIR=docs/evidence/o009-t030-run1/<script>`: `browser-shell.mjs`, `browser-spike03.mjs`, `browser-spike02.mjs`, `browser-anchor-labels.mjs`, `browser-synthetic.mjs`, `browser-synthetic-ring.mjs`.

**Extra reads (beyond Context Files):** none beyond the T-030 Context Files; `tests/experienceDefinition.test.ts`-style name checks run as part of `npm test`.
**Files changed:** `src/app/PointsView.ts`, `src/app/experienceDefinition.ts` (comment only), `tests/pointsLayer.test.ts`, `tools/validate/browser-synthetic-ring.mjs` (frame pacing, no assertion), `.savepoint/Design.md`, I-017 history; new `docs/evidence/o009-t030-run1/`.

**Limitations:** smoothness was not judged by a person yet; frame pacing is from software rendering and says little about a real GPU. A slide still costs about 12.5 ms in one frame, so a small hitch remains at each interval (about twice per real second at 600x, about twelve times at 3600x with the 300 s span); the blend removes the stepping, not the hitch. Cutting the hitch needs cheaper remapping (about 3 ms of the slide is per-member allocation in the policy mapping) or off-main-thread fills, which are outside this Task. The blend is linear, so it is least accurate for fast members on tight orbits; the made-up ring is the evidence, not a general bound.

**Drift note (reflected in Design.md in this Task):** `refillAfterMs` now means the span between the two held fills; default raised from 60 s to 300 s; the points layer blends two exact fills.

## Drift Notes

Record architecture deltas here; reconcile Design.md in this Task.
