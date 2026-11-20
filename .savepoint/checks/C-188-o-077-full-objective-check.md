---
id: C-188
scope: {kind: objective, id: O-077}
result: NEEDS WORK
checked_by: {role: checker, session: check-o077-20261120}
executed_session: exec-t323-20261120
checked_at: '2026-11-20T08:32:30Z'
health_snapshot: sha256:791323eae08f11e83faa93a4e8f93f434963c989e40c4eb723f3737db674107b
reviewed:
  base_commit: a1c7ac23
  head_commit: 8071147e
  files: [packages/astraeus/src/api/group.ts, packages/astraeus/src/api/sceneReads.ts, packages/astraeus/src/core/listedOrbitGroup.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, packages/astraeus-site/tools/validate/load-budget.mjs, .savepoint/Design.md]
  dependencies: []
issues: [I-181, I-182]
unmet: [O-077-SC7, O-077-design-reconciliation]
supersedes: null
---

# C-188: O-077 Full Objective Check

Fresh session; I did not plan, build or coordinate O-077 or T-323 (planner/executor sessions plan-g021-20261120 and exec-t323-20261120). Diff `git diff a1c7ac23..HEAD` (code commit e2336114, HEAD 8071147e, branch `feat/group-mean-anomaly`). T-323 is `done` with an owner Task-check waiver (plan-g021-20261120, 2026-11-20T08:09:59Z); this integration Check reviews it.

