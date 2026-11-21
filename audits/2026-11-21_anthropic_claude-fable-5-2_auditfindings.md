# Astraeus — Independent End-to-End Engineering Audit

## Report metadata

| Item | Value |
|---|---|
| Audit date | 2026-11-21 (Australia/Sydney) |
| Provider / model | Anthropic / `claude-fable-5-2` |
| Repository | https://github.com/anipatke/Astraeus (local checkout `/home/user/code/Astraeus`) |
| Branch / commit | `main` / `55295278cac768f80ab8fb5bc82a6887b7cf775b` ("Release 0.9.5") |
| Package version | `astraeus` 0.9.5 (eight data packages also 0.9.5; workspace root 0.1.0) |
| Working tree | Clean except pre-existing untracked `docs/research/` and this `audits/` directory |
| Node / npm | v24.16.0 / 12.2.1 |
| OS / hardware | Linux 6.18 (WSL2), x86_64, 16 logical cores, about 7 GB RAM |
| Tools used | git (read-only), the project's own npm gates run in an isolated clone, Vitest 5.0.3 (two probe tests in the clone only), a scratch TypeScript-AST metrics script (function size, cyclomatic complexity, import graph, cycles), junit timing analysis, `npm audit` |
| Scope | Whole repository at the commit above, except `audits/` (excluded from discovery; only file names were listed to avoid overwriting) |
| Method | Lead auditor plus seven delegated read-only reviews (science core, public API, rendering, shell/demos/site, engine tests, guardrail/site/demo tests, browser checks). Key claims from the delegated reviews were spot-checked against code by the lead; items not re-verified are marked "reviewer-reported". |

### Environmental limitations (read these before relying on numbers)

1. **Another auditor ran concurrently on the same machine** (its own test and coverage runs in `/tmp/astraeus-audit-sandbox`). Two of my three timing passes were contaminated (load average up to 33). Only the third pass (load about 1 at start, rising to about 8–10 by the later gates) is reported as the baseline. Treat every duration as ±15%.
2. **The browser suite was not re-run.** The project's policy is one browser job at a time and no repeat runs, another auditor was active, and five recorded runs from the audit day already exist at effectively this commit. Browser durations are taken from `docs/evidence/browser-*/summary.txt`, not re-measured.
3. **No rendering performance was measured in a browser.** All per-frame cost statements are from reading the code path; none is a profile.
4. **Mutation testing was not executed.** Mutation sensitivity in section I is reasoned from the test source, except the two behaviours I probed directly (Kepler solver, out-of-range dates).
5. **Two planned reviews did not complete** because of a usage limit: the mining of `.savepoint` Issues/Checks for defect-discovery history, and a dedicated packaging/security review. Section I.4 therefore relies on the browser reviewer's reading of the run folders and Issue records, and section K is a lighter lead-only pass. Both are flagged where they apply.
6. Gates ran in a fresh clone, which lacks git-ignored local data (`data/local`, `.horizons-cache`). All 4,627 tests still passed (2 skipped), so nothing material depended on it.

---

## A. Executive verdict

Astraeus is a **fundamentally sound engine with a strong scientific core and a disciplined public front door, wrapped in a presentation layer and a verification system that have both grown faster than they have been pruned.** It needs **targeted improvements, not restructuring and certainly not a rewrite.**

- **Is the architecture sound?** Yes at the bottom, partly at the top. `core` and `assets` obey the layer rule with zero outward imports (measured). Above them, `api`, `app`, `shell` and `shelf` form one mutually dependent cluster (measured import matrix, section C), and nothing mechanised constrains it.
- **Is it unnecessarily complex?** In places. The numerical code is essential complexity and is well done. The accidental complexity is concentrated in three spots: a 617-line `App` component that mirrors every setting twice, a shell-to-app interface of 46 props with serial-numbered request props, and a public-scene → internal-definition → handle → link forwarding chain that makes each new host capability a 5–7 file change.
- **How maintainable?** Adequate for its author, hard for anyone else. No formatter; 10–20% of source lines exceed 120 characters and some exceed 1,000; the design document is 106 KB of dense history-laden prose; the root README still says packaging is "Later".
- **How extensible?** Strong for the two things it was built on (recorded trajectories and orbit populations). Weak for a custom non-catalogue body, a ground observer, and runtime show/hide. The catalogue is closed to consumers.
- **Suitable for external developers?** For trajectory and solar-system stories, yes, and the error design is unusually good. But there is no chrome-less viewer, no custom textured body, and several documented statements are false.
- **Largest technical risks:** (1) a confirmed numerical defect in one Kepler solver; (2) the real 3D scene component and the GPU shaders never execute under the unit tests, and the browser checks read CPU-side readouts rather than pixels; (3) verification cost and brittleness growing faster than product behaviour; (4) single-author knowledge.
- **Are the tests worth their cost?** The scientific, lifecycle, isolation and API-contract tests clearly are. A meaningful minority (text pins, tests of the test machinery, giant snapshots, duplicated builds) cost more than they protect.
- **Is browser verification unnecessarily expensive?** Yes, moderately. It takes about 400 s, not the documented 230 s; about 190 s of that is two scenarios; roughly a quarter can be recovered without losing any browser-unique assertion.

### The three ultimate questions

1. **Architecture.** New experiences of the existing kinds will stay easy: the three demos' scene-building code is short and uses only the public entry. New *kinds* of experience currently require engine changes, and each new host capability widens `App`, the shell props and the forwarding layers. Unless the state that lives in React (selection, story playback, camera fallback, mirrored controls) is moved into a plain store, every addition will make the top of the engine harder to change.
2. **Complexity.** My estimate is that roughly two thirds is essential or justified (ephemerides, time scales, floating origin, GPU propagation, validation at the API boundary). About one third is accidental: duplicated solvers, two scene models, mirrored state, three forwarding layers, compatibility scaffolding, and diagnostics computed every frame for tests.
3. **Verification.** Most testing time goes to checks that matter, but the system has become disproportionately expensive at the margin: packages are built up to three times per full gate, the browser check has grown eightfold in a month, and around a fifth of test files assert on repository text rather than behaviour.

---

## B. Engineering scorecard

Expert assessment, not an objective measurement.

| Dimension | Score | Confidence | Explanation |
|---|---:|---|---|
| Code quality and readability | 3.5 | Medium-high | Strict TypeScript, zero `any` in engine source, unit-suffixed names, excellent error messages. Pulled down by no formatter, very long lines, and a few very large components. |
| Complexity management | 3 | High | No function over cyclomatic 20, but the metric is blind to 617-line components and 1,000-character lines. Four in-core Kepler solvers. |
| Maintainability | 3 | Medium-high | Changes in `core` are local; changes to host capabilities fan out across 5–7 files and several pinned tests. |
| Extensibility | 3 | Medium-high | Two of four consumer scenarios are well served; two need engine work. |
| Architectural integrity | 3.5 | High | Clean scientific core and public front door; undirected upper layers. |
| Scientific correctness | 4 | High | Independently verified to kilometres; one confirmed solver defect and loose Earth/Moon test tolerances. |
| Test effectiveness and execution efficiency | 3 | Medium-high | Strong oracles where it matters; real scene and shaders untested; duplicated and self-referential cost. |
| Rendering and performance | 3.5 | Medium (unmeasured) | Floating origin and GPU epoch handling are well designed; several unconditional per-frame costs. |
| Public API and developer experience | 3.5 | Medium-high | Coherent, typed, well-errored; closed catalogue, mandatory shell, some false docs. |
| Documentation and sustainability | 2.5 | High | Detailed but stale, fragmented and history-laden. |

**Weighted overall: 3.3 / 5** (15/15/15/15/10/10/10/5/3/2 weights as specified): workable and in places strong, with material improvement needed in the presentation layer and the verification system.

---

## C. Architecture assessment

### C.1 Inventory (verified, not from documentation)

Thirteen workspaces, not the five the root README states:

| Package | Role | Source size (tracked, excluding data) |
|---|---|---|
| `astraeus` | Engine: `src/core` (64 files, 6.5k lines), `src/assets` (21, 1.2k), `src/api` (66, 6.7k), `src/app` (79, 11.2k), `src/shell` (53, 5.0k), `src/shelf` (18, 1.0k), `src/synthetic` (7, 0.9k) | about 32.7k lines source; 32.8k lines of tests in 212 files |
| `astraeus-data`, `astraeus-data-{jupiter,saturn,uranus,neptune,mars,pluto}` | Pictures and fitted moon-position chunks (18-line loaders) | data |
| `astraeus-data-constellations` | 88 IAU constellations plus a finder | 0.3k |
| `astraeus-demo-{apollo11,showers,planets}` | Private demos | 0.2k / 0.9k / 0.9k source |
| `astraeus-site` | Pages, demo list, generators, browser checks | 1.4k source, 5.1k tools |

