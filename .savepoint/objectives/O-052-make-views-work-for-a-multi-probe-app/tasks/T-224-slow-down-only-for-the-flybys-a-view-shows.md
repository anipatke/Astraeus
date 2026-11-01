---
id: T-224
title: Slow down only for the flybys a view shows
objective: O-052
status: done
depends_on: [{task: T-223, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-224, reason: 'Owner said "orchestrate 052" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o052-run-20261101}, recorded_at: '2026-11-01T03:59:34Z'}
planned_by: {role: planner, session: voyagers-feedback-20261101}
---

# Slow down only for the flybys a view shows

## Outcome

In a scene with views, pacing event rules apply only to the showing view's events, and a view switch eases to the new paced rate instead of jumping (O-052 "Pacing follows views").

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Pacing zones from event rules carry their event id; the runtime uses only zones whose event the showing view has. Span rules apply in every view. A scene without views gives the same rates as 0.7.0 (existing pacing tests unchanged).
- Made-up two-probe scene: view A slows only at A's events, B only at B's, Both at all (tests at the times of each event, in each view).
- A switch that changes the paced rate eases in log space over about one real second; seeking lands on the new rate at once; a chosen speed still wins until `"auto"`; `onChange` reports the eased rates with cause `playback`.
- A `near` rule whose type matches events in no single view still loads (it is valid for whichever views show them); a type matching no event still throws `bad-timeline`.
- README "Paced playback" notes the view rule; CHANGELOG `Unreleased` line naming the behaviour change for 0.7.0 scenes with views.

## Context Files

`packages/astraeus/src/core/pacing.ts`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/src/app/openClock.ts`, `packages/astraeus/src/app/views.ts`, `packages/astraeus/tests/pacing.test.ts`, `packages/astraeus/tests/pacingDom.test.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-06, CODE-02, TEST-01, TEST-03, TEST-04, CODE-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Tag zones with their event id in `pacingFor`; give `pacedRate` the showing view's event set.
3. Pass the view to every `applyPacing` caller (App, sceneFrame, openClock); add the short switch ease.
4. Tests, README, CHANGELOG.

## Boundaries

No per-view pacing in `setViews`; no State change (ARCH-02); no camera work (later steps).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Files read: the Task's Context Files (pacing.ts, story.ts, App.tsx, sceneFrame.ts, openClock.ts, views.ts, pacing tests, README); plus `src/app/viewHiding.ts` (extra read: how `ResolvedView.events` sets are derived, to confirm an id no view names is in every set), `src/api/mount.ts` and `tests/viewsDom.test.ts`, `tests/sceneViews.test.ts` (test patterns, `handle.setView`), `src/core/events.ts` (event id field), `CHANGELOG.md`.

Files changed: `src/core/pacing.ts` (`PaceZone.eventId`, `zoneInView`, `zonesInView`, `pacedRate(..., shown?)`, `PaceView`, `startPaceEase`, `PACE_EASE_MS`, `applyPacing(clock, pacing, view?, nowMs?)`), `src/api/story.ts` (zones tagged with event id), `src/app/openClock.ts` (opening view's events), `src/app/AstraeusScene.tsx` (`SceneControls.pace`), `src/app/sceneFrame.ts`, `src/app/App.tsx` (initial `pace`, ease on `chooseView`, ease cleared on seek and on auto), README "Paced playback", CHANGELOG Unreleased; new tests `tests/pacingViews.test.ts`, `tests/pacingViewsDom.test.ts`.

Commands run: `npm run lint` (clean), `npm run typecheck` (clean), `npm run build` (built), `npm test` full (177 files, 2165 passed, 1 skipped). No browser run.

| Done When | Test |
|-----------|------|
| Zones from event rules carry their event id | pacingViews.test: "tags each event rule's zone with the event it came from and leaves spans untagged" |
| Runtime uses only zones whose event the showing view has | pacingViews.test: "zoneInView / zonesInView keep spans and the zones of shown events"; the view A/B/Both rate tests; pacingViewsDom "opens at the opening view's rate, eases..." (App picks the zones from the view) |
| Span rules apply in every view | pacingViews.test: "a span applies in every view" |
| Scene without views gives 0.7.0 rates (existing pacing tests unchanged) | pacingViews.test: "a scene without views ... every zone applies"; existing pacing.test.ts and pacingDom.test.ts pass unmodified |
| Two-probe scene: A slows only at A's events | pacingViews.test: "view A slows at A's event and the shared one only" (rates at each event time) |
| B only at B's | "view B slows at B's event and the shared one only" |
| Both at all | "Both slows at every event" |
| Switch eases in log space over about one real second | pacingViews.test "blends in log space ... then clears" (0, half = geometric mean, 1 s = target, ease cleared); pacingViewsDom first test (mid-ease rate strictly between, then target) |
| Seeking lands on the new rate at once | pacingViewsDom "a seek lands on the paced rate at once..." |
| A chosen speed still wins until "auto" | pacingViewsDom same test (setRate(60), switch, still 60 after 1.5 s; setRate("auto") returns to pacing) |
| `onChange` reports eased rates with cause playback | pacingViewsDom first test: last change has cause "playback" during the ease. Only the cause is asserted, not each reported rate value. |
| A near rule matching events in no single view still loads | pacingViews.test "a near rule whose events belong to different views still loads" |
| A type matching no event still throws bad-timeline | pacingViews.test "a near rule whose type matches no event still throws bad-timeline" (plus existing pacing.test) |
| README "Paced playback" notes the view rule | Not a test; README paragraph added |
| CHANGELOG Unreleased line naming the behaviour change for 0.7.0 scenes with views | Not a test; CHANGELOG line added |

Limitations: no browser check (by rule); the eased rate is asserted by bounds in the DOM test and exactly in the pure test; the host `ready`/seek path is covered through `handle.setTime`, the visitor's timeline seek uses the same `seekTo`.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

T-226 reuse: `zonesInView(pacing.zones, view.events)` is the per-view zone list (spans have no `eventId`, so a host signal should consider only zones with an `eventId`). Pacing state per view lives in `SceneControls.pace` (`PaceView`), not in State (ARCH-02). Design.md: pacing zones now carry `eventId` and `pacedRate`/`applyPacing` take the showing view's event set; reconcile in the last step.
