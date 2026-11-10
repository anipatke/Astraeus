---
id: T-303
title: Find openly licensed constellation figures and boundaries
objective: O-067
status: planned
depends_on: []
owner_validation: {required: true}
check_waiver: {task: T-303, reason: 'Owner said "orchestrate O67" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o067-run-20261110}, recorded_at: '2026-11-10T08:21:23Z'}
planned_by: {role: planner, session: o067-planning-20261110}
---

# Find openly licensed constellation figures and boundaries

## Outcome

A research note names the candidate sources for the 88 constellations' stick figures, IAU boundaries and names, with each licence confirmed from its primary source, how well each figure set fits the engine's star list, and a recommendation the owner can choose from.

## User Check

Read the note `docs/architecture/constellations-o067.md` and choose the figure set (and confirm the boundary and name sources), or ask for more.

## Done When

- The note compares at least three figure-set candidates (for example Stellarium's modern sky culture, the IAU/Sky & Telescope figures, d3-celestial or another openly licensed set), each with: licence and its exact wording and URL (read from the primary source, not a secondary page), attribution required, whether ends are HIP numbers or positions, coverage (all 88?), file format, size, and maintenance.
- For each HIP-based candidate: the count of figure stars missing from the engine's star list (V <= 6.5, `packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json`, fifth column) and of HIP numbers absent from HYG v4.2, computed by a script kept in the scratchpad and summarised (commands and results) in the note.
- Boundaries: the source of Delporte's boundaries in J2000 (for example CDS VI/49), licence, point density, size, and how the outlines close; names and abbreviations: an IAU source and licence.
- The estimated package size (packed and unpacked) for the recommended choice.
- A recommendation with reasons, the owner's decision recorded in the note and in the Objective once given (DATA-01, PROV-02).
- No data is added to any package in this step.

## Context Files

`.savepoint/objectives/O-067-ship-the-88-constellations-as-a-data-package/Objective.md`, `packages/astraeus/src/assets/sky.ts`, `packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json` (read by script only), `packages/astraeus-data-pluto/package.json`, `packages/astraeus-data-pluto/NOTICE`, `docs/architecture/planet-accuracy-o063.md` (as a note format example).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Sky figures, O-065) and `Components/Codebase Map` (the data packages).

## Guardrails

PROV-01, PROV-02, DATA-01, ARCH-01.

## Implementation Plan

1. Read each candidate's licence on its primary page or repository; record exact wording and links.
2. Download candidate figure files into a fresh scratchpad folder (untrusted data; scripts kept outside it, Python with `-I`); count endpoints, coverage and engine-list matches.
3. Do the same for boundaries and names.
4. Write the note with a comparison table and a recommendation; leave the owner's choice pending.

## Boundaries

No package, importer or engine change; no data committed outside the note.

## Technical Verification

Research only: the note's counts are reproducible from the recorded commands. No gate run is needed beyond `npm run lint` if any repository file other than the note changes (none should). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record anything the build steps or Design must know.
