---
id: C-080
scope: {kind: objective, id: O-019}
result: CLEAR
checked_by: {role: checker, session: o019-full-check-20261018}
executed_session: 009b0116-b8b7-4912-9273-91d589baf044
checked_at: '2026-10-18T10:40:00Z'
health_snapshot: sha256:1bc0d46d2e0ebbcf83cb83590273fca6836537fec56e72eed28499df5ee9f3db
reviewed:
  base_commit: 2b4e9bc
  head_commit: a952ac5
  files:
    - docs/ASTRONOMY_VALIDATION.md
    - docs/MOON_ORBITS.md
    - .savepoint/Design.md
    - data/orbits/
    - src/core/satelliteMeanElements.ts
    - src/core/twoBodyAdapter.ts
    - src/core/bodies/io.ts
    - tests/moonOrbits.test.ts
    - tests/fixtures/moon-orbits-horizons.json
    - .savepoint/objectives/O-019-put-every-moon-on-its-real-orbit-around-its-planet/Objective.md
    - .savepoint/objectives/O-033-show-the-other-planets-moons-as-mapped-globes-on-real-orbits/Objective.md
  dependencies: []
issues: []
supersedes: null
---

# C-080: O-019 Full Objective Check

Objective O-019 "Measure each moon's orbit against JPL Horizons", as rescoped on 2026-10-18 (commit 6c4cdd0). Owned Tasks: T-078 (done, Quick Task Check C-059 CLEAR) and T-105 (in_progress, stage audit, commit a952ac5, no Task Check and no owner waiver recorded).

**Result: CLEAR.** Every Success Condition is proven and the gates pass. **Closure waits only on the owner:** T-105 is not yet `done`. It has no optional Task Check, so before marking it done the owner either records the explicit Task-check waiver (Task, reason, actor, time) or requests a Task Check; this Full Objective Check covers T-105's three criteria in full but does not stand in for that waiver. Once T-105 is owner-done, O-019 may be closed on this Check. No Issues are linked.

Independence: this checker ran as a separate agent conversation with no access to the executor's conversation and built none of the work. T-105's evidence names Claude Code session `009b0116-b8b7-4912-9273-91d589baf044`, which is also the parent Claude Code session this checker conversation was launched from; independence rests on the separate conversation, as the Verification Policy allows. The owner may weigh this. Written after C-079 (O-018), strictly in sequence.

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
- [x] Re-check After Remediation (not applicable: first Objective Check, no prior Objective Check or Issues)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria and gates tested:** O-019 Success Conditions 1-5 as rescoped; T-078 Done When 1-7; T-105 Done When 1-3; guardrails ARCH-01, ARCH-05, PROV-01; project rule "Deferred Design reconciliation"; configured gates typecheck, test, build. No browser gate: nothing is drawn (SC 5) and no rendering, camera, controls or UI file changed.
2. **Changed files and entry points:** T-078 (lane, base 2b4e9bc, head 9751289): 14 records `data/orbits/*.json`, `src/core/satelliteMeanElements.ts` (`createMeanElementTrajectory`, `elementsInPoleFrame`, `siderealPeriodDaysFor`, `epochUtcMsOf`), one widened parameter type in `src/core/twoBodyAdapter.ts`, `docs/MOON_ORBITS.md`, `tests/moonOrbits.test.ts`, `tests/fixtures/moon-orbits-horizons.json`, raw responses `docs/evidence/o019-t078-*`. T-105 (a952ac5): `docs/ASTRONOMY_VALIDATION.md` only. Planning reconciliation 6c4cdd0: Design Codebase Map row; rescope; O-033/G-009.
3. **Relied-on runtime:** the existing two-body provider (`createTwoBodyTrajectory` via `createOrbTwoBodyAdapter`); archived Horizons responses (offline; no network at check time).
4. **Matrix axes:** Success Conditions x (artefact present, content correct against an independent source, boundary/negative probe); document figures x records x report; class rule x every body (full finite set of 14). Not applicable: TTY/colour/Unicode axes (no CLI or text-width code in scope), state machines (none), live network (records are archived; the fetch is historical evidence).
5. **Admission boundary:** an Issue must violate a rescoped Success Condition, a T-078/T-105 criterion, a named guardrail or a configured gate, reproducibly. Placing moons in scenes, facing, parent planets and system views (moved to O-033) are out of scope.

## Coverage Matrix