One runtime dependency (`@lizard-isana/orb` 3.1.1), four peers (React 19, React DOM, React Three Fiber 9, three ≥0.169).

### C.2 Dependency map (measured with a TypeScript-AST import walk)

Rows import columns; value imports / type-only imports.

| from \ to | core | assets | api | app | shell | shelf |
|---|---|---|---|---|---|---|
| core | – | 0 | 0 | 0 | 0 | 0 |
| assets | 18/4 | – | 0 | 0 | 0 | 0 |
| api | 65/46 | 12/8 | – | 15/35 | 0/10 | 10/6 |
| app | 34/74 | 21/23 | 0/5 | – | 24/18 | 0 |
| shell | 6/18 | 0 | 0/3 | 5/5 | – | 0 |
| shelf | 1/0 | 0 | 4/1 | 1/18 | 1/0 | – |

- **ARCH-04 holds.** `core` imports no other layer and no Three.js; `assets` imports only `core`.
- **Above that there is no direction.** `api ↔ app`, `app ↔ shell`, `api ↔ shelf` all run both ways. Counting type-only edges there is one strongly connected component of 27 files (`api/viewer*` plus `shelf/*`), one of 16 (`api/plan*` plus `scene.ts`), one of 11 in `core`, and several smaller ones. Only two are value-level cycles, both tiny (`shelf/readoutTile` and `shelf/chart` factory ↔ view).
- **Fan-out hubs:** `app/App.tsx` 54, `api/scene.ts` 52, `shell/AstraeusShell.tsx` 41. **Fan-in hubs:** `core/body.ts` 71, `core/provenance.ts` 51, `api/errors.ts` 42, `app/experienceDefinition.ts` 32.
- **Demos and site:** zero deep engine imports in any demo or site `src` (verified by grep). Demo *tests* deep-import heavily (Apollo 113, showers 65), so engine-internal renames break other packages' tests.

### C.3 Strengths to preserve

- Scientific state is independent of presentation (ARCH-02): one frame (EQJ), kilometres, frozen `Float64Array`, integer-millisecond UTC, enforced at construction (`core/state.ts:42-98`).
- One public front door honoured by every in-repo consumer, with internals behind `WeakMap`s.
- One handle object shared by `mount` and the React component, with one test suite run against both.
- Per-viewer isolation at the host-visible level, with a completeness-guarded two-viewer test.

### C.4 Weaknesses

- **The viewer cannot be drawn without the built-in shell, and core behaviour lives inside it.** Selection, story-panel playback and camera fallback are React state in `shell/AstraeusShell.tsx` (its own header says it "holds the selection and camera-preset logic still kept here"). `MountOptions` offers no chrome switch. "Headless" in the design notes means Node reads, not a chrome-less viewer.
- **Two scene models.** The public `Scene` is converted by `assembleScene` into the older internal `ExperienceDefinition` (about 35 fields). This is a defensible validate-then-freeze boundary, but the definition has other producers (`src/synthetic/*Definition.ts`), and host calls then pass through `viewerHandleOf` (38 one-line forwards) → `ViewerLink` (about 45) → a `Viewer*` part → `ViewerControl`.
- **`src/core` carries about 880 lines of presentation vocabulary** (story-panel and start-view parsers, CSS colour checks, UI copy, palette limits, pacing) and does `fetch`/`setTimeout` in `bodies/moonSystem.ts`. The letter of ARCH-01/02 holds; the "scientific core" label does not quite.
- **Test and demo scaffolding ships inside engine `src/`** (`src/synthetic`, 849 lines, imported by no engine source; reviewer-reported that it is compiled into the tarball), and one helper (`src/experiences/settingsFields.ts`) has no importer.
- **Layer enforcement is weaker than it looks.** The only in-engine layer test uses a blacklist that omits `api`, `shelf` and `types` (`tests/layerRule.test.ts:3`, verified), so `core` importing `api` would pass.

### C.5 Required verdict

Astraeus has a **coherent, reusable engine architecture in its lower half and its public contract**, and **an increasingly interconnected collection of features in its presentation half**. Preserve the core, the state model, the front door and the handle. Strengthen the layer rule. Simplify the App/shell state ownership. Reconsider the closed catalogue.

---

## D. Code quality and complexity findings

### D.1 Quantitative picture (measured)

| Subsystem | Files | Lines | Functions | Mean CC | Max CC | CC>10 | Longest function | `any` | `as` casts | Non-null `!` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `src/core` | 64 | 6,535 | 447 | 2.8 | 17 | 12 | 174 | 0 | 34 | 36 |
| `src/api` | 66 | 6,788 | 888 | 2.6 | 20 | 41 | 116 | 0 | 50 | 111 |
| `src/app` | 79 | 11,220 | 1,129 | 2.4 | 18 | 24 | **617** (`App`) | 0 | 81 | 64 |
| `src/shell` | 53 | 5,048 | 625 | 2.4 | 16 | 14 | **350** (`AstraeusShell`) | 0 | 11 | 9 |
| `src/shelf` | 18 | 1,043 | 126 | 2.1 | 12 | 1 | 43 | 0 | 54 | 2 |
| Browser tooling | 26 | 5,058 | 1,150 | 1.8 | 20 | 15 | 89 | n/a | n/a | n/a |
| Engine tests | 222 | 32,806 | 7,792 | 1.2 | 17 | 6 | 870 | 20 | 922 | 1,402 |

- **The complexity guideline of 20 is enforced and met** (`eslint.config.js`; no function over 20, two exactly at 20). **It does not meaningfully identify difficult code here.** The hardest units are a 617-line component with 18 branches of its own, and functions that pack 1,000+ characters into six lines (`api/planBodies.ts:179 #rememberCard`: 6 lines, 1,188 characters, CC 18).
- **Lint is one rule.** No recommended rule set, `react-hooks/exhaustive-deps` off, unused-disable reporting off. There is no formatter. 9.5–20% of lines exceed 120 characters per subsystem; maxima are 1,016 characters (`app/App.tsx:593`) and 915 (`api/index.ts:2`).
- **Type safety is strong:** `strict`, zero `any` in engine source, no `@ts-ignore`. Units are carried by naming only (`Km`, `KmS`, `Deg`, `Rad`, `UtcMs`, `TdbS`), never by type.

### D.2 Ranked findings

**CQ-1 (P1, confirmed defect) — a Kepler solver returns garbage for e ≥ about 0.995.**
`packages/astraeus/src/core/keplerAnomaly.ts:2-11` runs 50 fixed Newton steps with no convergence test and a start value that overshoots near perihelion. My probe over 20,000 mean anomalies per eccentricity: 0 wrong at e = 0.99; 7 at 0.995; 95 at 0.997; 48 at 0.999; 101 at 0.9999, with returned eccentric anomalies in the thousands of radians or worse. The science reviewer reproduced it independently on a finer grid (true-anomaly errors up to 177°). `addBodyFromElements` accepts any e < 1 (`core/elementsBody.ts:115`) and calls this solver (`:248`), so a long-period comet such as Hale–Bopp (e ≈ 0.995) can be drawn on the wrong side of its orbit near perihelion, silently, with an accuracy badge. The only direct test is at e = 0.3. *Action:* delete the file and route its three callers to the convergent `eccentricAnomalyRad` (`core/listedOrbitGroup.ts:146`); add one table test over e ∈ {0, 0.5, 0.9, 0.99, 0.999, 0.9999} against bisection. Effort S, risk low.

**CQ-2 (P2, confirmed weakness) — four Kepler solvers in core, seven in the repository.** `keplerAnomaly.ts:2`, `keplerElements.ts:116`, `sunCentredSources.ts:113`, `listedOrbitGroup.ts:146` (the last two near-identical), plus orb's universal-variable propagator, the GLSL solver with its Float32 twin, and the Apollo tool's propagator. CQ-1 is the direct consequence. Only the GLSL copy is justified.

**CQ-3 (P2, demonstrated maintainability concern) — `App.tsx` is a God component.** One function, lines 275–891; fan-out 54; reviewer-counted 42 `useState`, 38 `useCallback`, 21 `useMemo`; every setting held twice (a mutable controls object and a mirror state) and kept in step by hand; about 200 lines of developer-drawer JSX inline; a 100 ms interval that re-renders App and the shell ten times a second whether or not anything changed.

**CQ-4 (P2, demonstrated maintainability concern) — shell wiring.** `AstraeusShell` takes 46 props, five of them `{…, serial}` request objects applied by effects keyed on the serial; 5 of its 9 effects disable the exhaustive-deps lint; one writes a ref during render; one comment relies on effect order ("runs after the view-switch effect above in the same commit, so it wins"). A host `setOpen` call crosses api → app → shell → app through five reconciling refs, and the code records that an earlier version was wrong.

