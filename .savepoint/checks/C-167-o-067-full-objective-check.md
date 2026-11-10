---
id: C-167
scope: {kind: objective, id: O-067}
result: CLEAR
checked_by: {role: checker, session: o067-check-20261111}
executed_session: o067-run-20261110
checked_at: '2026-11-10T20:56:00Z'
health_snapshot: sha256:a5a01a44733dcdd49a43a3450783b69edf66583de18b68ee3520b46c41e745d2
reviewed:
  base_commit: 96f8acb3
  head_commit: 4d03870a
  files: [docs/architecture/constellations-o067.md, docs/BROWSER_CHECKS.md, docs/NPM_PACKAGING.md, docs/agents/build.md, examples/hello-sky/.gitignore, examples/hello-sky/README.md, examples/hello-sky/index.html, examples/hello-sky/package.json, examples/hello-sky/src/main.js, package-lock.json, packages/astraeus-data-constellations/NOTICE, packages/astraeus-data-constellations/README.md, packages/astraeus-data-constellations/data/boundaries.json, packages/astraeus-data-constellations/data/figures.json, packages/astraeus-data-constellations/data/names.json, packages/astraeus-data-constellations/data/provenance.json, packages/astraeus-data-constellations/package.json, packages/astraeus-data-constellations/src/index.ts, packages/astraeus-data-constellations/tests/constellations.test.ts, packages/astraeus-data-constellations/tests/data.test.ts, packages/astraeus-data-constellations/tools/import/constellations.mjs, packages/astraeus-site/tests/packageBoundaries.test.ts, packages/astraeus-site/tools/validate/check-hello-sky.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tools/validate/runner.mjs, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/api-surface.lock.json, packages/astraeus/src/api/look.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/SkyFiguresView.ts, packages/astraeus/src/app/liveLook.ts, packages/astraeus/src/app/look.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/skyFigures.ts, packages/astraeus/src/core/skyTrace.ts, packages/astraeus/tests/helpers/frameContext.ts, packages/astraeus/tests/helpers/viewerPresentation.ts, packages/astraeus/tests/look.test.ts, packages/astraeus/tests/skyFigures.test.ts, packages/astraeus/tests/skyTrace.test.ts, tools/build-example.mjs, tools/build-packages.mjs, tools/check-packs.mjs, tools/gate-limits.json, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: null
---

# C-167: O-067 Full Objective Check

**Verdict: CLEAR.** Every Success Condition of O-067 is proven by the code, the named tests, independent probes (an equal-area tiling oracle for the boundaries, a byte-identical re-import from the pinned sources, a packed-package helper matrix) and a fresh full gate including `npm run check:browser`. Design is reconciled. No Issue is admitted. I-167 was reproduced and assessed as not material to this Objective (below). Observations are non-blocking.

Fresh session: this checker did not build, coordinate or look at any O-067 step. Scope: `git diff 96f8acb3` (merge base with `main`) through head `4d03870a` plus the uncommitted T-306 owner-look 2/3 engine change in the working tree (reviewed with `git diff` / `git status`). 57 files, about +1,715 / -59. `docs/prds/` and `docs/research/` were not read or touched. Nothing was committed.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated as a feature, no finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check of O-067)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. Criteria: O-067 Success Conditions (Licence first, All 88, Add by abbreviation, Package pattern, Orion example, docs/Design/browser/owner look); T-303..T-306 Done When; guardrails PROV-01, PROV-02, DATA-01, ARCH-01, ARCH-02, API-01, API-04, API-06, API-07, TEST-01, TEST-03; release gates in `docs/agents/build.md`.
2. Entry points: `astraeus-data-constellations` exports (`loadFigures`, `loadBoundaries`, `loadNames`, `loadProvenance`, `constellations`, the four JSON subpaths); the import tool `tools/import/constellations.mjs`; `examples/hello-sky`; engine additions from the T-306 owner looks (`LookInput.skyFadeInSeconds`, `LookRead.skyFadeInSeconds`, fade-in in `SkyFiguresView`, selected-trace colour, `whenTraced` name ramp, tappability by trace); `tools/build-example.mjs`, `build-packages.mjs` (`isPositionPackage`), `check-packs.mjs` limits; `check-hello-sky.mjs`.
3. Relied-on runtime: engine `scene.addSkyFigures` checks (`bad-sky-figure`, `duplicate-id`), star list resolution at build (`unknown-star` / `missing-data`), the frame stage 4c, the label layer opacity, the packed-tarball install path.
4. Matrix axes and cells: below; not-applicable cells give their reason.
5. Admission boundary: supported paths are a browser app (bundler) on `mount`/`AstraeusScene` and the documented package API; Node headless star-end loading is a stated engine limit (I-167), outside O-067's Boundaries ("engine changes beyond any defect found").

