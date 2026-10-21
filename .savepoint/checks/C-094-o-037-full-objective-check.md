---
id: C-094
scope: {kind: objective, id: O-037}
result: NEEDS WORK
checked_by: {role: checker, session: o037-full-check-20261021}
executed_session: 9d85e5d6-91d4-454a-a0d6-81701c464056
checked_at: '2026-10-21T11:12:00Z'
health_snapshot: sha256:ec881d17a43d5e029ae394135845776bd01ab3c9ac4de34087cb226ffd6b0191
reviewed:
  base_commit: 2ad2dc03
  head_commit: 1b2072de
  files: [.savepoint/health/config.json, vite.config.ts, package.json, eslint.config.js, tools/lint/use-typescript6.cjs, .gitignore, AGENTS.md, .savepoint/Guardrails.md, .savepoint/Design.md, docs/BROWSER_CHECKS.md, src/app/AstraeusScene.tsx, src/app/sceneFrame.ts, src/app/scenePointer.ts, src/app/App.tsx, src/app/DeveloperSettings.tsx, src/app/OrbitSetView.ts, src/app/PathView.ts, src/core/sunCentredSources.ts, src/experiences/settingsFields.ts, src/experiences/showers/showerSettings.ts, src/experiences/planets/planetSettings.ts, src/experiences/planets/planetDefinition.ts, src/shell/AstraeusShell.tsx, src/shell/useDrawers.ts, src/shell/TimelineBar.tsx, src/shell/infoModel.ts, src/shell/metrics.ts, tools/validate/harness.mjs, tools/validate/driver-guard.mjs, tools/validate/runner.mjs, tools/validate/load-budget.mjs, tools/validate/browser-jupiter-io.mjs, tests/sceneFrame.test.ts, tests/sceneCamera.test.ts, tests/sceneTargets.test.ts, tests/sceneBodies.test.ts, tests/browserDriverGuard.test.ts]
  dependencies: [package-lock.json]
issues: [I-060, I-061, I-062, I-063, I-064, I-065, I-066]
unmet: [SC2, SC4, SC5, SC6, SC8]
supersedes: null
---

# C-094: O-037 Full Objective Check

Independent session: did not plan, build, coordinate or mark any O-037 Task. Diff `2ad2dc03..1b2072de` (95 code/record files, plus 190 evidence files removed). T-122 to T-128 are `done` with owner Task-check waivers (TEST-04 satisfied); T-127's owner replan and T-123's owner-run deletion are taken as recorded.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated, no finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. O-037 Success Conditions 1-8; Task Done When lists (T-127 as replanned); Guardrails ARCH-01/02/04, TEST-01/03/04, CODE-01/02; Astraeus browser and evidence rules; G-007 boundary (nothing visitors see gets worse).
2. Changed files above; entry points: `npm run lint|typecheck|build|test|test:full`, `npm run check:engine`, `check:demo`, `savepoint health check`, the scene frame (`runFrame`), the settings parsers, the public build.
3. Relied-on: Vitest v8 coverage, ESLint + typescript-eslint through the TS 6 shim, the runner's dev/preview servers, lizard/jscpd/osv through the health config.
4. Axes: gate pass/fail; scanner scope; coverage freshness; lint rule boundary (20 passes, 22 fails; `.ts`, `.tsx`, `.mjs`); frame stage order versus the old callback; harness guard; runner retention; evidence prune; Design/AGENTS reconciliation. Text-class, colour and redirected-output axes not applicable (no text-width or terminal output in scope).
5. Admission: a reproducible failure of a Success Condition or Done When item through a supported command.

## Coverage matrix

