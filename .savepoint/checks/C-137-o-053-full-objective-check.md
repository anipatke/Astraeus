---
id: C-137
scope: {kind: objective, id: O-053}
result: NEEDS WORK
checked_by: {role: checker, session: o053-check-20261101}
executed_session: o053-run-20261101
checked_at: '2026-11-01T06:05:00Z'
health_snapshot: sha256:cf34c247f78ce887383412b1873c6482fd013fa19b93da73b845bebc5335555e
reviewed:
  base_commit: 88167b76
  head_commit: 47aae03a
  files: [tools/api-surface.mjs, tools/api-surface.d.mts, tools/api-rules.mjs, tools/api-rules.d.mts, tools/check-packs.mjs, tools/check-packs.d.mts, tools/check-react-consumer.mjs, tools/check-react-consumer.d.mts, package.json, package-lock.json, .github/workflows/publish.yml, packages/astraeus/package.json, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus-data/package.json, packages/astraeus-data-jupiter/package.json, packages/astraeus-data-saturn/package.json, packages/astraeus-data-uranus/package.json, packages/astraeus-data-neptune/package.json, packages/astraeus-data-mars/package.json, packages/astraeus-data-pluto/package.json, packages/astraeus-site/tests/apiSurface.test.ts, packages/astraeus-site/tests/apiRules.test.ts, packages/astraeus-site/tests/packageBoundaries.test.ts, packages/astraeus-site/tests/packagePacks.test.ts, packages/astraeus-site/tests/apiOutsideTypes.allowlist.json, packages/astraeus-site/tests/apiTypeLint.allowlist.json, packages/astraeus-site/tests/apiErrors.allowlist.json, packages/astraeus-site/tests/apiSettings.allowlist.json, packages/astraeus-site/tests/apiIsolation.allowlist.json, docs/agents/build.md, .savepoint/Design.md]
  dependencies: []
issues: [I-133, I-134]
unmet: [O-053/API-surface-lock, O-053/Outcome, API-01, API-03]
supersedes: null
---

# C-137: O-053 Full Objective Check

This is the mandatory Full Objective Check of O-053, "Write the API rules down and enforce them" (G-016). It covers T-228, T-229 and T-230: `git diff 88167b76..47aae03a` (main to HEAD, 3 commits, 41 files, +4596/-43). All three Tasks are `done`. Each has an owner `check_waiver` (run rules "orchestrate 053", session o053-run-20261101), so this Check is the one technical gate.

**Independence.** This session did not plan, build or coordinate O-053, and it is not a lane (`git rev-parse --git-dir` = `--git-common-dir` = `.git`). It wrote only: gate outputs (`coverage/`, `junit.xml`, `dist/`, packed tarballs in temp folders), one official health snapshot, one browser evidence folder `docs/evidence/browser-20261101T055531Z/`, temporary planted edits (each copied aside, restored after its run, and shown restored by `git status`), probe scripts in the checker scratchpad (`probes/plant.sh`, `probes/shellcss.mjs`, `probes/fibercap/`), I-133, I-134 and this record. It did not read or touch `docs/prds/`, `docs/research/` or the modified G-012/13/14 `Release.md` files. Times are UTC.

**Verdict: NEEDS WORK.** Almost every check works, and I proved each one fails on my own plants: the lock, outside types, deep-import counts, type lint, throw and message scans, error table, settings mapping, id scan, `app/style.css` selector scan, README tables, data peer rule and React consumer. Two gaps break the Objective's promise that "from here on a change that breaks an API rule fails a test". **I-133:** the surface lock records the source `exports` maps, not the maps npm publishes (`x-publish.exports`). A planted published deep entry passed the lock and `check:pack`. **I-134:** the CSS selector scan reads only `src/app/style.css`. The six shell stylesheets the viewer ships hold 289 unscanned, unallowlisted selectors outside `.astraeus-shell`, and a planted `body {}` there passed. Both are narrow repairs. No Task retreats: remediation is a direct repair under each Issue.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (lanes and manifests are advice; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria:** O-053 Outcome and its eight Success Conditions (surface lock, front door, public-type lint, errors, settings mapping, isolation scans, honest versions and docs, proof), the Architectural Considerations (checks run in `npm test`/`check:pack`; allowlists are data next to their checks; no public API change except `./package.json` and the React peers), and each Done When of T-228, T-229 and T-230. **Guardrails:** API-01, API-03, API-04, API-05, API-06, API-07, TEST-01..03, CODE-01, STYLE (advisory). **Release gates:** `quality_gates`, `test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer`, and one `check:browser`.
2. **Changed files:** the `reviewed.files` list. **Entry points:** `npm test` (the vitest suites named below), `npm run api:lock`, `npm run api:errors`, `npm run check:pack`, `npm run check:react-consumer`, `.github/workflows/publish.yml`.
3. **Relied-on orchestration:** the TypeScript 6 compiler API (`typescript6`), `collectExports` (`packages/astraeus-site/tools/site/api-reference.mjs`), `tools/build-packages.mjs` (`x-publish` to `dist/package.json`), npm registry resolution of peers (`npm view`, `npm install`).
4. **Matrix axes:** for each check, the clean tree, a planted break on the real tree, a stale or falling entry, a bypass path, and synthetic samples. Not applicable: text classes, colour/TTY and serialization round trips (no text-width or output-mode behaviour in scope); state transitions (the checks are stateless scans).
5. **Admission boundary:** a supported edit to the tree (source, manifest or stylesheet that ships in the package) that breaks a Guardrails Public API rule and that the Objective promises to catch, yet passes the normal test run and `check:pack`. A theoretical scanner gap with no plausible code path is an observation.

