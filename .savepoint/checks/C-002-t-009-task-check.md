---
id: C-002
scope: {kind: task, id: T-009}
result: NEEDS WORK
checked_by: {role: checker, session: check-t009-2026-10-06}
executed_session: t009-executor-session-unrecorded
checked_at: '2026-10-06T02:31:56Z'
reviewed:
  base_commit: 99b1558867b271d581aab683864e39821f27ac60
  head_commit: 99b1558867b271d581aab683864e39821f27ac60
  files:
    - docs/ASTRAEUS_SPIKE_02.md
    - docs/APOLLO11_RECONSTRUCTION.md
    - docs/evidence/spike02-browser.json
    - tools/validate/browser-spike02.mjs
    - .savepoint/Design.md
    - .savepoint/issues/I-003-propagated-misses-reach-tens-of-thousands-of-km.md
    - .savepoint/issues/I-004-landing-site-offset-from-runtime-moon-orientation.md
    - .savepoint/issues/I-005-hud-covers-canvas-and-readablescale-radii.md
    - src/core/body.ts
    - src/core/trajectory.ts
    - src/core/sampledTrajectory.ts
    - src/core/provenance.ts
    - src/core/events.ts
    - src/core/state.ts
    - src/app/mission.ts
    - src/mission/apollo11.ts
    - tools/apollo11/anchors.ts
    - tools/apollo11/config.json
    - data/apollo11/raw/anchors.json
    - data/apollo11/normalised/anchors.json
    - data/apollo11/generated/columbia.json
    - data/apollo11/generated/eagle.json
    - 'tree sha256:6051227429e75e8385747a80ee4225a2432f2623fbef48bdad72f7204b7f6b8b'
  dependencies:
    - 'package.json sha256:5c35b8f8af9f7329111bf461be1cf28f8319d930ccd9d7ebef9b6238ed7e15d8'
    - 'package-lock.json sha256:338863900e36f88c62b333a528dd3edf8fa84293f435c81306daaddc0f29340b'
issues: [I-006]
supersedes: null
---

# C-002: Task Check — T-009 Validate Spike 02 and write up what Apollo proved

Mode: **Quick** (optional Task Check, explicitly requested by the owner). This is a fresh session that did not build T-009 or any O-002 Task. The executor session was not recorded on the Task. This is **not** the Full Objective Check for O-002.

**Result: NEEDS WORK.** The architecture claims hold up under independent probing. One scientific-honesty claim does not: the stated cause of the two largest propagated misses is contradicted by an independent n-body propagation (I-006).

## Revision under review

All work is uncommitted (`HEAD` 99b1558 is README only). The tree is pinned by `sha256sum` of the 98 files under `src tests docs tools data index.html package.json package-lock.json tsconfig.json vite.config.ts`, sorted and hashed together (`6051227…6b8b`). Any later change to these files makes this Check stale.

## Scope lock (frozen)

1. **Criteria:** T-009 Done When 1–6; via DW1, the O-002 success conditions 1–7 and brief success criteria 1–12; the brief's validation-report requirement to document known gaps and unsupported claims (§E) and the honesty principle (§23). Guardrails TEST-01, TEST-03 and TEST-04 (Required); STYLE-07 and the other STYLE rules are advisory. Gates: configured `typecheck`, `build` and `test`; lint is not configured.
2. **Changed files / entry points:** T-009 itself changed only the docs, the browser script, the evidence, Design.md and Issues. Because DW1 requires evidence on integrated code, these entry points are also probed: `SampledTrajectory` (constructor and `stateAt`), `createProvenance`, `createEvents`, `Trajectory.bounds`, `BodyId`/`CenterId` guards, `stateIfInBounds`/`stateClampedToBounds`, `buildApollo11Mission`, the A-05 override path in `tools/apollo11/anchors.ts`, and `npm run apollo11:reconstruct`.
3. **Out of scope:** the cross-Task integration matrix, the adversarial pass, Design reconciliation depth, Code Health, and the correctness of T-005…T-008 beyond what T-009's evidence asserts. These belong to the Full Objective Check.
4. **Materiality boundary:** a finding is an Issue only if it violates a criterion above through a reproducible path and T-009 authored or asserted the behaviour.

## Commands and results (fresh, this session)

