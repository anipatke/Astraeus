---
id: C-087
scope: {kind: objective, id: O-016}
result: CLEAR
checked_by: {role: checker, session: o016-recheck2-20261020}
executed_session: o016-coordinator-20261020
checked_at: '2026-10-19T21:40:00Z'
health_snapshot: sha256:1bf3cbd405021be77a358b08083bd37bbffa3a25852fc3a1b019cf66d1ed155b
reviewed:
  base_commit: 92e7068
  head_commit: 92e7068
  files:
    - assets.html
    - tests/assetsPageCredits.test.ts
    - data/stories/apollo11/panels.json
    - data/stories/perseids/panels.json
    - data/stories/geminids/panels.json
    - data/stories/jupiter-io/panels.json
    - .savepoint/issues/I-046-site-pages-carry-out-of-date-jupiter-io-and-other-claims.md
  dependencies: []
issues: []
supersedes: C-086
---

# C-087: O-016 Full Objective Check (targeted re-check after the I-046 item 3 repair)

Supersedes C-086 (NEEDS WORK on one cell: the assets page Story panels row claimed thirteen observed panels where the data holds twelve). This is the one targeted re-check the convergence limit allows. Scope lock, coverage matrix and external-boundary matrix are C-085's, frozen and unchanged; C-086 re-ran every cell. This run re-runs the one failing cell fresh, proves nothing else changed since C-086, and reuses C-086's results for every other cell.

Independence: fresh checker session launched by the coordinator; built neither O-016 nor any I-046 repair; all evidence treated as claims.

**Result: CLEAR.** The panel row now matches the data, a new test ties it to the data and fails on the old wrong word, and every gate passes.

## Closure map of prior Issues

| Issue | Status after this re-check |
|---|---|
| I-046 | **Closed, verified** — item 3 now correct; items 1, 2, 4, 5, alt text and address verified in C-086 and unchanged since |

## Nothing else changed since C-086 (reuse proof)

