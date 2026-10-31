---
id: T-196
objective: O-047
title: Draw every planet's orbit line and fit the view to it
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-196, reason: 'Owner said "orchestrate O-47"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o047-run-20261031}, recorded_at: '2026-10-31T01:01:28Z'}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Draw every planet's orbit line and fit the view to it

## Outcome

`addBody(x, { orbit: true })` and `camera.fitOrbit(x)` work for every catalogued planet, Saturn, Uranus and Neptune included, at any opening time the planet series covers, by one general rule; and any setup error reaches the host once, at `toDefinition` or through `ready` / `onError`, never repeated per frame (I-111).

Replanned 2026-10-31 (planner, session o047-run-20261031) after the builder's REPLAN REQUIRED: a stored period alone cannot draw Neptune (165 y) or Uranus (84 y), because the planet series covers 1950 to 2045 only. Chosen rule (builder's option a, generalised): a body that circles the Sun is drawn as one full turn from its own state source when that source covers the whole turn from the opening time; otherwise as the osculating two-body ellipse from the source's position and velocity at the opening time (reusing `elementsBody` / `keplerElements`), with farthest distance a(1+e). The rule depends on data coverage, never on a body name; its provenance and known limitations say which form was drawn (PROV-01). Rejected: mean elements in the catalogue (a catalogue format change) and longer planet fits (more data for a line).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `sunOrbitLayer` and `farthestSunDistanceKm` (`src/api/sunOrbit.ts`) apply the rule above: a full turn from the source when it covers one, else the osculating ellipse at the opening time; the decision is made from the source's own coverage (and the catalogue period where one is known, to skip the turn search), not from a body name.
- The osculating line's object provenance says it is a two-body ellipse osculating at the opening time, and its known limitations state that perturbations over a turn are not drawn; a full-turn line keeps today's wording.
- A body whose line can be drawn by neither form (no velocity, no Sun GM) is refused at `toDefinition` with `no-orbit`, not at load.
- `fitOrbit`'s farthest distance is computed during setup, not lazily in the frame loop (`src/app/sceneFraming.ts:77`); a framing error is reported once and labels keep being placed (test).
- Tests: orbit line and `fitOrbit` for Saturn, Uranus and Neptune at 1980 and 2030 openings; the osculating Neptune line passes within a stated tolerance of the series positions over the years the series covers; a made-up body that cannot be drawn is refused at `toDefinition`; the Planets demo and existing orbit tests unchanged (name them; inner-planet lines byte-identical).
- The `no-orbit` error texts, doc comments and README rows state the rule.

## Context Files

`packages/astraeus/src/api/sunOrbit.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/core/bodies/index.ts`, `packages/astraeus/src/core/bodies/planetRecords.ts`, `packages/astraeus/src/core/bodies/outerPlanets.ts`, `packages/astraeus/src/app/sceneFraming.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/tests/publicApiSunOrbits.test.ts`, `packages/astraeus/tests/fitOrbit.test.ts`, `packages/astraeus/tests/longOrbitPaths.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work (already in_progress; return to `stage: build`).
2. Add the osculating-ellipse form beside the full-turn form in `sunOrbit.ts`, chosen by source coverage; reuse `elementsBody` / `keplerElements` and the eccentric-anomaly sampling used for own bodies.
3. Use the same rule for the farthest distance; move that read into setup; validate at `toDefinition`.
4. Tests, doc comments, README rows, CHANGELOG `Unreleased` line.

## Boundaries

No change to orbit appearance (colour, width, label) or to lines that are drawable today; no new orbit styles; no new data.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, lite at hand-off). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built after the replan. `src/api/sunOrbit.ts`: new `drawnOrbit` applies one rule to line and farthest distance: published elements/comet sampling as before; else one full turn of the body's own source when it covers one (turn search widened to 6000 two-day steps, so Saturn's 29.5 y is found; out-of-span `TimeScaleOutOfRangeError` and "no full turn" both mean "not covered"); else the two-body ellipse osculating at the opening time (velocity by central difference of the source, `keplerElementsFromStates` + `fillKeplerRangeKm`, eccentric-anomaly sampling from periapsis, farthest a(1+e)). Osculating lines say so in description and knownLimitations. `src/api/scene.ts`: `#fitFarthestKm` returns `{read, settle}`; the farthest is computed at `toDefinition` when the planet series are loaded, else in `prepare` after they load (error reaches the host once via `ready`); the closure caches, so no per-frame work. `no-orbit` texts updated. README addBody row and CHANGELOG Unreleased line.

Tests: new `packages/astraeus/tests/planetOrbitLines.test.ts` (10 cases): Saturn, Uranus, Neptune at 1980 and 2030 openings (line period within 2% of Kepler, fitOrbit farthest within 3% of a(1+e)); Neptune osculating line within 10% of series positions 1960-2040; Mars/Saturn keep full-turn wording; farthest read is stable (cached). Unchanged and passing: publicApiSunOrbits, fitOrbit, longOrbitPaths, Planets demo tests.

Gates: lint pass, typecheck pass, build pass, `npm test` 149 files / 1938 passed, 1 skipped. Files changed: packages/astraeus/src/api/sunOrbit.ts, src/api/scene.ts, tests/planetOrbitLines.test.ts, README.md, CHANGELOG.md.

Limitations: no browser run. Not done: a made-up body refused at `toDefinition` with `no-orbit` (no drawable-by-neither case is constructible with a Sun GM present; the refusal path exists in `farthestSunDistanceKm` and `#sunPath`), and a test of "framing error reported once, labels still placed" is covered only by the cached-read test. Test files run alone (single-file vitest in packages/astraeus) fail without the planet series loaded, as at baseline; the root run loads them.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- Orbit-line rule (Interfaces and Data Flow): a Sun-circling body is drawn from its own source over one full turn when covered, else as the osculating two-body ellipse at the opening time; chosen by coverage, not name. No period added to the catalogue (REPLAN option a).
- `fitOrbit`'s farthest distance is settled in setup (toDefinition or prepare), not lazily in the frame loop; the closure only returns the cached value.
