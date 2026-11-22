---
id: T-425
title: Apollo data rebuilt only when its inputs change
objective: O-094
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-425, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on, merge when clear" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:12:54Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
---

# Apollo data rebuilt only when its inputs change

## Outcome

The owner's ticked cut P05 (docs/evidence/test-cost/proposals.json): the fast suite no longer spends ~41 s rebuilding the Apollo 11 data in `packages/astraeus-demo-apollo11/tests/apollo11Reconstruction.test.ts` when nothing it depends on changed, and the three API rule files (`packages/astraeus-site/tests/apiRules.test.ts`, `apiSurface.test.ts`, `apiReference.test.ts`) build the public API picture once instead of several times. Every existing assertion stays; only how the setup is obtained changes (the owner ticked this setup change; it is the Task's purpose).

## User Check

None.

## Done When

1. The Apollo test reuses a stored rebuild keyed by a hash covering every input of the rebuild (the build tools, the raw input data and the committed package output it compares against) and rebuilds whenever any of them change. Where the stored rebuild lives (a cache path git ignores, e.g. under `node_modules/.cache/`), how the key is computed, and a forced-rebuild switch (env var) are recorded. The file's existing second-rebuild logic is reused, not duplicated.
2. A named test proves the key changes when each input kind changes (one table test over tools, raw input, package output) and that a cold cache rebuilds.
3. The API picture is built once and shared by the three files (a shared helper module), with no assertion changed.
4. Measured: `npm test` wall time before and after (run each twice, warm cache for after; record both), the Apollo file's time warm and cold, and apiRules' time before and after.
5. Focused gates per builder rules on the changed files; `npx vitest run` on the four test files.

## Context Files

`docs/evidence/test-cost/proposals.json` (P05), `docs/evidence/test-cost/report.md` (Vitest section), `packages/astraeus-demo-apollo11/tests/apollo11Reconstruction.test.ts`, `packages/astraeus-site/tests/apiRules.test.ts`, `packages/astraeus-site/tests/apiSurface.test.ts`, `packages/astraeus-site/tests/apiReference.test.ts`, `tools/api-surface.mjs`.

## Design References

None.

## Guardrails

TEST-01, TEST-03; ARCH-03 (no new deep imports).

## Implementation Plan

1. Read the Apollo test's beforeAll and its existing rebuild-skip logic; list the rebuild inputs.
2. Add the keyed cache with forced-rebuild switch; add the key table test.
3. Share the API picture through one helper.
4. Measure before/after.

## Boundaries

Only the four test files, one new shared test helper, and a cache path that git ignores (add to .gitignore only if not already ignored). No assertion changes, no production code changes.

## Technical Verification

Focused gates; the coordinator's combined gate; the Full Check measures the suite time.

## Technical Evidence

Extra reads (none beyond Context Files): packages/astraeus-demo-apollo11/tools/apollo11/toolsHash.mjs (reconstruct inputs), tools/api-surface.mjs and packages/astraeus-site/tools/site/api-reference.mjs (what the picture is built from), vitest config head (project layout).

| Done When | Evidence |
|---|---|
| 1 Keyed stored rebuild | `packages/astraeus-demo-apollo11/tests/rebuildCache.ts` (`rebuildKey`, `cachedRebuild`); used in `apollo11Reconstruction.test.ts` beforeAll. Stored at `node_modules/.cache/astraeus-apollo11/rebuild.json` (git ignores node_modules). Key: sha256 over path+bytes of every file under the inputs, by kind: tools (apollo11 tools folder, plus engine `src/core` and `data`, which the tools import), raw (`data/apollo11/raw`), output (normalised, generated, the report). Force: `ASTRAEUS_REBUILD_APOLLO=1`. The existing second-run logic (`alreadyProven`, `second`) is untouched and still runs only when the tools hash is not the proven one. |
| 2 Key table test + cold rebuild | `rebuildCache.test.ts`: "changes the key when an input of any kind changes, and only then" (table over every kind: edit, restore, add a file); "rebuilds on a cold cache, a changed key or a forced run, and reuses the stored copy otherwise". |
| 3 API picture shared | `packages/astraeus-site/tests/helpers/apiPicture.ts` (`apiPicture()` = {items, surface}); apiRules, apiSurface, apiReference read it, no assertion changed. Test files run in separate workers, so the picture is shared through a keyed disk store (`node_modules/.cache/astraeus-api/picture.json`, force `ASTRAEUS_REBUILD_API=1`); `apiPicture.test.ts` proves the key and cold/forced rebuild. apiRules' two `currentSurface()` calls now share one. |
| 4 Measured | Below. |
| 5 Gates | Below. |

Timings (npm test wall, inside the lock; the other builder's work may add noise): before 35.6 s, 35.0 s (Vitest duration 31.4/30.8 s). After: cold cache 43.1 s (first run builds both stores, plus 2 new files), warm 33.8 s and 34.4 s. Apollo file alone: cold 12.7 s, warm 0.39 s (forced rebuild 12.7 s). apiRules alone: before 3.79 s, warm 2.78 s (address-parameter scan still builds its own program). Four API/Apollo files together: before 13.3 s, after cold 3.2 s / warm 3.0 s on a second run. Whole-suite gain is small (~1 s) because the suite is parallel and Apollo's 12 s overlaps other files; the saving shows on a single-file or low-core run, not in this 330-file wall time.

Gates: `npm run typecheck` clean; eslint (use-typescript6) clean and prettier --check clean on the 8 changed/new files; `npx vitest run` on apollo11Reconstruction, rebuildCache.test, apiRules, apiSurface, apiReference, apiPicture.test, packageBoundaries, rebuildComparison: 8 files passed, 88 passed | 1 skipped. Full `npm test` (timing runs): 330 files passed, 5441 passed | 2 skipped. A first timing run failed packageBoundaries (ARCH-03 scanner matched an import-like string in a comment of rebuildCache.ts); comment reworded, rerun clean.

Files changed: apollo11Reconstruction.test.ts, apiRules.test.ts, apiSurface.test.ts, apiReference.test.ts (setup only); new: rebuildCache.ts, rebuildCache.test.ts (apollo tests), helpers/apiPicture.ts, apiPicture.test.ts (site tests).

Limitations: two helpers (one per package; a package cannot import another's tests) and two new test files, beyond "one helper"; the Apollo key also covers engine core and data (an input of the rebuild the plan did not list); the stored copy keys on file bytes, so a TypeScript or orb dependency upgrade alone does not invalidate it (apiPicture does include the typescript6 manifest; Apollo does not include orb); use the env switch after such an upgrade.

## Drift Notes

None.

## Coordinator (withdrawn)

Withdrawn by the owner after measurement (2026-11-22, "Drop it" on: P05 saves about 1 s per full `npm test` run, estimate was 13 s, while adding two keyed caches and four files). All of this Task's changes were reverted before the combined gate (`git checkout` of the four test files; the new rebuildCache/apiPicture files and caches deleted); nothing lands. Set done as withdrawn by the orchestrating session on the owner's decision; the Full Check confirms the diff contains none of it.
