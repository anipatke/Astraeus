---
id: C-005
scope: {kind: objective, id: O-004}
result: NEEDS WORK
checked_by: {role: checker, session: o004-independent-20261006}
executed_session: t015-physical-burns-2026-10-06
checked_at: '2026-10-06T08:32:00Z'
reviewed:
  base_commit: 99b1558867b271d581aab683864e39821f27ac60
  head_commit: 99b1558867b271d581aab683864e39821f27ac60
  files:
    - tools/apollo11/anchors.ts
    - tools/apollo11/burn.ts
    - tools/apollo11/dynamics.ts
    - tools/apollo11/segments.ts
    - tools/apollo11/trajectory.ts
    - tools/apollo11/sampling.ts
    - tools/apollo11/validation.ts
    - tools/apollo11/reconstruct.ts
    - tools/apollo11/report.ts
    - tools/apollo11/config.json
    - tools/apollo11/run.mjs
    - tests/apollo11Reconstruction.test.ts
    - tests/missionScene.test.ts
    - src/core/sampledTrajectory.ts
    - data/apollo11/raw/anchors.json
    - data/apollo11/normalised/anchors.json
    - data/apollo11/generated/columbia.json
    - data/apollo11/generated/eagle.json
    - data/apollo11/generated/events.json
    - data/apollo11/generated/validation.json
    - docs/APOLLO11_SOURCES.md
    - docs/APOLLO11_RECONSTRUCTION.md
    - docs/ASTRAEUS_SPIKE_02.md
    - .savepoint/Design.md
    - tools/validate/browser-spike02.mjs
    - tools/validate/anchor-consistency.mjs
  dependencies:
    - package.json
    - package-lock.json
    - tsconfig.json
issues: [I-008]
supersedes: null
---

# C-005: O-004 Full Objective Check

**NEEDS WORK.** The source settlement and physical burns are supported, but the reconstruction still has an impossible speed: Columbia reaches about **73.55 km/s** on A-02>A-03 immediately after TLI. I-008 captures this introduced burn/coast integration defect. Both owned Tasks remain done. This Check does not authorize implementation repairs or close O-004.

## Independence and revision

This conversation did not build T-014 or T-015. It reviewed both Tasks, their owner board waivers, O-004, applicable Guardrails, the entire check method, source/test files, linked I-002/I-007 and C-004. It used independent probe scripts, a fresh full gate and fresh browser evidence. No Check has previously targeted O-004; C-004 targets O-002 and is not superseded.

HEAD contains no tracked implementation baseline: all project files are untracked. `git diff --check` is clean but vacuous for those files. Behavior, current source, pinned special-segment hashes and reproducible artifact hashes establish the reviewed state; a historical per-file diff cannot establish that runtime source was unchanged. Implementation was not edited during this Check. All named evidence/context files exist; no unexplained phantom files were found.

## Frozen scope lock

The initial lock was written before adversarial probes and is preserved in full at `docs/evidence/o004-scope.md`. No amendment or additional blocking axis was introduced. Its five numbered items define criteria/gates, files/entry points, relied-on workflow, matrix axes and admission boundary. The relevant scope is T-014 source settlement and T-015 physical burns plus every following coast and actual runtime output. Existing I-003/004/005 and arbitrary unsupported data/provider behavior are outside this Check.

## Coverage matrix

All rows were completed before deciding the verdict. Evidence: `docs/evidence/o004-check.mjs` with `o004-independent-check.json`; `o004-interpolation.mjs` with `o004-interpolation.json`; `o004-source-reading.json`; fresh `anchor-consistency.json` and `spike02-browser.json`.

