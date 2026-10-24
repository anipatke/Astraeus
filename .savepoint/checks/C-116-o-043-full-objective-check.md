---
id: C-116
scope: {kind: objective, id: O-043}
result: CLEAR
checked_by: {role: checker, session: o043-full-check-20261024}
executed_session: o043-run-20261024
checked_at: '2026-10-24T01:56:00Z'
health_snapshot: sha256:62ebcbda203905a40a1698f7b4ed411a9fe291d5c9c257f4710ac24e24020855
reviewed:
  base_commit: 77b6dabe
  head_commit: '18863175'
  files: [package.json, vitest.config.ts, tools/measure-example.mjs, tools/measure-example.d.mts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/DebugOverlay.tsx, packages/astraeus/src/app/debugReadout.ts, packages/astraeus/src/app/developerPanels.tsx, packages/astraeus/src/app/metricReadouts.ts, packages/astraeus/src/app/sceneDebug.ts, packages/astraeus/tests/firstOpenGraph.test.ts, packages/astraeus/tests/overlayLayers.test.ts, packages/astraeus/tests/cameraAndNamesDom.test.ts, packages/astraeus/tests/glowAndHooksDom.test.ts, packages/astraeus-site/tests/measureExample.test.ts, docs/evidence/o043-bundle-baseline.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: null
---

# C-116: O-043 Full Objective Check

Full Objective Check of O-043, "Raise coverage honestly and lighten a consumer's bundle" (T-178, T-179, T-180; all `done`, each with an owner-recorded Task-check waiver, session o043-run-20261024).

**Independence.** This session did not plan, build or coordinate any O-043 work. It started from the coordinator's request with the Next line "Record the Objective O-043 integration Check." It wrote only: gate outputs (`coverage/`, `junit.xml`, `dist/` folders, `examples/hello-scene/dist`), the official health snapshot, the browser run folder `docs/evidence/browser-20261024T015138Z/`, a throwaway probe in its scratchpad, and this record.

**Baseline.** HEAD `18863175` on `o043-coverage-bundle`; diff base `main` = merge base `77b6dabe` (4 commits). Not a worktree lane (`git-dir` = `git-common-dir`). The tree was clean apart from the untracked `docs/prds/` and `docs/research/`, which were not read or touched. Times are UTC (`date -u`); the host prints local time at +11:00.

**Verdict: CLEAR.** Every O-043 Success Condition and every owned Task's Done When is proven by fresh gate runs and independent probes; Guardrails are satisfied; the full gate passed; the official health snapshot does not block clearance. No Issues.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here; no lanes used; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check of O-043, no prior Checks, Issues or owner exceptions on this scope)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Requirements tested.** O-043 Success Conditions SC1 coverage scope (import tools out, reason in Design, no other exclusion), SC2 coverage target (overall ≥80% and `packages/astraeus/src/app` ≥80% by real behaviour tests), SC3 developer panels on demand (app that never opens them does not download them; site behaves as today), SC4 bundle measure (one repeatable command, first-open JS+CSS raw and gzip of packed `examples/hello-scene`, before and after, any real drop recorded; three.js and React stay). Each Task's Done When (T-178, T-179, T-180). Guardrails named by the Tasks: ARCH-02, ARCH-03, ARCH-04, CODE-01, CODE-02, TEST-01, TEST-03, TEST-04, STYLE-*. Release gates: AGENTS.md hand-off gates plus full gate (`test:full`), `check:engine-alone`, `check:pack`, `check:browser` once.
2. **Changed files and entry points.** The 24 files of `git diff main...HEAD` (frontmatter `reviewed.files` lists the code, test and evidence files; the rest are `.savepoint` records). Public entry points: `astraeus` `.` entry (`src/api/index.ts` → `mount` → `App`), the Developer switch in the shell, `npm run measure:example`, `npm run test:full`.
3. **Relied-on runtime.** Vite/Rolldown code splitting of `import()` in the packed example build; `tools/build-packages.mjs` keeping the dynamic import resolvable in `dist/` (proved by `check:pack` and the example build); React `lazy`/`Suspense`; Vitest v8 coverage include list.
4. **Matrix axes** below; not-applicable cells carry a reason.
5. **Materiality boundary.** An Issue must violate SC1 to SC4, a Done When, a Guardrail or a gate through a supported path (site, packed example, the npm scripts). Planet-system modules, `chebyshevEphemeris`, `sunCentredSources`, three.js and Orb are out of scope by owner decision ("Panels only"; three.js and React stay).

## Acceptance Invariants And Coverage Matrix

| # | Requirement (general rule) | Cells (normal / boundary / malformed-failure / bypass) | Evidence | Result |
|---|---|---|---|---|
| SC1 | Coverage counts all engine/site code except `packages/*/tools/import/**`; reason in config and Design; nothing else excluded | normal: include list; bypass: any other include/exclude change | `git diff main...HEAD -- vitest.config.ts`: only the `tools/import` include line removed plus a one-line reason comment; `exclude` unchanged. Fresh `coverage-final.json`: 0 files under `tools/import/`. Design.md O-043 paragraph "Code Health coverage scope (T-180)" states scope and reason | Proven |
| SC2a | Overall statements ≥80% under `npm run test:full` | normal; boundary (margin) | Fresh run 01:48:58–01:50:09Z: Statements 88.28% (9,281/10,513), branches 82.83%, functions 86.34%, lines 91.21%. Independent recount from `coverage-final.json` by a separate script: 9,281/10,513 = 88.28%. Margin above 80%: 870 statements | Proven |
| SC2b | `packages/astraeus/src/app` ≥80% by real tests, not exclusions | normal; boundary; bypass (source lifted or excluded to inflate) | Independent recount: 3,354/4,068 = 82.4% (margin 99 statements over 3,255). `git diff def86dd7 HEAD -- packages/astraeus/src` is empty: T-180 changed no source, so no lift or stub inflated the figure. New tests assert outcomes: `overlayLayers` 11 cases/41 expects, `cameraAndNamesDom` 12/44, `glowAndHooksDom` 14/58, none of them `toBeDefined`/`toBeTruthy`/`not.toThrow`; read cases check label transforms and slots, hidden state, gesture angles and clamps, halo sizes, URL overrides with warnings | Proven |
| SC3a | First-open graph of the public `.` entry never reaches `DeveloperSettings`, `DebugOverlay`, `FrameRateSection` | normal (source graph); real build (independent oracle); bypass (type-only or re-export path) | `tests/firstOpenGraph.test.ts` passes. Independent: grep of `src/` shows only `developerPanels.tsx` reaches `DeveloperSettings`, by `import()`; `App.tsx`, `AstraeusScene.tsx`, `sceneDebug.ts` import `FrameRateSection` with `import type` only (erased). Built example: `index.html` names only `index-Bvj3AWzI.js` and the CSS; the entry reaches `DeveloperSettings-pp231YOh.js` only through `import(...)` inside `lazy`; the panel text "Frame rate" is in the chunk only (0 in entry) | Proven |
| SC3b | Switched on, the panels appear and work as before; a placeholder while loading; address settings still apply | normal; loading state; second panel reuse | Owner look on localhost:5490 after T-179 (T-179 Owner Validation: "Looks fine, carry on"). Independent probe (scratchpad `probe/lazyPanels.probe.test.tsx`, happy-dom, not repository code): `<Suspense>` shows "Loading developer tools..." first, then the real `StoryPanelSettings` controls; a second lazy panel (`ViewLinkReadout`) renders from the same loaded module. Settings state stays in `App.tsx` (diff shows no state moved) | Proven |
| SC3c | Developer drawer only rendered when switched on | gate | `AstraeusShell.tsx:355` `{developerMode ? developerTools : null}`; the lazy panels are created only inside `developerTools` | Proven |
| SC4a | One repeatable command reports first-open JS+CSS raw and gzip, excluding on-demand scripts | normal; made-up folder (unit); real build | `npm run measure:example` 01:51:15–01:51:20Z exit 0, fixed-format table. `measureExample.test.ts` (3 cases) proves entry + static imports + CSS counted, `import()` on demand, pictures not counted, totals | Proven |
| SC4b | After < before, recorded | before/after | This run: first-open 1,589,537 B raw / 454,113 B gzip, byte-identical to the recorded T-179 after-figure; baseline 1,603,283 / 458,257 (T-178, `docs/evidence/o043-bundle-baseline.md`, commit 4c7ae4b9, no engine change in that commit). Drop -13,746 raw / -4,144 gzip, consistent with the new 14,479 B on-demand chunk. three.js and React unchanged | Proven |
| T-178 DW | breakdown by source and candidate list recorded with method | doc review | `docs/evidence/o043-bundle-baseline.md` has date, commit, command, totals, source table, method, candidates | Proven |
| T-179 DW | `check:pack`, `build:example`, `check:engine-alone` green; other candidates listed for owner | gates | All green this run; candidates listed as "Not done, by owner choice" | Proven |
| T-180 DW | Design reconciled; every T-178/T-179 drift note accounted | doc review | Design.md O-043 paragraph: coverage scope (reflected), bundle measure (non-architectural for `src/`, with reason), on-demand panels (reflected) | Proven |

**Input-shape / state / environment axes.** State: Developer switch off → on → off → on (lazy component created once at module load; React caches the resolved module; probe confirms second panel reuse). Environment: node test, happy-dom probe, headless browser (`check:browser` smoke over every public page desktop and phone, `hello-scene` and `hello-react` from packed tarballs), production example build. Text classes, serialization round trips, colour/no-colour sinks: not applicable (no text-width, parsing of user data or terminal output in scope; `measure:example` prints a plain tab table for a maintainer).

### Finite External-Boundary Matrix

| Cell | Classification |
|---|---|
| Configured vs actual target | `measure:example` measures `examples/hello-scene/dist` built from the packed tarball (not a workspace link) — passed |
| Startup / discovery / reuse | `buildExample` rebuilds packages then the example each run — passed |
| Unavailable dependency (on-demand chunk fetch fails) | Observation O1 below: no error boundary; not admitted as an Issue (see reasoning) |
| Success / non-success response | Chunk served in the browser run — passed; non-success as O1 |
| Redirect, timeout, cancellation | Not applicable: static same-origin chunk, browser default handling |
| Malformed response | Not applicable: chunk is the build's own file |
| Retry, cleanup, partial side effects | `measure:example` is read-only after the build; build failure throws with the failing command (`build-example.mjs` `run`) — passed by reading |
| Secret-safe failure output | Not applicable: no secrets in scope |

### Workflow And Side-Effect Lock (`npm run measure:example`)

| Order | Operation | Side effect | Failure timing / owner / final state | Oracle |
|---|---|---|---|---|
| 1 | `build-packages.mjs astraeus` | writes `packages/astraeus/dist` | non-zero exit throws; command fatal | `check:pack` pass |
| 2 | `npm pack` into `examples/hello-scene/.packs` (git-ignored) | tarball | fatal on failure | example installs it |
| 3 | `npm install --no-save` the tarball | example `node_modules` | fatal | build succeeds |
| 4 | `vite build` | `examples/hello-scene/dist` | fatal | `index.html` read directly |
| 5 | `measureBuild` read-only walk | none | missing `index.html` throws; a static import naming a missing file is skipped (O2) | grep of the built entry; totals reproduced byte-for-byte |
| 6 | print table | stdout | — | — |

### Matrix Completion Lock

Every cell above is passed, an observation with reason, or not applicable with reason. No Issue was found, so no remaining-cell pass was needed after one.

## Adversarial Pass

- **Bypass of the split.** A side-effect `import "./DeveloperSettings"` would escape the source test's regex (it needs `from`). Searched: only CSS side-effect imports exist in `src/`; the built-entry oracle independently confirms the split. Observation O3 (test gap, nonblocking).
- **Coverage inflated by exclusion or lifted code.** None: one include line removed (owner-approved), `exclude` unchanged, no `src` change in T-180.
- **Assertions using the implementation's own calculation.** Spot-read: gesture tests compute expected angles from the documented share-of-window formula with literal constants; label slot tests use fixed pixel expectations; halo `pxToUnits` checked against a hand-derived 10 units. Independent enough.
- **Measure counting.** Vite emits dynamic imports with backtick template literals (`import(\`./DeveloperSettings-…js\`)`); the static-import regex accepts only quotes, which matches the language (static import specifiers cannot be template literals). Totals reproduced exactly on a fresh build.
- **Stale baseline.** Baseline was taken on a tree with no engine change after `17210392`; the after-figure was reproduced byte-for-byte here.

## Verify File Reality

Every file named in T-178, T-179 and T-180 evidence exists at HEAD (`tools/measure-example.mjs`, `.d.mts`, `measureExample.test.ts`, `developerPanels.tsx`, `debugReadout.ts`, `firstOpenGraph.test.ts`, the three new test files, `docs/evidence/o043-bundle-baseline.md`). The T-178 source-map script is recorded as throwaway scratch work. No phantom files.

## Gates And Commands (fresh, sequential, Node v24.16.0)

| Command | Time (UTC) | Result |
|---|---|---|
| `npm run lint` | 01:48 | exit 0, clean |
| `npm run typecheck` | 01:48 | exit 0 |
| `npm run build` | 01:48:47 | exit 0 (the known 500 kB chunk warning) |
| `npm run test:full` | 01:48:58–01:50:09 | exit 0; 134 files, 1,781 passed, 1 skipped; Statements 88.28% (9,281/10,513), Branches 82.83%, Functions 86.34%, Lines 91.21%; fresh `coverage/coverage-final.json` and `junit.xml` |
| `savepoint health check O-043` | 01:50:34 | snapshot `sha256:62ebcbda…0855` (created); "Code Health does not block clearance" |
| `npm run check:engine-alone` | 01:50:45–01:51:03 | pass in 17.9 s (typecheck, lint, 76 files / 859 passed, 1 skipped) |
| `npm run check:pack` | 01:51:03–01:51:15 | pass (12.5 s) |
| `npm run measure:example` | 01:51:15–01:51:20 | exit 0; first-open 1,589,537 raw / 454,113 gzip; `DeveloperSettings-pp231YOh.js` 14,479 / 4,589 on-demand; `planetModels` 329,775 / 218,257 on-demand |
| `npm run check:browser` (once) | 01:51:38–01:53:30 | exit 0, 8 steps all exit 0, 0 error lines (smoke, smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-build-assets, public-addresses); evidence `docs/evidence/browser-20261024T015138Z/` (summary.txt and each step's results.json); no screenshots |
| `git diff --check main...HEAD` | 01:50 | clean |
| Probe: lazy panels through Suspense (scratchpad, not committed) | 01:54 | 1 passed |

`npm test` (fast gate) is covered by `test:full`, which runs the same suite with coverage.

## Code Health Evidence

Official snapshot `sha256:62ebcbda203905a40a1698f7b4ed411a9fe291d5c9c257f4710ac24e24020855`, commit `18863175` (dirty: untracked `docs/prds/`, `docs/research/` only). Verdict: does not block clearance. All five instances fresh: tests 1,782 total, 0 errors, 1 skipped; coverage 88.28%; vulnerabilities 0 (critical/high/medium/low/unknown all 0); duplication 0.83% (37 clones, 583 of 70,260 lines); complexity max CCN 29, 2 functions over 20 — both in untracked `docs/research/showers/*.py`, not O-043 code and not a finding. No Watch signal on O-043 code.

## Guardrails

| Rule | Result |
|---|---|
| ARCH-02 | Satisfied: `buildDebugReadout` moved unchanged into `debugReadout.ts` (byte-for-byte body); per-frame readouts still read State only |
| ARCH-03 | Not applicable: no new generic capability; on-demand loading is packaging, proven on the packed example |
| ARCH-04 | Satisfied: `debugReadout.ts` (in `src/app`) imports `core` and `app` types only; `check:engine-alone` passes |
| CODE-01 | Satisfied: lint (complexity 20) clean |
| CODE-02 | Satisfied: no new per-frame work; `sceneDebug` stage unchanged apart from its import path |
| TEST-01 | Satisfied: each changed behaviour has named evidence (`firstOpenGraph`, `measureExample`, the three DOM test files, owner scenario validation for the drawer) |
| TEST-03 | Satisfied: T-179 names `frameStats`, `domMenuAndLink`, `orbitLook` as the existing panel tests |
| TEST-04 | Satisfied: each Task carries an owner `check_waiver` naming Task, reason, actor, time |

## Issues Pass

All criteria Proven; none Unverified; no Issue admitted. No materiality actions are required.

## Owner Validation Still Needed

- T-179 declares `owner_validation.required: true`. The owner's look is recorded in its body ("Looks fine, carry on", 2026-10-24T01:39:39Z), but the structured `owner_validation` acceptance (`accepted_check`, `accepted_by`) is not yet recorded. The owner may record it against C-116 (as T-176 was against C-115). This Check does not record it on the owner's behalf.
- Objective closure, commit and merge are owner decisions.

## Observations (nonblocking)

- **O1 — on-demand chunk failure has no error boundary.** If `DeveloperSettings-*.js` cannot be fetched (offline, or a tab left open across a redeploy that removed the old hashed file) and the viewer then switches Developer mode on, the rejected `lazy` import propagates with no error boundary in `src/` and React unmounts the app; a reload fixes it. Before T-179 the panels could not fail this way. Not admitted as an Issue: no Success Condition or Guardrail names a failed-fetch behaviour, the drawer is a developer tool, and the trigger needs an unusual state. The owner may choose a follow-up (an error boundary around `developerTools` showing a retry line).
- **O2 — `measureBuild` silently skips a static import whose file is missing** (`existsSync … continue`), which would under-count rather than fail. Harmless for Vite output; a maintainer tool.
- **O3 — `firstOpenGraph.test.ts` regex ignores bare side-effect imports** (`import "./x"`) and relies on the extensionless `.ts/.tsx/index.ts` lookup; a future side-effect import of a panel would pass it. The built-example check (SC3a oracle) would still show the change in `measure:example`.
- **O4 — figures drift slightly between records.** The Objective's baseline JS gzip reads 449,266 B; T-178 measured 449,411 B (total 458,257 used throughout). T-180's "Not covered (still 0)" names `App.tsx`, which is at 164/256 statements; core is 95.6% here (T-180 said 95.1%). None changes a verdict.
- **O5 — AGENTS.md Build line "coverage counts `src` and the non-browser `tools` only"** is still literally true but no longer says import tools are excluded; Design.md carries the precise scope.
- **O6 — no browser step opens the Developer drawer**, so the lazy path in a real browser rests on the owner's preview look plus this session's happy-dom probe. Per project rules, adding a browser step is not required.
- `src/app` coverage margin is 99 statements above 80%; a large new untested file there would drop it below.

## Code Style Review

- [x] STYLE-01 **One job per file** — `debugReadout.ts` (values) split from `DebugOverlay.tsx` (drawing); `developerPanels.tsx` only lazy wrappers.
- [x] STYLE-02 **One job per function** — `pageFiles`, `staticImports`, `measureBuild`, `formatMeasure` are small and separately testable.
- [x] STYLE-03 **Test branches** — first-open vs on-demand, hidden/behind/too-far labels, clamps, warnings for bad address values are covered.
- [x] STYLE-04 **Types document intent** — `measure-example.d.mts` types the tool; `Panels[K]` keeps panel prop types through `lazy`.
- [x] STYLE-05 **Build only what is needed** — no extra candidates split beyond the owner's "Panels only".
- [x] STYLE-06 **Handle errors at boundaries** — build steps throw with the failing command; see O1 for the on-demand fetch.
- [x] STYLE-07 **One source of truth** — `DebugOverlay.tsx` re-exports from `debugReadout.ts` rather than duplicating.
- [x] STYLE-08 **Comments explain why** — header comments state the T-178/T-179 reason and method.
- [x] STYLE-09 **Content lives in data** — no new copy beyond the one placeholder line.
- [x] STYLE-10 **Small diffs** — 7 source files changed; most of the 1,224 added lines are tests and evidence.
