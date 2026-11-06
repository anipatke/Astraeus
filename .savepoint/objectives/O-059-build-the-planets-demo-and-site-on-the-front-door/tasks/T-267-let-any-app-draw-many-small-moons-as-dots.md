---
id: T-267
objective: O-059
title: Let any app draw many small moons as dots
status: done
depends_on: [{task: T-266, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
check_waiver: {task: T-267, reason: 'Owner said "orchestrate O-59" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o059-run-20261106}, recorded_at: '2026-11-06T11:23:56Z'}
---

# Let any app draw many small moons as dots

## Outcome

An app can add a planet's small moons as one batch of dots with families, orbit lines and names on demand, through a public call, with no planet named in engine rules.

## User Check

Read the README entry; a made-up system in a test draws a batch of made-up moons.

## Done When

The public call builds the same internal body set the demo uses today, including orbit lines for bodies with no path of their own and the balance point; it loads positions through `data`, works in `scene.check` and `scene.load`, has reads, typed errors, a made-up proof, lock, README and CHANGELOG. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus/src/app/bodySet.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/planGroups.ts`, `packages/astraeus/src/api/group.ts`, `packages/astraeus/src/api/sceneReads.ts`, `packages/astraeus/src/api/bodies.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-03, API-04, API-05, ARCH-01, ARCH-03, ARCH-05, ARCH-06, PROV-01, TEST-01.

## Implementation Plan

1. Add a planner for the batch beside the existing planners. 2. Join it in `assembleScene`. 3. Add reads and `bad-*` errors. 4. Prove on a made-up system. 5. Lock, README, CHANGELOG.

## Boundaries

No change to how dots draw. No planets demo rebuild.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Builder session 2026-11-06 (no commit, no browser run). Reads: the Task's Context Files; `docs/architecture/o059-public-forms.md` sections 2.1, 7, 8, 9, 11 (as briefed); extra reads, each to place the build: `core/ephemerisGroup.ts`, `core/orbitGroup.ts`, `core/pointGroup.ts`, `core/twoBodyAdapter.ts` (the made-up members' group), `app/OrbitSetView.ts` (what the group must answer), `api/data.ts` and `api/assembleScene.ts` (loading), `tests/apiImports.test.ts`, `tests/twoViewers.test.ts`, `tests/sceneCheck.test.ts` (the suites a new feature joins).

Built: `Scene.addBodySet`, `Scene.bodySets`, `bad-body-set`; types `BodySetInput`, `BodySetFamilyInput`, `BodySetMemberInput`, `BodySetElementsInput`, `BodySetBodyInput`, `BodySetBalanceInput`, `SceneBodySetRead` (all in `src/api/`). New: `api/planBodySets.ts` (planner), `api/bodySetChecks.ts` (input checks), `api/bodySetInput.ts`, `core/elementsGroup.ts` (made-up members, `EphemerisGroup` shape on the two-body adapter; the riskiest part, proved first), `core/bodySetFamilies.ts` (family type, palette and `familiesWithPalette` moved out of `app/bodySet.ts`, which re-exports them, so `src/api/` needs no new `app/` import). Changed: `assembleScene` (layers, member objects, checks, data loading), `data.ts` (`installData` takes the sets' moons and history), `scene.ts`, `errors.ts`, `sceneReads.ts`, `index.ts`, `app/bodySet.ts` and `OrbitSetView.ts` (optional per-family `brightness`; `familyGainOf(look, id, base = 1)`; absent means 1, drawing unchanged). Lock, README (call, read, error table) and CHANGELOG updated. Internal `bodySets` field unchanged and still used by the demo and site.

Tests: `tests/sceneBodySets.test.ts` (46 cases, made-up system incl. a made-up centre, plus listed Jupiter and Pluto moons against the committed fits); `tests/twoViewers.test.ts` (one case in each of three pairings: mount, AstraeusScene, mixed); `tests/sceneCheck.test.ts` (a `bad-body-set` row).

Gates: `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 2681 pass, 2 fail (both `packagePacks.test.ts`, below); `npm run check:engine-alone` pass; `npm run check:pack` FAIL: astraeus unpacked 9.53 MB over the 9.5 MB limit. A clean checkout of HEAD measures 9.49 MB, so this change (about 30 KB of new engine source) crosses the limit; the limit in `tools/check-packs.mjs` was not touched (owner decision). Also at the limit: the generated API page gzip (`apiReference.test.ts`, limit 30,000) is 29,996 B after trimming this step's doc comments, so T-268 and T-269 will need a budget decision before they add public docs.

Limitations: no browser run; the dots' look is unchanged by construction (same layer, same views) and not looked at. Listed members' orbit lines for a body without its own orbit are proved at the layer level, not drawn.


## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.

Follow-up 2026-11-06 (owner decision, relayed by the coordinator): `tools/check-packs.mjs` astraeus unpacked limit raised 9.5 to 9.8 MB (packed unchanged), returning to 9.5 MB at T-270 when the moon lists leave; `packages/astraeus-site/tools/validate/load-budget.mjs` `api/index.html` gzipLimit 30_000 to 40_000 (raw 150_000 unchanged; `apiReference.test.ts` states no number). The doc comments trimmed to fit the page are restored in full. API page now 136,391 B raw, 30,739 B gzip. Gates rerun: lint, typecheck, build pass; `npm test` 211 files / 2683 tests pass (2 skipped); `check:engine-alone` pass; `check:pack` pass (astraeus 9.53 MB unpacked of 9.8). Stage stays audit.

## Drift Notes (T-267)

- Limit changes above (pack 9.8 MB until T-270; API page gzip 40,000).
- `core/bodySetFamilies.ts` holds the family type, palette and `familiesWithPalette`; `app/bodySet.ts` re-exports them (accepted by coordinator). Optional family `brightness` added to the internal family type (accepted).