| Row | Input/state/representation/boundary cells | Classification and evidence |
|---|---|---|
| S Source settlement | A-13 raw E, old W hypothesis, normalized value, A-12 forward/A-14 backward; A-05 raw vs override, status and bounded search | Passed. Independently downloaded NASA SP-238 PDF, SHA-256 `8b719250…6137d5d`; PDF page 86/Table 7-II reads ignition 170.09 E, cutoff 169.16 E, docking FPA 44.94. Correction note cites it. Fresh propagation predicts 170.75 E/170.01 E; corrected separation 29.986 km vs old 667.101 km. A-05 remains raw 44.94, owner-approved inferred 49.94, unchanged confidence/status; Sources §8 records six documentary searches and no independent docking state. A bounded-search record is the required deliverable; no claim of exhaustive absence is made. |
| B All twelve burns | Ignition/interior/cutoff; Earth/Moon reference; full vs half step; finite thrust and residuals; runtime burn peaks | Passed. Direct solve at 0.25 s and 0.125 s, every pair; largest position difference 0.00000303 km. Cutoff velocity residuals ≤0.000000590 m/s; position residuals 0.190760–454.706052 km are published. Accelerations 0.149–9.117 m/s², finite and compatible with this simplified model. LOI-2 1.669481 km/s Moon-relative; MCC-1 1.531620 Earth-relative. Named physical-pair test and generated data cover ignition/midpoint/cutoff and all twelve peaks. |
| C Burn→coast integration | Every modelled endpoint vs next coast start; ±1/±100 ms runtime neighbors, coast interiors and terminal anchors | Shared endpoint states pass: zero position/velocity step for all twelve handoffs. **Issue I-008**: post-TLI coast has 73.55 km/s; independent endpoint lower bound is 50.925476 km/s average. See Issue for exact reproduction. Other joins and target-anchor fidelity pass. |
| R Whole runtime | Both generated JSON files→SampledTrajectory; every one-second interval, exact endpoints/outside ±1 ms; off-grid post-TLI probes | Kinematic scan passes: Columbia 701,486 and Eagle 100,260 intervals, zero movement/derivative inconsistencies; outside throws TrajectoryOutOfRangeError. Columbia maximum derivative speed 73.549279 km/s, Eagle 2.697091. Post-TLI finite-difference speed at five seconds 73.543765 km/s. Physical outcome **Issue I-008**; consistency is not physical plausibility. |
| A Anchors and all sample gaps | Both vehicles, non-cutoffs/cutoffs, every gap at quarter/mid/three-quarter points, terminal anchors | Passed. 40 vehicle/anchor occurrences comprise 28 non-cutoffs and 12 cutoffs. Non-cutoff maximum unrounded position residual 6.657e-7 km. 7,047 held-out probes across all 39 segments, maximum 0.200568 km (≤0.25); all cutoff residuals are published. Existing residual and continuity regressions pass. |
| P Special paths | Descent, hold, ascent methods and serialized emitted samples | Passed. All three baseline SHA-256 values and counts match T-015, including hold's 22 samples. These outputs and special methods are preserved. |
| D Determinism/documentation | Raw/config→six complete output strings; repeated reconstruction, disk equality and input mutation; report/Sources/spike/Design | Passed. Two fresh in-memory reconstructions match each other and all six on-disk artifacts byte-for-byte; hashes match T-015. Input JSON stays unchanged. Report/spike/Design correctly disclose burn method, cutoff residuals, peaks and TLI correction; Sources describes A-13/A-05 outcomes. Architecture remains offline, generic endState feeds coast, runtime contract is intact. Documentary wording does not waive I-008. |
| F Failures/bypass | Zero/reversed duration, two reference bodies, zero/negative/NaN step; valid solve after failures; nonfinite direct state | Supported malformed duration/body/step paths throw RangeError; retry succeeds without residue. Direct helper accepts a NaN state and returns NaN: **nonblocking observation**, unsupported helper input never reached by pinned finite data and rejected by runtime finite-vector validation. No extra blocking interpretation added. Reconstruction preserves inputs. |
| V Browser/regression | Fresh Vite→Chromium; six mission epochs×two scales; focus/follow, seek/event jump, play/rates, Earth/Moon phases | Passed. 0 console/page errors, all six scale pairs equal, focus unchanged, 30 jumps. Rates approximately 0.995/99.986/1005.344/10016.153 simulated s/s. USNO lit 50.1/0.2/50.1/99.8%; all original core/orientation/scene tests pass. Headless SwiftShader evidence does not establish a human visual judgement. |

### Explicit non-applicable cells and external boundary

Text width/Unicode, sink color/cursor modes, authentication, billing, transactions, runtime network responses/redirects/retries and credentials are not involved in these offline scientific changes. Duplicate/empty/mixed-type raw data and arbitrary user-mutated solver states are pre-existing or unsupported paths outside the pinned mission dataset; numeric finite data and runtime representation boundaries are covered above. Backward integration is covered by existing parking/coast tests; burn reversal is rejected; terminal revival/post-failure/repeat are classified by bounds and retry probes. No new provider contract is under review.

