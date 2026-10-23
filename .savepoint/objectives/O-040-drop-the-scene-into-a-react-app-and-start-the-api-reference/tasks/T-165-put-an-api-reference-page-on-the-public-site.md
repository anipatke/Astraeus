---
id: T-165
title: Put an API reference page on the public site
objective: O-040
status: planned
depends_on: [{task: T-164, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: g011-planning-20261023}
---

# Put an API reference page on the public site

## Outcome

The public site serves a developer API reference at `/api`, generated from `astraeus`'s public types and doc comments, and a fast check keeps every public export documented so the page grows with each later Objective.

## User Check

Open `localhost:5490/api` (and the public build preview): every public call, option and the React component is listed with a short example, readable on a phone, linked from the home page; the README and npm page link to it.

## Done When

A generator (TypeDoc through the TypeScript 6 route, or another tool the step names with its reason) builds the reference from `packages/astraeus/src/api/index.ts` into the site build at `/api`, with the site's look; `npm run build` and the public build include it and the load-budget and public-build checks know the new files; a fast test fails when an export of the `.` entry has no doc comment (proved on a made-up undocumented export); the README and the package's `homepage` point at the page; the home page links to it. Design.md is reconciled for O-040's drift notes (React 19 peers, the component, the second example, the reference), each reflected or named non-architectural with a reason.

## Context Files

`packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/bodies.ts`, `packages/astraeus/src/api/data.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/package.json`, `packages/astraeus/README.md`, `package.json`, `packages/astraeus-site/vite.config.ts`, `packages/astraeus-site/index.html`, `packages/astraeus-site/tools/validate/load-budget.mjs`, `packages/astraeus-site/tools/validate/public-build-assets.mjs`, `tools/lint/use-typescript6.cjs`, `.savepoint/Design.md`.

## Design References

Design Components/Codebase Map (site and O-036 packaging rows), Current Technical State O-036 and O-039 (public build planet list and load budget).

## Guardrails

PROV-02, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Try the generator against the public entry; if no tool works with this TypeScript set-up without a dependency swap, return REPLAN REQUIRED naming what was tried.
2. Wire generation into the site build so `/api` is a built page, styled to match the site; add it to the load-budget and public-build checks.
3. Write or tighten doc comments on every current export, with a short example for `Scene`, `mount` and `AstraeusScene`.
4. Add the undocumented-export test.
5. Links from the README, `homepage` and the home page; CHANGELOG entry.
6. Reconcile Design.md for the Objective's drift notes (Astraeus Project Rules, Deferred Design reconciliation).

## Boundaries

Only the public entry is documented; no tutorials beyond short examples; no change to what the demos show.

## Technical Verification

Hand-off gates from AGENTS.md plus the public build and its load-budget and public-build-assets checks. No browser run (once, at the Full Objective Check). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

This step is the integration step: it accounts for T-163's and T-164's drift notes before the Full Objective Check.
