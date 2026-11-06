---
id: C-151
scope: {kind: objective, id: O-059}
result: CLEAR
checked_by: {role: checker, session: o059-recheck3-20261106}
executed_session: o059-repair3-20261107
checked_at: '2026-11-06T22:01:22Z'
health_snapshot: sha256:75b65a0326410a10a7f012611bfe423caeb8fd739769476ac1a2ed9d90fda5ba
reviewed:
  base_commit: 0925202e
  head_commit: 664da238
  files: [packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/api/frozenCopy.ts, packages/astraeus/tests/sceneInputCopies.test.ts]
  dependencies: []
issues: []
supersedes: C-150
---

# C-151: O-059 Full Objective Check, third re-check

**Verdict: CLEAR, with no fresh browser run.** The owner chose to go past the convergence limit for this one re-check. Every C-150 reproduction now holds, each one-leaf edit really runs, and all gates run fresh pass. I-143 and I-144 close as `verified`. Two things the owner should read first: the browser evidence predates the newest commit (see Browser Gap), and the newest commit has one narrow regression for options built as a class or carrying a function (see Regression Judged). It is recorded as an observation, not an Issue, for the reason given there.

## Closure Map Of Prior Issues

| Issue | State | Proof |
|---|---|---|
| I-143 | **closed, `verified`** | D1 to D5 |
| I-144 | **closed, `verified`** | D6; C-149 A7, A8 and C-150 stand |

**Prior owner decisions.** O-059 and its Tasks carry no structured `exception` or `owner_validation.accepted_check`, so no `carried_forward` entries are needed. T-273's acceptance is still unrecorded.

**Independence.** This session did not plan, build, coordinate or repair any O-059 work, and ran none of C-148 to C-150. Commit `664da238` and its repair note were treated as claims. Probes and mutations ran in a scratch copy of HEAD with its own package links; no tracked file changed.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-148's lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-148 matrix; only code changed since C-150 re-probed)
- [x] Finite External-Boundary Matrix (browser runner not re-run: owner decision, see Browser Gap)
- [x] Workflow And Side-Effect Check Lock (N/A beyond the site sequence, as C-148)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result | Result |
|---|---|---|---|---|---|
| D1 | The five C-150 scenarios, on both `addBody` and `addBodyFromElements`, through public calls | C-150 What Remains | Input axis, mutation after validation | scene unchanged | pass: bad kind refused with `bad-readout`; a later `kind` edit, a pushed bad item and a pushed distance row change nothing; two scenes from one object read "Distance to Sun" and "Distance to Moon" |
| D2 | One-leaf edits really run | Repair claim, 1436 edits, 25 rows | Same cell | count is real | pass: 1436 over 25 rows, read from the run, not the note |
| D3 | Mutations: the copy removed from `addBody` options; from `addBodyFromElements` options; only `readouts` left uncopied there | Repair claim | Same cell | rows fail | pass: 3 rows fail, 3 rows fail, the one-leaf row fails. Each also fails the row-count test |
| D4 | Callers: built-in body, id, listed moon ref, provider path beside frozen options; frozen caller input; the caller's object left unfrozen and editable | Recheck brief | Normal cells | no break | pass, all of them. |
| D5 | Regression from `664da238` | Recheck brief | Gates; input axis on `knownLimitations` (C-150 B4) | gates pass | gates pass; one narrow regression, judged below |
| D6 | I-144: radius 0 in `core/elementsBody.ts` | C-149 A8, as `addBodyFromElements` changed | I-144 Proof Needed | both rows fail | pass: both marker rows fail. Moon-read proof by diff: nothing it rests on changed |

## Regression Judged

`664da238` removed the `knownLimitations` copy in `#rememberCard`, relying on the new whole-input copy. But `frozenCopy` hands back a class instance, or a plain object holding a function, unchanged. So for options built that way the list is the caller's again:

| Options form, `knownLimitations` pushed after the call | `0925202e` | `664da238` |
|---|---|---|
| plain object | unchanged | unchanged |
| class instance | unchanged | **changed**, `check()` still passes |
| plain object with a function | unchanged | **changed**, `check()` still passes |

