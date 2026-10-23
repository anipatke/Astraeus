---
id: T-163
title: Move the engine and demos to React 19
objective: O-040
status: done
owner_validation: {required: true}
planned_by: {role: planner, session: g011-planning-20261023}
check_waiver:
    task: T-163
    reason: 'owner run rules: no per-step checks, one Full Objective Check at the end of O-040 ("dont we have a skill for this", standing O-036 rules); owner look given: "looks fine"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T10:54:59Z"
---

# Move the engine and demos to React 19

## Outcome

The whole workspace runs on React 19 and the React Three Fiber version that supports it, and the published `astraeus` declares `react`, `react-dom`, `@react-three/fiber` and `three` as peer dependencies so a host app's own copies are used. Nothing a visitor sees changes.

## User Check

Open the preview (`localhost:5490`) and walk the three demos (Apollo 11, showers, planets) on a laptop and a phone-sized window: they look and behave as before.

## Done When

React 19, React DOM 19 and a React Three Fiber release whose peer range includes them are installed (with matching `@types/react`, `@types/react-dom`); every gate passes; `npm run check:engine-alone` and `npm run check:pack` pass; the published manifest lists the four as `peerDependencies` (no longer `dependencies`) and `check-packs.mjs` fails on a manifest that bundles them; `examples/hello-scene` still builds from the tarballs (`npm run build:example`); the owner's look is recorded.

## Context Files

`package.json`, `package-lock.json`, `packages/astraeus/package.json`, `tools/build-packages.mjs`, `tools/check-packs.mjs`, `tools/build-example.mjs`, `examples/hello-scene/package.json`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`.

## Design References

Design Components/Codebase Map (the O-036 packaging row), Current Technical State O-031 (frame loop and `decideDraw`) and O-038 (happy-dom pretend page).

## Guardrails

ARCH-02, ARCH-04, TEST-01, TEST-03, CODE-01, CODE-02, STYLE-10.

## Implementation Plan

1. Read the React 19 and React Three Fiber 9 migration notes; list the breaking changes that touch this code (ref and `forwardRef` changes, removed legacy APIs, `JSX` namespace types, Fiber 9 event, `useFrame` and `Canvas` changes). If the move needs a design change beyond renames and type fixes, return REPLAN REQUIRED with the list.
2. Upgrade the root and engine manifests; move the four libraries to `peerDependencies` of `astraeus` (keep them installed for the workspace as dev dependencies); make `build-packages.mjs` carry the peer block into the published manifest and `check-packs.mjs` fail when one of them is a dependency.
3. Fix type and runtime breaks with the smallest edits; log each file read beyond Context Files with its reason.
4. Run the fast suite, then the happy-dom shell tests and the frame-stage tests; note in the CHANGELOG (unreleased) that React 19 is now required.
5. Start the preview for the owner's look; do not run `npm run check:browser` (once, at the Full Objective Check).

## Boundaries

No new features, no visible change, no public API change beyond the peer dependencies; no three.js major upgrade unless Fiber 9 requires it (then name the version and why in evidence).

## Technical Verification

Hand-off gates from AGENTS.md (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`), plus `npm run check:engine-alone`, `npm run check:pack` and `npm run build:example`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Installed: react 19.3.1, react-dom 19.3.1, @react-three/fiber 9.8.2, three 0.169.0 (unchanged; Fiber 9 needs >=0.156), @types/react 19.3.0, @types/react-dom 19.3.0.

Migration review (plan step 1): no design change needed. `npm run typecheck` passed straight after the upgrade, with no source edit under `packages/*/src`; the fast suite (happy-dom shell tests, frame-stage tests) passes unchanged. No REPLAN needed.

Changes:
- `package.json`, `packages/astraeus/package.json`: react, react-dom, @react-three/fiber, three moved out of `dependencies`; `astraeus` lists them as `peerDependencies` (react and react-dom `>=19 <19.4`, fiber `>=9.8.2 <10`, three `>=0.169.0 <1`) and as `devDependencies` (workspace install). Root keeps them as devDependencies; `@lizard-isana/orb` stays a dependency.
- `tools/build-packages.mjs`: published manifest drops `devDependencies` (peer block carried via the source manifest).
- `tools/check-packs.mjs`: new `peerProblems` fails when one of the four is a `dependency` or is missing from `peerDependencies`, or when any packed manifest keeps `devDependencies`.
- `examples/hello-scene/package.json`: the four libraries added as devDependencies (a host app installs its own copies; the tarball no longer brings them). Kept under `devDependencies` because `publishWorkflow.test.ts` requires the example to have no `dependencies`.
- `packages/astraeus/README.md` (install line and peer note), `packages/astraeus/CHANGELOG.md` (Unreleased: React 19 required).
- `package-lock.json` regenerated.

Commands run (all pass): `npm run lint` (clean); `npm run typecheck` (clean); `npm run build` (built); `npm test` (119 files, 1569 passed, 1 skipped); `npm run check:engine-alone` (pass); `npm run check:pack` (pass); `npm run build:example` (built from tarballs).

Criteria: React 19 / DOM 19 / Fiber 9.8.2 installed with matching types: met. Gates, engine-alone, pack: met. Published manifest lists the four as peerDependencies, verified in `packages/astraeus/dist/package.json`: met. check-packs fails on a bundling manifest: implemented, not exercised with a deliberately bad manifest. hello-scene builds: met. Owner's look: pending (preview on localhost:5490, restarted).

Extra reads beyond Context Files: `tools/check-engine-alone.mjs` (grep only, to confirm it needs no change for peers), `packages/astraeus-site/tests/publishWorkflow.test.ts` (failing test; explains the devDependencies placement), `.npm` ERESOLVE report.

Limitations: plain `npm install` first failed with ERESOLVE (react 19.3.1 conflict reported against fiber); `npm install --legacy-peer-deps` resolved it and a later plain `npm install` succeeded; `npm ls` shows no invalid entries. No browser check run (by rule). Visual behaviour not judged.

## Drift Notes

Record architecture deltas (dependency model change) for the planner to reconcile in Design before the Full Objective Check.

Dependency model change: react, react-dom, @react-three/fiber and three are peer dependencies of the published `astraeus` (were dependencies); the workspace keeps them as devDependencies. Design Components/Codebase Map (O-036 packaging row) and the example description should say a host app installs them; `check-packs.mjs` now enforces it. The hello-scene example installs them itself.

**Owner's verdict (2026-10-23T10:54:59Z):** walked Apollo 11, showers and planets on http://localhost:5490 after the React 19 move: "looks fine".
