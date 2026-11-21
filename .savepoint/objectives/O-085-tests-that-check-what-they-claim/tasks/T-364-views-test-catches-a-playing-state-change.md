---
id: T-364
title: Views test catches a playing-state change
objective: O-085
status: done
depends_on: []
check_waiver: {task: T-364, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:50:31Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: views
planned_reads: [packages/astraeus/src/shell/TimelineBar.tsx, packages/astraeus/src/app/App.tsx]
planned_writes: [packages/astraeus/tests/viewsDom.test.ts]
---

# Views test catches a playing-state change

## Outcome

"keeps time, speed and playing state across a switch" really checks the playing state: it finds the play button by what the page renders, so a view switch that pauses or starts playback fails it (AH-34: Gemini F-07 and Probe C).

## User Check

None visual. With a temporary `runtime.clock.pause()` added to `chooseView` in `App.tsx`, the case fails on the playing state; without it, it passes.

## Done When

- In `packages/astraeus/tests/viewsDom.test.ts`, case "keeps time, speed and playing state across a switch" (~105–115) is the subject. Exactly these lines change:
  - ~110 and ~114: the query `'[aria-label="Play"], [aria-label="Pause"]'` (matches nothing; the button's label is "Play playback" / "Pause playback", `src/shell/TimelineBar.tsx:223`) becomes a query on the button itself (`.timeline-play`), reading its `aria-label`.
  - New assertion before the switch: the label read is defined and matches `/^(Play|Pause) playback$/`, so `undefined === undefined` can never pass again.
  - The case runs for both starting states, playing and paused (a `it.each` over the two, or two cases with the same body). For the playing row the test presses the play button once after `open()` and asserts the label is "Pause playback" before switching. The paused row uses `open()` as it is. A break that forces either state is then caught.
  - The `clockText` comparison (~113) stays. If the playing row moves the clock readout between the two reads (real time passes while playing), the builder may compare `clockText` only in the paused row and record why; the playing-state assertion stays in both.
- Deliberate break, recorded in Technical Evidence and reverted: add `runtime.clock.pause()` (or the clock's equivalent) at the top of `chooseView` (`src/app/App.tsx:431`); the playing row fails on the label. Add a resume instead; the paused row fails. Show `git diff src/app/App.tsx` empty afterwards.
- The case's setup (`definitionAt`, `open`, `choose`) and every other case in the file are unchanged.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/viewsDom.test.ts` (helpers lines ~20–55; the case ~105–115)
- `packages/astraeus/src/shell/TimelineBar.tsx` (the play button, line ~223; read only)
- `packages/astraeus/src/app/App.tsx` (`chooseView`, ~431–441; temporary break only)

## Design References

`.savepoint/Design.md` under `Views of one scene`.

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-10.

## Implementation Plan

1. Show the current case passing with the break in place (the false green), then fix the query and add the label assertion.
2. Add the two starting states.
3. Run the break both ways; revert.

## Boundaries

Only this case changes. No change to `App.tsx` or `TimelineBar.tsx` (the break is temporary). Moving browser view checks into Vitest is O-086.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/viewsDom.test.ts`, with and without the break. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Files changed: `packages/astraeus/tests/viewsDom.test.ts` only (the one case; `App.tsx` and `TimelineBar.tsx` untouched, `git diff packages/astraeus/src/app/App.tsx` empty after every break).

| Done When | Evidence |
|---|---|
| Query is the button itself, reading its aria-label | `container.querySelector(".timeline-play")?.getAttribute("aria-label")` in `playLabel()` |
| Label defined and matches `/^(Play\|Pause) playback$/` before the switch | `expect(playing).toMatch(...)` plus an exact check of "Pause playback" (playing row) / "Play playback" (paused row) |
| Both starting states | `it.each([["playing", true], ["paused", false]])`. The viewer opens already playing, so the playing row uses `open()` as is and the paused row presses `.timeline-play` once (the plan had these the other way round; confirmed by running) |
| clockText kept | Compared in the paused row only: while playing, real time moves the readout between the reads (seen: 00:00:02.457Z vs 02.852Z under a play break). The label assertion runs in both rows |
| Deliberate break shown failing, reverted | see below |
| Setup and other cases unchanged | only the one `it` was replaced by the `it.each` |

Deliberate breaks (inserted at the top of `chooseView`, reverted from a saved copy):
- A bare `runtime.clock.pause()` does NOT fail either the old or new test: the label reads the `clockSnapshot` state, which the stubbed scene never refreshes. A pause that refreshes the snapshot (as the real pause path does), `runtime.clock.pause(); setClockSnapshot(runtime.clock.snapshot());`: playing row FAILS (`Expected: "Pause playback"  Received: "Play playback"`), 1 failed / 8 passed.
- `runtime.clock.play(); setClockSnapshot(...)`: paused row FAILS (`Expected: "Play playback"  Received: "Pause playback"`), 1 failed / 8 passed.
- Without the break: 9 passed. The old HEAD case under the snapshot-refreshing pause break failed only because of the clock text moving, not the playing state (its query matched nothing).
- `git diff packages/astraeus/src/app/App.tsx` is empty.

Follow-up (coordinator): the case also asserts the clock's own `playing` (read from the `runtime.clock` the page passes the stand-in scene as a prop, no setup change) before and after the switch, in both rows. Bare breaks now fail: `runtime.clock.pause();` fails the playing row, bare `runtime.clock.play();` fails the paused row (1 failed / 8 passed each); App.tsx restored, diff empty.

Gates (rerun after the follow-up, under the flock): lint clean, typecheck clean, build ok, tests 303 files / 5037 passed, 2 skipped. (Earlier run below.)
Gates (earlier): lint clean, typecheck clean, build ok, tests 302 files / 5034 passed, 2 skipped (final run). An earlier gate run showed a lint complexity error and one failing test in other builders' in-progress files (a debug line in someone else's test); both cleared on rerun, not mine.

Limitations: a break that changes the clock without refreshing the shell's snapshot is invisible to this DOM test (the shell would be stale in the real app too until the next frame).

## Drift Notes

None.

Coordinator (orchestrate-g024-20261121): after the follow-up (the clock's own playing state asserted in both rows; bare pause()/play() breaks now fail), gates green (lint, typecheck, build; `npm test` 303 files, 5037 passed). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
