---
id: I-178
title: README and CHANGELOG say every bad moment throws bad-time
type: defect
status: open
source:
  kind: check
  check: C-180
  actor: {role: checker, session: o073-check-20261115}
  at: '2026-11-15T04:40:50Z'
tasks: [T-315]
checks: [C-180]
guardrail_ids: [API-05, API-07]
severity: low
history:
  - at: '2026-11-15T04:40:50Z'
    actor: {role: checker, session: o073-check-20261115}
    kind: observed
    note: Found by the O-073 Full Objective Check probe of the README time rule against the public calls.
    check: C-180
  - at: '2026-11-15T04:50:00Z'
    actor: {role: owner, session: plan-g020-20261115}
    kind: owner_decision
    note: 'Owner chose "Keep their own names": panel at.time bad-panels, anchors bad-anchor, shownDuring bad-body/bad-trajectory stay; recorded in O-073 Success Conditions (owner instruction to record).'
  - at: '2026-11-15T04:50:00Z'
    actor: {role: executor, session: plan-g020-20261115}
    kind: repair_attempted
    note: README time rule (addTrajectory row) names the code per call; addStoryPanels row says at.time is whole-millisecond and throws bad-panels; CHANGELOG bad-time bullet narrowed and a Changed bullet lists the new panel/anchor/shownDuring refusals. tests/badTime.test.ts unchanged (pins the codes); npm test rerun below.
---

# I-178: README and CHANGELOG say every bad moment throws bad-time

## Summary

O-073 Success Condition "Fractional time (F-08, I-176)" says every public time input given a fractional or out-of-range value throws `SceneError` `bad-time`. T-315 kept each call's own code for four inputs: `shownDuring` (`bad-body` / `bad-trajectory`), path anchors (`bad-anchor`) and story panel `at.time` (`bad-panels`). The owner approved refusing a fractional panel time. Keeping the call codes was the coordinator's decision. No owner exception records it. The docs do not describe the shipped behaviour either.

## Evidence

- `packages/astraeus/README.md` line 86 (`addTrajectory` row): "Every moment the API takes (`stateOf`, `setTime`, timeline, event, panel, path and provider times) ... a fractional or out-of-range number throws a `SceneError` with code `bad-time`". In fact a panel time throws `bad-panels`, and a path anchor or `shownDuring` time throws `bad-anchor` / `bad-trajectory` (`src/core/storyPanels.ts` 126, `src/api/planPaths.ts` 157, `src/api/shownDuring.ts` 23-24; `tests/badTime.test.ts` per-call table).
- README line 98 (`addStoryPanels`) still says "`at.time` is any moment".
- `packages/astraeus/CHANGELOG.md` line 7 lists "panel" times among those that now throw `bad-time`. It also does not say that a fractional or out-of-range `at.time`, `shownDuring` or anchor time is now refused. All three were accepted at `main`, where `toUtcMs` and `atOf` checked only `Number.isFinite`. This is the one owner-approved behaviour change in an additions-only 0.9.2, so it must be listed.
- Reproduction: `new Scene().addBody(earth).addStoryPanels([{ id: "p", at: { time: T0 + 0.5 }, title: "T", body: "B", provenance }])` throws code `bad-panels`, where the README says `bad-time`.

## Proof Needed

- The owner either accepts the call-specific codes, as a recorded decision against the Success Condition, or asks for `bad-time` on all four.
- The README time rule, the README `addStoryPanels` row and the CHANGELOG then name the code each call throws. The CHANGELOG lists the new refusals of fractional and out-of-range panel, anchor and `shownDuring` times.
- `tests/badTime.test.ts` already pins the codes in code. What is missing is docs accuracy (API-07).
