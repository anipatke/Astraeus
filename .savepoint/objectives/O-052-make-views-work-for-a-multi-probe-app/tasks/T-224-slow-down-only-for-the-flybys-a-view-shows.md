---
id: T-224
title: Slow down only for the flybys a view shows
objective: O-052
status: planned
depends_on: [{task: T-223, requires: clear}]
owner_validation: {required: false}
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

Pending execution: named cases, results, files read/changed, gates, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
