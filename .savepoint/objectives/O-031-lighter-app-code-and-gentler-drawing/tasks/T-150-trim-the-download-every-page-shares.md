---
id: T-150
title: Trim the download every page shares
objective: O-031
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o031-planning-20261023}
lane: trim
---

# Trim the download every page shares

## Outcome

The shared app script that every page downloads is measured, and code no visitor needs on first view (for example the developer panel behind the cog) loads only when it is first used, so the first download is smaller with nothing visitors notice.

## User Check

None on screen in this step. Read the before and after sizes and the list of bigger ideas in Technical Evidence.

## Done When

- `app.js` in the public build is measured by what it contains (module sizes from the build, for example a bundle report written to a scratch folder, not committed); the top contributors are listed with sizes.
- Only invisible cuts are made: code moved into chunks fetched when first needed, where the first use shows no new wait (the developer panel, its settings and frame-rate graph are the expected first candidate). Each cut is named with its saving.
- `tools/validate/load-budget.mjs` lists any new chunk where it belongs and its limits are lowered to the new measurement plus the file's stated headroom rule; before and after raw and gzip sizes recorded.
- Bigger ideas that would change something visible (a short wait, a library swap) are listed with an estimated saving for the owner, not built.
- Configured gates pass; the public build and `node tools/validate/load-budget.mjs <dist>` pass. No browser runs.

## Context Files

`src/main.tsx`, `src/app/App.tsx`, `src/app/DeveloperSettings.tsx`, `src/app/FrameRateSection.tsx`, `src/app/SettingControls.tsx`, `src/shell/AstraeusShell.tsx`, `vite.config.ts`, `package.json`, `tools/validate/load-budget.mjs`, `tests/publicBuild.test.ts`.

## Design References

Design: Public site and launch (O-016); the load budget (O-017 T-070); the `src/app/` row.

## Guardrails

ARCH-01, ARCH-04, CODE-01, TEST-01, STYLE-10; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Build the public site to a scratch folder and measure what `app.js` holds.
2. Pick the cuts that are invisible; move them behind a dynamic import.
3. Rebuild, measure, update the load budget.
4. List the bigger ideas.

## Boundaries

No change to what visitors see, no new waits, no dependency swaps. Another step edits the scene's render loop at the same time (`AstraeusScene.tsx`, `LayeredRender.tsx`, `sceneFrame.ts`); stay out of those files. No browser runs, no screenshots.

## Technical Verification

Configured gates, the public build and the load-budget check at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Note for Design: the shared script's split. Reconciled in the last step of this Objective.
