---
id: T-164
title: Add the React component and a React example app
objective: O-040
status: done
depends_on: [{task: T-163, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: g011-planning-20261023}
check_waiver:
    task: T-164
    reason: 'owner run rules: no per-step checks, one Full Objective Check at the end of O-040 ("dont we have a skill for this", standing O-036 rules); owner look given: "looks fine"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T11:00:13Z"
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

Built by a Sonnet builder, 2026-10-23. Task Check waived by the owner's run rules (no Check record written); left at `stage: audit`.

Per criterion:
- `AstraeusScene` and `AstraeusSceneProps` exported from `.` with doc comments (`src/api/AstraeusScene.tsx`, `index.ts`): met. It renders `App` with the definition, waits for `prepare()`, calls `onReady`/`onError`, rebuilds on a new `scene` object (data and callbacks are read through a ref, documented), cleans up on unmount.
- `mount` on the same shared path: met. New `src/api/prepared.ts` `prepareScene(scene, data)` builds the definition and starts `prepare()`; both `mount` and the component call it (STYLE-07). `mount` signature and behaviour unchanged (existing mount tests pass).
- Tests: met. `tests/publicApi.test.ts` gains an `AstraeusScene` block (render, ready, build error, data-load error, scene change vs callback change, unmount incl. before data loads) in the happy-dom page; the file imports and asserts the new export. 28 tests pass.
- `examples/hello-react` built by `npm run build:example` from the packed tarball: met (`tools/build-example.mjs` now builds `hello-scene` and `hello-react`; `node tools/build-example.mjs hello-react` builds one).
- Browser step: `hello-react` added to `run-browser.mjs`; `example` is now a folder name, the runner previews each example on its own port (`runner.mjs`); it reuses `check-hello-scene.mjs` (same scene, same readouts, STYLE-07). Run once alone against the built example at :5497 (scratch evidence dir, not docs/evidence): desktop and phone passed, errors [] (probe in list and picked, Follow in force, Earth/Moon drawn in view, Moon orbit line in view, time set and moved). Mapped in `docs/BROWSER_CHECKS.md`. Full `check:browser` not run (Full Objective Check).
- README: React section and API table row; CHANGELOG Unreleased entry: met.
- Owner look pending: built example previewed at http://localhost:5497/.

Commands run: `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 1574 passed, 1 skipped (119 files); `npm run check:pack` pass; `npm run build:example` pass (both examples); hello-react browser step alone pass.

Files read: the Context Files. Extra reads: `packages/astraeus/src/api/errors.ts` (error codes, to avoid a new code), `packages/astraeus-site/tests/publishWorkflow.test.ts` (example manifest rules), `examples/hello-scene/.gitignore`.
Files changed: packages/astraeus/src/api/{AstraeusScene.tsx (new), prepared.ts (new), mount.ts, index.ts}, tests/publicApi.test.ts, README.md, CHANGELOG.md; examples/hello-react/{package.json, index.html, src/main.jsx, .gitignore} (new); tools/build-example.mjs; packages/astraeus-site/tools/validate/{runner.mjs, run-browser.mjs, check-hello-scene.mjs (comment)}; docs/BROWSER_CHECKS.md; router task T-164.

Limitations: no visual look by the builder; `onReady` fires when state is set for the draw (the commit follows immediately); the component is not exercised with a real canvas in tests (pretend page). `publishWorkflow.test.ts` still checks only hello-scene's manifest/main.js, not hello-react.


## Drift Notes

Record architecture deltas (new public export, second example) for reconciliation before the Full Objective Check.

- New public export `AstraeusScene` / `AstraeusSceneProps` on the `.` entry; new internal `src/api/prepared.ts` (`prepareScene`) shared by `mount` and the component. Design Components (O-036 packaging row, public API) needs both.
- Second example `examples/hello-react` (outside the workspaces, tarball-installed, devDependencies for the peers) built with `hello-scene` by `build-example.mjs`; browser runner `example` field is now a folder name with one preview port per example; `hello-react` step reuses `check-hello-scene.mjs`.

**Owner's verdict (2026-10-23T11:00:13Z):** looked at the React example on http://localhost:5497 (desktop and phone): "looks fine".