## Coverage Matrix

Commands: plants ran through `probes/plant.sh <name> <file> …`, which copies the file aside, applies the plant, runs `cd packages/astraeus-site && npx vitest run tests/apiRules.test.ts tests/apiSurface.test.ts tests/packageBoundaries.test.ts` and restores the file. Baseline with no plant: `Tests 31 passed (31)`.

| # | Check (rule) | Cell | Plant / input (checker's own) | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| 1 | Surface lock (API-01) | clean | tree | pass | pass (31/31) | Pass |
| 2 | Surface lock | new root export | `export type PlantedAlias = number;` in `src/api/index.ts` | fail, named | `added root export PlantedAlias`, run `npm run api:lock` | Pass |
| 3 | Surface lock | changed member | `readonly sizeFactor?: number` in `MountOptions` | fail | `changed root export MountOptions …` (and type lint + README table also failed) | Pass |
| 4 | Surface lock | determinism | `npm run api:lock` and `npm run api:errors` on the clean tree | no diff | `git diff --stat -- packages/` empty | Pass |
| 5 | Surface lock | **published exports map** | `"./core/clock": "./src/core/clock.js"` added to engine `x-publish.exports` | fail | `apiSurface.test.ts` 6 passed; `check:pack` pass; `dist/package.json` exports gained `./core/clock` | **Issue I-133** |
| 6 | Outside types (API-01) | planted / stale / synthetic | builder plant (internal `Trajectory`) re-read; synthetic `Hidden`/`Local`/stale `Gone` test in `apiSurface.test.ts` | fail | test passes on tree with 24 entries; synthetic cases assert the failures | Pass |
| 7 | Deep-import counts (API-01, D6) | rise | `import "astraeus/app/App";` at top of a site test file | fail | `astraeus-site: 95 deep imports …, up from 94` | Pass |
| 8 | Deep-import counts | fall / new package | synthetic tree in `packageBoundaries.test.ts` "fails a count that rises or falls" | fail | asserted | Pass |
| 9 | Type lint (API-04) | unit | `sizeFactor: number` (row 3) | fail | `type lint: new break unit MountOptions.sizeFactor` | Pass |
| 10 | Type lint | centre/time/span/frame/loose | synthetic sample "fails on a made-up public type with every kind of break"; review-named breaks asserted present | fail / present | 12 hits as listed; 9 review breaks present | Pass |
| 11 | Errors (API-05) | plain throw | `throw new TypeError("planted")` in `src/api/time.ts` | fail | `errors: new break throw time.ts: …` | Pass |
| 12 | Errors | unknown-param rethrow (bypass) | `function plantedRethrow(value: unknown): never { throw value; }` | judgement | passes (any `unknown` parameter counts as a rethrow) | Observation O4 |
| 13 | Errors | message match / table sync | synthetic sample (3 message forms) and drifted table; builder plants re-read | fail | asserted | Pass |
| 14 | Settings (API-06) | new address param | `new URLSearchParams(search).has("plantedflag")` in `src/app/address.ts` | fail | `address setting "plantedflag" has no public setting key` | Pass |
| 15 | Settings | stale entry | `addressOnly` gains `nosuch` | fail | `stale addressOnly entry "nosuch"` (1 failed / 16 passed) | Pass |
| 16 | Id scan (API-03) | `setAttribute("id", …)` | appended to `src/shell/bootLoader.ts` | fail | `ids: new break id shell/bootLoader.ts: el.setAttribute("id", "planted")` | Pass |
| 17 | CSS scan (API-03) | `app/style.css` | `* { box-sizing: border-box; }` appended | fail | `selectors: new break selector *` | Pass |
| 18 | CSS scan | **shipped shell stylesheet** | `body { margin: 0; }` appended to `src/shell/style.css` | fail | 31 passed | **Issue I-134** |
| 19 | README tables (API-07) | invented row | a table row naming `handle.plantedMember`, inserted before the `mount` row | fail | `handle.plantedMember is not a MountedScene member` | Pass |
| 20 | README tables | missing key | row 3 (`sizeFactor` not in README) | fail | `README does not list sizeFactor` | Pass |
| 21 | Data peers (API-07) | wrong ceiling | `astraeus-data-jupiter` peer `>=0.7.0 <0.9.0`, `npm run check:pack` | fail | `FAIL astraeus-data-jupiter: astraeus peer is >=0.7.0 <0.9.0 …` / `pack check: FAIL (1 problems)`; restored → `pass (17.3 s)` | Pass |
| 22 | React peers (API-07) | range | `packagePacks.test.ts` plants `<19.4`; peers read `>=19 <20` | fail / pass | asserted; `check:react-consumer` pass with 19.3.1 | Pass |
| 23 | React consumer | upstream cap below newest 19.x | `probes/fibercap`: fake `fakefiber` peer `react >=19 <19.3` + fake engine peer `>=19 <20`, `npm install` both tarballs | judgement | npm installs `react 19.2.9`, not the newest 19.3.1, so the real check's "installed = newest" test would fail | Observation O1 |
| 24 | Allowlist growth | new break + new entry | `throw new TypeError` in `time.ts` and a matching `apiErrors` entry | judgement | 17 passed | Observation O2 |
| 25 | Docs | banners, style note, address rows, camera comments, `./package.json` | read README, `index.ts`, `package.json`, `mount.ts`, `viewerLink.ts`, CHANGELOG | fixed | "0.2 preview" gone (grep empty); style note, `address` rows, comments and CHANGELOG bullets present | Pass |
| 26 | No behaviour change | src diff | `git diff main..HEAD -- packages/astraeus/src`, non-comment lines | none | only the `SceneErrorCode` union reflowed one member per line (same 21 codes) | Pass |