Browser configured target and actual target both were `http://127.0.0.1:5199/`; a fresh server was started with strictPort (no silent reuse), then navigation and full successful render/control workflow completed. Initial Chromium sandbox launch failed before navigation or browser evidence writes; rerun with approved escalation succeeded. Refusal/non-success/redirect/timeout/cancellation/partial cleanup failures are N/A as product requirements: the runner's orchestration is unchanged, and O-004 promises successful scene evidence, not a resilient browser service. Documentary fetch was successful through curl; the web PDF viewer rejected its size, so a temporary pypdf installation read the downloaded table. That tool limitation did not become a product Issue.

## Workflow and side effects

| Order | Real operation / side effect | Failure timing and owner / final state | Cleanup and oracle |
|---|---|---|---|
| 1 | Read raw inputs/config, normalize and validate source overrides | Parse/guard errors occur before CLI output; runtime dataset is finite | Direct source comparison; normalisation tests and unmutated-input comparison |
| 2 | Plan segments, fit burns, integrate gravity, start coast from modelled end | Solver rejects invalid duration/body/step; valid retry works; pure computation has no file effects | All twelve half-step solves and endpoint checks; position-difference physical oracle exposes I-008 |
| 3 | Sample/pin/round, construct runtime, measure residuals and render report in memory | Constructor validates finite/sorted samples; bounds reject out-of-span evaluation | Every-gap probes, hashes, residual tests and full scan |
| 4 | CLI mkdir/write six artifacts sequentially | A write failure can leave a partial set; unchanged offline CLI, rerun deterministically restores it | No failure injection into unchanged persistence; six outputs compared in memory and with disk, avoiding an implementation overwrite |
| 5 | Start strict-port Vite, launch browser, navigate/render/interact | Failed launch before page work; approved repeat succeeded, errors captured | Full browser evidence; browser closes on successful runner completion; checker terminates its own dev server |
| 6 | Browser writes screenshots and JSON | Evidence is freshly replaced on successful completion; unchanged script has no transaction | JSON semantic results inspected, not merely file existence |

No new persistence or cleanup path was introduced by O-004. Before/during/after-write failures of the unchanged CLI/browser are explicitly outside the lock's materiality boundary, rather than silently untested changed behavior. Success is visible only when all generated strings exist and browser assertions/evidence have completed. Repeated in-memory reconstruction proves recovery determinism; it does not claim transactional writes.

## Fresh gates and health

2026-10-06, Node v22.22.2, installed project toolchain (TypeScript 7.0.2, Vite 8.3.2, Vitest 5.0.3):

- `npm run typecheck`: passed.
- `npm run build`: passed; existing large-chunk advisory.
- `npm test`: 7 files, **127 tests passed**, 26.35 s, started 08:27:19Z.
- `git diff --check`: passed; untracked-file limitation above.
- `node /tmp/o004-check.mjs`: all matrix evidence collected, detects I-008, writes JSON. Preserved portable script at `docs/evidence/o004-check.mjs`.
- `node /tmp/o004-interpolation.mjs`: 39 segments/7,047 probes, maximum 0.200568 km. Portable script preserved beside output.
- `node tools/validate/anchor-consistency.mjs`: passed, refreshed evidence.
- `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://127.0.0.1:5199/ node tools/validate/browser-spike02.mjs`: successful fresh run after sandbox escalation, zero errors.
- `savepoint health check O-004`: run after all configured gates passed; **Code Health not configured**. No snapshot, no health finding.

No separate project full gate or lint command is configured. New Check evidence files do not change source/tests/fixtures/dependencies/gate definitions; all six generated artifact hashes remain the gate-tested versions.

## Acceptance and Guardrails

