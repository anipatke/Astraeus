---
id: T-315
title: Give fractional times the scene error and honour see-through colours
objective: O-073
status: planned
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

Pending execution.

## Drift Notes

None expected.