**External boundary (`check:react-consumer`, `check:pack`):** configured target = actual target (npm registry; `npm view react@">=19 <20"` → 19.3.1; installed 19.3.1). An unavailable registry fails with the `npm view` error and `react consumer: FAILED` (read from `run()`, which throws on non-zero). Scratch folder is removed in all paths (`rmSync` after `try/catch`). Non-success install surfaces npm's output (builder plant, ERESOLVE). There are no secrets. Redirects and timeouts belong to npm, outside the lock.

**Workflow lock (`check:react-consumer`):** registry query → build engine → `npm pack` → scratch `npm install` → consumer render → version compare → packed-peer compare. Each step throws into one catch, the scratch folder is cleaned after, and the exit code is 1. Final state on failure: nothing published, temp folder gone. Proven by the pass run and by the builder's ERESOLVE plant. **`api:lock`/`api:errors`:** single-file writes, deterministic (row 4).

## Acceptance Coverage

| Criterion | Status | Evidence |
|---|---|---|
| API-surface lock: root exports + each published package's `exports` map; change without lock update fails | **Issue (I-133)** | root exports proven (rows 2-4); the published map is not what is locked (row 5) |
| Reachable-type check with allowlist (ExperienceDefinition, BodyId, ViewPlace, DisplaySwitchPlace, LineStretchInput …) | Proven | row 6; 24 entries, each with reason, F-number and O-057 |
| Front door: deep-import counts per package, only go down | Proven | rows 7-8 |
| Public-type lint (unit, centre, time, span, frame, loose) with allowlist naming finding + Objective | Proven | rows 3, 9-10 |
| Errors: plain-throw scan, message-text scan, generated README error table + sync test | Proven | rows 11, 13; observation O4 |
| Settings mapping test, address-only allowlisted for O-056 | Proven | rows 14-15 |
| Isolation: id-literal scan over `src/shell`+`src/app`; CSS scan over `app/style.css` | Proven as worded | rows 16-17 |
| Outcome / API-03: "a change that breaks an API rule fails a test" for viewer styles | **Issue (I-134)** | row 18 |
| Honest versions: data peers = engine minor in `check:pack`; React `>=19 <20` + latest-19 CI build; `./package.json` export; docs fixed; README tables tested | Proven | rows 19-25; observation O1 |
| Proof: each check fails on a plant and passes on the tree; allowlist entries name F-number/Objective | Proven | matrix; metadata tests in `apiRules.test.ts`/`apiSurface.test.ts` |
| No behaviour change; no public API change beyond `./package.json` and React peers | Proven | row 26; lock diff in the T-228..T-230 commits |
| T-230 Design reconciliation of drift | Proven (reflected) | Design.md "O-053 checks" accounts for every T-228/T-229/T-230 drift note. Its "limits" cover the subjects of I-133 and I-134 but name no owning Objective or owner acceptance. |

