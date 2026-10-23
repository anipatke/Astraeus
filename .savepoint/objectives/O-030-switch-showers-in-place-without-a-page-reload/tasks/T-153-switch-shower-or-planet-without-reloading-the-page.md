---
id: T-153
title: Switch shower or planet without reloading the page
objective: O-030
status: planned
depends_on: [{task: T-152, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o030-planning-20261023}
---

# Switch shower or planet without reloading the page

## Outcome

Pressing another option in the top-bar switch changes the experience inside the running page under the loading animation, with the address updated and back and forward working, and no reload.

## User Check

None on screen in this step (the owner's look is the last step). Run `npm test` and `npm run check:browser` and see the switch cases pass.

## Done When

- `SwitchControl` no longer calls `window.location.assign`; it asks a generic callback (given by the entry through the app and shell, no experience names, ARCH-01) to open the address `switchAddress` computes. The entry pushes that address into history, shows the loading cover, rebuilds the definition (`chooseDefinition` reading the new address) and remounts the app for it (a React key), then hides the cover. Back and forward (`popstate`) do the same without pushing.
- The new choice opens at its own start view and time; a `keep: ["t"]` switch carries the clock time as today. The active option, the page title if it names the choice, and the view link follow the new address.
- Releasing the old one: the old canvas unmounts (GPU resources disposed by React Three Fiber); module-level caches a definition fills (planet series, curve-fit chunks, measured orbits) are listed in Technical Evidence as kept on purpose (shared, bounded) or released.
- Fast tests: the switch callback receives the computed address (no navigation) on the pretend page (`tests/domSetup.ts`, made-up experience, ARCH-03); the entry's switch and back/forward logic, in a plain module, is tested for push versus no-push, kept time and dropped view.
- The meteor journey (`tools/validate/journey-meteor-shower.mjs`) switches to the Geminids through the driver and proves the page did not reload (a value set on `window` before the switch survives) and the Geminids stream is drawn (`assertStreamDrawn`). The driver guard passes; no screenshots.
- Memory: one measurement over about 20 switches back and forth (for example Chromium's `performance.memory` or a heap snapshot size through a scratch script on a scratch server), before and after, recorded in Technical Evidence; growth that does not level off is a finding, not hidden.
- Configured gates pass; one `npm run check:browser` run (this step changes the browser scripts), time and folder recorded.

## Context Files

`src/main.tsx`, `src/shell/SwitchControl.tsx`, `src/shell/TopBar.tsx`, `src/shell/AstraeusShell.tsx`, `src/app/App.tsx`, `src/app/experienceDefinition.ts`, `src/shell/bootLoader.ts`, `src/experiences/showers/showerChoice.ts`, `src/experiences/planets/planetChoice.ts`, `src/app/viewLink.ts`, `tests/domSetup.ts`, `tests/showerChoice.test.ts`, `tests/planetChoice.test.ts`, `tools/validate/driver.mjs`, `tools/validate/journey-meteor-shower.mjs`, `tools/validate/stream-check.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

Design: Showers switch (T-091); Boot loader (O-024 T-094); the `src/shell/` row; Experience plug-in boundary.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, CODE-01, TEST-01, TEST-03; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Read how the entry, app and boot loader start today; list what a definition loads into module-level caches.
2. Move "choose and build a definition for an address" into a plain function the entry can call again; add the switch callback and history handling.
3. Wire the loading cover around a rebuild; remount the app by key.
4. Tests, the journey step, the memory measurement, one browser run.

## Boundaries

No change to what visitors see beyond the flash going away; no change to which options are offered. If remounting cannot release the old scene (memory keeps growing) or the loading cover cannot be reused, stop and return REPLAN REQUIRED with the measurement. No screenshots.

## Technical Verification

Focused `npx vitest run` while building; configured gates and one `npm run check:browser` at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Note for Design: the switch rebuilds in place. Reconciled in the last step of this Objective.
