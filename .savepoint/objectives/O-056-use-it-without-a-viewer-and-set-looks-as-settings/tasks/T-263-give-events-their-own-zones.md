---
id: T-263
title: Give events their own zones
objective: O-056
status: planned
depends_on: [{task: T-262, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o056-planning-20261103}
---

# Give events their own zones

## Outcome

An event can carry its own zone, so a host hears entering and leaving it with or without pacing, and pacing reuses that zone (O-056 Success Condition 6; owner D4; review F9).

## User Check

Not owner-facing: the change is an API with tests.

## Done When

- `EventInput.withinSeconds` (optional, positive finite simulated seconds; bad value throws `bad-event` naming the event) gives the event a zone of `time ± withinSeconds`.
- `onEventZone` and `eventZones` report every event zone, from `withinSeconds` or from a pacing rule, in a scene with no pacing at all; `via` keeps its `time` / `view` meaning and view filtering (`zonesInView`) still applies.
- A pacing event rule (`near: { type, within }`) uses each matching event's own `withinSeconds` where the event has one and its own `within` otherwise; the existing pacing tests pass unchanged. One zone list feeds both pacing and the host report (no second zone builder).
- Tests: zones without pacing (enter, leave, `via`), zones from both sources, a view hiding an event's zone, the bad-value check. `twoViewers` and `lifecycle` stay green.
- **Surface:** `npm run api:lock` regenerated and the lock diff limited to the members this step adds; CHANGELOG (Unreleased) and the README API tables updated in the same change; `apiSurface`, `apiRules` and `allowlistGrowth` tests pass (no allowlist group grows).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/story.ts`, `packages/astraeus/src/core/pacing.ts`, `packages/astraeus/src/api/viewerZones.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/planTimeline.ts`, `packages/astraeus/src/api/planStory.ts`, `.savepoint/Design.md` under `Interfaces and Data Flow` ("Views fixes for a multi-probe app (O-052" items 3 and 5).

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` ("each signal stands alone ... event zones independent of pacing, D4").

## Guardrails

API-01, API-02, API-04, API-05, API-06, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, STYLE-02, STYLE-07, STYLE-10, CODE-01.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Check `withinSeconds` at `addEvents`; build event zones once from events and pacing rules.
3. Feed the one zone list to pacing and to the host zone report.
4. Tests; lock, README, CHANGELOG; gates.

## Boundaries

Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files. No renames of existing members and no removal of `toDefinition` (O-057). The pacing input keeps its current names (`from`/`to`, `within`, `ramp`); O-057 renames them.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus the named `check:*` scripts. No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; T-264 reconciles them into Design.md.
