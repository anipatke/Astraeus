---
id: T-275
objective: O-057
title: List every public type at the front door
status: done
depends_on: [{task: T-274, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
check_waiver: {task: T-275, reason: 'Owner said "orchestrate O-57" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o057-run-20261107}, recorded_at: '2026-11-06T22:46:45Z'}
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

### Hand-off (builder, 2026-11-07)

Done When -> test:

| Done When | Test (file, case) |
|---|---|
| The seven types are exported from the root (`TrajectoryBase` keeps its name) | `apiSurface.test.ts` "matches the checked-in lock" (lock gained the 7 root entries); "allows no public type declared outside src/api/ ... beyond the allowlist" (fails if any is reachable and unnamed) |
| Check treats a root-named type as public wherever declared | `apiSurface.test.ts` "treats a type the root names as public wherever it is declared, and still fails on a reachable type the root does not name (T-275)" |
| A test proves it still fails on a reachable unnamed type | same case: plants `Unnamed` in `internal.ts` reachable via a return type but not exported; expects `["Unnamed (internal.ts)"]`; also the existing "fails on a type made reachable from a made-up entry, and on a stale entry" |
| `apiOutsideTypes` entries empty | `apiSurface.test.ts` "lists no allowlist entries now that every reachable type is named at the root (T-275)"; `allowlistGrowth.test.ts` passes |
| `apiRules` and `allowlistGrowth` pass | both files green (34 tests with apiSurface) |
| An unnamed type behind a root-named type fails | `apiSurface.test.ts` "descends into a type the root names, so an unnamed type behind it fails (T-275)" plants `Behind` in a field of root-named `NamedOutside`; expects `["Behind (internal.ts)"]` |
| Lock regenerated | `npm run api:lock`; "matches the checked-in lock" |

Gates: lint, typecheck, build pass; `npm test` 227 files, 3042 passed, 2 skipped; check:engine-alone pass; check:pack pass. Extra: `apiReference.test.ts` "has a doc comment on every export" failed first on four new exports; fixed by adding doc comments.

Files changed: tools/api-surface.mjs, packages/astraeus/src/api/index.ts, src/api/scene.ts (export + doc), src/app/displaySwitches.ts and views.ts (doc comments only), packages/astraeus/api-surface.lock.json, CHANGELOG.md, apiOutsideTypes.allowlist.json, apiSurface.test.ts. No extra reads.

Limitations: no browser run (per run rules). `TrajectoryBase` kept: no renames in Boundaries, and no plainer name was obvious.


## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.

- T-275 (send-back): the walk now descends into types the root names (permanent), so Design.md's note that the walk stops at types declared outside `src/api/` is out of date; T-280 must update it. Descending found `CenteredPosition`, `Quaternion`, `ElementsSource`, `ElementsTimeScale`, `LocalOnlyDeclaration`, `SolarSystemScalePolicy`, then (one level further) `FrameId`, `CenterId`, `PublicReplacement`; all are now named at the root with doc comments. `mapPosition` and `mapRadius` were a walk artefact (method types of `ScalePolicy` taken for named types because their symbols are not anonymous); the walk now treats method and function symbols as signatures, so no value was exported. API-04 lint (`apiRules`, `apiTypeLint`) shows no new problems in those types; no field renamed, nothing allowlisted.
