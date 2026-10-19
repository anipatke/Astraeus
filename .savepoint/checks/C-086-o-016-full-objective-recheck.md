---
id: C-086
scope: {kind: objective, id: O-016}
result: NEEDS WORK
checked_by: {role: checker, session: o016-recheck-20261020}
executed_session: i046-repair-20261020
checked_at: '2026-10-19T21:35:00Z'
health_snapshot: sha256:ee41c6133bae9c7907fcce573e9f9ad43addc07aa165661fa4a6fb6799698959
reviewed:
  base_commit: 92e7068
  head_commit: 92e7068
  files:
    - index.html
    - assets.html
    - README.md
    - AGENTS.md
    - .savepoint/issues/I-046-site-pages-carry-out-of-date-jupiter-io-and-other-claims.md
    - data/stories/apollo11/panels.json
    - data/stories/perseids/panels.json
    - data/stories/geminids/panels.json
    - data/stories/jupiter-io/panels.json
    - data/moons/jupiter.json
    - src/experiences/jupiter-io/jupiterIo.ts
    - src/main.tsx
    - tools/validate/load-budget.mjs
  dependencies: []
issues: [I-046]
supersedes: C-085
unmet: [T-064-outcome-pages-match-code, T-064-DW2-assets-page-current]
---

# C-086: O-016 Full Objective Check (re-check after I-046 repair)

Supersedes C-085 (NEEDS WORK, I-046). Scope lock, coverage matrix and external-boundary matrix are C-085's, frozen; this re-check re-runs every cell against the uncommitted repair on top of HEAD 92e7068 (index.html, assets.html, README.md, I-046 record; plus the owner's AGENTS.md browser-tier rule and the owner's T-106 closure/router edits, which are records, not code).

Independence: fresh checker session launched by the coordinator; built neither O-016 nor the I-046 repair; all evidence treated as claims.