## Acceptance Coverage

| Criterion | Result | Evidence |
|---|---|---|
| Licence first (PROV-02, DATA-01) | Proven | `docs/architecture/constellations-o067.md` compares five figure sets with licence wording; owner decisions recorded in the note and Objective (T-303 evidence, Objective Decisions). NOTICE and README state CC BY-SA 4.0 (figures, boundaries), CC BY 4.0 (names), MIT code. |
| All 88: figures as HIP where the engine list holds the star, positions otherwise (counted, stated) | Proven | Independent probe (`python3 -I`, scratchpad `probe/data_probe.py`): 88 keys identical across names/figures/boundaries; 752 segments, 1504 ends, 1503 HIP all in `hyg-v42-naked-eye.json`, 1 position `[169.54677, 31.52878]` (xi UMa, stated in README); 0 zero-length, 0 repeated, no empty figure. |
| IAU boundaries as J2000 closed outlines | Proven | Independent oracle: equal-area integral over all 89 rings (polar rings Oct and UMi handled by winding) sums to 4π sr, relative error -4e-16, so the outlines tile the sphere with no gap or overlap; UMi 255.8 and Oct 291.0 deg² match IAU areas; Betelgeuse, Rigel in Ori, Sirius in CMa, Vega in Lyr, Antares in Sco, Acrux in Cru (point-in-outline). All points within RA [0,360), Dec [-90,90]. Serpens two rings (Caput 101 pts, Cauda 117). |
| Names and abbreviations; provenance once (PROV-01) | Proven | `names.json` 88 entries; `provenance.json` pins commit and SHA-256 per source; helper figures carry `sourceType: "illustrative"` provenance. |
| Import tool rebuilds from recorded sources | Proven | Re-ran `constellations.mjs --cache <scratch> --out <scratch>` (network): SHA-256 checks passed, cross-check within tolerance (max 0.000157 deg), all four output files byte-identical to `data/` (`cmp`). |
| Add by abbreviation (owner decision 2, ARCH-01, API-01) | Proven | Packed-package probe (scratch Node app from `npm pack` tarballs): `[]` gives 0; `"all"` 88; all with outlines 177 (89 boundaries, ids unique); unknown `Xyz`, wrong case `ori`, `__proto__`/`constructor` throw `RangeError` naming each; repeat throws naming `Ori`; options pass through (`shown`, `color`, `labelColor`, `listed`, `idPrefix` "c:Ori"), unset options omitted; bad `shown` is refused by the engine (`SceneError bad-sky-figure`); id clash is `duplicate-id`; all 88 with outlines pass `scene.check()`; mutating a result does not leak into the next call. Package imports only `astraeus` types; engine has no constellation code (engine-alone gate passes). Tests: `packages/astraeus-data-constellations/tests/constellations.test.ts`, `data.test.ts`. |
| Package pattern (API-07, check:pack, small download, limits) | Proven | `peerDependencies.astraeus ">=0.8.0 <0.9.0"`; `check:pack` pass: 0.07 MB packed (limit 0.09 MB), 0.21 MB unpacked (limit 0.25), 10 files (limit 20); allow-list limits data files; listed in `build-packages.mjs` and `check-packs.mjs`. |
| Orion example on plain mount, packed packages, three steps (turn, select, trace), checked like the others | Proven | `examples/hello-sky/src/main.js` imports only `astraeus`, `astraeus/style.css`, `astraeus-data-constellations`; fresh `check:browser` step `hello-sky` exit 0 (11 s, limit 15 s), desktop and phone, three steps, trace appears/clears, card, ecliptic, no overlap, slider; first download stated in README. |
| README, CHANGELOG, Design reconciled; one check:browser; owner look | Proven (owner look per owner record) | Design.md Codebase Map rows (package, example), "Constellations" (1)-(5), Sky figures (11) for the fade-in; T-306 Drift Notes account for every T-303..T-306 note. CHANGELOG entries for the package, example and fade-in; README `setLook`/`look` rows include `skyFadeInSeconds`. Owner looks recorded in T-306 evidence; T-306 is `done` (owner). |
| T-306 owner-look engine change (fade-in, selected trace, whenTraced name ramp) | Proven | Tests: `skyTrace.test.ts` "sky lines fade in when they appear (owner, T-306)" (4 cases) and "a selected figure being traced (owner, T-306)" (2 cases), adjusted cases in "a figure shown only when traced"; `look.test.ts` CASES row `skyFadeInSeconds` (no address parameter, range 0-3); `skyFigures.test.ts` label opacity "1". API lock updated (+10 lines, `api:lock`), CHANGELOG states additions only. Browser `look-out` and `hello-sky` steps pass with the fade-in on. |

