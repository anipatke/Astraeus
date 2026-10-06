---
id: C-001
scope: {kind: objective, id: O-001}
result: CLEAR
checked_by: {role: checker, session: check-o001-2026-10-06}
executed_session: o001-executor-sessions-unrecorded
checked_at: '2026-10-05T21:16:58Z'
reviewed:
  base_commit: 99b1558867b271d581aab683864e39821f27ac60
  head_commit: 99b1558867b271d581aab683864e39821f27ac60
  files:
    - .gitignore
    - index.html
    - tsconfig.json
    - vite.config.ts
    - src/main.tsx
    - src/types/orb.d.ts
    - src/core/astronomyAdapter.ts
    - src/core/body.ts
    - src/core/bodyOrientation.ts
    - src/core/clock.ts
    - src/core/illumination.ts
    - src/core/moonTrajectory.ts
    - src/core/referenceCenters.ts
    - src/core/scalePolicy.ts
    - src/core/state.ts
    - src/core/trajectory.ts
    - src/app/App.tsx
    - src/app/AtmosphereGlow.tsx
    - src/app/BodyMesh.tsx
    - src/app/CameraController.tsx
    - src/app/DebugControls.tsx
    - src/app/DebugOverlay.tsx
    - src/app/EarthMoonScene.tsx
    - src/app/floatingOrigin.ts
    - src/app/orbitPath.ts
    - src/app/renderCoordinates.ts
    - src/app/sceneLayout.ts
    - src/app/style.css
    - src/app/useBodyTexture.ts
    - src/app/assets/textures/earth-2k.jpg
    - src/app/assets/textures/moon-orig-2k.jpg
    - tests/controls.test.ts
    - tests/core.test.ts
    - tests/orientationIllumination.test.ts
    - tests/sceneTransforms.test.ts
    - tests/fixtures/moon-horizons-source.txt
    - tests/fixtures/moon-horizons.json
    - tests/fixtures/sun-horizons-source.txt
    - tests/fixtures/sun-horizons.json
    - tests/fixtures/usno-moon-phases-2024.json
    - docs/ASTRAEUS_SPIKE_01.md
    - docs/ASTRAEUS_SPIKE_01_ADDENDUM.md
    - docs/ASTRONOMY_VALIDATION.md
    - docs/DONOR_PROVENANCE.md
    - licenses/ERFA.txt
    - licenses/orbjs-MIT.txt
    - licenses/python-sgp4.txt
    - 'tree sha256:900796e56003e12c01a6b6dba1ab652becbbcbb2bc4a5b5ab77f5bcac95f0cdc'
  dependencies:
    - 'package.json sha256:51ec2241d592a7bec85842abaff928332854d1c2eb5286b4b45c00eb96d7f264'
    - 'package-lock.json sha256:338863900e36f88c62b333a528dd3edf8fa84293f435c81306daaddc0f29340b'
issues: []
supersedes: null
---

# C-001: Full Objective Check — O-001 Prove independent Earth–Moon science and rendering

Mode: **Full** (mandatory Objective Check), requested by the owner ("check O1"). Fresh session: this checker session did not build any O-001 Task. Executor session IDs were not recorded on the Tasks, so `executed_session` names them as unrecorded; independence rests on this session never having executed O-001 work.

**Result: CLEAR.** Every O-001 success condition and every acceptance criterion of T-001…T-004 is classified Proven. No Issue met the admission test. This Check does not close anything — see Closure Readiness.

## Revision under review

All implementation is **uncommitted**: `HEAD` is `99b1558` (README only) and every reviewed file is untracked. The reviewed tree is pinned by content hash instead: `sha256sum` of the 49 files under `src tests docs licenses index.html package.json package-lock.json tsconfig.json vite.config.ts .gitignore` (sorted), piped through `sha256sum` = `900796e5…0cdc`. Any change to those inputs after this Check makes it stale.

## Scope Lock (frozen)

