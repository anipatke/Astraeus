---
id: T-035
title: Show a made-up window in the test experience and check nothing else broke
objective: O-010
status: done
depends_on: [{task: T-032, requires: clear}, {task: T-033, requires: clear}, {task: T-034, requires: clear}]
owner_validation:
    required: true
    accepted_check: C-014
    scope: [T-035/DW6]
    accepted_by: {role: owner, session: owner-chat-o010-look-20261011}
planned_by: {role: planner, session: o010-plan-2026-10-11}
planned_reads: [src/synthetic/syntheticDefinition.ts, src/app/metricReadouts.ts, src/core/timeWindow.ts, src/shell/metrics.ts, src/shell/experience.ts, tests/experiencePlugIn.test.ts, tests/experienceDefinition.test.ts, tools/validate/browser-synthetic.mjs, tools/validate/browser-shell.mjs, tools/validate/browser-spike03.mjs, tools/validate/browser-spike02.mjs, tools/validate/browser-anchor-labels.mjs, tools/validate/browser-synthetic-ring.mjs, .savepoint/Design.md]
planned_writes: [src/synthetic/syntheticDefinition.ts, tests/experiencePlugIn.test.ts, tests/experienceDefinition.test.ts, tools/validate/browser-synthetic.mjs, .savepoint/Design.md]
check_waiver:
    task: T-035
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-11T05:14:15Z"
---

# Show a made-up window in the test experience and check nothing else broke

## Outcome

The made-up experience (`?experience=synthetic`) shows a made-up window with a rising and falling rate, a peak, a rate readout and a visible change of provenance partway through, all through the generic contracts. Every existing experience and browser check still passes, Design is reconciled, and the owner has looked at it on phone and desktop sizes.

## Astraeus Hypothesis