**CQ-5 (P2, confirmed defect, error contract) — raw errors escape the public API.**
(a) Verified by probe: `scene.stateOf(planet, t)` for any of the eight non-Earth planets outside 1950–2045 throws `TimeScaleOutOfRangeError` (a `RangeError`, no `code`), although the method's doc comment says ready-made bodies "answer at any date" and guardrail API-05 says every throw from the API is a `SceneError`. At mount the same condition is correctly reported as `out-of-span`.
(b) Reviewer-reported, code-cited: the exported `parseElementsBodyRecord` throws an unexported `ElementsBodyError` although the README says it throws `bad-element`; the API-05 scan only reads `throw` statements in files directly under `src/api`, so re-exports escape it.
(c) Reviewer-reported: `addTrajectory(null)` and a non-array `samples` reach raw `TypeError`s.

**CQ-6 (P2, confirmed defect, diagnostics) — `AstraeusScene` swallows errors when `onError` is absent** (`api/AstraeusScene.tsx:89,113,116`, verified: `latest.current.onError?.(…)`). A scene with a missing data package renders an empty element and logs nothing, where `mount` throws.

**CQ-7 (P2, confirmed weakness) — zone-less time text is read as local time.** `core/timeInput.ts:6` passes strings straight to `Date.parse`. `setTime("2026-08-12T21:00:00")` therefore means a different instant per visitor, in an API whose every read is UTC.

**CQ-8 (P2, potential defect, reviewer-reported with a core-level probe) — moon orbit lines can throw in the first year of coverage.** `ChebyshevEphemeris.loadedFromUtcMs` returns a raw chunk start (1949-12-31T21:00 TDB) that lies before the time-scale table's start; its sibling `boundsOf` clamps, this path does not; the only caller (`app/OrbitSetView.ts:350`) has no catch; the one test stubs the method. Needs a browser confirmation.

**CQ-9 (P2, confirmed weakness) — units and frames are protected by naming only.** Milliseconds, seconds, days, km and AU are all `number`; the science reviewer lists five call sites where dropping a `/ 1000` compiles. `AU_KM` and the J2000 epoch are each defined three times. The Horizons tests at 1 km would catch a slip on shipped bodies but not on host-supplied data.

**CQ-10 (P3, honesty by convention) — validity metadata is decorative and in places wrong.** `accuracy.validUtc` is read by no runtime code; the Moon's stated validity (2022–2025) excludes the Apollo demo's 1969; about a dozen moons are labelled "tidal-lock" while the code uses an IAU rotation model (`core/bodies/moonSystem.ts:161,310,320`), and a test asserts the wrong label.

**CQ-11 (P3) — smaller items.** Text used as React keys; an unused duplicate percent helper; three near-identical rate-unit tables; two plain-object predicates and three copies of the hex-colour regex; `setLook` replaces while `setGroupLook` merges; `distance` means Earth radii without saying so; 30 casts over `unknown` in `src/shelf`.

### D.3 Error handling

Strong overall. 153 `SceneError` throw sites and no plain throws in `src/api`; 35 documented codes; messages name the call, the id, the bad value and the fix; `ready` never hangs; listener throws are isolated; a failed build leaves the scene editable. The exceptions are CQ-5 and CQ-6, plus no root error boundary: a render-time throw in the shell or a host part unmounts the whole viewer with no callback.

### D.4 AI-assisted development patterns (judged on merit)

Present and material: local repairs accreting into structure (the serial-request props), duplicate abstractions from different phases (solvers, scene models, name-check tests with different word lists), tests preserving incidental detail (exact source lines, message text, element-index baselines), temporary mechanisms made permanent (0.7.0 migration fixture, 0.8.0 rename table at 0.9.5), and documentation proliferation. Absent, to the project's credit: over-general registries, speculative plugin frameworks, and defensive code in the numerical core.

### D.5 Classification of significant complexity

| Complexity | Class |
|---|---|
| UTC→TT→TDB conversion, Chebyshev ephemerides, IAU rotation, floating origin, log depth | Essential domain |
| GPU Kepler propagation with Float64 epoch rebasing; sliced CPU fills | Justified implementation |
| Input validation and frozen copies at the public boundary | Justified implementation |
| Mirrored controls/state in `App`; serial request props; 100 ms re-render | Accidental |
| Handle → link → part → port forwarding; two scene models | Partly justified, partly unnecessary abstraction |
| Four in-core Kepler solvers; km→AU→km and ecliptic↔EQJ round trip for planets | Historical debt |
| Rename table, 0.7.0 migration fixture, `src/synthetic` in engine source | Historical debt |

### D.6 Strongest simplification opportunities

| # | Current state (files) | Why complex / justified? | Simpler alternative | Benefit | Effort | Regression risk | Equivalence tests |
|---|---|---|---|---|---|---|---|
| S1 | Four core Kepler solvers (`keplerAnomaly.ts`, `keplerElements.ts:116`, `sunCentredSources.ts:113`, `listedOrbitGroup.ts:146`) | Not justified | One exported `eccentricAnomalyRad` | Fixes CQ-1; one place to test | S | Low | Table test vs bisection; existing Horizons and group tests |
| S2 | Mirrored state in `App.tsx` | Not justified | One external store read with `useSyncExternalStore` (already used for two values) | Removes the hand-sync class of bug; stops 10 Hz re-render | L | Medium | `lifecycle`, `twoViewers`, `viewerHostDom`; browser journeys |
| S3 | Selection, story playback, camera fallback inside the shell | Not justified | Move to plain modules in `app/`; shell becomes a presenter | Enables a chrome-less viewer; removes serial props | L | Medium | Same as S2 plus story-panel DOM tests |
| S4 | Developer drawer inline in `App.tsx:670-825` | Not justified | Own component | About 200 lines out of the hot file | S | Low | `appScreenDom`, `developerToolsOption` |
| S5 | Per-frame test readouts (`sceneFrame.ts:291-292`, `sceneDebug.ts`) | Partly (browser checks need them) | Compute only when an opt-in flag is set by the browser scripts | Removes steady CPU and garbage in production | M | Low | Browser check unchanged with flag on |
| S6 | Package build inside `npm test` (`astraeus-site/tests/packagePacks.test.ts`) | Not justified | Keep pure-function cases in unit run; real build only in `check:pack` | Unit tests stop writing into `dist/`; less duplicated work | S | Low | `check:pack` itself |
| S7 | About 225 unreachable exports in `validate/driver.mjs` (reviewer-reported) | Not justified | Delete with one baseline rebuild | About 680 lines gone | S | Low | Browser run |
| S8 | Nine name-check tests with different word lists | Not justified | One check, names derived from the catalogue | Fewer false failures | S | Low | Planted-violation case |
| S9 | Planet data stored in "orb's ecliptic" AU with string keywords, converted back (`planetModels.ts:35`, `astronomyAdapter.ts:80-92`) | Historical | Store EQJ km at next data regeneration | Removes a frame trap | M | Medium | Horizons fits at 1 km |
| S10 | `src/synthetic` and orphan helper in engine `src/` | Not justified | Move to test fixtures; delete the duplicate journey scene | Smaller tarball, clearer boundary | S | Low | Existing tests after path change |

---

## E. Maintainability assessment

### E.1 Hotspots

| Hotspot | Cause | Likely consequence | Response | Risk of change |
|---|---|---|---|---|
| `app/App.tsx` | 617-line function, mirrored state | Every new control touches it; stale-closure bugs | S2, S4 | Medium |
| `shell/AstraeusShell.tsx` + `app/useShelf.ts` | Effect-order and serial reconciliation | Subtle regressions on any panel change | S3 | Medium |
| `app/PathView.ts`, `PointsView.ts`, `OrbitSetView.ts` | 560–640 lines each, several modes, diagnostics mixed in, near-duplicate projection loops | Hard to change one path rule safely | Extract shared projection; add `dispose` | Medium |
| `site/tools/validate/driver.mjs` (2,134 lines) | Half dead, pinned by an assertion baseline | Slow repairs after UI changes | S7 | Low |
| `tests/fixtures/scenePin.json` (837 KB, one `it`) | Self-generated snapshot | Unreviewable diffs; regenerated by `-u` | Split per case; drop message text | Low |
| Docs (`.savepoint/Design.md` 106 KB, engine README 115 KB) | Current state mixed with history | Onboarding by archaeology | Section L of roadmap | Low |

Knowledge held only by the original developer: the single-definition invariant that makes missing `dispose` methods safe; the effect ordering in the shell; why each allowlist entry exists; and the browser driver's choreography.