## Gates

All ran fresh on HEAD 47aae03a with a clean tree (apart from the three untouched Release.md files and untracked owner docs), 2026-11-01. Logs are in the checker scratchpad (`gate-*.log`).

| Command | Result |
|---|---|
| `npm run lint` | exit 0 (05:49:06-05:49:09) |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 (chunk-size warning only) |
| `npm run test:full` (full gate, coverage + junit) | exit 0; 181 files passed, 2229 passed, 1 skipped; coverage statements 92.06%, branches 87.11%, functions 92.39%, lines 94.53% |
| `npm run check:engine-alone` | `engine alone: pass in 21.1 s` |
| `npm run check:pack` | `pack check: pass (14.6 s)` |
| `npm run check:node-consumer` | 9 passed, `node consumer: pass` |
| `npm run check:react-consumer` | `registry: newest React 19.x is react 19.3.1` / `installed: react 19.3.1, react-dom 19.3.1; AstraeusScene rendered 60 characters on the server` / `react consumer: pass` |
| `git diff --check main..HEAD` | clean |
| `npm run check:browser` (once, 05:55:31-06:01:25) | exit 0; all 9 steps exit=0, error-lines=0 (smoke, smoke-public-showers, planets-phone, meteor-shower, views, hello-scene, hello-react, public-build-assets, public-addresses); total 354 s; evidence `docs/evidence/browser-20261101T055531Z/summary.txt` |

`npm test` (the configured `quality_gates.test`) runs the same Vitest suite that `test:full` ran with coverage, so it was not run a second time.

## Code Health

`savepoint health check O-053`, run after the full gate: snapshot `sha256:cf34c247f78ce887383412b1873c6482fd013fa19b93da73b845bebc5335555e` (created). "Code Health does not block clearance." Complexity, coverage, dependency vulnerabilities, duplication and tests are all optional, reported only, with no finding. The health verdict neither grants nor withholds clearance.

## Issues

- **I-133 (API-01; Success Condition "API-surface lock"; T-228 Done When 1).** `tools/api-surface.mjs` `publishedExports` reads `json.exports`, but npm publishes `x-publish.exports` (`tools/build-packages.mjs:186`). Smallest scenario: matrix row 5. Expected: the lock test fails. Actual: it passes, and `check:pack` passes. No test changes `x-publish.exports`.
- **I-134 (API-03; Objective Outcome).** `tools/api-rules.mjs` `stylePath` is only `src/app/style.css`. `src/shell/{style,TimelineBar,phone,TopBar,embedded,controls}.css` ship with every viewer (imported by `AstraeusShell.tsx:25-28`, `TopBar.tsx:8`, `TimelineBar.tsx:11`) and hold 289 selectors outside `.astraeus-shell`, none allowlisted. Smallest scenario: matrix row 18. Expected: fail. Actual: pass. The Success Condition and Done When name `app/style.css` only, so T-229 met its wording. The Issue is against the Guardrail and Outcome the check exists to serve.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-133 | Medium. Editing `x-publish` is the normal way to change what ships, and O-054..O-059 rework exports. | Medium-High. A new published deep entry point is the exact API-01 break the lock exists for, and it would reach npm unnoticed. | Medium | Fix now: lock `x-publish.exports` (or the built map) per package, plus a plant test. |
| I-134 | Medium. Shell styles change often (phone layout, panels). | Medium. O-055's two-viewer work relies on this scan, and today 74% of the viewer's selectors are invisible to it. | Medium | Fix now: scan every shipped stylesheet, allowlist today's 289 under F3/O-055. Or the owner accepts the narrower scope explicitly and names the Objective that widens it. |

## Judgements Asked For