| Requirement | Classification | Evidence |
|---|---|---|
| O-004 Outcome: no impossible speeds | **Issue** | I-008, C/R matrix cells; a coast spike violates the overall promise despite correct burns |
| SC1 A-13 source and propagation | **Proven** | S; source correction note and regression, no A-13 override |
| SC2 bounded A-05 search and honest inferred status | **Proven** | S; required documented search, not exhaustive proof of absence |
| SC3 physical burns, published cutoff residuals, generic coast start, continuous joins | **Proven** | B/C; existing dynamics plus constant thrust, zero shared state steps |
| SC4 one-second consistency scan, LOI-2 speed, every burn peak | **Proven as worded** | B/R; no displacement/derivative mismatch. Does not prove the stronger overall physical outcome |
| SC5 unchanged special paths and exact non-cutoff anchors | **Proven** | A/P |
| SC6 byte identity and retained runtime/Earth/Moon behavior | **Proven behaviorally** | D/V, full suite; no historical source diff available |
| SC7 generated and authored documentation reconciled | **Proven** | D; TLI limitation accurately recorded |
| T-014 Done When items | **Proven** | S/D, source regression, gate results; append-only repair histories and owner waiver exist |
| T-015 Done When items | **Proven for the listed technical mechanisms** | B/C/R/A/P/D/V and fresh gates. Its resulting mission outcome remains blocked by I-008 |

TEST-01/02: named regression evidence covers changed physical burn mechanics, but misses the introduced coast's impossible speed (I-008); passing evidence alone cannot grant outcome clearance. TEST-03 is satisfied by exact named tests in both Tasks and reviewed `tests/apollo11Reconstruction.test.ts`. TEST-04 is satisfied by owner board waivers on T-014/T-015, each naming Task, reason, actor and time; this Full Check covers both. DATA-01: A-13 is a cited transcription correction expressly authorized by the Objective; no new destructive action or unapproved override occurred. SEC rules have no applicable protected route, secret or error-response surface here. CODE-01 is advisory and health is unconfigured.

## Adversarial pass

- The burn peak metric stops at cutoff, so the following coast bypasses a burn-only plausibility assertion. The runtime scan uses the same interpolant's derivative as its bound. Independent position differences and endpoint distance over duration expose the actual impossible motion (I-008).
- No scale, rendering center or Moon-reference change can explain the Earth-centred post-TLI spike: both endpoints are Earth-referenced, and the browser consumes the same physical samples on both scales.
- All twelve solver results converge at half step; the 454 km miss persists, so numerical integration error is not a plausible cause. It is a modelling/endpoint incompatibility that needs repair or planning.
- Failed duration/body/step inputs leave no persistent state; successful retry and repeated reconstruction agree. Exact/adjacent timestamps and all sample intervals were covered, rather than only the old LOI-2 example.
- Direct nonfinite helper values bypass the solver's comparison; not admitted as a blocker because no supported changed mission path supplies them. The runtime independently rejects nonfinite samples.

## Findings and materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-008 post-TLI coast speed | High: present on every regenerated mission | High for O-004: the required physical-speed outcome fails, visible dash remains | High within this Objective | Repair the burn/coast combination; planner review if recorded constant-thrust/endpoints cannot meet the outcome |

I-002/I-007 remain retired by escalation, not reopened or independently closed. C-004's earlier O-002 clearance is not altered. This is O-004's first immutable Check and all remaining matrix cells were completed after finding I-008.

## Observations and owner validation

- Direct NaN state into `solvePhysicalBurn` returns NaN output because a NaN residual never compares greater than the convergence tolerance. Unsupported helper input only; runtime rejects it. Consider boundary validation in future tool work.
- Design/T-015 say “40 non-cutoff anchors”; there are 40 vehicle/anchor occurrences total, of which 28 are non-cutoffs. All 28 meet the criterion; this count wording is nonblocking.
- Historical source preservation is limited by the wholly untracked tree. Special paths have explicit baseline hashes; original runtime behavior has fresh regression evidence.
- Browser evidence uses headless SwiftShader. Human judgement of LOI-2/MCC-1 motion and visual jitter is not established by this Check. Existing board completion waivers are owner decisions, not technical clearance.

O-004 cannot close on this result. Remediation belongs to the executor/planner under I-008; T-014/T-015 stay done. No owner acceptance or exception has been recorded by this checker.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — ordinary, special and failure paths have evidence; the outcome regression gap is separately I-008.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [ ] STYLE-06 **Handle errors at boundaries** — `tools/apollo11/burn.ts:42` does not reject NaN residuals from unsupported direct input.
- [ ] STYLE-07 **One source of truth** — audit dynamics in `tools/validate/anchor-consistency.mjs` intentionally duplicate production dynamics for independent evidence; they can drift.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — the implementation is entirely untracked, so a Task-specific diff cannot be independently reviewed.
