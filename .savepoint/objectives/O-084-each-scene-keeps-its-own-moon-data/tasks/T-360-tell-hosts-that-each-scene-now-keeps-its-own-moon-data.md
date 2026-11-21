---
id: T-360
title: Tell hosts that each scene now keeps its own moon data
objective: O-084
status: done
depends_on: [{task: T-355, requires: clear}, {task: T-358, requires: clear}, {task: T-359, requires: clear}]
check_waiver: {task: T-360, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:08:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: docs
planned_reads: [packages/astraeus/tests/cold/sceneMoonIsolation.test.ts]
planned_writes: [packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
---

# Tell hosts that each scene now keeps its own moon data

## Outcome

The README and the `## 0.10.0 (proposed)` CHANGELOG section say what changed for a host: a scene answers only from the moon data passed to it, decoded files are still fetched once per source, and moon orbit lines no longer fail in early 1950.

## User Check

None visual. A host reading the README section `Several viewers on one page` and the `scene.load` row under `Numbers without a viewer` learns that two scenes never change each other's positions, and what a scene with no moon package gives for a planet.

## Done When

- README, `Several viewers on one page`: the sentence "Each keeps its own data (moon positions load per planet and are shared only as fetched files)" becomes precise. Each scene answers from the moon packages passed to its own `load`/`mount`. A planet in a scene without its moon package is placed at its system's barycentre, whatever other scenes loaded. Decoded files are shared per data package and fetched once.
- README, `Numbers without a viewer`, the `scene.load` row: one added clause saying the loaded data belongs to that scene, and that a later `mount` of the same scene reuses it. Edit only that row and the sentence above; read the README by those headings only.
- CHANGELOG `## 0.10.0 (proposed)`, appended to the existing list (read only that section):
  - "Fixed: each scene keeps its own moon data. Loading a moon package for one scene no longer moves a planet in another scene (Jupiter moved about 143 km at the same instant); decoded files are still fetched once per data package. Breaking: a scene that relied on another scene's moon package now places that planet at its system's barycentre and refuses its moons with `missing-data`; pass the package to that scene too."
  - "Fixed: a moon's orbit line in the first weeks of 1950 no longer throws."
  - "Fixed: a viewer that was paused when its moon data finished loading now shows the planet's centre straight away, instead of a position worked out before the load."

  Use the measured figure the draft 01 evidence records, if it differs from 143 km.
- The README checks in the gates pass (`packages/astraeus-site/tests/apiRules.test.ts` and the README API table checks), and no generated table is hand-edited.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/README.md` under `Several viewers on one page` and under `Numbers without a viewer` (the `scene.load` row only)
- `packages/astraeus/CHANGELOG.md` (the `## 0.10.0 (proposed)` section only: `grep -n '^## '` first)
- `.savepoint/objectives/O-084-each-scene-keeps-its-own-moon-data/Objective.md`
- The Technical Evidence of drafts 01, 02, 05 and 06 (for the figures)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `Answers for sites`.

## Guardrails

API-07, PROV-01, TEST-03.

## Implementation Plan

1. Read the two README rows and the CHANGELOG top section by heading.
2. Edit the README sentence and row, then append the three CHANGELOG lines.
3. Run the docs checks, then the gates.

## Boundaries

Docs only. No other README section, no Design.md (the coordinator reconciles the drift notes before the Full Check), and no version bump.

## Technical Verification

Handoff: `quality_gates` (includes the README API checks). No browser run.

## Technical Evidence

| Done When | Evidence |
|---|---|
| README Several viewers sentence precise | edited in place; claims checked against T-358 evidence and sceneMoonIsolation.test.ts (barycentre row, missing-data row, shared-bytes row) |
| scene.load row clause | added "What it loads belongs to this scene alone; no other scene sees it." (existing "a later mount re-uses" kept) |
| CHANGELOG three Fixed lines + breaking entry | added to 0.10.0 (proposed); 143 km matches T-354 evidence (143.2 km); breaking entry in Breaking changes list with migration |
| README checks | apiRules and README table tests inside npm test: pass |
| Gates | lint, typecheck, build pass; test: 306 files passed, 1 failed (packagePacks engine cap, known red), 5053 passed, 2 skipped |

Files: packages/astraeus/README.md, packages/astraeus/CHANGELOG.md. Limitation: the third Fixed line (paused viewer) and 1950 line are taken from the Task text, not re-verified.

## Drift Notes

None.

Coordinator (orchestrate-g024-20261121): lint, typecheck, build green; `npm test` 5053 passed with the one known red (`packagePacks` engine cap), carried to the Full Objective Check. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
