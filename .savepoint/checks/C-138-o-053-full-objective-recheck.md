---
id: C-138
scope: {kind: objective, id: O-053}
result: CLEAR
checked_by: {role: checker, session: o053-recheck-20261101}
executed_session: o053-repair-20261101
checked_at: '2026-11-01T06:40:00Z'
health_snapshot: sha256:bcfc9a62f393352adf4affb6066004a4bf4fb388dff445a65130c692c8d45d92
reviewed:
  base_commit: e30e5da8
  head_commit: 7798f19c
  files: [tools/api-surface.mjs, tools/api-surface.d.mts, tools/api-rules.mjs, tools/api-rules.d.mts, tools/check-react-consumer.mjs, tools/check-react-consumer.d.mts, package.json, package-lock.json, packages/astraeus/api-surface.lock.json, packages/astraeus-site/tests/allowlistGrowth.test.ts, packages/astraeus-site/tests/apiIsolation.allowlist.json, packages/astraeus-site/tests/apiRules.test.ts, packages/astraeus-site/tests/apiSurface.test.ts, packages/astraeus-site/tests/reactConsumer.test.ts, docs/agents/build.md, .savepoint/Design.md, .savepoint/issues/I-133-the-surface-lock-does-not-lock-the-published-exports-map.md, .savepoint/issues/I-134-the-css-isolation-scan-skips-the-shell-stylesheets-the-viewer-ships.md]
  dependencies: [semver@^7.8.5 (root devDependency, new)]
issues: []
supersedes: C-137
---

# C-138: O-053 Full Objective Check, re-check after remediation

This re-check covers the O-053 Full Objective Check after C-137 returned NEEDS WORK. It reviews repair commit `7798f19c` (`git diff e30e5da8..7798f19c`: 18 files, +4453/-228, of which 4370 lines are `apiIsolation.allowlist.json`). Its scope is C-137's frozen scope lock, unchanged: Objective diff `88167b76..7798f19c`, T-228, T-229 and T-230.

**Independence.** This session did not plan, build, repair or coordinate O-053, and it did not write C-137. It is not a lane: `git rev-parse --git-dir` and `--git-common-dir` both print `.git`. It wrote only these things:

- gate outputs (`coverage/`, `junit.xml`, `dist/`, temp folders)
- one official health snapshot
- temporary planted edits, each copied aside and restored after its run; `git status` shows the tree restored after every batch
- probe files in the checker scratchpad, `probes/recheck/` and `npmshim/`
- I-133 and I-134 resolutions, and this record

It did not read or touch `docs/prds/`, `docs/research/` or the three modified G-012/13/14 `Release.md` files. It did not edit the router, commit or push. One disclosure: the scratchpad is shared with C-137's session, and the first write here replaced C-137's `probes/plant.sh` harness. C-137's `p*.log` outputs and other probes are intact, and the harness logic is restated in C-137's own text. Times are UTC.

**Verdict: CLEAR.** Both Issues are repaired, and my own plants prove it:

- **I-133:** a deep entry added to, or removed from, any published package's `x-publish.exports` now fails the lock and names the package. The lock's published maps equal the built `dist/package.json` maps for all eight packages.
- **I-134:** the selector scan reads every `.css` under `packages/astraeus/src`. A page-wide rule in any of the six shell stylesheets, or in a new nested stylesheet, fails and names the file. The scanned set equals the CSS set the build ships.

The owner decisions on C-137 also behave as Design.md "O-053 checks" records them:

- **O1:** the React check passes when a non-`astraeus` dependency caps React below the newest, names the capper, and still fails when nothing caps it.
- **O2:** `allowlistGrowth.test.ts` fails on an unapproved entry or a raised deep-import count against a base that has the files. It skips against `main` today, as documented.

Every original C-137 matrix cell was re-run and holds. All gates pass. No new Issue.

## Closure Map Of Prior Issues

