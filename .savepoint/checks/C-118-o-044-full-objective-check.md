---
id: C-118
scope: {kind: objective, id: O-044}
result: NEEDS WORK
checked_by: {role: checker, session: o044-full-check-20261028}
executed_session: o044-run-20261028
checked_at: '2026-10-28T10:59:00Z'
health_snapshot: sha256:9d03d630e17c7552972a224a3a301126e3310f02d262d97385ca1e80adfc8f44
reviewed:
  base_commit: 594e39e9
  head_commit: 938cbfc0
  files: [package.json, packages/astraeus/package.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, docs/RELEASING.md, .savepoint/Design.md, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/core/bodies/io.ts, packages/astraeus/src/core/bodies/jupiterData.ts, packages/astraeus/src/core/bodies/jupiterMoons.ts, packages/astraeus/src/core/bodies/outerPlanetData.ts, packages/astraeus/src/core/bodies/planetMoons.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/src/shell/DisplaySwitches.tsx, packages/astraeus/src/shell/StoryPanelView.tsx, packages/astraeus/src/shell/phone.css, packages/astraeus/src/shell/useDrawers.ts, packages/astraeus/src/shell/useZoomThrough.ts, packages/astraeus/tests/domStory.test.ts, packages/astraeus/tests/hostPageDom.test.ts, packages/astraeus/tests/publicApiStory.test.ts, tools/build-packages.mjs, tools/check-node-consumer.mjs]
  dependencies: []
issues: [I-093]
supersedes: null
unmet: [O-044-SC-Documentation, T-184-Boundaries]
---

# C-118: O-044 Full Objective Check

Full Objective Check of O-044, "Make the viewer a good guest in someone else's page" (T-181, T-182, T-183, T-184; all `done`, each with an owner-recorded Task-check waiver from session o044-run-20261028).

**Independence.** This session did not plan, build or coordinate any O-044 work; it started from the coordinator's request with the Next line "Record the Objective O-044 integration Check." It wrote only gate outputs (`coverage/`, `junit.xml`, package `dist/` folders, example builds), the official health snapshot, the browser run folder `docs/evidence/browser-20261028T105428Z/`, throwaway probes in its scratchpad, I-093 and this record.

**Baseline.** HEAD `938cbfc0` on `o044-good-guest`; diff `594e39e9..HEAD` (5 commits, 33 files). Not a worktree lane (`git-dir` = `git-common-dir` = `.git`). The tree held one uncommitted owner trial, `packages/astraeus/src/app/SkyView.ts` (+18/-1, Milky Way I-026), outside O-044; it was not read for review, not modified and not counted as O-044 work, but it was present while the gates ran (they pass with it). Untracked `docs/prds/` and `docs/research/` were not read or touched. Times UTC.

**Verdict: NEEDS WORK.** Every behaviour Success Condition (title, Escape, layers, Node tests, default time, phone panel) is proven by fresh gates and independent probes, and every gate passed. One documentation Issue blocks: the README and packaging notes still say the package cannot be loaded in plain Node, which O-044 made false (I-093, Low materiality, a three-line direct repair). Unmet: the Documentation Success Condition and T-184's Boundary "no claims beyond what the code does at this commit".

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
- [x] Re-check After Remediation (not applicable: first Check of O-044; no prior Checks, Issues or owner exceptions on this scope)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Requirements tested.** O-044 Success Conditions: SC-Title, SC-Escape (incl. stacking context), SC-Node, SC-Time, SC-Phone, SC-Documentation. Each Task's Done When (T-181 to T-184) and Boundaries. Guardrails named by the Tasks: ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-02, TEST-03, TEST-04, STYLE-*. Release gates: hand-off gates, `npm run test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, `measure:example`, `check:browser` once.
2. **Changed files and entry points.** The files in `reviewed.files` plus the `.savepoint` records. Public entry points: package root `astraeus` (conditions `types`, `node`, `import`), `mount`, `AstraeusScene`, `Scene.toDefinition()`, `astraeus/style.css`; the phone story sheet; `npm run check:node-consumer`.
3. **Relied-on runtime.** Node's ESM resolver and JSON import attributes; Vitest's externalised-dependency loading (Node conditions); Vite's client condition set (no `node`); React effect ordering for the title; DOM event `defaultPrevented` and capture order; CSS `isolation` and `touch-action`; the camera's canvas `wheel` handler (`attachOrbitGestures`, `CameraController.tsx:74`).
4. **Matrix axes** below; not-applicable cells carry a reason.
5. **Materiality boundary.** An Issue must violate a Success Condition, a Done When or Boundary, a Guardrail or a gate through a supported path (mount, AstraeusScene, the repository site, packed tarball consumers, the README as published). Webpack and Parcel builds are not run here (not installed in the checkout; T-182 asks only that Vite consumers keep working).

