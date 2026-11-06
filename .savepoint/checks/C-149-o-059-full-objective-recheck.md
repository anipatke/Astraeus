---
id: C-149
scope: {kind: objective, id: O-059}
result: NEEDS WORK
checked_by: {role: checker, session: o059-recheck-20261106}
executed_session: o059-repair-20261107
checked_at: '2026-11-06T20:15:58Z'
health_snapshot: sha256:89b5615c133474b9cfd2b03ceda35fd57e2b563f802e14db8356cfce9bf69cce
reviewed:
  base_commit: 83fd9964
  head_commit: 39d33686
  files: [packages/astraeus/src/api/frozenCopy.ts, packages/astraeus/src/api/planBodySets.ts, packages/astraeus/src/api/planMoonPanel.ts, packages/astraeus/src/api/planPlaces.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/tests/sceneInputCopies.test.ts, packages/astraeus/tests/moonFreeMetrics.test.ts, packages/astraeus/tests/markerRuleEveryBody.test.ts, packages/astraeus/tests/sceneBodySets.test.ts, packages/astraeus/tests/sceneReads.test.ts, packages/astraeus-site/tests/loadingCoverChain.test.ts, packages/astraeus-site/src/synthetic/syntheticJourneyScene.ts, .savepoint/Design.md]
  dependencies: []
issues: []
unmet: [API-04]
supersedes: C-148
---

# C-149: O-059 Full Objective Check, re-check after remediation

**Verdict: NEEDS WORK.** Every gate passes, all 10 browser steps pass and every frozen matrix cell passes. I-144's proof holds, but a verified close needs a `CLEAR` Check, so it stays open until the next one. The three calls I-143 named are fixed. One part of I-143's Proof Needed is not met: the general test does not stop a new call keeping the caller's object, and it misses a list `addBody` keeps today. I-143 stays open; no new Issue is opened. This is the first re-check, so one targeted repair and re-check remain under the convergence limit.

## Closure Map Of Prior Issues

| Issue | State | Proof |
|---|---|---|
| I-143 | **still open**, narrowed | Three calls proven (A1, A2). General test not proven (A5, A6) |
| I-144 | **proof holds, still open** | A7, A8. `savepoint resume` refuses a `verified` resolution on a `NEEDS WORK` Check; close it on the next `CLEAR` |

**Prior owner decisions.** No structured `exception` or `owner_validation.accepted_check` is recorded on O-059, so no `carried_forward` entries are needed. T-273's `owner_validation` is still unaccepted and needs a `CLEAR` Check to name. The Task-check waivers are not exceptions.

**Independence.** This session did not plan, build, coordinate or repair any O-059 work, and is not the C-148 session. Commit `39d33686` and the repair notes were treated as claims. Probes and mutations ran in a scratch copy of HEAD; no tracked file changed.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-148's lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-148 matrix re-run)
- [x] Finite External-Boundary Matrix (browser runner run fresh)
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
| A1 | The five I-143 scenarios | I-143 Evidence | Input axis, mutation after validation | scene unchanged | pass |
| A2 | Each leaf and list of the four calls edited alone, plus one object for two scenes (baselines asserted valid) | I-143 Proof Needed, nested lists and items | Same cell | scene unchanged | pass, 129 leaf and two-scene rows |
| A3 | Input cells on the four calls, rebuilt: 53 here, 51 in C-148, whose harness was not kept | C-148 input matrix | Normal to boundary | typed `SceneError`, latitude 90 passes, 90.01 refused | pass |
| A4 | Each copy removed; `frozenCopy` made the identity | I-143 repair claim | Same cell | tests fail | pass: 2, 2, 2 and 14 rows fail, as claimed |
| A5 | A new `Scene` call that keeps its input | I-143 Proof Needed, "so a new call cannot keep the caller's object" | Named in the Issue | a test fails | **fail:** `setZed` added in scratch; `sceneInputCopies` and `lifecycle` pass, 100 of 100 |
| A6 | The table holds for a walked call, field by field | I-143 Proof Needed, "walks every object-taking Scene call" | Named in the Issue | no leak the table misses | **fail:** `addBody` and `addBodyFromElements` keep `options.knownLimitations`; the row leaves that field out |
| A7 | Moon read through a variable, at `createMetrics` and at each metric read | I-144 Proof Needed | TEST-01, TEST-03 | test fails | pass, both fail `moonFreeMetrics` |
| A8 | Radius 0 from `addBodyFromElements` | I-144 Proof Needed | TEST-01, TEST-03 | test fails | pass, both rows of `markerRuleEveryBody` fail |
| A9 | Later writes to frozen inputs, copy cost, `setScale`, `toEqual` changes, class-built input, cycles | Caller's list | None | observation only | see Observations |

