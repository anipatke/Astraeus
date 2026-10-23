---
id: T-160
title: Give the engine its small public API
objective: O-036
status: planned
depends_on: [{task: T-159, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o036-planning-20261023}
---

# Give the engine its small public API

## Outcome

A developer builds a scene with `new Scene()`, `addBody`, `addTrajectory`, `setTime`, `setScale`, `camera.follow` and draws it with `mount(element, scene)`, without writing React; the engine's main entry exports exactly this API and the bodies and scales it needs.

## User Check

None on screen (the example app in the last step is where it is seen). The API's tests pass; the engine-alone check passes.

## Done When

- `packages/astraeus/src/api/` (or the place the decision note names) holds `Scene` with `addBody`, `addTrajectory`, `setTime`, `setScale`, `camera.follow`, and `mount(element, scene)` returning a handle that can unmount. It builds today's `ExperienceDefinition` and mounts today's `App`; no second engine, no change to how the demos work (ARCH-01, ARCH-02).
- Ready-made bodies (at least the Sun, the planets, the Moon) and scales (true and readable) are exported for `addBody`/`setScale`; a trajectory can be given as sampled states or a provider with `stateAt(time)`.
- `package.json` `exports` has a main entry `.` with the public API and its types. The broad entries the demos use stay, grouped under an `internal` prefix or otherwise marked outside the promise, as the decision note says; the boundary test still passes.
- Fast tests: a scene built through the API produces the expected definition (bodies, trajectory, time, scale, follow target); invalid input fails with a named error (unknown body to follow, bad time); `mount` then unmount leaves no canvas (happy-dom). Tests name the public calls only (TEST-01, TEST-03).
- `npm run check:engine-alone` and the configured gates pass. No browser runs.

## Context Files

The decision note `docs/NPM_PACKAGING.md`, `packages/astraeus/package.json`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/synthetic/syntheticDefinition.ts`, `packages/astraeus/src/assets/catalogue.ts`, `packages/astraeus/src/core/scale.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts`.

## Design References

Design: Interfaces and Data Flow; Experience plug-in boundary; Current Technical State (O-035).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, TEST-01, TEST-03, STYLE-05.

## Implementation Plan

1. Confirm the decision note's choices; return REPLAN REQUIRED if they no longer fit.
2. Write the API layer over ExperienceDefinition and App; add the ready-made bodies and scales.
3. Declare the main entry and mark internal entries.
4. Tests, gates, engine-alone.

## Boundaries

No compiled build or packaging (next step), no example app or docs (last step), no change to what demos show. If a call in the Idea's sketch cannot be honoured without a redesign, stop and report.

## Technical Verification

Focused tests while building; configured gates and `npm run check:engine-alone` at hand-off. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
