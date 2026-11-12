---
id: O-069
title: Playback never skips a slow-down
status: planned
depends_on: []
release: G-019
priority: high
rank: 1
---

# O-069: Playback never skips a slow-down

## Outcome

Paced playback advances the clock by integrating the paced rate over each frame's real time, so at any cruise speed and frame rate the clock eases into every slow-down zone and its ramp, is reported entering it (`onEventZone`, cause `playback`), and slows as the pacing says. Where two pacing pieces' ramps or zones meet, the speed is the slower of the two, as the README already states.

## Why

G-019, Closest Calls F-09 and F-15. Today `applyPacing` (`src/core/pacing.ts`) reads the paced rate once per frame at the clock's current time and `SimulationClock` applies it to the whole elapsed real time, so one cruise frame (about 10.5 simulated hours at 26 days per second and 60 fps) can step over a slow stretch 11 h wide: no slow motion, no zone report. The app had to step back with its own guard, losing the ease-in. `pacedRate` blends each zone's weight in turn, so where two ramps meet the result is slower than both, against the README's "the slowest speed wins".

## Success Conditions

- A paced clock, advanced in real-time frames of any length (16 ms to a 1 s hitch), never passes over a zone or its ramp: a node test at the Closest Calls shape (six-year span, cruise about 26 d/s, ten zones of CA ± 1.5 h at 1,200× with 4 h ramps, frame steps from 16 ms to 1,000 ms real) enters every zone, spends a frame-rate-independent simulated time within tolerance in each, and reports every entry and exit with cause `playback`.
- Seeking, looping, the end stop, a host `setRate`/`setTime`, the visitor's speed choice ("Auto" versus a chosen speed) and a view switch's pace ease behave as today (existing tests unchanged and passing).
- Where pieces overlap or their ramps meet, the paced speed is the minimum of the speeds each piece alone would give, at every time (node test, including the F-15 example: two pieces alone 1,659× and 8,477× give 1,659×, not 1,305×); the README sentence stays true and gains the ramp case.
- No public API change; the CHANGELOG names both fixes; Design reconciled before the Full Objective Check.

## Decisions (owner, 2026-11-12, session closest-calls-review-20261112)

- "Fix the engine to match the guide": overlapping ramps take the slower speed.
- 0.9.1, additions only: behaviour fixes only, no new or changed public input.

## Architectural Considerations

The paced rate stays a pure function of time and the shown events (`pacedRate`); the new step is a pure function in `src/core/pacing.ts` (core imports nothing from app or shell, ARCH-04) that, given the clock's time, the real elapsed milliseconds and the pacing, returns the new time, sub-stepping so no sub-step crosses a zone or ramp edge at the wrong speed. The clock gains no knowledge of pacing; the frame stage that applies pacing (`src/app/sceneFrame.ts`, CODE-02) moves the clock by the integrated amount. Zone reports already come from the clock time per frame, so they follow once the clock no longer jumps zones. Generic: proven with synthetic pacing (ARCH-03), no story names.

## Boundaries

**In scope:** paced clock advance, the overlap rule, their tests, README and CHANGELOG wording.

**Out of scope:** new pacing options (for example separate ease-in and ease-out ramps, F-15's other ask); unpaced playback; timeline zoom; any public API change.
