---
id: T-165
title: Put an API reference page on the public site
objective: O-040
status: done
depends_on: [{task: T-164, requires: clear}]
owner_validation: {required: true}
check_waiver:
  task: T-165
  reason: 'Owner waived the optional Task Check for the overnight G-011 run: "Keep going, looks in the morning"; one Full Objective Check at the end.'
  actor: {role: owner, session: g011-overnight-20261023}
  recorded_at: '2026-10-23T00:00:00Z'
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

Stage: audit (ready for a Check; not passed). Optional Task Check waived by the owner (`check_waiver` above). The owner's look at `/api` (User Check) is **pending owner validation**, deferred to the morning; not passed.

**Generator decision.** TypeDoc 0.28 supports TypeScript up to 6.0.x only (root `typescript` is 7.0.2), so it would need the `typescript6` route plus a new dependency. Instead `packages/astraeus-site/tools/site/api-reference.mjs` reads the public entry with the TypeScript compiler API from the existing `typescript6` package (no dependency added or swapped) and writes one static page. No REPLAN needed.

**Per criterion**
- Reference built from `packages/astraeus/src/api/index.ts` into the site build at `/api`, site look: `ASTRAEUS_PUBLIC_BUILD=1 npm run build` emits `dist/api/index.html` (24,544 B raw, 6,647 B gzip, 50 exports: classes, interfaces, types, functions, 26 ready-made bodies grouped, React component). Styled with the site's tokens (dark, Inter/JetBrains Mono), no script, `viewport` meta, tables in `overflow-x: auto`, code blocks scroll; not looked at in a browser (owner's look pending). Dev server serves `/api` through the same plugin (`astraeus-api-reference` in `vite.config.ts`); not exercised.
- `npm run build` and the public build include it: both ran; `dist/api/index.html` present. Load-budget has an `api/index.html` page set (limit 100,000 raw / 30,000 gzip) and `REQUIRED_PAGES` lists it; `public-build-assets.mjs` measured it with no problems and no missing pages (`tests/publicBuild.test.ts` page-id list updated, passes).
- Fast test fails when an export lacks a doc comment: `packages/astraeus-site/tests/apiReference.test.ts` cases "has a doc comment on every export of the public entry" and "names an export that has no doc comment (proved on a made-up entry)" (a made-up entry with `forgotten` and `AlsoForgotten` returns exactly those). 31 previously undocumented exports got doc comments (MountOptions, AstraeusSceneProps, ScalePolicy, State, TextureRef, trueScale, readableScale, `Scene.camera`, 24 bodies); `@example` on `Scene`, `mount`, `AstraeusScene` (third case asserts them).
- README (link above the API table), package `homepage` (`https://astraeus.anipatke.com/api/`), CHANGELOG (Unreleased) and the home page nav pill (`href="api/"`) link to it. `npm run check:pack` passes with the `homepage` field.
- Design.md reconciled: O-036 packaging row updated; an O-040 paragraph accounts for T-163 (React 19 peers: reflected), T-164 (`AstraeusScene`, `prepareScene`: reflected; `examples/hello-react`: reflected) and this reference page.

**Commands run (all on the final tree)**: `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 120 files, 1577 passed, 1 skipped (pre-existing); `npm run check:pack` pass; `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `node packages/astraeus-site/tools/validate/public-build-assets.mjs dist` (results in scratch).

**Limitations / not verified**
- Public-build assets check reports `ok: false` from one problem that is NOT from this Task: page set `app.html?experience=showers` is 10,073,636 B raw against its limit 10,070,000. Reproduced identically on the clean tree (`git stash`, same byte count), so it arrived with T-163/T-164 (React 19 move). Limit left as is: raising it is a deliberate, measured change for the owner or coordinator. Every other page set, the whole-build limit and all self-proofs pass.
- No browser run, no screenshots (`npm run check:browser` once at the Full Objective Check). `check:engine-alone` not run (doc comments only in the engine; the generator and test live in the site package).
- The page's phone layout is by construction (CSS), not observed. Vercel serving `dist/api/index.html` at `/api` and `/api/` is assumed from directory-index behaviour, not tried; the home link uses `api/`.
- Extra reads beyond Context Files: `packages/astraeus/src/core/scalePolicy.ts`, `core/state.ts`, `assets/licence.ts`, `assets/pictures.ts` (doc comments for re-exported types), `packages/astraeus/CHANGELOG.md`, `packages/astraeus-site/tests/publicBuild.test.ts`, `tests/publishWorkflow.test.ts` (test style), `.savepoint/Guardrails.md` (rule IDs), the T-163/T-164 Task files (their drift notes, required by this Task), `packages/astraeus-site/tools/site/assets-sections.d.mts` (typing pattern).
- The `SECTIONS` grouping in the generator names exports by hand; a new export lands under "Other exports" until grouped.

**Files changed**: see report to the coordinator.

## Drift Notes

This step is the integration step: it accounts for T-163's and T-164's drift notes before the Full Objective Check. Done: all three Tasks' notes are reconciled in Design.md (O-040 paragraph and the O-036 packaging row). No new drift from this Task beyond the reference page itself, also in Design.md.
