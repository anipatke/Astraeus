---
id: C-003
scope: {kind: task, id: T-009}
result: CLEAR
checked_by: {role: checker, session: check-t009-recheck-2026-10-06}
executed_session: o002-recheck-2026-10-06
checked_at: '2026-10-06T05:36:39Z'
reviewed:
  base_commit: 99b1558867b271d581aab683864e39821f27ac60
  head_commit: 99b1558867b271d581aab683864e39821f27ac60
  files:
    - docs/ASTRAEUS_SPIKE_02.md
    - docs/APOLLO11_RECONSTRUCTION.md
    - docs/APOLLO11_SOURCES.md
    - docs/evidence/spike02-browser.json
    - docs/evidence/anchor-consistency.json
    - docs/evidence/conversion-proof.json
    - tools/validate/browser-spike02.mjs
    - tools/validate/anchor-consistency.mjs
    - tools/validate/conversion-proof.mjs
    - tools/apollo11/reconstruct.ts
    - tools/apollo11/report.ts
    - .savepoint/Design.md
    - .savepoint/issues/I-003-propagated-misses-reach-tens-of-thousands-of-km.md
    - .savepoint/issues/I-006-return-coast-misses-not-explained-by-perturbations.md
    - .savepoint/issues/I-007-a-13-longitude-and-burn-arc-speed-spike.md
    - src/core/sampledTrajectory.ts
    - src/core/state.ts
    - src/mission/apollo11.ts
    - data/apollo11/raw/anchors.json
    - data/apollo11/normalised/anchors.json
    - data/apollo11/generated/columbia.json
    - data/apollo11/generated/eagle.json
    - 'tree sha256:042807af1dddf62b627bf745d6afbf80c9882fbdd4ddca7331d66e62b3a4d4ed'
  dependencies:
    - 'package.json sha256:5c35b8f8af9f7329111bf461be1cf28f8319d930ccd9d7ebef9b6238ed7e15d8'
    - 'package-lock.json sha256:338863900e36f88c62b333a528dd3edf8fa84293f435c81306daaddc0f29340b'
issues: []
supersedes: C-002
---

# C-003: Task re-check — T-009 Validate Spike 02 and write up what Apollo proved

Mode: **Quick** re-check after remediation, under the frozen C-002 scope lock. This is a fresh session that did not build T-009, T-010…T-013 or any O-002 Task. The executor of T-009's final pass (`o002-recheck-2026-10-06`) also planned and built T-013, so it could not check here. This is **not** the Full Objective Check for O-002.

**Result: CLEAR.** I-006 is repaired, and the repair is reproduced by an independent propagation. Every C-002 scope-lock item still holds on the current tree.

## Closure map of prior Issues

| Issue | State after this run | Basis |
|---|---|---|
| I-006 (opened by C-002) | **Closed — verified** | The causal claim is gone. The two misses it named have been explained and repaired (A-33/A-34 speed digit, T-010; Moon-referenced heading reference, T-011/T-013) or stated as unexplained (residual ~210 km at A-33). An independent n-body probe reproduces every published figure. |

## Revision under review

All work is still uncommitted (`HEAD` 99b1558). The tree is pinned by `sha256sum` of the 106 files under `src tests docs tools data index.html package.json package-lock.json tsconfig.json vite.config.ts`, sorted and hashed together (`042807a…d4ed`). Any later change to these files makes this Check stale.

## Scope lock

Frozen from C-002 and not amended: T-009 Done When 1–6, with the O-002 success conditions and brief criteria reached through DW1, brief §E and §23; Guardrails TEST-01, TEST-03, TEST-04 (Required), STYLE rules advisory; configured gates `typecheck`, `build`, `test` (lint not configured); the entry points listed in C-002 item 2; the out-of-scope list and materiality boundary in C-002 items 3–4.

## Admission ledger

| # | Re-check item | Prior Issue or claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| 1 | Re-propagate A-34>A-35 and A-32>A-33 with Earth+Moon+Sun+J2 | I-006 reproduction | DW4 / I-006 | Issue if published figures or causes are unsupported |
| 2 | Causal wording in note §7, §14.1, Design.md, I-003, provenance `accuracy`, report | I-006 Proof Needed 2 | DW4, DW6 | Issue |
| 3 | Reconstruction re-run ×2, byte-identical | I-006 Proof Needed 3; DW2 | DW2 | Issue |
| 4 | Configured gates fresh | DW6 | Gates | Issue |
| 5 | Browser evidence re-run on final code | DW3 | DW3 | Issue |
| 6 | Mission naming in `src/core/` | DW5 | DW5 | Issue |
| 7 | C-002 entry-point probes (`SampledTrajectory`, A-05 override, runtime anchor residuals) | C-002 lock item 2 | DW1 | Issue |
| 8 | Adjacent case named in I-006: attribution of other propagated misses | I-006 Summary (I-003 attribution) | DW4 | Issue if stated as fact without support |
| 9 | C-002 observations 1 (1× rate) and 5 (status/waiver contradiction) | C-002 observations | none (observations) | Observation only |