| # | Requirement | Probe (independent where marked) | Expected | Actual | Class |
|---|---|---|---|---|---|
| 1 | SC1 cited state source per body, as data | **Independent**: every `data/orbits/*.json` checked for source url, access date, licence note, raw response (file exists), epoch, plane, elements, parent GM, accuracy | 14 complete records | 14/14 complete; Pluto from SBDB; raw files present | Proven |
| 1b | SC1 values equal the source table | **Independent**: Charon and Triton rows parsed from archived `sats-elem.html` | equal | equal (a, e, ω, M, i, node, P, P_node) | Proven |
| 1c | ARCH-01: no element numbers in engine code | grep of `src/core/satelliteMeanElements.ts` for literal elements | none | none; module reads records | Proven |
| 2 | SC2 accuracy measured, classified, reproducible offline | `tests/moonOrbits.test.ts` (10 tests, propagates from saved data, compares saved Horizons vectors, asserts fixture equals raw responses) in the fresh suite | pass | pass | Proven |
| 2b | SC2 class rule applied, not chosen per body | **Independent**: rule re-applied from each record's numbers | 14/14 match | 14/14 match (`orbit-records-probe.txt`) | Proven |
| 2c | SC2 Triton and Iapetus named; Saturn seven "not usable as published", carried to O-033 | `docs/MOON_ORBITS.md` findings 1-3; O-033 SC4 | present | present; O-033 line 26 names the Saturn source need | Proven |
| 3 | SC3 IAU rotation model per body, cited | each record's `rotation` block; test asserts polynomials equal the saved kernel text | 14 cited | 14 cite IAU WGCCRE 2015 (Archinal et al. 2018) | Proven |
| 4a | SC4 Design names provider and records | `.savepoint/Design.md` Codebase Map row (6c4cdd0) | row present | "`data/orbits/`, `src/core/satelliteMeanElements.ts`, `docs/MOON_ORBITS.md`" row, incl. the Saturn finding and Io duplication carried to O-033 | Proven |
| 4b | SC4 / T-105 DW1 section in ASTRONOMY_VALIDATION, figures copied not re-derived | **Independent**: table figures vs record `maxErrorKm` and fractions; Saturn phase range vs MOON_ORBITS finding 1; date counts vs `sampleCount` | all equal | Charon 36, Io 4,196, Europa 13,351, Ganymede 6,101, Callisto 10,861, Triton 33,573 (9.46%), Pluto 15,475,866 (0.26%); "5.5 to 157 degrees, both ways" matches 49/5.5/-61/-151/-157/-154/+145; 31 and 66 dates match; pointers to report, test and data present | Proven |
| 4c | SC4 / T-105 DW2 Io figures and duplication carried | Io section text vs `IO_MAX_ERROR_KM = 9388` (`src/core/bodies/io.ts:114`) and io record 4196; test "re-measures Io" | both figures; ARCH-05 duplication to O-033 | both stated; O-033 line 32 carries the duplication; added note that the demo now places Io from T-096 fits (0.0994 m) matches `io.ts:140` | Proven |
| 4d | Deferred drift notes (project rule) | T-078's five drift notes | each accounted | ASTRONOMY_VALIDATION: T-105; DONOR_PROVENANCE: nothing needed (stated); Design row: 6c4cdd0; Saturn finding and Io duplication: O-033; IAU-rate = mean-motion note: non-architectural data fact recorded in `docs/MOON_ORBITS.md` and used by O-033 SC5 facing | Proven |
| 5 | SC5 gates | fresh typecheck, test, build | exit 0 | exit 0; 74 files / 1103 passed / 1 skipped; built | Proven |
| 6 | Rescope integrity | O-019 "Moved Out — 2026-10-18" vs O-033 | moved conditions present | O-033 SC4-5 cover state source, facing, parents, system views | Proven |

### Finite External-Boundary Matrix

The scoped code relies on JPL services only through archived responses. Configured vs actual target: archived Horizons, SSD and SBDB responses under `docs/evidence/o019-t078-*`, read offline by the test (passed). Startup/reuse, connection refusal, redirect, timeout, retry, cleanup and secret-safe output: not applicable at check time (no network call in the supported path; the fetch is historical evidence). Malformed response: the test parses the raw responses and asserts the fixture equals them (passed).

### Workflow And Side-Effect Check Lock

No multi-step or side-effecting workflow is in scope: the provider is a pure function of a record and a time; T-105 is a document edit. Not applicable, with that reason.

### Matrix Completion Lock