## Acceptance Invariants And Coverage Matrix

| # | Requirement (general rule) | Cells | Evidence | Result |
|---|---|---|---|---|
| SC-Title | Through `mount` and `AstraeusScene` the viewer never writes `document.title`; `App` rendered directly still does | mount; AstraeusScene; App direct; App `writeTitle=false`; bypass (any other writer) | `hostPageDom.test.ts` (6 tests) passes in the fresh gate: title stays "Host" through both routes, `App` alone writes "Made-up survey · Astraeus". Independent: `grep document.title packages/astraeus/src` finds only `App.tsx:180`, guarded by `writeTitle`; `mount.ts:40` and `AstraeusScene.tsx:56` pass `false`; site `main.tsx` renders `App` without the prop (default true) | Proven |
| SC-Escape | Every viewer document `keydown` handler leaves a `defaultPrevented` event alone; unprevented Escape behaves as before | story panel, phone drawer, switch panel; prevented / unprevented; bypass (another document keydown listener) | Fresh tests pass (prevented keeps each open, unprevented closes each). Independent grep: the only document `keydown` listeners in `src/` are the three changed handlers, each `!event.defaultPrevented && key === "Escape"` | Proven |
| SC-Layers | Mount element and AstraeusScene wrapper form their own stacking context so viewer `z-index` (0 to 9) cannot rise above the host | mount; AstraeusScene; caller `style` override; portal bypass | `mount.ts:36` sets `isolation: isolate`; wrapper style puts it before `...style` (caller may override, documented). z-index values in `src` CSS: 0 to 9 (grep). No `createPortal`; the only `document.body` write is the boot cover, used only when the host page has a `#boot` element (pre-existing, not a viewer layer) | Proven |
| SC-Node | A Vitest Node-environment consumer imports the packed `astraeus` and builds `toDefinition()` with no inline setting | packed tarball / Vitest node; plain Node (no Vitest); Vitest happy-dom; twin completeness; tarball contents; Vite still gets CSS | `npm run check:node-consumer` pass. Independent probes (scratchpad consumer from a fresh `npm pack` of `dist`): plain `node` import of `Scene, earth, sun, mount, AstraeusScene` loads and builds a definition; Vitest happy-dom resolves `astraeus` to `src/api/index.node.js` and builds a definition; an independent import-graph walker from `index.node.js` reaches 175 files with 0 `.css` imports and 0 missing targets, while from `index.js` it finds the 8 stylesheet imports (Vite path unchanged); the tarball holds all 7 `.node.js` twins; `measure:example` (Vite) emits `index-*.css` 44,769 B and first-open 1,589,214 / 454,404 B, equal to T-184's figure; `hello-react` and `hello-scene` from packed tarballs pass in `check:browser` | Proven |
| SC-Node (JSON) | Every JSON import in `src/` loads in plain Node ESM | six named files; named-import rewrite keeps the same data | `git diff` shows all six files with `with { type: "json" }`; named `{ rotation }` imports became `x.rotation` on the same record. Full suite (ephemeris and rotation tests) passes; plain-Node probe loads them | Proven |
| SC-Time | No `setTime`, no timeline window and no tracked span: opens at now, window now ±15 days; anything that sets a span or time opens as before | none; `setTime`; trajectory; activity window; `setTimeline({start,end})`; `setTimeline({none:true})` without/with `atUtc` | Fresh `publicApiStory.test.ts` cases pass. Independent probe on the packed package with a fake clock at 2031-03-01: sun+earth opens at that instant with a 30-day window; `setTime(2020-01-01)` opens there with the window centred on it; `setTimeline` 2020-01 opens at its start; `{none:true}` opens at now, paused. Reading `spanOf`: `now` is used only when `setTime`, `timeline.window` and the tracked/activity list are all absent; activities feed `tracked` (`scene.ts:488`) | Proven |
| SC-Phone | Phone: wheel or pinch over an open story sheet zooms the scene; desktop unchanged; owner judges the feel | wheel, unscrollable sheet; wheel, scrollable sheet; pinch spread/close; wide screen; target canvas; touch-action | Fresh `domStory.test.ts` "zoom through a phone sheet" (4) pass; pinch maths re-derived by hand (spread +20 px → -100, -30 px → +150). The sheet is itself the scroll container (`phone.css:153` `overflow-y: auto`), so the scroll test is the right one; the forwarded event lands on the scene canvas whose `wheel` listener zooms (`scenePointer.ts:30`, `CameraController.tsx:74`, no `isTrusted` check). `touch-action: pan-y` is the only CSS change. Owner look recorded in T-183 ("carry on", 2026-10-28T10:45:09Z) | Proven (feel by owner) |
| T-183 overlap | No collision at 375x667 or 1280x720 | layout diff | Only `touch-action` added; no element, size or position change; `check:browser` smoke covers every page desktop and phone, `meteor-shower` opens a story panel, all exit 0 | Proven |
| SC-Doc a | README covers install with four peers and why React (R1), `style.css` (R2), story panels (R6, G7), reduced motion (R10), embedding (E6, E10), `setReach` far plane (E7), lazy files and `vite:preloadError` (E11), first-download size (E8) | each item vs code | Each claim checked against source: `panelsCrossed` requires `time > previous` (`storyPanels.ts:144`); `pauseSeconds` 0 to 20, default 6 (`storyPanels.ts:125`); hold ends and restarts unless Play pressed (`useStoryPanels.ts:40-48`); `far: reach * 2.5` (`scene.ts:549`); `planetModels` and `DeveloperSettings` are `import()` (on-demand in `measure:example`); `PanelLoadBoundary` asks for a reload; reduced-motion rules cover the viewer's CSS animations and transitions; the size figure is reproduced byte for byte | Proven |
| SC-Doc b | CHANGELOG `Unreleased` lists title, Escape, layers, Node loading, default time, phone panel; RELEASING has a first-download step | text | Five entries present; RELEASING step 5 added, later steps renumbered | Proven |
| SC-Doc c / T-184 Boundary | The docs make no claim beyond what the code does at HEAD | contradictory older statements | **Issue I-093**: `README.md:19` still says "loading it straight in Node ... will not work"; `docs/NPM_PACKAGING.md:79` and `tools/build-packages.mjs:12` say plain Node loading fails. The plain-Node probe above loads the package | Issue |
| T-184 Design | Every deferred Drift Note accounted for | T-181 (3 notes + 1 non-architectural), T-182 (node condition), T-183 (default time, `useZoomThrough`) | Design.md Interfaces gained the host-page paragraph (writeTitle, Escape yield, isolation, default time, useZoomThrough); Current Technical State gained the `node` condition and JSON attributes; "mount does not restore isolation" stated non-architectural with reason and documented in README/CHANGELOG | Proven |
| Gates | All configured and owner final-check gates pass | below | All exit 0 | Proven |