## Commands and results (fresh, this session)

| Command | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm test` | 7 files, 123 tests pass |
| `npm run build` | pass (existing >500 kB chunk warning; JS 1,396.99 kB / 417.16 kB gzip) |
| `git diff --check` | clean (vacuous: every file is untracked) |
| `npm run apollo11:reconstruct` ×2, combined SHA-256 of `data/apollo11/**` and `docs/APOLLO11_RECONSTRUCTION.md` before, between and after | `b5a198e7ed4c53fc…` all three times, the same as the executor's recorded hash |
| `grep -rniE 'apollo\|columbia\|eagle\|tranquil' src/core` | 0 lines |
| `browser-spike02.mjs` against `vite --port 5199`, run with checker scratch as cwd so the committed evidence was not overwritten | 0 errors; `scalePairsIdentical` true at all six times; `focusUnchanged` true; 30 jumps; USNO lit 50.1 / 0.2 / 50.1 / 99.8 %; rates 1× 1.000, 100× 99.76, 1,000× 1,003, 10,000× 9,985 |
| `savepoint resume` before writing | strict-loads; no `Blocked:` line, so the T-008/T-013 dependencies are met (T-013 has an owner `check_waiver`) |

## Probes (independent of the executor's tools)

The checker probe uses its own RK4, its own constants (μE 398600.4418, μM 4902.800066, μS 1.32712440018e11, J2 1.08262668e-3, RE 6378.137) and its own local-basis code. It shares only the Astraeus Orb adapter for the Moon and Sun ephemeris, as in C-002. It reads the `earthCentred` states from `data/apollo11/normalised/anchors.json`.

1. **I-006 reproduction (ledger 1).** At 10 s and 5 s steps the results are identical:
   - A-10>A-11: 16.8 km / 12.8 m/s
   - A-32>A-33: 212.6 km / 3.5 m/s
   - A-34>A-35: 38.4 km / 55.6 m/s
   - A-35>A-36: 32.2 km / 74.4 m/s
   - A-08>A-09: 113.7 km / 1.0 m/s

   These match the note §7 and §7.3, the Design.md Current Technical State and the generated `segments` `rawMissKm`/`rawMissMs` exactly. The C-002 values of 25,031 km and 37,893 km came from the then-printed A-33/A-34 speeds and the lunar-north heading basis. Both inputs have changed, the change is disclosed, and the overrides are owner-approved.
2. **Applied convention, rebuilt independently.** For A-11, A-20 and A-32, rebuilding the Moon-centred velocity from the printed speed, FPA and heading with an EQJ-north basis (east = unit(ẑ × r̂), north = r̂ × east) gives the stored `native.velocityKmS` to 0.0000 m/s. `earthCentred − native − Moon(t)` is 0.0000 km. The tool does what the note says.
3. **Overrides keep raw data unchanged.** Raw A-33/A-34 speeds still read as printed (equal to 1.3335 / 1.3331952 km/s). The normalised `inferredOverride` blocks carry `printedValue`, `reconstructionValue` (1.24206 / 1.2417552 km/s = 4 075.0 / 4 074.0 ft/s), status and owner decision. A-05 is unchanged from C-002.
4. **Other propagated misses (ledger 8).** The note says lunar-orbit misses are "mostly timing", passing within 10–20 km of the next anchor several minutes early or late. A closest-approach search, Moon-relative within ±60 min, gives:
   - A-12>A-13: 19.9 km at −6.2 min
   - A-14>A-15: 7.4 km at +6.3 min
   - A-17>A-27: 14.0 km at +13.3 min

   The coasts that do not fit are A-15>A-16 (469 km), A-27>A-28 (135 km) and A-30>A-31 (193 km). Each touches an anchor the note already flags as having an off-plane printed heading (A-15, A-27, A-30). The claim is supported as worded.
5. **Entry points (ledger 7).**
   - `SampledTrajectory` rejects t = start−1 and end+1 (`TrajectoryOutOfRangeError`), 0.5, NaN, ∞, centre `moon` on an Earth-centred track, centre `mars`, an empty body, frame `ECL`, duplicate or decreasing times, one sample, mixed velocity, NaN, a 2-D vector and a fractional time.
   - Exact values come back at the samples, with linear interpolation between them.
   - Mutating the input after construction, or a returned State's `positionKm`, does not change later results.
   - Runtime residuals at every in-bounds anchor are 0 km for Columbia and Eagle.
   - A 1 s scan through both runtime trajectories finds the largest step at 57.6 km (Columbia, 1969-07-19T21:43:45Z, inside the LOI-2 burn arc A-13>A-14). This is the disclosed I-007. Eagle's largest step is 2.7 km.

## Acceptance coverage

| Criterion | Class | Evidence |
|---|---|---|
| DW1 Every O-002/brief criterion evidenced on integrated code | **Proven** | Gates, probes 1–5, browser re-run; note "Brief success criteria" table |
| DW2 Reconstruction re-run, byte-identical, report current | **Proven** | Triple hash identical; report rows match probe 1 |
| DW3 Browser evidence §15–18 on both scales + Spike 01 regression | **Proven**, with the stated limits (headless SwiftShader, DOM + screenshots) | Fresh re-run, table above |
| DW4 Design note: 14 items, review table, landing offset, Spike 03 rec, no unsupported wording | **Proven** | The causal claim is removed. §7/§7.3 figures are reproduced independently. Unexplained residuals are named as unexplained. §14.1 no longer offers a perturbed propagator as the fix. The 254 km offset and the review table stand |
| DW5 No mission naming in `src/core/` | **Proven** | grep 0 lines |
| DW6 Design reconciled; Issues captured; gates fresh; no Check claimed | **Proven** | Design.md:46 matches probe 1; I-003 corrected; I-007 captured; gates pass; the Task records no Check and no clearance |

Guardrails: TEST-01 is satisfied (T-009's own code changes are diagnostic scripts and wording; the T-010…T-013 runtime and data changes carry their own tests, 123 passing). TEST-03 is satisfied. TEST-04 is satisfied by this owner-requested Check.

No Issues; no materiality actions are required.

## Observations (non-blocking)

1. `.savepoint/Design.md:46` says lunar-orbit misses are "mostly timing **from** the point-mass Moon". The note §7 more carefully says "consistent with" the point-mass Moon. Probe 4 supports the timing; the gravity-field cause is plausible but untested. Consider matching the note's wording at the next Design edit.
2. Note §7.1 keeps its pre-T-013 figures (for example the 25,125 km "visible jump" paragraph). It is labelled historical and ends with "Since T-013 the path is continuous". A quick reader could still take it as current.
3. The committed `docs/evidence/anchor-consistency.json` and `conversion-proof.json` predate T-013. The disclosure is in the scripts and the Task, and probe 1 supersedes them for the current figures.
4. The 1× browser rate gave 1.000 this run, against C-002's 0.54. The note now reports all runs and claims no bound, which resolves C-002 observation 1.
5. The C-002 observation 5 status/waiver contradiction is resolved: T-009 is `in_progress`/`audit` with no waiver and an empty `accepted_check`.
6. For the O-002 Full Objective Check: `SampledTrajectory` with body = centre is accepted by the constructor and rejected only at the first `stateAt` (by `createState`, `src/core/state.ts:62`). C-002 described it as a constructor rejection. It is still safe, just late.
7. For the O-002 Full Objective Check: I-007 (A-13 longitude, burn-arc speed spikes), the off-plane headings at A-15/A-27/A-29/A-30, the ~210 km residual at A-33 and the unchecked insertion point remain open, and are disclosed in the note §7.3 and §13.
8. I-001's document constant is now correct (`docs/APOLLO11_SOURCES.md:127-128`) but the Issue is still `open`. Its closure belongs to the owner or the Objective Check.

## Owner validation still needed

T-009 declares `owner_validation.required`. The owner may now record acceptance naming **C-003** (`owner_validation: {required: true, accepted_check: C-003, accepted_by: {role: owner, session: …}}`) and then set `status: done`. This Check does neither. In particular, no human has yet judged the smoothed arcs, where the spacecraft visibly speeds up or slows down (note §13). The O-002 Full Objective Check remains mandatory before the Objective can close.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**: the I-001 constant now agrees between `docs/APOLLO11_SOURCES.md` and the tool, and the miss figures agree across note, Design, report and generated data.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: everything is still uncommitted in one untracked tree, so T-009's change set cannot be reviewed as a diff.
