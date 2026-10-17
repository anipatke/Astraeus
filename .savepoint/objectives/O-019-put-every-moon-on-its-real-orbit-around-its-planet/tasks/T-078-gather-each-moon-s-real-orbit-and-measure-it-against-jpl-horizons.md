---
id: T-078
title: Gather each moon's real orbit and measure it against JPL Horizons
objective: O-019
status: in_progress
stage: audit
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Gather each moon's real orbit and measure it against JPL Horizons

## Outcome

For every moon O-018 brings in, plus Pluto as a parent body, a cited orbit source is recorded as data and its accuracy against JPL Horizons is measured and classified, the way Io's was in O-014. This settles which moons the existing two-body provider serves well and which need a better source, before any moon is placed in a scene.

## User Check

One table lists each moon: its source, epoch, reference plane, the largest error against Horizons over the dates tested (in kilometres, in the moon's own diameters and as a fraction of its orbit), and its class: "within one diameter" or "approximate demonstration".

## Done When

1. Bodies: Io (re-measured on the same dates as the rest), Europa, Ganymede, Callisto; Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus; Triton; Charon; and Pluto about the Sun. (The Moon is already served by its own series and is out of scope.)
2. Source per body (O-019 Success Condition 1): JPL Solar System Dynamics planetary satellite mean elements (https://ssd.jpl.nasa.gov/sats/elem/) with epoch, reference plane (Laplace plane or the planet's equator, as JPL states) and the parent's GM from JPL; Pluto from published heliocentric elements or the JPL small-body record. Each saved as data under `data/orbits/` (one JSON per body, with source URL, access date and licence note), never typed into engine code (ARCH-01, PROV-01). The exact fetched responses are kept under the Task's evidence directory.
3. Accuracy (Success Condition 2): each body propagated with the existing two-body provider the way Io is (read how `src/experiences/jupiter-io/jupiterIo.ts` and `docs/ASTRONOMY_VALIDATION.md` §"Io about Jupiter (O-014 / T-049)" did it, and reuse that path; no new propagator) and compared with JPL Horizons vectors (https://ssd.jpl.nasa.gov/api/horizons.api, planet-centred, ICRF/J2000) at no fewer than six dates spread from 1969 to 2030 plus dense sampling over one orbit near the epoch. Report the largest error in km, in the body's diameters and as a fraction of its semi-major axis, and the class. Retrograde Triton and distant, inclined Iapetus are reported by name with what limits them.
4. Rotation (Success Condition 3, data only): the IAU WGCCRE rotation model (pole and prime meridian) for each body where one is published, recorded with its citation, ready for the facing work; no rendering.
5. A short report `docs/MOON_ORBITS.md` with the table, method, sources and any body for which two-body is not good enough (a finding for the owner, not a new propagator).
6. A test re-runs the propagation from the saved data and checks it against the saved Horizons vectors within each body's stated class, so the figures are reproducible offline.
7. Gates: `npx tsc --noEmit`, `npx vitest run`, `npm run build`. No browser checks (nothing is drawn).

## Context Files

`src/experiences/jupiter-io/jupiterIo.ts`, `docs/ASTRONOMY_VALIDATION.md` (Io section), the two-body provider it uses, `.savepoint/objectives/O-019-put-every-moon-on-its-real-orbit-around-its-planet/Objective.md`.

## Design References

Design.md providers (two-body), State, provenance; the tidal-lock note.

## Guardrails

ARCH-01, ARCH-02, ARCH-05, PROV-01, TEST-01.

## Implementation Plan

1. Reproduce Io's comparison with the existing path.
2. Fetch and save elements, GM and rotation models for every body; fetch Horizons vectors.
3. Measure, classify, write the report and the offline test.

## Boundaries

Data, measurement and report only. No scenes, no rendering, no new propagator, no edits to `.savepoint/Design.md`, `docs/DONOR_PROVENANCE.md` or `docs/ASTRONOMY_VALIDATION.md` (another Task is editing them; record needed lines as Drift Notes), and nothing under `data/bodies/` (another lane writes there).

## Technical Verification

Configured gates and the offline accuracy test. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (executor, worktree lane `o019-t078`, 2026-10-17)

Lane: no router edits, no Tasks/Checks/Issues created; Objective O-019 set `in_progress` (agent-allowed); Task left `in_progress`, `stage: audit`, not done.

### Per-criterion

1. **Bodies**: all 14 saved as `data/orbits/{io,europa,ganymede,callisto,mimas,enceladus,tethys,dione,rhea,titan,iapetus,triton,charon,pluto}.json`; Io re-measured on the same dates (test "re-measures Io": shipped definition 9,388 km, generic path 4,196 km).
2. **Source per body**: each JSON has source URL, access date 2026-10-17, licence note, epoch, reference plane and pole, parent GM (with source), moon GM and radius. Raw responses: `docs/evidence/o019-t078-sats-elem-20261017T034943Z/`, `-sats-phys-20261017T035359Z/`, `-horizons-20261017T035154Z/`, `-sbdb-20261017T035428Z/`, `-iau-rotation-20261017T035441Z/`. No element numbers in engine code (`src/core/satelliteMeanElements.ts` reads records).
3. **Accuracy**: table in `docs/MOON_ORBITS.md` and each file's `accuracy` block. Charon 36 km (0.03 diameters, within one diameter); Io 4,196 km (1.15 d), Europa 13,351 (4.28 d), Ganymede 6,101 (1.16 d), Callisto 10,861 (2.25 d), Triton 33,573 (12.4 d, 9.5% of a), Pluto 15,475,866 km (0.26% of a): approximate demonstration; the seven Saturn rows do NOT reproduce Horizons at the epoch (phase offsets, 27,765 km to 6.8 million km): class "not usable as published", a finding. Triton and Iapetus named with limits.
4. **Rotation**: IAU 2015 model (via NAIF pck00011.tpc) for all 14 bodies in each file's `rotation`; test asserts the polynomials equal the saved kernel.
5. **Report**: `docs/MOON_ORBITS.md`.
6. **Offline test**: `tests/moonOrbits.test.ts` (10 tests): table values equal the saved JPL page, Horizons fixture equals the saved raw responses, recorded figures equal measured, class follows from a stated rule, Saturn diagnostic reproduced, Io comparison, element-frame conversion on made-up planes, rotation constants.
7. **Gates** (lane): `npx tsc --noEmit` clean; `npm run build` ok; `npx vitest run` 3 timeouts (5 s) under machine load average 32 (tests/compositions, tests/pointsLookAhead, tests/showersMeasured, none touched); rerun alone with a longer timeout all pass (showersMeasured 27/27; compositions and pointsLookAhead passed on the second solo run). No browser checks (nothing drawn).

### Extra reads
None beyond Context Files, plus: `src/core/bodies/io.ts` (the Io path to reuse), `src/core/sunCentredSources.ts`, `src/core/twoBodyAdapter.ts`, `src/core/iauRotation.ts`, `src/core/body.ts` (types for the reused provider), `tests/jupiterIo.test.ts` and `tests/fixtures/io-horizons.json` (Io measurement convention), `.savepoint/Guardrails.md` rule lines. Reason: reuse the existing provider, not a new propagator.

### Code touched
New `src/core/satelliteMeanElements.ts`; `src/core/twoBodyAdapter.ts` parameter type widened to `Pick<CelestialBodyDefinition, "id" | "gmKm3S2">` (backward compatible).

### Drift Notes (for the owner / Design; the forbidden files were not edited)
- `docs/ASTRONOMY_VALIDATION.md`: a section "Moons and Pluto against Horizons (O-019 / T-078)" pointing at `docs/MOON_ORBITS.md`, and Io's section should say the IAU-rate period gives 4,196 km against the shipped 9,388 km on the same six dates.
- `docs/DONOR_PROVENANCE.md`: nothing donor-owned; JPL sources are listed in `docs/MOON_ORBITS.md` and each data file.
- `.savepoint/Design.md` (Providers/State): a generic mean-element provider `src/core/satelliteMeanElements.ts` now exists over the two-body provider; Io's constants in `src/core/bodies/io.ts` duplicate `data/orbits/io.json` (ARCH-05: the later body Task should make Io read the record and share `trueAnomalyFromMean`, currently imported from `io.ts`). The "tidal-lock wrapper" candidate: the IAU rotation rates of the synchronous rotators equal their mean motions (used here).
- Finding for the owner: Saturn's seven moons need a different source or a resolved reading of the JPL table before any is placed in a scene; this affects every later O-019 Task that places a Saturn moon.
- The Objective and the router were not changed beyond Objective `status: in_progress`.
