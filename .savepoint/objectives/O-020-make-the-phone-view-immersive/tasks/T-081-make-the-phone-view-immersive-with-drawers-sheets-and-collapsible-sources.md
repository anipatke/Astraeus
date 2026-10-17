---
id: T-081
title: Make the phone view immersive with drawers, sheets and collapsible sources
objective: O-020
status: planned
depends_on: [{task: T-079, requires: clear}, {task: T-080, requires: clear}, {task: T-083, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Make the phone view immersive with drawers, sheets and collapsible sources

## Outcome

On phones the scene fills the screen: a small name pill and the cog at the top, the two-line timeline at the bottom; tapping the pill opens the top drawer with the full controls, and dragging or tapping the timeline handle opens its drawer with the speed slider and the events. Info and story panels are bottom sheets with swipe to dismiss, and Sources in both are collapsed by default.

## User Check

On a phone: the scene fills the screen; each drawer opens and closes by tap and by swipe; dragging the scene never opens a drawer; an info panel opens as a sheet with Sources closed; a story panel never covers the Play button.

## Done When

1. Matches the phone artboards of the approved mock-ups (closed, open, info sheet) at 390x844 portrait and in landscape; desktop layout from T-079 and T-080 unchanged above the phone breakpoint (today `max-width: 700px`).
2. Drawers: top and bottom open and close by tap and swipe; state (time, playback, selection) survives; drawer swipes and scene drags never trigger each other; reduced motion respected; safe-area insets respected; touch targets at least 44 px; no horizontal scroll.
3. Sheets: info and story panels reuse the existing bottom-sheet and swipe-to-dismiss parts (STYLE-07); Sources in `ProvenanceBadge` and `StoryPanelView` become a collapsible section, closed by default, one tap to open (O-020 Decision 4); browser scripts that read source text open it first or read it while closed, each scenario mapped (TEST-03).
4. A story panel never covers the timeline's Play button on phones (C-053 Observation 2).
5. Drawer heights, animation times and any auto-hide delay are settings with live controls (owner rule), not hard-coded numbers.
6. **Activity graph in the drawer** (owner, 2026-10-17, on the T-080 preview: "In the mobile view, why are the purple lines above the timeline?"): on phones the shower's activity window graph (meteors per hour across the active weeks) leaves the compact timeline and shows, readable, in the expanded timeline drawer; desktop unchanged.
7. **One shared set of control styles** (owner, same look: "The two drop downs arent sized/aligned the same"): buttons, icon buttons and dropdowns take their whole look from one shared stylesheet: height, padding, radius, font family, size, weight and colour, background, border, the dropdown arrow, and the hover, focus, selected and disabled states, with desktop and phone sizes (44 px targets on phones). Used by the top bar (T-079), the timeline (T-080), the drawers and the sheets; no component sets its own control look. Owner's follow-up: "they also look styled different? font color size in the drop down?" A browser check reads the computed font size, font family, colour, background, border and height of every visible control of the same kind and asserts they match, and that controls in one row share a baseline, at 1440x900 and 390x844.
8. A browser check at phone sizes (portrait and landscape) that opens and closes each drawer, checks a scene drag does not open a drawer, opens an info sheet with Sources closed then open, and finds no console errors; added to `tools/validate/run-full.sh`.

## Context Files

`src/shell/AstraeusShell.tsx`, `src/shell/InfoPanel.tsx`, `src/shell/ProvenanceBadge.tsx`, `src/shell/StoryPanelView.tsx`, `src/shell/style.css`, the stylesheets T-079 and T-080 create, `tools/validate/run-full.sh`, `tools/validate/browser-story-panels.mjs`, `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Design References

Design.md shell and presentation (ARCH-02); the approved mock-ups https://claude.ai/artifact/Akgz8SgcZBq1jCy15aPqoS; Planetary Explorer's mobile patterns may be reused (owner's own work).

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, STYLE-01, STYLE-07.

## Implementation Plan

1. Phone breakpoint layout: pill, cog, compact timeline.
2. Drawers with gestures; sheets; collapsible Sources.
3. Settings for drawer numbers; browser check; pictures.

## Boundaries

Phone and small-tablet layout; desktop unchanged except shared components.

## Technical Verification

Configured gates, lite, the new phone browser check, pictures against the baseline (phone differences expected and listed), full run. Evaluated under `agent-skills/references/check-method.md`.
