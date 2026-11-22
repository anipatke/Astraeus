---
id: C-213
scope: {kind: objective, id: O-090}
result: CLEAR
checked_by: {role: checker, session: check-o090-20261122}
executed_session: orchestrate-g024-20261122 (T-434..T-440 builders, coordinator)
checked_at: '2026-11-22T06:40:00Z'
health_snapshot: sha256:489d72a1a770a538825b264a26a90896c01be9da3785adc5505fd8e8c17b2b08
reviewed:
  base_commit: 7831fd89
  head_commit: 85c53a9d
  files: [README.md, docs/README.md, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, docs/agents/build.md, docs/ASTRONOMY_VALIDATION.md, docs/MOON_ORBITS.md, docs/NPM_PACKAGING.md, docs/RELEASING.md, docs/architecture/codebase-details.md, docs/architecture/reconciliation-history.md, docs/architecture/state-and-assets.md, .savepoint/Design.md, packages/astraeus/README.md, packages/astraeus/NOTICE, packages/astraeus/CHANGELOG.md, packages/astraeus/data/ephemerides/README.md, packages/astraeus/src/api/aboutInput.ts, packages/astraeus/src/api/look.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus-site/assets.html, packages/astraeus-site/index.html, packages/astraeus-site/tools/site/api-reference.mjs, packages/astraeus-site/tools/site/api-reference.d.mts, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tests/apiReference.test.ts, packages/astraeus-site/tests/gateLimits.test.ts, tools/check-packs.mjs]
  dependencies: []
issues: []
supersedes: null
---

# C-213: O-090 Full Objective Check

Fresh session; it did not plan, build, coordinate or repair any O-090 work. Diff `main...HEAD` (`7831fd89..85c53a9d`), 42 files. T-434..T-440 are `done` with owner `check_waiver`s; this Check covers every Task. Owner decisions applied as requirements: the five-step docs-trim plan and "Fix the NOTICE too, drop VSOP87".

**Result: CLEAR.** Every listed contradiction is gone from the current docs and points at a named owner; history is labelled; the plan order holds (T-435 checks, T-436/T-437 entry points, T-438/T-439 architecture and guides, T-440 verify). Code changes are doc comments plus the API-page lead, which now reads the manifest version. All gates pass. No Issue opened.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner and public build only; the pass/fail of each is the gate result)
- [x] Workflow And Side-Effect Check Lock (n/a: no multi-step or side-effecting workflow changed; runner and check-packs edits are comments)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Success Conditions SC1 to SC4 (SC4 = owner plan, its order, named owners, one place to update, three-question read-through, word-count report); guardrails PROV-01/02, ARCH-06 (as "mechanise where cheap"); gates below.
2. The 42 files of `main...HEAD`; entry points: root README, engine README (npm page), generated API page, Design, docs guides, packed NOTICE/README.
3. Relied-on generators and tests: `api-reference.mjs`, `api-rules.mjs` error table, `gateLimits.test.ts`, `workflowParity.test.ts`, `build-packages.mjs`/`check-packs.mjs`.
4. Matrix below. 5. Issue boundary: a false or unreachable current statement introduced or touched by O-090 with a reader-visible consequence.

## Coverage matrix (independent probes)

| Row | Probe | Result |
|---|---|---|
| C1/C24 workspaces | `package.json` dirs: 13 (9 public = `PACKAGES` in `build-packages.mjs`, 4 private); README names groups, no count; codebase-details has dated amendment | Pass |
| C2-C6c provider | grep `vsop` over all 17 edited current docs + NOTICE + site HTML: only "no longer VSOP87A", dated history, superseded section, dated amendments; `planetModels.ts:57` doc says Horizons fits; NOTICE line 14 Horizons only (owner decision) | Pass |
| C7-C12d browser workflow and timing | README `Running the checks` names quick/full and the usual Check command, links policy; BROWSER_CHECKS one dated measurement, cited folders' `summary.txt` say 310 s / 124 s as quoted | Pass |
| C13/C14 roadmap | `Status and roadmap` removed | Pass |
| C15 API lead | built `dist/api/index.html`: "This is version 0.9.5", `preview` 0; manifest 0.9.5; `apiReference.test.ts` case also renders `7.8.9` | Pass |
| C16-C21, C26-C28 package guidance | RELEASING nine with dated history; NPM_PACKAGING links `LIMITS`; packed `dist/README.md` identical to source, only relative links `./CHANGELOG.md` (packed), 27/27 API anchors exist on the built page; `dist/NOTICE` no VSOP | Pass |
| Links | own script (relative paths + GitHub-slug anchors, code fences skipped) over all 25 edited non-record Markdown files: 163 links, 0 bad | Pass |
| Quoted section refs | 13 `<doc> "<heading>"` refs in edited files: 12 resolve; Design `engine README "Host calls"` names no heading (carried from `main`, see Observations) | Observation |
| Design vs history | 61 headings kept; 32 "Detail as built, 2026-11-22" links resolve to the moved `####` blocks, whose header says code/tests/API page own current values; each summary names its current contract (tests, notes, policy). Only duplicate heading in history is "Current Technical State", and Design links the distinct `#current-technical-state-gate-times-and-tests` | Pass |
| Engine README coverage | headings: Install, A scene in about 20 lines, The public API (bodies, story, sky/camera/looks/views, Numbers without a viewer = headless), In a React app, The handle: lifecycle, Errors (generated table), Loading, What `astraeus-data` adds, Working on the engine (absolute links); first-scene snippet byte-identical to `main` | Pass |
| Moved guidance faithful | sampled moved doc comments vs code: obliquity 84381.406 (old README text), 128/4096 provider samples (`providerPathTimes.ts`), `setTimeline` ms warning (`story.ts:224`) | Pass |
| gateLimits undated-time test | regex probe: rejects "about 125 s", "about 40 s", "under a minute", "runs in 34.3 s"; passes table rows and "within 30 s of the event" | Pass (heuristic gaps, see Observations) |
| Read-through and report | T-440 records the coordinator's fresh Sonnet read-through (paths, five ambiguities, fixes) and before/after word counts; recounted: engine README 18,907 -> 5,898, Design 17,233 -> 4,131, README 2,359 -> 1,537 | Pass |
| History marked | codebase-details, state-and-assets, RELEASING setup, NPM_PACKAGING, ASTRONOMY_VALIDATION, MOON_ORBITS, ephemerides README carry dated labels | Pass |

