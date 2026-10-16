---
id: T-042
title: Define the bodies once and resolve any body from any centre
objective: O-014
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: core
planned_reads: [src/core/body.ts, src/core/state.ts, src/core/referenceCenters.ts, src/core/moonTrajectory.ts, src/core/sunCentredSources.ts, src/core/twoBodyAdapter.ts, src/core/astronomyAdapter.ts, src/core/trajectory.ts, src/core/bodyOrientation.ts, src/app/ephemerisProvenance.ts, tests/core.test.ts, tests/orientationIllumination.test.ts, tests/sunCentred.test.ts, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md]
planned_writes: [src/core/body.ts, src/core/state.ts, src/core/stateResolver.ts, src/core/bodies/sun.ts, src/core/bodies/earth.ts, src/core/bodies/moon.ts, src/core/bodies/index.ts, src/core/referenceCenters.ts, src/core/sunCentredSources.ts, src/core/twoBodyAdapter.ts, tests/core.test.ts, tests/stateResolver.test.ts, tests/layerRule.test.ts]
---

# Define the bodies once and resolve any body from any centre

## Outcome

The scientific core holds one definition per body (Sun, Earth, Moon) with its dimensions, parent, orientation model and accuracy record, one state-source binding per non-root body, and a state resolver that answers "where is body X relative to body Y at time t" for any catalogued pair through the parent chain. `CenterId` is open; a body measured from itself is valid only at exactly zero. Nothing else in the application changes yet: the scene, experiences and the Moon's existing Sun-centred branch keep working exactly as before, so every current test and browser script still passes.

## Astraeus Hypothesis

