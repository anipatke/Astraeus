---
id: C-162
scope: {kind: objective, id: O-064}
result: CLEAR
checked_by: {role: checker, session: o064-recheck-20261110}
executed_session: o064-run-20261110
checked_at: '2026-11-10T02:55:30Z'
health_snapshot: sha256:830718da4a7868366939ce9e73817adfd21cc225f839c0ef01d6717d8073e317
reviewed:
  base_commit: e6e6cd8b
  head_commit: 754c2798
  files: [packages/astraeus/src/core/startView.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/viewerCamera.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/objectives/O-064-look-out-from-a-body/tasks/T-292-let-apps-open-turn-and-read-the-sky-view.md, .savepoint/issues/I-162-camera-lookout-opening-accepts-a-half-or-misspelt-direction-silently.md, .savepoint/issues/I-163-settimeline-takes-a-rate-in-milliseconds-without-a-word.md]
  dependencies: []
issues: []
supersedes: C-161
---

# C-162: O-064 Full Objective Re-check

**Verdict: CLEAR.** C-161's one blocking Issue, I-162, is repaired: `scene.camera.lookOut` now checks its `look` through the shared `validateSkyLook` / `validateSkyPosition` (`src/core/startView.ts`), and `setCamera` uses the same `validateSkyPosition` for an object direction. Every shape I-162 lists throws `bad-camera` at the call and leaves the prior opening pose untouched; the defaults (`lookOut(body)`, `lookOut(body, {})`, partial `{ fovDeg }` or `{ direction }`) still hold; `setCamera` refuses and accepts exactly what it did in C-161. All gates pass fresh on 754c2798. The browser run and C-161's other evidence are reused where the inputs are unchanged (below). The owner may record O-064 done (Task and Objective status remain the owner's call). I-163 stays open as the owner's deferred follow-up ("Later in 0.9.0"), not material to O-064.

## Closure Map Of Prior Issues

| Prior Issue | State | Why |
|---|---|---|
| I-162 (blocking, C-161) | **Closed (verified by this Check)** | Each Proof Needed shape refused with `bad-camera` at the call through the public API; defaults hold; one position check serves both entry points; regression test present in `tests/lifecycle.test.ts` ("… as setCamera does (I-162)"), run on both lifecycle drivers in `test:full`. |
| I-163 (follow-up, C-161) | Still open, outside the scope lock | Owner deferred "Later in 0.9.0" (fd6c3f52, 2026-11-10T02:47:40Z); no code changed for it; not linked as material to O-064. |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-161's scope lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-161's matrix re-run; I-162 row re-tested)
- [x] Finite External-Boundary Matrix (as C-161; unchanged)
- [x] Workflow And Side-Effect Check Lock (not applicable beyond the camera request order, as C-161)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here)
- [x] Perform The Adversarial Pass (limited to the frozen cells and the remediation's code paths)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

C-161's numbered scope lock (items 1 to 5) is the frozen scope; no axis, layer or interpretation was added. Changed since C-161 (`git diff e6e6cd8b..754c2798`): the files in `reviewed.files`, plus C-161's own record, I-162/I-163 records and the browser evidence folder C-161 wrote. No browser script, site, example, `tools/`, `src/app/` or `src/shell/` file changed (`git diff e6e6cd8b..HEAD --stat -- packages/astraeus-site examples tools docs/BROWSER_CHECKS.md packages/astraeus/src/app packages/astraeus/src/shell` is empty).

## Admission Ledger

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| 1 | Opening refuses each I-162 shape | I-162 | SC2 opening x input shape {half pair, empty, array, misspelt key, extra key, wrong type} | `bad-camera`, prior pose kept |
| 2 | Opening refuses bad `look` (non-object, unknown key, non-number `fovDeg`) | I-162 | SC2 opening x {wrong type, misspelt key, extra key} | `bad-camera` |
| 3 | Opening defaults and boundaries | I-162 Proof Needed; C-161 SC2 opening row | SC2 opening x {missing, boundary fov 5/100, dec ±90, ra wrap} | accepted with 0 / 0 / 60 defaults |
| 4 | Opening unknown body, last call wins | C-161 SC2 opening row | SC2 opening x state {opening vs host call} | `unknown-body`; last call wins |
| 5 | `setCamera` unchanged (remediation path `lookDirection`) | repair claim "setCamera behaviour unchanged" | SC2 setCamera rows (18 bad shapes; object/flat/id/keep/default) | as C-161 |
| 6 | `setStartView` sky pose bypass | C-161 SC3 validation row | SC2/SC3 x {half pair, extra key} | `bad-camera` |
| 7 | Input copied, not aliased | C-161 SC3 "input mutated after check" | SC3 validation | stored pose unchanged |
| 8 | C-161's whole harness re-run | all C-161 matrix rows | every C-161 cell | as C-161 |

## Coverage Matrix (re-run)

Independent harness in this session's scratchpad (`probe/i162.probe.test.ts`, 51 cases, written for this re-check; plus C-161's `probe/o064.probe.test.ts` and `probe/extra.probe.test.ts`, re-run unchanged), own Vitest config, importing repo source by absolute path; nothing written to the repo. Direction oracle: the textbook RA/Dec unit vector written in the harness. Result: 147 cases, 146 pass; the one failure is C-161's known probe-design artifact (`%E0` share-link text, already decoded by `URLSearchParams`; see C-161 SC3 share-link row), unchanged.

