---
id: T-263
title: Give events their own zones
objective: O-056
status: done
depends_on: [{task: T-262, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-263, reason: 'Owner said "Orchestrate o56" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o056-run-20261103}, recorded_at: '2026-11-03T10:37:56Z'}
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

Extra reads: none beyond Context Files (also read `tests/eventZonesDom.test.ts`, `tests/pacingViews.test.ts`, `tests/scenePin.test.ts` as the tests that exercise the changed code).

| Done When | Evidence |
|---|---|
| `EventInput.withinSeconds`, bad value throws `bad-event` naming the event | `src/api/story.ts` (`eventsOf` checks, stores `withinMs` on `TimelineEvent`); test "withinSeconds %s throws bad-event naming the event" (0, -5, NaN, Infinity, "60"). |
| Zones reported without pacing; `via` and view filter kept | `core/pacing.ts` `eventZonesOf`; `ExperienceDefinition.eventZones`; `App.tsx` `stateNow` now reads `runtime.eventZones` with the showing view's events (no longer `pacing`-gated). Tests in `eventZonesDom.test.ts` "event zones from withinSeconds": enter/leave via `time` without pacing and beside an unrelated rule; own plus rule zones together; view hides an event's zone. All 13 earlier tests in that file pass unchanged. |
| Pacing rule uses event's `withinSeconds`, else its `within`; one zone list | `zoneAround(event, default)` in `core/pacing.ts` is the only place a zone is cut; `pacingFor` and `eventZonesOf` both use it. Test "a pacing rule uses the event's own withinSeconds". `pacingViews.test.ts` and other pacing tests pass unchanged. |
| `twoViewers`, `lifecycle` green | In the full `npm test` run. |
| Surface | `npm run api:lock`: lock diff adds only `withinSeconds` on `EventInput` and `SceneEventRead`; `api:errors` no change (no new code); CHANGELOG Unreleased entry; README `addEvents`, `scene.events` and Event zones paragraph updated. `apiSurface`, `apiRules`, `allowlistGrowth` pass. |
| Gates | `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test`: 207 files passed, 2605 passed, 2 skipped (log `/tmp/claude-1000/-home-user-code-Astraeus/7d0c4483-c4ed-4937-a995-e725ceffa34a/scratchpad/o056/npmtest-T-263.log`). The first run failed one test, `scenePin.test.ts`, which pins the definition output: the new `eventZones` field appeared in pinned scenes. The fixture `tests/fixtures/scenePin.json` was regenerated; its diff is 136 added lines and no removals. No browser run. |

## Drift Notes

- Architecture delta for T-264: `ExperienceDefinition` gains `eventZones` (every event zone, a superset of the event zones in `pacing.zones`); the host zone report reads it instead of `pacing.zones`. `TimelineEvent` gains `withinMs`. `core/pacing.ts` gains `EventZone`, `zoneAround`, `eventZonesOf`; `zoneInView`/`zonesInView` are generic over `EventZone`.
- `scenePin.json` fixture regenerated (additions only), since it pins `toDefinition` output, which O-057 removes.
- Zone order in `eventZones` is rule zones first, then own zones; not part of the contract.
