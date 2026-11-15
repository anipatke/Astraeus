---
id: T-315
title: Give fractional times the scene error and honour see-through colours
objective: O-073
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-315, reason: 'Owner said "go" to orchestrate O-073 under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-g020-20261115}, recorded_at: '2026-11-15T04:10:47Z'}
planned_by: {role: planner, session: plan-g020-20261115}
---

# Give fractional times the scene error and honour see-through colours

## Outcome

Every public time input given a fractional or out-of-range value throws `SceneError` code `bad-time` (still an instance of `RangeError`); a look line colour with alpha draws with that alpha; and the README, `EventInput` and `SceneEventRead` agree that an event's object may be a body, path or sky figure. Repairs escalated I-176.

## User Check

None required; behaviour is proven by tests.

## Done When

- One table test over every public call that takes a time (`stateOf`, `setTime`, timeline/event/panel times, provider paths, and any other `TimeInput` in `src/api/`) with a fractional and an out-of-range value: each throws `SceneError` with code `bad-time`, and `instanceof RangeError` stays true (I-176 Proof Needed). `tests/fractionalTime.test.ts` expectation updated (owner-confirmed change, 2026-11-15) without changing its setup.
- A look line colour with alpha (`rgba()`, `hsla()`, and `#rrggbbaa` if `isCssColour` accepts it) sets the line material's opacity to the line's own opacity times that alpha, for every look line reaching a material (sky figures, traces, ecliptic, outlines, and any other look line colour); a test per kind. No more three.js alpha warning.
- README time rule and Errors section updated; README `addEvents` row, `EventInput` and `SceneEventRead` comments agree (F-16); CHANGELOG `Unreleased`.
- Configured gates pass.

## Context Files

- `packages/astraeus/src/core/state.ts`
- `packages/astraeus/src/api/scene.ts`
- `packages/astraeus/src/api/planPaths.ts`
- `packages/astraeus/src/api/errors.ts`
- `packages/astraeus/tests/fractionalTime.test.ts`
- `packages/astraeus/src/core/lookValues.ts`
- `packages/astraeus/src/app/SkyFiguresView.ts`
- `packages/astraeus/src/api/story.ts`
- `packages/astraeus/src/api/sceneReads.ts`
- `.savepoint/issues/I-176-a-fractional-time-throws-a-plain-error-not-a-scene-error.md`
- `packages/astraeus/README.md` under `Errors`, `Time, events and story`, `Looks, controls and views`

## Design References

Design `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

ARCH-04, API-04, API-05, API-07, TEST-01..03.

## Implementation Plan

1. Keep `assertUtcUnixMs` in core; at the `src/api/` boundary (the shared time conversion) reject non-whole and out-of-range values with `SceneError("bad-time")` naming the value; make sure the provider-path wrapper does the same.
2. Parse a colour's alpha once (a small core helper) and multiply it into each look line material's opacity; set the colour from the opaque part.
3. Docs and comment alignment; tests.

## Boundaries

No flooring of fractional times (the owner chose refusal in I-177); no new colour formats.

## Technical Verification

Focused tests while iterating; configured gates at handoff.

## Technical Evidence

Check waived by the owner (check_waiver above); evidence routes to the Full Objective Check. No extra reads beyond Context Files.

- Time: `toUtcMs` (src/api/time.ts) now also refuses non-whole and out-of-range moments with `SceneError("bad-time")` via a new core `isUtcUnixMs` (state.ts); the provider path wrapper (planPaths.ts) calls `toUtcMs` instead of `assertUtcUnixMs`. `stateOf(provider, 1e16)` now throws a clean bad-time (refused before the message is built). `tests/fractionalTime.test.ts` expectation only changed (SceneError bad-time, still RangeError). New `tests/badTime.test.ts`: table over 14 time inputs x 5 values (fractional, +/-1e16, bad text, invalid Date) plus a per-call-code table for calls that wrap a bad moment in their own documented code (shownDuring bad-body/bad-trajectory, anchor bad-anchor, story panel at.time bad-panels; panel at.time now also refuses a fractional/out-of-range moment).
- Colour alpha: core `splitColourAlpha` (lookValues.ts); SkyFiguresView `paint()` sets the colour from the opaque part and multiplies alpha into opacity for figures, outlines, ecliptic, equator, a figure's own colour, selected emphasis, and traces (alpha lerped traced->faded). Tests in tests/skyFigures.test.ts ("a colour with alpha"). Other look colour consumers: only `skyLines` colours are colour-kind look fields; PathView.setColor takes catalogue family colours, not look colours (not covered).
- F-16: README addEvents row, EventInput and SceneEventRead now say body, path or sky figure (`assembleScene` passes sky figure ids to the event object check, so reads report them). The pinned error message "is not a body or trajectory in the scene" is left (scenePin fixture).
- README time rule, Errors row (generated from the SceneErrorCode comment; kept short for the api page gzip budget, which was 1 byte over then 3 bytes over with longer text), skyLines alpha note; CHANGELOG Unreleased; `npm run api:lock` run.
- Gates: lint 0 errors, typecheck 0 errors, build ok, `npm test` 259 files, 3925 passed, 2 skipped.

- Owner decision (2026-11-15T04:31:55Z): a fractional or out-of-range story panel `at.time` is now refused (`bad-panels`), where it was accepted before; owner chose "Keep refusing" (one rule for every time). Calls with their own documented code for a bad moment (`shownDuring` → `bad-body`/`bad-trajectory`, anchors → `bad-anchor`, panels → `bad-panels`) keep it; every other time input throws `bad-time` (coordinator decision: changing those codes would break 0.9.2's additions-only promise).
- Coordinator marks done (gates passed: lint, typecheck, build, npm test 259 files / 3925 passed / 2 skipped), per the owner's "go" orchestration.

## Drift Notes

Panel `at.time` keeps its own `bad-panels` code (documented, existing test) rather than `bad-time`; same for shownDuring and anchors. Design.md shows modified in the working tree but not by this Task.
