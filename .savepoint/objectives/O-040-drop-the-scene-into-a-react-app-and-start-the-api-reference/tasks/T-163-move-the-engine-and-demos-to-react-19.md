---
id: T-163
title: Move the engine and demos to React 19
objective: O-040
status: planned
owner_validation: {required: true}
planned_by: {role: planner, session: g011-planning-20261023}
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

Pending execution.

## Drift Notes

Record architecture deltas (dependency model change) for the planner to reconcile in Design before the Full Objective Check.
