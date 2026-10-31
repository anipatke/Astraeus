---
id: T-208
objective: O-048
title: Keep labels steady at fast playback
status: done
depends_on: [{task: T-207, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-208, reason: 'Owner said "orchestrate O48"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o048-run-20261031}, recorded_at: '2026-10-31T08:50:52Z'}
planned_by: {role: planner, session: probe-feedback-2-20261031}
---

# Keep labels steady at fast playback

## Outcome

A label that wins an overlap keeps it until it is clearly beaten, by a stated screen margin or hold time, so overlapping labels do not swap from frame to frame at fast playback (I-121); the selected object's label still always wins (I-108).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Reproduce first with two made-up labels crossing at a fast rate; record the flicker (visibility changes per frame).
- `src/app/SceneLabels.ts` keeps which label won each overlap and needs a stated margin (pixels) or hold (ms) to change; the rule and numbers are in one place, documented.
- Tests: crossing labels change winner at most once per crossing; the selected label still wins at once; labels off still hides all.
- CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/app/SceneLabels.ts`, `packages/astraeus/tests/publicApiPathLabels.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Reproduce.
3. Add the hysteresis; tests; docs.

## Boundaries

No change to label priorities or reach.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

- Reproduced first: `packages/astraeus/tests/sceneLabelsHysteresis.test.ts` sweeps made-up label B across a higher-priority A in 400 frames with 1.5 px jitter; with the margin set to 0 B's visibility changed 3 times (expected at most 2) - the flicker.
- Rule (`packages/astraeus/src/app/SceneLabels.ts`, one place, documented): a label the previous layout hid by overlap needs `LABEL_REAPPEAR_MARGIN_PX` = 14 px more clearance than `LABEL_PADDING_PX` = 6 px to show again; a shown label keeps its place at the plain padding. 14 px is about a label's own text height plus gap, above the 1-3 px per-frame jitter at fast playback. Applies to every label; labels not candidates (unplaced, out of reach, switched off) are forgotten, so first layout is unchanged. No settings pattern exists for label layout, so constants are exported, not settings.
- Tests (all pass): crossing changes B at most twice per crossing despite jitter; selected label (even lower priority) is shown every frame and wins over higher priority; labels switched off hide all. Existing `publicApiPathLabels.test.ts` unchanged and passing.
- Gates: `npm run lint`, `npm run typecheck`, `npm run build` pass; `npm test` 159 files, 2006 passed, 1 skipped (run after last change).
- CHANGELOG `Unreleased` line added in `packages/astraeus/CHANGELOG.md`.
- Files changed: SceneLabels.ts, new sceneLabelsHysteresis.test.ts, CHANGELOG.md, this Task. No pack file-count change (test is not packed).
- Limitations: no browser run (by instruction); slot choice (right/left/above) is not made sticky, only visibility; margin chosen by reasoning not tuned on screen.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- Label layout (SceneLabelLayer) now keeps one bit of memory per label (shown or hidden by overlap at the last update) with a pixel re-appear margin; reflect in Design.md under Interfaces and Data Flow in the last step. Layout only, no State (ARCH-02).
