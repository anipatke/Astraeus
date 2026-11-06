---
id: T-272
objective: O-059
title: Move the site onto the public way
status: planned
depends_on: [{task: T-271, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
---

# Move the site onto the public way

## Outcome

The site opens every demo through the public viewer, with its pickers, loading cover and in-page address changes in the site, and no longer touches the engine's private parts.

## User Check

`packages/astraeus-site/src/main.tsx` imports only from `astraeus` and the demo packages; the deep-import count for the site is 0.

## Done When

The site uses `mount` or `AstraeusScene` with `address` and `developerTools`; no `App`, `ExperienceDefinition` or `toDefinition` in the site; cover, heading, picker and navigation behave as today; a regression test holds the cover hand-over (I-141); `DEEP_IMPORT_COUNTS` for `astraeus-site` is 0; site tests of engine internals moved to `packages/astraeus/tests/` and pass `check:engine-alone`. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/src/bootCover.ts`, `packages/astraeus-site/src/showerSwitch.ts`, `packages/astraeus-site/src/journeyData.ts`, `packages/astraeus/src/app/addressNavigation.ts`, `packages/astraeus/src/app/listSwitch.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts`, `packages/astraeus-site/tests/bootCover.test.ts`, `packages/astraeus-site/tests/loadingCoverChain.test.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-03, ARCH-01, TEST-01, TEST-02, TEST-03.

## Implementation Plan

1. Move address navigation and switch choice into the site. 2. Mount through the public viewer. 3. Rewrite or move site tests. 4. Lower the count to 0.

## Boundaries

No visual change. `App` stays in the engine, internal. `toDefinition` itself is removed in O-057.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run build` with `ASTRAEUS_PUBLIC_BUILD=1`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.