## Coverage Matrix

| Row | Cells | Result |
|---|---|---|
| `constellations()` input shape | empty list; one; many; `"all"`; unknown; wrong case; prototype keys; repeated; mutated result | pass (probe above) |
| `constellations()` options | each option set; unset omitted; bad `shown` (engine check); `idPrefix` clash avoidance and clash detection | pass |
| Outlines | off (outline file not loaded: `src/index.ts` loads `boundaries.json` only when `outlines` true); on; Serpens two parts with ids/labels | pass |
| Data files | counts, HIP resolution, closure/tiling, ranges, samples, reproducibility | pass (independent oracle) |
| Environment | browser bundler (Vite example): pass; Node packed import: helper pass, `scene.load()` with star ends `missing-data` (I-167, stated limit, not admitted) | see I-167 |
| Fade-in state | switch off (share 0), on (rises by capped real delta), off-then-on (re-fades), 0 s, reduced motion | pass (`skyTrace.test.ts`) |
| Selected trace | growing (selected colour, emphasis hidden), complete (emphasis shown), cleared (traced colour lerp to faded), unselected (traced colour) | pass (tests + code reading `SkyFiguresView.ts` 151-171, 189) |
| whenTraced name | no trace 0; quarter drawn 0.5; at half and after 1; fade `1 - fade` | pass |
| Tappability | whenTraced from trace start; switched-off kind excluded | pass |
| Look surface | `setLook` range 0-3 (`bad-look` outside, via LOOK_FIELDS), `look` read, no address parameter (API-06 mapping test) | pass |
| Text classes / Unicode / numeric parsers | n/a: no text width, parsing or user numeric input beyond the look range covered by the look table |
| Persistence / transactions | n/a: no persistence; import tool writes four files only to `--out` |

## Finite External-Boundary Matrix

The import tool (network sources) and the browser runner are the boundaries.

| Cell | Classification |
|---|---|
| Configured vs actual target | Import: pinned URLs and SHA-256; re-run fetched the same bytes (hashes passed). Browser: runner ports 5479-5484, owner preview on 5490 untouched. |
| Startup / discovery / reuse | `--cache` reuses downloads after hash check (tool lines 40-65). |
| Connection refused / unavailable | Import fails the run (no partial write before fetch completes; outputs written at the end, lines 350-353). Not exercised by forced outage; covered by code reading. |
| Non-success / redirect | `fetch` response checked before write (code reading); no redirect-specific handling needed (archive `id_` URL). |
| Timeout / cancel | No explicit timeout in the tool; developer-run tool, not a gate. Observation only. |
| Malformed response | SHA-256 mismatch fails before parsing. |
| Retry / cleanup / partial effects | A failure before the write step leaves `data/` untouched; outputs are four whole-file writes. |
| Secret-safe output | No secrets involved. |

## Workflow And Side-Effect Lock

| Order | Operation | Side effect | Failure owner / final state | Oracle |
|---|---|---|---|---|
| 1 | fetch or read cache, hash check | cache file written | tool exits non-zero, no data written | hashes |
| 2 | parse, drop zero-length/repeated, chain, densify, precess | memory only | throws | counts in provenance |
| 3 | cross-check VI/49 | none | fails above 0.01 deg | tolerance in provenance |
| 4 | write four JSON files | `data/` (or `--out`) | whole-file writes | `cmp` with committed data (identical) |
| build-example | pack engine + extra packages, install, vite build | `.packs`, `node_modules`, `dist` (git-ignored) | command-fatal | `check:browser` hello-sky step |

## Adversarial Pass

