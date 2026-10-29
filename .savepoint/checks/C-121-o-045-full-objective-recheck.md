---
id: C-121
scope: {kind: objective, id: O-045}
result: CLEAR
checked_by: {role: checker, session: o045-recheck-20261029}
executed_session: i094-repair
checked_at: '2026-10-29T10:50:00Z'
health_snapshot: sha256:6091b402a569be906abd95868b56c42b33ca5f36f4a6298b260f29a07b2f42bb
reviewed:
  base_commit: 129777ee
  head_commit: b9a893f2
  files: [packages/astraeus/README.md, packages/astraeus/src/api/scene.ts, .savepoint/issues/I-094-stateof-is-documented-as-giving-velocity-for-every-body-but-most-bodies-return-none.md, .savepoint/router.md]
  dependencies: []
issues: []
supersedes: C-120
---

# C-121: O-045 Full Objective Re-check

Re-check of the O-045 Full Objective Check after the I-094 repair, under C-120's frozen scope lock and the common Re-check After Remediation rules (Full mode, same scope; second and final Check in the convergence limit).

**Independence.** This session did not plan, build, coordinate or repair any O-045 work, and is not the C-120 session. It wrote only gate outputs (`coverage/`, `junit.xml`, package `dist/` folders, example builds), the official health snapshot, a throwaway probe in its scratchpad, this record and the I-094 resolution.