`readouts` behaves the same for these forms, as it did before. Both forms compile against `AddBodyOptions`.

**Why it is not an Issue.** It fails the admission test on credible consequence, the same ruling C-149 made on class-built input to `frozenCopy`. Every `addBody` and `addBodyFromElements` caller in `packages` and `examples` passes a plain object with no function; no doc shows another form. The host must also edit the list after the call. Should a host build options this way, the fix is small: copy the fields of `options` whatever its prototype, as AddBodyOptions holds no provider.

## Browser Gap

`npm run check:browser` was **not** run. Owner decision, relayed by the coordinator: "can we avoid browser tests?", for this round, 2026-11-07. This is not a fresh pass.

- **Reused:** `docs/evidence/browser-20261106T213613Z`, 10 of 10 steps exit 0, run on `0925202e`.
- **Changed since:** `git diff 0925202e HEAD` on `packages`, `examples`, `tools`, package files and config shows only `packages/astraeus/src/api/planBodies.ts` and `packages/astraeus/tests/sceneInputCopies.test.ts`. The rest of that diff is Check, Issue, health and evidence records.
- **Unproven in a browser:** frozen `addBody` options reaching the viewer. Traced instead: the frozen lists are only read (`trackedMetrics.ts` passes them to `barsOf`, no in-place edit under `src/app`), and the demo scene and metric tests pass fresh. The two code paths the shower and planet pages use are exercised there, not on a page.

## Gates

| Gate | Result |
|---|---|
| `npm run test:full` (21:57:37-21:58:47Z) | pass: 227 files, 3054 passed, 2 skipped; lines 95.32%, branches 88.59% |
| `lint`, `typecheck` | pass |
| `check:engine-alone` | pass |
| `check:pack` | pass |
| `check:node-consumer`, `check:react-consumer` | pass (react 19.3.1) |
| `check:browser` | **not run**, owner decision, see Browser Gap |
| `git diff --check main...HEAD` | same three blank lines at file ends as C-148 |

**Code Health.** `sha256:75b65a0326410a10a7f012611bfe423caeb8fd739769476ac1a2ed9d90fda5ba`, 22:00Z: "does not block clearance". All five instances report no finding. Supporting evidence only.

## Coverage

Success Conditions 1 and 3 to 7 stay Proven: fresh gates, and the repair changed nothing they rest on beyond the Browser Gap above. Condition 2 and API-04 are now Proven for `addBody` and `addBodyFromElements` on plain input, the supported form. Files named in the repair note exist.

## Materiality

No Issues remain, so no materiality actions are required.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `planPicker.ts` still copies by hand beside `frozenCopy`; `main.tsx` still repeats the 0.6 s fade.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — 340 files, most of them moved data.

## Observations (non-blocking)

- **"Whole input" means options and record.** The `body` argument of `addBody` is still kept as given. A hand-made `{ id, label }` edited after the call changes `scene.bodies`, and an edited `requires` changes `missingData`. Old code; the docs offer only ready-made bodies or an id, and ready-made ones are frozen. Tests do pass hand-made refs (`publicApi.test.ts`).
- **The test's metrics are blind for `rock`.** In the `addBodyFromElements` row `observe` builds its resolver from the built-in catalogue, so `createMetrics` gives "unknown body rock" before and after any edit. The row still fails through `check` and the definition (D3), so the proof holds, but "calls createMetrics" is true only for catalogued bodies.
- **The record copy adds no proof.** Removing `frozenCopy` from the record fails nothing, as `parseRecord` already builds a new record.
- **Cycles.** A cyclic extra field still gives a plain `RangeError`, as C-149 noted; now on `addBody` too. `null` options give a plain `TypeError`, as before.
- **C-150's standing notes** on the keeps-nothing limit and walk blind spots are unchanged.

## Owner Decisions Still Needed

T-273 acceptance and the Objective close are the owner's. The owner may want one browser run before release, since this CLEAR rests on a run one commit old.
