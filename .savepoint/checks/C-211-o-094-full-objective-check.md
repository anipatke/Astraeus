---
id: C-211
scope: {kind: objective, id: O-094}
result: CLEAR
checked_by: {role: checker, session: check-o094-20261122}
executed_session: orchestrate-g024-20261122 (T-423..T-426 builders, coordinator)
checked_at: '2026-11-22T04:42:00Z'
health_snapshot: sha256:1293b4227eeca2d9c93efdad08d8f6c4a01601bf312d8ddd7413d191c59682f3
reviewed:
  base_commit: df56850c
  head_commit: 33fe5a2c
  files: [docs/agents/browser-policy.md, docs/agents/build.md, docs/agents/verification.md, docs/BROWSER_CHECKS.md, tools/gate-limits.json, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/browser-steps.d.mts, packages/astraeus-site/tests/gateLimits.test.ts, docs/evidence/test-cost/report.md, docs/evidence/test-cost/proposals.json, .savepoint/Design.md, .savepoint/issues/I-199-measure-which-tests-earn-their-run-time-then-prune.md, .savepoint/issues/I-202-packaged-check-full-assumes-coverage-every-full-check.md]
  dependencies: []
issues: [I-203]
supersedes: null
---

# C-211: O-094 Full Objective Check

Fresh session; it did not plan, build, coordinate or repair any O-094 work. Diff `df56850c..33fe5a2c` (`main` = `df56850c`), 21 files. T-423 and T-424 are `done` with owner `check_waiver`s; T-425 and T-426 were withdrawn by the owner ("Drop it") and reverted. First Check under the new rules: gates chosen from `docs/agents/verification.md`, `build.md` and `browser-policy.md` as they now stand.

**Result: CLEAR.** The rules say P01-P04 and no more; the release keeps the full tier, engine-alone and coverage. The runner's `--step` adds to a named tier, `--step` alone is unchanged, and `--skip-examples` works. Limits file and build.md are paired by test. Nothing on the protected list is removed. The measured Full Check machine time under the new rules is **233.0 s against the 454 s baseline (51 %)**, 6 s over an exact half: "about half" is met. One Issue opened, I-203, is a pre-existing fast-suite flake outside O-094's scope (introduced by O-089 T-418). It is **not material to O-094** and does not block this Objective; it is recorded so the gate stops going red.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here; ignored)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: the Objective's four Success Conditions and Decisions (owner ticks P01-P06, then P05/P06 dropped; only P01-P04 land), T-423 Done When (report + proposals), T-424 Done When 1-5, the withdrawal of T-425/T-426 (no code lands). Guardrails TEST-01, TEST-03, TEST-04; STYLE advisory. Gates: `quality_gates` (with `npm test`), the project gates the new rules name for a Full Check, one browser command per the new policy, Code Health.
2. Changed files: `reviewed.files` (plus Objective/Task records, router, task-ids). Entry points: `npm run check:browser` CLI (`run-browser.mjs` argument parsing, `selectSteps`, `addedStepsLimit`, `runSet` limit), the three rule docs.
3. Relied-on runtime: `runner.mjs` `runSet` (unchanged vs main) reading `browser.quickTotal` for a quick run; `tools/gate-limits.mjs` `loadLimits`.
4. Matrix below. Not applicable: text classes, serialisation, state machines (a CLI selector and docs only).
5. Admission: reproducible through a supported path, inside O-094's diff, credible consequence.

## Coverage matrix

