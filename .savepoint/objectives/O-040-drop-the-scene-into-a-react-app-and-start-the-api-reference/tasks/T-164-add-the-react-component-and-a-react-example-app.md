---
id: T-164
title: Add the React component and a React example app
objective: O-040
status: planned
depends_on: [{task: T-163, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: g011-planning-20261023}
---

# Add the React component and a React example app

## Outcome

A React developer writes `<AstraeusScene scene={scene} data={[...]} />` and gets the same full viewer `mount` draws, and a small React 19 example app built from the packed package proves it.

## User Check

Open the React example's preview and see the same scene as `examples/hello-scene`: Earth, the Moon and the probe followed, with the menus and timeline.

## Done When

`AstraeusScene` and its props type are exported from `astraeus`'s `.` entry with doc comments; it renders the same `App` and definition `mount` does, waits for `prepare()`, reports readiness (`onReady`) and load failure (`onError`), rebuilds when the `scene` prop changes and cleans up on unmount; `mount` keeps its behaviour and is rebuilt on the same shared path rather than duplicating it (STYLE-07). Tests cover render, ready, error, scene change and unmount in the happy-dom pretend page (no canvas) and the public API test lists the new export. `examples/hello-react` (React 19, Vite, the packed tarballs, outside the workspaces) builds through `npm run build:example`, and `npm run check:browser` has a step that opens it and reads the scene readouts through the driver (no screenshots). README gains a short React section.

## Context Files

`packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/tests/publicApi.test.ts`, `packages/astraeus/tests/domSetup.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `tools/build-example.mjs`, `examples/hello-scene/package.json`, `examples/hello-scene/src/main.js`, `examples/hello-scene/index.html`, `packages/astraeus-site/tools/validate/run-browser.mjs`, `packages/astraeus-site/tools/validate/runner.mjs`, `packages/astraeus-site/tools/validate/check-hello-scene.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

Design Components/Codebase Map (O-036 packaging row), Current Technical State O-036 (public API thin layer, example and browser step) and O-038 (pretend page).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-03, STYLE-05, STYLE-07.

## Implementation Plan

1. Factor the definition-and-prepare path `mount` uses into one shared helper; keep `mount`'s signature and behaviour.
2. Add `AstraeusScene` (props: `scene`, `data`, `onReady`, `onError`, plus `className`/`style` for the wrapper) on that helper; no menus option (owner decision 3).
3. Tests in the pretend page; extend `publicApi.test.ts`.
4. Add `examples/hello-react` and teach `build-example.mjs` to build both examples; add a `hello-react` browser step through the driver and map it in `docs/BROWSER_CHECKS.md`. The step may be run once alone while writing it (it changes the browser scripts); the full `check:browser` runs at the Full Objective Check.
5. README React section and CHANGELOG (unreleased) entry.

## Boundaries

No scene-only layout, no events or new Scene calls (O-041), no other framework wrappers; the demos and site are untouched.

## Technical Verification

Hand-off gates from AGENTS.md plus `npm run check:pack` and `npm run build:example`; the new browser step once alone. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas (new public export, second example) for reconciliation before the Full Objective Check.
