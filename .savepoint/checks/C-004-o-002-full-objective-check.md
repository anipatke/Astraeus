---
id: C-004
scope: {kind: objective, id: O-002}
result: CLEAR
checked_by: {role: checker, session: check-o002-full-2026-10-06}
executed_session: o002-recheck-2026-10-06
checked_at: '2026-10-06T06:02:00Z'
reviewed:
  base_commit: 99b1558867b271d581aab683864e39821f27ac60
  head_commit: 99b1558867b271d581aab683864e39821f27ac60
  files:
    - src/core/body.ts
    - src/core/trajectory.ts
    - src/core/state.ts
    - src/core/sampledTrajectory.ts
    - src/core/provenance.ts
    - src/core/events.ts
    - src/core/referenceCenters.ts
    - src/app/mission.ts
    - src/app/TrackedBodyView.ts
    - src/app/sceneLayout.ts
    - src/app/App.tsx
    - src/mission/apollo11.ts
    - tools/apollo11/segments.ts
    - tools/apollo11/sampling.ts
    - tools/apollo11/trajectory.ts
    - tools/apollo11/reconstruct.ts
    - tools/apollo11/config.json
    - data/apollo11/raw/anchors.json
    - data/apollo11/normalised/anchors.json
    - data/apollo11/generated/columbia.json
    - data/apollo11/generated/eagle.json
    - data/apollo11/generated/events.json
    - docs/APOLLO11_RECONSTRUCTION.md
    - docs/APOLLO11_SOURCES.md
    - .savepoint/Design.md
    - 'tree sha256:042807af1dddf62b627bf745d6afbf80c9882fbdd4ddca7331d66e62b3a4d4ed'
  dependencies:
    - 'package.json sha256:5c35b8f8af9f7329111bf461be1cf28f8319d930ccd9d7ebef9b6238ed7e15d8'
    - 'package-lock.json sha256:338863900e36f88c62b333a528dd3edf8fa84293f435c81306daaddc0f29340b'
issues: []
supersedes: null
---

# C-004: Full Objective Check — O-002 Fly a reconstructed Apollo 11 through the generic Trajectory contract

