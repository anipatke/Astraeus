---
id: T-160
title: Give the engine its small public API
objective: O-036
status: done
depends_on: [{task: T-159, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o036-planning-20261023}
check_waiver:
    task: T-160
    reason: 'owner chose no per-step checks, one Full Objective Check at the end of O-036; quote: "Same as O-035 (Recommended)"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T07:21:48Z"
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

Built 2026-10-23 (builder, no commit). Files: packages/astraeus/src/api/{index,scene,mount,bodies,errors}.ts, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/package.json (`"."` entry plus `x-internal-exports` note; broad entries unchanged so the demos did not move).
- Scene/addBody/addTrajectory/setTime/setScale/camera.follow/mount: src/api; Scene.toDefinition() builds today's ExperienceDefinition, mount() renders today's App; no change to App or the demos. Ready-made bodies sun..pluto and moon; trueScale/readableScale re-exported; trajectory by samples or provider+bounds.
- Data: mount(el, scene, { data: DataSource[] }), DataSource = {name, provides, prepare?}; BodyRef.requires names a package; missing -> SceneError "missing-data" naming it. prepare loads the planet series, then each source's prepare.
- Tests: packages/astraeus/tests/publicApi.test.ts (17 cases: definition contents, defaults, provider trajectory, 10 named-error cases, data-package naming, mount/unmount leaves no canvas, unmount before ready, bad element).
- Gates: lint, typecheck, build, npm test (117 files, 1548 passed, includes packageBoundaries), npm run check:engine-alone: all pass. No browser run.
- Drift/needs: (1) camera.follow opens framed on the target (startView) and offers the viewer's Follow button; App has no "start already following" option, so true follow-on-open would need a small App change. (2) mount does not import app/style.css; T-161's build must ship or inject it. (3) Ready-made moons beyond the Moon and the data-required refs arrive with the data split (T-161); today every catalogued body is still offered.


## Drift Notes

None yet.