**Baseline.** HEAD `b9a893f2` on `o045-answers`. `git diff 129777ee..HEAD --stat` (C-120's commit to HEAD): 4 files, +9/-5 — the `stateOf` README row, the `stateOf` doc comment in `src/api/scene.ts` (comment lines only, no code), the I-094 history entry and the router `issue:` line. Nothing else changed since C-120's reviewed head `40a65cc0` apart from the C-120 commit itself (records only). Not a worktree lane. The uncommitted owner trial in `packages/astraeus/src/app/SkyView.ts` (I-026) was present, as in C-120, and not reviewed or touched; untracked `docs/prds/` and `docs/research/` were not read. Times UTC.

**Verdict: CLEAR.** The README row and doc comment now match what `stateOf` returns for every body kind probed; all gates pass fresh.

## Closure Map Of Prior Issues

| Issue | State |
|---|---|
| I-094 (`stateOf` documented as giving velocity for every body) | Closed: verified by this Check |

No owner acceptances or exceptions exist on O-045 (all four Tasks have `owner_validation.required: false`; Task-check waivers are not owner decisions under Closure Rules), so no `carried_forward` entries are needed.

## Admission Ledger

| Re-check item | Prior Issue / claim | Frozen cell (C-120) | Allowed result |
|---|---|---|---|
| README `stateOf` row says which bodies return velocity | I-094; repair claim | SC-Documentation / T-188 row, `stateOf` cell | Proven or Issue |
| `stateOf` doc comment says the same; "peak speed" no longer implies any body's speed | I-094 Proof Needed 1-2 | SC-Documentation / T-188 row | Proven or Issue |
| Velocity per body kind (I-094 reproduction) | I-094 Evidence scenario | SC-Position / T-185.1 cells: earth, moon, mars, jupiter, io, swift-tuttle, elements body, sun, path | Proven or Issue |
| API reference doc-comment test and hand-off gates | I-094 Proof Needed 3 | Gates | Pass or Issue |
| Remediation touched no other claim or code | repair claim (grep of README, CHANGELOG, Design.md) | SC-Documentation | Proven or Issue |

Extra probe cells (Europa, Ganymede, Callisto, Titan, Phobos, Saturn, provider-based paths) have no exact frozen cell; their results are recorded as observations only.

## Re-check Matrix

| # | Requirement | Evidence | Result |
|---|---|---|---|
| I-094 reproduction / SC-Position | Which bodies return `velocityKmS` at HEAD | Probe `<scratchpad>/probe/velocity.test.ts` (Vitest, repo setup file with planet series and moon fits loaded), `stateOf(id, 2016-06-03T07:13:11.5Z)`: **undefined** for sun, earth, moon, mars, jupiter, swift-tuttle, elements body `rock`, path without velocities; **3-vector** for io and a path with sampled velocities. Positions finite for every body. Same as C-120's reproduction: behaviour unchanged, only the documentation moved | Proven |
| SC-Documentation (README:65) | Row says `positionKm` always; `velocityKmS` only where the source gives one, "check it before use"; names paths with velocities and a fitted moon (Io); names planets, Earth, the Sun, built-in Swift-Tuttle and elements bodies as position only | Each named case matches the probe; the rest of the row (centres, `bad-time`, `missing-data`, example) is unchanged from C-120 and still true | Proven |
| SC-Documentation (`scene.ts:381-386` doc comment) | Same statement; "such as a peak speed" removed, now "such as a distance from the Sun" | Diff and probe agree; the API reference page is generated from this comment and `packages/astraeus-site/tests/apiReference.test.ts` passes in `npm test` | Proven |
| No other velocity-for-every-body claim | grep `velocity` over `packages/astraeus/README.md`, `CHANGELOG.md`, `.savepoint/Design.md` (hits: README:53, README:65, Design.md:38 "composed states carry position only") | README line 53 (`addTrajectory` samples' optional `velocityKmS`) and `{ kind: "speed" }` readouts concern paths only; no sentence promises velocity for any body | Proven |
| File reality | Files named in the I-094 repair entry exist and were the ones changed | `git diff 129777ee..HEAD --stat` | Proven |

Every other C-120 matrix cell rests on code, tests and data that are byte-for-byte unchanged since C-120 (the only source edit is comment text), and the fresh full gate below re-proves them.

## Gates (fresh, 2026-10-29, sequential, 10:41-10:44 UTC)

A source file changed (comment only), so the full gate was rerun rather than reused (verification policy, metadata-only rule).

- `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok (site, chunk-size warning only).
- `npm test` (junit): 144 files, 1886 passed, 1 skipped.
- `npm run test:full`: 144 files, 1886 passed, 1 skipped; coverage statements 91.66%, branches 85.98%, functions 91.93%, lines 94.3% (identical to C-120).
- `npm run check:engine-alone`: pass in 19.4 s (962 passed, 1 skipped).
- `npm run check:pack`: pass; `astraeus` 444 files (limit 450), 7.04 MB packed, 8.88 MB unpacked; all eight packages under limits.
- `npm run check:node-consumer`: pass (2 tests).
- `git diff --check 129777ee..HEAD`: clean.
- `check:browser`: not rerun. C-120's run (`docs/evidence/browser-20261029T102724Z/`, 8/8) stands: the only source change since is comment text, which does not reach the bundled runtime. `measure:example` likewise stands from C-120 for the same reason. No screenshots.

## Code Health

`savepoint health check O-045` after the full gate: snapshot `sha256:6091b402a569be906abd95868b56c42b33ca5f36f4a6298b260f29a07b2f42bb` (created). Verdict: "Code Health does not block clearance." Complexity, coverage, dependency vulnerabilities, duplication and tests: reported only, no finding. Supporting evidence only.

## Issues

None. No materiality actions are required.

## Owner Validation

None required for any O-045 Task.

## Closure

I-094 is closed as `verified` by this Check. All four O-045 Tasks are `done`, this mandatory Objective Check is current and `CLEAR`, and no material Issue linked to it remains open: the owner may accept the O-045 outcome and close the Objective.

## Observations (non-blocking)

1. **Which moons give velocity.** Outside the frozen cells, the probe shows every moon from fitted data gives velocity (Europa, Ganymede, Callisto, Titan, Phobos as well as Io), while Earth's Moon gives position only. The new wording ("a moon from fitted data (Io)") is true, but a reader may take Io as the only one, and Earth's Moon is not in the position-only list. A later doc touch could say "a moon from fitted data (Io, Titan, Phobos and the other planets' moons); Earth's Moon gives position only".
2. **Provider-based paths.** A path given by `provider` returns velocity exactly when the provider's State carries it (probe: provider with velocity → its vector; without → undefined), consistent with "whose samples or provider carry velocities".
3. **Sampled-path velocity is the interpolant's.** A path's `velocityKmS` between samples is the derivative of the cubic Hermite interpolant, not a blend of the sample velocities (probe with made-up samples inconsistent with their positions gave `[-0.475, -1, -1.5]` at the midpoint, matching 1.5·Δp/h − (v0+v1)/4). Pre-existing behaviour, outside O-045.
4. C-120 observations 1-7 stand unchanged (no code change since).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — unchanged from C-120: `sceneFraming.ts` `CAMERA_FOV_DEG = 45` / `FAR_PER_REACH = 2.5` repeat `AstraeusScene.tsx:154` `fov: 45` and `scene.ts` `reach * 2.5`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — unchanged from C-120: the `#bodyObject` label-limit condition in `scene.ts` is one ~350-character line. The I-094 repair itself is small (two lines of docs).
