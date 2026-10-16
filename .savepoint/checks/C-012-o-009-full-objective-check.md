---
id: C-012
scope: {kind: objective, id: O-009}
result: NEEDS WORK
checked_by: {role: checker, session: o009-check-20261011}
executed_session: o009-t027-t031-executor-sessions-20261011
checked_at: '2026-10-11T04:26:07Z'
health_snapshot: sha256:ae44a6473f921244fb95ea8d6b6d92f5f640c5d8748c109bb2192934e52399e5
reviewed:
  base_commit: ebc40df
  head_commit: bc080c4
  files:
    - src/core/pointGroup.ts
    - src/core/orbitGroup.ts
    - src/core/twoBodyAdapter.ts
    - src/types/orb.d.ts
    - src/app/PointsView.ts
    - src/app/experienceDefinition.ts
    - src/app/EarthMoonScene.tsx
    - src/app/App.tsx
    - src/app/frameStats.ts
    - src/app/FrameRateSection.tsx
    - src/app/style.css
    - src/main.tsx
    - src/synthetic/syntheticRingDefinition.ts
    - tests/orbitGroup.test.ts
    - tests/pointsLayer.test.ts
    - tests/syntheticRing.test.ts
    - tests/frameStats.test.ts
    - tests/experiencePlugIn.test.ts
    - tools/validate/browser-synthetic-ring.mjs
    - .savepoint/Design.md
    - docs/evidence/regression-spike01-02/anchor-labels/
  dependencies: []
issues: [I-018]
unmet: [T-031/DW5, T-030/DW3]
supersedes: null
---

# C-012: O-009 Full Objective Check

NEEDS WORK, on two narrow points. The group capability itself holds. The core contract and the orbit group are deterministic and agree with an independent Kepler solver. The `points` layer, blending, bounds, Sun-centred composition, scale and ARCH-02 behaviour, the plug-in contract and the developer frame counter all pass independent probes. All gates and six browser scripts pass with zero console errors. The two open points are:

1. **I-018.** A T-031 browser run overwrote committed Spike 01/02 anchor-label evidence. The overwrite was committed without a restore, against T-031 Done When 5 and the project's historical-evidence rule.
2. **T-030 Done When 3 is unverified.** There is no "before" frame-pacing measurement. The executor recorded it as "Partially met" because the pre-blend `PointsView` was never committed.

Neither is a product defect. Both are bounded evidence repairs or owner decisions. No Task retreats.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation — first Check; not applicable
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope and independence

This is a fresh checker conversation. It built none of T-027 to T-031. Main checkout (`git rev-parse --git-dir` equals `--git-common-dir`), branch `spike-04`, clean tree at `bc080c4`. All O-009 work landed in `bc080c4` together with O-008 work. O-008 was already CLEAR at C-011, at base `ebc40df`, so this Check diffs `ebc40df..bc080c4` and scopes to the O-009 files above. No implementation, acceptance criterion, Design or router was changed by this run. All five owned Tasks are owner-`done` with named Task-check waivers. The waivers cover only the optional Task Checks. T-029, T-030 and T-031 declare `owner_validation.required: true` with an empty `accepted_check`.

### Frozen scope lock

1. **Requirements:** O-009 SC1–SC6; T-027–T-031 Done When; ARCH-01/02/03, PROV-01, TEST-01/03; the AGENTS.md scene-affecting fuller gate, browser-regression and historical-evidence rules. Gates: typecheck, build, the configured JUnit test, `git diff --check`, all six app-loading browser scripts.
2. **Public entry points:** `PointGroup` (`fillPositionsKm`, `stateAt`), `createOrbitGroup`, `createOrbTwoBodyAdapter`, `GroupLayer`/`groupsOf`/`experienceWithGroups`, `PointsView` (`sync`, `place`, `absolute`, `extentUnits`, `memberLocalPosition`, `fillCount`), scene focus/follow/label resolution for group ids, `FrameStats`, `FrameRateSection`, entry `?experience=synthetic-ring`.
3. **Relied-on runtime:** `@lizard-isana/orb` `kepler` (`elementsToState`, `propagateKepler`, `GM`) and the `frames` ecliptic→EQJ matrix; `sunPositionFromEarthAt`; `ScalePolicy`; `FloatingOrigin`; Three `Points`; the App 250 ms developer poll.
4. **Matrix axes:** the tables below.
5. **Materiality boundary:** group State correctness and determinism, presentation never changing State, the opt-in layer and one shell item, the fill-cost finding, the smoothing evidence the Objective promised, and unchanged Apollo and earlier evidence. Out of scope: Perseids data, camera reach (open gap for O-011), per-member picking, real-GPU performance.