**Other axes.** Input shape: malformed `pauseSeconds` and bad timeline inputs are pre-existing validation, unchanged and still tested. State: story sheet open → wheel/pinch → still open; pinch with one finger then two re-bases the spread (`touchstart` handler). Environment: Node, Vitest node and happy-dom, Vite production build, headless browser desktop and phone. Text classes, serialization round trips and colour/no-colour sinks: not applicable (no text width, parsing of user text or terminal output in scope).

### Finite External-Boundary Matrix

| Cell | Classification |
|---|---|
| Configured vs actual target | `check:node-consumer` and this Check's probe use the packed tarball, not a workspace link; resolution confirmed as `index.node.js` (Node) and `index.js` + CSS (Vite) — passed |
| Startup / discovery / reuse | `check:node-consumer` rebuilds and repacks each run; scratch dir from `mkdtemp` — passed |
| Unavailable dependency | A missing peer makes the Vitest run fail and the tool exits 1 with the command output (`run` throws) — passed by reading |
| Success / non-success | Pass prints `node consumer: pass`, failure `FAILED` and exit 1 — passed by reading |
| Redirect, timeout, cancellation | Not applicable: local files and subprocesses only; no network |
| Malformed response | Not applicable: inputs are the build's own files |
| Retry, cleanup, partial side effects | Scratch dir removed in all paths (`rmSync` after the try) — passed by reading |
| Secret-safe failure output | Not applicable: no secrets in scope |