1. **Criteria under test:** O-001 retained conditions (deterministic seek, FPS-independent play/pause/rate, physical radius ratio, camera independence, trajectory-derived open path, donor appearance, measured lunar accuracy) and success conditions 1–8; T-001 Done When 1–8; T-002 1–9; T-003 1–5; T-004 1–5. Guardrails SEC-01, TEST-01…TEST-04 (Required/Blocker); STYLE-01…10 advisory. Release gates: configured `typecheck`, `build`, `test` (lint unconfigured; no separate full gate defined in AGENTS.md Build).
2. **Changed files / public entry points:** the files in `reviewed.files`. Entry points: `SimulationClock`, `createState`/`createCenteredPosition`/`assertUtcUnixMs`, `createOrbAstronomyAdapter`, `MoonTrajectory.stateAt`, `composeCenteredPositions`/`inverseCenteredPosition`/`earthStateAt`/`sunPositionFromEarthAt`, `quaternionFromMatrix`/`moonOrientationFromOrbit`/`rotateVectorByQuaternion`, `directionToSun`/`directionFromCenterToSun`/`lunarIlluminatedFraction`, `trueScale`/`readableScale`, `eqjToRenderVector`/`eqjToRenderQuaternion`, `FloatingOrigin`, `sampleOrbitPath`/`mapOrbitPath`/`pathNeedsRefresh`, `createSceneHierarchy`/`bodyAbsolutes`/`placeBodies`, camera `resolveCamera`/`poseCamera`/`switchFocus`/gestures, `parseUtcInput`/`seekClock`/`setPlaying`, `buildDebugReadout`/`overlayRows`, and the running app (`index.html` → `App`).
3. **Relied-on runtime:** `@lizard-isana/orb` 3.1.1 (Luna, frames, AstroInstant, EPV00) through the adapter only; Three.js 0.169 / R3F 8 rendering (layers, directional lights, SphereGeometry UV convention); Vite 8 dev/build; headless Chromium for browser cells.
4. **Matrix axes:** public surfaces; input shape; clock state transitions; boundaries; sequences (seek/play/rate/scale/focus/drag/zoom); representations (State → policy → origin → render axes → GPU; overlay rows); environment (headless SwiftShader browser, node tests). Text classes: not applicable beyond the UTC parser (only text input is an ASCII UTC string; non-ASCII digits and control characters are probed as malformed). Persistence, network, auth, billing: not applicable (no such surfaces).
5. **Admission boundary:** supported paths are the exported APIs above and the app's UI. Dates outside 1900–2100 and below-millisecond precision carry no requirement. Visual "donor quality" is a User Check for the owner, not a technical oracle.

No scope amendment was needed.

## Gates (fresh, this session)

Toolchain: Node v22.22.2, npm-installed pins from the lockfile, run 2026-10-05T21:10Z (2026-10-06 local).

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 (Vite chunk-size warning only, 1,065 kB) |
| `npm test` | exit 0 — 4 files, 58 tests passed |
| `git diff --check` | exit 0 |
| `savepoint health check O-001 .` | "Code Health is not configured for this project; nothing was collected." Code Health not configured; `health_snapshot` omitted. Not a finding. |

## Independent Check harness

A checker-owned Vitest file (`o001.check.ts`, in the session scratchpad, not committed) with its own oracles: 17 cases, all passing after two harness-side errors were corrected. One was my clock arithmetic; the other demanded bit-equality where the result is ~1e-16 (see Observations). Measured results:

| Cell | Oracle | Measured | Bound |
|---|---|---|---|
| Fixture integrity | Re-parsed raw Horizons `$$SOE` text (GEOMETRIC, ICRF, DE441 headers asserted) vs normalized JSON | All 8 Moon + 8 Sun samples byte-equal in time and vector | exact |
| Moon accuracy (raw fixtures) | DE441 vectors | 0.0708 arcmin, 6.385 km | ≤2 arcmin, ≤100 km |
| Sun accuracy (raw fixtures) | DE441 vectors | 0.000125 arcmin, 1.373 km | ≤1 arcmin, ≤100 km |
| Moon 1950–2090, 400 random dates | Astronomical Almanac low-precision lunar theory + IAU 1976 precession (independent of Orb) | max 0.328°, 1,041 km | within the oracle's own ~0.3° / ~1,000 km error; rules out time-scale/frame errors outside the fixture years |
| Sun 1950–2090 | AA low-precision solar formula + IAU 1976 precession | max 0.0115°, 8e-5 relative | ≤0.05°, ≤2e-4 |
| Earth absolute orientation (7 dates 2000–2080) | IAU 1982 GMST + IAU 1976 precession | prime meridian 0.0023°, pole 0.0026° | ≤0.03° (oracle omits nutation) |
| Moon pole | Orbit tilt band | 18°–29° from EQJ +Z on 60 weekly dates | physical band |
| Near-side lock | Moon→Earth direction | dot > 0.999999 on 60 dates | — |
| Re-centering | Moon/Sun = Moon/Earth + Earth/Sun | exact per component; orientation equal within 1.1e-16 | — |
| USNO phases, all 50 events of 2024 (tests cover only January) | USNO API fixture | max |f − ideal| 0.0019 | ≤0.02 |
| Render conversion | Three.js `applyQuaternion` on 200 random quaternions/vectors | commute within 1e-9; det = +1 | — |
| Floating origin | Float32-narrowed camera-relative positions across 3 origins × {Earth-centred, ~1 AU heliocentric offset} × both policies | equal within 1e-5 units | — |
| Path chord vs trajectory | Mid-sample `stateAt` vs chord midpoint | 63.8 km sagitta | < ¼ Moon radius |
| Custom ScalePolicy | Replacement policy object through `placeBodies` | Moon placed at 2× km distance | replaceable |