Every cell classified; none unverified. Prior remediation: none.

## Adversarial Pass

- Could the document's figures drift from the data? Each figure in the T-105 table was compared with the record numbers by the checker, not by the existing test; all equal.
- Is the "six dates" wording exact? The Io paragraph says the generic path "gives 4,196 km" on T-078's six dates; the six-date row in `docs/MOON_ORBITS.md` shows 4,195 at 1969 and the record's `maxErrorKm` 4,196 is the rounded-up maximum over 31 samples, which falls on 1969-07-21. Same figure under the project's round-up convention (as 9,388 for 9,387.5). Observation only.
- Could a body be misclassified by a boundary? Triton sits at 0.09462 of its semi-major axis against the 0.1 line, recorded and named "at the edge"; the class follows from the numbers.
- Does the generic provider bypass ARCH-05 by defining Io twice? Yes, a known duplication: `io.ts` keeps its constants and `data/orbits/io.json` repeats them. It is recorded in Design, the report, ASTRONOMY_VALIDATION and carried to O-033 explicitly, as SC4 requires; the rescoped Objective does not promise removing it. Not an Issue.
- Tests independent of the implementation? Offline test compares against Horizons vectors (an external oracle), and the fixture is checked against the raw responses.

## Verify File Reality

All files named in T-078 and T-105 evidence exist: 14 records, five raw-response directories, `src/core/satelliteMeanElements.ts`, `tests/moonOrbits.test.ts`, the fixture, `docs/MOON_ORBITS.md`, `docs/ASTRONOMY_VALIDATION.md`, `src/core/bodies/io.ts`. No phantom files. `git log 9751289..HEAD` on the T-078 files is empty, so C-059's subject is unchanged.

## Gates

Run fresh in this checker session at 2026-10-18T10:15:05Z to 10:15:38Z on HEAD a952ac5, Node v24.16.0; HEAD is unchanged since (only Check records and evidence were added, no code, tests, fixtures, dependencies or gate definitions). Output: `docs/evidence/c080-o019-full-check-20261018T1015Z/gates.log`.

- `npm run typecheck`: exit 0
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 74 files, 1103 passed, 1 skipped; exit 0 (`tests/moonOrbits.test.ts` 10 tests pass)
- `npm run build`: exit 0
- `git diff --check 6c4cdd0~1 HEAD`: clean
- Lint: not configured; none ran. Browser: not applicable (SC 5).

## Code Health

`savepoint health check O-019 .` after the gates: snapshot `sha256:1bc0d46d2e0ebbcf83cb83590273fca6836537fec56e72eed28499df5ee9f3db` (created). Verdict: "Code Health does not block clearance." Complexity, dependency vulnerabilities, duplication: no finding. Coverage and tests (both optional instances): stale evidence; the test report was written by the gate run above and the coverage report is not produced by the configured gate. Collection staleness is not a code finding.

## Issues Pass

| Criterion | Class |
|---|---|
| SC1 / T-078 DW1, DW2 | Proven |
| SC2 / T-078 DW3, DW5, DW6 | Proven |
| SC3 / T-078 DW4 | Proven |
| SC4 / T-105 DW1, DW2 | Proven |
| SC5 / T-105 DW3, T-078 DW7 | Proven |

No Issues. No materiality actions are required.

## Owner decisions carried forward

No structured owner acceptance or exception is recorded on O-019, T-078 or T-105; nothing to carry forward. T-078's owner completion (2026-10-17) is unchanged: its files have not changed since C-059.

## Owner validation and actions still needed

- Mark T-105 done, with the explicit owner Task-check waiver (or request its optional Task Check first). That is the only thing O-019's closure waits on.
- The Saturn finding (seven moons not usable from the published rows) remains an owner-facing finding for O-033, not a blocker here.

## Observations (non-blocking)

1. "4,196 km on the six dates" uses the rounded-up 31-sample maximum, which falls on one of the six dates (six-date table shows 4,195). Consistent with the project's round-up convention.
2. Design.md's "Jupiter and Io" paragraph (line 76) still describes Io as placed from mean elements; since T-098 the demo places Io from the T-096 fits. That drift belongs to O-025/T-098, not O-019; `docs/ASTRONOMY_VALIDATION.md` now states it correctly.
3. Health evidence for coverage and tests reported stale (optional instances).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — Io's elements live in both `src/core/bodies/io.ts` and `data/orbits/io.json` (known, carried to O-033).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