### Workflow And Side-Effect Lock (`npm run build:packages` engine path, `writeNodeCopy`)

| Order | Operation | Side effect | Failure / final state | Oracle |
|---|---|---|---|---|
| 1 | tsc emit, `rewriteAssets`, `defaultJsonImports`, `addExtensions` | `dist/src/**.js` | throws, build fatal | `check:pack` pass |
| 2 | `writeNodeCopy`: find files importing `.css`, close over importers | none yet | — | independent graph walker |
| 3 | write `x.node.js` for each twin | 7 files | throws if `index.node.js` missing (fatal) | tarball listing (7) |
| 4 | manifest with `node` condition | `package.json` exports | `check:pack` fails an unpacked export target | `check:pack` pass |
| 5 | consumer import | — | — | plain Node, Vitest node, happy-dom probes |

### Matrix Completion Lock

Every cell above is passed, an Issue (SC-Doc c, I-093) or not applicable with a reason. After the Issue, all remaining cells were completed.

## Adversarial Pass

- **Can a bundler pick the Node twin and lose CSS?** Vite's client conditions exclude `node`; the fresh Vite build has the CSS. Webpack (target web) and Parcel (browser env) do not set `node` by their documented defaults; not run here (not installed), reasoned only. A Vite SSR or webpack target-node build would take the twin, which is intended for server code.
- **Is the twin set complete?** A graph walk with its own regex (static `from`, bare `import "x"`, `import()`) from `index.node.js` finds no stylesheet; lazy `DeveloperSettings` and `MoonFamilyPanel` are reached and have no CSS.
- **Can the default-time change leak into scenes that set a span?** Probed every span source (setTime, trajectory, activity, timeline window, `none`); only the no-span paths changed. Note: `setTimeline({ none: true })` with no `atUtc` now opens at now instead of 15 days back, which is the same "no time set" rule.
- **Can the zoom forwarding loop or swallow reading?** The canvas is not inside the sheet, so the forwarded wheel does not re-enter; a scrollable sheet keeps its wheel.
- **Escape bypass:** no other document `keydown` listener in `src/`.
- **Tests using the implementation's own calculation:** default-time tests use a fixed instant and literal day arithmetic; pinch expectations use literal deltas.

## Verify File Reality

Every file named in T-181 to T-184 evidence exists at HEAD (`hostPageDom.test.ts`, `useZoomThrough.ts`, `check-node-consumer.mjs`, the changed sources, README, CHANGELOG, RELEASING, Design.md). No phantom files.

## Gates And Commands (fresh, sequential, Node v24.16.0)

