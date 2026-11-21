---
id: C-198
scope: {kind: objective, id: O-084}
result: NEEDS WORK
checked_by: {role: checker, session: check-o084-orchestrator-20261121}
executed_session: orchestrate-g024-20261121 (Sonnet builders for T-354..T-360)
checked_at: '2026-11-21T12:49:47Z'
health_snapshot: sha256:813d14a1f600028afc18227bbf47d4d3861500c45016b382398ad798dc0c3153
reviewed:
  base_commit: d9289f4e
  head_commit: 02b6950c
  files: [packages/astraeus-demo-planets/tests/jupiterMoonsScene.test.ts, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/api/planBodySets.ts, packages/astraeus/src/app/sceneLayout.ts, packages/astraeus/src/assets/catalogue.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/core/bodies/planetTrajectory.ts, packages/astraeus/src/core/body.ts, packages/astraeus/src/core/chebyshevEphemeris.ts, packages/astraeus/src/core/moonChunkCache.ts, packages/astraeus/src/core/moonData.ts, packages/astraeus/src/core/stateResolver.ts, packages/astraeus/tests/cold/sceneMoonIsolation.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/listedMoonBodies.test.ts, packages/astraeus/tests/moonChunkCache.test.ts, packages/astraeus/tests/moonLoadedFrom1950.test.ts, packages/astraeus/tests/resolverAfterLoad.test.ts, packages/astraeus/tests/sceneBodySets.test.ts, packages/astraeus/tests/sceneMoonBinding.test.ts, packages/astraeus/tests/sceneMoonScope.test.ts, packages/astraeus/tests/twoViewers.test.ts]
  dependencies: []
issues: [I-191]
unmet: [engine-size-budget]
supersedes: null
---

# C-198: O-084 Full Objective Check

Run by the orchestrating session under G-024 decision 7; this session planned, authorised the test migrations and reconciled Design, but did not build T-354..T-360. Diff `d9289f4e..02b6950c`. Step checks waived on all seven Tasks.

**Result: NEEDS WORK** on one release gate only: the engine's first-download raw size cap (I-191). Every O-084 Success Condition is otherwise proven. Under G-024 decision 7 ("a size budget goes red": park it), O-084 is parked unmerged on branch `o084-scene-moon-data` for the owner's budget choice; no repair round is started, because the only repairs are an owner cap decision or an open-ended trim.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (moon data fetch: success, failure not cached, shared in-flight; proven in `moonChunkCache.test.ts`)
- [x] Workflow And Side-Effect Check Lock (load → install → revision → memo drop; failed load keeps memo: `resolverAfterLoad.test.ts`)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: O-084 Success Conditions and Decisions 1–9; T-354..T-360 Done When; API-03, ARCH-04, TEST-01..04; Full Check gates including the engine size budget (`ENGINE_LIMIT`, `packagePacks.test.ts`, browser `public-build-assets`).
2. Entry points: `Scene.load`, `mount`, `Scene.stateOf`, body sets, the viewer resolver (`createSceneResolver`), `loadedFromUtcMs`/`memberLoadedFromUtcMs`.
3. Relied-on: `MOON_SYSTEMS` configs, `createMoonSystem`, `chebyshevEphemeris` chunk adoption, the preloaded test project.
4. Matrix: load order {A then B, B then A, concurrent}; sources {same, different}; windows {same, different}; data {given, missing, unreadable}; memo {before load, after load, failed load, unbound}; 1950 first year {direct, through the group}; process-wide fallback {every public path}.
5. Admission: supported public paths and the release gates above.

## Coverage

- **Isolation by load order, source and window**: Proven. Cold `sceneMoonIsolation.test.ts` 15/15 (four rows red on HEAD before T-358: A's Jupiter moved 143.2 km after B loaded).
- **No public path falls back to process-wide data**: Proven. `sceneMoonScope.test.ts` (rows red with the plan binding reverted).
- **Shared bytes, own selection**: Proven. `moonChunkCache.test.ts` (rows 1, 4, 6 red first; object identity of shared chunks).
- **Memo refresh**: Proven. `resolverAfterLoad.test.ts` (row 1 red first; failed load keeps memo; unbound evaluates once).
- **1950 clamp**: Proven. `moonLoadedFrom1950.test.ts` (raw `TimeScaleOutOfRangeError` before, both routes).
- **Existing tests**: changes limited to the coordinator-authorised migrations of reads that depended on the removed leak (twoViewers ×3, sceneBodySets ×1, listedMoonBodies ×2, demo jupiterMoonsScene ×1), each keeping its intent; scene pin regenerated with every change classed as the always-present `catalogue` key or a data-less scene no longer borrowing preloaded data (no numeric change for a scene with its own data).
- **Docs**: README and CHANGELOG 0.10.0 (breaking change with migration); Design "Each scene keeps its own moon data (O-084)" (commit 82d0cf64).
- **Engine size budget**: **Issue I-191.** 1,833,801 B raw against 1,833,000 (+801 B); gzip 524,620 / 527,000 within.

## Gates (this session)

- `git diff --check` clean; `lint` 0; `typecheck` 0; `build` 0.
- `test:full` exit 1: 307 files, 5053 passed, 1 failed (`packagePacks.test.ts` engine cap, I-191), 2 skipped.
- `check:engine-alone` pass (233 files, 3870 passed); `check:pack` pass; `check:node-consumer` pass; `measure:example` 1,833,801 / 524,620 B.
- `npm run check:browser` once: exit 1 only at `public-build-assets` (the same engine cap); every journey step exit 0; evidence `docs/evidence/browser-20261121T124206Z`. Time warnings are the known AH-29 overrun (O-086).
- `savepoint health check O-084`: "blocks clearance" from the tests instance (the one failing test above; coverage not written because `test:full` exited 1). A first snapshot taken seconds earlier was discarded as a duplicate run.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|-------|-----------|--------|-------------|----------------|
| I-191 engine raw size +801 B | High (every build) | Low (0.04% of first download; gzip within) | Medium (owner-held release gate) | Owner chooses a cap raise or a trim; then re-run this Check |

## Owner Decisions

None recorded on O-084; no `carried_forward` entries.

## Observations (non-blocking)

- A first-run `twoViewers` shelf-panel flake (T-356) and a `jupiterMoonsEphemeris` chunk-size flake (T-358) passed on rerun; neither recurred here.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
