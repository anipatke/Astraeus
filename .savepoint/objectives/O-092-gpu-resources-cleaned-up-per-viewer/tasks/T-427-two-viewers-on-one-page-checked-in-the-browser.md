---
id: T-427
title: Two viewers on one page, checked in the browser
objective: O-092
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-427, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "Carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:52:00Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus-site/src/main.tsx, packages/astraeus-site/src/synthetic/syntheticScene.ts, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tests/gateLimits.test.ts, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/src/app/LayeredRender.tsx, docs/agents/browser-policy.md]
planned_writes: [packages/astraeus-site/src/main.tsx, packages/astraeus-site/src/synthetic/syntheticTwoViewers.ts, packages/astraeus-site/tools/validate/journey-two-viewers.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/driver.d.mts, tools/gate-limits.json, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, docs/agents/build.md]
---

# Two viewers on one page, checked in the browser

## Outcome

There is a real page with two viewers side by side, and a browser step that proves taking the first one down leaves the second drawing, that the second survives a lost and restored graphics context, and that taking the second down leaves nothing behind. The step is run once on today's code, before any O-092 fix, and the result records the harm two viewers actually suffer today (Objective success condition 1; AH-13). The browser policy says when a Full Objective Check adds the step.

## User Check

None visual. The owner can open `localhost:5490/app.html?experience=synthetic-two-viewers` on the owner preview (`npm run preview:owner`) to see the two viewers if curious; nothing about either viewer's look changes.

## Done When

- A dev-only made-up entry `synthetic-two-viewers` exists in the site's `SYNTHETIC` table (`packages/astraeus-site/src/main.tsx`, the table at ~38–68; left out of a public build by the existing `__PUBLIC_BUILD__` switch, ~38). It mounts the first viewer the normal way and, through the existing `hostControl` seam (`Built.hostControl`, `main.tsx` ~35, called in `show()` ~196 with the viewer's `host` element and handle), mounts a second viewer of the same made-up scene in a sibling element; the returned remover unmounts the second. Both handles are exposed for the browser step (the first through the existing `exposeHost` flag, `window.astraeusHost`, ~197; the second on a second window name chosen in `syntheticTwoViewers.ts`). The entry list comment at `main.tsx` ~17 names the new entry.
- The scene both viewers draw uses every picture that viewers share today: a halo (glow sprite, `bodyDraw.ts` `softGlowTexture` ~199), group or marker dots (`dotMaterial.ts` `roundDotTexture` ~10), anchors if a tracked body fits (`TrackedBodyView.ts` `anchorSpriteTexture` ~57) and at least one body picture (`useBodyTexture.ts`). The builder picks an existing synthetic scene builder that has these (or composes one from public API calls in `syntheticTwoViewers.ts`) and records which shared pictures it covers.
- The two viewers sit one above the other (or side by side on desktop) with no overlap at 375x667 and 1280x720. The `smoke` step does not load made-up entries (only `synthetic-probe`, and `synthetic-journey` in its own step; `browser-smoke.mjs` ~4, ~44–46), so the new step checks this itself at both sizes (`checkScript({ name, viewports }, run)` from `harness.mjs` ~51): both canvases inside the window and their boxes not intersecting.
- A new step `two-viewers` (script `journey-two-viewers.mjs`) is registered as a **full**-tier entry in `STEPS` (`browser-steps.mjs`, with a `scene` line) and gets its own limit in `tools/gate-limits.json` `browser.steps` (`tests/gateLimits.test.ts` requires a limit for every step and `browser.total` above each; the limit follows the file's rule, measured time plus room, with the cause in `docs/BROWSER_CHECKS.md`'s time table). It is not a quick-tier step, so `browser.quickTotal` and `quickLookOutTotal` do not change; `browser.total` is raised only if the full tier's measured sum needs it.
- The step touches the page only through new `driver.mjs` helpers (declared in `driver.d.mts`; `tests/browserDriverGuard.test.ts` and `tests/driverNoIds.test.ts` pass) and asserts, from the scene's own readouts (`data-frames-drawn`, `LayeredRender.tsx` ~39) and the console:
  1. both canvases draw (each frames-drawn readout advances while playing);
  2. after the first viewer's `unmount()`, exactly one canvas remains and its frames-drawn readout keeps advancing while playing, with no console error or WebGL warning;
  3. on the second canvas, `WEBGL_lose_context.loseContext()` then `restoreContext()` fires `webglcontextrestored` and frames-drawn advances again after the restore;
  4. after the second viewer's `unmount()`, no canvas remains.