## Coverage Matrix

| Surface | Normal | Boundary | Malformed / missing | Bypass / alternate path | Result |
|---|---|---|---|---|---|
| `SimulationClock` | play/pause/seek/rate, schedule independence (C6, core tests) | ±8.64e15 ms; integer truncation of fractional anchors after rate change | NaN/∞/0 rate, non-integer seek, NaN monotonic, regressing monotonic | idempotent double play/pause; setRate while paused; seek while playing; negative rate | Passed |
| `createState` / `createCenteredPosition` | owned Float64 snapshots | zero-length quaternion | wrong length, NaN, non-EQJ frame, body==center, Earth/Moon with null orientation | caller buffer mutation after creation (velocity and position) | Passed |
| Adapter + `MoonTrajectory` | fixtures, 1950–2090 sweep | ±30 min orientation samples | NaN, ∞, 1.5 ms, unsupported center `moon` | Sun-centred request shares the Earth-centred solution | Passed |
| Centers | compose, inverse | — | mismatched time, frame, unrelated identity | composition vs `stateAt(t,"sun")` | Passed |
| Orientation | Earth absolute + rate; Moon lock/pole | J2000 epoch, 2080 | non-finite matrix/quaternion | recentred Moon orientation | Passed |
| Illumination | USNO 2024 (50), USNO 2026 (T-002 tests) | new/full extremes (clamp) | mismatched time/frame/center | Moon→Sun vs composed Moon/Sun | Passed |
| Scale policies | True/Readable ratios | radius 0 | NaN, wrong length, string, negative radius | custom policy object | Passed |
| Render axes / origin | conversion, Float64 subtraction | 1 AU offset, close Moon focus, rebase threshold | non-finite origin | origin chosen on camera, on Moon, off-target | Passed |
| Orbit path | 181 samples, open, centre sample | sampleCount 3 | 1, 2, 4, 3.5, NaN, −3 | refresh at seek (>¼ month), drift + cadence | Passed |
| UTC parser | with/without seconds, `T`/`Z` | 1900-01-01 00:00, 2100-01-01 00:00:00 accepted; 1899-12-31 23:59:59 and 2100-01-01 00:00:01 rejected; leap day | Feb 30/29 non-leap, 24:00, :60, year 0050, empty, single-digit fields, offsets, full-width digits, NUL | — | Passed |
| Debug readout | rows from same state/mapping | — | — | speed and scale toggles (browser) | Passed |
| App (browser) | see Browser cells | — | invalid seek | drag/zoom during playback | Passed |

Not applicable: serialization round trips (no persistence), redirected/no-colour output (no CLI), text width (no truncation), external-boundary matrix beyond the offline provider (no network calls at runtime; fixtures are offline).

## Workflow And Side-Effect Lock (per frame)

| Order | Operation | Side effect | Failure owner / final state | Oracle |
|---|---|---|---|---|
| 1 | `clock.now()` | none | throws at range limit; frame aborts, state unchanged | C6 |
| 2 | `stateAt`, `earthStateAt`, `sunPositionFromEarthAt` | none (fresh frozen snapshots) | throws at boundary | C1–C4 |
| 3 | `bodyAbsolutes` (policy + axes) | none | — | C7, C8 |
| 4 | `resolveCamera` → `origin.rebaseIfFar` | mutates camera state and origin (render-owned) | — | browser rebase cells |
| 5 | `placeBodies` | writes group positions and mesh quaternions | — | C7, sceneTransforms tests |
| 6 | `poseCamera`, lights, `updatePath`, `buildDebugReadout` | writes camera, light positions, line buffer, readout ref | — | browser same-time equality |