| Cell | Expected | Actual | Class |
|---|---|---|---|
| SC1 scanner exclusions in `exclusions` and args, both tools | 7 globs in both | present in both (config read) | Proven |
| SC1 duplication ≤3% on official check | ≤3% | 1.43% (74 clones, 929 lines), Watch | Proven |
| SC2 coverage include/exclude in `vite.config.ts` | as Decision 2 | matches | Proven |
| SC2 full gate writes fresh coverage | exit 0, report written | exit 1 twice, no report (I-060) | Issue |
| SC3 lint gate configured, tree clean | exit 0 | `npm run lint` exit 0, 3.2 s; `quality_gates.lint` set | Proven |
| SC3 rule boundary, independent probe | 22 fails, `.tsx` and `.mjs` | stdin probes: `P` and `q` complexity 22 rejected, exit 1 | Proven |
| SC4 callback is stage calls only; stage order unchanged | same order as old callback | `runFrame` order matches 2ad2dc03 lines 297-363 statement for statement; pointer effect moved verbatim | Proven |
| SC4 each stage has a node test | 8 stages tested | 5 of 8 (I-063); sceneBodies 100%, sceneCamera 91.7% stmts | Issue |
| SC4 engine set shows no change | exit 0 | 15/16 steps exit 0, zero error lines; `public-build-assets` fails (I-061) | Issue |
| SC4 owner look on preview | owner judgement | pending (see below) | Unverified (owner) |
| SC5 one harness; guard forbids launch/newPage/newContext | no direct calls | `grep` finds none outside harness; guard test passes | Proven |
| SC5 `tools/archive` gone | absent | absent | Proven |
| SC5 small `src` repeats merged | merged or recorded | 3 merged, 1 recorded as accepted (T-125 DW5 allowance) | Proven (observation) |
| SC5 check sets exit 0, zero console errors | exit 0 | engine fails (I-061); planets fails jupiter-io phone (I-065); showers/apollo not run (owner) | Issue |
| SC6 uncited folders removed, no pictures | 0 pictures | 0 png/jpg, 4 tracked GIFs remain (I-064) | Issue |
| SC6 retention in practice | summary + results only, logs outside | engine, planets and the killed showers folders hold only `summary.txt` and `*results*.json`; logs at `/tmp/astraeus-check-logs-*`, path printed | Proven |
| SC6/SC7 AGENTS rules, Build, Codebase Map, CODE-01/02, I-059 | present | present; I-059 open, `agent-skills/` untouched | Proven |
| SC7 Design reconciled, deferred notes accounted | reflected | scene and validate rows and O-037 paragraph present | Proven |
| SC8 complexity Watch or better | ≤20 | 38, Needs attention (I-062) | Issue |
| SC8 coverage fresh | fresh | absent (I-060) | Issue |
| SC8 typecheck/build/lint/test | pass | typecheck, build, lint pass; full test gate fails (I-060) | Issue |

External boundary (runner, servers, Vitest, ESLint shim): configured and actual targets match; dev/preview start and stop worked in completed runs; a non-success step is reported in the summary and the exit code; logs carry no secrets. Killed showers run left its two servers (ports 5479/5480) orphaned because the runner's parent was killed externally; the checker stopped them (observation, not a runner defect: SIGKILL cannot be trapped).

## Gates and commands (2026-10-21, this machine)

- `npm run test:full`: 10:48:16Z, 59.5 s, exit 1 (1 failed, 1281 passed, 1 skipped; `tests/compositions.test.ts` (i) timeout 5.51 s). Rerun once as a likely timing fault: 10:49:32Z, 57.8 s, exit 1, same test 5.29 s. Same test passes alone with and without coverage. No `coverage/coverage-final.json` either time; `junit.xml` written.
- `npm run lint` 10:50:38Z exit 0 (3.2 s); `npm run typecheck` 10:50:41Z exit 0; `npm run build` 10:50:45Z exit 0 (chunk-size warning only).
- `git diff --check 2ad2dc03..HEAD` (code): one trailing space, `src/app/DeveloperSettings.tsx:157` (observation).

## Code Health

`savepoint health check O-037` 10:51:05Z, after the full gate: snapshot `sha256:ec881d17a43d5e029ae394135845776bd01ab3c9ac4de34087cb226ffd6b0191` (created, official). Verdict: **blocks clearance** (failing test, one high vulnerability).

| Signal | Value | Rating | SC |
|---|---|---|---|
| Duplication | 1.43% | Watch (meets aim; Good needs three checks) | SC1 met |
| Complexity | 38 max (AstraeusScene, lizard); 2 functions over 20 | Needs attention | SC8 unmet (I-062) |
| Coverage | no report | Unknown (collection failure, not a code measurement) | SC2/SC8 unmet (I-060) |
| Tests | 1 failing | Needs attention | I-060 |
| Vulnerabilities | vite 8.3.2: 1 high, 2 medium | Needs attention; pre-existing on main | I-066 |