**Result: NEEDS WORK, documentation only.** The code meets every behavioural Success Condition and illustrative groups are proven identical to a1c7ac23. Two doc/record gaps remain: Design.md still states the old group-card contract (I-181), and the README/CHANGELOG overstate that `referenceTime` makes no difference (I-182).

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. Criteria: O-077 Success Conditions, numbered here in order: SC1 all-or-none/finite/wrap; SC2 measured placement (M_ref = M_epoch + n·Δt, n from `gravitationalParameterOf(adapter, center)`, absent `time` -> epoch = reference); SC3 seed/clump refused; SC4 card and `scene.groups[].provenance` agree, measured note/limit, MOTION_LIMIT kept, illustrative unchanged; SC5 `meanAnomalyDegAt`; SC6 Ceres/addBodyFromElements/quarter period/wrap/determinism/110k smoke; SC7 README, CHANGELOG 0.10.0 (proposed, no bump), API lock, doc comments, `bad-group` reused, gates, tarball. T-323 Done When. Objective Architectural Considerations (core owns placement, typed arrays, Meteor Showers' illustrative card text unchanged). Guardrails API-01, API-04, API-05, API-07, PROV-01, ARCH-01, ARCH-03, ARCH-04, TEST-01..04. Design reconciliation (verification policy). Gates: configured gates, test:full, check:engine-alone, check:pack, check:node-consumer, check:react-consumer, measure:example, one check:browser, Code Health.
2. Entry points: `Scene.addGroup` (`planGroup`/`checkOrbits`, `buildGroupLayer`), `scene.groups` (`groupCardProvenance`, `groupDescription`, `groupLimitations`), the group's card object; core `createListedOrbitGroup` (`assertMembers`, `assertPhase`, `measuredMeanAnomaliesDeg`), `listedGroupProvenance`, `ListedOrbitGroup.meanAnomalyDegAt`, `fillPositionsKm`/`stateAt`.
3. Relied-on runtime: `frozenCopy` of the `addGroup` input (`api/scene.ts:371`); `memberStatesOf` and `adapter.propagateMemberInto` (unchanged); `gravitationalParameterOf` derives GM from the same adapter that propagates (`core/keplerElements.ts:34`).
4. Axes: public surfaces (API and core); input shape (all given, none, mix with first/middle/last missing, NaN, ±Infinity, null, string, object, -0, 360, -720, 1e6, tiny negative); state (measured vs illustrative; mutation after `addGroup`); boundaries (wrap edges, epoch = reference, Δt negative and positive); sequences (build -> fill at several times -> stateOf); representations (core group, layer object, `scene.groups`, card). Not applicable: environment/output sinks and text classes (no CLI or text-width code), serialization round trips (no new serialized form), external boundaries other than the browser run (pure computation).
5. Admission: an Issue must break an item above through a supported public path, in O-077's diff or promise, with a credible consequence.

## Coverage Matrix

| # | Surface | Cell | Result | Evidence |
|---|---|---|---|---|
| A1 | addGroup | all orbits give finite values -> measured | pass | publicApiGroup tests; probe |
| A2 | addGroup | mix, first orbit missing -> `bad-group` naming `m0`; last missing -> names `m4`; middle -> names it | pass | probe; test "refuses a mix..." |
| A3 | addGroup | NaN, ±Infinity, null, "12", {} (incl. a single-orbit group) -> `bad-group` | pass | probe; test |
| A4 | addGroup | `seed: 0` and `clump` with measured -> `bad-group`; `seed: undefined` accepted | pass | probe |
| A5 | addGroup | input mutated after `addGroup` (one value deleted) | pass: no effect, input is a frozen copy (`scene.ts:371`) | probe |
| A6 | core | mix / non-finite / seed / concentration -> `GroupElementsError` naming member | pass | listedOrbitGroup test |
| P1 | placement | Ceres (Sun) at epoch and +1 yr, two reference times, vs test-local oracle | pass < 1 km | test (oracle: bisection Kepler, written GM and obliquity; imports nothing from the engine for it: `trueAnomalyDeg` at `listedOrbitGroup.test.ts:71`) |
| P2 | placement | five orbits about **Earth** (non-Sun centre), ecliptic, 3 reference times x 3 times, vs my own Newton-Kepler oracle with GM 398600.4418 | pass < 0.5 km | probe |
| P3 | placement | EQJ plane (no obliquity) | pass < 0.5 km | probe |
| P4 | placement | agrees with `addBodyFromElements` for Ceres | pass < 1e-3 km | test |
| P5 | placement | quarter period on a circle is 90° | pass | test |
| P6 | placement | wrap: -90 = 270 = 630 exact; 360, -0, -720 -> 0; 1e6 -> 1e6 mod 360; 359.9999999 and -1e-12 read < 360 | pass | test + probe |
| P7 | placement | referenceTime independence with `time` given | pass | test |
| P8 | placement | orbits **without** `time`: README/CHANGELOG say referenceTime makes no difference | **Issue I-182** (84,018 km gap; code follows SC2, docs overstate) | probe |
| P9 | placement | determinism, reversed order | pass | tests |
| C1 | card | measured keeps caller `sourceType`, sources, accuracy; note appended; limits [caller, measured placement, motion]; `scene.groups` = layer = card | pass | test |
| C2 | card | measured with no `provenance` -> AS_SUPPLIED ("illustrative", "the engine makes no claim") plus measured note | pass (honest: caller gave no source) | probe |
| C3 | card | illustrative byte-for-byte vs a1c7ac23: 6 configurations (default; seed+times+EQJ; provenance+limits+label+description; clump; clump+provenance with empty strings; referenceTime) comparing provenance, card object JSON, `groupCardProvenance`, `groupLimitations`, fills at 3 times, `meanAnomalyDegAt` per member | pass, all identical | probe: a1c7ac23's `group.ts` and `listedOrbitGroup.ts` built side by side with HEAD |
| C4 | card | Meteor Showers illustrative groups in the browser | pass | check:browser `smoke-public-showers`, `meteor-shower` |
| M1 | meanAnomalyDegAt | reference-time value, in [0, 360) | pass | tests + probe |
| S1 | scale | 110,000 measured orbits | pass; this run 885 ms build, 669 ms fill under full-gate load (executor: 368/109 ms alone) | test:full junit |
| D1 | docs | README addGroup row (`README.md:90`), `scene.groups` row (`:158`), doc comments, sceneReads doc | pass except P8 | read |
| D2 | docs | CHANGELOG 0.10.0 (proposed), no version bump (all packages still 0.9.2) | pass except P8 (`CHANGELOG.md:9`) | read |
| D3 | API lock | one added field `GroupOrbitInput.meanAnomalyDeg` | pass | diff; `apiSurface.test.ts` in full gate |
| D4 | errors | `bad-group` reused, no new code | pass | diff; `apiRules.test.ts` |
| D5 | budget | /api gzip 45,000 -> 46,000 with owner quote recorded | pass (owner decision recorded in `load-budget.mjs:42` and T-323 evidence) | read; full gate |
| R1 | Design | reconciliation | **Issue I-181**: `.savepoint/Design.md:91` says a group's card source type is always "illustrative" | read |

Workflow lock (`addGroup` -> scene build -> `buildGroupLayer` -> `createListedOrbitGroup` -> fill): validation at `addGroup` (fatal, `bad-group`, no side effect: the scene is unchanged); core re-validation at build (fatal, renamed `bad-group` by the existing catch); no persistence, cleanup or partial writes. Oracle: independent position calculations (P1-P3) and the old code (C3).

## Acceptance Classification

- SC1, SC3, SC5: **Proven** (A1-A6, M1).
- SC2: **Proven** (P1-P7, P9); the code follows the stated absent-`time` rule.
- SC4: **Proven** (C1-C4).
- SC6: **Proven** (P1, P4-P6, P9, S1).
- SC7: **Issue** I-182 (README and CHANGELOG claim); the rest proven (D1-D5, gates, tarball).
- Design reconciliation: **Issue** I-181. The executor judged the change non-architectural and "Public API shape" unaffected; I agree on both (additive optional field, existing error code, placement stays in `createListedOrbitGroup`, no new module or data owner). But Design's `### Answers for sites` still states the superseded card rule as current.
- T-323 Done When: proven apart from the SC7 wording above.
- Guardrails: API-01 (lock updated with CHANGELOG), API-04 (`Deg` in name, early shape errors), API-05 (only `SceneError` from `api/`), ARCH-01/03/04 (no dataset names in core; synthetic orbits plus Ceres in tests; layers respected), TEST-01..04 (named tests; waiver recorded): satisfied. API-07/PROV-01: I-182.

## Issues

- **I-181** — `.savepoint/Design.md:91`: "A group's card source type is always \"illustrative\"...", contradicted by `listedGroupProvenance(..., measured)` (`core/listedOrbitGroup.ts`) and the test "keeps the caller's sourceType on the card and in scene.groups". Expected: Design states both modes. Violates the Full Check's Design reconciliation.
- **I-182** — `packages/astraeus/README.md:90` "so `referenceTime` makes no difference" and `packages/astraeus/CHANGELOG.md:9` "`referenceTime` then makes no difference" hold only when each orbit gives `time`; an orbit without `time` has its mean anomaly read at `referenceTime` (`api/group.ts` `buildGroupLayer`), and moving `referenceTime` by 2 days moved a dot 84,018 km in the probe. The existing test covers only orbits with `time`. Violates SC7 and API-07 (PROV-01 consequence: a "measured" card over misplaced dots).

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-181 | High (the sentence is read by every planner who opens that Design section) | Low (record only; no runtime effect, README is correct) | Low | Fix now: one sentence in Design.md. |
| I-182 | Low (catalogue records carry an epoch; needs a caller who omits `time` and sets `referenceTime` elsewhere) | Medium (dots silently off by up to a full orbit under a measured card) | Low | Fix now with I-181: qualify the two sentences (and optionally the `time` doc comment) and add a test of the no-`time` case. Docs and test only. |

## Gates

Run fresh this session on HEAD 8071147e, tree clean apart from untracked `docs/research/` (not touched).

| Gate | Result | Time (limit) |
|---|---|---|
| `npm run check:gates` (lint, typecheck, build, test, test:full, check:engine-alone, check:pack, check:node-consumer, check:react-consumer), 08:21:39Z-08:24:51Z | all passed, none over limit | |
| lint / typecheck / build | pass | 3.9 / 6.2 / 2.4 s |
| test | pass | 44.6 s (65) |
| test:full (coverage + junit) | pass: 4061 tests, 0 failures (junit) | 79.9 s (105) |
| check:engine-alone | pass | 23.8 s (40) |
| check:pack | pass | 18.3 s (30) |
| check:node-consumer / check:react-consumer | pass | 6.5 / 5.3 s |
| `git diff --check a1c7ac23..HEAD` | clean | |
| `savepoint health check O-077` (08:25:06Z) | snapshot `sha256:791323ea...` created; "Code Health does not block clearance"; all five instances optional, no finding | |
| `npm run check:browser` (08:25:45Z-08:31:09Z), once | exit 0, every step error-lines=0; evidence `docs/evidence/browser-20261120T082545Z/` | total 324 s (320): WARNING over limit, and `hello-sky` 23 s (15); not failed for time |
| `measure:example` hello-scene / hello-react / hello-planets / hello-sky | all exit 0; first-open 1,775,354 / 1,772,359 / 1,773,461 / 1,777,951 B raw (510,719 / 506,981 / 509,837 / 511,845 gzip); hello-sky "pictures: only milky-way emitted" | |
| Independent probe (`packages/astraeus/tests/zzCheckO077Probe.test.ts` with a1c7ac23's `group.ts`/`listedOrbitGroup.ts` copied beside HEAD's, `npx vitest run`, then all three files deleted) | 12/12 pass | 1.3 s |

File reality: every file named in T-323's evidence and drift notes exists and is in the diff. The tarball `/home/user/code/astraeus-tarballs/astraeus-0.9.2-group-mean-anomaly.tgz` exists, sha256 `7ea7ee75...973d` matches the evidence, and its `package/src/api/group.d.ts` names `meanAnomalyDeg`.

## Code Health

Snapshot `sha256:791323eae08f11e83faa93a4e8f93f434963c989e40c4eb723f3737db674107b`, verdict does not block; supporting evidence only. No signal between aim and watch line was reported for this run.

## Owner Decisions Assessed

- T-323 Task-check waiver (owner, plan-g021-20261120, 2026-11-20T08:09:59Z): recorded in the shape verification.md requires; it does not replace this Check.
- /api gzip budget 45,000 -> 46,000 (owner, 2026-11-20, "Raise cap to 46,000"): recorded in `load-budget.mjs`; scope unchanged by this Check.
No acceptance or exception records exist on O-077 to carry forward.

## Owner Validation Still Needed

None required by T-323 (`owner_validation.required: false`). The owner may wish to view a 110,000-dot measured group on the preview once the belt app uses the tarball; no browser run here exercised a measured group.

## Observations (non-blocking)

- Browser timing: total 324 s against 320 s and `hello-sky` 23 s against 15 s. O-077 touched no browser script or sky code; likely machine load. Per build.md, look at why before raising a limit.
- Time scale: Δt is UTC milliseconds, so a leap second between epoch and time shifts a dot by about one second of motion (~18 km for Ceres). Same as `addBodyFromElements` and well inside the stated two-body limit.
- A measured group with no `provenance` keeps AS_SUPPLIED's "illustrative" source type plus the measured note: honest (the caller named no source), but a host should pass `provenance` to show "observed".
- Scale timing under full-gate load (885/669 ms) is several times the executor's quiet-machine figure; the CHANGELOG's "about 0.4 s / 0.1 s" is the quiet figure.
- `docs/architecture/groups-and-time.md` is a dated historical record and needs no edit.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — the all-or-none rule is written twice (`api/group.ts` `checkOrbits` and `core/listedOrbitGroup.ts` `assertMembers`, plus `isMeasured` reading `orbits[0]`), and the degree wrap `((x % 360) + 360) % 360` repeats in the core; it follows the existing API-then-core validation pattern.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
