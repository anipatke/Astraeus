---
id: T-096
title: Store Jupiter's moon positions as NASA-checked curve fits in the core data
objective: O-025
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Store Jupiter's moon positions as NASA-checked curve fits in the core data

## Outcome

Every moon JPL Horizons lists for Jupiter has its position over a wide span (target 1950-2050) stored as piecewise Chebyshev curve fits in Astraeus's core data, chunked by moon and time span, with a core trajectory provider that answers `stateAt(time)` from them, and a measured report of size, accuracy against Horizons and speed.

## User Check

Read the report in the Task evidence: how many moons, how big the files are against raw tables, the worst position error per moon against Horizons, and how fast a phone-class device evaluates all moons.

## Done When

1. O-025 Decisions 3, 8 and 9 (owner, 2026-10-18): exact positions from JPL Horizons, core package data (not demo data), curve-fit format with no database.
2. A reproducible importer (under `tools/import/`) fetches Jupiter-centred state vectors from the JPL Horizons API for every moon it lists for Jupiter (count and fetch date recorded), politely (rate-limited, cached on disk, resumable), and fits Chebyshev segments with segment length and degree chosen per moon from its orbital period; the source, Horizons version and licence (US Government work) are recorded (PROV-02).
3. Core data files under `data/` (core, not a story), chunked by moon and span (for example per decade), compact binary or compact JSON, plus a small index (moon id, name, span, chunk paths, fit parameters, provenance).
4. A core provider (`src/core/`) evaluates the fits for any time in span, returning position in the existing frames and units, with named errors outside the span; deterministic (Idea success criterion 1).
5. Accuracy: for every moon, positions from the fits are compared with Horizons at independent sample dates (not the fit nodes) across the span; worst and typical error recorded per moon; target metre-level for the inner and Galilean moons and well under one pixel at any demo view for the outer ones; moons discovered after a date carry Horizons' own uncertainty note in the provenance.
6. Size: total and per-decade sizes recorded against raw position tables at the step each moon would need; only the chunks a demo's window needs are fetched at run time.
7. Speed: evaluating every moon for one frame measured in Node and in headless Chromium with CPU throttling (phone class); well under one millisecond is the target.
8. Unit tests for the provider (span edges, segment joins continuous, errors) and the importer's fitting (round trip on synthetic data). Configured gates pass.

## Context Files

`src/core/trajectory.ts`, `src/core/sampledTrajectory.ts`, `src/core/satelliteMeanElements.ts`, `src/core/moonTrajectory.ts`, `src/core/provenance.ts`, `data/orbits/io.json`, `.savepoint/checks/C-059-t-078-task-check.md`, `docs/ASTRONOMY_VALIDATION.md`, `tools/validate/load-budget.mjs`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

Design.md providers and scientific state; Idea success criteria 1 and 4; O-019 T-078 findings (C-059).

## Guardrails

ARCH-01, PROV-01, PROV-02, TEST-01, STYLE-06, STYLE-09.

## Implementation Plan

1. Horizons importer with cache; Chebyshev fitting; index.
2. Core provider; accuracy, size and speed report.

## Boundaries

Data and provider only; drawing the moons is a later Task. Other planets are post-launch (O-018, O-019).

## Technical Verification

Configured gates; the accuracy, size and speed report; no browser change yet. Evaluated under `agent-skills/references/check-method.md`.
