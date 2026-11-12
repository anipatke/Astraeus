---
id: C-178
scope: {kind: objective, id: O-072}
result: NEEDS WORK
checked_by: {role: checker, session: o072-check-20261112}
executed_session: o072-run-20261112
checked_at: '2026-11-12T12:24:53Z'
health_snapshot: sha256:48396bf681f8fd16712e852fce123a9346dc194dd6f41282d720ade7acfb49d3
reviewed:
  base_commit: 7cb30f19
  head_commit: 8f9ec36c
  files: [packages/astraeus/src/app/CameraController.tsx, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/tests/sceneCamera.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, docs/release-notes-0.9.1.md, .savepoint/Design.md]
  dependencies: []
issues: [I-177]
unmet: [SC2]
supersedes: null
---

# C-178: O-072 Full Objective Check

Fresh session; did not plan or build O-072. Scope: O-072 and its one Task T-312 (done under the owner's check waiver, `o072-run-20261112`). Diff `git diff 7cb30f19..HEAD` (040e8dd4 planning, e143eb45 build, 8f9ec36c Design reconciliation): 3 engine source/test files, README (4 rows), CHANGELOG, release notes, Design (one sentence), records.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (n/a: no server, subprocess or network in the change; the provider boundary is a host callback, covered as SC2 cells)
- [x] Workflow And Side-Effect Check Lock (n/a: one pure per-frame step, no persistence or artifacts)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: O-072 SC1 (reduced-motion camera), SC2 (README facts), SC3 (I-176 recorded, not fixed), SC4 (CHANGELOG `Unreleased` + `docs/release-notes-0.9.1.md`, no bump/tag/publish); T-312 Done When; guardrails API-04, API-05, API-07, ARCH-02, CODE-02, TEST-01..03, STYLE-07, STYLE-10; full gate + browser gate.
2. Changed entry points: `resolveCamera(..., up, reducedMotion = false)` (`CameraController.tsx` 211-243), its one caller `stepAndPoseCamera` (`sceneFrame.ts` 211); public `Scene.stateOf`, `addTrajectory({ provider })`, `addBodyFromElements`, `camera.fitOrbit`, `handle.setCamera` as documented in the README rows changed.
3. Relied on: `prefersReducedMotion()` (`skyFigures.ts` 68), `assertUtcUnixMs` (`core/state.ts` 41), `toUtcMs` (`api/time.ts` 8), provider wrapper (`api/planPaths.ts` 97-110), the ecliptic matrix (`core/twoBodyAdapter.ts` 57), `CAMERA_FOV_DEG` (`sceneFraming.ts` 58).
4. Matrix below; n/a cells carry reasons.
5. Admission: a README sentence this Objective added that a public call contradicts is an SC2/API-07 Issue.

## Coverage matrix

Harness: a scratch vitest file in a detached worktree of HEAD (and of HEAD with the two `src/app` files restored to 7cb30f19), outside the checkout, removed after the run.

| Row | Cells | Result |
|---|---|---|
| SC1 `resolveCamera` reduced on | dt 0, 0.016, 0.5, 10 s; distance 16->4, azimuth -3->3 (wrap), elevation -> -0.7, transition [5,0,-1e9] | Pass: all on target after one call (azimuth equal mod 2pi), transition 0, targetAbsolute = focus |
| SC1 reduced off (independent oracle `exp(-5 dt)`) | same four dt | Pass: distance, elevation, transition equal the closed-form decay to 1e-9; dt 0 leaves them unchanged |
| SC1 default parameter | omitted arg | Pass: off (unchanged behaviour) |
| SC1 look-out state | reduced on with `lookOut` set | Pass: no throw, angles land, camera at body |
| SC1 all request paths | setCamera, view rule, Go to framing, visitor picks/zoom | Pass by trace: every eased move is a target set then decayed in `resolveCamera`, the only caller is `sceneFrame.ts` 211; the only other camera decay in `src/app` is none (`grep Math.exp(-` finds only this and pinch zoom factor); look-out requests are already instant (`sceneCamera.ts` 159) |
| SC1 TEST-02 | new table test against unfixed source | Pass: 4 failed (the reduced-true cases), 25 passed; on HEAD 29 passed |
| SC2 obliquity | matrix value | Pass: acos(m[8]) = 84381.4060"; JPL diff 0.2036 urad, 30.46 km at 1 au |
| SC2 time rule, body | `stateOf("earth"/"moon", t+0.5)`; `stateOf("earth", 1e16)`; NaN | Pass: RangeError, RangeError; NaN is `SceneError bad-time` (not a "number" case the sentence covers) |
| SC2 time rule, samples path | `stateOf(samplesPath, t+0.5)` | Pass: RangeError |
| SC2 time rule, provider path | `stateOf(providerPath, t+0.5)` | **Issue I-177**: no throw; host `stateAt` receives 1767312000000.5 with `center` |
| SC2 provider contract | calls during `addTrajectory`; `stateOf` | Pass at add: 255 calls, all whole ms, all with `center`. `stateOf` also passes `center` (not in the README's "when" list; folded into I-177) |
| SC2 State shape | Float64Array, velocity optional, `orientation: null` | Pass: a State without velocity works; a plain-array `positionKm` is also accepted (observation) |
| SC2 fov 45 | `CAMERA_FOV_DEG = 45`, `camera.fov = lookOut?.fovDeg ?? CAMERA_FOV_DEG` (`CameraController.tsx` 270) | Pass |
| SC2 elements colours | option vs none | Pass by source: line `color || visual.material.color` (`sunOrbit.ts` 119,127); label from `looks` over catalogue colour (`planBodies.ts` 181, 305; `catalogueItem.ts` 15); dot `createMarker(asset, layer)` no override (`BodyView.tsx` 52, `bodyDraw.ts` 67); default `#9fe3ff` (`elementsBody.ts` 16) |
| SC2 anchor labels | default; labels switch | Pass by source: `showAnchorLabels: labelStart(definition) === true && ...` (`App.tsx` 211); switch drives anchors (`displaySwitches.ts` 59) |
| SC2 reduced-motion row | `handle.setCamera` row | Pass; no other README row says the camera eases |
| SC3 | I-176 exists, open, API-05; no error-type change in diff | Pass |
| SC4 | CHANGELOG `## Unreleased` entries; release notes in 0.9.0 shape; `version` 0.9.0; data peers `>=0.9.0 <0.10.0` (8/8); no new tag | Pass |
| Design | `Host-page behaviour` sentence matches code | Pass |
| Text classes, serialization, output sinks | n/a: no text, parser or CLI output in scope |

## Adversarial pass

Bypass: no second camera ease outside `resolveCamera`; reduced-motion read is the one `prefersReducedMotion()` (STYLE-07). Boundary: dt 0 with reduced on still lands (a first frame cannot leave a glide pending). Wrap: azimuth across +/-pi lands on an equivalent angle. ARCH-02: State untouched. Independent oracle used for the off path rather than the test's `not.toBe(target)`. The provider-path time probe is the bypass that breaks SC2.

## Gates

Run 2026-11-12, HEAD 8f9ec36c, working tree = HEAD for package files (only the owner's O-071 Objective.md edit and untracked docs folders differ).

| Gate | Result | Time (limit) |
|---|---|---|
| `git diff --check 7cb30f19..HEAD` | clean | |
| `npm run test:full` | exit 0; 255 files, 3,813 passed, 2 skipped; statements 92.92% | 77 s (105) |
| `npm run check:engine-alone` | pass | 21 s (40) |
| `npm run check:pack` | pass, all nine packages inside limits | 18 s (30) |
| `npm run check:node-consumer` | pass | 5 s (15) |
| `npm run measure:example` | exit 0; first-open 1,764,440 bytes raw, 507,316 gzip (0.9.0: 1,759,084 / 505,483) | 3 s |
| `npm run check:browser` (run once, 12:25:53Z-12:32:04Z, after the health check, nothing else running) | **failed**, environment: 11 of 12 steps pass; `smoke` 17 of 18 views ok, `showers-geminids` phone timed out (`locator.waitFor` 60 s) with 42 `net::ERR_NETWORK_CHANGED` console lines (the host network changed mid-run; Perseids desktop/phone ok right after). Evidence `docs/evidence/browser-20261112T122553Z/`, logs `/tmp/astraeus-check-logs-6x19yE/` | 371 s (320; smoke 184 s over its 170 s, warning only) |

## Code Health

`savepoint health check O-072` once, after the full gate: snapshot `sha256:48396bf681f8fd16712e852fce123a9346dc194dd6f41282d720ade7acfb49d3` (created). "Code Health does not block clearance": complexity, coverage, dependency vulnerabilities, duplication and tests all optional, no finding. Supporting evidence only.

## Browser gate

The one browser run failed on a network-change error in one Geminids phone view. O-072 changes only the camera's per-frame decay (reduced motion is not emulated headless) and the README, so the failure is not attributed to O-072, and no Issue is opened (not a reproducible code defect). The browser gate is **unverified** for this Check, not passed: the recheck after I-177 must run `npm run check:browser` once and pass, since a failed run cannot be reused (browser policy).

## Issues

- **I-177** (SC2, API-07): the README says a fractional time throws a `RangeError` and that the engine calls `stateAt` with whole-millisecond times; for a `provider` path `stateOf` forwards a fractional time to the host's `stateAt` and does not throw. Proof Needed: the README states the provider-path behaviour exactly (or the engine rejects the fractional time before the provider), with a table test of `stateOf` on a body, a `samples` path and a `provider` path.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-177 | Low (needs a provider path and an unrounded host time) | Low-Medium (a README promise the engine does not keep; a provider written to it can get a fractional time) | Low | Fix now: one README clause plus a table test, before 0.9.1 notes are final |

## Observations (non-blocking)

- The T-312 test's off case asserts only "not yet at target", not the decay the Done When names; this Check's oracle covered it. Off-path code is unchanged.
- `prefersReducedMotion()` now runs `matchMedia` every frame; cheap, but a cached `MediaQueryList` would avoid it.
- `stateOf(providerPath, 1e16)` throws `RangeError: Invalid time value` from building the `bad-time` message (`new Date(1e16).toISOString()`, `scene.ts` 558), not the intended `SceneError bad-time`; pre-existing, relevant to I-176's table test.
- README asks providers for a `Float64Array`; plain arrays are accepted. Stricter than needed, safe.

## Owner decisions carried forward

T-312 check waiver (owner, 2026-11-12T12:15:03Z): applies; it covers only the optional Task Check, not this Objective Check.

## Owner validation still needed

Optional per T-312 User Check: reduced motion on `localhost:5490`.

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