- `find` for files newer than C-086's evidence summary (`docs/evidence/o016-recheck-20261019T212040Z/summary.txt`, 2026-10-19T21:29:05Z), excluding `node_modules`, `dist`, `.git` and `docs/evidence`: only `assets.html`, `tests/assetsPageCredits.test.ts`, the I-046 record, the C-086 record and Code Health files. `package.json`, `package-lock.json`, `.savepoint/config.yml`, `tools/validate/`, `src/`, `data/`, `index.html` and `README.md` are not among them.
- `git diff -- assets.html` against HEAD shows the C-086-reviewed repair with exactly one word different at line 337 ("Twelve" where C-086 quoted "Thirteen"). The test file diff is wholly new (I-046's first repair recorded "No tests changed", C-086 counted 1122 tests; now 1123).
- Portfolio `/home/user/code/main-portfolio` still at 7596b84, clean tree; T-106 result reused.
- SHA-256 of the scoped and gate-defining files at this run, for any later reuse: `docs/evidence/o016-recheck2-20261019T213502Z/checksums.sha256` (assets.html `282ff6d8615193aa16536d8c3ea86e03a42dcd853b80c65c3e8afebe862cf4aa`, tests/assetsPageCredits.test.ts `f80a189b2ec7ec65d0c7f75ebd00716657e9dc7cf3a9ecab8778fa98584f8892`).

Therefore C-086's results stand for every cell outside the Story panels row, including its touched-area browser runs in `docs/evidence/o016-recheck-20261019T212040Z/` (lite, shell, phone, sky, home-curve-fits, embedded, all exit 0 with no error lines). **No new browser run:** under AGENTS.md's Touched areas tier, this change is page text and a unit test; no rendering, camera, control or UI code changed, and the public-build licence gate was re-run fresh below.

## Admission ledger

| Re-check item | Prior claim | Frozen cell (C-085) | Allowed result | Result |
|---|---|---|---|---|
| Assets panel row badge split | I-046 item 3 / C-086 | T-064 pages describe current product (DW2 assets page current) | Issue / pass | **Pass.** Independent count with node over each `data/stories/*/panels.json` (four story folders exist: apollo11, geminids, jupiter-io, perseids): apollo11 7 (7 observed), geminids 3 (2 observed, 1 modelled), jupiter-io 3 (2 observed, 1 modelled), perseids 3 (1 observed, 1 modelled, 1 illustrative). Totals 16 panels: 12 observed, 3 modelled, 1 illustrative. `assets.html:337` "Seven panels for Apollo 11 and three each for the Perseids, the Geminids and Jupiter and Io ... Twelve panels are marked observed, three modelled and one illustrative." and the number `16 panels` — all match |
| New test guards the row | I-046 "preferably" / C-086 recommendation | same | pass / observation | Pass. Mutation: "Twelve" → "Thirteen" made `the Story panels row gives the panel total and badge counts the story files hold` fail (exit 1, 1 failed / 10 passed); restored, `sha256sum -c` matched the pre-mutation file, test exit 0 (11 passed) |
| Every other C-085 cell | C-086 results | all other rows | reuse | Reused (inputs unchanged, proof above) |

## Coverage matrix (C-085 rows)

| Row | Result now |
|---|---|
| SC1 HYG stars, credited | Proven (C-086, unchanged); credit tests pass fresh |
| SC1 credits on pages | Proven: `tests/assetsPageCredits.test.ts` passes fresh |
| SC2 site pictures | Proven by record + owner decision (unchanged) |
| SC3 validator rejects non-shippable | Proven fresh: `public-build-assets.mjs` ok true, matches [] |
| T-057 pages, links, vercel | Proven (C-086, unchanged) |
| T-058 Developer panel | Proven (C-086 browser runs, unchanged) |
| T-060 HYG | as SC1 |
| T-063 pictures | unchanged; proven by record |
| T-064 pages describe current product | **Proven** (Story panels row fixed; other page claims C-086) |
| T-106 DW1-DW6 | Proven (C-085 reused; portfolio unchanged) |

External-boundary matrix, workflow and side-effect lock: unchanged from C-085/C-086. This run wrote the public build to `dist/`, validated it, then rebuilt plain (`npm run build`, exit 0) so `dist/` is left as before. No server started, no network calls.

## Evidence (fresh, this session)

All output in `docs/evidence/o016-recheck2-20261019T213502Z/` (`summary.txt`, per-command logs). Toolchain: local Node, HEAD 92e7068 plus the uncommitted repair. 2026-10-19T21:35-21:36Z.

- `npm run typecheck` exit 0; `npm run build` exit 0; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` exit 0, 77 files, 1123 passed, 1 skipped; `git diff --check` clean.
- `ASTRAEUS_PUBLIC_BUILD=1 npm run build` exit 0; `node tools/validate/public-build-assets.mjs` exit 0 (ok true, matches [], missingPages [], load budget ok).
- Code Health: `savepoint health check O-016` after the gate: snapshot above (created), "does not block clearance"; complexity, duplication, vulnerabilities no finding; coverage and tests optional instances stale (collection, not code).

## Owner decisions assessed

- T-106 `check_waiver`: scope is the portfolio page, unchanged (7596b84, clean). Still applies; not a Check, not `CLEAR`.
- Owner closures of T-057, T-058, T-060, T-063, T-064, T-106 stand; no status changed here.
- Owner address decision (2026-10-20, I-046 history): unaffected by this change.
- No structured `exception` or recorded acceptance with `carried_forward` exists on O-016, so there is nothing else to carry forward.

## Adversarial pass

- Counted badges straight from the JSON, not from the test or the repair note; also checked that no fifth story folder exists that the page or test would miss.
- Mutated the page back to the old wrong word to prove the test can fail.
- Checked the per-story sentence ("seven ... three each") and the `16` figure as well as the badge sentence.

## Issues

None.

## Materiality

No Issues, so no materiality actions are required.

## Owner validation still needed

- None technical. The owner may glance at the assets page Story panels row on the preview since its wording changed after T-064 was closed; that is optional.
- O-016 may now be closed by the owner (every owned Task done, this Objective Check current and `CLEAR`, I-046 resolved).

## Observations (non-blocking)

1. The new test imports the four story files by name; a fifth story would not be counted until the test is updated (the row would still be checked against the four).
2. C-086 observations 1-4 stand (README "Done" list names only Apollo and Perseids panels; `site/apollo-phone.jpg`, `site/geminids-gmn.jpg` unreferenced; stale header comment in `load-budget.mjs`; stale optional Code Health instances).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — new test proven to fail on the old miscount
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — panel counts are still written by hand in `assets.html:337`, though now tested against `data/stories/`; the README page-size table is still a hand copy of `load-budget.mjs`.
- [x] STYLE-08 **Comments explain why**
- [ ] STYLE-09 **Content lives in data** — page facts remain hand-written copies of data facts (advisory).
- [x] STYLE-10 **Small diffs** — repair: 2 files, one word plus one 13-line test.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope — C-085 lock reused, unchanged
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix — C-085 rows; failing cell re-run, rest reused with proof
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice — advisory; not a finding
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation — closure map and admission ledger above
- [x] Verify File Reality — every file named in the repair entry exists
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style
