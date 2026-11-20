---
id: C-189
scope: {kind: objective, id: O-077}
result: CLEAR
checked_by: {role: checker, session: recheck-o077-20261120}
executed_session: exec-t323-20261120
checked_at: '2026-11-20T08:41:20Z'
health_snapshot: sha256:dcb873f38c1da02b219bbc63e807f9c1c7720581c3aac553150bdea381dd13a6
reviewed:
  base_commit: a1c7ac23
  head_commit: 9253fe48
  files: [packages/astraeus/src/api/group.ts, packages/astraeus/src/api/sceneReads.ts, packages/astraeus/src/core/listedOrbitGroup.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, packages/astraeus-site/tools/validate/load-budget.mjs, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: C-188
---

# C-189: O-077 Full Objective Recheck

Fresh session; I did not plan, build, repair or check O-077 before (planner plan-g021-20261120, executor/repair exec-t323-20261120, C-188 checker check-o077-20261120). Re-check of C-188 (NEEDS WORK, docs only) after repair commit 9253fe48. Mode and scope lock are C-188's, unchanged. Diff reviewed: `git diff a1c7ac23..HEAD` (HEAD 9253fe48); since C-188's head 8071147e the only non-record changes are `.savepoint/Design.md` (one sentence), `packages/astraeus/README.md:90`, `packages/astraeus/CHANGELOG.md:9` (wording) and `packages/astraeus/tests/publicApiGroup.test.ts` (one new test, one renamed). No file under `packages/*/src`, `packages/astraeus-site`, `tools/`, fixtures, dependencies or gate definitions changed.

**Result: CLEAR.** Both Issues are repaired and verified; every Success Condition and the Design reconciliation are proven.

## Closure Map Of Prior Issues

| Issue | Outcome | Basis |
|---|---|---|
| I-181 (Design card rule) | closed, verified | Proof Needed 1 and 2 met (below) |
| I-182 (referenceTime wording) | closed, verified | Proof Needed 1, 2 and 3 met (below) |

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope (C-188 lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-188 matrix; changed cells re-run)
- [x] Finite External-Boundary Matrix (unchanged: only the browser run; reused, see Gates)
- [x] Workflow And Side-Effect Check Lock (unchanged code path)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|
| Design states both card modes | I-181 | R1 | pass / Issue |
| Repair touches no code for I-181 | I-181 Proof 2 | R1 | pass / Issue |
| README/CHANGELOG qualify referenceTime by `time` | I-182 Proof 1 | P8, D1, D2 | pass / Issue |
| Test covers both sides | I-182 Proof 2 | P7, P8 | pass / Issue |
| /api budget if doc comment changed | I-182 Proof 3 | D5 | pass / n/a |
| Reproduction: no-`time` orbits move with referenceTime | I-182 evidence | P8 | pass (docs match) / Issue |
| Every other C-188 cell | C-188 matrix | A1-A6, P1-P7, P9, C1-C4, M1, S1, D3, D4 | reused where inputs unchanged; re-run by the fresh full gate |

No probe outside a frozen cell was run as blocking.

## Re-checked Cells

| # | Cell | Result | Evidence |
|---|---|---|---|
| R1 | Design reconciliation | pass | `.savepoint/Design.md:91` now: illustrative "unless every orbit gives `meanAnomalyDeg` (O-077): then the card keeps the caller's source type, sources and accuracy, adds a note ... and states a two-body drift limit in place of the illustrative placement limit". Matches `listedGroupProvenance` (`core/listedOrbitGroup.ts:259-275`: measured keeps `sourceType`/`sources`/`accuracy`, appends MEASURED_PHASE_NOTE; illustrative puts the elements' type in accuracy) and `groupLimitations` (`api/group.ts:191-194`: MEASURED_PLACEMENT_LIMIT replaces PLACEMENT_LIMIT, MOTION_LIMIT kept). No "always illustrative" remains. |
| R1b | I-181 repair scope | pass | `git diff --stat 8071147e..HEAD`: no source, fixture or dependency change. The repair commit also carries I-182's test change (its own Proof Needed 2); the I-181 part is Design.md only, as its history states. |
| P8 | no-`time` orbits | pass (docs now match) | Independent probe R1 (below): with orbits giving `meanAnomalyDeg` and no `time`, each dot's distance from Earth at T0+3 d matches my own Kepler oracle (GM 398600.4418, epoch = referenceTime) within 0.5 km for referenceTime T0, T0+2 d, T0-5 d. |
| P7 | every orbit gives `time` | pass | Probe R2: same three referenceTimes, all match the oracle with epoch = each orbit's `time`, so referenceTime makes no difference. |
| P8/P7 adjacent | some orbits with `time`, some without | pass | Probe R3: each dot follows its own rule. |
| C1 | card, both modes | pass | Probe D1: measured with `sourceType: "observed"` keeps it, note names the mean anomaly, no illustrative limit; same orbits without `meanAnomalyDeg` show "illustrative", "observed" in accuracy, illustrative limit present. |
| D1/D2 | README addGroup row, CHANGELOG 0.10.0 | pass | `README.md:90`: "an orbit without `time` has its mean anomaly read at `referenceTime`, so `referenceTime` makes no difference only when every orbit gives `time`". `CHANGELOG.md:9` (newest section, 0.10.0 proposed, unreleased): "An orbit without `time` has its mean anomaly read at `referenceTime`; when every orbit gives `time`, `referenceTime` makes no difference." No other README/CHANGELOG/src line claims "no difference" (grep). The `time` doc comment (`api/group.ts:22`) already said "Defaults to the group's reference time". |
| test | I-182 Proof 2 | pass | `publicApiGroup.test.ts` "reads an orbit's mean anomaly at referenceTime when the orbit gives no time ..." (no-`time` group equals one with `time = referenceTime`, and a 2-day shift moves dots > 1,000 km) and the renamed "... when every orbit gives its time" (< 1e-6 km). Both in the green full run below. Existing tests' setup untouched (only a title changed). |
| D5 | /api budget | n/a, still passing | No doc comment changed; full gate (incl. apiReference test) passed. |

Probe: temporary `packages/astraeus/tests/zzRecheckO077Probe.test.ts` (public `Scene`/`addGroup`, `definitionOf`, `groupsOf`; oracle is a Newton Kepler solve written in the probe, frame-free radius), `npx vitest run`: 4/4 pass, 1.15 s. Sensitivity: changing R1's oracle epoch to T0 made R1 fail (1 failed, 3 passed). File deleted after the run.

## Acceptance Classification

- SC1-SC6: **Proven** (C-188 evidence; source unchanged since; full gate re-run green; C1/P7/P8 re-probed).
- SC7: **Proven** (D1, D2, test; API lock and `bad-group` unchanged; tarball below).
- Design reconciliation: **Proven** (R1).
- T-323 Done When: proven. Guardrails API-01, API-04, API-05, API-07, PROV-01, ARCH-01/03/04, TEST-01..04: satisfied.

## Gates

Run fresh on HEAD 9253fe48, tree clean apart from untracked `docs/research/`, C-188's evidence and health files (not touched).

| Gate | Result |
|---|---|
| `npm run check:gates` 08:36:55Z-08:40:10Z | exit 0; total 195 s, 0 over limit: lint 3.8 s, typecheck 6.1 s, build 2.4 s, test 49.6 s (65), test:full 81 s (105), check:engine-alone 26 s (40), check:pack 14.7 s (30), check:node-consumer 6.2 s, check:react-consumer 5.1 s |
| test:full junit (`junit.xml`) | 4062 tests, 0 failures, 0 errors (C-188: 4061; +1 new test) |
| `git diff --check a1c7ac23..HEAD` | clean |
| `savepoint health check O-077` 08:40:21Z | snapshot `sha256:dcb873f3...` created; "Code Health does not block clearance"; five optional instances, no finding |
| `npm run check:browser` | **reused, not re-run**: C-188's run 08:25:45Z-08:31:09Z on 8071147e, exit 0, every step error-lines=0, evidence `docs/evidence/browser-20261120T082545Z/`. Since then no source, site, browser-script, fixture, dependency or gate-definition change; README is not read by the site tools (`packages/astraeus-site/tools` has no README reference); the one test change is a vitest unit test the browser run does not load. |
| `measure:example` | reused from C-188 (same inputs) |
| Tarball `/home/user/code/astraeus-tarballs/astraeus-0.9.2-group-mean-anomaly.tgz` (rebuilt 19:36:11 +11:00) | sha256 `73c3ec74cc0dda83d4cea63fed5ef0863c5c11e7d3afa4b422aaec993da37511` matches; `package/README.md` identical to the repo's; `package/CHANGELOG.md` carries the qualified sentence |

## Code Health

Snapshot `sha256:dcb873f38c1da02b219bbc63e807f9c1c7720581c3aac553150bdea381dd13a6`; verdict does not block; supporting evidence only. No signal between aim and watch line reported.

## Issues

None. No materiality actions are required.

## Owner Decisions Assessed

- T-323 Task-check waiver (owner, plan-g021-20261120, 2026-11-20T08:09:59Z): still applies; the repair changed one test title and added one test, not T-323's behaviour. It is a waiver, not an acceptance or exception, so no `carried_forward` entry is written.
- /api gzip budget 46,000 (owner, 2026-11-20): unchanged.
- No acceptance or exception records exist on O-077.

## Closure Readiness

T-323 is `done`; this integration Check is current and CLEAR; I-181 and I-182 are resolved (verified). The owner may accept and close O-077. This Check does not mark it done.

## Owner Validation Still Needed

None required (`owner_validation.required: false`). As in C-188, the owner may wish to view a 110,000-dot measured group on the preview once the belt app uses the tarball.

## Observations (non-blocking)

- Carried from C-188: browser total 324 s against 320 s and `hello-sky` 23 s against 15 s in the reused run; Δt is UTC ms (leap seconds, well inside the two-body limit); a measured group with no `provenance` shows "illustrative" plus the measured note; scale times under load are several times the CHANGELOG's quiet-machine figures.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — unchanged from C-188: the all-or-none rule is written in both `api/group.ts` `checkOrbits` and `core/listedOrbitGroup.ts` `assertMembers`, and the degree wrap repeats in the core (existing API-then-core validation pattern).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
