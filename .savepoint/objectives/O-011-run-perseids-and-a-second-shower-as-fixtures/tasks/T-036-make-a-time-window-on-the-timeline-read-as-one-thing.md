---
id: T-036
title: Make a time window on the timeline read as one thing
objective: O-011
status: done
depends_on: []
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: o011-plan-2026-10-11}
lane: timeline-window
planned_reads: [src/shell/TimelineBar.tsx, src/shell/timelineModel.ts, src/shell/style.css, src/shell/infoModel.ts, src/synthetic/syntheticDefinition.ts, tests/timeline.test.ts, tools/validate/browser-synthetic.mjs, tools/validate/browser-shell.mjs, tools/validate/browser-spike03.mjs]
planned_writes: [src/shell/TimelineBar.tsx, src/shell/timelineModel.ts, src/shell/style.css, tests/timeline.test.ts, tools/validate/browser-synthetic.mjs]
check_waiver:
    task: T-036
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-11T07:33:31Z"
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

### Choice (plan step 2)
Window strip above the slider, as one block: a faint tinted rectangle for the window, the rate curve filled as an area rising out of its bottom baseline, the peak diamond on the curve, and the window's name inside. Everything sits on the same side of the slider (strip bottom is above the slider top), curve scaled to the window's own peak, 44 px strip on desktop and 56 px on phone (was an 11 px-offset 22 px track). A click on the band seeks to the clicked point and opens the window details (title says so); the peak button seeks to the peak. Info-panel reserved space is raised only when a window strip exists (`:has(.timeline-windows)`), so Apollo is unchanged.

### Files
Read: the Context Files (Objective, I-019, TimelineBar.tsx, timelineModel.ts, style.css, tests/timeline.test.ts, tools/validate/browser-synthetic.mjs). Not read: infoModel.ts, syntheticDefinition.ts, browser-shell.mjs and browser-spike03.mjs were only run, not opened. Extra reads: none.
Changed: src/shell/TimelineBar.tsx, src/shell/timelineModel.ts (new `windowAreaPath`, `windowPeakHeightPercent`, `windowTimeAtFraction`; `windowCurvePath`, `rateAt`, contract unchanged), src/shell/style.css, tests/timeline.test.ts, tools/validate/browser-synthetic.mjs.

### Per-criterion outcome
1. Met: browser-synthetic asserts strip above slider, curve inside strip, peak inside band, curve height >= 30 px (desktop and mobile); screenshots `docs/evidence/o011-t036-2026-10-11-final/synthetic/synthetic-window-{desktop,mobile}.png`. Unit tests for area path, peak height, click time.
2. Met: asserts band height and peak width >= 28 px desktop, >= 44 px phone; band click at 25% seeks to ~25% along the window (not the start) and opens details.
3. Met: browser-synthetic asserts on the default Apollo page: no `.timeline-windows`, no `.timeline-window`, scrubber height < 50 px. browser-shell and browser-spike03 (Apollo) pass with zero errors.
4. Met with a note below. Prior scenario mapping in browser-synthetic: band exists -> kept; "one curve path" -> `.timeline-window-line` count 1 plus `.timeline-window-area` count 1; peak marker -> kept; stops, Inside line, source wording, rate readout, outside-window text -> unchanged assertions (all still pass). New: linked geometry, touch size, click behaviour, Apollo no strip.
5. Met: typecheck clean; tests 17 files, 307 passed (was 303 + 4 new); build succeeds (existing chunk-size warning only).
6. Pending the owner's visual judgement (desktop and phone) against I-019 Proof Needed; I-019 stays open.

### Commands (final run 2026-10-11)
`npm run typecheck`; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`; `npm run build`; `npx vite --port 5199`; with `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js` and `ASTRAEUS_EVIDENCE_DIR=docs/evidence/o011-t036-2026-10-11-final/<script>`: `node tools/validate/browser-{synthetic,synthetic-ring,shell,spike02,spike03}.mjs`, all `errors: []`. An earlier pass is in `docs/evidence/o011-t036-2026-10-11/` (before the panel-space fix and a browser-script reorder).

### Limitations
- `browser-anchor-labels.mjs` has a fixed output folder (`docs/evidence/regression-spike01-02/anchor-labels/`); running it overwrote that historical evidence, which I restored with git checkout. It passed with zero errors, but no fresh evidence folder exists for it. Not run again; owner decision needed on whether it should take an output directory.
- On phone, the open info panel now ends just above the transport buttons; judged by screenshot only.
- Owner visual judgement not yet recorded. Headless Chromium only.


## Drift Notes

Record architecture deltas here; T-040 reconciles them into Design.
