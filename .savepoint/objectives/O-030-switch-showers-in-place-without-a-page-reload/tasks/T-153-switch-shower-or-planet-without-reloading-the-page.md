---
id: T-153
title: Switch shower or planet without reloading the page
objective: O-030
status: done
depends_on: [{task: T-152, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o030-planning-20261023}
check_waiver:
    task: T-153
    reason: 'owner chose no per-step checks, one Full Objective Check at the end of O-030; quote: "Same as O-031 (Recommended)"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T02:27:46Z"
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

## Replan Resolution

Planner (coordinator), 2026-10-23T02:28:53Z: the executor's replan (heap grew about 2.6 MB per switch, 33.2 to 85.6 MB over 20 switches, no levelling off) does not invalidate the approach; it is a defect inside this Task's scope. Owner decision, 2026-10-23: "Find and fix the leak (Recommended)". The Task continues: find what keeps each old mount alive, release it, and repeat the one memory measurement; done when the heap levels off across about 20 switches. If the cause is not found within the repair's time box, stop and report to the owner again with what was ruled out.

## Technical Evidence

Built (all done and green): `src/app/addressNavigation.ts` (plain push/no-push logic, newest request wins), `src/main.tsx` (choice read from the address each time; one root; remount by key; popstate), `src/shell/SwitchControl.tsx` (`open` callback on `ExperienceSwitch`, given by the entry through `App`'s `switcherOf`; falls back to `location.assign` when absent), `src/shell/bootLoader.ts` (`showBootLoader` rebuilds the cover from the page's own markup; the next scene's first frame hides it), `tests/addressNavigation.test.ts`, `tests/switchControl.test.ts` (made-up choice, no navigation), `tests/domSetup.ts` (`switcher` option), `tools/validate/driver.mjs` (`markPage`, `pageWasKept`; `chooseSwitchOption` waits for the new active option), `tools/validate/journey-meteor-shower.mjs` (Geminids switch step), `docs/BROWSER_CHECKS.md`.

Gates: `npm run lint` pass (2.6 s); `npm run typecheck` pass (4.0 s); `flock /tmp/astraeus-build.lock npm run build` pass (1 s); `npm test` pass, 113 files, 1520 tests (34 s; driver guard included); public build plus `node tools/validate/load-budget.mjs` all pages ok (showers 9.95 MB of 10.07 limit raw).

Browser run: `npm run check:browser` NOT run in this step by owner decision (2026-10-23, "Only at the final check (Recommended)"); the Full Objective Check runs it once. The new journey step is therefore unrun.

Memory (scratch Chromium script, preview on port 5601, `--enable-precise-memory-info`, forced gc twice before each read, Perseids/Geminids alternating, 20 switches, page kept, one canvas at the end): usedJSHeapSize MB at 0, 4, 8, 12, 16, 20 switches = 33.2, 52.2, 59.1, 65.3, 79.0, 85.6. About +2.6 MB per switch and not levelling. FINDING: remounting does not release everything. Module caches are bounded (only two showers alternate) so they should have levelled by switch 2; the growth is per-mount.

Module-level caches a definition fills: planet series models (`src/core/planetSeries.ts`, kept, shared, 1.4 MB once); sky star catalogue request (`src/assets/sky.ts`, kept, shared); measured-orbit requests Map (`measuredOrbits.ts`, kept, one entry per shower opened, bounded by the number of showers); `showerBasics` WeakMap (weak, released with the settings); glow texture and anchor sprite (`bodyDraw.ts`, `TrackedBodyView.ts`, kept, tiny, but GPU textures tied to the first renderer: check they are re-uploaded for the new renderer); `sceneBodySets` WeakMap keyed by canvas (weak). None of these explains linear growth.

Extra reads beyond Context Files: `app.html` (boot markup), `tests/domShell.test.ts` head (pretend page use), `docs/BROWSER_CHECKS.md` line 16 (edited), `src/shell/bootLoader.ts` is a Context File. Grep of `src` for module-level state.

Limitations: JS heap only, GPU memory not measured.

Leak repair (stage build, then test, then audit): CAUSE found with CDP heap snapshots after 2 and 10 switches (11 detached canvases and 17 WebGL contexts kept). Three.js renderers keep their GPU copy of a texture, geometry or buffer in tables (WeakMaps) keyed by the object; an object that outlives the scene (shared, module-level or cached) keeps its table entry, and through it the old renderer's WebGL context, canvas and the whole old page DOM. Three shared things did that: the module-level glow and anchor pictures (`bodyDraw.ts`, `TrackedBodyView.ts`), Three's one geometry behind all Sprites, and the body pictures cached by R3F `useLoader`. FIX: `releaseGlowTexture()` (`bodyDraw.ts`; disposes the glow picture and the shared sprite geometry), `releaseAnchorSprite()` (`TrackedBodyView.ts`), a `useReleaseSharedTextures` hook (`sceneContentsHooks.ts`, called from `SceneContents` in `AstraeusScene.tsx`) that runs both on scene unmount, and `useEffect(() => () => texture.dispose(), [texture])` in `useBodyTexture.ts`. Dispose sends every renderer that drew the object its dispose event, so each forgets it; the next scene uploads again. Test: `tests/releaseSharedTextures.test.ts` (both releases fire the dispose event; the anchor picture is rebuilt).
Memory after (same scratch script, preview on port 5602, forced gc, Perseids/Geminids alternating, page kept, one canvas): usedJSHeapSize MB at 0, 4, 8, 12, 16, 20 switches = 32.9, 47.9, 48.7, 48.9, 49.1, 49.6 (before: 32.8, 52.1, 59.0, 65.3, 71.6, 78.3 in the rerun; 33.2 to 85.6 earlier). Levels off after the first switch (second shower's data and code, kept on purpose); about +0.2 MB per 4 switches after. Note: the first script held Playwright element handles from waitForSelector, which kept detached DOM; the rerun used locator waits, and the growth was still real (78.3 MB), so the numbers above are clean.
Gates after the repair: `npm run lint` pass; `npm run typecheck` pass; `flock /tmp/astraeus-build.lock npm run build` pass; `npm test` pass, 114 files, 1522 tests (1 skipped); public build (ASTRAEUS_PUBLIC_BUILD=1, scratch outDir) plus `node tools/validate/load-budget.mjs` all pages ok (showers 9.95 MB of 10.07 limit raw). No browser check, no screenshots.
Extra reads beyond Context Files: `src/app/sceneContentsHooks.ts`, `bodyDraw.ts`, `TrackedBodyView.ts`, `useBodyTexture.ts`, `AstraeusScene.tsx` (Canvas), grep of `src` for listeners and WeakMaps, `ScaleControl.tsx`/`useDrawers.ts`/`StoryPanelView.tsx`/`phoneLayout.ts`/`AstraeusShell.tsx` effects (all clean up).

## Drift Notes

Note for Design: the switch rebuilds in place. Reconciled in the last step of this Objective.

## Owner Decision

Marked done by the coordinator at 2026-10-23T02:42:43Z under the owner's run rule for O-030, "Same as O-031 (Recommended)" (2026-10-23), which carries O-038's "I mark them as they pass". Leak repair per owner "Find and fix the leak (Recommended)"; heap levels off (32.9 to 49.6 MB over 20 switches). Coordinator re-ran lint, typecheck and npm test (114 files, 1522 passed, 1 skipped). The journey switch step is unrun until the Full Objective Check, by owner decision "Only at the final check (Recommended)".
