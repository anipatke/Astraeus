---
id: T-087
title: Give every story panel a folded details and sources section
objective: O-015
status: done
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

## Evidence (executor, lane o0xx-t087)

Changed: `src/shell/storyPanels.ts` (optional `details`, validated like `body`, named errors `details`/`details[i]`; defaults to `[]`), `src/shell/Sources.tsx` (optional `details`; one folded section, label "The details and sources" with details, "Sources · n" without), `src/shell/StoryPanelView.tsx`, `src/shell/style.css` (`.sources-details`), `tests/storyPanels.test.ts`, `tools/validate/driver.mjs` (storySectionCount, storySectionLabel, storyPanelDetails, closeStorySources), `tools/validate/browser-story-panels.mjs`.

Criteria:
1. Parser and tests: single/list/empty/blank/non-text details; panel without details gets `[]`; details render above sources.
2. Reuses T-081 `Sources` (ProvenanceBadge unchanged); one `<details>`, closed by default (unit markup test); story-panels script asserts one section, closed, stable label, tap opens/another folds, on desktop and phone sheet.
3. No story wording in shell; synthetic story (`settingsFile` panel plus details) in tests proves details need no code.
4. Driver readouts only; driver guard passes. Prior scenarios in browser-story-panels unchanged and still pass (additions only). Limitation: no shipped panel has `details` yet (T-088), so the "The details and sources" label and details text are proved by unit test, not in the browser.

Commands: `npx tsc --noEmit` clean; `npx vitest run` 61 files, 972 passed, 1 skipped; `npm run build` ok; story-panels alone ok (docs/evidence/o015-t087-story-20261017T225212Z); `bash tools/validate/run-full.sh docs/evidence/o015-t087-full-20261017T225429Z` 24/24 steps exit 0, error-lines 0.

Extra reads: none beyond Context Files (plus `src/shell/ProvenanceBadge.tsx` usage grep, `style.css` sources rules).
Drift notes: none architectural. No Tasks/Issues needed.

## Owner Completion — 2026-10-18

Owner opened and folded "The details and sources" on the preview: "3 good". Quick Task Check C-066 CLEAR (owner validation not required on this Task).