| Issue | C-137 status | Now | Evidence |
|---|---|---|---|
| I-133 (API-01; surface lock misses `x-publish.exports`) | open | **closed: verified** | rows R1-R5 |
| I-134 (API-03; CSS scan skips shell stylesheets) | open | **closed: verified** | rows R6-R12 |

C-137 `unmet: [O-053/API-surface-lock, O-053/Outcome, API-01, API-03]`. Each one is now Proven (Acceptance Coverage below).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-137's lock reused unchanged; not amended)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-137 rows re-run, plus remediation rows inside them)
- [x] Finite External-Boundary Matrix (C-137 classification reused; the O1 branch exercised)
- [x] Workflow And Side-Effect Check Lock (`check:react-consumer` new branch; scratch cleanup re-verified)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advice only; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

This is C-137's scope lock, items 1-5, verbatim in meaning: the criteria, guardrails, release gates, entry points, relied-on orchestration, matrix axes and admission boundary. No axis, layer or interpretation was added.

The owner decisions O1 and O2 attach to C-137's existing judgement cells. O1 attaches to row 23 (React consumer, upstream cap). O2 attaches to row 24 (allowlist growth) and to row 7's count axis. The owner's decision, recorded in Design.md, now fixes the expected result of those cells. The repair's changed code paths are re-checked within these cells, as the re-check rule allows.

## Admission Ledger

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| L1 | published deep entry, engine | I-133 | row 5 | lock test fails, names package |
| L2 | published deep entry, data package | I-133 Proof Needed | row 5 (adjacent named in I-133) | fails, names package |
| L3 | published entry removed | I-133 remediation path | row 5 / row 2 removed-export axis | fails |
| L4 | source `exports` change | I-133 remediation (`sourceExports`) | row 5 | fails |
| L5 | lock determinism, lock == built maps | I-133 Proof Needed | row 4 | no diff; maps equal |
| L6 | `body {}` in `shell/style.css` | I-134 | row 18 | fails, names file |
| L7 | other shipped shell stylesheets | I-134 Proof Needed ("every stylesheet the engine ships") | row 18 | fails, names file |
| L8 | new nested stylesheet | I-134 Proof Needed (synthetic new stylesheet) | row 18 | fails |
| L9 | `app/style.css` still scanned | I-134 remediation re-keyed sites | row 17 | fails |
| L10 | stale shell selector entry | I-134 Proof Needed ("stale entries fail") | row 18 | fails |
| L11 | scanned set == shipped set | I-134 Proof Needed | row 18 | equal |
| L12 | O1 capper branch | C-137 O1, owner decision | row 23 | pass with note naming capper; fail without capper |
| L13 | O2 growth guard | C-137 O2, owner decision | row 24, row 7 | fails on unapproved growth vs a base with the files |
| L14 | every other C-137 row | frozen lock | rows 1-4, 6-17, 19-22, 25-26 | as C-137 |

## Coverage Matrix

**Harness.** `probes/recheck/plant.sh <name> <file> <edit.py> <vitest files…>` copies the file aside, applies the checker's own Python edit, runs `cd packages/astraeus-site && npx vitest run <files>`, and restores the file. Logs are in `probes/recheck/<name>.log`.

**Baseline.** With no plant (`r0-clean`), `apiSurface`, `apiRules`, `packageBoundaries` and `allowlistGrowth` gave `Tests 40 passed (40)`.

### Remediation rows (I-133)

