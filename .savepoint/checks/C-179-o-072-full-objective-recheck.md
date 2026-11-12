---
id: C-179
scope: {kind: objective, id: O-072}
result: CLEAR
checked_by: {role: checker, session: o072-recheck-20261112}
executed_session: o072-run-20261112
checked_at: '2026-11-12T12:45:30Z'
health_snapshot: sha256:a8e2a0d599e12b27a9f8265051e602d1bc9b698566723e7bc9607f69129f12bb
reviewed:
  base_commit: 7cb30f19
  head_commit: ceb545af
  files: [packages/astraeus/src/app/CameraController.tsx, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/tests/sceneCamera.test.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/tests/fractionalTime.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, docs/release-notes-0.9.1.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: C-178
---

# C-179: O-072 Full Objective recheck

Fresh session; did not plan, build or repair O-072 and did not write C-178. Recheck after remediation of I-177 (commit ceb545af, owner decision 2026-11-12: the engine refuses a fractional time before a provider's `stateAt`). Scope lock and matrix are C-178's, frozen; full O-072 diff `git diff 7cb30f19..HEAD`.

## Closure map of prior Issues

| Issue | Status |
|---|---|
| I-177 (SC2, API-07: README time rule wrong for a provider path) | **Closed, verified** by this Check |
| I-176 (API-05: fractional time throws a plain `RangeError`) | Still open by design (SC3: recorded, not fixed here); unchanged |

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope (C-178's lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-178's cells re-run where the repair touches them)
- [x] Finite External-Boundary Matrix (n/a, as C-178: the provider boundary is a host callback, covered as SC2 cells)
- [x] Workflow And Side-Effect Check Lock (n/a, as C-178)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Repair under review

`git diff 8f9ec36c..HEAD -- packages docs`: `planPaths.ts` provider wrapper calls `assertUtcUnixMs(timeUtcMs)` before the host's `stateAt` (one place every engine call reaches); README `addTrajectory` row adds `stateOf` to the `center` cases and "a fractional time is refused with the `RangeError` above before it reaches `stateAt`"; CHANGELOG `Unreleased` Fix entry; release-notes line; new `tests/fractionalTime.test.ts`. No `src/app` file changed since C-178.

## Admission ledger (recheck)

| Item | Prior claim | Frozen cell | Allowed result |
|---|---|---|---|
| Provider path, fractional `stateOf` | I-177 | SC2 time rule, provider path | RangeError, provider not reached |
| Body / samples path, fractional `stateOf` | I-177 Proof Needed | SC2 time rule, body; samples path | RangeError (unchanged) |
| `center` cases | I-177 (folded) | SC2 provider contract | README lists every `center` case |
| Whole ms still reach provider | remediation code path | SC2 provider contract | unchanged time, `center` passed |
| SC1, SC3, SC4, Design | C-178 met | their C-178 rows | still met |

## Coverage matrix (re-run)

Harness: a detached git worktree of HEAD in the scratchpad (its `node_modules` linking workspace packages to the worktree's own `packages/`, confirmed by `readlink`), a scratch probe test, then the same with `planPaths.ts` restored to 8f9ec36c; worktree removed after.

| Row | Cells | Result |
|---|---|---|
| I-177 Proof: `tests/fractionalTime.test.ts` on unfixed `planPaths.ts` | 4 tests | **1 failed** (provider row: "expected undefined to be an instance of RangeError"), 3 passed |
| I-177 Proof: same test at HEAD | 4 tests | 4 passed |
| Independent probe, `stateOf` fractional (dt +0.5, +0.25, +0.999, -0.5) on `earth`, `moon`, samples path, provider path; provider `plane` EQJ and `ecliptic-j2000`; Earth-first and Sun-first scenes | 64 cells | Pass at HEAD: every cell `RangeError` (not `SceneError`); provider `stateAt` called 0 times. Moon in a Sun-first scene is `unknown-body` (not added; n/a). Unfixed source: every provider cell returns a State (fails), body/samples cells unchanged |
| Whole ms through provider | number, `Date`, ISO text with `.123Z` | Pass: provider receives exactly `T0+DAY+7`, `+3`, `+123`, with `center: "earth"`; returned `timeUtcMs` unchanged |
| Calls at `addTrajectory` | 255 calls | Pass: all integer, as C-178 |
| `center` cases (README: plans the line, checks its reach, answers `stateOf`; sometimes without) | source trace | Pass: with `center`: `planPaths.ts` 107 (line), 171/193 (reach), `scene.ts` 562 (`stateOf`), `sunOrbit.ts`, `sunCentredSources.ts`, `PathView.ts`; without: `mission.ts` 91/97/106, `trackedMetrics.ts` 26, `TrackedBodyView.ts` 175 |
| Viewer regression (the wrapper now throws on fractional times the viewer might pass) | per-frame callers without `center` | Pass: viewer times come from `core/clock.ts` (`Math.trunc` then `assertUtcUnixMs`, lines 45-46, 84), and a `samples` path already asserted the same rule in `sampledTrajectory.ts` 74; the browser gate below passed with 0 error lines in every step |
| Out of range / NaN / out of bounds on provider | 1e16, NaN, bounds+1 day | `RangeError` (from the message build, C-178 observation, pre-existing), `SceneError bad-time`, `SceneError bad-time`; unchanged by the repair; README sentence "a fractional or out-of-range number throws a plain `RangeError`" holds for 1e16 |
| README sentences vs source | `addTrajectory` row | Pass: the rule and `center` list match the trace above; CHANGELOG and release notes say the same |
| SC1 reduced-motion camera | C-178 rows | Pass: `src/app` unchanged since C-178 (`git diff 8f9ec36c..HEAD --name-only -- packages/astraeus/src/app` empty); `sceneCamera.test.ts` passes in `test:full` |
| SC2 other facts (obliquity, fov 45, elements colours, anchor labels, reduced-motion row, State shape) | C-178 rows | Pass: those README sentences untouched by the repair (the diff is one clause in the `addTrajectory` row) |
| SC3 | I-176 open, no error-type change | Pass: I-176 `status: open`; the repair throws the existing plain `RangeError` |
| SC4 | CHANGELOG `## Unreleased` top section; `docs/release-notes-0.9.1.md`; `version` 0.9.0; no tag | Pass |
| Design | no time rule in Design.md (grep `fractional`/`whole millisecond`: none) | Pass: contract fix, not architecture; no reconciliation needed |

## Adversarial pass

Bypass: every engine path to a host provider goes through the one wrapper (`trajectory.stateAt` built in `providerBody`), so line planning, reach, sampling and `stateOf` all share the guard; the guard sits before `rotatedState`, so the ecliptic path is covered too (probed). The guard does not round, so no time is silently changed. The repair adds no new `SceneError` code (I-176 stays separate, as Proof Needed asks).

## Gates

Run 2026-11-12, HEAD ceb545af; working tree equals HEAD for packages (only the owner's O-071 Objective.md edit and untracked docs folders differ).

| Gate | Result | Time (limit) |
|---|---|---|
| `git diff --check 7cb30f19..HEAD` | clean | |
| `npm run test:full` (12:37:02Z-12:38:16Z) | exit 0; 256 files, 3,817 passed, 2 skipped; statements 92.92%, branches 89.47%, functions 93.74%, lines 95.01% | 75 s (105) |
| `npm run check:engine-alone` | pass | 25 s (40) |
| `npm run check:pack` | pass, all nine packages inside limits | 15 s (30) |
| `npm run check:node-consumer` | pass (11 tests) | 5 s (15) |
| `npm run measure:example` | exit 0; first-open 1,764,446 bytes raw, 507,330 gzip (C-178: 1,764,440 / 507,316) | 3 s |
| `npm run check:browser` (once, 12:39:27Z-12:44:41Z, after the health check, nothing else running) | **pass**, exit 0, 12 of 12 steps, 0 error lines; smoke 125 s (170) | 313 s (320) |

Browser evidence: `docs/evidence/browser-20261112T123928Z/` (logs `/tmp/astraeus-check-logs-8JLDlk`). This replaces C-178's failed environmental run, which stays as cited evidence at `docs/evidence/browser-20261112T122553Z/`.

## Code Health

`savepoint health check O-072` once, after the full gate (12:39:16Z): snapshot `sha256:a8e2a0d599e12b27a9f8265051e602d1bc9b698566723e7bc9607f69129f12bb` (created). "Code Health does not block clearance": complexity, coverage, dependency vulnerabilities, duplication and tests optional, no finding. Supporting evidence only.

## Issues

None. No materiality actions are required. I-177 closed as verified (Proof Needed met: the engine rejects a fractional time before a provider so the README sentence holds; the table test drives `scene.stateOf` on a body, a `samples` path and a `provider` path, asserts `RangeError` and no provider call, fails on the unfixed `planPaths.ts` and passes now).

## Acceptance classification

| Criterion | Classification |
|---|---|
| SC1 reduced-motion camera | Proven (C-178 evidence; code unchanged; test passes) |
| SC2 README facts | Proven (I-177 repaired; other facts unchanged) |
| SC3 I-176 recorded, not fixed | Proven |
| SC4 CHANGELOG and 0.9.1 notes, no bump/tag/publish | Proven |
| Full gate and browser gate | Pass |

## Observations (non-blocking)

- C-178's observations stand: the T-312 off-case asserts only "not yet at target"; `prefersReducedMotion()` reads `matchMedia` per frame; `stateOf(providerPath, 1e16)` throws `RangeError: Invalid time value` from the `bad-time` message build rather than the guard (relevant to I-176's table test); providers' plain-array `positionKm` is accepted.
- The new test asserts the error type and that the provider is not reached; it does not pin the message text, which is fine for the README's promise.

## Owner decisions carried forward

T-312 check waiver (owner, 2026-11-12T12:15:03Z): applies; scope unchanged (the I-177 repair is a direct repair under the Issue, not new Task work); it covers only the optional Task Check, not this Objective Check.

## Closure

Every owned Task (T-312) is done; this Objective Check is current and CLEAR; I-177 is resolved (verified). I-176 is SC3's deliberate open record, not a defect this Objective must fix. The owner may accept O-072.

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