- Bypass of the helper's checks: every output still passes the engine's own `addSkyFigures` checks (bad `shown`, duplicate id rejected there).
- Prototype keys: `Object.hasOwn` refuses `__proto__`, `constructor`.
- Representation: JSON subpath exports and loader functions read the same files.
- Fade-in after an idle spell: delta capped at 0.1 s so a fade is never skipped; a frame with zero delta does not advance (observation below).
- Reduced motion: shows lines at once (test).
- Independent oracles used: sphere tiling area, published constellation areas, star-in-boundary, byte-identical re-import.

## Verify File Reality

Every file named in T-303..T-306 evidence and drift notes exists (`docs/architecture/constellations-o067.md`, package files, example files, `check-hello-sky.mjs`, driver additions, gate limits, docs). T-303's scratchpad scripts are in a former session's scratchpad and are recorded as scratch research (not shipped).

## Gates (fresh, this session, Node v24.16.0, 2026-11-10 UTC)

| Command | Result |
|---|---|
| `git diff --check` (working tree and since base) | pass |
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run test:full` (full gate, coverage + junit) | pass: 247 files, 3665 passed, 2 skipped (20:42:21-20:43:37Z) |
| `npm run check:engine-alone` | pass (24 s) |
| `npm run check:pack` | pass (14 s) |
| `npm run check:node-consumer` | pass (5 s) |
| `npm run check:react-consumer` | pass (9 s) |
| `npm run check:browser` | pass, every step exit 0, error-lines 0; total 310 s (limit 320 s); evidence `docs/evidence/browser-20261110T204522Z/` |
| Import tool re-run to scratch | pass, byte-identical |

## Code Health

`savepoint health check O-067`: snapshot `sha256:a5a01a44733dcdd49a43a3450783b69edf66583de18b68ee3520b46c41e745d2` (created). Verdict: "Code Health does not block clearance." Complexity, duplication and dependency vulnerabilities: no finding. Tests and coverage instances (optional) reported "stale" although `npm run test:full` ran minutes before; a collection-freshness statement, not a finding about the code.

## I-167 Assessment

Reproduced on the packed engine and packed package in a scratch Node app with no `fetch` stub: `scene.load()` rejects `missing-data`; an unknown HIP also gets `missing-data` rather than `unknown-star`. Not admitted against O-067: it violates no O-067 criterion (the Objective's supported path is a browser app, proven by hello-sky; T-305's scene test is satisfied), the cause is the engine's headless star-list read from O-065/O-056, O-067 Boundaries exclude engine changes beyond a found defect, and the limit is stated in Design.md (Constellations, 4) and the package README. I-167 stays open as owner follow-up; a `rechecked` history entry records this run. It is not linked to this Check and does not block O-067 closure.

## Issues

None admitted. No materiality actions are required.

## Owner Validation Still Needed

- T-303 and T-306 declare `owner_validation: {required: true}`; the owner's choices and looks are recorded in their evidence and both are `done` (owner). The owner records acceptance against this Check (`accepted_check: C-167`, `accepted_by` owner) on each.
- The owner accepts the O-067 outcome and closes O-067, and commits the uncommitted T-306 owner-look change (engine fade-in) with the records.
- I-167: owner schedules it (a later G-018 Objective) or accepts it as a known limit.

## Observations (non-blocking)

- `check:browser` took 310 s against its 320 s limit (O-060 baseline about 230 s); `smoke` 124 s of it. The hello-sky step adds about 11 s; the remainder looks like machine load. Worth a look before the next browser step is added.
- `stepFadeIn` does not advance on a zero `delta`; if the very first frame had a zero delta and nothing else woke the scene, always-shown lines would stay at 0. Not seen in any run (all browser steps reading sky lines pass); a guard would be cheap.
- At the frame the selected trace finishes, stage 4b has already hidden the emphasis, so one frame shows the trace in the `traced` colour before the emphasis returns next frame. Visual, one frame; for the owner's eye only.
- `skyFadeInSeconds` has no Developer-drawer slider (the owner's "tune looks via settings" preference); API-06 is met because it is a public `setLook` setting.
- Design.md Sky figures (10) still ends "Not done here: constellation data", now delivered by O-067 (described in "Constellations").
- Import tool `fetch` has no timeout; developer-run, not a gate.
- The package `RangeError` is a plain error (API-05 covers the engine's `src/api/` only).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `SkyFiguresView.ts` defines `LINE_OPACITY = 0.85` beside the existing `TRACE_OPACITY = 0.85` for the same line opacity.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