## Gates (2026-11-22, this session)

| Gate | Result | Wall time |
|---|---|---|
| `npm run lint` | exit 0 | 16.2 s (limit 15 s: over, warning-class only) |
| `npm run typecheck` | exit 0 | 7.3 s |
| `npm run build` | exit 0 | 3.2 s |
| `npm test` (junit) | 337 files, 5487 passed, 2 skipped | 36.8 s |
| `npm run check:public-build` | pass; `docs/evidence/public-build-20261122T063211Z` | 4.2 s |
| `npm run check:pack` | pass; engine budget 1,827,398 B raw / 523,686 B gzip | 23.9 s |
| `git diff --check main...HEAD` | clean | - |
| `npm run check:browser -- --tier quick --step look-out --step views --step meteor-shower` (once) | 10 steps exit 0, 0 error lines; total 229 s (limit 340 s); `docs/evidence/browser-quick-20261122T063424Z` (06:34:24Z-06:38:13Z) | 229 s |

Browser tier (browser-policy, by path): the diff touches `src/api/planCamera.ts` (Camera list, and `views`), `src/api/story.ts` (`meteor-shower`) and `tools/check-packs.mjs` (Packaging, so the packed examples run and `--skip-examples` is left out). All are comment-only edits, but the policy chooses steps by path and says to add a step when unsure.

## Code Health

`savepoint health check O-090` (06:34:01Z): snapshot above, "Code Health does not block clearance". complexity, vulnerabilities and duplication: no finding. Coverage stale (expected: Full Checks run `npm test`). Tests "stale" although `junit.xml` (06:32:11Z) is newer than HEAD; probably later evidence-folder writes. That is a collection fact, not a finding.

## Issues

None. No materiality actions required.

I-205 (doc-link test, low): acceptable backlog, does not block. SC2 asks for counts and scenario lists to be linked or tested, and they are (gateLimits, workflowParity, apiRules). Links all resolve today (163/0). The test is an ARCH-06 improvement, not an unmet criterion.

## Observations (non-blocking)

- Design `Host calls land in order` cites engine README "Host calls", but no heading has that name. The rule is the **Order rule** paragraph under "The handle: lifecycle, time and events". The text was on `main` ("README") and T-438 kept it. Fold the fix into the I-205 repair, and consider having that test also resolve quoted `"<heading>"` references.
- The undated-time regex in `gateLimits.test.ts` covers five files with lead words (about/under/took/in/around). It misses "takes 34.3 s", "~125 s" and "roughly 2 min", and any date on a line exempts the whole line. It is a heuristic guard, and Design is outside it.
- Lint ran 16.2 s against its 15 s limit in this session (a single measurement, not `check:gates`).
- BROWSER_CHECKS and the test-cost report cite run folders that are untracked in git. Same pattern as earlier Checks; they are kept whole under the retention rule.
- The fresh read-through was not rerun after T-440's fixes (T-440 notes this). My own spot-checks of the three answer paths agree with it.

## Owner validation still needed

None required by the Objective. The owner may read T-440's word-count and duplication report.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** (lead version: manifest and explicit value)
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** (version from manifest; limits from `gate-limits.json`/`LIMITS`)
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: 42 files, +1,738/-628. Expected for a docs-wide trim, and mostly verbatim moves.

## Closure

Every owned Task is done with a waiver. This Check is CLEAR and current. No material Issue is linked; I-205 is backlog. The owner may accept the O-090 outcome.