| # | Cell | Plant / input | Expected | Actual | Result |
|---|---|---|---|---|---|
| R1 | row 5, engine | `"./core/clock": "./src/core/clock.js"` added to `packages/astraeus/package.json` `x-publish.exports` | fail, named | `changed package exports of astraeus: {…} -> {…,"./core/clock":"./src/core/clock.js"}`; 2 failed / 5 passed | Pass |
| R2 | row 5, data | `"./extra"` added to `astraeus-data-saturn` `x-publish.exports` | fail, named | `changed package exports of astraeus-data-saturn …`; 1 failed / 6 passed | Pass |
| R3 | row 5, removal | `"./index.json"` deleted from `astraeus-data-jupiter` `x-publish.exports` | fail | `changed package exports of astraeus-data-jupiter … -> {".", "./package.json"}` | Pass |
| R4 | row 5, source map | `"./planted/*"` added to engine source `exports` | fail | `changed source exports of astraeus …` | Pass |
| R5 | row 4, determinism + independent oracle | `npm run api:lock`, `npm run api:errors` on clean tree; lock `packageExports` vs each built `packages/*/dist/package.json` `exports` (after `check:pack`) | no diff; equal | `git diff --stat -- packages/ tools/` empty; all 8 packages `match`, no extra or missing package | Pass |

### Remediation rows (I-134)

| # | Cell | Plant / input | Expected | Actual | Result |
|---|---|---|---|---|---|
| R6 | row 18 | `body { margin: 0; }` appended to `src/shell/style.css` | fail, named | `selectors: new break selector shell/style.css: body` | Pass |
| R7 | row 18 | same in `src/shell/embedded.css` | fail | `… shell/embedded.css: body` | Pass |
| R8 | row 18 | same in `src/shell/controls.css` (0 allowlisted entries today) | fail | `… shell/controls.css: body` | Pass |
| R9 | row 18, new file | new `src/core/plantdir/zz-plant.css` with `.planted-panel {}` and `.astraeus-shell .ok {}` | fail on the first only | `… core/plantdir/zz-plant.css: .planted-panel` (rooted rule not reported) | Pass |
| R10 | row 17 | `* { box-sizing: border-box; }` in `src/app/style.css` | fail | `… app/style.css: *` | Pass |
| R11 | row 18, stale | allowlist entry `shell/TopBar.css: .no-such-planted` | fail | `stale allowlist entry selector shell/TopBar.css: .no-such-planted; delete it (F3, O-055)` | Pass |
| R12 | row 18, independent oracle | `stylesheets()` vs `find packages/astraeus/dist -name '*.css'` (the build copies every `src/**/*.css`, `tools/build-packages.mjs:175-180`) | equal | identical 7 files; allowlisted per-file counts 127/69/54/21/18/0 for shell match C-137's own measurement (289), plus app 100 | Pass |

### Owner decisions O1 and O2

