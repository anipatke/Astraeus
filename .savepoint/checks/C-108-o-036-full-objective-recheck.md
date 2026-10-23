---
id: C-108
scope: {kind: objective, id: O-036}
result: CLEAR
checked_by: {role: checker, session: o036-full-recheck-20261023}
executed_session: o036-repair-20261023
checked_at: '2026-10-23T08:44:17Z'
health_snapshot: sha256:15dfbb133523bdb617533af54de689a1ca4a74cb4d5ba038009b0f8affaf285d
reviewed:
  base_commit: 7534a7f7
  head_commit: 56eada5d
  files: [tools/build-packages.mjs, tools/check-packs.mjs, tools/check-packs.d.mts, packages/astraeus-data-jupiter/src/index.ts, packages/astraeus-data-saturn/src/index.ts, packages/astraeus-data-uranus/src/index.ts, packages/astraeus-data-neptune/src/index.ts, packages/astraeus-data-mars/src/index.ts, packages/astraeus-data-pluto/src/index.ts, packages/astraeus-site/tests/packagePacks.test.ts, packages/astraeus/README.md, docs/NPM_PACKAGING.md, AGENTS.md, .github/workflows/publish.yml]
  dependencies: []
issues: []
supersedes: C-107
---

# C-108: O-036 Full Objective Recheck

This recheck supersedes C-107 (NEEDS WORK: I-077, I-078, I-079). It covers HEAD `56eada5d`, the repair commit, against C-107's commit `7534a7f7`, with a clean tree. The owner chose "Fix all three, short recheck (Recommended)" on 2026-10-23. This session is independent: it did not build, repair or coordinate any O-036 work. It did not reuse the builder's scratch apps. It packed its own tarballs from a fresh `check:pack` build and wrote its own consumer apps and probe. Times come from `date -u`.

**Verdict: CLEAR.** webpack 5, Vite 8 and Parcel 2 each build a packed-tarball consumer with Saturn and Titan, and each draws Titan in headless Chromium. Moon chunks are no longer inlined: the Vite entry has no `data:` URL, and the 5,849 chunks are separate files. The AGENTS.md map now describes the packages. Nothing C-107 proved has regressed. The observations below are non-blocking. One of them is a small wording slip in a new AGENTS row, for the owner to decide on.

## Closure Map Of Prior Issues

