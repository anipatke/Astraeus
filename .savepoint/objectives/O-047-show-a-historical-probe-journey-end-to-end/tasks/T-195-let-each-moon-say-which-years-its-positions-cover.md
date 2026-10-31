---
id: T-195
objective: O-047
title: Let each moon say which years its positions cover
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Let each moon say which years its positions cover

## Outcome

The moon ephemeris index records a span per body (a compatible addition: an index with one shared span reads as before), the provider answers each body only within its own span, and a scene time outside a loaded body's span fails once with a named error naming the body, the package and the span, instead of a silent wrong position or a per-frame throw (I-110, engine half).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `parseEphemerisIndex` accepts an optional per-body span; when absent, the set's span applies. Existing indexes in all six packages load unchanged (test).
- A scene opened, or seeked, outside a loaded body's span raises one `SceneError` (`missing-data` or a new named code; state the choice) naming the body, its package and its span, reported once through `ready` / `onError`; never repeated per frame.
- The importer `tools/import/horizons-moons.mjs` can build a chosen list of bodies over a longer span while the rest keep theirs, writing per-body spans into the index (`--only` with `--from`/`--to`, merging into the existing index rather than replacing it).
- Planet series: confirm what span `planets.json` holds per planet and whether `tools/import/planet-fits.mjs` can refit back to 1950-01-01 (VSOP87 for Mercury to Neptune, Horizons for Pluto); a scene before the planet series' start fails the same named way.
- Made-up tests with a small synthetic index (two bodies, different spans).

## Context Files

`packages/astraeus/src/core/chebyshevEphemeris.ts`, `packages/astraeus/src/core/chebyshevSeries.ts`, `packages/astraeus/src/core/bodies/moonSystem.ts`, `packages/astraeus/src/core/bodies/planetTrajectory.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/tools/import/horizons-moons.mjs`, `packages/astraeus/tools/import/planet-fits.mjs`, `packages/astraeus/data/ephemerides/README.md`, `packages/astraeus/tests/chebyshevEphemeris.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Chebyshev providers), `docs/architecture/state-and-assets.md` where it covers ephemerides.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Read the index format and provider; return REPLAN REQUIRED if per-body spans need a breaking format change.
3. Add per-body spans to the format and provider; add the out-of-span error and its once-only reporting.
4. Teach the importer to extend a chosen body list and merge spans into an existing index; dry-run it offline on cached data for one body.
5. Report the planet series' current span and the refit route in Technical Evidence.
6. Made-up tests; doc comments; CHANGELOG `Unreleased` line.

## Boundaries

No new Horizons fetches beyond a one-body trial; the full data run is the next step. No change to fit accuracy rules.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, lite at hand-off). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