| Command | Time (UTC) | Result |
|---|---|---|
| `npm run lint` | 10:49:56 | exit 0, no findings |
| `npm run typecheck` | 10:49:59 | exit 0 |
| `npm run build` | 10:50:07 | exit 0 (the known 500 kB chunk warning) |
| `npm test` (junit) | 10:50:09 | exit 0; 142 files, 1,871 passed, 1 skipped |
| `npm run test:full` | 10:50:49 | exit 0; 142 files, 1,871 passed, 1 skipped; Statements 91.66% (9,683/10,563), Branches 86.03%, Functions 91.88%, Lines 94.28% |
| `savepoint health check O-044` | 10:52:54 | snapshot `sha256:9d03d630…8f44` (created); "Code Health does not block clearance" |
| `npm run check:engine-alone` | 10:51:56 | pass in 17.2 s (typecheck, lint, 84 files / 947 passed, 1 skipped) |
| `npm run check:pack` | 10:52:13 | pass (12.8 s); `astraeus` 7.03 MB packed, 8.85 MB unpacked, 444 files (limit 450) |
| `npm run check:node-consumer` | 10:52:26 | pass (1 test) |
| `npm run measure:example` | 10:52:28 | exit 0; first-open 1,589,214 raw / 454,404 gzip (JS 1,544,445, CSS 44,769); on-demand `planetModels`, `DeveloperSettings`, `MoonFamilyPanel` |
| `npm run check:browser` (once) | 10:54:28–10:56:19 | exit 0; 8 steps all exit 0, 0 error lines (smoke, smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-build-assets, public-addresses); evidence `docs/evidence/browser-20261028T105428Z/`; no screenshots |
| `git diff --check 594e39e9..HEAD` | 10:56 | clean |
| Probes (scratchpad, not committed): plain-Node import, Vitest node + happy-dom consumer, default-time on packed package, import-graph walker | 10:53–10:54 | all as stated in the matrix |

## Code Health Evidence

Official snapshot `sha256:9d03d630e17c7552972a224a3a301126e3310f02d262d97385ca1e80adfc8f44`, commit `938cbfc0` (dirty: the owner's SkyView.ts trial and untracked docs folders). Verdict: does not block clearance. All five instances fresh: tests 1,872 total, 0 errors, 1 skipped; coverage 91.67% statements; vulnerabilities 0 at every severity; duplication 0.88% (41 clones, 614 of 69,844 lines); complexity max CCN 20, 0 functions over 20 (the four at 20 or 19 are `driver.mjs`, `PathView.ts`, `horizons-client.mjs`, `jupiter-moon-catalogue.mjs`, none in O-044's diff). No Watch signal on O-044 code.

## Guardrails

| Rule | Result |
|---|---|
| ARCH-01 | Satisfied: no mission or dataset names added to core or shell; `useZoomThrough` is generic |
| ARCH-02 | Satisfied: zoom forwarding drives the camera only; default time changes the clock opening, not State |
| ARCH-03 | Satisfied: host-page tests use the synthetic definition; default time proven on a made-up Earth/Moon scene |
| TEST-01 | Satisfied: each behaviour has named tests (`hostPageDom`, `domStory` zoom-through, `publicApiStory` opening moment, `check:node-consumer`) |
| TEST-02 | Satisfied: each fix has a regression test or recorded failing scenario (T-182 records the `ERR_IMPORT_ATTRIBUTE_MISSING` and `.css` failures) |
| TEST-03 | Satisfied: T-183 names the unchanged setTime/trajectory tests |
| TEST-04 | Satisfied: each Task carries an owner `check_waiver` naming Task, reason, actor, time |

## Issues Pass

| Criterion | Classification |
|---|---|
| SC-Title, SC-Escape, SC-Layers, SC-Node, SC-Time, SC-Phone, SC-Doc a, SC-Doc b, T-184 Design | Proven |
| SC-Doc c (no claim beyond the code; Documentation outcome) | Issue I-093 |