| Command | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm test` | 7 files, 116 tests pass |
| `npm run build` | pass (existing >500 kB chunk warning; bundle 1,451.82 kB / 433.57 kB gzip) |
| `git diff --check` | clean (vacuous: every file is untracked) |
| `npm run apollo11:reconstruct` ×2, SHA-256 of `data/apollo11/**` and `docs/APOLLO11_RECONSTRUCTION.md` before/after | identical both times |
| `grep -rniE "apollo\|columbia\|eagle\|tranquil\|csm\|\blm\b" src/core src/app` | `src/core`: 0 mission hits (only "NASA NSSDC" radii citation, body.ts:23); `src/app`: only the composition root `App.tsx:10,19` imports `apollo11Mission` |
| `src/core` imports | only relative core modules and `@lizard-isana/orb` (adapter); core never imports tools, data or mission |
| Browser script re-run (dev server on :5199, `PLAYWRIGHT_CORE=…/planetary-explorer/node_modules/playwright-core/index.mjs`, output written to checker scratch, not over the evidence) | 0 errors; `scalePairsIdentical` all true; `focusUnchanged` true; 30 jumps; USNO lit 50.1 / 0.2 / 50.1 / 99.8 %, matching `ASTRAEUS_SPIKE_01.md:107`; rates 1× **0.54**, 100× 99.98, 1,000× 1,005, 10,000× 9,943 |

## Probes (independent of the executor's tests)

- **SampledTrajectory boundaries:** t = start−1 and end+1 throw `TrajectoryOutOfRangeError`. Start, start+1, mid, end−1 and end return correct values (exact at samples). 0.5, NaN and ∞ are rejected. A centre of `moon` or `mars` is rejected; `sun` is accepted when declared. Mutating the input after construction and mutating a returned State do not change later results; State is frozen and `bounds` is frozen. The constructor rejects an empty body, body = centre, `moon` without orientation, a non-EQJ frame, a duplicate time, one sample, mixed velocity, NaN, a 2-D vector, a fractional time and an unknown provenance `sourceType`. `MoonTrajectory.bounds` is `undefined` (still unbounded).
- **Invariance on real mission data:** Columbia's State bytes at three mission times are identical before and after ReadableScale/TrueScale mapping, a floating-origin set and rebase, and the camera clamp/visibility helpers. Scale, rebasing, focus/follow and playback all sit downstream of `stateAt(timeUtcMs)`, which is a pure function of time. This is backed by `tests/missionScene.test.ts` "scale and rebasing independence…", "yields the same State at T whether reached by seek, jump or 10,000× playback" and `tests/sampledTrajectory.test.ts` "presentation independence", plus the browser `focusUnchanged`/`scalePairsIdentical` results.
- **Anchor residuals, re-derived:** every anchor in both generated files, evaluated through the runtime `SampledTrajectory` against `normalised/anchors.json` `earthCentred`, gives a worst case of 0 km / 0 m/s.
- **Cause of the propagated misses (geocentric RK4, Earth+Moon+Sun point masses + J2, Moon and Sun from the Astraeus adapter):** see I-006. Control A-10>A-11 falls from 10,945 to 16.7 km, which confirms the probe. A-32>A-33 stays at 25,031 km and A-34>A-35 stays at 37,893 km / 10,831 m/s.
- **A-05 override:** `tools/apollo11/anchors.ts:178-182` applies an override only when the printed value equals `printedValue` (44.94) exactly, otherwise it throws. The raw file still says `"44.94"`. The normalised record carries both `printedInputs` and `inputs` plus the `inferredOverride` block and the flag. The report shows it in a separate section and as a row flag. `tests/apollo11Reconstruction.test.ts:243-257` asserts that only A-05 is overridden and the raw value is unchanged. It is isolated, keeps provenance, and cannot silently rewrite raw data.

## Acceptance coverage

| Criterion | Class | Evidence |
|---|---|---|
| DW1 Every O-002/brief criterion evidenced on integrated code | **Proven** for criteria 2–10 and 12 and for SC 1, 2, 4, 6, 7. **Issue** for brief criterion 1 ("transparent") and SC3/criterion 11 at the level of interpretation (see DW4) | Gates and probes above; spike-note tables |
| DW2 Reconstruction re-run, byte-identical, report current | **Proven** | Double re-run, identical hashes |
| DW3 Browser evidence for §15–18 on both scales + Spike 01 regression | **Proven**, with the limits the note states (headless SwiftShader, screenshots + DOM) | Fresh re-run reproduces 0 errors, scale pairs, focus, jumps and USNO phases. Rate figures are weak at 1× (observation 1) |
| DW4 Design note covers 14 items; review table; landing offset; Spike 03 rec; no unsupported wording | **Issue (I-006)** | All 14 items, the table, the 254 km offset and the Spike 03 section are present, and nowhere claims an exact path or accuracy between anchors. But §7 states as fact that the misses "come from ignoring lunar, solar and oblateness perturbation and unmodelled burns". An independent n-body propagation contradicts that for the two largest misses, and §14.1 recommends a perturbed propagator on that basis. Brief §E requires the report to name unsupported claims, not make them |
| DW5 No mission naming in `src/core/` | **Proven** | grep; import audit |
| DW6 Design reconciled; Issues captured; gates fresh; no Check claimed | **Issue (I-006)** for the same causal sentence in `Design.md` Current Technical State and I-003 Summary; otherwise **Proven** | Design.md:46; I-003 |

Guardrails: TEST-01 is satisfied (T-009 changed no runtime behaviour, and the browser script has scenario evidence). TEST-03 is satisfied (test names recorded). TEST-04 has a waiver in the frontmatter (`check_waiver`, 2026-10-06T02:23:04Z), and this owner-requested Check now supersedes the need for it.

## Issues

**I-006 — Largest return-coast misses are not explained by unmodelled perturbations** (new). Violates DW4/DW6 and brief §E/§23. To reproduce, propagate A-34 `earthCentred` with Earth+Moon+Sun+J2 to the A-35 time. Expected per the note: a small miss. Actual: 37,893 km / 10,831 m/s, and the closest pass to A-35's position is 96 min early. The missing evidence is any consistency check on the return-phase anchors; the report's check stops at A-09. Files: `docs/ASTRAEUS_SPIKE_02.md` §7 bullet 2 and §14.1, `.savepoint/Design.md:46`, the generated provenance `accuracy` (`data/apollo11/generated/*.json`, written by `tools/apollo11`), and I-003.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-006 | High: the claim is in the primary write-up and in Design | Medium: no runtime or architecture effect, but it misattributes the largest uncertainty, may hide source or conversion errors in A-32…A-35 (as in I-002), and steers Spike 03 toward a fix the evidence says will not work | **Medium** | Fix now: a narrow wording correction, plus either a return-phase consistency check or an explicit "unexplained" statement; re-run the tool and gates |

## Answers to the owner's specific questions

- **`SampledTrajectory` vs the contract:** it implements `Trajectory` with no mission leakage, and State flows unchanged through ScalePolicy, floating origin and render axes. Proven.
- **State invariance under scale, rebasing, focus/follow and rate:** Proven (probes, tests and the fresh browser run).
- **Reconstruction and provenance wording:** it never claims an exact path or accuracy between anchors (UI statement, notes, provenance `notes`/`accuracy`, report). The one dishonest element is the *causal* explanation of the largest misses (I-006).
- **44,194 km / 10,951 m/s:** the size itself is allowed, because the Objective publishes misses without a threshold. It does not show a failure of the generic architecture. It does show a gap in the reconstruction's validation: A-32>A-33 and A-34>A-35 do not close even with realistic dynamics, so the return-phase anchors or their conversion are suspect and unverified.
- **A-05 override:** isolated, guarded, keeps provenance, and leaves raw data unchanged. Proven.
- **I-001, I-003, I-004, I-005:** none blocks T-009 as follow-up. I-001 is a documentation constant; the tool asserts the correct value. I-004 and I-005 are disclosed presentation limits. I-003 may stay open, but its diagnosis and "Proof Needed" (add a perturbed propagator) must be corrected under I-006. I-002 also remains open, owner-held.
- **254 km landing-site offset:** correctly classified and not hidden. It is in note §7 and §13, the report table, I-004 and Design.md. The runtime Moon is unchanged, as SC7 requires, and the cause (no libration) is stated.
- **Generic extensions:** justified and minimal. `BodyId` is opened while `CenterId` stays closed and is runtime-guarded. `bounds` is optional. `SampledTrajectory` is 139 lines. `Provenance` and `TimelineEvent` are small frozen value types. The app-side `MissionConfig`, focus widening and overlay pass are mission-free.
- **Mission leakage into `src/core/`:** none.
- **Evidence vs claimed criteria:** supported, except DW4/DW6 as above. The 1× rate figure in the note did not reproduce (observation 1).

## Observations (non-blocking)

1. The browser rate probe at 1× is not reproducible: this run gave 0.54 against the note's 1.008. The method is a 4 s window, whole-second UTC readout and wall time bracketed around clicks on SwiftShader. The note's "within about 2.5%" holds for 100×…10,000× in this run but not for 1×. The clock is unchanged Spike 01 code with unit tests, so this is a measurement weakness, not a defect. The wording could be softened in the same edit as I-006.
2. `inferredOverrides` keyed by an anchor ID that does not exist would never apply and nothing would report it. Only one override exists today and the tests assert it, so the risk is low.
3. `createProvenance` accepts an empty `sources` array and an empty `accuracy`. This is acceptable for a minimal type; flagged for the Objective Check only.
4. Each discontinuity is drawn as a 1 s straight step, which is open and documented. The UI does not surface uncertainty to a viewer, as note §12 acknowledges.
5. T-009's frontmatter carries `status: done`, a `check_waiver`, and `owner_validation.required: true` with an empty `accepted_check`. Its Technical Evidence says "no Task-check waiver claimed". The owner should reconcile this. This NEEDS WORK Check cannot be named as an `accepted_check`.
6. Cross-Task risk for the Full Objective Check: verify the return-phase anchors (T-005/T-007) and whether any other coast miss survives n-body propagation.

## Owner validation still needed

T-009 declares `owner_validation.required`. There is no current CLEAR Check to accept. T-009 is already `done` by owner action, and this Check does not change that. Only the owner may reopen it to `stage: build` for the I-006 repair, or route the repair as a direct Issue repair before the O-002 Full Objective Check.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: the range-zero constant is wrong in `docs/APOLLO11_SOURCES.md` and right in the tool (I-001), and the miss explanation is repeated in four places that now need the same correction (I-006).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: everything is uncommitted in one untracked tree, so T-009's change set cannot be reviewed as a diff.