## Gates

| Gate | Result |
|---|---|
| `npm run test:full` (20:02:35-20:03:44Z) | pass: 227 files, 2999 passed, 2 skipped; lines 95.32%, branches 88.59% |
| `lint`, `typecheck` | pass |
| `check:engine-alone` | pass |
| `check:pack` | pass |
| `check:node-consumer`, `check:react-consumer` | pass (react 19.3.1) |
| `check:browser`, run once, 20:05:22-20:11:14Z | pass, 10 of 10 steps exit 0, 353 s: `docs/evidence/browser-20261106T200522Z` |
| `git diff --check main...HEAD` | same three blank lines at file ends as C-148 |

**Browser steps:** smoke, smoke-public-showers, planets-phone, meteor-shower, views, hello-scene, hello-react, hello-planets, public-build-assets, public-addresses.

**Code Health.** `sha256:89b5615c133474b9cfd2b03ceda35fd57e2b563f802e14db8356cfce9bf69cce`, 20:11:29Z: "does not block clearance". Coverage and tests read stale. Both are optional instances. Their reports came from the full gate above; the likely cause is that `check:pack` and the browser run rebuilt untracked `dist` folders afterwards, since those are the only files newer than the reports and no tracked file changed. Snapshot 1198ef8f shows the same pattern. Complexity 46 (`checkBodyLook`) is steady over five checks; one medium advisory on minimatch is unchanged. Supporting evidence only.

## Coverage

Success Conditions 1 and 3 to 7 stay Proven: fresh gates, fresh browser run, and the repair changed nothing they rest on. Condition 2 is Proven for the moon calls. Condition 3 gains fast proof: removing `onPick` or the planet `setPicker` from `main.tsx` now fails `loadingCoverChain`. The shower `setPicker` is still held by the browser only, as the test says. The T-272 Design line, T-273 evidence line and `syntheticJourneyScene.ts:4` are corrected. Files named in the repair notes exist.

## What Remains On I-143

- The table in `packages/astraeus/tests/sceneInputCopies.test.ts` is a hand-written list of 18 rows. It matches today's 18 `add` and `set` calls, but nothing ties it to `Scene`. `lifecycle.test.ts` already finds mutators by name "so a future mutator cannot escape the freeze"; the same walk would fail a call with no row.
- `packages/astraeus/src/api/planBodies.ts:172` keeps `options.knownLimitations` as given, so `list.push("")` after the call skips the non-empty check. The behaviour dates from before O-059; it counts here only as proof that the table misses a real case, whose title says every call keeps its own copy.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-143 (remainder) | Low: needs a new call, or a host editing a limits list | Low: an unchecked text on a card, or a gap in a guard | Low | Fix now, small: walk `Scene.prototype` in the table, give `addBody` the field and the copy |

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

- **Later writes to frozen inputs.** None found: no in-place list call or field write on a kept input in `src`, and the full suite and browser run raise no frozen-object error.
- **Copy cost.** Paid once per call and small: 30,000 orbits 36 ms against 3 ms without the copy; 200,000 samples 169 ms against 54 ms; the same with typed arrays 163 ms against 75 ms. `stateOf` is unchanged within noise.
- **`toBe` to `toEqual`.** All four are provenance reads. Equal values are the right claim, since no doc promises the same object back.
- **`setScale`.** A stranger, `null` and `undefined` still give `bad-scale`. A look-alike with a known id now gets the library's scale; the engine compares by id, so nothing depended on the old object.
- **Class-built input.** `frozenCopy` keeps a class instance, or a plain object with a method, whole, so `addPlaces` with one still keeps the caller's data; `setPicker` does not. No host, demo or doc builds these inputs that way, so it fails the credible-consequence test. Worth closing with the repair if cheap: these three inputs hold no provider.
- **Cycles.** A cyclic extra field gives a plain `RangeError` from `frozenCopy`, not a `SceneError`. Not one of the frozen input classes.
- **Record slip.** The repair notes on I-143 and I-144 are stamped `2026-11-07T07:05:00Z`, local time written as UTC; the commit is 2026-11-06T20:02:05Z. Left as written.

## Owner Validation Still Needed

After the I-143 repair and one targeted re-check under this lock: the owner's T-273 acceptance and Objective close.