- **Capability tested:** that windows, rates and time-ranged provenance reach the screen from configuration alone, for an experience with no meteor concept.
- **Contract reused:** `ExperienceDefinition`, `ExperienceConfig.windows`, `createMetrics`, T-032's `createWindows`/`rateAt`, T-033's `rate` metric, T-034's timeline and information panel.
- **Gap or hypothesis:** no generic code change is needed to mount a window experience; if one is, it is recorded as a finding (REPLAN REQUIRED if it breaks the brief's stop condition).
- **Generic change:** none expected. Only `src/synthetic/` configuration, tests, the browser script and Design.
- **Perseids-independent evidence:** this Task is the ARCH-03 evidence for O-010; no shower data.

## User Check

Open the made-up experience (`?experience=synthetic`) on a desktop-size window and a phone-size window. Find the shaded window on the timeline, its rate curve and peak marker. Use Previous/Next to step to where it opens, its peak and where it closes. Open its details either side of the midpoint and confirm the source wording changes. Select the made-up object and read its rate. Say whether it is clear and nothing looks broken; then open Apollo and confirm its timeline looks as before. Record your judgement.

## Done When

1. Made-up window: `syntheticDefinition.ts` declares one made-up window (for example a "contact window" with "passes per hour") inside the experience's timeline, with rate samples, a peak, and two provenance spans, both `illustrative`, whose accuracy and notes differ so the change is visible (PROV-01: nothing made-up is labelled measured). Its object's metrics include a `rate` metric computed with `rateAt` from the same window (STYLE-07), outside the window shown as unavailable. `synthetic-bare` keeps working.
2. Contract tests in `tests/experiencePlugIn.test.ts` show the made-up experience mounts its window through `ExperienceConfig.windows`, its rate metric equals `rateAt` at sampled times, and Apollo's config has no windows and unchanged events. The name check in `tests/experienceDefinition.test.ts` covers every new generic file from T-032 to T-034 (name each) and finds no meteor, shower or Perseids naming.
3. Browser: `browser-synthetic.mjs` gains assertions for the band, curve, peak marker, Previous/Next stops at open/peak/close, the "Inside" context line, the provenance change across the span boundary and the rate readout, at mobile and desktop widths. Every browser script (`browser-shell.mjs`, `browser-spike03.mjs`, `browser-spike02.mjs`, `browser-anchor-labels.mjs`, `browser-synthetic.mjs`, `browser-synthetic-ring.mjs`) passes with zero console errors in a fresh run directory; record each path, command, time and result. If the timeline change invalidated an older script, record the update and map each prior scenario to its new assertion. No historical evidence is overwritten.
4. Configured typecheck, build and test gates pass; record counts.
5. Design.md: the window contract, `ExperienceConfig.windows`, timeline presentation, merged navigation, time-ranged provenance in the information panel and the `rate` kind are described as implemented; each Drift Note from T-032, T-033 and T-034 is accounted for as reflected or explicitly non-architectural with a reason.
6. Owner visual judgement (User Check) is recorded after the evidence above exists.

## Context Files

`.savepoint/objectives/O-010-show-time-windows-and-rates-on-the-timeline/Objective.md`, `.savepoint/Design.md`, `src/synthetic/syntheticDefinition.ts`, `src/app/metricReadouts.ts`, `src/core/timeWindow.ts`, `src/shell/metrics.ts`, `src/shell/experience.ts`, `tests/experiencePlugIn.test.ts`, `tests/experienceDefinition.test.ts`, `tools/validate/browser-synthetic.mjs`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-spike03.mjs`, `tools/validate/browser-spike02.mjs`, `tools/validate/browser-anchor-labels.mjs`, `tools/validate/browser-synthetic-ring.mjs`, and the T-032, T-033 and T-034 Task files for their Drift Notes.

## Design References

Design: Experience plug-in boundary; Interfaces and Data Flow; Current Technical State.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-07, STYLE-09, STYLE-10.

## Implementation Plan

1. Confirm T-032 to T-034 landed with the shapes their evidence records; return REPLAN REQUIRED if a generic change is needed to mount the window.
2. Add the made-up window and rate metric to the made-up experience.
3. Write contract tests and extend the name check.
4. Extend `browser-synthetic.mjs`; run all browser scripts into a fresh run directory.
5. Run gates; reconcile Design.md and Drift Notes.
6. Ask the owner for the User Check and record it.

## Boundaries

No generic code change unless recorded as a finding; no Perseids or shower data or wording; no scene effects driven by the rate.

## Technical Verification

Focused tests during iteration; handoff runs the configured build and test gates plus every browser script (scene-affecting fuller gate). This Task produces the full-gate and browser evidence the Full Objective Check needs, evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor handoff, 2026-10-11 (ready for the owner's User Check; not a Check and not clearance).

**Per criterion**
1. Made-up window: met. `src/synthetic/syntheticDefinition.ts` declares "Contact window" (30–210 min), "passes per hour" samples peaking at 48 at minute 135, two `illustrative` provenance spans split at the peak with differing accuracy and notes, and a contact-rate metric from `rateAt` (null with "outside the contact window" outside it). `synthetic-bare` unchanged and its browser check still passes.
2. Contract tests: met. `tests/experiencePlugIn.test.ts` (new "the synthetic window" block: mounts through `ExperienceConfig.windows`, rate metric equals `rateAt` at nine sampled times, unavailable outside, source wording differs across the boundary and is never "measured", Apollo has no windows and the synthetic events are unchanged). `tests/experienceDefinition.test.ts` names ten generic files (timeWindow.ts, timelineModel.ts, TimelineBar.tsx, infoModel.ts, InfoPanel.tsx, MetricVisual.tsx, metrics.ts, experience.ts, AstraeusShell.tsx, style.css) and finds no meteor, shower or Perseids naming.
3. Browser: met. `tools/validate/browser-synthetic.mjs` now checks, at 1280×800 and 390×780: one band with width, rate curve, peak marker, no Inside line before the window, Next stops that include "opens", "peaks" and "closes", the Inside line with "48 passes per hour" at the peak, first-half and second-half source wording, nothing labelled measured, the Contact rate readout and its unavailable text outside the window. All six scripts pass with zero console errors in `docs/evidence/o010-t035-2026-10-11/` (run at 2026-10-11T05:04:29Z UTC, Chromium headless, `PLAYWRIGHT_CORE` as in project rules): `node tools/validate/browser-synthetic.mjs` (top of the folder), `browser-shell`, `browser-spike03`, `browser-spike02`, `browser-anchor-labels`, `browser-synthetic-ring` (a log per script). No older script was invalidated, so no scenario mapping was needed. The anchor-labels script writes to a fixed historical folder; it overwrote spike evidence, so I copied the new output to `anchor-labels-output/` and restored the originals with git. That script should take an output-directory setting (not changed here).
4. Gates: met. `npm run typecheck` clean; `npm run build` succeeds (existing large-chunk warning only); `npm test` 304 tests in 17 files pass.
5. Design.md: met. New "Time windows and rates (O-010)" section, plus the Current Technical State line; each T-032, T-033 and T-034 drift note accounted for as reflected or non-architectural with a reason.
6. Owner visual judgement: pending (User Check).

**Finding (generic change, recorded per Boundaries):** `.timeline-windows` in `src/shell/style.css` had `z-index: 0`, under the seek slider, so a mouse click on the band or peak hit the slider (Playwright reported the slider intercepting). Raised to `z-index: 2`, matching the event markers. Not a REPLAN case: one-line stacking fix, and the window mounted with no other generic change.

**Files read:** the Context Files, plus `src/shell/TimelineBar.tsx`, `src/shell/timelineModel.ts`, `src/shell/infoModel.ts`, `src/shell/InfoPanel.tsx`, `src/shell/ProvenanceBadge.tsx` and `src/shell/style.css` (extra reads, to write the browser assertions and diagnose the click failure). **Files changed:** `src/synthetic/syntheticDefinition.ts`, `tests/experiencePlugIn.test.ts`, `tests/experienceDefinition.test.ts`, `tools/validate/browser-synthetic.mjs`, `src/shell/style.css`, `.savepoint/Design.md`, this Task, new `docs/evidence/o010-t035-2026-10-11/`.

**Limitations:** headless screenshots exist (`synthetic-window-desktop.png`, `synthetic-window-mobile.png`) but I have not judged them visually; the owner look is pending. Browser scripts need the dev server on port 5199. No Code Health snapshot was run (Task, not Full Check).

### Owner visual judgement (2026-10-11T05:27:04Z)

Recorded on the owner's direct instruction after C-014 (CLEAR). The owner looked at the made-up window and accepted that it works, with this judgement: "Window works, but the presentation is confusing. The bar and the curve read as two separate things split by the slider, and the curve is too flat to read as a rate." The owner saw the band (below the slider), the curve (above it) and the peak marker, and could not tell at first what they meant. The presentation follow-up is I-019. What was seen: the desktop view of the made-up window (the owner did not say whether in the C-014 screenshot or the running app). The owner did not separately state judgements on the phone size, on stepping through opens/peaks/closes, on the source wording change, or on Apollo's timeline.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