| Ledger | Case | Expected | Actual | Class |
|---|---|---|---|---|
| 1 | `direction` `{raDeg:10}`, `{decDeg:10}`, `{}`, `[]`, `null`, `[10,20]`, `"betelgeuse"`, `5`, `{ra,dec}`, `{raDeg,decDeg,x}`, `{raDeg:"1",…}`, dec 90.001, ra Infinity, dec NaN | `bad-camera`, prior `setStartView` pose kept | all | Proven |
| 2 | `look` `{fov:40}`, `{fovDeg:null}`, `{fovDeg:"40"}`, fov 4.999 / 100.001 / NaN, extra key beside valid fields, `{lookOut:"mars"}`, `"x"`, `null`, `[]`, `5`, `true`, a function | `bad-camera`, prior pose kept | all | Proven |
| 1-2 | C-161's original reproduction (`extra.probe.test.ts`, public `index.ts`): the ten I-162 shapes | `bad-camera` | all ten `bad-camera`, `camera.pose` undefined (was accepted with 0 / 60 in C-161) | Proven |
| 3 | `lookOut("earth")`, `(…, undefined)`, `(…, {})`, `{direction: undefined, fovDeg: undefined}` | 0, 0, 60 | 0, 0, 60 | Proven |
| 3 | `{fovDeg: 40}`; `{direction:{raDeg:5,decDeg:6}}` (regression test); `lookOut(mars ref, {direction:{83.6,22}, fovDeg:40})` | given values, defaults for the rest | as expected (ra 83.6 to 1e-10; see Observation 2) | Proven |
| 3 | ra 370 / dec -90 / fov 5; ra -10 / dec 90 / fov 100 | ra 10 / 350, boundaries accepted | as expected | Proven |
| 4 | unknown body with and without a look; lookOut, then setStartView, then lookOut | `unknown-body`; last call wins | as expected | Proven |
| 5 | `setCamera` through `ViewerCamera` with a fake control: 18 bad shapes (half pair, `{}`, `[]`, `null`, misspelt, extra key, dec 91, direction = body / "" / unknown id, flat half pair, both forms, fov "40" / 4, misspelt `fov`, empty / unknown body) | `bad-camera`, nothing sent | all | Proven |
| 5 | object direction (vector vs oracle < 1e-12), flat pose 200/-40, object id `"mars"`, no direction while looking out keeps 200/-40 and sends no fov, no direction from orbit gives 0/0, ra 370 wraps to 10 | as C-161 | as C-161 | Proven |
| 6 | `setStartView` sky pose missing fov, missing dec, extra key | `bad-camera` | all | Proven |
| 7 | mutate `look.direction.raDeg` and `look.fovDeg` after the call | stored 1 / 2 / 30 | 1 / 2 / 30 | Proven |
| 8 | C-161 harness (`o064.probe.test.ts`): SC1 direction/pan/zoom/far plane, SC3 validation and share link, SC4 menu | as C-161 | 95 of 96 pass; the one is the known `%E0` artifact | Proven (as C-161) |