### E.2 Change-impact exercises

| Change | Modules touched | Boundaries crossed | Public API change | Tests to change | Coupling exposed | Difficulty |
|---|---|---|---|---|---|---|
| 1. Body with an alternative ephemeris provider | For a path: none (`addTrajectory({ provider, bounds })`). For a textured catalogue body: `core/bodies`, `assets/catalogue`, `api/bodies` | core → assets → api | Yes for a body; no for a path | Catalogue, name-check, API lock, `scenePin` | Closed catalogue | Low (path) / High (body) |
| 2. New scaling policy | `core/scalePolicy.ts`, `api` scale exports, shell scale control | core → api → shell | Yes (one export) | Scale tests, lock, computed-look baseline if the menu changes | Scale policy living in `core` | Low-medium |
| 3. New camera mode | `api/planCamera`, `api/cameraRequest`, `viewerCamera`, `app/CameraController`, `sceneFraming`, shell presets, handle, link, port | api ↔ app ↔ shell | Yes | `sceneCamera`, `hostCameraDom`, `viewerLinkPin`, lock, README check, browser driver | Forwarding layers; camera fallback in shell | High |
| 4. Timeline behaviour | `core/clock`/`pacing`, `shell/timelineModel`, `TimelineBar`, `App` interval | core → shell → app | Possibly | Pacing, timeline, lifecycle | Clock stepped from a React interval as well as the frame loop | Medium |
| 5. Replace part of rendering | One `*View.ts` class | None if the class contract holds | No | That view's tests; text-scan tests (`logDepth`, `dotMaterial`) may fail for non-behavioural reasons | Per-frame readouts written by views | Medium |
| 6. New data format | Host code only, or a new data package | None | No | None in engine | None; this boundary is clean | Low |

Ordinary data and trajectory changes stay local. Anything that adds a host-visible capability propagates predictably but widely.

---

## F. Extensibility assessment

Capabilities marked VERIFIED were read in code by the API reviewer and spot-checked; HYPOTHETICAL means not built.

| Scenario | Existing public capability | Missing | Internal change needed | Complexity | Suitability |
|---|---|---|---|---|---|
| **A. Asteroid belt (100k)** | VERIFIED: `addGroup` with per-orbit mean anomaly; GPU Kepler path above 1,024 members; a 110,000-member core test; a 10,000-member public-API scene in the site; shelf `chart` for the semi-major-axis histogram; `filterChips`, `colourKey` | Group members cannot be picked; no runtime show/hide (a frozen scene, so N toggles need 2^N views or a remount); one colour per group; `addBodySet` (selectable) does not scale | A visibility primitive; member picking (HYPOTHETICAL) | Medium | Good for display, weak for selection and filtering |
| **B. Voyager journey** | VERIFIED: `addTrajectory` with samples in ecliptic or EQJ, `lineFixedTo` per stretch or `"auto"`, provenance spans, anchors, events, pacing, `onEventZone` + `setCamera`; a worked 1977-to-170-AU synthetic scene | One `center` per path, so vectors published about successive planets must be re-based by the host | None | Low-medium | Strong; this is the engine's home ground |
| **C. Ground observer** | VERIFIED: `camera.lookOut` from a body's centre, stars to magnitude 6.5, sky figures, ecliptic/equator switches | Observer latitude/longitude, Earth rotation to a local frame, horizon, alt/az, zenith-up, topocentric parallax | Observer frame in core, horizon layer, `up: "zenith"` | High | Poor today |
| **D. Fictional system** | VERIFIED: `addBodyFromElements` (marker on two-body motion about the real Sun), `addTrajectory` with a provider, full storytelling | A custom root star; custom textured spheres; custom GM/parent hierarchy. The internal `extendCatalogue` and visual overrides exist but are not public | A public `addCustomBody` mapping to the existing internals | High | Poor; the catalogue is closed |

**Over-engineering check.** The engine is not too generic; if anything it is shaped by its own apps. Several surface areas have no in-repo consumer beyond the catalogue page or one demo (`setMoonPanel`, `setPicker`, the eight shelf factories), which the design notes attribute to the owner's external apps (not inspected). The highest-leverage additions are small and general: a visibility primitive and a public custom body.

**Developer journey.** Install needs four peers even for plain JavaScript; a scene is about 20 lines; errors are excellent; the scene freezes at mount; extension is settings and DOM only (no custom 3D layer, no per-frame hook). Friction points: CQ-5 to CQ-7, replace-versus-merge setters, hex-only colours in some inputs and any CSS colour in others, and README statements contradicted by code (`mount` isolation restore; panel sizes "follow the browser window"; three switches documented where seven exist; a stale first-download figure).

---

## G. Scientific correctness assessment

### G.1 Independent verification performed by the lead

Engine values obtained through the public API (`Scene.stateOf` after `scene.load()`), compared with reference values I supplied from outside the repository:

| Check | Engine | Reference | Difference |
|---|---|---|---|
| Earth about the Sun at JD 2451545.0 TDB, rotated by me to ecliptic J2000 | (−0.17713507, 0.96724168, −0.00000410) AU | JPL Horizons (−0.17713510, 0.96724169, −0.00000409) AU | **4.2 km** |
| Moon about Earth at the same instant, EQJ | (−291608.04, −266712.70, −76097.94) km | JPL DE405 (−291608.38, −266716.83, −76102.49) km | **6.2 km** |
| Same, if UTC were wrongly treated as TT | | | 58.7 km (so the check is sensitive to the time scale, and the engine has it right) |
| Moon distance, 1992-04-12 0h TD (Meeus Ex. 47.a) | 368,409.7004 km | 368,409.7 km | 0.4 m (same lunar series; confirms the 1992 UTC→TT offset) |
| Earth–Sun distance, 1992-10-13 0h TD (Meeus Ex. 25.b) | 0.99760854 AU | 0.99760775 AU | 118 km |
| Venus heliocentric distance, 1992-12-20 0h TD (Meeus Ex. 33.a) | 0.72460167 AU | 0.724603 AU | 199 km (reference rounded to 6 figures) |

Units, frame, axis conventions and time scales are therefore independently confirmed for Earth, Moon and Venus. The reference vectors were recalled from published sources rather than fetched; the Earth value agrees with the repository's own archived Horizons responses in form and magnitude.

### G.2 Verified guarantees (science reviewer, tests read not run)

- Planets within 1 km of archived JPL Horizons DE441 vectors over 1972–2044; fitted moons within metres; IAU rotation against NAIF kernel lines and Horizons sub-observer longitudes; lunar libration to 0.01°. The fixtures are raw Horizons API responses committed beside the parsed data.
- Time: JavaScript milliseconds are treated as UTC and converted through a leap-second table to TT and then TDB (`core/timeScale.ts`), tested against Horizons to 1e-5 s.
- The core refuses to extrapolate: out-of-coverage, missing-chunk and not-loaded each have a named error.

### G.3 Numerical risks and limitations

- **CQ-1** (Kepler solver) is the one confirmed correctness defect.
- **Three TT−UTC models coexist** (reviewer-probed): the project's own table for fitted bodies; orb's for Earth; and for the Moon a ΔT polynomial that is off by about 4.7 s in 2024 (about 5 km along track) and steps at month boundaries by 0.05–0.09 km. Invisible at scene scale, but the Moon's position is discontinuous.
- **Earth and Moon accuracy tests are too loose** (2 arcminutes, 100 km; `tests/core.test.ts:106-107`): a 69 s time-scale slip would pass them. My probe above shows the real error is about 6 km, so the tolerance could be tightened twentyfold.
- **Coverage is 1950–2045 for planets**; Earth and Moon answer for any year (I obtained values for 1600 and 3000) with no warning.
- No hyperbolic or parabolic orbits (rejected at input: a stated limit).
- The Apollo reconstruction and its documents were not reviewed in depth.

### G.4 Scientific honesty

The observed/modelled/illustrative distinction is real and enforced where it is structural: a closed, runtime-validated source-type enum, and orbit groups that downgrade to "illustrative" when phase is a drawing choice. It is free text elsewhere, and CQ-10 shows that text drifting from the code. The badge shown for an elements body does not reflect that its position can be wrong (CQ-1).

---

## H. Rendering and performance assessment

Nothing here was profiled. "In code path" means the work can be seen to run every frame; magnitudes are unmeasured.

### H.1 Sound design (keep)

- **Floating origin:** positions stay Float64 through scale policy and axis conversion, with one subtraction before narrowing; the origin is rebased onto the camera target. Geometry near the focus keeps sub-metre precision at 51 AU.
- **Depth:** logarithmic buffer plus fitted near and far planes.
- **GPU Kepler:** mean anomaly is advanced and wrapped in Float64 on the CPU; only a small time offset reaches the shader; three uniforms per frame.
- **Staged frame:** `sceneFrame.ts` is readable and node-testable; views are plain classes; the frame never calls `setState`.

