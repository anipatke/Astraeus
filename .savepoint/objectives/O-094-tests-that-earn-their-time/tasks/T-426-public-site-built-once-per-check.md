---
id: T-426
title: Public site built once per check
objective: O-094
status: done
depends_on: [{task: T-424, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-426, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on, merge when clear" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:12:54Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
---

# Public site built once per check

## Outcome

The owner's ticked cut P06 (docs/evidence/test-cost/proposals.json): when a browser run has just built the public site, `check:public-build` reuses that build for its two file checks instead of building again; with no browser build to reuse it builds as today.

## User Check

None.

## Done When

1. `tools/check-public-build.mjs` accepts an existing build (a path the browser runner prints or records, e.g. `--from <dir>` or an env var) and verifies it is the build of the current head (record how: commit id stamp written by the runner's build, refused when it differs or is missing, then it builds itself). The runner (`packages/astraeus-site/tools/validate/runner.mjs` `buildPublicSite`) records where it built and for which commit.
2. Named test cases (in the existing test file for check-public-build, found by name) prove: reuses a matching build; rebuilds when the stamp is missing or for another commit; plain run unchanged.
3. build.md's public-build gate line says how to reuse (one sentence), and the Full Check order lists the browser run before check:public-build so reuse happens.
4. Measured gate time with and without reuse.
5. Focused gates per builder rules; no browser run (the reuse path is proved with a build made by calling the runner's build function directly, or a fixture build dir).

## Context Files

`docs/evidence/test-cost/proposals.json` (P06), `tools/check-public-build.mjs`, `packages/astraeus-site/tools/validate/runner.mjs`, `docs/agents/build.md` (public-build gate line only).

## Design References

None.

## Guardrails

TEST-01, TEST-03.

## Implementation Plan

1. Read both files; add the stamp on build and the reuse path.
2. Add the named cases.
3. One sentence in build.md (coordinate: the rules Task also edits build.md — edit only the public-build gate line and the Full Check order line, and say so in evidence).
4. Measure.

## Boundaries

No change to what the two file checks assert. No browser runs.

## Technical Verification

Focused gates; the coordinator's combined gate; the Full Check uses the reuse.

## Technical Evidence

Design: `tools/public-build-stamp.mjs` (new, with `.d.mts`) stamps a build with HEAD plus a hash of uncommitted changes (tracked diff and untracked files under packages, tools, package manifests). `buildPublicSite` in runner.mjs writes `.build-stamp.json` on success; the runner's `stop()` moves the stamped build to `$TMPDIR/astraeus-last-public-build` and prints the path. `tools/check-public-build.mjs` takes `from` (CLI `--from <dir>`, default the kept build) and reuses it only when `isCurrentBuild`; otherwise builds as before. The function's own default is no reuse, so existing tests are unchanged.

| Done When | Evidence |
|---|---|
| 1 stamp, reuse, refusal | tools/public-build-stamp.mjs; check-public-build.mjs `from`; runner.mjs buildPublicSite/stop. Real run: second run printed "reusing the build at /tmp/astraeus-last-public-build" and passed both checks. |
| 2 named cases | checkPublicBuild.test.ts "reusing a stamped build": "reuses a build stamped for the current commit and changes, without building"; "builds itself when the stamp is missing or is for another commit or other changes"; "a plain run with no build to reuse builds as before"; "keepBuild moves a stamped build aside..."; the five earlier cases untouched. |
| 3 build.md | public-build gate line (browser gate bullet) now says reuse and that the browser run comes first; no separate order line existed, so the order is in that sentence. Only that bullet edited, on top of T-424's text. |
| 4 timing | check:public-build 3.97 s wall with a fresh build, 1.64 s reusing (file checks 2 s of the build run's own time), measured under flock. |
| 5 gates | below; no browser run (reuse proved with a build made by calling buildPublicSite directly). |

Commands (under flock): `npm run typecheck` clean; eslint (TS6 shim) on check-public-build.mjs, public-build-stamp.mjs, runner.mjs, checkPublicBuild.test.ts clean; prettier --write on the changed files; `npx vitest run packages/astraeus-site/tests/checkPublicBuild.test.ts` 9 passed. Timing runs' evidence folders deleted.

Files changed: tools/public-build-stamp.mjs, tools/public-build-stamp.d.mts, tools/check-public-build.mjs, tools/check-public-build.d.mts, packages/astraeus-site/tools/validate/runner.mjs, packages/astraeus-site/tests/checkPublicBuild.test.ts, docs/agents/build.md (browser gate bullet).

Limitations: the browser runner's `stop()` keep path is not exercised by a browser run (none allowed); keepBuild is unit-tested. Stamp covers sources under packages/tools/manifests only.

## Drift Notes

None architectural. build.md has no separate Full Check order line; the order is stated in the browser gate bullet.

## Coordinator (withdrawn)

Withdrawn by the owner after measurement (2026-11-22, "Drop it" on: P06 saves about 2.3 s per Full Check, estimate was 7 s, while adding a stamping tool and a runner keep step not yet exercised in a real browser run). All changes reverted (runner.mjs, check-public-build.mjs/.d.mts, checkPublicBuild.test.ts restored; public-build-stamp files deleted; the build.md public-build sentence restored to "(about 4 s)."); nothing lands. Set done as withdrawn by the orchestrating session on the owner's decision.