- **Capability tested:** that one resolver can replace the five separate recentring sites (`MoonTrajectory`'s Sun branch, `earthStateAt`, `sunPositionFromEarthAt`, `PointsView` and `SunCentredView` offsets) with bit-identical results, and that the definitions can move into core without the core importing anything above it.
- **Contract reused:** `State`, `CenteredPosition`, `composeCenteredPositions`, `inverseCenteredPosition`, `Trajectory`, `AstronomyAdapter`, `TwoBodyAdapter`, `Provenance`.
- **Gap:** no catalogue and no resolver (design A.4 items 1–2); `CenterId` closed; `createState` tests two literal ids for orientation.
- **Generic change:** `CelestialBodyDefinition`, `StateSourceBinding`, `createStateResolver` (design C.1–C.2 as corrected in Addendum 2 and the final review); `CenterId = BodyId`; the self-centre rule in `createCenteredPosition`; `createTwoBodyTrajectory` takes any centre whose definition carries a GM; the two-body adapter reads GM from the definitions, not only the library table.
- **Evidence independent of any experience:** a fake four-body chain (A→B→C→root) with fake providers composes both ways; the real Moon-from-Sun equals today's `recenterMoon` to 1e-9 km at the archived Horizons dates.

## User Check

None required: no visible change. The owner may open Apollo and the belt and see nothing different.

## Done When

1. `src/core/bodies/` exports `SUN`, `EARTH`, `MOON` definitions with mean radius, parent (`earth` → `sun`, `moon` → `earth`, Sun root), GM, orientation model and an `accuracy` record carrying today's `EARTH_EPHEMERIS`/`MOON_EPHEMERIS` provenance, a validated date range, and the Moon's 254 km / 8.4° landing-site offset and no-libration limitation. Earth and Moon have a `StateSourceBinding`; the Sun has none. Old `EARTH`/`MOON` constants are re-exported from the new definitions so existing imports compile.
2. `createStateResolver(definitions, bindings, adapter)` rejects an unknown body or centre, a parented body without a binding, a root with one, and duplicate ids; `stateOf(b, t, c)` composes through the common ancestor; `stateOf(b, t, b)` is the zero self-state with the provider's orientation for Earth, Moon, Sun and a fake body; `stateOf("sun", t, "earth")` equals the exact negation of `stateOf("earth", t, "sun")`; one lunar-series call per (body, t) within a frame (memo test).
3. `createCenteredPosition` accepts `body === center` only with an exactly zero position (and zero or absent velocity) and rejects a non-zero self-state; the orientation rule reads the definition's `orientation !== "none"`.
4. Equality tests: Moon-from-Sun through the resolver equals `MoonTrajectory.stateAt(t, "sun")` to 1e-9 km at every archived Horizons date; Earth and Sun through the resolver equal `earthStateAt` and `sunPositionFromEarthAt` exactly. The Moon's Sun branch is **kept** (removed in the scene Task).
5. `tests/layerRule.test.ts` fails if any file under `src/core/` imports from `src/assets/`, `src/app/`, `src/shell/`, `src/experiences/`, `src/mission/`, `src/showers/` or `src/synthetic/` (ARCH-04).
6. `createTwoBodyTrajectory` accepts a centre other than the Sun when its definition carries a GM, and rejects one without; the belt and Perseids sources are unchanged in output (existing tests pass).
7. Configured typecheck, build and test gates pass; every existing browser script passes in a fresh run directory (no scene change expected; record it).

## Context Files

`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (sections C.1, C.2, C.4, Addendum 2 issue 1, Final review correction 1), `src/core/body.ts`, `src/core/state.ts`, `src/core/referenceCenters.ts`, `src/core/moonTrajectory.ts`, `src/core/sunCentredSources.ts`, `src/core/twoBodyAdapter.ts`, `src/core/astronomyAdapter.ts`, `src/core/trajectory.ts`, `src/core/bodyOrientation.ts`, `src/app/ephemerisProvenance.ts`, `tests/core.test.ts`, `tests/orientationIllumination.test.ts`, `tests/sunCentred.test.ts`, `tests/fixtures/moon-horizons.json`, `tests/fixtures/sun-horizons.json`.

## Design References

Design: Architecture; Interfaces and Data Flow (centre composition, `MoonTrajectory.stateAt`); Decisions (provider selection). Design document sections B.3, C.1, C.2, C.4, E step 1, Gate A.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm the design document's C.1–C.2 contracts against the current `state.ts` and `referenceCenters.ts`; return REPLAN REQUIRED on a material mismatch.
2. Add `CelestialBodyDefinition` and `StateSourceBinding` to `src/core/body.ts`; open `CenterId`; replace `assertCenterId` with a non-empty check and move catalogue validation to the resolver.
3. Add the self-centre rule to `createCenteredPosition`; read the orientation rule from a definition lookup supplied by the resolver (default to the three built-in definitions so existing callers keep working).
4. Write `src/core/bodies/{sun,earth,moon}.ts` from today's constants and `ephemerisProvenance.ts`; keep `EARTH`/`MOON` as re-exports.
5. Write `createStateResolver` with parent-chain composition, root inversion, the memo and the named errors.
6. Let `createTwoBodyTrajectory` and the two-body adapter take GM from a definition; keep the Sun default.
7. Tests as in Done When; the layer-rule test; run the gates and all browser scripts.

## Boundaries

No scene, shell, experience or visual change. `MoonTrajectory`'s Sun branch stays. No new dependency. No planet definitions yet. `src/assets/` is not created here.

## Technical Verification

Focused tests during iteration; handoff runs the configured gates and every browser script (the scene is untouched but the core is shared, so the fuller gate runs). Evaluated later under `agent-skills/references/check-method.md`.

**Mandatory Task Check (owner decision, 2026-10-11).** An independent `savepoint-check` session must run a Task Check on this Task when it reaches `stage: audit`, before T-043 or T-046 starts. The owner has declined a Task-check waiver for this Task in advance: the executor must not record a `check_waiver`, and the dependants' `requires: clear` is satisfied only by a `CLEAR` Check record. Reason: this Task fixes the core contracts every later Task builds on, and a bent contract found nine Tasks later would be costly.

## Technical Evidence

Executor session o014-exec-T042-2026-10-11 (not a Check; claims for a fresh `savepoint-check` session to verify).

### Per-criterion outcomes

1. **Definitions.** `src/core/bodies/{sun,earth,moon}.ts` define SUN/EARTH/MOON (radius, parent, GM, orientation model, `accuracy` record with dimensions and position Provenance, `validUtc`, orientation limitations). Moon limitations name the 254 km / 8.4 deg offset and no libration; position provenance is today's `EARTH_EPHEMERIS`/`MOON_EPHEMERIS` (moved into core). `src/core/bodies/index.ts` exports `BUILT_IN_BODIES` and `BUILT_IN_BINDINGS` (Earth, Moon only; Sun none). `EARTH`/`MOON` still importable from `src/core/body.ts` (re-export); `src/app/ephemerisProvenance.ts` re-exports the records so the Apollo and synthetic-ring imports compile unchanged. Tests: `tests/stateResolver.test.ts` > "built-in catalogue" (both cases).
2. **Resolver.** `src/core/stateResolver.ts` `createStateResolver`. Rejections tested in "catalogue validation": duplicate ids, parented body without binding, root with binding, unknown binding body, duplicate binding, unknown parent, not exactly one root, wrong-centre provider; "a made-up chain composes both ways" (fake chain a>b>c root plus branch e>c, both directions, via common ancestor, unknown body/centre rejected, zero self-state with provider orientation incl. root); "self-centre rule" for Earth, Moon, Sun; "resolver equals today's recentring sites" > "returns the Sun from Earth as the exact negation of Earth from the Sun"; "one lunar-series call per body and time" (counting adapter: one `moonPositionKm` call at T across four placements).
3. **Self-centre rule.** `createCenteredPosition` accepts `body === center` only with exactly zero position/velocity; `createState` reads the orientation rule from a lookup (resolver passes its definitions; default is the three built-ins). Tests: "centred positions of one body from itself"; "requires a modelled orientation where the definition says one exists"; existing core/orientation tests.
4. **Equality.** "places the Moon from the Sun as MoonTrajectory's Sun branch does, at every archived Horizons date" (8 dates of `tests/fixtures/moon-horizons.json`, 1e-9 km, orientation equal); "places Earth and the Sun as earthStateAt and sunPositionFromEarthAt do, exactly" (8 dates of `sun-horizons.json`, `toEqual`). Observed difference is 0 (identical float composition). Moon's Sun branch in `MoonTrajectory` untouched.
5. **Layer rule.** `tests/layerRule.test.ts` reads every `src/core/**` file via `import.meta.glob` and fails on any relative import into assets/app/shell/experiences/mission/showers/synthetic; includes a self-check of the detector. Passes: core no longer imports `src/app` (the provenance records moved into core).
6. **Two-body centre.** `TwoBodyTrajectoryInput.center` (default Sun); `createOrbTwoBodyAdapter(definitions)` reads GM from definitions and throws "has no gravitational parameter" otherwise. Tests "two-body motion about any centre with a gravitational parameter" (centre with GM accepted, without GM or unlisted rejected, default Sun/earth). A test asserts the definitions' GM equals the library `GM` table. Belt/Perseids/orbit-group outputs unchanged: `tests/orbitGroup.test.ts`, `tests/sunCentred.test.ts`, `tests/showers.test.ts`, `tests/syntheticRing.test.ts` pass unchanged (they compare against library `GM`).
7. **Gates and browser.** See below. All gates pass. Every browser script passed in a fresh run directory except `browser-synthetic-belt.mjs`, which fails identically at the committed HEAD 8fc6fce (pre-existing, see Limitations).

### Commands and results (2026-10-11, local, node v24.16.0)

- `npm run typecheck` (`tsc --noEmit`): pass.
- `npm run build`: pass (vite build).
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 21 files, 401 tests, all pass (finished ~09:37 UTC). Baseline before the Task: 21 files minus the 2 new ones; the 401 includes the new `tests/stateResolver.test.ts` and `tests/layerRule.test.ts`.
- Browser scripts, `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`, app via `npx vite --port 5199`, run directory `/tmp/claude-1000/-home-user-code-Astraeus/799ecb79-0f69-48bf-a70b-760f5eb7b12e/scratchpad/t042-browser-20261011T093824Z` (scratch, distinct from `docs/evidence/`; nothing historical overwritten), started 09:38 UTC:
  - `browser-shell.mjs` exit 0, errors []
  - `browser-showers.mjs` exit 0, errors []
  - `browser-synthetic.mjs` exit 0, errors []
  - `browser-synthetic-ring.mjs` exit 0, errors []
  - `browser-spike02.mjs` exit 0, errors []
  - `browser-spike03.mjs` exit 0, errors [] (cameraReadoutsUnchanged true)
  - `browser-anchor-labels.mjs <run dir>` exit 0, errors []
  - `browser-synthetic-belt.mjs` exit 1 on "desktop/True: Earth's path is drawn (16)". Re-run once on the working tree: same failure. Run against a detached worktree of HEAD 8fc6fce (port 5198, logs `belt-baseline.log` in the run directory): same failure. So it is not caused by T-042.
  - Not run: `anchor-consistency.mjs` and `conversion-proof.mjs` (Node-only, not browser; they overwrite committed `docs/evidence/*.json`).

### Files

Read (all Context Files): design doc sections C.1, C.2, Addendum 1-2 tables, Final review; `src/core/{body,state,referenceCenters,moonTrajectory,sunCentredSources,twoBodyAdapter,astronomyAdapter,trajectory,bodyOrientation,provenance}.ts`, `src/app/ephemerisProvenance.ts`, `tests/core.test.ts`, `tests/orientationIllumination.test.ts` (head), `tests/sunCentred.test.ts`, fixtures (shape and dates). Extra reads, with reason: `src/core/orbitGroup.ts` and `src/types/orb.d.ts` (callers of the two-body adapter and the library `GM` type), `src/core/sampledTrajectory.ts` and `tests/sampledTrajectory.test.ts` (callers of `assertCenterId`), `tests/orbitGroup.test.ts` (uses library `GM`), `docs/ASTRONOMY_VALIDATION.md` (validity ranges), `docs/ASTRAEUS_SPIKE_02.md` lines 57 and 178 (landing-site offset), `tests/experiencePlugIn.test.ts` (ARCH-01 name check failed on first draft), `tests/metricVisuals.test.ts` (Moon Sun-branch callers, grep only), `tools/validate/*.mjs` headers (run commands, output paths).

Changed: `src/core/body.ts`, `src/core/state.ts`, `src/core/sunCentredSources.ts`, `src/core/twoBodyAdapter.ts`, `src/app/ephemerisProvenance.ts`, `tests/sampledTrajectory.test.ts`. Added: `src/core/stateResolver.ts`, `src/core/bodies/{sun,earth,moon,index}.ts`, `tests/stateResolver.test.ts`, `tests/layerRule.test.ts`. `src/core/referenceCenters.ts` and `tests/core.test.ts` (both in planned_writes) needed no change. Written outside planned_writes: `src/app/ephemerisProvenance.ts` (re-export, required by ARCH-04 once records moved into core), `tests/sampledTrajectory.test.ts` (one assertion: `center: "mars"` is no longer rejected by a closed list, so it now asserts an empty centre is rejected). Advisory only (parallel_planning).

### Limitations

- Moon `validUtc` is the sampled Horizons range 2022-06-01 to 2025-06-01 (the truncated lunar series states no validity of its own); Earth and Sun use the EPV00 1900-2100 range. Apollo 11 (1969) therefore lies outside the Moon's recorded validated range; the record says so honestly and no code reads `validUtc` yet.
- `offsetKm` and `sunFrom` (design C.2) are implemented as thin wrappers over `stateOf` and are tested once; `sunFrom` returns the catalogue root, not a literal "sun".
- The resolver does not yet restrict `MoonTrajectory` to its native centre (Sun branch kept by plan).
- `browser-synthetic-belt.mjs` pre-existing failure is unexplained here (screenshot pixel check for Earth's path in the desktop/True scene); not investigated, no Issue created (executor creates none without owner instruction).
- Headless evidence only; no visual change expected or reviewed.

## Drift Notes

Record architecture deltas here; the integration Task (T-050) reconciles them into Design.

- D1 (for T-050): the `EARTH_EPHEMERIS`/`MOON_EPHEMERIS` records moved from `src/app/ephemerisProvenance.ts` into `src/core/bodies/{earth,moon}.ts` (the definitions' `accuracy.position`), with `EphemerisRecord` in `src/core/body.ts`; the app file is now a re-export. Reason: ARCH-04 (core must not import `src/app`). Design C.1 says "today's EARTH_EPHEMERIS etc." without placing the file.
- D2 (for T-050): `createState(input, requiresOrientation?)` takes the orientation rule as an optional second argument (default: the three built-ins), rather than `createCenteredPosition`/`createState` consulting a global catalogue; the resolver passes its own definitions. Matches C.1 "through the resolver's definition set".
- D3 (for T-050): `TwoBodyTrajectoryInput.center` and `createOrbTwoBodyAdapter(definitions)` are how a non-Sun GM reaches the two-body maths; `TwoBodyAdapter` and `OrbitGroupInput` interfaces are unchanged. The adapter no longer reads the library `GM` table; a test asserts the definitions equal it.
- D4 (for T-050): `StateResolver.sunFrom` returns a `State` (not a `CenteredPosition`) and means "the catalogue root from `center`"; `CatalogueError` (a `RangeError`) is the named error for catalogue and unknown-id failures.
- D5 (for T-050): Moon `validUtc` is the sampled range, not a model validity; see Limitations.

## Completion

- 2026-10-11T09:46Z — Task Check C-015 CLEAR (orchestrator checker session `o014-orchestrator-check-20261011`). `status: done` set by the orchestrator under the owner's explicit delegation in chat on 2026-10-11 ("I authorise you to move tasks to Done once you have checked and are satisfied"), actor {role: owner-delegate, session: o014-orchestrator-check-20261011}. Pre-existing belt-script failure recorded as I-020 and routed to T-045.