**Result: NEEDS WORK.** Four of the five I-046 claims and both minor items are fixed and correct, all gates and the touched-area browser scripts pass, but the repaired story-panel row on the assets page introduces a new wrong figure: it says thirteen panels are marked observed; the data has twelve (12 + 3 + 1 = 16, while the page's 13 + 3 + 1 = 17). This is inside I-046's own cell, so I-046 stays open.

## Closure map of prior Issues

| Issue | Status after this re-check |
|---|---|
| I-046 | **Still open** — items 1, 2, 4, 5, minor alt text and the address change verified; item 3 (panel row) repaired with a new miscount |

## Admission ledger

| Re-check item | Prior claim | Frozen cell (C-085) | Allowed result | Result |
|---|---|---|---|---|
| Jupiter card | I-046 item 1 | T-064 pages describe current product | Issue / pass | Pass: "November 2016" = `JUPITER_WINDOW` 2016-11-04..18 (`jupiterIo.ts:33`); 115 moons = `data/moons/jupiter.json` length 115; four mapped = io/europa/ganymede/callisto textures in `load-budget.mjs:32`; "curve fits described above": `#curve-fits` section (index.html:255) precedes `#demos` (:310); no mean-element or "approximate demonstration" text remains |
| Assets Io row | I-046 item 2 | same | Issue / pass | Pass: "Curve fits to JPL Horizons", "within centimetres" agrees with page figure 3.5 cm (`ioWorstM` 0.0354) |
| Assets panel row | I-046 item 3 | same | Issue / pass | **Issue**: count 16 and story list correct (7/3/3/3); badge split wrong. Independent count of `"badge"` in `data/stories/*/panels.json`: observed 7+1+2+2 = **12**, modelled 3, illustrative 1. Page (`assets.html:337`): "Thirteen panels are marked observed, three modelled and one illustrative." The repair evidence in I-046 carries the same slip ("13 observed" with per-story figures summing to 12) |
| README shower address | I-046 item 4 | same | Issue / pass | Pass: `?experience=showers&shower=<name>`, default lowest `order` (`main.tsx:27-30`) |
| README page-size table | I-046 item 5 | same | Issue / pass | Pass: every limit equals `PAGES`/`BUILD_LIMIT`; every measured figure equals this session's fresh `load-budget.mjs dist` output on the public build, byte for byte |
| README Apollo alt | I-046 minor | same | pass | Pass |
| Site address | owner decision 2026-10-20 in I-046 | C-085 observation 1 (not a cell) | observation | Done: no `curiouscode` left outside `.savepoint/` and evidence |
| Portfolio T-106 | C-085 DW1-DW6 | T-106 rows | reuse | `/home/user/code/main-portfolio` HEAD 7596b84, clean tree (git status empty) — unchanged, C-085 result reused |

## Coverage matrix (C-085 rows, re-run)

| Row | Result now |
|---|---|
| SC1 HYG stars, credited | Proven: `sky` script exit 0; validator `starAsset ok` (sha256 f4076d26...); credit rows unchanged |
| SC1 credits on pages | Proven: credit rows untouched by the repair; `tests/assetsPageCredits.test.ts` passes |
| SC2 site pictures | Proven by record + owner decision (unchanged; no screenshots rule) |
| SC3 validator rejects non-shippable | Proven: `public-build-assets.mjs` ok true, matches [], selfProof/budgetSelfProof/syntheticSelfProof true, 75 files |
| T-057 pages, links, vercel | Proven: `public-addresses.mjs dist` ok; three pages present; new canonical/og URLs on astraeus.anipatke.com |
| T-058 Developer panel | Proven: shell, phone exit 0 (lite covers controls) |
| T-060 HYG | as SC1 |
| T-063 pictures | unchanged; proven by record |
| T-064 pages describe current product | **Issue I-046** (panel badge split only) |
| T-106 DW1-DW6 | Proven (C-085 reused; portfolio unchanged; app unchanged) |

Not-applicable axes unchanged from C-085 (static pages, URL selection only).

### External-boundary matrix

Unchanged from C-085, re-run where it applies: dev server started fresh on 5479 by the run, freed after; public `dist/` checked by the validator directly; no external network calls this run (portfolio links reused from C-085, portfolio unchanged). The owner's preview on 5490 was not touched.

### Workflow and side-effect lock

Unchanged: build → validate → serve → browser. Public build written to `dist/`, validated, then `dist/` rebuilt plain (`npm run build`, exit 0) so the tree is left as the executor left it.

### Matrix completion lock

Every cell classified; one cell (T-064 panel row) is an Issue. Nothing unverified.

## Evidence (fresh, this session)

All output in `docs/evidence/o016-recheck-20261019T212040Z/`. Toolchain: local Node, HEAD 92e7068 plus the uncommitted repair.

- Gates 21:20:40-21:21:13Z: `npm run typecheck` exit 0; `npm run build` exit 0; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` exit 0, 77 files, 1122 passed, 1 skipped; `git diff --check` clean.
- `ASTRAEUS_PUBLIC_BUILD=1 npm run build` exit 0; `node tools/validate/public-build-assets.mjs` exit 0 (ok true, 75 files, missingPages [], load budget ok on all seven rows); `node tools/validate/load-budget.mjs dist` all ok; `node tools/validate/public-addresses.mjs dist` exit 0.
- Browser, **Touched areas** tier (AGENTS.md, owner decision 2026-10-20), one job at a time, no other browser process running, `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`, runner copied to `touched.sh` in the evidence directory. Areas O-016's Tasks changed and scripts chosen: base lite (`browser-lite.mjs`); site pages and addresses, T-057/T-064/T-106 (`public-build-assets.mjs`, `public-addresses.mjs`, `browser-home-curve-fits.mjs` for the edited front page); Developer panel, T-058 (`browser-shell.mjs`, `browser-phone.mjs`); HYG stars, T-060 (`browser-sky.mjs`); embedding by the portfolio, T-106 (`browser-embedded.mjs`). T-063 pictures have no script (no-screenshots rule). Results: lite 134 s, shell 25 s, phone 87 s, sky 99 s, home-curve-fits 4 s, embedded 72 s; all exit 0, error-lines 0; 424 s total including server start. No pictures in the run directory (0 png/jpg). C-085 ran the whole `run-full.sh` 24/24 green at 92e7068; app code is unchanged since.
- Code Health: `savepoint health check O-016` after the gate: snapshot above (created), "does not block clearance"; coverage and tests optional instances stale (collection, not code); complexity, duplication, vulnerabilities no finding.

## Owner decisions assessed

- T-106 Task-check waiver (`check_waiver` on T-106): scope is the portfolio page, unchanged since (7596b84, clean tree). Still applies; not a Check, not `CLEAR`.
- Owner closures of T-057, T-058, T-060, T-063, T-064, T-106 stand; no status changed here.
- Owner address decision (2026-10-20, I-046 history) applied correctly.
- No structured `exception` exists on O-016, so nothing covers the unmet requirement.

## Adversarial pass

- Re-derived every repaired figure from its source rather than from the repair evidence; that is how the observed-count slip was found (the evidence's own per-story numbers contradict its total).
- Searched all three pages and README for any remaining "mean elements", "January 2000", "approximate demonstration", `shower-<`, "10 panels": none.
- No test yet ties panel counts or the README table to their sources (I-046 "preferably"); the slip shows why. Not a blocker on its own.

## Issues

- **I-046** (still open, PROV-01, T-064 outcome and DW2): `assets.html:337` "Thirteen panels are marked observed" — data says twelve. Smallest scenario: count `"badge": "observed"` across `data/stories/*/panels.json` (7 apollo11, 1 perseids, 2 geminids, 2 jupiter-io = 12). Expected "Twelve panels are marked observed, three modelled and one illustrative"; actual "Thirteen". Missing test: none reads the badge split from the data.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-046 (panel badge split) | Medium: on the assets page, read by visitors checking provenance | Low-Medium: one panel too many claimed as observed, on the page whose job is to be exact about observed vs filled-in (PROV-01); nothing breaks | Medium-Low | Fix now: one word in `assets.html:337` (ideally with a test counting badges from `data/stories/`), then one targeted re-check (the convergence limit allows one more) |

## Owner validation still needed

- After the one-word fix, a targeted re-check (new C-###, superseding this one) before the Objective can close.

## Observations (non-blocking)

1. README "Done" list says "Story panels in the Apollo 11 and Perseids demos"; Geminids and Jupiter and Io now have panels too. True but incomplete; outside I-046's named cells.
2. `site/apollo-phone.jpg`, `site/geminids-gmn.jpg` still unreferenced (owner decides).
3. The repair narrowed the README "measurement plus 5%" sentence to app pages and whole build; consistent with `load-budget.mjs`, whose header comment still says every limit is the 2026-10-17 measurement plus 5% (stale comment, not a page claim).
4. Code Health optional instances report stale coverage/tests evidence.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — README table and assets panel counts are still hand-copied from `load-budget.mjs` and `data/stories/`; the copy slipped once already (I-046).
- [x] STYLE-08 **Comments explain why**
- [ ] STYLE-09 **Content lives in data** — demo-card and panel facts in `index.html`/`assets.html` are hand-written copies of data facts (advisory).
- [x] STYLE-10 **Small diffs** — repair: 3 files, +24/-24.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope — C-085 lock reused, unchanged
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix — C-085 rows re-run
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice — advisory; not a finding
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation — closure map and admission ledger above
- [x] Verify File Reality — every file named in the I-046 repair evidence exists
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style
