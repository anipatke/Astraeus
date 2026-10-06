---
id: C-006
scope: {kind: objective, id: O-004}
result: CLEAR
checked_by: {role: checker, session: o004-recheck-claude-20261006}
executed_session: t015-physical-burns-2026-10-06
checked_at: '2026-10-06T09:18:00Z'
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
issues: []
supersedes: C-005
---

# C-006: O-004 Full Objective re-check

**CLEAR.** This re-check supersedes C-005. C-005's only Issue, I-008, is closed by the owner's recorded acceptance. Every other frozen matrix cell reproduces exactly on unchanged inputs, with fresh gates and a fresh browser run. The post-TLI speed is **not** technically proven plausible: that cell still reproduces 73.549 km/s, and clearance there rests on the owner's acceptance (I-008, 2026-10-06T08:48:32Z), not on evidence.

## Closure map of prior Issues

| Issue | C-005 status | Now |
|---|---|---|
| I-008 post-TLI coast speed | Open, High materiality | **Closed by owner acceptance**, recorded as an I-008 resolution (`accepted`, owner, 2026-10-06T08:48:32Z): a limitation of the Apollo sample, not of the Astraeus trajectory contract. Reproduced unchanged (below) and disclosed. Not `verified`. |

There were no other material Issues in C-005. I-002 and I-007 stay retired by escalation.

## Independence

This session did not build T-014 or T-015, and it did not write C-005. Earlier in the same conversation it acted as planner for the G-002 replan and G-003 Spike 03. As planner it edited one `.savepoint/Design.md` sentence about Issue escalation targets, outside O-004's technical scope, and touched no O-004 implementation, data or evidence. An earlier re-check in another session (`o004-recheck-20261006`) wrote `docs/evidence/o004-recheck-admission.md` and then was interrupted by the owner before it wrote any Check record. This run reviewed that ledger against C-005's frozen lock, confirmed it adds no axis or interpretation, and adopted it as the admission ledger.

## Frozen scope and admission

The scope lock is C-005's, preserved at `docs/evidence/o004-scope.md`. No amendment was made. The admission ledger (`docs/evidence/o004-recheck-admission.md`) maps each re-check item to an exact frozen cell (S, B, C, R, A, P, D, F, V and the gates). The owner's post-C-005 revision of O-004's wording, which shifts it to an engine-integration focus, was not used to add or remove a blocking cell. Its new documentation wording is reported as an observation only.

## Unchanged inputs since C-005

No file under `src/`, `tools/`, `tests/`, `data/`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `docs/APOLLO11_SOURCES.md`, `docs/APOLLO11_RECONSTRUCTION.md` or `docs/ASTRAEUS_SPIKE_02.md` has a modification time after 2026-10-06 19:20 local (08:20Z, before C-005's gates at 08:27Z). Changes since C-005 are Savepoint metadata only: the O-004 Objective text, I-008, Design, Idea, and G-003 planning records. All gates were nevertheless re-run fresh.

## Matrix re-run

Probe scripts are C-005's preserved scripts. Only the output path differs: `docs/evidence/o004-recheck.mjs` → `o004-recheck.json`, and `o004-recheck-interpolation.mjs` → `o004-recheck-interpolation.json`. Both outputs are **byte-identical in content** to C-005's `o004-independent-check.json` and `o004-interpolation.json` (`diff` of normalised JSON: no differences).

| Cell | Result |
|---|---|
| S Source settlement | Passed. Same normalised anchors (`ee377b7f…b0e7`); the A-13 correction and A-05 override status are unchanged. |
| B All twelve burns | Passed. Identical burn rows: finite accelerations, cutoff velocity residuals ≤1e-6 m/s, published position residuals, LOI-2 1.669 km/s Moon-relative. |
| C Burn→coast joins | Passed for continuity: all twelve joins have 0 km / 0 km/s steps, and the ±1 ms / ±100 ms neighbours are unchanged. A-02>A-03 reproduces I-008 (minimum average 50.925 km/s), now owner-accepted and disclosed in `docs/APOLLO11_RECONSTRUCTION.md` (smoothing row, 69,263 m/s) and `docs/ASTRAEUS_SPIKE_02.md` (sections 7.3 and 13). |
| R Whole runtime | Passed for contract and kinematics: Columbia and Eagle each have 0 violations. Columbia max 73.549279 km/s (I-008) and Eagle max 2.697091 km/s, both as in C-005. |
| A Anchors and gaps | Passed. 28 non-cutoff anchors, max 6.66e-7 km. Interpolation max 0.200568 km over all 39 segments. |
| P Special paths | Passed. All three T-015 baseline hashes match (`f61905af…`, `6e8e4910…`, `d6fcb512…`). |
| D Determinism | Passed. Six artifacts identical on second in-memory run and on disk, hashes as T-015 and C-005; inputs unmutated. |
| F Failures/bypass | Passed. Zero/reversed duration, body mismatch and zero/negative/NaN step throw RangeError, and retry succeeds. The NaN direct-helper observation is unchanged and nonblocking. |
| V Browser | Passed with a fresh run: strict-port Vite on `http://127.0.0.1:5199/` started by this checker and stopped afterwards; `tools/validate/browser-spike02.mjs` via the donor's playwright-core. `errors: []`, all six scale pairs identical, `focusUnchanged: true`, 30 event jumps, rates ≈1.0/100.2/1006.3/10023.2. USNO lit 50.1 % / 0.2 % / 50.1 % / 99.8 %, matching Spike 01. Evidence refreshed in `docs/evidence/spike02-browser.json` and `docs/evidence/spike02/*.png`. |

`node tools/validate/anchor-consistency.mjs` was also re-run and refreshed its evidence.

## Fresh gates and health

2026-10-06, Node v22.22.2:

- `npm run typecheck`: passed.
- `npm run build`: passed (existing large-chunk advisory).
- `npm test`: 7 files, **127 passed**, started 09:10:45Z.
- `git diff --check`: passed (vacuous for the untracked tree, as noted in C-005).
- `savepoint health check O-004`: **Code Health not configured**. No snapshot, no finding.

## Acceptance and Guardrails

| Requirement (frozen C-005 classification) | Now |
|---|---|
| O-004 Outcome: no impossible speeds | **Owner-accepted limitation** (I-008). Not proven; no technical clearance is claimed for this cell. |
| SC1–SC7 and the T-014/T-015 Done When lists | **Proven**, as in C-005, reproduced on unchanged inputs. |

TEST-01/02/03: unchanged named evidence. TEST-04: owner board waivers on T-014 and T-015 remain and are covered by this Full Check. DATA-01: no destructive change. SEC: not applicable. CODE-01: advisory, health unconfigured.

## Findings and materiality

No Issues. No materiality actions are required.

## Observations

- `docs/ASTRAEUS_SPIKE_02.md` section 13 still calls the post-TLI correction "a documented limitation for planner review", and `docs/APOLLO11_SOURCES.md` does not mention it. The owner has since accepted it as a sample limitation, so that wording could be updated in later documentation work. This is outside the frozen lock and nonblocking.
- The C-005 observations stand: the NaN direct-helper input, "40 non-cutoff anchors" wording (28 are non-cutoffs), the untracked tree, and headless SwiftShader not being a human visual judgement.
- The Spike 03 UI shell (O-005, T-019) is planned to surface I-008 and the other known liberties to viewers through provenance.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**: supported paths validate; see the NaN observation.
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**

## Owner validation still needed

O-004 can close once the owner accepts it on the board. Both owned Tasks are done. This Check is current and CLEAR, and its only prior Issue is resolved by owner acceptance. This Check does not set any status.