### I-093 — README and packaging notes still say the package cannot load in plain Node

- **Violated:** O-044 Success Condition "Documentation"; T-184 Boundaries "no claims beyond what the code does at this commit"; T-182 Design References (`docs/NPM_PACKAGING.md` if the build output changes shape).
- **Scenario:** plain `node` script importing `astraeus` from the packed tarball and calling `toDefinition()`. Expected per `README.md:19`: fails. Actual: loads (resolves `src/api/index.node.js`).
- **Evidence:** `packages/astraeus/README.md:19`, `docs/NPM_PACKAGING.md:79`, `tools/build-packages.mjs:12`; contradicted by README "Loading in your build and in tests" and by `npm run check:node-consumer`.
- **Missing evidence:** T-184 checked the new text against the code but not older statements the Objective made false.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-093 | Medium: line 19 sits in the README's Install section, which every new user reads, and ships to npm at the next release | Low: a reader is told Node loading fails, then told later it works; the likely cost is confusion or an unneeded inline setting, the very thing O-044 set out to remove | Low | Fix now: direct repair under I-093 (three sentences), then a re-check |

## Owner Validation Still Needed

- T-183 declares `owner_validation.required: true`. The owner's look is recorded in its body ("carry on", 2026-10-28T10:45:09Z). Because this Check is `NEEDS WORK`, the structured acceptance is not recorded against C-118; it can be recorded against the re-check that clears (the phone-panel scope is unaffected by I-093).
- Objective closure, commit and merge are owner decisions.

## Observations (nonblocking)

- **O1 — `astraeus` pack is at 444 of 450 files.** The seven twins took it close to the `check:pack` limit; the next few engine files will need the limit re-measured (`docs/NPM_PACKAGING.md`).
- **O2 — T-183's owner look came before this Check's browser run.** Its Done When says owner validation is recorded "after the Objective's browser run"; no code changed between the look and the run, so the ordering does not change what the owner saw.
- **O3 — webpack and Parcel were not rebuilt here.** Their default conditions for browser targets exclude `node`, so they should keep the CSS build; the README's bundler list is from O-036 runs.
- **O4 — `setTimeline({ none: true })` without `atUtc` now opens at now, not 15 days back.** This follows the stated rule ("no setTime") and the CHANGELOG wording covers it implicitly; the owner may want it named.
- **O5 — `mount` leaves `isolation: isolate` on the host element after `unmount`.** Recorded by T-181 as non-architectural and documented in README and CHANGELOG.
- **O6 — README "Loading in your build" names `planetModels` and the Developer panels as lazy files; `MoonFamilyPanel` is a third on-demand file.** The `vite:preloadError` advice covers it equally.

## Code Style Review

- [x] STYLE-01 **One job per file** — `useZoomThrough.ts` holds only the forwarding; `check-node-consumer.mjs` only the consumer check.
- [x] STYLE-02 **One job per function** — `writeNodeCopy`, `spanOf`, `forward`, `spreadOf` are small and single-purpose.
- [x] STYLE-03 **Test branches** — phone/wide, scrollable/not, pinch in/out, prevented/unprevented, each mount route.
- [x] STYLE-04 **Types document intent** — `writeTitle?: boolean` on `App`; typed `RefObject<HTMLElement | null>`.
- [x] STYLE-05 **Build only what is needed** — no public option added; twins only for files that reach a stylesheet.
- [x] STYLE-06 **Handle errors at boundaries** — `writeNodeCopy` throws if the Node entry is missing; consumer check exits 1 with output.
- [ ] STYLE-07 **One source of truth** — three older statements about Node loading disagree with the new one (I-093).
- [x] STYLE-08 **Comments explain why** — `mount.ts:35`, `spanOf`, `phone.css:162` comments give the reason.
- [x] STYLE-09 **Content lives in data** — no new copy in logic.
- [x] STYLE-10 **Small diffs** — source changes are a few lines each; most added lines are tests and docs.
