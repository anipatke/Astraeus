---
id: T-275
objective: O-057
title: List every public type at the front door
status: planned
depends_on: [{task: T-274, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
---

# List every public type at the front door

## Outcome

Every type a host can reach is named at the root, and the outside-types check flags only types the root reaches but does not name.

## User Check

A host can import `BodyId`, `ViewPlace` and the other named types from `astraeus`, and the `apiOutsideTypes` allowlist is empty.

## Done When

`BodyId`, `DisplaySwitchId`, `DisplaySwitchPlace`, `ViewPlace`, `LineStretchInput`, `TrajectoryBase` (under a public name if a better one is plain) and `ViewerChangeCause` are exported from the root; the check treats a type named at the root as public wherever it is declared, and a test proves it still fails on a reachable unnamed type; the `apiOutsideTypes` entries are empty; `apiRules.test.ts` and `allowlistGrowth.test.ts` pass; the lock is regenerated.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `tools/api-surface.mjs`, `tools/api-rules.mjs`, `packages/astraeus/src/api/index.ts`, `packages/astraeus-site/tests/apiOutsideTypes.allowlist.json`, `packages/astraeus-site/tests/apiSurface.test.ts`, `packages/astraeus-site/tests/apiRules.test.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, ARCH-04, TEST-01, TEST-02.

## Implementation Plan

1. Find where the reachable-type walk writes these entries. 2. Narrow it to unnamed types and add the failing-case test. 3. Export the missing types. 4. Empty the allowlist, regenerate the lock.

## Boundaries

No move of declarations out of `core/`, `app/` or `assets/` beyond what ARCH-04 needs. No renames.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the last step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read and changed, limitations.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.
