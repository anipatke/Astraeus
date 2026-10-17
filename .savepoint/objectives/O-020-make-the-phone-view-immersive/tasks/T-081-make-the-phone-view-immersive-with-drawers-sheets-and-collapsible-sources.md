---
id: T-081
title: Make the phone view immersive with drawers, sheets and collapsible sources
objective: O-020
status: in_progress
stage: build
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
6. **Activity graph replaced** (owner, 2026-10-17): the purple activity graph is removed by T-084 and shown as a glow within the timeline line; this Task only makes sure the phone timeline and its drawer show that line well.
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

## Evidence (executor, lane o020-t081, paused 2026-10-17)

**Paused 2026-10-17 (owner paused work).** Task is `in_progress`, `stage: build`; not at audit.

Built: phone layout keyed on `data-phone` (`phoneLayout.ts`: narrow screen, or short touch screen turned sideways); top drawer with name pill (`ControlsDrawer.tsx`); timeline handle and drawer with speed slider and events (`TimelineBar.tsx`, `phone.css`); swipe on handles only (`useDrawerSwipe.ts`); info and story panels as bottom sheets reusing swipe-to-dismiss (`useSwipeToDismiss.ts`, moved from StoryPanelView); collapsible `Sources.tsx` in both; shared control stylesheet `controls.css` (per-component control looks removed from TopBar.css, TimelineBar.css, style.css); live "Phone layout" settings in Developer > Display settings; driver drawer, swipe and `controlStyles` functions; new `browser-phone.mjs` (Done When 8) and `browser-controls.mjs` (Done When 7), both added to `run-full.sh`; `docs/BROWSER_CHECKS.md` scenario map; `tests/phoneLayout.test.ts`.

Results so far: tsc clean; vitest 961 passed (before the last small additions; rerun needed); build ok; driver guard ok; `browser-phone` passed (portrait and landscape, Apollo and Jupiter-Io); `browser-controls` passed (31 states, both sizes); `browser-lite` 26/26.

**Full run did NOT finish.** `docs/evidence/o020-t081-full-20261017T114400Z` was killed at the pause (partial). Failures seen before it, with causes: earth-moon (scale-info driver functions did not open the drawer; fixed in driver afterwards), spike03 (`primaryControlTargets` needs the top drawer open on phone; and its "info sheet clears the timeline" assertion needs the sheet above the timeline), orbit-look (desktop-readable "brighter ring lights more": not yet diagnosed, may be unrelated or load-related; rerun alone), showers-perseids and showers-geminids (logs not yet read). The "console and page errors" line in my two scripts counted as an error line; reworded to "problems".

**Remaining.** (1) Decide info sheet position: currently covers the timeline at the bottom edge (mock), but spike03 and usability favour sitting above the timeline like the story sheet (was about to change `phone.css` to that, default sheet height 50 percent, and update `browser-phone.mjs` accordingly). (2) Make `primaryControlTargets` open the top drawer on phone. (3) Read showers and orbit-look failures. (4) Rerun gates, then ONE clean `run-full.sh` (use DEV_PORT 5531 PUBLIC_PORT 5532), list phone picture differences from the contact sheet, then finish this Evidence (per-criterion outcomes, Drift Notes below) and move to `stage: audit`.

**Drift notes so far.** Landscape phones (wider than 700 px, short, touch) now use the phone layout; desktop above 700 px unchanged apart from the shared control look (all controls 36 px, 13 px font; cog level with the bar row, round; play button 36 px not 40). Picking an object on a phone closes the top drawer (info opens as before). Phone speed picker shows compact rates ("1 h/s"); the slider drawer says it in words. Sources moved out of the badge detail into its own collapsible section; driver `openProvenance` opens both. Safe-area insets cannot be emulated headlessly (checked by reading the stylesheet). Developer panel is outside the shared-look check.