## Browser sets and owner decisions

Run strictly one at a time before the owner's change of plan reached this session:

- `npm run check:engine` 10:51:33Z-10:56:05Z, 272 s, exit 1: 15 steps exit 0 with zero error lines; `public-build-assets` exit 1 (I-061). `docs/evidence/engine-20261021T105133Z`.
- `npm run check:demo -- planets` 10:56:05Z-11:03:06Z, exit 1: six steps exit 0; `jupiter-io` phone pass failed (I-065), not rerun. `docs/evidence/demo-planets-20261021T105605Z`.
- `check:demo -- showers` started 11:03:06Z and was killed by the coordinator on the owner's instruction: counts as not run (folder `docs/evidence/demo-showers-20261021T110306Z` is a partial run). `check:demo -- apollo`: not run.

Owner decisions, relayed by the coordinator during this Check (2026-10-21): "Nope nope nope we cut down browser chevks" and then "Tests and health only, you look (Recommended)". Recorded as an explicit owner decision, not a pass: the showers and apollo sets were not run, and the changed scripts under T-126/T-127 in those sets are proven only by `node --check`, the driver guard test and the scripts that did run above. Results already obtained are recorded as what they are. T-123 retention is additionally shown in practice by the completed runs above.

## Owner validation still needed

- T-124 `owner_validation.required` / SC4: the owner's look on the preview (`localhost:5490`) at Apollo 11, Showers and planets: scene, labels, markers, hover, tap, camera, phone drawers. **Pending owner judgement**; headless runs do not replace it.

## Adversarial pass

- Bypass of the lint rule by file type: `.tsx` and `.mjs` probes rejected; `.cjs`/`.js` not linted (only the shim and `eslint.config.js`; observation).
- Stage order and state: `FrameState` replaces five refs; the pointer listeners read `frameState.current` live, so `pickables` and `hoverPoint` keep their per-frame semantics; `createFrameState` runs once per mount as the refs did.
- Error order in `parseShowerSettings` can change for multi-fault settings (T-125 note); single-fault messages unchanged (observation).
- A failing test anywhere suppresses the coverage report (I-060), which is how the official snapshot lost coverage.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-060 full gate fails, no coverage | High (every run here) | High: SC2/SC8 are the Objective's purpose | High | Fix now |
| I-061 load budget vs new chunk | High (deterministic) | Medium: published-site budget check red; site itself likely fine | Medium | Fix now (small) |
| I-062 lizard complexity 38 | High | Medium: SC8 signal stays red | Medium | Owner decides: reduce or accept as lizard mis-measure |
| I-063 three stages untested | High | Low-Medium: CODE-02/SC4 promise | Medium | Combine with I-060 repair |
| I-064 four GIFs | High | Low: 7 MB | Low | `git rm` or owner keeps |
| I-065 jupiter-io phone | Unknown (one run) | Medium if real | Medium | One rerun of that script when the owner allows |
| I-066 vite advisory | High | Medium; pre-existing, outside O-037 | Low for O-037 | Defer to follow-up or owner acceptance |

## Observations

- Lizard still counts 11 `.claude` hook rows and jscpd lists `.claude/hooks` clones; left as measured per T-128 (owner may add the exclusion).
- `synthetic-listed` and `synthetic-ring` engine steps leave empty result folders.
- Evidence results are named `results.json` or `<script>-results*.json`; both are results files.
- Trailing whitespace at `src/app/DeveloperSettings.tsx:157`.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — three frame stages and `scenePointer.ts` have no node test (I-063).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — the load-budget page lists duplicate the build's chunk graph by hand, which is why the new chunk broke them (I-061).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — T-127 touched about 40 files for one lint rule (owner replan accepted it).

## Verdict

NEEDS WORK. Unmet: SC2, SC4 (stage tests; owner look pending), SC5, SC6 (GIFs), SC8. SC1, SC3 and SC7 are proven. No Task is retreated; remediation is direct repair under I-060 to I-065 (I-066 is pre-existing), then one full recheck.
