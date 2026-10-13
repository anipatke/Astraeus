---
id: T-051
title: Find out whether we may ship the measured Perseid orbits, and choose the sky sources
objective: O-011
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o011-replan-i025-2026-10-13}
lane: stream-data
planned_reads: [docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md, data/showers/perseids.json, src/core/orbitGroup.ts, src/core/pointGroup.ts, docs/DONOR_PROVENANCE.md, docs/ASTRONOMY_VALIDATION.md]
planned_writes: [docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md]
---

# Find out whether we may ship the measured Perseid orbits, and choose the sky sources

## Outcome

A decision record, `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md`, settles three data sources with evidence: (1) whether the NASA CAMS Meteoroid Orbit Database may be redistributed as a filtered Perseid (and Geminid) subset, with its licence text, format, member counts, accuracy and how each member is turned into a position; (2) the star catalogue; (3) the Milky Way image and its licence. Nothing is built. If CAMS may not be redistributed, the record says so and the Task returns REPLAN REQUIRED for the owner's decision (no fallback, owner decision 1).

## Astraeus Hypothesis

- **Capability tested:** none yet. This settles the data the next three Tasks build on.
- **Gap:** the stream data decision (Success Condition 6) and the sky sources (Success Condition 11) are open.

## User Check

None required. The owner reads the decision record's summary.

## Done When

1. **CAMS:** the record cites the exact release (version, date, URL) and quotes its licence or terms of use, with the access date. It answers "may a filtered subset be committed to this repository and shipped in a public build?" yes or no, and gives the evidence. If the terms are silent, it records whom to ask and stops with REPLAN REQUIRED.
2. **CAMS content:** the columns used (orbital elements or radiant and speed, epoch, shower code, uncertainties), the Perseid (IAU 7) and Geminid (IAU 4) member counts, and how members with unreliable or hyperbolic orbits are treated. It also gives the propagation method, with a worked example on three real records: a CAMS orbit at its observed epoch is placed at a common display time through two-body motion about the Sun, using the existing `TwoBodyAdapter`. The planned on-disk subset format and size (compressed) are stated.
3. **Factual reference values** for the later checks, each with source and access date: 109P/Swift–Tuttle elements (JPL SBDB), Perseid and Geminid peak solar longitude and radiant (IAU MDC or IMO), plus an independent check of 109P's position from JPL Horizons at three dates.
4. **Star catalogue:** a public-domain catalogue (for example the Yale Bright Star Catalogue, 5th revised ed.), with source URL, licence, star count, columns (J2000 RA, Dec, V magnitude, B−V for colour) and the planned subset size.
5. **Milky Way image:** a source with a recorded licence that permits redistribution (for example ESO/S. Brunier, CC BY 4.0, or NASA public domain). The record states its projection and frame (equirectangular galactic or equatorial) and the rotation needed to align it with EQJ, with the galactic pole's J2000 coordinates cited.
6. No source, test or data file changes; `git diff --stat` touches only the decision record and this Task file.

## Context Files

`docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md`, `data/showers/perseids.json`, `src/core/orbitGroup.ts`, `src/core/pointGroup.ts`, `src/core/twoBodyAdapter.ts`, `docs/DONOR_PROVENANCE.md`, `docs/ASTRONOMY_VALIDATION.md`.

## Design References

Design: Interfaces and Data Flow (groups, `createOrbitGroup`, `TwoBodyAdapter`); Decisions (provider selection).

## Guardrails

PROV-01, PROV-02, TEST-01.

## Implementation Plan

1. Fetch the CAMS release page and readme; download the database to a scratch directory outside the repository; quote the licence or terms.
2. Count IAU 7 and IAU 4 members; inspect the columns; propagate three Perseid records by hand through `TwoBodyAdapter` in a scratch script; record the method and figures.
3. Fetch SBDB and Horizons values for 109P; record the published peak and radiant figures.
4. Choose and record the star catalogue and the Milky Way image with licences and frame alignment.
5. Write the decision record; stop with REPLAN REQUIRED if CAMS cannot be redistributed.

## Boundaries

Research only: no code, no committed data. No invented values: every figure is from a cited source or a recorded computation.

## Technical Verification

A Quick Task Check reviews the record's sources and computations (`agent-skills/references/check-method.md`). The checker re-fetches at least one licence and one count independently.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; T-040 reconciles them.
