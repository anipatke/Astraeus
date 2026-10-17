---
id: T-087
title: Give every story panel a folded details and sources section
objective: O-015
status: planned
depends_on: [{task: T-059, requires: clear}, {task: T-081, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Give every story panel a folded details and sources section

## Outcome

A story panel shows its plain story text, then one folded "details and sources" section, closed by default, holding the panel's exact figures, its measured-versus-reconstructed notes and its sources.

## User Check

Open any story panel: the plain story reads first; one tap on "The details and sources" shows the figures and sources; another tap folds them away.

## Done When

1. The panel file format gains an optional `details` list of short paragraphs (validated like `body`, named errors), shown inside the folded section above the sources (O-015 Decision 5). A panel without `details` shows only its sources there.
2. The folded section reuses T-081's collapsible Sources part (STYLE-07); one section per panel, closed by default, label "The details and sources" (or "Sources" when there are no details); accessible name stable; same behaviour in the desktop side panel and the phone bottom sheet.
3. No story wording in engine or shell code (ARCH-01); a synthetic story in tests proves a further story gets details with no code (ARCH-03).
4. Browser checks read details and sources through the shared driver (T-083), opening the section first; each prior story-panel scenario mapped (TEST-03); full run passes.

## Context Files

`src/shell/storyPanels.ts`, `src/shell/StoryPanelView.tsx`, `src/shell/useStoryPanels.ts`, the collapsible Sources part from T-081 (`src/shell/Sources.tsx`), `tools/validate/driver.mjs`, `tools/validate/browser-story-panels.mjs`, `.savepoint/objectives/O-015-tell-the-apollo-11-and-perseids-stories-in-panels/Objective.md`.

## Design References

Design.md shell and story layer; O-015 Decisions 4-8.

## Guardrails

ARCH-01, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. `details` in the panel format and validator, with tests.
2. Render inside T-081's collapsible; driver readouts; scripts.

## Boundaries

The panel format and view only; copy is T-B and T-C.

## Technical Verification

Configured gates, lite, browser-story-panels, full run. Evaluated under `agent-skills/references/check-method.md`.