- **CSS scan covering only `src/app/style.css` vs API-03 as written.** It does not meet API-03. API-03 says no styles outside the viewer's root class, and the shell stylesheets are viewer styles shipped in the same package (row 18, I-134). The narrower Success Condition wording is why T-229's own Done When is met. The Design note defers widening without naming an Objective, and the project rule "Deferred Design reconciliation" asks for one.
- **`check:react-consumer` and @react-three/fiber's `react <19.4` cap.** Yes, it will block a release, and it is foreseeable rather than hypothetical. Every published fiber 9.x (latest 9.8.2) declares `react >=19 <19.4`. The day React 19.4.0 is on the registry, the check's expected version becomes 19.4.0. Meanwhile npm resolves the peer set to the newest version fiber admits: the `probes/fibercap` simulation installed 19.2.9 when the fake cap excluded 19.3.1. So the check fails with "not the newest 19.x" until fiber lifts its cap, and nothing in Astraeus changed. The failure is not wholly spurious: at that moment `>=19 <20` claims a React the engine cannot install, which strains API-07 "peer ranges state what was tested". The real tension is between D7 ("cover all of React 19") and the upstream cap. This is an owner decision, not an implementation defect against the Done When, which the check meets literally, so it is observation O1 and not an Issue.
- **Allowlists can only shrink in every check?** Shrinking is enforced in every check: a fixed break leaves a stale entry, and the test fails until the entry is deleted. I confirmed this for outside types, the type lint (`breaks`, `unitless`, `exceptions`), errors, settings (`public` and `addressOnly`), ids, selectors and deep-import counts (falling fails). No check prevents growth: row 24 added a new break plus a matching entry and all tests passed. The same holds for raising `DEEP_IMPORT_COUNTS`. Guardrails says "a new entry needs the owner's approval", which is a review rule, so this is observation O2, not an Issue.

## Observations (non-blocking)

- **O1, React latest-19 check vs fiber cap.** See above. Options for the owner: make the check expect the newest 19.x that the engine's own peers admit (resolve fiber's range too) and warn when that is below the newest 19.x; or keep the hard failure as an honest signal and accept release delays; or let the engine's range follow fiber's cap.
- **O2, allowlist growth is not mechanised.** Strategic option: a test (or CI step) that fails when an allowlist gains an entry or a count rises compared with `main`, unless the entry cites an owner approval.
- **O3, the type lint's `unitless` list matches by field name and is permanent.** One added name exempts every future field of that name. The builder recorded this as a limitation.
- **O4, `errorBreaks` treats any `unknown`-typed parameter as a rethrow.** `function f(value: unknown) { throw value; }` passes (row 12). This is narrow (meant for rejection handlers), with no current example. A later tightening could require the parameter to belong to a `.catch`/`then` callback.
- **O5, the README table test "fails on a member the README leaves out…" edits the real README text by string replace.** A wording change to those rows breaks this synthetic test rather than the real check. This is fragile but visible.
- **O6, `filesIn(dir)` reads only files directly in `src/api/`.** There are no subfolders today. A future `src/api/x/` would be unscanned.
- **O7, the lock embeds doc comments in signature text (`SceneErrorCode`)**, so a comment-only edit forces `api:lock` (builder's drift note, deferred). This is harmless but noisy.
- **O8, `check:browser` took 354 s, against the ≈1 min that `docs/agents/build.md` documents.** The smoke step alone took 232 s, with a load average of about 4. Either the doc or the run is stale.

## Closure

NEEDS WORK. O-053 cannot close until I-133 and I-134 are repaired and proven by a new Check, or the owner records an explicit exception (`unmet` lists the requirement IDs). T-228..T-230 stay `done`: repair goes directly under each Issue (issue-capture.md, Out-Of-Scope Repair) or into a new Task in O-053 if the owner prefers. The owner still decides O1 (React check vs the fiber cap) and O2.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [ ] STYLE-02 **One job per function**: `outsideApiTypes` and `publicTypeBreaks` (`tools/api-surface.mjs`, `tools/api-rules.mjs`) are long closures with many nested helpers. They pass lint complexity 20 but are hard to unit-test piecewise.
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: `outsideApiTypes` calls `checker.getSymbolAtLocation(source)` twice (`module`, `module2`), and `>=19 <20` is spelled in `check-packs.mjs` (`REACT_PEER_RANGE`), in `check-react-consumer.mjs` (literal) and in tests.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**: allowlists are JSON next to their tests.
- [ ] STYLE-10 **Small diffs**: T-229 adds ~2,200 lines (mostly allowlist data). It is reviewable but large.
