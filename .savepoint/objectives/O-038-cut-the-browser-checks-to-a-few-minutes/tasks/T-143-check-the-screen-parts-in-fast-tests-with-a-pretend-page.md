---
id: T-143
title: Check the screen parts in fast tests with a pretend page
objective: O-038
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o038-planning-20261023}
lane: dom
planned_writes: [package.json, package-lock.json, tests/domSetup.ts]
---

# Check the screen parts in fast tests with a pretend page

## Outcome

The fast suite can open the app's screen parts on a light pretend page (happy-dom) and press them. Every behaviour scenario that the shell browser scripts prove is now proven by a fast test instead: drawers, the information panel and Sources, the story panel contract, the events list with next and previous, camera presets offered, the scale menu, view links (copy, refused clipboard, bad link), the embedded page, phone and reduced-motion behaviour, touch-target sizes and keyboard focus.

## User Check

None on screen. Run `npm test` and see the new pretend-page test files pass in the normal fast run.

## Done When

- `happy-dom` is a dev dependency; files that need it opt in with `// @vitest-environment happy-dom`; `vite.config.ts` keeps `environment: "node"` for everything else.
- A small shared helper (`tests/domSetup.ts`) mounts a shell part with a made-up experience (ARCH-03) and returns it for presses and reads.
- Each behaviour scenario in `browser-shell`, `browser-controls`, `browser-phone`, `browser-layout`, `browser-embedded`, `browser-scale-menu`, `browser-view-link` and the generic part of `browser-story-panels` is listed in Technical Evidence with the test file and case that now proves it, or marked "layout/overlap: owner's look on the preview" or "draws: smoke check". Nothing left unlisted. This list is what the last step of this Objective copies into `docs/BROWSER_CHECKS.md`.
- The browser scripts themselves are not deleted here.
- The whole fast suite still runs in about a minute or less (time recorded before and after). Configured gates pass.

## Context Files

`tools/validate/browser-shell.mjs`, `tools/validate/browser-controls.mjs`, `tools/validate/browser-phone.mjs`, `tools/validate/browser-layout.mjs`, `tools/validate/browser-embedded.mjs`, `tools/validate/browser-scale-menu.mjs`, `tools/validate/browser-view-link.mjs`, `tools/validate/browser-story-panels.mjs`, `tools/validate/driver.mjs`, `src/shell/AstraeusShell.tsx`, `src/shell/useDrawers.ts`, `src/shell/InfoPanel.tsx`, `src/shell/StoryPanelView.tsx`, `src/shell/ScaleControl.tsx`, `src/shell/TimelineBar.tsx`, `src/shell/embedded.ts`, `src/app/viewLink.ts`, `vite.config.ts`, `vitest.setup.ts`, `tests/controls.test.ts`, `tests/phoneLayout.test.ts`, `docs/BROWSER_CHECKS.md`.

## Design References

Design: Components/Codebase Map rows for `src/shell/` and `tools/validate/`; Story panels (O-015).

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-03, CODE-01; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Add happy-dom and prove one shell part mounts and responds to a press under it. If the shell cannot mount without a WebGL canvas, mount the parts around the canvas instead; if neither works, stop and return REPLAN REQUIRED with what blocked it.
2. Write the shared mount helper.
3. Go script by script: copy each behaviour assertion into a fast test against the same component or model; skip pure "it draws" or pixel-position assertions and mark them as smoke or owner-look.
4. Record the scenario map and the suite time.

## Boundaries

No change to what visitors see. No browser runs. No deleting scripts or editing `docs/BROWSER_CHECKS.md` (the last step does both). No screenshots.

## Technical Verification

Focused `npx vitest run <files>` while building; configured gates at hand-off (AGENTS.md Verification Policy). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Note for Design: the fast suite now has an opt-in pretend page. Reconciled in the last step of this Objective.