| Issue | C-107 | Now | Basis |
|---|---|---|---|
| I-077 webpack 5 | open | **closed (verified)** | First option of Proof Needed met: fully specified imports, a fresh webpack 5 build passes, and a fast guard exists |
| I-078 chunks inlined | open | **closed (verified)** | Default Vite entry has 0 inlined chunks (14.97 MB in C-107, now 1.87 MB), chunks are fetched per window, and the README matches |
| I-079 AGENTS map | open | **closed (verified)** | Every row named in Proof Needed exists, the engine-alone line is fixed, and the edits are outside the Savepoint-managed text |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-107's lock reused unchanged; recheck rules)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-107 rows re-run below)
- [x] Finite External-Boundary Matrix (unchanged from C-107; publish dry run re-run)
- [x] Workflow And Side-Effect Check Lock (publish workflow: one new guard step before step 1)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (none used; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger (recheck)

| Recheck item | Prior Issue or claim | Frozen C-107 cell | Allowed result |
|---|---|---|---|
| webpack 5 build and run of the packed packages | I-077 | SC3 install-ready, webpack 5 | blocking |
| Parcel build and run | I-077 (Parcel folded into its Proof Needed) | SC3 install-ready, Parcel | blocking |
| Vite build and dev, and the entry size | I-078 and SC1 | SC2 "only download what you use"; SC1 moon with data packages | blocking |
| Guards in check-packs and the unit test | I-077 and I-078 "fast check" | SC2 contents and size check | blocking |
| JSON default-import rewrite and `.js` rewrite | I-077 repair path | SC3 compiled ESM + `.d.ts` | blocking for the repair's own output |
| AGENTS.md rows and engine-alone line | I-079 | SC5 / T-162, AGENTS | blocking |
| README and NPM_PACKAGING wording | I-077, I-078 | SC5 written down | blocking |
| Workflow npm-version guard | C-107 observation | SC6 publish | non-blocking (it was an observation) |
| Every other C-107 cell | none | as in C-107 | blocking if regressed |

## Recheck Matrix

| Row | Cell | Result | Evidence (this session) |
|---|---|---|---|
| SC3 | webpack 5 (5.112.1, webpack-cli 5, style/css-loader, classic `<script>`; my own config) | **Proven** | `webpack --mode production` "compiled successfully" (08:37:06-08:37:17). `main.js` 2,178,464 B, 5,849 `.bin` files, 0 `data:` chunks. Served on 127.0.0.1:5612 and probed: `mount` ready; Titan `sphere`, in view, 130.1 px; Saturn moves from (-1.983, -0.451) to (0.739, -0.066) after a 4-day seek; 4 chunk files fetched (URLs keep `?no-inline`); Titan's 4k picture is served (its content hash matches a fetched `.jpg`); 0 console or page errors; 0 HTTP errors |
| SC3 | Parcel 2.16.4 with `packageExports: true` | **Proven** | `parcel build` passes (08:37:23-08:37:42). Entry 1,871,865 B, 5,849 `.bin`, 0 inlined. Probe as above: Titan sphere in view, Saturn moves, 4 chunks, `titan-4k` fetched, 0 errors |
| SC5 | README "Parcel needs `packageExports`" | **Proven true** | The same app without the setting fails: `Failed to resolve 'astraeus'` / `Cannot load file './index'` |
| SC1 / SC2 | Vite 8.3.5 build | **Proven** | `vite build` passes. Entry `index-*.js` 1,866,933 B (465,892 B gzip). 0 `data:` URLs of any kind in any JS file. 5,849 `.bin` emitted. Probe: Titan sphere in view, Saturn moves, 4 window chunks fetched (window 2025-12-17 to 2026-01-16), `titan-4k` fetched, 0 errors |
| SC1 | Vite dev server (C-107 cell) | **Proven, no regression** | `vite` on 127.0.0.1:5614: the same probe passes; chunk requests carry `?no-inline` and load (2 distinct names: 2025.bin and 2026.bin) |
| SC2 | pack guard: extensionless import | **Proven** | Unit test plants `./chunks` and `../x/y` (passes in test:full). My own plant also catches side-effect `import "./chunks"`, `import a from '../data/x'`, `export * as q from "./index"` and `.d.ts` `import("./index")`/`export from` |
| SC2 | pack guard: chunk URL without `?no-inline` | **Proven** | Mutation of the packed Pluto `chunks.js`: one URL without the query fails; `?no-inline=0` fails; an empty list fails ("lists no chunk"); file restored byte-for-byte (`cmp`) |
| SC3 | compiled imports resolve (independent oracle) | **Proven** | My acorn and TypeScript-AST walk over all 8 `dist/src` folders checked 193 `.js` and 187 `.d.ts` files, 1,016 relative specifiers and 7 `import()` calls (all literal). Every `.js` specifier names a file that exists exactly. All 30 JSON imports take only the default export, with no JSON re-export |
| SC5 | README bundler sentence, "about 39 MB", download sentence | **Proven** | Matches the builds above and `check:pack` (astraeus-data 38.62 MB packed) |
| SC5 | NPM_PACKAGING rows 1 and 2, risk note | **Proven** | Measured figures match mine within a few hundred bytes (my `main.js` differs slightly) |
| SC5 / T-162 | AGENTS.md Codebase Map and engine-alone line | **Proven** | Rows exist for `packages/astraeus-data`, `astraeus-data-{jupiter,…,pluto}` and `examples/hello-scene`. The engine row names the compiled `dist/` and `x-publish`. The `tools/` row names the four root tools, each present on disk. The engine-alone line says it checks source and `check:pack` checks the build. The edits sit outside the Savepoint workflow sections. One wording slip, below |
| SC6 | publish workflow npm guard (C-107 observation) | **Proven** | The workflow's own `node -e` text, extracted and run: 11.13.0, 11.5.1, 11.10.0 and 12.0.0 pass; 11.5.0, 11.4.9, 10.9.9 and an empty string fail. Unparsable input passes (observation) |
| SC6 | dry run, release-only publish, no token | **Proven, no regression** | `node tools/publish-packages.mjs --dry-run` 08:43:35-08:43:52: 8 × "not on npm yet", 8 × `(dry-run)`; nothing published. `publishWorkflow.test.ts` passes. Workflow diff touches only the version step |
| SC4 | example from packed tarballs | **Proven** | `build:example` passes; browser step `hello-scene` passes on desktop and phone |
| SC1 demos / public site | unchanged | **Proven** | Public build: 93 files, 24,870,860 B, the same as C-107. `load-budget` and `public-build-assets` ok. Browser smoke and journeys pass |
| ARCH-04 | engine alone | **Proven** | `check:engine-alone` pass |
| PROV-01/02 | credits | **Proven, no regression** | `check:pack` NOTICE checks pass; `assetsPageCredits` and `packagePacks` credit tests pass; `public-build-assets` ok |

## Adversarial Pass (the repair code)

- **JSON rewrite** (`defaultJsonImports`): the regex matches only one-line `import { … } from "x.json";` without attributes. The oracle shows nothing it missed: no named JSON import remains in any dist. A future multi-line or attributed named JSON import would slip through the rewrite. `check:pack` does not test for this, but webpack would fail loudly (observation). The destructuring sits where the import was, before any use. The JSON objects have no `default` key, so `loaded.default ?? loaded` cannot pick the wrong value for the six indexes.
- **Extension rewrite** (`addExtensions`): any relative specifier it cannot resolve throws, so the build fails rather than shipping a bad path. A dotted module name (`./a.b`) would be taken as already having an extension. None exists in the engine or data sources. The oracle confirms every specifier resolves.
- **`?no-inline`**: Vite strips the query (built names have no query; dev requests keep it and load). webpack keeps it on the request URL, and the static server ignores it. Parcel strips it. A tarball consumer gets correct chunks in all four modes. The guard does not catch a URL whose query is built by string concatenation. The generator never writes that form (observation).
- **Engine `import()` of JSON under Parcel**: the engine has no dynamic JSON import. Its one dynamic import is `./planetModels.js`, which loads under all three bundlers.

## Gates (fresh, this session)

| Gate | UTC | Result |
|---|---|---|
| `git diff --check 7534a7f7 HEAD` | 08:32 | clean |
| `npm run lint` | 08:32:33-08:32:36 | pass |
| `npm run typecheck` | 08:32:36-08:32:40 | pass |
| `npm run build` | 08:32:40-08:32:41 | pass |
| `npm run test:full` (first) | 08:32:41-08:33:48 | 1 timeout at 5000 ms in `pointsLookAhead.test.ts`. It ran while my scratch `npm install`s were running. The file is not in the diff; this is the same load flake as C-106 and C-107 |
| `npm run test:full` (rerun, alone) | 08:34:23-08:35:27 | pass: 119 files, 1568 passed, 1 skipped; fresh `coverage/coverage-final.json` and `junit.xml` |
| `npm run check:engine-alone` | 08:33:48-08:34:05 | pass |
| `npm run check:pack` | 08:34:05-08:34:18 | pass (8 packages; Saturn 5,857 files, 36.23 MB) |
| `npm run build:example` | 08:41:29-08:41:33 | pass |
| Public build + `load-budget.mjs dist` + `public-build-assets.mjs dist` | 08:41:40-08:41:44 | pass: 93 files, 24,870,860 B |
| Normal `npm run build` restored | 08:41:44-08:41:45 | pass |
| `savepoint health check O-036` | 08:41:52-08:41:58 | snapshot above, "does not block clearance"; every instance reports no finding |
| `npm run check:browser` (once) | 08:42:02-08:43:22 | pass, 7 steps including `hello-scene`, 0 error lines; evidence `docs/evidence/browser-20261023T084202Z/` |
| `node tools/publish-packages.mjs --dry-run` | 08:43:35-08:43:52 | pass, nothing sent |

The browser check ran once, as C-107 required, because the repair changes what `build:example` compiles. Nothing was published and nothing was pushed. The owner's servers on :5490, :5491 and :5496 were left running. My scratch servers on 5611 to 5614 were stopped. The scratch apps, tarballs, oracle and probe are in `/tmp/claude-1000/-home-user-code-Astraeus/00a3b7e2-dcc4-432a-a7e9-b1f995ca1a1f/scratchpad/c108/`, outside the repository. The probe uses `tools/validate/driver.mjs` and `harness.mjs` and takes no screenshots.

## File Reality

Every file named in the three `repair_attempted` entries exists at HEAD. The builder's scratch apps exist, but this Check did not rely on them.

## Owner Decisions

T-159 to T-162 carry owner check waivers. T-159 and T-162 have owner verdicts recorded in their Tasks. None is a structured acceptance or exception with an `accepted_check`, so there are no `carried_forward` entries to write. The repair does not change what those verdicts covered. NPM_PACKAGING rows 1 and 2 gained measured facts but no changed decision. The example draws the same scene, and its browser step passes. No owner renewal is needed.

## Materiality

There are no Issues, so no materiality actions are required.

## Observations (non-blocking)

1. **AGENTS wording (minor; the owner may decide):** the new `packages/astraeus-data/` row says "Moon-to-Charon pictures". The package holds Io to Charon plus Pluto, the 8k Venus map and the Milky Way. Earth's Moon picture stays in the engine. The README says "Io to Charon".
2. `.savepoint/Design.md:236` (the T-158 engine-alone note) still says "The engine has no build of its own." It is a dated note about T-158, outside I-079's Proof Needed.
3. Pre-existing since T-161, outside the repair: `astraeus-data-<planet>/dist/src/` has no `chunks.d.ts` (the source has one). A TypeScript consumer therefore sees `chunkUrls` as `any`. With the default `skipLibCheck: true` there is no error; with `false`, it reports an error alongside the unrelated `three` and `style.css` errors. `dataSource` keeps its `DataSource` type.
4. The workflow's npm guard lets an unparsable version through (`abc` exits 0, because the comparisons with NaN are false). npm on setup-node always prints a numeric version.
5. The `?no-inline` guard is exercised by `check:pack` on real output, but no unit test plants an offender (the I-077 guard has one).
6. The first `test:full` hit the known `pointsLookAhead.test.ts` load timeout again.

## Owner Validation

No owner look is needed for this recheck: the repair changes build output, not the look. Every Issue on C-107 is closed as verified, so O-036 is ready for the owner to accept and close.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches**: the `?no-inline` and "lists no chunk" branches of `codeProblems` (`tools/check-packs.mjs`) have no planted unit case; they were proven by mutation in this Check.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: the same four-line `loadIndex` (with the Parcel comment) is copied into six data packages; the relative-specifier regex is written twice (`build-packages.mjs`, `check-packs.mjs`), the second deliberately as an independent guard.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**: 17 files, +139/-23.
