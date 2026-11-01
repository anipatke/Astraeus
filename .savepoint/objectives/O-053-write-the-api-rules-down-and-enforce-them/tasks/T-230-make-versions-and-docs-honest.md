---
id: T-230
title: Make versions and docs honest
objective: O-053
status: done
depends_on: [{task: T-229, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-230, reason: 'Owner said "orchestrate 053" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o053-run-20261101}, recorded_at: '2026-11-01T05:48:12Z'}
planned_by: {role: planner, session: api-review-20261101}
---

# Make versions and docs honest

## Outcome

Package version ranges state what was tested, the docs the review found stale are fixed, README API tables are checked against the types, and the Objective's checks are reconciled into Design (Guardrails API-07; owner D7; O-053 "Honest versions and docs").

## User Check

Not owner-facing; the owner sees the result at the end of the Objective.

## Done When

- Each `astraeus-data*` package's `astraeus` peer range is the engine's current minor (`>=0.7.0 <0.8.0` today, moving with the engine's version), and `check:pack` fails when a data package's peer floor differs from the engine's minor.
- The engine's React peers (`react`, `react-dom`) cover all of React 19 (`>=19 <20`), and a check installs the latest React 19.x into the packed-package consumer and runs it, wired where the release path runs it (`check:pack`, `check:node-consumer` or `.github/workflows/publish.yml`), with evidence of a run.
- The engine exports `./package.json`; the API-surface lock (T-228) updated with it.
- Stale "0.2 preview" banners removed (README, `src/api/index.ts`, `package.json` description if present); the README React `style.css` note corrected (`AstraeusScene` already imports it); README API rows for `mount` and `<AstraeusScene>` include `address`; the doc comments C-136 O3 noted (`mount.ts` and `viewerLink.ts` saying `camera` is undefined before the first frame) corrected.
- A test checks the README API tables against the types: every `MountedScene` member, `MountOptions` key and `AstraeusSceneProps` prop appears in the README table and every README row names a real member.
- CHANGELOG `Unreleased`: the peer changes and the `./package.json` export.
- `.savepoint/Design.md`: the O-053 checks listed (where they live, what they guard) under `Current Technical State` or `Public API shape`, and every Drift Note of this Objective reflected or marked non-architectural with a reason.

## Context Files

`.savepoint/Guardrails.md` under `Public API`, `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`, `packages/astraeus/package.json`, `packages/astraeus-data/package.json`, `packages/astraeus-data-saturn/package.json`, `tools/check-packs.mjs`, `tools/check-node-consumer.mjs`, `.github/workflows/publish.yml`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/viewerLink.ts`, `docs/agents/build.md`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

API-07, API-01, TEST-01, TEST-02, TEST-03; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Data peer ranges and the check:pack rule.
3. React peer range and the latest-19 consumer check.
4. `./package.json` export; doc fixes; README table sync test.
5. CHANGELOG; Design reconciliation of T-228..T-230 drift.

## Boundaries

Never `npm publish` or run `tools/publish-packages.mjs` without `--dry-run`; no version bump (0.8.0 is prepared after O-057).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`), plus `check:pack` where the check needs packed output. No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Per Done When (builder, orchestrate 053; Task check waived by the owner's run rules, no waiver record written here):

1. Data peers: the six `astraeus-data-*` packages and `astraeus-data` and `package-lock.json` say `>=0.7.0 <0.8.0`. `tools/check-packs.mjs` (`enginePeerRange`, `peerProblems`) fails on any other value. Planted: `astraeus-data-mars` set back to `>=0.1.0 <1.0.0` -> `FAIL astraeus-data-mars: astraeus peer is >=0.1.0 <1.0.0, the engine's current minor is >=0.7.0 <0.8.0` / `pack check: FAIL (1 problems)`; reverted -> `pack check: pass (14.4 s)`. Also test `packagePacks.test.ts` "fails the pack check when a data package's astraeus peer floor..." plants three stale ranges.
2. React: engine peers `react` and `react-dom` are `>=19 <20`; `check:pack` also requires them. New `tools/check-react-consumer.mjs` (`npm run check:react-consumer`, step added to `.github/workflows/publish.yml` after `check:pack`, noted in `docs/agents/build.md`). Run: `registry: newest React 19.x is react 19.3.1, react-dom 19.3.1` / `installed: react 19.3.1, react-dom 19.3.1; AstraeusScene rendered 60 characters on the server` / `react consumer: pass`. Planted: engine peer `>=19 <19.3` -> npm `ERESOLVE ... peer react@">=19 <19.3" from astraeus@0.7.0` and `react consumer: FAILED`; reverted -> pass.
3. `./package.json` added to the source `exports` and to `x-publish.exports` (so it is packed and `check:pack` verifies the target); `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json` (+1 line); `apiSurface.test.ts` passes.
4. Docs: README "0.2 preview" banner -> "Before 1.0"; `src/api/index.ts` comment fixed; no `description` preview text in package.json (`x-internal-exports` text corrected); README style note says `mount` and `AstraeusScene` both load the stylesheet (both import `../app/style.css`); `mount` and `<AstraeusScene>` rows carry `address` (and `className`, `style` on the component, which the type has); README section on published exports names `./package.json`; `camera` doc comments in `mount.ts` and `viewerLink.ts` now say it is the opening camera before the first frame (checked against `App.tsx` `readCamera`/`openingCamera`, which return the opening pose from `ready`).
5. Test: `readmeApiBreaks` (tools/api-rules.mjs) and "README API tables (API-07)" in `apiRules.test.ts`: passes on the tree (no breaks); shown failing on synthetic READMEs (a dropped `address`, `setCamera`, an invented `speed?`, an invented `handle.readyNow`) and on the real README with `address?` removed from the `<AstraeusScene>` row (`<AstraeusScene> props (AstraeusSceneProps): README does not list address`, 2 tests failed); reverted -> 17 passed.
6. CHANGELOG `Unreleased` bullet for the peer changes and the `./package.json` export.
7. Design.md: new "O-053 checks" sub-section under Public API shape lists the checks (location, guard) and accounts for each T-228 and T-229 drift note and each limitation (reflected or non-architectural with a reason).

Gates: `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 181 files, 2229 passed, 1 skipped; `npm run check:pack` pass; `npm run check:node-consumer` pass; `npm run check:react-consumer` pass. `api:lock` and `api:errors` re-run: no further diff. No browser run.

Files read: Task, config, check-packs.mjs, check-node-consumer.mjs, build-packages.mjs (grep), package.jsons, publish.yml, README, CHANGELOG, mount.ts, viewerLink.ts, AstraeusScene.tsx, App.tsx (camera lines), api-rules.mjs, apiRules.test.ts, packagePacks.test.ts, Design.md, T-228/T-229 drift and limits.
Files changed: see git status (package manifests and lock, tools/check-packs.mjs(+d.mts), tools/api-rules.mjs(+d.mts), tools/check-react-consumer.mjs(+d.mts), package.json script, publish.yml, build.md, README, CHANGELOG, index.ts/mount.ts/viewerLink.ts comments, api-surface.lock.json, two test files, Design.md).
Limitations: `check:react-consumer` needs registry access and checks the newest 19.x only at run time; renders `AstraeusScene` on the server only, no browser. The README check is by table shape (the `mount` row, the `<AstraeusScene scene` row, `handle.x` names), not a full markdown parse. The lock records source `exports`, not `x-publish.exports`.

## Drift Notes

- Added `tools/check-react-consumer.mjs` and `npm run check:react-consumer` (new script and release-workflow step); the Done When allowed `check:pack`, `check:node-consumer` or publish.yml. Reconciled in Design.md.
- `./package.json` also added to `x-publish.exports`, and the README section on published exports now names it.
- All T-228/T-229 drift reconciled in Design.md "O-053 checks".