| # | Cell | Plant / input | Expected | Actual | Result |
|---|---|---|---|---|---|
| R13 | row 23, O1 capper | real `node tools/check-react-consumer.mjs` with a PATH shim (`npmshim/npm`) that appends `FAKE_NEWEST=19.9.0` to the `npm view` answer only | pass, names capper | `registry: newest … 19.9.0` / `installed: react 19.3.1` / `note: … capped by @react-three/fiber@9.8.2 (react >=19 <19.4), … (react-dom >=19 <19.4)` / `react consumer: pass`, exit 0 | Pass |
| R14 | row 23, O1 no capper | same with `FAKE_NEWEST=19.3.2` (inside fiber's cap) | fail | `… not the newest 19.x (19.3.2 / 19.3.2), and no dependency caps React` / `react consumer: FAILED`, exit 1 | Pass |
| R15 | row 23, non-19 noise | `FAKE_NEWEST=20.0.0` | ignored | newest stays 19.3.1; pass | Pass |
| R16 | row 24, O2 | `ALLOWLIST_BASE=HEAD`: unapproved new `apiErrors` entry | fail | `apiErrors.allowlist.json: new entry without an owner approval …` | Pass |
| R17 | row 24, O2 | same entry with `approved: {by: "owner", at, reason}` | pass | 7 passed | Pass |
| R18 | row 24, O2 | same with `by: "agent"` | fail | fails as R16 | Pass |
| R19 | row 24, O2 | new `apiSettings.public.plantedKey`; new `apiTypeLint.unitless` field | fail | `public.plantedKey="planted"` and `unitless {"field":"ratePlanted"…}` named | Pass |
| R20 | row 24 exact reproduction | `throw new TypeError("planted")` in `src/api/time.ts` plus a matching `apiErrors` entry | judgement → now fail (O2) | default base `main`: `apiRules`+growth `25 passed` (growth skipped, main lacks the files, as Design states). `ALLOWLIST_BASE=HEAD`: `1 failed` (growth) / 24 passed | Pass (as decided) |
| R21 | row 7 + O2 count | `import "astraeus/app/App";` in a site test plus `DEEP_IMPORT_COUNTS["astraeus-site"]` raised 94→95 | judgement → now fail (O2) | base `main`: 15 passed (skip); `ALLOWLIST_BASE=HEAD`: `DEEP_IMPORT_COUNTS astraeus-site: 95, up from 94` | Pass (as decided) |
| R22 | O2 base handling | clean tree vs `ALLOWLIST_BASE=e30e5da8` (pre-repair; files exist, 389 selector entries re-keyed); `ALLOWLIST_BASE=nosuchref` | pass; skip | 7 passed (re-keyed entries carry approvals); `1 skipped` | Pass |

### C-137 rows re-run

| C-137 row | Re-run | Actual | Result |
|---|---|---|---|
| 1 | clean tree | 40/40 (above); full gate green | Pass |
| 2 | `export type PlantedAlias = number;` in `src/api/index.ts` | `added root export PlantedAlias` | Pass |
| 3, 9, 20 | `readonly sizeFactor?: number` in `MountOptions` | 4 failed, incl. `type lint: new break unit MountOptions.sizeFactor` | Pass |
| 4 | R5 | no diff | Pass |
| 6, 8, 10, 13, 22 | synthetic tests inside `test:full` | passed | Pass |
| 7 | `import "astraeus/app/App";` at top of `apiRules.test.ts` | `astraeus-site: 95 deep imports …, up from 94` | Pass |
| 11 | `throw new TypeError("planted")` in `time.ts` | `errors: new break throw time.ts: …` | Pass |
| 12 | `function plantedRethrow(value: unknown): never { throw value; }` | 33 passed (unchanged; C-137 O4) | Observation (as before) |
| 14 | `URLSearchParams(search).has("plantedflag")` in `src/app/address.ts` | `address setting "plantedflag" has no public setting key …` | Pass |
| 15 | stale `addressOnly` entry `nosuch` | `stale addressOnly entry "nosuch" …` | Pass |
| 16 | `el.setAttribute("id", "planted")` in `src/shell/bootLoader.ts` | `ids: new break id shell/bootLoader.ts: …` | Pass |
| 17, 18 | R10, R6 | fail | Pass |
| 19 | README row `handle.plantedMember` before the `mount(…)` row | `handle.plantedMember is not a MountedScene member` | Pass |
| 21 | `astraeus-data-jupiter` peer `>=0.7.0 <0.9.0`, `npm run check:pack` | `FAIL astraeus-data-jupiter: astraeus peer is >=0.7.0 <0.9.0, …` / `pack check: FAIL (1 problems)`; restored → `pack check: pass (17.1 s)` | Pass |
| 23, 24 | R13-R21 | as decided | Pass |
| 25 | docs | the repair changed `docs/agents/build.md` and Design only; both now describe O1/O2 behaviour as observed in R13-R22 | Pass |
| 26 | `git diff e30e5da8..HEAD -- packages/astraeus/src` | 0 lines; `main..HEAD` src diff therefore as C-137 (one union reflow) | Pass |

**External boundary.** `check:react-consumer` has the same targets as C-137. Its new branch is the capper path (R13-R15). Scratch cleanup still runs on every path: no `/tmp/astraeus-react-consumer-*`, `astraeus-api-exports-*` or `astraeus-react-cap-*` left after the runs.

**Workflow lock.** One step is new: version compare → (if different) `reactCappers(app, newest)` → fail or note. It sits inside the same `try/catch` and cleanup. The pass and fail final states were both shown (R13, R14). `api:lock` stays a single deterministic write (R5).

**Adversarial pass.**

- **Bypass by another path.** Neither the published map (`x-publish`) nor the source map can change unseen (R1-R4).
- **Bypass by new file placement.** A stylesheet in a new folder is still scanned (R9).
- **Bypass by approval spoofing.** A non-owner approval fails (R18). An agent writing `by: "owner"` is caught only by review (Observation 2).
- **Representation switch.** Re-keying the 100 `app/style.css` entries with a file prefix did not hide them: they still match, and they fail when stale (R10, R11).

## Acceptance Coverage

| Criterion | Status | Evidence |
|---|---|---|
| API-surface lock: root exports + each published package's `exports` map; change without lock update fails (API-01) | **Proven** (was I-133) | R1-R5; rows 2-4 |
| Reachable-type check with allowlist | Proven | row 6 (in `test:full`) |
| Front door: deep-import counts only go down | Proven | row 7, R21 |
| Public-type lint | Proven | rows 3, 9-10 |
| Errors scan, message scan, README error table | Proven | rows 11, 13; O4 unchanged |
| Settings mapping | Proven | rows 14-15 |
| Isolation: id scan; CSS scan | Proven | rows 16-17, R6-R12 |
| Outcome / API-03 for every shipped viewer stylesheet | **Proven** (was I-134) | R6-R12 |
| Honest versions and docs (API-07, D7) incl. latest-19 check as decided in O1 | Proven | rows 19-22, 25; R13-R15 |
| Allowlists may only shrink; growth needs owner approval (Guardrails; owner O2) | Proven as decided (active once `main` has the files) | R16-R22 |
| Proof: each check fails on a plant, passes on the tree | Proven | matrix |
| No behaviour change; no public API change beyond `./package.json` and React peers | Proven | row 26; the lock's root section is unchanged by the repair (only `sourceExports` added and `packageExports` re-pointed to the published maps); no CHANGELOG entry needed |
| Design reconciliation | Proven (reflected) | Design.md "O-053 checks" now states the published-map lock, the folder-derived CSS scan and both owner decisions. The two former "limits" that C-137 flagged as un-owned are gone. |

## Gates

All ran fresh on HEAD `7798f19c` with a clean tree (apart from the untouched Release.md files and untracked owner docs), 2026-11-01. Logs are in the checker scratchpad (`gate-*.log`, `gates-summary.log`).

| Command | Result |
|---|---|
| `npm run lint` | exit 0 (06:20:09-06:20:12) |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 (chunk-size warning only) |
| `npm run test:full` (full gate) | exit 0 (06:20:20-06:21:30); 183 files passed; `Tests 2239 passed \| 1 skipped (2240)`; statements 92.06%, branches 87.12%, functions 92.39%, lines 94.53%. Growth guard printed its six "main has no … yet; skipped" notes. |
| `npm run check:engine-alone` | `engine alone: pass in 21.2 s` |
| `npm run check:pack` | `pack check: pass (14.6 s)` |
| `npm run check:node-consumer` | 9 passed, `node consumer: pass` |
| `npm run check:react-consumer` | `registry: newest React 19.x is react 19.3.1, react-dom 19.3.1` / `installed: react 19.3.1, react-dom 19.3.1; AstraeusScene rendered 60 characters on the server` / `react consumer: pass` |
| `git diff --check e30e5da8..HEAD` and `88167b76..HEAD` | clean |
| `npm run check:browser` | **not re-run.** `git diff e30e5da8..HEAD -- packages/astraeus/src` is empty: no viewer, shell or style source changed since C-137's run. C-137's run on 47aae03a passed all 9 steps (05:55:31-06:01:25, evidence `docs/evidence/browser-20261101T055531Z/summary.txt`, present on disk). The repair touched only tools, tests, allowlists, the lock, a root devDependency and docs, none of which the browser scripts load. |

`npm test` (the `quality_gates.test`) is the same Vitest suite as `test:full`, so it was not run twice.

## Code Health

`savepoint health check O-053`, run after the full gate: snapshot `sha256:bcfc9a62f393352adf4affb6066004a4bf4fb388dff445a65130c692c8d45d92` (created). The verdict was "Code Health does not block clearance." Complexity, coverage, dependency vulnerabilities, duplication and tests are all optional, reported only, with no finding. The verdict neither grants nor withholds clearance.

## Owner Decisions

O-053 and its Tasks carry no structured owner `exception`, and no `owner_validation` acceptance: each Task has `owner_validation: {required: false}`. C-137 recorded none either, so no `carried_forward` entries are due. The three Task-check waivers (T-228..T-230, session o053-run-20261101) are unchanged and need nothing from this Check.

The owner decisions O1 and O2 (Design.md, 2026-11-01) are requirement decisions, not exceptions. They were verified as behaviour above.

## Issues

None. No materiality actions are required.

## Observations (non-blocking, outside the frozen scope unless stated)

1. **The growth guard is vacuous until O-053 reaches `main`.** This is in scope (O2), and it behaves as Design documents. On this branch it skips every file because `main` predates O-053. After the merge it guards later branches. A commit made directly on `main` compares `main` with itself, so it is not guarded.
2. **Approvals are data that anyone can write.** This is in scope (O2), as decided. The guard makes growth visible and refuses non-owner or malformed approvals (R18). It cannot tell whether the owner wrote `by: "owner"`. The 389 selector approvals were written by the executor under the Design-recorded owner decision. I took that record at face value; I could not confirm it independently. A `unitless` or other entry that is a plain string, not an object, could never carry `approved` (every current entry is an object).
3. **`reactCappers` accepts any 19.x below the newest once some dependency caps React.** It does not confirm that npm installed the newest 19.x the cap admits, and it reads only top-level `node_modules`. A fresh install resolves the newest admissible version, so this is theoretical today. Its `react-dom` check also compares against React's newest version.
4. **A deliberate deep-import count rise has no approval path.** The owner must edit the check, as Design states.
5. **`package-lock.json` workspace versions changed from 0.1.1 to 0.7.0** in the repair commit. This resyncs the lock to the manifests (already 0.7.0). It is benign.
6. **C-137 observations O3-O8 are unchanged.** I re-confirmed O4 (row 12). The STYLE-07 duplication of `>=19 <20` remains.
7. **O-053 `Objective.md` still says `status: planned`** although all three Tasks are `done`. Objective status is the owner's to set.

## Closure

**CLEAR.** This is the one full re-check after remediation, and it converged.

- I-133 and I-134 are resolved `verified` on C-138.
- T-228..T-230 are `done`, and no material Issue linked to this Check remains open.
- The owner may accept and close O-053.
- Per the project rules, the owner commits at Objective close. This Check made no commit.

## Code Style Review

Repair diff `e30e5da8..7798f19c`:

- [x] STYLE-01 **One job per file**
- [ ] STYLE-02 **One job per function**: unchanged `outsideApiTypes`/`publicTypeBreaks` closures (C-137). The repair's own functions (`stylesheets`, `reactCappers`, `growthOffences`) are small.
- [x] STYLE-03 **Test branches**: x-publish/exports selection, nested stylesheet, capper finder and growth helpers each have a synthetic test.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**: the growth guard skips cleanly when git or the ref is missing (R22).
- [ ] STYLE-07 **One source of truth**: `>=19 <20` is still spelled in `check-packs.mjs`, `check-react-consumer.mjs` and tests. `allowlistGrowth.test.ts` re-parses `DEEP_IMPORT_COUNTS` from source text by regex rather than importing it.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: 4370 of the 4453 added lines are allowlist data (389 entries, each repeating the same approval object).