### H.2 Suspected bottlenecks and defects (rendering reviewer; items marked ✓ spot-checked by the lead)

| ID | Finding | Evidence | Status |
|---|---|---|---|
| R-1 | Label layout forces a style write then a layout read up to three times per label per frame, paused or not | `app/SceneLabels.ts:157-169` | In code path |
| R-2 ✓ | Test-only readouts are computed and written to the DOM every frame in production, including `JSON.stringify` of every path | `app/sceneFrame.ts:291-292` | In code path |
| R-3 | Each orbit-line path re-evaluates about 129 ephemeris states and allocates about ten arrays per frame, with no unchanged-time early-out | `app/PathView.ts:224-232` | In code path |
| R-4 ✓ | `addUpdateRange` is called every frame for balance-point sets but ranges are cleared only on upload, so an undrawn or hidden view accumulates objects without bound | `app/OrbitSetView.ts:422-425` | Confirmed mechanism; rate unmeasured |
| R-5 ✓ | Each viewer monkey-patches the global `DefaultLoadingManager` and restores a snapshot on unmount, so unmounting the first of two viewers removes the second's wake hook | `app/sceneContentsHooks.ts:146-157` | Confirmed logic; not exercised |
| R-6 ✓ | The log-depth guard test only matches `new ShaderMaterial(`; `AtmosphereGlow.tsx:46` uses JSX `<shaderMaterial>` and carries no log-depth chunks | `tests/logDepth.test.ts:31` | Guard blind spot confirmed; visual effect unverified |
| R-7 | `PathView`, `PointsView`/`KeplerPoints` and `TrackedBodyView` have no `dispose`; masked because every scene change remounts and the canvas unmount drops the context | `app/sceneHooks.ts:58-70` | Latent |
| R-8 | Shared textures are released page-wide when any one viewer unmounts; a failed star-file fetch is cached for the page lifetime | `app/sceneContentsHooks.ts:135`, `assets/sky.ts:162-173` | Potential risk |
| R-9 | The shader's step counts are stated to hold "for every eccentricity up to 0.99" while core accepts e < 1, with no clamp or fallback | `app/keplerShader.ts:7-8` | Potential risk |
| R-10 | One full render pass per lit body (cap 30) | `app/LayeredRender.tsx:20-29` | Documented trade-off |
| R-11 | Picking ignores depth and skips non-catalogue objects | `app/scenePicking.ts:37-51,177-178` | Confirmed limitation |

### H.3 Workloads

| Workload | Assessment | Basis |
|---|---|---|
| Earth–Moon, Apollo 11 | Light; dominated by labels and readouts | Code reading |
| Planetary system with moons | R-3 scales with the number of orbit lines (about 1,000 ephemeris evaluations a frame for nine planets) | Code reading |
| Meteor stream, 25k–51k | GPU path; per-frame cost is uniforms; a full CPU fill once per seven simulated days | Code reading; a unit test builds 110,000 orbits in about 1.9 s |
| Large synthetic belt | Should scale past 100k for display | Design; unmeasured |
| Multiple viewers | Host-visible state isolated (tested); R-5 and R-8 are GPU-side gaps | Code reading |
| Rapid seeking | Handled: paths resample, points refill, epoch rebases | Code reading |
| Repeated mount/unmount | Relies on context loss rather than explicit disposal (R-7) | Code reading |
| Background tab | No visibility handling; the wall-clock-anchored clock jumps on return | Code reading |

No reduction in visual fidelity is recommended. R-1 to R-4 are pure waste removal.

---

## I. Test effectiveness and cost assessment

### I.1 Inventory

289 test files and 4,629 cases across the workspace (4,627 passed, 2 skipped in my run). Engine: 212 files. Classification of the engine files by the test reviewer (one primary category each, ±10 files at the boundaries):

| Category | Engine files | Cases | Notes |
|---|---:|---:|---|
| 1 Pure unit | 32 | 269 | |
| 2 Scientific / numerical | 26 | 275 | Independent oracles are the norm |
| 3 Component (happy-dom) | 24 | 226 | Shell only |
| 4 Integration (frame stages, real Three objects) | 27 | 316 | |
| 5 Public API contract | 84 | 890 | Includes lifecycle and two-viewer suites |
| 6 Package-consumer | 1 | 5 | The `cold` Vitest project |
| 7 Build / packaging / data files | 7 | 29 | Plus `site/packagePacks` |
| 10 Performance | 0 | 1 opt-in | No timing bound in the default run |
| 11 Source/doc-text guardrail | 11 | 64 | Plus about 15 files with an embedded text scan |

Across the whole repository about 54 of 289 files (19%) read repository text to assert on it; 41 are wholly structural or tooling tests (14 engine, 27 site). Browser smoke and journeys (categories 8 and 9) are 13 steps with 364 assertion sites.

### I.2 Test execution cost table (deliverable A)

Clean third pass, isolated clone, one run each. CPU = user+sys.

| Check | Measured wall (CPU) | Limit | Main cost driver | Unique value | Recommendation |
|---|---:|---:|---|---|---|
| Lint | 5.1 s (9 s) | 15 | ESLint start-up for one rule | Complexity cap only | Keep; consider adding a formatter and a small rule set rather than more text-scan tests |
| Typecheck | 7.0 s (13 s) | 20 | Native TypeScript 7 | High | Keep; run first |
| Build | 3.1 s (7 s) | 15 | Vite/Rolldown | Site bundles | Keep |
| Unit tests (`npm test`) | 54.7 s (446 s) | 65 | 16 workers; `packagePacks` 46.6 s and Apollo reconstruction 38.2 s of file time | High | Keep; move the real package build out (S6) |
| Full tests and coverage | 77.6 s (687 s) | 105 | Same tests again plus V8 coverage | Coverage number only | Do not run both `test` and `test:full` in one gate pass |
| Engine-alone | 27.4 s (247 s) | 40 | Re-runs the engine's tests, lint and typecheck in a copy | Proves the engine has no outside reach | Keep at Objective level |
| Package check | 16.8 s (28 s) | 30 | Build and `npm pack --dry-run` of nine packages | Published contents and sizes | Keep; it is the one place this should run |
| Node consumer | 7.0 s | 15 | Packed build under Node | Real Node import | Keep |
| React consumer | 9.0 s | 25 | `npm install` from the registry | Peer resolution, server render | Keep; release tier |
| Browser checks | **406 s** (newest recorded run; not re-measured) | 320 | Software-rendered Chromium; two scenarios | The only execution of the real scene | Split and trim (I.3) |

Observations:
- **Where test time goes:** the ten slowest files are about 60% of summed test time; 196 of 289 files take under 0.2 s. Vitest reports tests 58%, transform 16%, import 14%, setup 7%, environment 5%.
- **Duplicated work in one full gate pass:** every package is built and packed three times (inside `test`, inside `test:full`, in `check:pack`); the whole suite runs twice (`test`, `test:full`); the engine's tests run a third time in `check:engine-alone`; the hello-scene example is built inside `npm test` and again for the browser check.
- **No caching or change-based selection** is used at gate level.
- **Load sensitivity (observed):** with a second suite running on the machine, 14 tests failed in one pass, 13 on the local 5 s timeout and one on a 120 s timeout. With lighter contention a single cold-project test timed out. CI already uses 30 s. The suite is not flaky in isolation, but its pass/fail depends on what else the machine is doing.
- **Unit tests mutate real build output:** `packagePacks.test.ts` writes planted files into `packages/*/dist` and restores them in `finally`; its own comment records that two files building in parallel clashed.

### I.3 Browser test value matrix (deliverable B)

Durations are the three newest green runs (`20261121T080311Z` / `T070246Z` / `T045825Z`). Based on the browser reviewer's reading of every script; totals and trends verified by the lead.