- Trigger rule: `docs/agents/browser-policy.md`, "Browser tiers", second list (full-tier steps added with `--step <name>` when the diff touches their own paths) gains a `two-viewers` row: `packages/astraeus/src/app/AstraeusScene.tsx`, `LayeredRender.tsx`, `sceneHooks.ts`, `sceneContentsHooks.ts`, `bodyDraw.ts`, `dotMaterial.ts`, `useBodyTexture.ts`, a `dispose` in any view class under `packages/astraeus/src/app/` (`*View.ts`, `*View.tsx`, `KeplerPoints.ts`), `disposeOwned.ts` and `loadingWakes.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus-site/src/synthetic/syntheticTwoViewers.ts`, `journey-two-viewers.mjs`. `docs/agents/build.md` (the browser-gate line that names the full-tier steps) and `docs/BROWSER_CHECKS.md` (the intro tier sentence, "What it runs", the time table) name the new step.
- The step is run once on today's code (before drafts 02–05 merge) and once is enough for this Task. Technical Evidence records, per assertion, pass or fail today, plus a record-only probe of the wake hook: with the second viewer paused after the first is unmounted, does a picture that finishes loading in the second viewer (for example turning the sky picture on through the handle, if the scene has a sky) make it draw again? Record "not measurable" with the reason if the scene offers no such load.
- The browser assertion text baseline is gone (O-088 T-404); the step relies on the outcome controls (a throw, a console error or a non-zero result fails the run; `docs/BROWSER_CHECKS.md` "Outcome controls"), and each assertion is a scenario in the step map.
- Gates per `docs/agents/verification.md` and builder rule 7 (focused).

## Context Files

- `packages/astraeus-site/src/main.tsx` (the `Built` interface ~22–36, the `SYNTHETIC` table ~38–68, `show()` ~186–213)
- `packages/astraeus-site/tools/validate/browser-steps.mjs` (whole, 120 lines: `STEPS`, `selectSteps`)
- `packages/astraeus-site/tests/gateLimits.test.ts` (the step and limit rules ~20–60)
- `packages/astraeus-site/tools/validate/driver.mjs` (`framesDrawn` ~669, `waitForMoreFrames` ~688; `catalogueViewerCount` ~1583 as the pattern for a canvas count)
- `packages/astraeus-site/tools/validate/harness.mjs` (`checkScript` ~51)
- `packages/astraeus-site/tools/validate/journey-catalogue.mjs` (a one-page journey: the shape to copy)
- `packages/astraeus/src/app/LayeredRender.tsx` (the frames-drawn readout, ~39)
- `packages/astraeus/src/app/sceneContentsHooks.ts` (`useReleaseSharedTextures` ~220, `useDrawWakes` ~236; read only, to know what today's harm should be)
- `docs/agents/browser-policy.md` ("Browser tiers")

## Design References

`.savepoint/Design.md` under `Good guest`; `docs/BROWSER_CHECKS.md` (the step map).

## Guardrails

API-03, TEST-01, TEST-02, STYLE-05, STYLE-10. Browser policy: no screenshots, driver-only access, one browser job at a time.

## Implementation Plan

1. Read `browser-steps.mjs` and the driver. Pick the made-up scene (Done When item 2) and write `syntheticTwoViewers.ts`: build the scene, mount the second viewer through `hostControl`, expose both handles.
2. Add the driver helpers: canvas count, frames drawn for the nth canvas (today's `framesDrawn` reads only the first canvas), unmount the first or second exposed viewer, lose and restore the nth canvas's context (`WEBGL_lose_context` in `page.evaluate`), canvas boxes for the overlap check.
3. Write the step; register it (full tier) in `STEPS` with its limit in `tools/gate-limits.json`; add the policy trigger row; map it in `BROWSER_CHECKS.md`; name it in `build.md`.
4. Ask the coordinator first (builder rule 7), then on today's code (before any other O-092 draft merges) run only this step once: `npm run check:browser -- --step two-viewers`. Record each assertion's result, both sizes' layout and the wake probe in Technical Evidence. Do not change engine code in this Task even if an assertion fails; a failing assertion today is the harm being recorded, and drafts 02–06 are what fix it (tell the coordinator which draft the failure belongs to). A red run here is expected evidence, not a gate failure; the green run is the Full Check's, after drafts 02–06.
5. Focused gates.

## Boundaries

Site, browser tooling and the three docs named: no engine (`packages/astraeus/src/`) change. No screenshot, no pixel read. No new public page: the entry is dev-only like the other synthetic ones. No smoke run (smoke does not load made-up entries). This Task runs the step once (before) and does not rerun it after the fixes; the Full Check adds it through the policy row.

## Technical Verification

Focused (builder rule 7): `npm run typecheck`; `node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js <changed files>` and `npx prettier --check <changed files>`; `npx vitest run packages/astraeus-site/tests/browserDriverGuard.test.ts packages/astraeus-site/tests/driverNoIds.test.ts packages/astraeus-site/tests/gateLimits.test.ts packages/astraeus-site/tests/demoScenes.test.ts packages/astraeus-site/tests/entryChoice.test.ts packages/astraeus-site/tests/workflowParity.test.ts` plus any other site test `rg -l 'synthetic-' packages/astraeus-site/tests` finds. One browser run, `npm run check:browser -- --step two-viewers`, with no other browser job on the machine. Engine size unaffected (site only).

## Technical Evidence

Pending execution.

## Drift Notes

Design `Good guest` names the two-viewer step and its policy trigger (reconciled by draft 07).
