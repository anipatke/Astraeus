---
id: T-036
title: Make a time window on the timeline read as one thing
objective: O-011
status: planned
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o011-plan-2026-10-11}
lane: timeline-window
planned_reads: [src/shell/TimelineBar.tsx, src/shell/timelineModel.ts, src/shell/style.css, src/shell/infoModel.ts, src/synthetic/syntheticDefinition.ts, tests/timeline.test.ts, tools/validate/browser-synthetic.mjs, tools/validate/browser-shell.mjs, tools/validate/browser-spike03.mjs]
planned_writes: [src/shell/TimelineBar.tsx, src/shell/timelineModel.ts, src/shell/style.css, tests/timeline.test.ts, tools/validate/browser-synthetic.mjs]
---

# Make a time window on the timeline read as one thing

## Outcome

A time window on the timeline bar reads as one linked shape. The band, the rate curve and the peak sit together, not split by the seek slider, and the rate visibly rises and falls at desktop width. Repairs I-019 on the made-up "Contact window" before Perseids uses the same presentation.

## Astraeus Hypothesis

- **Capability tested:** that the shell's generic window presentation explains a window to a viewer without experience-specific help.
- **Contract reused:** `TimelineWindow`, `rateAt`, `ExperienceConfig.windows`, `timelineModel` positions and curve path, the existing window info target.
- **Gap or hypothesis:** I-019. The band and curve read as two unrelated lines on either side of the slider, and the curve is too flat at desktop width. C-014 observations 3–5 (a band click seeks to the start, small touch targets, the flat desktop curve) are weighed in the same repair.
- **Generic change:** shell presentation only (layout, curve scaling, linking, touch targets). The window contract, `rateAt` and navigation stay unchanged.
- **Perseids-independent evidence:** the made-up contact window in `?experience=synthetic`, plus timeline-model tests; no shower data.

## User Check

Open `?experience=synthetic` at desktop and phone sizes. Without being told, say when the window runs, where it peaks and that the curve is its rate. Then open Apollo and confirm its timeline looks as before.

## Done When

1. The band, curve and peak are drawn as one linked shape, either on the same side of the slider or visibly joined, and the rate curve uses enough height to show the rise and fall at desktop width. `timelineModel` tests cover any changed curve scaling or geometry.
2. Window targets meet a reasonable touch size on phone width. A click or tap on a window does a clearly stated thing (opens its details or seeks), and the browser script asserts it.
3. Apollo (no windows) renders the timeline as before. Name the browser assertions or screenshots that show this.
4. `browser-synthetic.mjs` is updated per the browser-regression rule, with each prior window scenario mapped to its new assertion. It and every other browser script pass with zero console errors in a fresh run directory (`docs/evidence/o011-<task>-<date>/`).
5. Configured typecheck, build and test gates pass; record counts.
6. Owner visual judgement at desktop and phone sizes is recorded against I-019's Proof Needed. I-019 itself is closed only by a Check or by the owner.

## Context Files

`.savepoint/objectives/O-011-run-perseids-and-a-second-shower-as-fixtures/Objective.md`, `.savepoint/issues/I-019-time-window-on-the-timeline-is-hard-to-read.md`, `src/shell/TimelineBar.tsx`, `src/shell/timelineModel.ts`, `src/shell/style.css`, `src/shell/infoModel.ts`, `src/synthetic/syntheticDefinition.ts`, `tests/timeline.test.ts`, `tools/validate/browser-synthetic.mjs`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-spike03.mjs`.

## Design References

Design: Time windows and rates (O-010); Interfaces and Data Flow.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-09, STYLE-10.

## Implementation Plan

1. Look at the C-014 screenshots named in I-019 and the current `.timeline-window*` layout.
2. Choose one linked layout, for example the curve drawn as an area that rises out of the band on one side of the slider, with the peak on the curve. State the choice and why in Technical Evidence.
3. Scale the curve to the window's own peak, so the rise and fall show at every width.
4. Enlarge touch targets and settle the click behaviour.
5. Update the timeline-model tests and `browser-synthetic.mjs`; run all browser scripts into a fresh directory.
6. Ask the owner to look; record the judgement.

## Boundaries

No change to `TimelineWindow`, `createWindows`, `rateAt`, `provenanceAt` or navigation stops. No shower data. No scene, camera or State change.

## Technical Verification

Focused `tests/timeline.test.ts` during iteration. Handoff runs the configured gates and every browser script (scene-affecting fuller gate in AGENTS.md project rules). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; T-040 reconciles them into Design.
