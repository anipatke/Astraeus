---
id: C-119
scope: {kind: objective, id: O-044}
result: CLEAR
checked_by: {role: checker, session: o044-recheck-20261028}
executed_session: i093-repair
checked_at: '2026-10-28T11:05:00Z'
health_snapshot: sha256:9d03d630e17c7552972a224a3a301126e3310f02d262d97385ca1e80adfc8f44
reviewed:
  base_commit: 71e924dc
  head_commit: 52f09ed2
  files: [packages/astraeus/README.md, docs/NPM_PACKAGING.md, tools/build-packages.mjs]
  dependencies: []
issues: []
supersedes: C-118
---

# C-119: O-044 Full Objective Re-check (I-093)

Re-check of O-044, "Make the viewer a good guest in someone else's page", under C-118's frozen scope lock after the direct repair of I-093 (commit `52f09ed2`).

**Independence.** This session did not plan, build, coordinate or repair any O-044 work, and is not the C-118 session. It wrote only gate outputs (ignored `dist/`, `junit.xml`), a scratchpad probe, this record, I-093's resolution and T-183's structured owner validation.

**Baseline.** HEAD `52f09ed2` on `o044-good-guest`, not a worktree lane. `git diff 71e924dc..HEAD --stat`: 5 files, +8/-4 — the I-093 history, the router `issue:` key, `docs/NPM_PACKAGING.md` (1 line), `packages/astraeus/README.md` (1 line), `tools/build-packages.mjs` (1 comment line). `git diff 938cbfc0..71e924dc` (C-118's own commit) holds only C-118, I-093, the health snapshot and browser evidence JSON. So no source, test, fixture, dependency or gate definition changed since C-118's gate runs. The owner's uncommitted `packages/astraeus/src/app/SkyView.ts` trial (outside O-044) and untracked `docs/prds/`, `docs/research/` were present, not read and not touched, as in C-118. Times UTC.

**Verdict: CLEAR.** I-093 is repaired; every C-118 matrix cell stays proven; all re-run gates pass.

## Closure Map Of Prior Issues

| Issue | Status |
|---|---|
| I-093 (README, NPM_PACKAGING and build-packages header say plain Node cannot load the package) | Closed: verified by this Check |

## Admission Ledger

| Re-check item | Prior Issue / claim | Frozen cell (C-118) | Allowed result |
|---|---|---|---|
| README line 19 no longer says Node loading fails and agrees with "Loading in your build and in tests" | I-093 Proof Needed 1 | SC-Doc c / T-184 Boundary | Proven or Issue |
| NPM_PACKAGING line 79 describes the `node` condition and `.node.js` twins | I-093 Proof Needed 2 | SC-Doc c | Proven or Issue |
| build-packages.mjs header step 5 no longer says plain Node cannot load the code | I-093 Proof Needed 3 | SC-Doc c | Proven or Issue |
| grep for remaining contradictions; hand-off gates green | I-093 Proof Needed 4 | SC-Doc c; Gates | Proven or Issue |
| The new sentences claim nothing beyond the code at HEAD (node condition, 7 twins, JSON attributes, check:node-consumer) | repair claim | SC-Doc c; SC-Node; SC-Node (JSON) | Proven or Issue |
| Original reproduction: plain-Node import of the packed package | I-093 smallest scenario | SC-Node | Proven or Issue |
| All other C-118 cells unchanged | — | every other row | Proven (unchanged inputs) |

## Re-check Results

| Cell | Evidence | Result |
|---|---|---|
| SC-Doc c, README | `README.md:19` now reads "drawing needs a bundler and a browser, so do not load it from a bare `<script type="module">`. Node and Vitest can import it for scene definitions and tests (see "Loading in your build and in tests")"; the section at line 99 exists and says the same. The README inside a freshly packed tarball carries the new text | Proven |
| SC-Doc c, NPM_PACKAGING | `docs/NPM_PACKAGING.md:79` limits the bundler need to the default `import` build and describes the `node` condition, CSS-free `*.node.js` twins of the root entry and every module reaching the stylesheet, JSON import attributes, and `check:node-consumer`. Each claim checked: `package.json:67` `"node": "./src/api/index.node.js"`; `writeNodeCopy` (`build-packages.mjs:35-53`) twins stylesheet importers and their transitive importers; packed tarball holds 7 `.node.js` files, none containing `.css`; every `from "*.json"` in the packed `src` carries `with { type: "json" }` (0 without) | Proven |
| SC-Doc c, build-packages header | Line 12 now says bare browser modules cannot load the default build and Node/Vitest load the step 4b copy; diff is that single comment line, no executable change | Proven |
| Grep | `grep -n -i "straight in Node\|plain Node\|cannot load\|will not work"` over README, NPM_PACKAGING, RELEASING and build-packages.mjs: only the new, correct sentences (`build-packages.mjs:12`, `:35`, `NPM_PACKAGING.md:79`) | Proven |
| Original reproduction | Fresh `npm pack` of `packages/astraeus/dist` (built at HEAD) into a scratch `node_modules`, dependencies and peers linked from the checkout; plain `node probe.mjs` importing `Scene, earth, sun, mount, AstraeusScene` and calling `toDefinition()`: prints `plain node ok function function true` and resolves `astraeus` to `src/api/index.node.js` | Proven |
| All other C-118 cells (SC-Title, SC-Escape, SC-Layers, SC-Node, SC-Node JSON, SC-Time, SC-Phone, T-183 overlap, SC-Doc a, SC-Doc b, T-184 Design) | Their inputs (source, tests, fixtures, dependencies, gate definitions) are byte-identical to C-118's run (diff above); hand-off gates and `check:node-consumer` re-run green | Proven (carried, unchanged inputs) |

## Gates And Commands (fresh, sequential, Node v24.16.0)

| Command | Time (UTC) | Result |
|---|---|---|
| `npm run lint` | 11:01:56 | exit 0 |
| `npm run typecheck` | 11:01:59 | exit 0 |
| `npm run build` | 11:02:07 | exit 0 (known chunk-size warning) |
| `npm test` | 11:02:09 | exit 0; 142 files, 1,871 passed, 1 skipped |
| `npm run check:node-consumer` | 11:02:42 | `node consumer: pass` |
| `npm run check:pack` | 11:02:49 | `pack check: pass` (12.4 s); the README ships in the package |
| `git diff --check 71e924dc..HEAD` | 11:01 | clean |
| Plain-Node probe and tarball greps (scratchpad, not committed) | 11:03 | as in the table above |

**Reused from C-118 (metadata-only rule, `docs/agents/verification.md`).** `npm run test:full` (10:50:49, exit 0, 1,871 passed / 1 skipped, Statements 91.66%), `check:engine-alone` (10:51:56, pass), `measure:example` (10:52:28, 1,589,214 / 454,404 B), `check:browser` (10:54:28–10:56:19, 8/8 exit 0, `docs/evidence/browser-20261028T105428Z/`) and the official health snapshot `sha256:9d03d630…8f44` (10:52:54, does not block clearance), all on Node v24.16.0. Proof of unchanged inputs: since `938cbfc0` the only non-record changes are two Markdown documents and one comment line in `tools/build-packages.mjs`; no source, test, fixture, dependency, lockfile or gate definition changed. Per the browser policy a later check reuses the earlier browser run; a documentation change cannot change what it observed. No screenshots were taken.

## Prior Owner Decisions

No structured owner acceptance or exception was recorded on O-044's scope before this Check (C-118 deferred T-183's acceptance), so there is nothing to carry forward. The four Task-check waivers (T-181 to T-184) are untouched. T-183's owner look ("carry on", 2026-10-28T10:45:09Z, session o044-run-20261028), recorded in its body, is now recorded in its `owner_validation` frontmatter against this Check; its scope (phone story sheet zoom) is unaffected by the I-093 repair.