Outcome coverage (SC1 to SC5, T-291..T-293 Done When, ARCH-02/03/06, API-01..07): C-161 classed every row Proven except the I-162 cell. The repair touches only the opening's validation and `setCamera`'s object-direction check; the rows outside those code paths are unchanged code and pass again in the fresh `test:full` (which carries the frame, menu, DOM and link tests C-161 cited). SC2 "bad input throws `bad-camera` at the call (API-04, API-05)" is now Proven for both entry points; C-161's `unmet` list is empty. SC5 docs: README `lookOut` row and CHANGELOG "Unreleased" line state the new refusals. Design: the repair adds two checkers to `core/startView.ts`, which Design already names as owning the sky range checks; nothing architectural to reconcile. File reality: every file named in the T-292 repair note and I-162 history exists at HEAD.

## Commands And Results

All times UTC, wall clock, run once each from `/home/user/code/Astraeus` at 754c2798 (Node toolchain as C-161).

- `npm run lint` 02:49:37Z, 3.5 s, pass.
- `npm run typecheck` 02:49:41Z, 5.6 s, pass.
- `npm run build` 02:49:46Z, 2.4 s, pass.
- `npm run test:full` 02:49:49Z, 71.8 s, pass: 238 files, 3,410 passed, 2 skipped (C-161: 3,408; +2 = the I-162 test on both drivers); statements 93.09 %; fresh coverage and `junit.xml`.
- `npm run check:engine-alone` 02:51:01Z, 22.4 s, pass.
- `npm run check:pack` 02:51:23Z, 14.6 s, pass.
- `npm run check:node-consumer` 02:51:38Z, 4.7 s, pass.
- `npm run check:react-consumer` 02:53:13Z, 5.6 s, pass (react 19.3.1; run because the packed engine source changed).
- `npm run check:browser`: **not rerun; reused** from C-161 (02:40:19Z to 02:44:30Z, all eleven steps exit 0, `docs/evidence/browser-20261110T024019Z/`), per the browser policy (one run per change; a later check reuses it). No browser script, runner, site, example or UI file changed; the only browser-reached call touched, the synthetic look-out scene's `scene.camera.lookOut("earth", { direction: { raDeg: 281.6, decDeg: -23 }, fovDeg: 60 })`, is a well-formed shape whose result is unchanged, and `syntheticScenes.test.ts` passes in `test:full`.
- `savepoint health check O-064 .` 02:53:18Z, after the full gate: **new** snapshot `sha256:830718da4a7868366939ce9e73817adfd21cc225f839c0ef01d6717d8073e317` (created; C-161's snapshot not reused because source changed, so the metadata-only reuse rule does not apply), "Code Health does not block clearance"; complexity, coverage, dependency vulnerabilities, duplication, tests: no finding.
- `git diff --check e6e6cd8b..HEAD`: clean.
- `savepoint resume`: loads (after writing this record).

## Issues

None. No new Issue: nothing failed inside the frozen scope lock.

No materiality actions are required.

## Observations (non-blocking)

1. Error precedence changed slightly for the opening: `validateSkyLook` now runs before `#start`'s editable and `unknown-body` checks, so `lookOut("not-added", { fov: 40 })` reports `bad-camera` rather than `unknown-body`, (probed: `bad-camera`); by the same order a malformed look on a scene that can no longer be edited would report `bad-camera` before the not-editable check (read from the code, not probed). Both still throw at the call; no criterion fixes the order.
2. Right ascension wrapping `((ra % 360) + 360) % 360` turns 83.6 into 83.60000000000002 in the stored pose; this predates the repair (C-161's opening also went through `wrapAzimuth`) and the repair does not change it. A later tidy could skip the wrap for values already in 0..360.
3. C-161 observations 1 to 7 stand unchanged (observation 7, the trailing blank line in the T-293 record, lies outside this re-check's diff).

## Owner Validation Still Needed

- None for O-064's behaviour. T-293's owner look ("looks good go", 2026-11-10T02:36:42Z) covered the camera menu and the look-out view; the repair changes neither (only the opening's input checking), so it still applies.
- O-064 closure is the owner's: all three Tasks are `done`; this Check is CLEAR; I-162 is verified; I-163 is a deferred follow-up not material to O-064.

## Prior Owner Decisions

No Check-linked structured acceptance or exception exists on O-064 (C-161 recorded none), so there is no `carried_forward` entry to write. The owner's `check_waiver` on T-291, T-292 and T-293 (2026-11-10T01:37:08Z) waives only the optional Task Checks; this Full Objective Check reviewed all three Tasks. The I-163 deferral is an Issue disposition outside the scope.

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
