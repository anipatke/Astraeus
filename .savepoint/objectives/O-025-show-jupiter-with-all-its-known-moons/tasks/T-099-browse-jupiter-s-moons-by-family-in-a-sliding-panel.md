---
id: T-099
title: Browse Jupiter's moons by family in a sliding panel
objective: O-025
status: planned
depends_on: [{task: T-098, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Browse Jupiter's moons by family in a sliding panel

## Outcome

A sliding panel (the phone drawer on phones) lists Jupiter's moons by family: the big four at the top with pictures, then each family as a folding section with a plain one-line description and a count, named moons first and unnamed ones folded away; tapping a family lights it up in the scene, tapping a moon focuses it and opens its information panel, and a search box finds a moon by name.

## User Check

Open the panel, open the Carme group, tap its heading to see the family light up far from Jupiter, tap a moon to fly to it and read its information; search for "Himalia".

## Done When

1. O-025 Decision 6 (owner: "a sliding panel where the user can scroll through and on click touch opens an info panel, but 97 is a lot to scroll through"; approved "Looks good").
2. Families and descriptions come from T-097's core data; descriptions are plain words (O-015 voice); counts are live from the data.
3. Folding sections reuse the shared `Collapsible` (T-090) and the phone drawer (T-081); shared control styles; 44 px targets on phones; keyboard and screen-reader accessible.
4. Tapping a family heading highlights that family's dots (and orbits if drawn) in the scene; tapping again or another family clears or moves it; the highlight colour is a live setting.
5. Tapping a moon focuses the camera on it (the same focus as the object picker) and opens its information panel; the information panel shows the moon's family, size, discovery and sources.
6. Search filters by name or designation as the viewer types.
7. Generic: the panel works for any planet's moon families in core data (ARCH-01), so the post-launch planets reuse it.
8. Browser checks through the shared driver; full run passes; owner look on laptop and phone.

## Context Files

`src/shell/Collapsible.tsx`, `src/shell/ControlsDrawer.tsx`, `src/shell/InfoPanel.tsx`, `src/shell/AstraeusShell.tsx`, `src/shell/controls.css`, `src/assets/catalogue.ts`, `tools/validate/driver.mjs`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

O-025 Decision 6; O-020 shell parts.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Panel with families, folding, search.
2. Family highlight; moon tap to focus and inform; checks.

## Boundaries

The panel and its links to the scene; tap-in-the-scene focus is O-022.

## Technical Verification

Configured gates, a new panel browser check, full run. Evaluated under `agent-skills/references/check-method.md`.