Rebasing happens before placement, so bodies, path, camera and target share one origin per frame. No step writes upstream scientific state. Persistence and cleanup: not applicable.

## Browser cells (independent run, this session)

`npx vite --port 5288`; checker-owned Playwright script (`playwright-core` 1.59.1 loaded read-only from the donor's `node_modules`), headless Chromium with SwiftShader, 1280×800. Screenshots stayed in the session scratchpad and were reviewed in-session.

- **Console:** no errors or warnings during the full run.
- **Speed invariance (paused, 2024-01-18 03:52 UTC):** across 1×, 1 hour/sec, 1 day/sec and 7 days/sec only the `Speed` row changed.
- **Scale toggle:** only `Scale policy`, `Rendered distance` (5.8808 → 58.8075, ratio 10) and `Moon local` changed; every scientific row and the origin were identical.
- **Invalid seek** `2024-02-30 00:00`: alert "That calendar date or time does not exist."; time unchanged.
- **Phases at USNO dates (Moon focus):** 50.1 % / 0.2 % / 50.1 % / 99.8 % lit. The first-quarter shot shows a half-lit disc; the full Moon shows the near-side maria; the Moon sits on the sampled path line.
- **Texture orientation (independent):** at 2026-04-01 12:00 UTC (expected subsolar point ≈1°E, 4°N), West Africa and the Gulf of Guinea are fully lit and unmirrored, and the Pacific side is dark.
- **Rebasing at 7 days/sec, Moon focus:** 16 distinct origins in 16 samples under both policies. Max Moon-local distance was 0.041 (TrueScale) and 0.984 (ReadableScale), both within the 1-unit threshold.
- **Drag + wheel during playback at 1 day/sec:** time advanced 2024-03-31T12:43Z → 2024-04-02T21:48Z, and the Moon stayed near the target.
- **Determinism after interactions:** re-seeking 2024-01-18 03:52 reproduced every scientific overlay row byte-for-byte.

## Acceptance Coverage

| Criterion | Classification | Evidence |
|---|---|---|
| O-001 retained: deterministic seek, FPS-independent play/pause/rate | Proven | C6; core and controls clock tests; browser speed invariance and re-seek determinism |
| O-001 retained: physical radius ratio, camera independence | Proven | `sceneTransforms.test.ts` "Three.js hierarchy independence"; C7; browser drag/zoom |
| O-001 retained: trajectory-derived open path | Proven | C9; path tests; browser path line |
| O-001 retained: donor appearance | Proven (technical) / owner validation pending | Adapted materials and atmosphere per `DONOR_PROVENANCE.md`; screenshots. Comparison is by eye; donor app not run |
| O-001 retained: measured lunar accuracy | Proven | C1, C2 |
| SC1 Float64 km, independent of rendering | Proven | C7; no React/Three/Orb imports under `src/core` except the adapter's Orb import |
| SC2 Floating origin stability | Proven | C8; browser rebase cells |
| SC3 True/Readable identical state | Proven | browser scale toggle; controls test |
| SC4 Earth orientation (absolute date, axis, rate) | Proven | C3 (absolute phase and pole to 0.003°), orientation tests (rate) |
| SC5 Moon near-side lock | Proven | C4 |
| SC6 Sun geometry: day/night and phase | Proven | C2 Sun, C5, browser phases and Earth terminator |
| SC7 Explicit EQJ centers | Proven | C4 re-centering, C11, core composition test |
| SC8 Provider evaluation incl. orb.js 3.x | Proven | `docs/ASTRONOMY_VALIDATION.md` matrix, pins, integrity, notices in `licenses/` |
| T-001 1–8 | Proven | C1–C7, C11; gates |
| T-002 1–9 | Proven | C7–C9, browser cells; provenance doc. Item 1 provenance remains unresolved by design and is recorded |
| T-003 1–5 | Proven | C10, controls tests, browser cells |
| T-004 1–5 | Proven | fresh gates; C1 reproduces measured errors; `docs/ASTRAEUS_SPIKE_01.md` covers every listed topic incl. addendum table; Design reconciled (below); no Check or completion was self-issued |

## Design Reconciliation

`.savepoint/Design.md` matches the implementation: architecture pipeline, codebase map (`src/core`, `src/app` incl. scene layout, tests, three docs), interfaces (UTC ms clock, `stateAt(time, center)`, quaternion convention, centers, policies), provider decision, measured errors (0.0708 arcmin, 6.385 km; Sun 1.373 km), gate counts (58 tests in 4 files), browser method and open items. No drift was found.

## Guardrails

- **SEC-01 (Blocker):** satisfied. A pattern scan of `src tests docs package.json index.html` found no credentials; the app makes no runtime network calls.
- **SEC-02, SEC-03, DATA-01:** not applicable (no routes, server responses or data stores).
- **TEST-01:** satisfied; each behaviour has named tests or recorded scenarios.
- **TEST-02:** not applicable; no bug-fix Tasks.
- **TEST-03:** satisfied; evidence names test files and cases.
- **TEST-04:** satisfied for T-001–T-003 (owner `check_waiver` recorded with task, reason, actor, time). T-004 has no Task Check and no waiver yet. That is an owner decision before T-004 can be closed, not a defect in this Check.

## File Reality

Every file named in Task evidence exists, except two recorded deletions: `src/main.ts` (replaced by `src/main.tsx`) and `tests/zz_measure.test.ts` (temporary). Neither is a phantom. Textures exist at `src/app/assets/textures/`.

## Materiality

No Issues; no materiality actions are required.

## Observations (non-blocking)

1. **Nothing is committed.** All O-001 work is untracked in git. Recommend the owner commit it so this Check maps to a revision; the tree hash above pins what was reviewed.
2. **Recentred Moon orientation is re-normalised** by `createState` (`src/core/moonTrajectory.ts:52`), differing from the Earth-centred quaternion by ≤1.1e-16. It is numerically immaterial, but strict equality does not hold.
3. **Playback can leave 1900–2100.** Seek is bounded there, but play at 7 days/sec runs past it; no accuracy is claimed outside the samples and the clock throws only at the JavaScript Date limit.
4. **The Task tests check Earth rotation rate only.** Absolute rotational phase was proven here (C3), not by a committed test. Consider adding one if orientation changes later.
5. **Browser verification is still not repeatable from the repo**, as the docs state. Both the executor and this Check used scratchpad scripts.
6. **The donor checkout has one untracked file**, `docs/astraeus-extraction-audit.md`, dated 2026-10-05 22:07 local. That is before `.savepoint/Idea.md` (22:14), so it predates O-001 planning and is outside this Objective. Tracked donor files are unmodified.
7. **The overlay refreshes every 250 ms**, so a screenshot taken right after pausing can briefly lag the controls readout. This is cosmetic.
8. **Bundle size** is 1.07 MB (Vite warning), as already recorded in the design note.

## Code Style Review

- [ ] STYLE-01 **One job per file** — `src/app/EarthMoonScene.tsx` also owns framing limits, path buffer updates and the layered render pass; `formatUtcTimestamp` lives in `DebugOverlay.tsx` but serves `DebugControls.tsx`.
- [ ] STYLE-02 **One job per function** — the `useFrame` callback in `EarthMoonScene.tsx:132-215` (~80 lines) handles state, framing, focus, camera, lights, path and readout.
- [ ] STYLE-03 **Test branches** — gesture handlers and `focusLimits`/`defaultDistance` in `CameraController.tsx`/`EarthMoonScene.tsx` have no automated tests (browser-only).
- [x] STYLE-04 **Types document intent**
- [ ] STYLE-05 **Build only what is needed** — `BODY_FIXED_TO_MESH_NOTE` (`src/app/renderCoordinates.ts:27`) is exported and unused; `SceneReadout` is an alias kept only for naming.
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `MAX_DATE_MS` is duplicated in `src/core/clock.ts:4` and `src/core/state.ts:31`; finite-3-vector validation is repeated in five core files; sidereal month is `27.321661` d in `orbitPath.ts:5` vs `27.321659606` d in tests/docs.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — the whole spike (~49 files) is one uncommitted change set.

## Closure Readiness

- This Check is the current mandatory Objective integration Check for O-001, with result `CLEAR` and no linked Issues.
- O-001 still cannot close until the owner closes **T-004** (`status: in_progress`, `stage: audit`). That needs either a requested Task Check or an explicit owner Task-check waiver for T-004, then the owner's completion decision.
- **Owner validation still needed:** T-001–T-004 each declare `owner_validation.required: true` with no accepted Check. The owner should exercise the User Checks — especially donor appearance and texture orientation, which were judged by eye — and, if satisfied, record acceptance naming **C-001**.
- Only the owner sets Task/Objective `status: done`. This checker made no status changes.
