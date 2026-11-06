---
id: T-273
objective: O-059
title: Check everything together and show the owner
status: in_progress
stage: test
depends_on: [{task: T-272, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o059-planning-20261106}
---

# Check everything together and show the owner

## Outcome

The public features, demos and site are reconciled in the Design and docs, the size limits hold, and the owner has judged the look.

## User Check

Open `localhost:5490`: Apollo, a shower, Jupiter with its moon panel and places, and another planet, at 375x667 and 1280x720, look as they did.

## Done When

Design describes the implemented reality, with every deferred drift note accounted for; the Objective's Success Conditions are each evidenced; the API reference page is within its limit in `load-budget.mjs`; the owner's words on the look are recorded after the integration evidence. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `.savepoint/Design.md` under `Components/Codebase Map`, `docs/architecture/state-and-assets.md` under `Experience plug-in boundary`, `docs/agents/browser-policy.md`, `docs/BROWSER_CHECKS.md`, `packages/astraeus-site/tools/validate/load-budget.mjs`, `packages/astraeus/CHANGELOG.md`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-07, ARCH-03, TEST-01, TEST-03.

## Implementation Plan

1. Reconcile Design and account for each drift note. 2. Build the public site and measure page budgets. 3. Start the preview and hand the owner the addresses. 4. Record the owner's look.

## Boundaries

Fix-ups for what this finds only; a new gap becomes an Issue.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:pack`. Owner look on `localhost:5490`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder session (Sonnet), 2026-11-06, against HEAD 323505a9 plus the uncommitted working tree below.

- Reconciled: `.savepoint/Design.md` (codebase map rows, boundary sentence, new O-059 paragraph, front-door bullet, Drift accounting for T-265 to T-272, Current Technical State), `docs/architecture/state-and-assets.md` (plug-in boundary), `docs/architecture/codebase-details.md`, `docs/DONOR_PROVENANCE.md`, `docs/NPM_PACKAGING.md` (stale `data/bodies` paths; `astraeus-data` 123 files of 130). `docs/architecture/o059-public-forms.md` unchanged (dated note). Extra read: `.savepoint/Design.md` Drift sections and T-265..T-272 Drift Notes, to account for them.
- CHANGELOG: one O-059 intro, entries T-269, T-268 (moved up from below the O-052 list), T-267, T-266; no duplicates; the `toDefinition` stop-gap in `planetViews.test.ts` is named.
- Browser: `npm run check:browser`, the one O-059 run, against 323505a9 + working tree, started 17:48Z 2026-11-06, all 10 steps exit 0, evidence `docs/evidence/browser-20261106T174821Z`. Two code faults found and fixed first (earlier failing runs removed, uncited): (1) `browser-smoke.mjs` parsed a `DEFINITIONS` table that T-272 removed from `main.tsx` (now lists planets, showers and the named synthetic views); (2) the site's `synthetic-journey` loader built the scene before the planet series were loaded (`loadJourneyPlanets` added in `syntheticJourneyScene.ts`, called from `main.tsx`). Code changed after the first lint/typecheck/test/pack runs: lint, typecheck, `npm test` (225 files, 2938 passed, 2 skipped) and build rerun after; pack and engine-alone ran before and are unaffected (no engine source changed).
- Gates: lint, typecheck, build, `npm test`, `check:engine-alone`, `check:pack` (astraeus 9.12 of 9.5 MB unpacked, astraeus-data 123 of 130 files) pass; `ASTRAEUS_PUBLIC_BUILD=1 ASTRAEUS_ENGINE_SHARE=1 npm run build` plus `public-build-assets.mjs dist` ok (96 checked); `load-budget.mjs` all rows ok, API page 151,008 B raw (limit 200,000), 33,365 B gzip (limit 40,000). Local build restored to normal.
- Owner look on `localhost:5490` (User Check): PENDING, not recorded.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.