Not applicable:

- **Untrusted parsing, wrong/mixed types:** group inputs are trusted typed TypeScript configuration.
- **Text and Unicode classes:** no width or truncation logic changed.
- **Output-sink modes:** no CLI.
- **Network or subprocess side effects in product code:** none.

## Invariants and acceptance coverage

| Requirement | General rule tested | Independent evidence | Classification |
|---|---|---|---|
| SC1 / T-027 DW1, DW5 | Batch fill writes 3×count EQJ km values into a caller buffer. A single member is a `createState` State equal to the batch values. Existing contracts unchanged; no library types exposed. | `git diff ebc40df bc080c4` shows no change to `state.ts`, `trajectory.ts`, `provenance.ts`, `events.ts`, `scalePolicy.ts`, `sampledTrajectory.ts`, `astronomyAdapter.ts`. Harness: `stateAt` equals the batch at indexes 0/37/99 with centre `earth` and frame `EQJ`. Public types are plain `Float64Array` and core types. | Proven |
| SC2 / T-027 DW2, DW3 | Same seed and time give bit-identical output across separate instances; a different seed differs. Two-body propagation is correct; the ecliptic plane converts to EQJ. | Harness compares against an **independent** Newton Kepler solver (IERS μ = 398600.4418) for dt 0 s to 7 days: within 0.05 km. Ecliptic orbit matches an independent IAU 2006 obliquity rotation within 0.05 km. `Object.is` determinism holds across two instances; a different seed differs. | Proven |
| T-027 DW3 errors | Named errors at bounds, buffer, count and elements; both boundary times are inclusive. | Harness: T0 and T0+1000 accepted; ±1 ms rejected (`GroupBoundsError`). Buffer length 5 rejected. Counts 0, −1, 1.5, NaN, ∞ and 2^53 rejected. e = 1 and inclination pushed past 180° rejected. Seeds −1 and 2^32 rejected. NaN spread rejected. NaN time raises `RangeError`. | Proven |
| SC3 / T-027 DW4 | Fill cost re-measured at 10³/10⁴/10⁵. A miss at 10⁴ is recorded with its cause. | Re-measured (table below): 10⁴ takes 11.0 ms Earth / 9.3 ms Sun, so the bar is still missed, as T-027 recorded. The cause (the library's `propagateKepler`) and the owner decision not to block are in the Objective record. The SC3 wording is satisfied by recording the miss. | Proven (as a recorded finding) |
| SC4 / T-028 DW1–7 | `points` is opt-in. One batch fill per refill into reused buffers. Sun-centred groups go through centre composition. Scale and camera never change State. Hidden outside bounds with no fill. One deduplicated shell item. Apollo unchanged. | Harness: `groupsOf` is empty without `points`; duplicates collapse to one item; the item carries `illustrative` provenance and bounds. For Apollo, `groupsOf` is `[]` and `experienceWithGroups` returns the same object. For the Sun-centred belt, member 42's render position equals Sun-from-Earth plus `stateAt` through the policy (relative error < 1e-6, Float32). A scale switch plus an origin move causes no fill and leaves `stateAt` deep-equal. Bounds cells are below. Browser: `data-point-groups` = 1; focus/follow/info verified by `browser-synthetic-ring.mjs`. | Proven |
| SC5 / T-029 DW1–5 | Made-up Earth ring (10⁴, illustrative, two-body named) mounts through the plug-in contract. Sun-centred belt proven by contract tests. Browser script passes with zero errors. Owner look at both scales. | Source: `syntheticRingDefinition.ts`. Fresh ring run exit 0, `errors: []`, screenshots at True and Readable. Contract tests in `tests/syntheticRing.test.ts` pass. The owner look is recorded ("ring looks right", scales not stated); see Owner validation. | Technical part proven; owner part pending |
| SC6 / T-029 DW3 | The name check covers every new generic file; gates and all browser scripts pass in fresh directories; Apollo unchanged. | `tests/orbitGroup.test.ts` scans the three new core files for `…meteor\|shower\|perseid…`. `tests/experiencePlugIn.test.ts` globs `src/core/**`, `src/shell/**` and `src/app/*` for `apollo\|columbia\|eagle\|perseid\|meteor`. Independent grep of `src/core src/app src/shell` for meteor/shower/perseid/radiant/tuttle/apollo finds no matches. Gates and six scripts pass (below). | Proven (see observation on "shower") |
| T-030 DW1, DW2, DW4 | Blend of two exact fills. One fill per span in either direction. A far seek fills once without blending across the gap. Exact at fill times. Clamped inside bounds. State unchanged. Changed test named. | Harness on the real 10⁴ ring at 600× in 60 fps steps over 2 h: 25 fills (expected about 25). Worst blend error 7.3 km including Float32, below the T-030 claim of 7.9 km. Backward play from start+1000 s to start: 1 seek fill plus at most 5 slides; drawn at start, start−1 ms not drawn and no fill. Forward to the end: drawn at end, end+1 ms no fill. A jump past after+span gives exactly one fill and draws the exact positions (< 0.01 km). The replaced T-028 test is named in T-030 evidence (TEST-03). | Proven |
| T-030 DW3 | Measure fill, blend and remap cost; choose the interval from measurement; record headless frame pacing **before and after**. | Fill/slide/plain costs re-measured (below); the 300 s choice is reasoned from measured error and cost. **No "before" pacing exists.** T-030 evidence states "Partially met" because the pre-blend `PointsView` was never committed. | **Unverified** (unmet) |
| T-030 DW5, DW6 | Fresh browser runs; historical paths restored; Design and I-017 history updated. | `o009-t030-run1/` exists. The anchor files were restored after T-030 (they were overwritten later, by T-031; see I-018). Design §"Groups and the `points` layer" reflects the two-fill blend and the 300 s default. I-017 history holds the `repair_attempted` entry. | Proven |
| T-031 DW1–4, DW6 | Fixed-window collector with no per-frame allocation; pause gap; active only in Developer mode; section shows fps/longest/over/fills on the 250 ms poll; no State/scale/camera/metric change; overhead recorded; Design updated. | Source: `FrameStats` uses a fixed `Float64Array`. The scene ticks only when `controls.frameStats !== null`. `App` sets it only in its developer-mode effect and nulls it on cleanup. `tests/frameStats.test.ts` passes. Fresh ring run: counter on with fps 39.4 and 12 fills; absent when off; Apollo counter shown. `collector-cost.txt` exists. Design line 54. | Proven |
| T-031 DW5 | Ring script on/off/Apollo cases; every script passes; **any fixed-historical-path output restored or redirected.** | Scripts pass. However the T-031 `r2` anchor run overwrote `docs/evidence/regression-spike01-02/anchor-labels/*` at 09:07:05 +1100 (mtime equals `r2-browser-anchor-labels.log`). It was not restored and was committed in `bc080c4` (I-018). T-031 records this criterion as "Met". | **Issue** |
| T-031 DW7 | The owner reads the counter in a real browser; judgement **and numbers** recorded. | "looks smooth" is recorded; the numbers are not. | Owner validation pending |
| ARCH-01 | No experience or shower names in generic code. | Grep and both name-check tests above. | Proven |
| ARCH-02 | Presentation never changes State. | Scale/origin/blend harness cells; `PointsView` only reads `fillPositionsKm` into its own buffers. | Proven |
| ARCH-03 | A synthetic or alternative configuration proves the generic capability. | Ring, belt and harness fixtures; no Perseids. | Proven |
| PROV-01 | Illustrative data carries provenance and limitations. | Ring info panel screenshot shows the Illustrative badge, limitations and the two-body note (`ring-true-overview.png`). | Proven |
| TEST-01 / TEST-03 | Named outcome evidence; changed tests named. | Four new test files. The one changed test is named in T-030. | Proven |

## Coverage matrix

| Surface | Normal | Boundary / alternate | Malformed / failure | Bypass / representation | Result |
|---|---|---|---|---|---|
| `createOrbitGroup` | Earth and Sun, EQJ and ecliptic | Zero spread vs oracle; inclination edge; e→1 | Count, seed, spread, element errors | Mutating caller `bounds` after creation | Pass; mutation and reversed-bounds cases are observations |
| `fillPositionsKm` | 10³–10⁵ | start, end, ±1 ms | Wrong length, NaN time | Two instances, same seed | Pass |
| `stateAt` | Indexes 0/37/99 | Index count−1 vs count | −1, count | Equals batch | Pass |
| Moon centre | Core fill finite | — | `PointsView.sync` throws "not supported" | — | Pass (documented limitation) |
| `PointsView.sync`/`place` | Forward play | Backward to start, forward to end, inclusive | Span ≤ 0 rejected | Jump past span (seek path); scale switch; origin move | Pass |
| Centre composition | Sun belt member vs composed State | — | — | Float32 narrowing | Pass |
| Plug-in contract | Ring definition | Duplicate groups; no `points` layer | — | Apollo returns the identical experience | Pass |
| Scene / browser | Ring mounts, focus, follow, info | True ↔ Readable | — | Apollo default, 0 groups | Pass (fresh run) |
| `FrameStats` / section | On | Off (absent), Apollo | Pause gap (unit) | — | Pass |
| Evidence handling | Fresh run directories | Fixed-path scripts | — | — | Issue (I-018) |

All cells are classified. T-030 DW3's "before" cell is unverified because the input it needs no longer exists.

## External-boundary and workflow lock

| Order / operation | Side effect and failure owner | Evidence |
|---|---|---|
| Group construction (sampling, `elementsToState`, rotation) | Throws a named error before any state exists; nothing partial is exposed | Error harness |
| Fill (`propagateKepler` per member into the caller buffer) | Validation runs before the first write (time, bounds, length); the library cannot fail partway for bound orbits | Source order `orbitGroup.ts:220-228` |
| `PointsView` slide or seek fill, compose, centroid/extent, remap | One fill per call; a failure propagates to the frame loop; State is never written | Harness fill counts |
| Developer poll (250 ms) and effect cleanup | Interval cleared and `frameStats` nulled on toggle-off or unmount | `App.tsx` effect |
| Verification output | Fresh `docs/evidence/o009-c012-run1/`; historical directories untouched (`git status` clean outside it) | This run |

Vite was started with `--strictPort` on 5199 before the scripts, and the configured target `http://localhost:5199/` equals the actual one. The scripts run in sequence and the server was stopped afterwards. Product code makes no network, subprocess or retry calls, so refusal, redirect, timeout and malformed-response cells are not applicable to the product. They remain verifier failure modes only.

## Parallel planning advice

`features.parallel_planning` is on. No lane manifests are in scope; not evaluated, not a finding.

## Adversarial pass

These were challenged:

- Does the zero-spread agreement test only re-check the library against itself? Yes. That is why the harness added an independent Kepler solver and obliquity rotation.
- Can backward, skipped or overlapping clock motion break one-fill-per-span or bounds clamping? Backward play, a jump past the span and both boundary edges were tested.
- Can scale or camera changes trigger fills or change State? No.
- Do non-finite or degenerate inputs reach the library? They are rejected first.
- Does mutable input after validation matter? `bounds` is held by reference (observation).
- Does the "Met" claim for T-031 criterion 5 hold up against file reality? No (I-018).
- Does Design's current-state text match the records? One stale line (observation).

## Verify file reality

Every file named in T-027–T-031 evidence exists, except the throwaway timing scripts. T-027 and T-030 explicitly discard those as scratch, with outputs kept in `node-measurements.txt` and the Technical Evidence. `browser-synthetic.mjs` is now tracked. Evidence directories `o009-t028-run1`, `o009-t029-run1`, `o009-t030-run1` and `o009-t031-run1` to `run4` exist.

## Gates, measurements and Code Health

Fresh run, started `2026-10-11T04:18Z` (`docs/evidence/o009-c012-run1/started.txt`), Node v24.16.0, Vitest 5.0.3:

- `npm run typecheck`, `npm run build` (existing chunk-size warning only), `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: all exit 0. 16 files, 253 tests passed. Log: `docs/evidence/o009-c012-run1/gates.log`.
- `git diff --check ebc40df bc080c4 -- src tests tools`: clean. Lint is not configured.
- Browser, with `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js` against `vite --port 5199 --strictPort`:
  - `browser-shell`, `browser-spike03`, `browser-spike02`, `browser-synthetic` and `browser-synthetic-ring` ran with `ASTRAEUS_EVIDENCE_DIR=docs/evidence/o009-c012-run1/<name>`.
  - `browser-anchor-labels` ran with the argument `docs/evidence/o009-c012-run1/anchor-labels`.
  - All exited 0 with `errors: []`. Logs are `browser-<name>.log` in the same directory.
  - No historical file changed.
  - `anchor-consistency.mjs` and `conversion-proof.mjs` do not load the app and were not run.
- Independent harness: `docs/evidence/o009-c012-run1/c012-harness.test.ts.txt`, run from the session scratchpad with its own Vitest config, not added to the suite. 13 tests pass; log `harness.log`. One measurement case first failed on a harness fixture mistake (a Sun-scale spread on an Earth-scale base); it was corrected and re-run. This was not a product defect.

**SC3 re-measure.** Node v24.16.0, this machine, run under Vitest without bundling, so treat the figures as relative to T-027. Median of 50 fills (10 at 10⁵) after warm-up:

| Members | Earth build / fill | Sun build / fill |
|---|---|---|
| 10³ | 2.7 ms / 1.09 ms | 2.1 ms / 0.91 ms |
| 10⁴ | 21.3 ms / **11.01 ms** | 20.2 ms / **9.28 ms** |
| 10⁵ | 225.6 ms / 103.3 ms | 230.6 ms / 92.5 ms |

The 8 ms bar at 10⁴ is still missed. This is consistent with T-027 (11.2 / 8.2 ms) and the recorded owner decision.

**Mitigation and smoothing effect.** Real `PointsView` on the 10⁴ ring, 10 s of simulation per frame (600× at 60 fps):

- A slide frame (fill + compose + remap) has a median of 13.7 ms. It happens on 20 of 600 frames, about 2 per real second.
- A plain blend frame has a median of 0.019 ms.

So the per-frame cost is now about 0.02 ms, with one ~14 ms hitch per 300 s span. Before the mitigation, the full 11 ms fill ran on every refill. The headless fresh ring run gave pacing median 33.2 ms, p95 33.4 ms, 8 of 157 frames over 33 ms. The counter read 39.4 fps with longest 38.7 ms. This is SwiftShader software rendering and is relative evidence only. The owner's real-browser judgement is "looks smooth" (T-031), with no figures recorded.

**Code Health.** `savepoint health check O-009 .` ran after the full gate. It created the official snapshot named in the frontmatter, with the verdict "Code Health does not block clearance". Instance results:

- Complexity, duplication, dependency vulnerabilities: no finding.
- Tests and coverage instances: reported "stale". This is a collection-freshness statement about optional instances, not a test failure; the fresh gate above passed 253/253.

No health Issue is admitted.

## Prior decisions and Issues

- No prior O-009 Check exists, and the Objective has no structured `exception` or `owner_validation` acceptance to carry forward.
- The Objective's owner decisions are recorded as Objective prose, not as structured exceptions. They are: keep the 8 ms bar and do not block; smoothing via T-030. This Check treats SC3 as met on its own wording, which allows a recorded miss.
- I-017 is owner-resolved as `accepted`. This Check does not relabel it `verified`. The blend and cost evidence above supports the repair technically.

## Issues found

**I-018** (T-031 DW5, AGENTS.md *Historical evidence preservation*).

- **Smallest scenario:** `git diff --stat ebc40df bc080c4 -- docs/evidence/regression-spike01-02/` lists three changed anchor-label files.
- **Expected:** unchanged, or an owner decision to replace them.
- **Actual:** overwritten by the T-031 `r2` run. mtimes match `docs/evidence/o009-t031-run1/r2-browser-anchor-labels.log`. Committed in `bc080c4`.
- **File and line:** `tools/validate/browser-anchor-labels.mjs:11` defaults to the historical path when no argument is given. T-031 evidence claims criterion 5 is "Met".

**Unverified criterion T-030 DW3.** No "before" headless pacing exists, so the "before and after" requirement cannot be shown from current evidence. There are two ways to close it:

- **(a)** The executor reconstructs the pre-blend behaviour on a scratch branch: `PointsView` with the blend factor held at 0 and a 60 s span, which matches the T-028 description. Measure it in the same headless setup into a fresh directory.
- **(b)** The owner records a structured `exception` for T-030 DW3 ("before" pacing only). That allows completion by exception, not CLEAR.

## Materiality

| Item | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-018 overwritten historical evidence | High: already committed | Low: originals are recoverable from `601a9ff`; no product effect | Low | Fix now: one `git checkout 601a9ff -- docs/evidence/regression-spike01-02/anchor-labels/`, and correct T-031's criterion 5 evidence; or the owner explicitly keeps the new files |
| T-030 DW3 "before" pacing missing | Certain | Low: the owner's real-browser judgement and the cost figures above cover the purpose; headless pacing is relative only | Low | Owner exception (b) is proportionate; (a) if the owner wants the number |

## Observations (non-blocking)

- **Reversed bounds accepted.** `createOrbitGroup` accepts `bounds` with start > end without error, which makes every fill throw. `bounds` is also held by reference, so mutating the caller's object after creation changes the group's bounds. Recorded with the harness output `{"reversedBoundsAccepted":true,"boundsFollowCallerMutation":true}`. Inputs are trusted configuration and no supported path does this.
- **"shower" not scanned in app files.** The app-file name check (`tests/experiencePlugIn.test.ts:85`) does not include "shower"; only the core-file check does. An independent grep finds no such naming today.
- **Stale Design line.** `.savepoint/Design.md:92` still says "The owner's look at the smoothed motion is pending". T-031 records "looks smooth".
- **Moon-centred groups fail late.** They are rejected at the first `PointsView.sync`, not at construction. A Moon-centred group would therefore throw inside the frame loop.
- **Stale hold point after a scale switch.** Before the first fill, and outside bounds, the held centre point is not remapped after a scale switch. The group is hidden then, so it has no visible effect today.
- **Remaining hitch.** A slide still costs about 14 ms in one frame, about twice per real second at 600× (T-030 limitation, confirmed).
- **Camera reach** stays the open gap named for O-011.

## Owner validation still needed

- **T-029:** record acceptance (`owner_validation.accepted_check`). SC5 asks for a look "at both scales"; the recorded judgement does not say which scales were seen.
- **T-030:** record acceptance of the smoothed motion. The T-030 evidence still says "pending"; the owner's "looks smooth" is recorded under T-031.
- **T-031:** record acceptance together with the figures seen on the owner's machine (DW7 asks for the numbers).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [ ] STYLE-02 **One job per function** — the `EarthMoonScene.tsx` frame callback now also syncs groups, feeds frame stats and frames groups; advisory.
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed** — the frame graph and colours were owner-requested.
- [ ] STYLE-06 **Handle errors at boundaries** — `orbitGroup.ts:218` takes `bounds` unvalidated and by reference.
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — O-008 and O-009 landed in one 249-file commit (`bc080c4`), so the commit-at-close baseline was skipped for O-008.

Style does not change the verdict.

## Handoff

- **Remediation:**
  - Direct repair of I-018 under issue-capture Out-Of-Scope Repair.
  - For T-030 DW3, either option (a) or an owner exception (b).
- **Task status:** completed Tasks keep `done`; no Task retreats.
- **Recheck:** a new immutable Check against this frozen scope verifies the repair.
- **Closure:** O-009 is not eligible to close yet.