| Scenario | Duration (s) | Important behaviour protected | Unique to browser? | Overlap | Recommendation |
|---|---|---|---|---|---|
| smoke | 136 / 135 / 126 | 20 loads with no console or page error, shell mounts, something in view; plus a made-up "journey" scene with about 30 assertions | Loads, WebGL mount, data fetch: yes. The journey is mostly projection and state logic | Journey facts are unit-tested | **SPLIT**: keep the plain loads (about 57 s); make the journey (about 80 s) its own release-tier step |
| smoke-public-showers | 18 / 13 / 18 | The shipped stream copy loads and draws on the public build | Yes; only step that opens the built public site | Third and fourth load of the same showers | **SIMPLIFY** to one size |
| planets-phone | 8 / 12 / 9 | Phone bar switch, focus, place card | Partly (touch, sheet layout) | Three DOM tests | **KEEP** |
| meteor-shower | 22 / 19 / 19 | Idle and wake of the real frame loop; seek; story panel | Yes | Logic covered in unit tests | **KEEP**; replace two arbitrary sleeps |
| views | 22 / 26 / 27 | View switch, host `setView`, stay/follow camera rules, fit | Only fit and the camera moving | Heavy overlap with four DOM tests | **SIMPLIFY**; move the filter and clock assertions to Vitest |
| look-out | **110 / 109 / 108** | Sky view, figure taps, story steps, trace modes × two figures, field of view | Canvas taps, wheel, overlap | Five DOM tests cover statuses and enablement | **SIMPLIFY + SPLIT**: read the camera from the handle rather than the developer drawer; trim the trace matrix |
| catalogue | 10 / 5 / – | Component page entries, one viewer at a time | Fit and 24 real mounts | `shelfCatalogue` | **KEEP** |
| hello-scene | 17 / 20 / 20 | The packed tarball runs in a bundler and browser | Yes | Built but never run elsewhere | **KEEP**; remove about 7 s of sleeps |
| hello-react | 5 / 5 / 4 | Same through the React component | Yes | Server render only elsewhere | **KEEP** |
| hello-planets | 10 / 6 / 6 | Host controls drive the viewer | Yes | `viewerHostDom` | **KEEP**; could share a launch |
| hello-sky | 21 / 24 / 24 | Packed constellations package; three story steps | Yes for the package; steps repeat look-out | look-out | **KEEP**; phone pass optional |
| public-build-assets | 2 | Licences, no made-up scenes, load and engine budgets on the real build | **No browser** | Checkers are unit-tested on made-up builds | **MOVE** to a build gate |
| public-addresses | 0 | No retired link in built HTML | No browser | None | **MOVE** with the above |

Why it is slow (reviewer analysis, not profiled):
- 11 Chromium launches and 43 page loads, strictly sequential, software-rendered (SwiftShader).
- Setup (one public build, four example builds with `npm install`, six servers) is 21–25 s.
- Fixed sleeps total about 55 s, of which about 25 s is arbitrary and removable. **Sleeps are not the main cost.**
- `look-out` jumped from about 60–70 s to about 110 s between two runs on 21 November; the reviewer attributes this to a driver repair that opens and closes drawers for every camera reading (inferred from the step change and the code, not profiled).
- **No assertion reads pixels.** Every "drawn" check reads `data-*` readouts computed on the CPU. This follows the owner's no-screenshot decision and gives deterministic checks, but it means software rasterisation is paid for and never inspected. A recorded depth-buffer defect on real hardware (I-117) was invisible to the suite.

### I.4 Demonstrated defect detection (deliverable C)

Evidence is thinner than planned (limitation 5). From the browser run folders and the Issue records they cite:

- **Caught by a browser step (real product defects):** I-185 (phone sheet cap lost; a layout defect only a browser shows), T-217 "defect 2" (story marker missing on the packed build), I-108 (labels non-deterministic before first layout).
- **Caught by the browser gate's file checks (no browser needed):** I-081, I-136, I-142, I-164 and five budget overruns. `public-build-assets` is the most frequent failing step (9 of 14 failed runs) and leaves no evidence file when it fails.
- **False alarms and check-side defects:** I-123 (fixed sleep raced a load), I-165 (driver locator timeout, cause "not reproduced"), I-184 (driver not migrated), I-188 (journey written without ever being run), a wrong-element read, and one environmental network error. Roughly three product catches against six check-side failures among the browser steps.
- **Escaped all gates:** I-117 (above); and, found by this audit while every gate was green: the Kepler solver defect, the raw out-of-range error, swallowed React errors, and the moon-label mismatch that a test asserts as correct.
- **Insufficient evidence:** I could not establish which unit tests have caught regressions before release, or the true flake rate (no two runs exist on one commit). I credit no unit test with a historical catch.

### I.5 Assertion quality and mutation sensitivity

Strong: archived Horizons vectors, USNO phase tables and published star coordinates as oracles; solvers written independently inside tests; completeness guards that fail when a handle member or setter is added without a test row; one case list run over both embedding paths.