## Issues Pass

Every C-118 criterion is Proven; SC-Doc c moves from Issue to Proven. No Issues; no materiality actions required.

## Owner Validation Still Needed

- None for T-183 beyond what is recorded. Objective closure, commit and merge are owner decisions.

## Observations (nonblocking)

- **O1 — I-093's `repair_attempted` entry is stamped `2026-10-28T11:30:00Z`,** later than the repair commit (`52f09ed2`, 11:01:35Z) and this Check. History is append-only, so it is left as written.
- C-118's observations O1 to O6 stand unchanged (pack at 444 of 450 files; owner look before the browser run; webpack/Parcel not rebuilt; `setTimeline({ none: true })` opening at now; `isolation` left after `unmount`; `MoonFamilyPanel` not named as lazy).

## Code Style Review

- [x] STYLE-01 **One job per file** — unchanged since C-118.
- [x] STYLE-02 **One job per function** — unchanged since C-118.
- [x] STYLE-03 **Test branches** — unchanged since C-118.
- [x] STYLE-04 **Types document intent** — unchanged since C-118.
- [x] STYLE-05 **Build only what is needed** — the repair rewords three sentences only.
- [x] STYLE-06 **Handle errors at boundaries** — unchanged since C-118.
- [x] STYLE-07 **One source of truth** — the README, packaging notes and build header now agree with the code and with each other about Node loading.
- [x] STYLE-08 **Comments explain why** — the build header says why bare browser modules fail and where Node's copy comes from.
- [x] STYLE-09 **Content lives in data** — unchanged since C-118.
- [x] STYLE-10 **Small diffs** — three one-line edits.
