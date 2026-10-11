---
id: T-042
title: Define the bodies once and resolve any body from any centre
objective: O-014
status: planned
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

Pending execution: per-criterion outcomes, commands, files read and changed, limitations.

## Drift Notes

Record architecture deltas here; the integration Task reconciles them into Design.
