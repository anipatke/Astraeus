---
id: C-113
scope: {kind: objective, id: O-041}
result: CLEAR
checked_by: {role: checker, session: o041-full-recheck-20261024}
executed_session: o041-i082-repair
checked_at: '2026-10-23T22:50:00Z'
health_snapshot: sha256:bc1d7debc3173c7f33d7eb6460d533d3982b1ce97646a0dad94659842b6e8671
reviewed:
  base_commit: 5bfedb19
  head_commit: dec78743
  files: [packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Scene.ts, packages/astraeus-demo-apollo11/tests/rebuildComparison.test.ts, packages/astraeus-site/tools/site/api-reference.mjs, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/issues/I-082-apollo-spacecraft-descriptions-show-a-stray-quote-and-plus-sign.md, .savepoint/objectives/O-041-rebuild-the-apollo-11-story-on-the-public-api/Objective.md, .savepoint/objectives/O-042-show-groups-of-objects-by-rebuilding-a-shower-on-the-public-api/Objective.md]
  dependencies: []
issues: []
supersedes: C-112
---

# C-113: O-041 Full Objective Recheck

Recheck of C-112 (NEEDS WORK) for O-041 (T-166 to T-170), under C-112's frozen scope lock and the shared convergence limit. This is the one full re-check after remediation. This session is independent: it did not plan, build, coordinate, repair or run C-112. Repair diff `git diff 5bfedb19..HEAD` (`dec78743`): five non-record files (`apollo11Scene.ts`, `rebuildComparison.test.ts`, `api-reference.mjs`, `README.md`, `CHANGELOG.md`) plus the I-082 history, O-041 Decision 12, an O-042 scope line and the router's `task: none`. `git diff 6ae9fc58..HEAD` (C-112's reviewed head to now) adds only those plus C-112's own record and browser evidence; no other source, test, site, example or browser-script file changed. `git diff --check 6ae9fc58..HEAD` is clean. Tree clean at start apart from the untracked `docs/prds/` and `docs/research/` (other projects; not read). Not a worktree lane (`git-dir` = `git-common-dir`). Times are `date -u`.

**Verdict: CLEAR.** I-082 is fixed and covered by a regression assertion that catches the old text. Every gate passes fresh, the health snapshot does not block clearance, and nothing else in the frozen scope moved. CLEAR does not close the Objective. T-169 declares `owner_validation.required` and still needs the owner's structured acceptance (see Owner Validation Still Needed).

## Closure Map Of Prior Issues

| Issue | C-112 finding | State now | Proof |
|---|---|---|---|
| I-082 | Columbia and Eagle descriptions carry `. "\n  + "` from a template literal that ran across two lines | **closed (verified)** | `apollo11Scene.ts:150-151` is now a template literal ending `anchors. ` joined by `+` to a plain string. Independent probe on `buildApollo11Scene().toDefinition()`: no object description or known-limit line matches `/"\s*\+\s*"\|\n\|`\|\$\{\|\s{2,}/`. Both spacecraft contain `${APOLLO11_STATEMENT}. Lines are reconstructed samples and round dots are NASA source anchors. The marker is drawn larger than the vehicle so you can see it, and is not to scale.` and no `"`. The site's `apollo11Definition` gives the same text as a fresh build. The new repo case "writes the drawing note as plain sentences with no code left in the text (I-082)" uses `/"\|\+\|\n/`. That regex matches an independent copy of the C-112 literal, so the case would fail on 6ae9fc58 (TEST-02). It passes now. The public build has the clean sentence in the Apollo chunk, and no built asset contains `anchors. "` |

## Prior Owner Decisions (carry-forward assessment)

The Objective and its Tasks still have no structured `exception` and no `owner_validation.accepted_check`, so there is no `carried_forward` list to append to. The decisions on record, as given to this Check (owner, 2026-10-24, O-041 Decision 12):

| Decision | Scope | Assessment |
|---|---|---|
| Decisions 1-11 | what may change | unchanged scope; applied as the judging rule, as in C-112 |
| `check_waiver` T-166 to T-170 | optional Task Checks | unchanged; applies (Task Checks only) |
| Decision 12: Sky item unlisted in every experience, "Yes, hide it everywhere (Recommended)" | object drop-downs (C-112 O6) | settles O6. `skyModel.ts` is unchanged since C-112, so the decision covers what was reviewed. The CHANGELOG now states it |
| Decision 12: Moon label priority 99 vs 90 and composition id `scene` vs `earth-moon`, "Accept them (Recommended)" | comparison differences (C-112 O1) | settles O1. Unchanged since C-112: `rebuildComparison.test.ts` still pins `[100, 99, 80, 80]` |
| Decision 12: Perseids headroom handled by trims in O-042, "Look for trims in the shower part (Recommended)" | C-112 O2 | settles O2 for O-041. The O-042 scope line exists. Perseids is still 10,078,005 / 10,080,000 B raw (fresh, below) |
| T-169 owner look, "looks cool, no need for Sky in drop downs though" | Apollo look | prose only; the structured acceptance is still needed (below). The repair changes only the two spacecraft description strings, the text the look covered, by removing leftover code characters |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-112's lock reused unchanged; no new axes)
- [x] Turn Acceptance Into Invariants (row 13: "every description in the definition is plain prose")
- [x] Build The Mandatory Coverage Matrix (C-112 rows re-checked below)
- [x] Finite External-Boundary Matrix (unchanged; no new boundary in the repair)
- [x] Workflow And Side-Effect Check Lock (unchanged; the repair adds no operation or side effect)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (no lanes; not a finding)
- [x] Perform The Adversarial Pass (on the repair paths)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| 1 | Spacecraft descriptions hold no code text | I-082 | Row 13, bypass/sequence (mission note text) | Issue if any leftover remains |
| 2 | Every other object's description and limits are plain text | I-082 Proof Needed ("no description in the definition") | Row 13, named adjacent | Issue if leftover |
| 3 | The regression assertion fails on the old value | I-082 Proof Needed (TEST-02); row 14 gap | Row 14, bypass ("checks only fragments") | Issue if the test would pass the old value |
| 4 | Site default path uses the same text | I-082 scenario (site info card) | Row 13, normal (`main.tsx` uses `buildApollo11Scene().toDefinition()`) | Issue if it differs |
| 5 | `SwitchesInput` placement on `/api` | O5 (observation) | Row 18, bypass | observation only |
| 6 | README/CHANGELOG corrections | O9 (observation) | none (no criterion) | observation only |
| 7 | Load budget after the repair | Row 16 | Row 16, normal/boundary | Issue if over a limit |
| 8 | All other rows 1-12, 15, 17, 19 | C-112 passes | same rows | Issue if a gate or the fast suite regresses |

## Coverage Matrix Re-check

Probe harness (independent of the repository tests, written for this Check): `<scratchpad>/c113/probe/i082.probe.test.ts`, run with `npx vitest run --config <scratchpad>/c113/probe/vitest.probe.config.ts i082.probe` (4 of 4 passed). The first run had one wrong expectation of the checker's own: it assumed the note opens the description. It follows the old sentences, as C-112 row 14 records. The probe was corrected to `toContain` and rerun.

| # | Row | Re-check result |
|---|---|---|
| 1-12 | Anchors, readouts, addBody, Provenance, events, panels, timeline, no-timeline, scale/lookAt/stateOf, hello-scene, switches, boundary rule | passed. No file behind these rows changed since C-112. Fresh `npm test`/`test:full` pass (the repo tests behind each row), plus `check:engine-alone`, `check:pack` and `build:example` |
| 13 | Scene builder, mission notes in descriptions | **passed** (ledger 1, 2, 4). The descriptions printed by the probe: Earth, Moon, Columbia and Eagle are all plain sentences |
| 14 | Comparison test | passed. Gap closed: the new case pins the exact note and refuses `"`, `+` and newline (ledger 3). 1,656 passed, up from 1,655 |
| 15 | Demo tests, driver | passed (unchanged; driver guard test passes) |
| 16 | Load budget | passed. Fresh public build plus `public-build-assets.mjs` alone: Apollo 4,338,042 / 4,370,000 raw (−7 B against C-112, the removed characters), 2,809,498 / 2,900,000 gzip. Perseids 10,078,005 / 10,080,000 raw (unchanged), 7,026,237 / 7,040,000 gzip. `/api` 34,955 / 100,000 |
| 17 | Design reconciliation | passed (Design unchanged; the repair is not architectural) |
| 18 | Every new export on `/api` | passed. `SwitchesInput` now renders in "Build a scene". "Other exports" holds only `BodyRef`, which is also shown with the Bodies list (probe; built page has `id="switchesinput"`). O5 settled |
| 19 | Existing demos unchanged by default | passed. Reused browser run (see Gates) |

External-boundary and workflow locks: unchanged from C-112. The repair adds no server, network, persistence or multi-step operation.

## Adversarial Pass (repair paths)

- **Another path to the text.** The site reads `apollo11Definition`, which is `buildApollo11Scene().toDefinition()`. The probe shows the two give identical descriptions. `InfoPanel.tsx` renders `description` as given, so clean data means a clean card.
- **Other constants built the same way.** Every object description and known-limit line in the definition was scanned for joining code, template leftovers, newlines and doubled spaces. None found.
- **Independent oracle.** The check was a separate regex and the exact sentence, not the repo case's own regex alone. The old literal was copied from the repair diff to show the repo's regex catches it.
- **Docs.** The README `addBody` row and the CHANGELOG now describe `color`, `knownLimitations`, `bad-body`, the `focus-<id>`/`follow-<id>` preset ids and the Sky unlisting (O9 settled). One small wording leftover remains (observation P1).

## Acceptance Classification

| Criterion | Class |
|---|---|
| SC1-SC6 | Proven (as C-112; SC6's look is in prose, see Owner Validation) |
| T-166 1-8, T-167 1-6, T-168 1-5, T-170 1-8 | Proven |
| T-169 1-9, including 3 (mission notes in the descriptions) | Proven |
| O-041 Outcome (looks as today apart from approved changes) | Proven. The garbled note is gone, and Decision 12 covers the Sky, label priority and composition id differences |

## Gates (fresh, this session, head dec78743)

| Gate | Result | Time (UTC) |
|---|---|---|
| `npm run lint` | pass | 22:42:43-22:42:46 |
| `npm run typecheck` | pass | 22:42:46-22:42:51 |
| `npm run build` | pass (existing chunk-size warning only) | 22:42:51-22:42:53 |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | pass: 124 files, 1,656 passed, 1 skipped | 22:42:53-22:43:28 |
| `npm run test:full` | pass: 124 files, 1,656 passed, 1 skipped. Coverage: statements 74.62%, branches 72.95%, functions 75.72%, lines 77.22%. Fresh `junit.xml` and `coverage/coverage-final.json` (2,752,904 B) | 22:43:28-22:44:31 |
| `npm run check:engine-alone` | pass (13.9 s) | 22:44:31-22:44:45 |
| `npm run check:pack` | pass; astraeus 7.01 MB packed (limit 8.0), 423 files (limit 450) | 22:44:45-22:45:00 |
| `npm run build:example` | pass | 22:45:00-22:45:07 |
| `savepoint health check O-041` | snapshot created; "Code Health does not block clearance" | after test:full |
| `ASTRAEUS_PUBLIC_BUILD=1 npx vite build packages/astraeus-site --outDir <scratch>/public-dist --emptyOutDir` | pass | 22:46:47-22:46:49 |
| `node packages/astraeus-site/tools/validate/public-build-assets.mjs <dist> <results>` | exit 0, ok true, 95 files; evidence `docs/evidence/browser-20261023T224647Z-public-build-assets/` (`summary.txt`, `public-build-assets/results.json`) | 22:46:49-22:46:50 |
| `npm run check:browser` | **not rerun** (owner rule: never twice for one change). Reused from C-112's run `docs/evidence/browser-20261023T221627Z/`: all 8 steps exit 0, 0 error lines, on 6ae9fc58 | 22:16:26-22:18:17 (C-112) |
| `git diff --check 6ae9fc58..HEAD` | clean | |

**Why the browser reuse holds.** Since that run, the only built-code changes are (a) seven characters removed from one Apollo description string, which no browser step asserts and which the fast suite and probe now read directly, and (b) one name moved between two section lists in the `/api` generator. That page is static, has no script, and is covered by `apiReference.test.ts` and the probe. README and CHANGELOG are not in the build. No engine, shell, site page code, example, data, browser script, driver or runner changed. The one browser-run step that measures built output, `public-build-assets`, was rerun alone on a fresh public build above and passes. No screenshots were taken.

## Code Health Evidence

Snapshot `sha256:bc1d7debc3173c7f33d7eb6460d533d3982b1ce97646a0dad94659842b6e8671` (official, created after `test:full`). Verdict: does not block clearance. Every instance (complexity/lizard, coverage/vitest-v8, dependency_vulnerabilities/osv, duplication/jscpd, tests/vitest-junit) is optional, reported only, and has no finding. Coverage is unchanged from C-112 and still under G-011's 80% aim, which is O-043's work. This is supporting evidence only.

## File Reality

Every file the repair names exists: `apollo11Scene.ts`, `rebuildComparison.test.ts`, `api-reference.mjs`, `README.md`, `CHANGELOG.md`. The cited evidence folder `docs/evidence/browser-20261023T221627Z/` exists with `summary.txt` and each step's `results.json`. The new folder `docs/evidence/browser-20261023T224647Z-public-build-assets/` is cited above. Probe files and the scratch public build live in the session scratchpad and are discarded scratch work. No phantom files.

## Issues

None. No materiality actions are required.

## Code Style Review

- [x] STYLE-01 **One job per file**: unchanged by the repair.
- [ ] STYLE-02 **One job per function**: as C-112, `Scene.toDefinition` is still one long object literal; the repair does not touch it.
- [x] STYLE-03 **Test branches**: the fix has its regression case.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**: the repair is the smallest fix.
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**: one `ABOUT_THE_DRAWING` constant feeds both spacecraft.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**: as C-112, the notes are code constants in the demo package.
- [x] STYLE-10 **Small diffs**: the repair is 20 lines across 9 files, most of them records and docs. C-112's note on the Objective's overall size still stands.

## Observations (non-blocking)

- **P1. CHANGELOG wording.** The Display switches entry still says "no existing call changes", which is true for that entry. The Story calls entry now names the preset id change and the Sky unlisting. It does not mention that `addBody` objects now carry catalogue provenance and limits (C-112 O9). No criterion requires it.
- **P2. Carried from C-112, unchanged and not in this repair:** O3 (arrays kept by reference), O4 (lenient timeline values), O7 (labels switch clears `showLabel:false`), O8 (engine leftovers with no users), O10 (load-time probe scene). O1, O2, O5, O6 and O9 are settled by Decision 12 or the repair, as described above.
- **P3. Perseids headroom** is still 1,995 B raw. O-042 now owns the trim (Decision 12).

## Owner Validation Still Needed

1. **T-169 structured acceptance.** T-169 declares `owner_validation: {required: true}`. The owner's look ("looks cool, no need for Sky in drop downs though") is in prose only. To accept, the owner records on T-169: `owner_validation: {required: true, accepted_check: C-113, scope: [<accepted T-169 criteria, e.g. the Apollo look and Done When 1-9>], accepted_by: {role: owner, session: <owner session>}}`. The checker has not recorded this.
2. **Objective close.** The owner closes O-041 once item 1 is recorded. I-082 is resolved as verified by this Check, and every owned Task is done. Then commit, as the project rule asks.