Mode: **Full**, the mandatory Objective Check. This is a fresh session, started after `/clear`. It did not plan, build or Task-check any O-002 work. `executed_session` names the session that last changed the code (T-013 and T-009's final pass). T-005 to T-008 and T-010 to T-012 were built in earlier executor sessions.

**Result: CLEAR.** Every O-002 success condition and brief success criterion is proven on the current tree. This Check found no new Issue. Open Issues I-002, I-003, I-004, I-005 and I-007 are disclosed follow-up that waits on owner decisions. None violates an O-002 acceptance rule inside the frozen scope (see Observations). This Check closes I-001 as verified.

## Revision under review

All work is uncommitted (`HEAD` 99b1558 holds the README only). The tree is pinned by `sha256sum` of the 106 files under `src tests docs tools data index.html package.json package-lock.json tsconfig.json vite.config.ts`, sorted and hashed together (`042807a…d4ed`). That is the same hash C-003 recorded, so nothing has changed since the T-009 re-check, and it was unchanged again after all probes in this session. Probe output and browser output went to checker scratch only.

## Scope lock (frozen)

1. **Criteria:** O-002 success conditions SC1–SC7 with the confirmed decisions (including "visible jumps": EQJ-north heading reference, n-body coasts, open smoothing). Brief success criteria 1–12 and the "delete the word Apollo" signal. Done When for every owned Task, T-005 to T-013. Guardrails TEST-01–TEST-04 (Required). STYLE-* rules are advisory. SEC/DATA rules do not apply: there is no auth, secret or persistence surface. Gates: configured `typecheck`, `build`, `test`; lint is not configured; no separate full gate is defined in AGENTS.md Build.
2. **Public entry points:** `SampledTrajectory` (constructor, `stateAt`, `bounds`, `provenance`); `TrajectoryOutOfRangeError`; `BodyId`/`CenterId` with `assertCenterId`; `createProvenance`; `createEvents`; `stateIfInBounds`, `stateClampedToBounds`, `travelledCount`, `anchorLabelsOf`, `trackedReadouts`, `jumpToEvent`, `mergeSpeeds`; `trackedAbsolute`; `TrackedBodyView`; `buildApollo11Mission`; `npm run apollo11:reconstruct` (`reconstruct()`, `planSegments`, `buildVehicle`, `sampleSegment`); the browser app through `tools/validate/browser-spike02.mjs`.
3. **Relied-on behaviour:** the Orb adapter's Moon and Sun positions (used offline for normalisation and dynamics); ScalePolicy; floating origin; the render-axis conversion.
4. **Matrix axes:** public surfaces × input shape (normal, boundary, malformed, mutation after validation); time boundaries (start−1, start, interior, end, end+1; negative 1969 epochs); representation (raw → normalised → generated → runtime State → scaled/rendered); sequences (reconstruct → load → play/seek/jump → focus/follow → scale switch); environment (headless browser at both scales). Text classes, redirected or no-colour output, and network or timeout boundaries are **not applicable**: there is no text-width logic, no CLI output contract, and no runtime network.
5. **Materiality boundary:** an item is an Issue only if it breaks a named SC, brief criterion, Task Done When or Required guardrail, through a supported path, in behaviour O-002 introduced or promised.

## Commands and results (fresh, this session, 2026-10-06T05:52–06:02Z)

| Command | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm test` | 7 files, 123 tests pass |
| `npm run build` | pass (existing >500 kB chunk warning only) |
| `git diff --check` | clean (vacuous: all files untracked) |
| `savepoint health check O-002 .` | "Code Health is not configured"; no snapshot taken; not a finding |
| `npm run apollo11:reconstruct` ×2 in a scratch copy of the repo | combined SHA-256 `b5a198e7…8b03` both times; `diff -r` against committed `data/apollo11/` and `docs/APOLLO11_RECONSTRUCTION.md` shows no differences |
| `grep -rniE 'apollo\|columbia\|eagle\|tranquil\|nasa\|mission' src/core` | only the "NASA NSSDC" radius citation (`body.ts:23`); no mission naming |
| `src/app` mission references | only the composition root `App.tsx:10,19` imports `apollo11Mission` |
| `browser-spike02.mjs` against a fresh `vite --port 5199`, cwd in checker scratch | 0 console errors; `scalePairsIdentical` true at all 6 mission times; `focusUnchanged` true; 30 event jumps; rates 1× 1.005, 100× 99.1, 1,000× 1,000.1, 10,000× 10,002; USNO lit 50.1 / 0.2 / 50.1 / 99.8 % (same as Spike 01) |

## Coverage matrix (checker harness, vitest files in scratch importing repo modules)

| Row | Cells | Result |
|---|---|---|
| Runtime anchor fidelity | Every anchor of both generated files through runtime `SampledTrajectory.stateAt` vs `normalised/anchors.json` `earthCentred` | Columbia 27 and Eagle 13 anchors: max **0 km / 0 m/s**. Passed |
| Bounds (SC1, SC2) | Columbia start, end; Eagle start, end; ±1 ms outside | Columbia = E-02 EOI 13:43:39.3Z … E-28 EI 16:35:05.7Z; Eagle = E-12 undocking … E-23 docking. ±1 ms gives `TrajectoryOutOfRangeError`. `stateIfInBounds` returns null outside and State at both bounds; `stateClampedToBounds` holds the end. Launch E-01 and splashdown E-30 exist as events only. Passed |
| Raw misses (SC3) | Independent checker RK4 (own constants μE 398600.4415, μM 4902.80007, J2 1.0826359e-3, RE 6378.1363; Orb Moon/Sun only), 10 s and 5 s steps, 8 coasts | A-04>A-05 4.5/1.9; A-08>A-09 113.7/1.0; A-10>A-11 16.8/12.8; A-12>A-13 616.4/555.7; A-17>A-27 1,272.9/1,141.1; A-32>A-33 212.6/3.5; A-34>A-35 38.4/55.6; A-35>A-36 32.2/74.4 km/(m/s). Each equals the published `rawMissKm`/`rawMissMs` to print precision. Passed |
| Join handling (SC3) | `discontinuities`; per-coast `maxCorrectionKm/Ms`; "Known gaps" | Both files have `discontinuities: []`. Every coast over 100 km or 50 m/s is listed with its correction, likely cause and "treat as illustrative". The method is in provenance `accuracy` and the report. Open, not silent. Passed |
| Interpolation (SC5) | 60 seeded random interior times per segment (not the tool's midpoints), runtime vs the tool's segment generator; 27 + 12 segments | Worst **0.143 km** / 0.49 m/s (Columbia A-30>A-31); Eagle 0.046 km. No segment exceeds 0.25 km. Agrees with the published 0.157 km. Passed |
| Smoothed-coast velocity consistency | `smoothedCoast` velocity source | Velocity is the central difference of the blended position (`segments.ts:136-141`), so the Hermite data is self-consistent. Code-read. Passed |
| Moon normalisation (SC4) | All 24 Moon-referenced anchors: `earthCentred − native − Moon(t)` | 0.0000 km; velocity within 0.015 m/s (checker 2 s difference vs the tool's 120 s). Passed |
| Physical plausibility | 1 s scan of both runtime trajectories; 1 s steps over 11.2 km | Eagle: max 2.70 km/s, 0 flags. Columbia: 17 flagged seconds, all inside burn arcs A-13>A-14 (15 s, peak 57.75 km/s) and A-09>A-10 (2 s). That is the disclosed I-007; no coast or join is flagged. Observation (see 1) |
| Determinism | Two runs in a scratch copy; diff against committed | Byte-identical. Passed |
| `SampledTrajectory` malformed input | 2^53 time, 2-D velocity, foreign or undeclared centre, mixed velocity (C-002/003 set), mutation of input after construction, mutation of a returned buffer | All rejected or isolated. Later results are unchanged by input or output mutation; State and `bounds` are frozen. Passed |
| `SampledTrajectory` identity edge | body = centre, body = `moon` | Constructor accepts; first `stateAt` rejects (`RangeError` / `TypeError`). Not in T-006 DW3's list. Observation 3 |
| Provenance / events | Bad `sourceType`; empty `sources`; event tie, duplicate, unsorted, empty list | Bad type, duplicate and unsorted rejected; tie and empty list allowed (per the doc comment); empty `sources` allowed. Passed / observation 4 |
| Mission module | Window, rates, required wording, label/anchor mismatch, empty event list | Window is E-01…E-30; rates 1/100/1,000/10,000; exact required statement; mismatch gives `RangeError`. Empty event list gives an unhelpful `TypeError`. Passed / observation 5 |
| Scale and rebasing (SC6) | `readableScale`/`trueScale.mapPosition` on a Columbia State; browser scale pairs | State bytes unchanged; browser pairs identical at 6 times. Existing tests: `tests/missionScene.test.ts` "scale and rebasing independence…", "yields the same State at T whether reached by seek, jump or 10,000× playback"; `tests/sampledTrajectory.test.ts` "presentation independence". Passed |
| Spike 01 regression (SC7) | USNO phases in browser; orientation/illumination tests | Unchanged figures; `tests/orientationIllumination.test.ts`, `tests/core.test.ts` pass. Limit: no git history and C-001 kept no per-file hashes, so "unchanged code" is shown by behaviour, not by diff. Passed |
| Browser sequences (brief 15–18) | Earth orbit, translunar, lunar orbit, surface, return, entry × both scales; focus/follow/overview; 30 jumps; 4 rates; 30-sample follow track | 0 errors and readouts as above. Headless SwiftShader only. Passed |

### Workflow and side-effect lock (`npm run apollo11:reconstruct`)

| Order | Operation | Side effect | Failure owner / final state | Oracle |
|---|---|---|---|---|
| 1 | Read raw anchors and events | none | Throws before any write | Code read `run.mjs` |
| 2 | Range-zero check against `events.json` | none | `RangeError`, nothing written | `reconstruct.ts:172` |
| 3 | Normalise anchors and overrides (guard throws if the printed value changed) | none | Throws, nothing written | C-002/C-003 override probes; raw strings unchanged |
| 4 | Plan, integrate, smooth and sample; `buildVehicle` join guard 1e-6 km/m/s | none | Throws, nothing written | Checker RK4 and random-time interpolation above |
| 5 | Build all file strings in memory, then write each file | Files overwritten one by one | A mid-loop write failure leaves a partial set; recovery is a re-run (deterministic). Offline developer tool, acceptable | Scratch-copy diff |

## Acceptance coverage

| Criterion | Class | Evidence |
|---|---|---|
| SC1 Two vehicles, spans, Eagle descent/surface/ascent | **Proven** | Bounds row; Eagle chain A-15…A-27 includes A-20>A-LND descent, surface hold and A-LIFTOFF>A-21 ascent |
| SC2 Window EOI→EI; launch and splashdown as events; not drawn outside bounds | **Proven** | Bounds row; `TrackedBodyView.update` hides the marker on null |
| SC3 Start ≤1 km/≤1 m/s; misses published; discontinuities handled openly | **Proven** | 0 km/0 m/s; checker RK4 reproduces the misses; smoothing documented per coast |
| SC4 Earth-centred EQJ at runtime; Moon-relative normalised with time-matched Moon | **Proven** | Moon-normalisation row; `trackedAbsolute` requires centre `earth` |
| SC5 Interpolation error measured and negligible | **Proven** | 0.143 km at random held-out times |
| SC6 Identical State under both scales; marker size presentation-only | **Proven** | Scale row; `markerRadiusUnits(cameraDistance)` only |
| SC7 Earth/Moon behaviour and tests unchanged | **Proven** (with the diff limit stated) | Regression row |
| Brief 1 Transparent, reproducible, grounded | **Proven** | Determinism; per-record citations; overrides keep printed values; Known gaps |
| Brief 2 Anchors distinguishable | **Proven** | White `Points` vs lines; `anchors` index in data; optional labels (T-012) |
| Brief 3–6, 10, 12 Generic `SampledTrajectory`, same contract, no mission pipeline, EQJ Earth-centred, events separate, core barely changed | **Proven** | Core read; grep; T-006 drift record matches the code (`BodyId` opened, `CenterId` closed, optional `bounds`) |
| Brief 7 Both scales consume the same State | **Proven** | SC6 |
| Brief 8 Earth → Moon → Earth without rendering instability | **Proven** | Browser track and stress times; 1 s scan shows no join steps. The I-007 burn-arc dash is a data artefact, not rendering instability |
| Brief 9 Spike 01 behaviour retained | **Proven** | SC7 |
| Brief 11 Residuals measured and documented | **Proven** | Report Segments table and checker reproduction |
| "Delete Apollo" signal | **Proven** | `src/core` and generic `src/app` code are mission-free; mission naming lives only in `src/mission/apollo11.ts`, data and tools |
| T-005 DW1–6 | **Proven** | Raw files cite table and page; 30 events plus omissions; conventions doc; I-001 constant now correct (verified below); no PDFs in tree |
| T-006 DW1–7 | **Proven** | Core read; probes; 13 sampled-trajectory tests in the passing suite |
| T-007 DW1–8 | **Proven** for the current pipeline (T-013 superseded its two-body default by owner decision) | Determinism; residuals; report |
| T-008 DW1–8 | **Proven** | Mission wiring read; `tests/missionScene.test.ts`; fresh browser run |
| T-009 DW1–6 | **Proven** | C-003 CLEAR on the same tree hash; re-confirmed here |
| T-010 DW1–5 | **Proven** | Override set {A-05, A-33, A-34} in config and normalised data; raw strings unchanged; A-34>A-35 figures reproduced |
| T-011 DW1–5 | **Proven** as a research deliverable | Note §7.2 and evidence JSON exist; its proposal was applied later by T-013 on owner decision |
| T-012 DW1–4 | **Proven** | `anchorLabelsOf` mismatch probe; four label tests in the suite |
| T-013 DW1–6 | **Proven** | Checker RK4 equals the published raw misses at 10 s and 5 s; `discontinuities` empty; interpolation; determinism; heading and plane tests in the suite |

Guardrails: TEST-01 and TEST-03 are satisfied (named tests and scenario scripts are recorded per Task). TEST-02 is satisfied for T-013's heading fix (the plane-consistency test fails under lunar north). TEST-04: every owned Task has either an owner `check_waiver` naming Task, reason, actor and time (T-005 to T-008, T-010 to T-013) or a CLEAR Task Check the owner accepted (T-009, C-003). This Objective Check covers the waived Tasks.

## Adversarial pass

- **Bypass of validation:** the only construction path is `new SampledTrajectory`; the scene reaches State only through `stateAt`. The generated JSON is cast (`as unknown as GeneratedFile`) but then validated by the constructor and `createEvents`. No bypass.
- **Backward or skipped transitions:** seek, jump and accelerated play give the same State (existing test, browser). Out-of-bounds times are clamped for the camera only, never for drawing.
- **Representation switches:** scale switch and rebasing are downstream of State and leave it unchanged.
- **Independent oracles:** raw misses come from a checker-owned integrator with different constants; interpolation uses random times; Moon normalisation uses the checker's own differencing. Each matched.
- **Numeric classes:** negative (1969) epochs, unsafe integers, NaN/∞ (C-002/C-003 set), and exact sample times were all probed.

## Issues

None. No materiality actions are required.

## Issue closure

- **I-001: closed, verified.** `docs/APOLLO11_SOURCES.md:127-128` now gives −14552880000. `Date.parse("1969-07-16T13:32:00Z")` = −14552880000 and `new Date(-14552880000).toISOString()` = `1969-07-16T13:32:00.000Z` (node, this session). No other file in `docs tools src data` carries the old constant as current; the spike note mentions it only as a historical correction.
- I-002, I-003, I-004, I-005 and I-007 stay **open**. Each waits on an owner decision or further source work (see Observations). This Check does not link them as material blockers.

## Observations (non-blocking)

1. **I-007 burn-arc dashes are the most visible remaining artefact.** Columbia reaches 57.75 km/s inside A-13>A-14 (LOI-2) and about 18 km/s inside A-09>A-10, visible at 1× when zoomed in. It is outside T-013's promise, which covers coasts only ("Burns … keep their current methods"), and it is disclosed in I-007, Design.md and the spike note. The report's "Known gaps" says only that burn arcs "do not represent guidance". It does not name the speeds; consider adding them when I-007 is worked.
2. **Smoothing corrections can exceed the raw miss mid-coast:** A-34>A-35 has a raw miss of 38 km but a mid-coast correction of 800 km; A-02>A-03 has 10,271 m/s over 10 s. Both are published in Known gaps as illustrative. The owner's "not visually obvious" condition for these arcs still has no human judgement.
3. `SampledTrajectory` accepts body = centre or body = `moon` and rejects them only at the first `stateAt`. This is safe but late (also noted in C-003 observation 6).
4. `createProvenance` accepts an empty `sources` list and empty `accuracy`, as noted in C-002 observation 3.
5. `buildApollo11Mission` with an empty event list throws an unhelpful `TypeError` (`events[0]` undefined). It is only ever fed committed data.
6. **Design.md has small stale records:** "T-009 and T-013 await owner closure" (both are done); "I-006 … awaits verification" (it was verified by C-003); "I-001's document fix awaits verification" (verified here); the `tests/` row lists only Spike 01 suites. Architecture, interfaces and current-state figures match the code and data. Reconciliation of record status is the planner's job at the next Design edit.
7. `docs/evidence/anchor-consistency.json` and `conversion-proof.json` predate T-013 (as disclosed). The current figures are reproduced above.
8. Columbia's start point (A-01 integrated backward to EOI) has no published insertion position to check against. This is disclosed in Design.md and spike note 13.
9. The rate readout at 1× gave 1.005 this run. The method stays weak (C-002 observation 1); no bound is claimed.

## Owner validation still needed

O-002 declares no Objective-level `owner_validation`. Every owned Task is `done`. This Check is the current CLEAR integration Check, and no material Issue is linked to it. The owner may now accept the outcome and close O-002. Before closing, the owner may want to:

- judge the smoothed arcs and the I-007 burn-arc dash by eye (no human has viewed them yet);
- decide the follow-up for open Issues I-002 (A-05 documentary confirmation), I-003 (how to show uncertainty in Spike 03), I-004 (landing-site offset), I-005 (HUD and ReadableScale radii) and I-007 (A-13 longitude, burn-arc treatment).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: the n-body dynamics exist three times (`tools/apollo11/dynamics.ts`, `tools/validate/anchor-consistency.mjs`, `conversion-proof.mjs`). This was deliberate for independent audits, but the copies can drift.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: the whole Objective is uncommitted in one untracked tree, so no Task's change set can be reviewed as a diff.