Weak or brittle (test reviewers, code-cited):
- **The real `AstraeusScene` component is replaced by a stub in 25 test files, and no test calls `onBeforeCompile`,** so both patched shaders never execute under Vitest. A Three.js chunk rename inside the peer range `three >=0.169 <1` would turn the shader injection into a silent no-op and fail nothing.
- **The GLSL Kepler solver is tied to its CPU twin by a few string checks, in a demo package.** Most single-line GLSL edits would pass every test.
- **Disposal is almost unasserted** (two real observations in the whole suite; elsewhere "does not throw").
- **`scenePin`**: one test, an 837 KB self-generated snapshot with 202 error messages pinned verbatim; diffs of hundreds of lines per data change.
- **Assertions weaker than their titles:** "frames the body and faces its parent" checks only that a distance is positive; one-sided bounds that a ×1000 slip passes.
- **Text and count pins:** exact source lines, exact README sentences, `toBe(13)` packages, `129` deep imports, a design token value, error-message sentences (contrary to the project's own rule that errors are recognised by code).

Reasoned mutation sensitivity (not executed unless stated):

| Defect | Caught? | By |
|---|---|---|
| Wrong axis or sign, science → render | Yes | `sceneTransforms`, `sky` |
| AU for km in a shipped provider | Yes | Horizons fits at 1 km |
| Catalogued body missing from a scene | Yes at definition level | `publicApi`, `scenePin` |
| Broken seeking | Points and clock yes; bodies through the real scene no | `pointsKepler`, `core` |
| Resource not disposed | **No**, for most views | – |
| Wrong selection | Rule and pointer yes; end to end partly | `scenePicking` |
| Provenance missing | Yes at definition level | `publicApiPaths` |
| Public export removed | Yes | API surface lock |
| Stream draws zero objects | Partly; nothing asserts vertex counts | – |
| State leaking between viewers | Host-visible yes; GPU-side no | `twoViewers` |
| GLSL solver diverges from CPU | **Mostly no** | – |
| 69 s time-scale slip | Planets and moons yes; Earth/Moon only by exact pins | Horizons fits; `scenePin` |
| Kepler solver wrong at high e (**executed**) | **No**: the suite is green with the defect present | – |
| Raw error for out-of-range planet date (**executed**) | **No** | – |

### I.6 Redundancy (deliverable D)

- Package build and pack: three times per full gate.
- `test` then `test:full`: the same 4,629 cases twice.
- Nine name-check tests with different word lists.
- `views` and `look-out` browser steps repeat state logic already covered by DOM tests.
- The default showers view is loaded as often as a named shower.
- Two advisory limit tables kept equal by a test that sleeps.

### I.7 Testing maintenance hotspots (deliverable E)

- `validate/driver.mjs`: 408 exports in 2,134 lines; about 225 unreachable, some pinned by the assertion baseline so they cannot be deleted without an approved baseline change.
- `browserAssertions.test.ts`: pins the guard text of every browser assertion as of one commit; renaming a local variable in a script fails it.
- `scenePin.json` and `computed-look.baseline.json` (keys by element index, so adding one element shifts every later key).
- `migrationTable.test.ts`: anchored at 0.7.0 while the package is at 0.9.5.
- "Allowlists only shrink" is mechanised for five JSON files and one counter, relative to `main`; work is committed directly on `main`, so the check only sees uncommitted growth.
- Eleven site test files (about 18% of site cases) test the verification machinery itself.

### I.8 Answer

**Are Astraeus's automated tests providing enough confidence and defect detection to justify their cost?** Largely yes for the scientific core, the public contract, lifecycle and isolation, where the tests are among the best parts of the project. Not fully for the presentation layer, where the most expensive check (the browser suite) verifies CPU readouts rather than what is drawn, and the cheapest checks never run the real scene or shaders. And a visible minority of tests protect the verification system or freeze text, at a cost that grows with every change.

---

## J. Recommended testing strategy

Policy note: the current policy already says browser checks run once per Full Objective Check and not per Task. The changes below that alter policy are marked **(policy change)**.

| Stage | Run | Est. wall |
|---|---|---:|
| **Individual change** | `typecheck`, then the affected test files (`vitest run <paths>` or `--changed`) | 10–20 s |
| **Task completion** | `lint`, `typecheck`, `build`, `npm test` (with the real package build moved out, S6) | about 60–70 s today; about 55–60 s after S6 (estimated) |
| **Task that edits a browser script** | The single affected step run directly **(policy change: allow a one-step run)** | 10–110 s |
| **Objective integration** | `lint`, `typecheck`, `build`, `test:full` only (not `test` as well), `check:engine-alone`, `check:pack`, `check:node-consumer`; **browser smoke tier** (plain loads, planets-phone, catalogue) **(policy change)** | about 145 s + about 50 s |
| **Pull request** (there is no CI on push or PR today; the only workflow is the release) | Same as Task completion, in CI, so results do not depend on the author's machine | about 70 s |
| **Release** | Everything above plus `check:react-consumer` and the **full browser tier**; also add the browser check or at least the example steps to the release workflow, which currently publishes without running any browser step | about 155 s + about 300 s |

### Estimated time savings (deliverable G)

| Item | Current | Recommended | Basis |
|---|---:|---:|---|
| Skip `test` when `test:full` runs | 54.7 s | 0 | **Measured** |
| Non-browser gates, full pass | 207.6 s | about 153 s | **Measured** (sum minus the above) |
| Browser, release tier | 406 s | 290–310 s | **Estimated** from per-step times and counted sleeps; assumes the look-out camera read is the cause of its 40 s growth |
| Browser, Objective tier | 406 s | 45–55 s | **Estimated**; plain loads measured at about 45–57 s |
| Parallel example steps | – | a further 40–50 s | **Speculative**; conflicts with the one-browser rule and 7 GB of RAM |
| Full gate at an Objective | about 614 s | about 200 s | Measured + estimated |
| Full gate at a release | about 614 s | about 455 s | Measured + estimated |

### Coverage trade-offs (deliverable H)

| Optimisation | Retained | Reduced | Lost |
|---|---|---|---|
| Run `test:full` instead of both | All assertions | – | Nothing |
| Real package build only in `check:pack` | Pack contents and size checks at Objective and release | A size regression is seen at the Objective, not the Task | Nothing at release |
| Browser smoke tier at Objectives | Every page loads without error; phone layout; component page | Camera, sky and packed-example journeys run at release rather than per Objective | A journey regression can sit undetected until release. Mitigate by running the full tier for any Objective that touches camera, sky or packaging |
| Trim `views` and `look-out` | Fit, reachability, real input | Repeated state checks | Nothing if the state assertions move to Vitest first |
| File checks moved to a build gate | The checks themselves | – | Nothing; they also gain an evidence file |
| Retire the assertion-text baseline | Review of script diffs | A tripwire against silently deleting a browser assertion | That tripwire |

Two additions cost little and close the largest gaps: one test per patched material that calls `onBeforeCompile` against Three's real shader source and asserts the replacements landed, and one table test that listens for `dispose` on everything each view owns.

---

## K. Packaging, security and release assessment

Lighter than planned (limitation 5); lead-verified unless marked.

- **Published surface.** The workspace manifest exposes `./app/*`, `./core/*`, `./shell/*`, `./tests/*`; the published manifest is rewritten from an `x-publish` block to `.`, `./style.css` and `./package.json` (reviewer-reported from `tools/build-packages.mjs`). The gap between testing source and shipping `dist` is closed by `check:pack`, the Node and React consumer checks, and the four browser example steps. This is a good arrangement.
- **Sizes (measured by `check:pack`):** engine 7.24 MB packed; data packages 0.07–53.5 MB (Saturn has 6,460 files). All within their limits.
- **Peer ranges.** `three >=0.169.0 <1` is wide for a library that changes shader chunks between minors, and the engine patches shader chunks by string replacement with no test that the patch applied (section I.5). This is the most plausible way a consumer gets a silently broken view.
- **Release workflow** (`.github/workflows/publish.yml`): triggered by a GitHub release or manually; npm trusted publishing over OIDC with no stored token (good); runs lint, typecheck, build, `npm test`, engine-alone, pack and React consumer before publishing. It does **not** run any browser step, and there is **no CI on push or pull request**, so day-to-day verification depends on one machine.
- **Toolchain.** TypeScript 7 for checking and building, with a TypeScript 6 alias injected into ESLint through a require hook and eight `overrides`. Workable but fragile; an upgrade risk.
- **Dependencies.** `npm audit`: 9 moderate, 0 high, 0 critical (not triaged; not established whether any is in a shipped path, though the engine has a single runtime dependency).
- **Runtime security** (shell reviewer, grep-verified): no `innerHTML`, `dangerouslySetInnerHTML`, `eval` or `new Function` in any package source; story and panel text render as text; the one rendered link is restricted to `http(s)` with `rel="noopener noreferrer"`; address parameters are matched against built lists and reach no `fetch`, `href` or DOM sink. **No exploitable issue found.** No secrets were seen in the repository or workflow.
- **Reliability.** No root error boundary; WebGL context restoration relies on Three's own handler and is untested; a failed star-file fetch is cached for the page lifetime (R-8).
- **Licences.** Not reviewed in depth. The engine package bundles a CC BY-SA star file alongside MIT code; the README states the separation, but the notice inside the tarball was not inspected.

---

## L. Prioritised findings register

| ID | Sev | Area | Finding | Evidence | Recommendation | Effort | Confidence | Class |
|---|---|---|---|---|---|---|---|---|
| F-01 | P1 | Science | Kepler solver wrong for e ≥ about 0.995 | `core/keplerAnomaly.ts:2-11`; probe | Use the convergent solver; table test | S | High | Confirmed defect |
| F-02 | P1 | Tests | Real scene component and shaders never execute in unit tests; browser checks read CPU readouts | 25 stubbing test files; no `onBeforeCompile` call | Shader-injection test per material; consider one GPU read-back | S–M | High (facts), medium (consequence) | Potential risk |
| F-03 | P2 | API | Raw non-`SceneError` errors escape (`stateOf` out of range; `parseElementsBodyRecord`; malformed input) | `api/scene.ts:602-611`; probe | Give planet trajectories bounds; wrap re-exports; extend the scan | S | High | Confirmed defect |
| F-04 | P2 | API | React component swallows errors without `onError` | `api/AstraeusScene.tsx:89,113,116` | Report to the page by default | S | High | Confirmed defect |
| F-05 | P2 | API | Zone-less time strings parsed as local time | `core/timeInput.ts:6` | Reject date-times without `Z` or offset | S | High | Confirmed weakness |
| F-06 | P2 | Architecture | Shell is mandatory and owns selection, story playback and camera fallback | `shell/AstraeusShell.tsx:320,373-407` | Move state out of React (S3) | L | High | Confirmed weakness |
| F-07 | P2 | Complexity | `App.tsx` God component with mirrored state and 10 Hz re-render | `app/App.tsx:275-891` | S2, S4 | L | High | Maintainability |
| F-08 | P2 | Rendering | Unconditional per-frame work: label layout, test readouts, orbit-line re-evaluation | `SceneLabels.ts:157-169`, `sceneFrame.ts:291-292`, `PathView.ts:224-232` | Early-outs; opt-in readouts | M | High (path), unmeasured (cost) | Confirmed weakness |
| F-09 | P2 | Rendering | Unbounded `updateRanges` growth when undrawn | `OrbitSetView.ts:422-425` | Track one dirty range; skip hidden views | S | High | Confirmed defect |
| F-10 | P2 | Tests | Browser check is about 400 s, over its own limit on every recent run; docs say 230 s and "under a minute" | `docs/evidence/browser-20261121T080311Z/summary.txt` | Split and trim (I.3); fix docs | M | High | Process drift |
| F-11 | P2 | Tests | Duplicated gate work: packages built three times, suite run twice | `packagePacks.test.ts:14-19`; timing | S6; one of `test`/`test:full` | S | High | Maintainability |
| F-12 | P2 | Tests | Brittle pins and self-testing machinery | `scenePin.json`, `browserAssertions.test.ts`, `migrationTable.test.ts` | Retire or narrow (I.7) | M | Medium-high | Maintainability |
| F-13 | P2 | Architecture | Core layer test is a blacklist missing `api`/`shelf`; upper layers undirected | `tests/layerRule.test.ts:3` | Whitelist; one small upper-layer rule | S | High | Confirmed defect (guard) |
| F-14 | P2 | Science | Units and frames by naming only; duplicated constants | Science review F8 | One constants file; brand two time types | S–M | High | Confirmed weakness |
| F-15 | P2 | Science | Possible throw for moon orbit lines in 1950 | `chebyshevEphemeris.ts:266-286` | Clamp as `boundsOf` does; add a test | S | Medium | Potential risk |
| F-16 | P2 | Extensibility | No runtime visibility control; closed catalogue | `api/sceneFreeze.ts`, `api/planBodies.ts:190` | `setShown`; public custom body | M | High | Confirmed weakness |
| F-17 | P2 | Docs | Root README and several engine README statements are false or stale; design doc mixes history with current state | README "five npm workspaces", "Later: Package the engine" | Rewrite the short docs; split history out | M | High | Technical debt |
| F-18 | P2 | Release | No CI on push/PR; release publishes without any browser step | `.github/workflows/publish.yml` | Add a small CI job; add example steps to release | S | High | Potential risk |
| F-19 | P3 | Rendering | Global loading-manager patch; shared textures released page-wide; missing `dispose`; log-depth guard blind spot | H.2 R-5 to R-8 | Fix individually | S each | Medium-high | Mixed |
| F-20 | P3 | Science | Three TT−UTC models; loose Earth/Moon tolerances; decorative validity metadata; wrong orientation labels | G.3, CQ-10 | Tighten tolerances; derive labels | S–M | High | Mixed |
| F-21 | P3 | Quality | No formatter; lint is one rule; very long lines | D.1 | Adopt a formatter in one mechanical commit | S | High | Optional improvement |
| F-22 | P3 | Tests | Suite is load-sensitive on the 5 s local timeout | Timing passes 1–2 | Use the CI timeout locally for heavy data tests | S | High | Potential risk |

---

## M. Improvement roadmap

### Immediate — Stabilise

| Action | Effort | Risk | Benefit | Depends on | Verification |
|---|---|---|---|---|---|
| Fix the Kepler solver (F-01, S1) | S | Low | Removes the one confirmed wrong-position defect | – | Table test vs bisection; Horizons fits unchanged |
| Close the error-contract holes (F-03, F-04, F-05) | S | Low | Consumers can rely on `SceneError` | – | One test per case, by code |
| Shader-injection and disposal tests (F-02) | S | Low | Covers the largest untested area cheaply | – | The new tests themselves |
| Fix `updateRanges` growth and the 1950 clamp (F-09, F-15) | S | Low | Removes a leak and a possible frame-loop throw | – | Unit tests; one browser look at Pluto and a 1950 scene |
| Correct the README, gate limits and browser docs (F-10, F-17 short docs) | S | Low | Stops documented numbers misleading agents and readers | – | Read-through |
| Whitelist the core layer test (F-13) | S | Low | The stated guardrail becomes real | – | Planted violation |

### Next — Simplify

| Action | Effort | Risk | Benefit | Depends on | Verification |
|---|---|---|---|---|---|
| Stop building packages inside `npm test`; run one of `test`/`test:full` (F-11) | S | Low | About 55 s measured per full gate; unit tests stop writing to `dist` | – | `check:pack` |
| Split the browser suite into smoke and release tiers; fix the look-out camera read; remove arbitrary sleeps; move the file checks out (F-10) | M | Medium | Objective check about 50 s; release about 300 s (estimated) | Owner decision on policy | One full run before and after |
| Delete dead driver exports; retire or narrow the text pins (F-12) | M | Low | Cheaper UI changes | Owner-approved baseline rebuild | Browser run |
| Opt-in per-frame readouts and early-outs (F-08) | M | Low | Less idle CPU and garbage | Browser scripts set the flag | Browser trace before and after |
| Extract the developer drawer; adopt a formatter (S4, F-21) | S | Low | Smaller hot file; reviewable diffs | – | Existing DOM tests |
| Move `src/synthetic` out of engine source; merge the name checks (S10, S8) | S | Low | Clearer boundary | – | Existing tests |

### Later — Strengthen

| Action | Effort | Risk | Benefit | Depends on | Verification |
|---|---|---|---|---|---|
| Move selection, story playback and camera fallback out of the shell; single state store in `App` (F-06, F-07) | L | Medium | Chrome-less viewer; fewer forwarding hops | Simplify horizon | `lifecycle`, `twoViewers`, full browser tier |
| `handle.setShown` and a public custom body (F-16) | M | Medium | Unlocks scenarios A and D | – | New contract tests with made-up data (ARCH-03) |
| Observer frame and horizon (scenario C) | L | Medium | New class of app | Only when a consumer needs it | Independent alt/az references |
| A small CI job on push/PR; example steps in the release workflow (F-18) | S | Low | Verification no longer depends on one machine | – | A red run on a planted failure |
| Brand `UtcMs`/`TdbSeconds`; one constants file; store planets as EQJ km at the next regeneration (F-14, S9) | M | Medium | Removes unit and frame traps | Data regeneration | Horizons fits at 1 km |
| Split `Design.md` into current state and history | M | Low | Onboarding without archaeology | – | A newcomer read-through |

---

## N. What not to change

**Implementations and architectural choices**
- The scientific state model: one frame, kilometres, frozen Float64, integer-millisecond UTC, refuse-rather-than-extrapolate.
- `core/timeScale.ts` and the Chebyshev ephemeris stack.
- The floating origin, logarithmic depth and the Float64-epoch GPU Kepler design.
- The single public entry, the `x-publish` manifest rewrite, and the one handle shared by `mount` and React.
- `SceneError` codes and the quality of the messages.
- The staged frame in `sceneFrame.ts` and views as plain classes.
- CSS scoping to the viewer root, the token file, container-based layout and reduced-motion handling.
- The pure panel reducer and bar-fit rule.
- OIDC trusted publishing with no stored token.
- Demos restricted to the public API.

**Tests and verification whose cost is justified**
- All tests against archived JPL Horizons, USNO and catalogue references, including the slow shipped-data ones (`showersMeasured`, `keplerShader` numeric cases, the constellation whole-sky grid, the Apollo reconstruction regeneration).
- `lifecycle.test.ts` and `twoViewers.test.ts` with their completeness guards.
- The compiler-based API surface lock and API rule lints, each proved on a planted failure.
- `check:engine-alone`, `check:pack` and the Node and React consumer checks.
- The four browser example steps: they are the only proof that the published package runs in a bundler and a browser.
- The phone-size browser passes: two recent real defects were phone-only.
- Readouts in place of screenshots, as a mechanism; the limitation should simply be documented.

---

## O. Five uncomfortable questions

1. **If the unit tests never run the real scene and the browser tests never look at a pixel, what actually verifies that Astraeus draws the right thing?** Today the honest answer is the owner's eyes on the preview. Is that an accepted design decision, written down, or an accident of two separate policies?
2. **The browser check grew from about 50 s to about 400 s in a month and has warned on every recent run, yet 0.9.5 shipped in that state. What is a limit for, if exceeding it changes nothing?**
3. **Roughly one test file in five asserts on text, and eleven test files test the test machinery. Were these written to protect users, or to stop agents weakening earlier checks?** If the latter, is there a cheaper control than permanent tests?
4. **Could an independent developer build a fictional solar system, or a view from their back garden, without changing the engine?** Today they cannot. Is Astraeus an engine for astronomical experiences, or an engine for the experiences its author has built so far?
5. **A confirmed wrong-position defect sat behind an accuracy badge while 4,627 tests passed. Which other parts of the engine are covered only by tests that compare the code with itself?** The science review names the orbit-group and solver tests; the same question applies to anything a snapshot is the only guard for.

---

## Coverage matrix

| Subsystem | Depth | Method | Executed | Confidence |
|---|---|---|---|---|
| `src/core` | Deep (all but two file middles) | Delegated read; lead read of time, state, body, solver; two lead probes | Probes in clone | High |
| `src/api` | Deep on structure, partial on planners | Delegated read; lead spot-checks | Probes via `stateOf` | Medium-high |
| `src/app`, `src/assets` | Deep on frame, views, hooks; several files unread | Delegated read; lead spot-checks of five claims | None | Medium |
| `src/shell`, `src/shelf` | Deep on structure; several components unread | Delegated read | None | Medium |
| Demos, site | Structure and sinks | Delegated read; lead import counts | None | Medium-high |
| Engine tests | 27 files deep-read of 212; rest classified by header | Delegated read; lead junit analysis | Full suite, three times | Medium |
| Guardrail, site and demo tests | Cited files read | Delegated read; lead check of two | Full suite | Medium-high |
| Browser checks | All scripts read; 97 run summaries analysed | Delegated read; lead totals and trend | **Not run** | Medium-high on cost, medium on causes |
| Gates | All nine timed | Lead | Three passes | High (third pass) |
| Packaging, release, security | Workflow, manifests, audit | Lead, light | `check:pack`, consumers, `npm audit` | Medium-low |
| Defect history | Run folders and cited Issues only | Partial | – | Low |
| Apollo reconstruction; licences; real-GPU rendering; performance | Not verified | – | – | Unverified |

## Completion statement

Every major subsystem is assessed or marked unverified above. No source, test, configuration, existing documentation or Savepoint record was modified; verification ran in an isolated clone outside the repository, and the two probe tests existed only there. This file is the only intended change. Nothing was committed or pushed.
