---
id: T-078
title: Gather each moon's real orbit and measure it against JPL Horizons
objective: O-019
status: planned
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