| # | Criterion / cell | Result | Evidence (this session) |
|---|---|---|---|
| 1 | SC1 baseline report with measured times and a repeat map | Proven | `docs/evidence/test-cost/report.md` §1 (Vitest per file/test from test:full junit), §2 (`check:gates` 2026-11-22 03:59 UTC), §3 (recorded browser runs), §4 repeat map; baseline 454 s = 144.0 s gates + 310 s full tier, health excluded. |
| 2 | SC2 each cut names seconds per Check/Objective, what it caught, risk; protected list | Proven | `proposals.json` P01-P15 each carry `savedSecondsPerFullCheck`, `savedSecondsPerObjective`, `caught`, `risk`; report §5 "Protected list". Observation 6 (one inaccurate `keptBy`). |
| 3 | SC3 owner ticks recorded; only ticked cuts land | Proven | Objective Decisions: P01-P06 ticked, P07-P15 not; P05/P06 dropped after measurement. Diff contains only P01-P04 rule/runner changes. |
| 4 | T-425/T-426 withdrawn: none of their code lands | Proven | `git diff --stat df56850c..HEAD` over `packages/astraeus-demo-apollo11`, `apiRules/apiSurface/apiReference.test.ts`, `runner.mjs`, `tools/check-public-build.mjs/.d.mts`, `checkPublicBuild.test.ts`: empty. No tracked or untracked `*rebuildCache*`, `*apiPicture*`, `*public-build-stamp*` (git ls-files + find); no `node_modules/.cache/astraeus-*`; no `/tmp/astraeus-last-public-build`. Their task files remain as records only. |
| 5 | P01 in browser-policy: default quick (+skip-examples), quick + look-out for Camera/Layout/Shaders/Sky/Packaging, other full-tier steps only on their own paths; release full tier | Proven | `browser-policy.md` "Browser tiers" bullets 1-2 read; build.md Browser gate and verification.md bullet 9 say the same. |
| 6 | P02: hello-* only for packaging, `examples/`, public API; always at release | Proven | browser-policy bullet 3 names Packaging paths, `src/api/index.ts`, `api-surface.lock.json`; release and `publish.yml` (unchanged) keep them. |
| 7 | P03: engine-alone at release + engine imports / package.json / build config | Proven | build.md Engine-alone gate; verification.md. Matches P03's text. |
| 8 | P04: Full Check runs `npm test`; coverage at release / owner ask | Proven | build.md Full gate + health coverage line; verification.md; Design.md Code Health paragraph. `config.yml` unchanged and lists `npm test` only (DW4). |
| 9 | No other rule change (T-424 DW1) | Proven | Every changed line in the three docs maps to P01-P04 or the new runner flags. Observation 5 on the new "gates the diff calls for" phrase (no requirement removed). |
| 10 | Triggering paths per extra step sensible (reviewed against step scripts) | Proven, with observations | synthetic-journey (browser-smoke.mjs journey/nearSaturn/closeMarker checks: phone sheet, panels, event marks) -> shell/phoneLayout/panels/scene/script: covers I-185's cause. views (journey-views.mjs: view buttons, setView, camera follow/stay) -> Camera + view files: good. meteor-shower (play, seek, story panel) -> story + showers files. catalogue -> components.html, catalogue src/data, shelf: covers I-188. See observations 1-2 (camera / timeline gaps the owner's P01 risk text accepted). |
| 11 | Runner: `--tier quick --step look-out` adds to the tier, list order | Proven | My CLI probes (`node run-browser.mjs ... --list`): quick+look-out -> smoke, smoke-public-showers, planets-phone, look-out, 4 hello; order independent of flag order (`--step look-out --tier quick` same); duplicate `--step` deduped. |
| 12 | `--step` alone unchanged | Proven | `--step look-out --step smoke` -> smoke, look-out (list order), runSet label "steps" without a limit (read `run-browser.mjs`); existing gateLimits case "--step runs a named step whatever its tier" green. |
| 13 | `--skip-examples` | Proven | quick+skip -> 3 steps; full+skip+look-out -> 8 non-example steps; quick+look-out+skip -> 4 steps. |
| 14 | Malformed input | Proven | `--tier bogus --step look-out` exit 2; `--step nope` exit 2 naming it; unknown flag exit 2. Boundary: `--step hello-sky --skip-examples` selects nothing, exit 0 (observation 3). |
| 15 | New gateLimits cases are real outcome tests | Proven | They spawn the real `run-browser.mjs --list` and compare names against expectations derived from `STEPS` tiers, plus `selectSteps` and `addedStepsLimit` directly and the build.md row. T-424 evidence records 5 red against HEAD's runner. All pass in this session's suite. |
| 16 | DW3 / judge 3: gate-limits.json and build.md paired | Proven | `browser.quickLookOutTotal: 280`; build.md row `check:browser -- --tier quick --step look-out` 280 s; "docs/agents/build.md states the quick + look-out limit" and the existing "docs state the same limits as the file" tests green. |
| 17 | Judge 4: protected list not weakened | Proven | look-out runs whenever a Camera/Layout/Shaders/Sky/Packaging path changes; smoke and planets-phone in every run (quick tier); sceneLoadOrder, computedLook, orbitSetSync, packagePacks, workflowParity unchanged (no test file other than gateLimits in diff); check:three-newest rule unchanged; check:pack, measure:example, check:public-build ran in this Check; synthetic-journey and catalogue kept on their paths. |
| 18 | SC4 time target | Proven (51 %) | See "Time target". |
| 19 | Design reconciliation (T-424 drift notes) | Proven | Design.md "Verification in tiers", gate-times paragraph (196 s), Code Health paragraph updated; the check-full.md drift is I-202 (open, out of scope, left open). |

