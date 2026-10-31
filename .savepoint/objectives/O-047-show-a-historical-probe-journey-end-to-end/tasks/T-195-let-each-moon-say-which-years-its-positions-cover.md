---
id: T-195
objective: O-047
title: Let each moon say which years its positions cover
status: done
check_waiver: {task: T-195, reason: 'Owner said "orchestrate O-47"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o047-run-20261031}, recorded_at: '2026-10-31T00:15:32Z'}
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

Executed 2026-10-31 (builder, step check waived). Extra reads: none beyond Context Files, plus `packages/astraeus/src/api/data.ts`, `src/api/scene.ts` (toDefinition/prepare), `src/core/planetSeries.ts`, `src/core/timeScale.ts` (to place the error and read the planet span).

Per criterion:
- Per-body span in `parseEphemerisIndex`: optional `span: { fromUtc, toUtc }` on a body (`EphemerisBodyEntry.span`). Decision: the answered span is the body's chunks, narrowed by its own span when present, intersected with the centre's and the time-scale table's. Absent means the chunks' extent (the set's `span` plus the fit's margin), so nothing changed for the six shipped indexes; I did NOT apply the set-level `span` to bounds (it would have cut about 2 days of real chunk margin off Jupiter/Uranus/Pluto bounds). Test: `tests/dataSpans.test.ts` loads all six shipped indexes, no body has a span, every body's bounds stay inside 2009-12 to 2030-01-03; `tests/chebyshevEphemeris.test.ts` "a span per body" (3 cases: narrower own span, wide own span limited to chunks, malformed/reversed rejected).
- Out-of-span error: new `SceneErrorCode` `"out-of-span"` (chosen over `missing-data` because the data is present, the years are not). Moon half: `MoonSystem.load` checks the window against each requested body's bounds before any chunk is fetched and rejects with `MoonOutOfSpanError` (also when the set is already installed); `api/data.ts` `installData` converts it to `SceneError("out-of-span")` naming body, package (`DataSource.name`) and span. The load promise is cached, so it is reported once through `ready` (mount) and never per frame. Tests: engine error once (second `load` returns the same promise), public error text names io, the package and 1952-01-01 to 1958-01-01. Also fixed a latent bug the check exposed: `boundsOf` threw `TimeScaleOutOfRangeError` for Pluto's data (last chunk ends a day past the time-scale table); bounds are now limited to the table's ends. The history look-back clamp in `moonSystem.load` used the fixed `MOON_FIT_SPAN.startUtcMs` (2010); it now uses the body's own bounds.
- Importer: `horizons-moons.mjs --only <naif ids> --from --to` merges into the existing index: kept bodies keep chunks and get a `span` (their own or the old set span), the centre and the time-scale table are built over the union of the new and old spans, the set `span` becomes the union, every body entry carries its `span`. Offline dry run on the cache for one body (`--only 501`, same 2010-2030 span, scratch out dir): Io's chunk list identical to the committed one, 116 bodies, spans written; it stopped at the final end-to-end check only because the scratch dir held no other bodies' chunk files. A longer span (`--from 2005-01-01 --offline`) correctly stopped at the first uncached Horizons request, so no network was used. No new Horizons fetches were made.
- Planet series: `planets.json` holds 1969-01-01 to 2045-01-01 for all eight planets (span read from the stored time-scale table's first piece and `validToUtcMs`; new `planetSeriesSpan()`). `tools/import/planet-fits.mjs` can refit earlier: added `--from <date before 1971>`; trial `--only mercury,jupiter --from 1950-01-01` (no write) fits within 1 km (mercury 0.71 km, jupiter 0.61 km, 723 and 136 segments). Pluto was not tried (needs Horizons samples from 1950, network). Fixed the importer's Orb path (it looked in the package's node_modules; the workspace hoists to the root). A scene before the series' start: `Scene.toDefinition().prepare()` now rejects with `SceneError("out-of-span")` naming the planets and the covered years (test: mercury, timeline 1950 to 1960).
- Made-up tests with a synthetic two-body index of different spans: yes (`tests/dataSpans.test.ts`, `tests/chebyshevEphemeris.test.ts`).

Gates (lite, no browser): `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass (only the existing chunk-size notice); `npm test` pass, 147 files, 1922 passed, 1 skipped.

Limitations: the full 1950 data run is T-200. The static `validUtc` (2010-2030) on mapped moon definitions and Io (`MOON_FIT_SPAN`) is unchanged; once T-200 ships 1950 data the card text and the `position` provenance sentence (`Valid 2010-2030`) in `moonSystem.ts` are stale for those bodies. The window check uses the scene's timeline window, not individual seeks, since a seek stays inside the timeline.


## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- Ephemeris index (`Interfaces and Data Flow`, Chebyshev providers): optional per-body `span`; bounds = chunks, narrowed by the body's span, intersected with the centre's and the time-scale table's. The set-level `span` is informational only.
- Public errors: new code `out-of-span` (moons via `MoonOutOfSpanError` in `moonSystem.load`, planets via `planetSeriesSpan()` in `Scene.toDefinition().prepare`). Not yet in Design.md or docs/architecture/state-and-assets.md; reconcile in the last step.
- Open for T-200+: static `validUtc` / "Valid 2010-2030" wording for mapped moons (`MOON_FIT_SPAN`) is not per-body.