## Gates (this session, one sequential run under the shared gate lock, wall clock)

Run 2026-11-22T04:33:33Z-04:37:27Z, load average 1.6 at start.

| Gate | Command | Result | Time | Limit |
|---|---|---|---|---|
| typecheck | `npm run typecheck` | pass | 7.1 s | 20 |
| lint | `npm run lint` | pass | 15.8 s | 15 (over by 0.8 s; warning only; baseline 7.3 s) |
| build | `npm run build` | pass | 3.3 s | 15 |
| test | `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | **fail: 2 of 5435** (viewerIds wide cases, I-203) | 36.3 s | 55 |
| check:pack | `npm run check:pack` | pass; engine 1,826,428 B raw / 523,400 B gzip | 21.5 s | 35 |
| check:node-consumer | `npm run check:node-consumer` | pass | 10.6 s | 15 |
| measure:example | `npm run measure:example` | pass | 3.7 s | - |
| check:public-build | `npm run check:public-build` | pass | 4.1 s | 10 |
| browser | `npm run check:browser -- --tier quick --step look-out --skip-examples` | pass, 4 steps, error-lines 0; `docs/evidence/browser-quick-20261122T043516Z` | 130.6 s (summary 130 s) | 280 |
| test (rerun) | same `npm test` command, unchanged tree, 04:37:43Z | pass: 328 files, 5433 passed, 2 skipped | 36.0 s | 55 |
| health | `savepoint health check O-094` (after the green rerun) | snapshot created; does not block clearance | 9.4 s | - |

`npx vitest run packages/astraeus/tests/viewerIds.test.ts` alone (04:37:40Z): 8/8 pass. `git diff --check df56850c..HEAD`: clean. Not run, by the new rules: `test:full` (P04), `check:engine-alone` (no engine import, `package.json` or build-config change; P03), `check:shelf-split` (no shelf part), `check:three-newest` (no three change), `check:react-consumer` (release workflow).

**Test flake.** The red first run is the same load-sensitive failure the coordinator saw: both cases wait 1 s (Vitest's default) for `.developer-heading` after the drawer became an on-demand chunk in O-089 T-418. It failed at ~1.0-1.1 s, passed alone and on a full rerun. O-094 does not touch the file. The gate counts as green on the unchanged tree. I-203 records it.

**Browser choice.** The diff touches no Camera, Layout, Shaders, Sky or Packaging path, no step's own script and no public API, so the policy's default for this diff is `--tier quick --skip-examples`. The runner itself (`run-browser.mjs`, `browser-steps.mjs`) changed, and the T-424 run (`browser-quick-20261122T041912Z`) could not be reused: `runner.mjs` was rewritten at 15:29 local (T-426's revert) after that run at 15:19, and that run's log folder is gone, so I cannot prove the runner was the same. Under "when unsure, add its step" I ran one command, `--tier quick --step look-out --skip-examples`. That run is a superset of the default, and it is the only run to use the new additive and skip path together. It is also the run a code-touching Check would need. One browser run in this Check.

## Time target (measured the same way as T-423)

T-423 added up the gate wall times plus the browser run, health excluded: 7.1 + 7.3 + 3.2 + 55.2 (test:full) + 32.1 (engine-alone) + 20.6 + 7.0 + 3.7 + 7.8 = 144.0 s gates + 310 s full tier = **454 s**.

This Check: 7.1 + 15.8 + 3.3 + 36.3 + 21.5 + 10.6 + 3.7 + 4.1 = **102.4 s gates** + **130.6 s browser** (quick + look-out, skip-examples) = **233.0 s = 51.3 % of 454 s**. Half is 227 s, so this is **6 s over an exact half**. Health check (9.4 s) is excluded, as in the baseline; with it, 242.4 s (53 %). The flake rerun (36.0 s) is not part of the rules' Check cost; counted in, this run was 269 s (59 %).

Reasoning: the success condition says "at most about half". 51 % meets it. Most of the 6 s comes from machine noise in two gates, not from the rules. Lint took 15.8 s (7.3 s in the baseline) and node-consumer 10.6 s (7.0 s). With the baseline's lint and node-consumer times the total would be 225.8 s (49.7 %). For a diff that needs only the default (`--tier quick --skip-examples`, about 64 s by the step times: 130 − 66 look-out), the Check would be about 167 s (37 %). A diff that also adds synthetic-journey (+67 s) would be about 300 s (66 %), as report §7 already says.

## External-boundary and workflow lock (browser runner)

Configured vs actual target: `runSet` starts its own dev and preview servers (unchanged code). Evidence folder `browser-quick-<stamp>` (tier `quick` on the summary's first line, `added steps:` on the console only; T-424 recorded this limit). Total limit for quick+added is `addedStepsLimit` (280 for look-out). Failure output, timeout, cleanup: unchanged `runner.mjs`. Not applicable: redirect, secrets (no network or credentials). Workflow: one selection, then one runSet. Side effects are the evidence folder and the scratch logs, both unchanged from main.

## Issues

- **I-203** (defect, medium, out of O-094 scope, not material to O-094): two `viewerIds.test.ts` wide cases race a 1 s default `waitFor` against the lazily loaded Developer drawer. They made `npm test` red twice today.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-203 | Medium (2 of ~4 full runs today under parallel load) | Low-Medium (red gate, rerun cost ~36 s and checker time; no product defect) | Low for O-094 (not introduced or touched here); Medium for the gate | Direct repair under I-203, or fold into the next fast-suite Objective; does not block O-094 closure |

## Observations (non-blocking)

1. synthetic-journey's `nearSaturnChecks` (O-048 T-209: wheel zoom close to Saturn, far plane, depth mode, rings) exercises camera and depth code. The Camera paths switch on look-out and views but not synthetic-journey. The owner accepted this risk with P01 ("A camera ... change could break the made-up journey ... if the change sits outside the paths"). Adding the Camera paths (and any far-plane/log-depth file) to synthetic-journey's list would close the gap at +67 s for such diffs.
2. meteor-shower drives play and seek through the timeline controls in `packages/astraeus/src/shell/`. A timeline change triggers look-out (Layout) but not meteor-shower. This is the same accepted P01 risk.
3. `--step <example> --skip-examples` selects zero steps and exits 0. `runSet` has no empty guard, so a real run would pass with nothing checked. The flags contradict each other, so this is unlikely. A one-line "no steps selected" exit 2 would remove it.
4. `addedStepsLimit` always starts from `quickLookOutTotal`. `--tier quick --step smoke` (already in quick, no look-out) gets 345 s, and quick+look-out with `--skip-examples` keeps 280 s although about 40 s of examples are skipped. Limits only warn, so this is loose, not wrong.
5. verification.md's new "plus the project gates the diff calls for" does not name check:pack, check:node-consumer, measure:example and check:public-build as every-Check gates (the protected list includes check:pack, measure:example and check:public-build). The rules never named them as every-Check gates before either. Nothing is weakened, but the protected gates rest on practice, not on written rules. One sentence in build.md would mechanise it.
6. proposals.json P02 `keptBy` says `check:react-consumer` runs at every Check. It runs in the release workflow only (build.md). This is a report accuracy slip; the risk statement stays true through check:pack and node-consumer.
7. `docs/BROWSER_CHECKS.md` "Running it" still says the quick tier runs "the two public-build file checks" (stale since they became `check:public-build`; that sentence was not changed by this diff).
8. T-425 and T-426 carry `status: done` as "withdrawn" records. That is the coordinator's standing-rule practice, but the board shows two done Tasks that delivered nothing. The owner may prefer another marker.
9. lint 15.8 s exceeded its 15 s limit once (WARNING only; 7.3 s in the baseline, so likely a cold Prettier/ESLint cache).

## Code Health

Snapshot `sha256:1293b4227eeca2d9c93efdad08d8f6c4a01601bf312d8ddd7413d191c59682f3` (created), taken after the green test rerun: "Code Health does not block clearance". Complexity, duplication, dependency vulnerabilities and tests: no finding. Coverage: **stale**, as P04 expects (coverage refreshes at release or on the owner's ask). This is a note, not a finding.

## Closure readiness

Every owned Task is `done` (T-423, T-424 with owner check waivers; T-425/T-426 withdrawn and reverted, diff confirmed clean). This Check is CLEAR. I-202 (packaged skill drift) stays open as directed, and I-203 is out of scope; neither is material to O-094. The owner may accept the Objective outcome.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
