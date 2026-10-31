---
id: T-221
title: Prove view switching on the packed package and write it up
objective: O-051
status: in_progress
stage: audit
depends_on: [{task: T-218, requires: clear}, {task: T-219, requires: clear}, {task: T-220, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o051-plan-20261101}
---

# Prove view switching on the packed package and write it up

## Outcome

The packed package shows a made-up scene with two probes and a "Both" view, switched from the bar and by the host, keeping time, speed and camera. Docs, CHANGELOG and Design match, and the owner has looked at it on the preview.

## User Check

On `localhost:5490`, open the synthetic views scene, play at a fast speed, and confirm: the view choice sits in the bar (and the phone drawer) without overlapping anything; switching keeps the time, speed and camera; the menu, timeline markers and panels show only the chosen view's things; following one probe then switching to the other probe's view does what that view's camera rule says.

## Done When

- `check:node-consumer` builds a scene on the packed package with two made-up probe paths, a shared body and three views (each probe, both), and asserts the resolved views and validation faults.
- A synthetic browser scene (a new synthetic experience or the synthetic journey gaining views; record which and why) shows the views with different camera rules; the browser check covers a visitor switch at 1280x720 and 375x667 (menu contents, markers, clock unchanged, no overlap) and a host `setView`. One `npm run check:browser` passes.
- README, API reference and example lines; CHANGELOG `Unreleased` with the first-download size change (`node tools/measure-example.mjs`); `check:pack` and `check:engine-alone` pass (report, do not raise, any pack or load limit it exceeds; limits are owner decisions).
- Every Drift Note from the O-051 steps is reflected in Design.md or marked non-architectural with a reason.
- Owner look recorded before the Full Objective Check.

## Context Files

`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `packages/astraeus-site/src/main.tsx`, `tools/check-node-consumer.mjs`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` and `Current Technical State`.

## Guardrails

ARCH-01, ARCH-03, ARCH-06, TEST-01, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Confirm the previous steps are in place; return REPLAN REQUIRED if not.
3. Packed-package consumer cases; synthetic scene and browser coverage.
4. Docs, CHANGELOG with size; Design reconciliation.
5. One `npm run check:browser`; ask the owner to look on the preview.

## Boundaries

No Voyager app, Apollo 11, showers or planets demo change; no release.

## Technical Verification

Full configured gates plus `check:pack`, `check:engine-alone`, `check:node-consumer` and one `check:browser` (browser policy). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Per criterion (executor claims, to be verified by a Check):

1. `check:node-consumer` on the packed package: new case "views: two made-up probe paths, a shared body and three views ..." builds three views on two paths and asserts `place`, `start`, each view's membership (shared Earth in all; events; panels), the three camera rules, the scene without views, and seven `bad-view` faults (empty list, repeated id, bad place, bad camera, bad start at the call; unknown id and hidden camera target at `toDefinition`). Result: 8 tests passed, "node consumer: pass".
2. Synthetic browser scene: a NEW scene, `?experience=synthetic-views` (`packages/astraeus/src/synthetic/syntheticViewsDefinition.ts`, dev server only), not views on the synthetic journey. Why: the journey is a historical probe through the real planets with its own checks and Object list; views need two plain paths, a shared body and distinct events and panels that nothing else depends on. Two made-up probes about Earth, three views (a: stay, b: follow probe b, both: focus probe a). A rule applies only when the camera's target leaves the view, so a (from b) and b (from a) show rules at work and both's rule is only resolved. New step `views` (`journey-views.mjs`; driver additions at the end of `driver.mjs`): at 1280x720 and 375x667 touch, the bar offers three views in order, opens on a, and the host link reports it; the view choice is inside the window and clear of its neighbours, the cog, the timeline and the pill (smallest button 36 px desktop, 44 px phone); a visitor switch to b, both and a changes the Object list, timeline events, panel markers and each probe's drawn line to that view's and leaves the clock and speed unchanged; the host hears it with `cause: "visitor"`; with the clock at the fastest speed, a to b (follow probe b) Earth moves on screen, and b to a (stay) Earth's projected centre is unchanged to 0.002 while playing; a host `setView("b")` moves the buttons and the view, leaves the clock, and is heard as `cause: "host"`. The dev page hands the scene a `ViewerLink` as `window.astraeusHost` (`createViewsHost`; `main.tsx` passes `host` to `App` for that experience only). One `npm run check:browser`: smoke 233 s, smoke-public-showers, planets-phone, meteor-shower, views (42 s), hello-scene, hello-react and public-addresses exit 0 with 0 error lines; `public-build-assets` exit 1 (load budget, see Limitations). Evidence: `docs/evidence/browser-20261031T232753Z/` (summary.txt and each step's results.json; logs in /tmp/astraeus-check-logs-GTsDw0).
3. Docs: README (new "Views of one scene" section with an example; the `setViews`, `view` and `setView` rows came with T-218 and T-220), CHANGELOG `Unreleased` (new T-221 proof entry; first-download line re-measured: 1,652,588 bytes raw, 472,895 gzip, against 1,638,245 and 468,717 at 0.6.0: +14,343 raw, +4,178 gzip; +8,387 raw, +2,426 gzip over the O-050 line of 1,644,201 and 470,469), `docs/BROWSER_CHECKS.md` (views step). `check:pack` pass (astraeus 7.17 MB packed of 8.0, 9.25 MB unpacked of 9.5, 482 files, stray-file check; nothing exceeded). `check:engine-alone` pass (1204 tests, 20.7 s).
4. Drift notes, each reconciled in `.savepoint/Design.md`, Interfaces and Data Flow (new paragraph "Views of one scene (O-051, I-124)" and the replaced pack sentence); see Drift Notes below.
5. Owner look: pending, not recorded here. The preview on `localhost:5490` is a Vite dev server on this checkout (started 09:02, serving the working tree live) and serves the new scene (checked).

Commands run: `npm run lint` (pass), `npm run typecheck` (pass), `npm run build` (pass), `npm test` (172 files, 2130 passed, 1 skipped), `npm run check:pack`, `npm run check:engine-alone`, `npm run check:node-consumer`, `node tools/measure-example.mjs`, one `npm run check:browser`. Also `journey-views.mjs` alone against a scratch dev server while building it (three failing iterations, then pass), and two scratch public builds to compare sizes.

Extra reads beyond Context Files (logged): the T-218 to T-220 Task files (Drift Notes, to reconcile); `packages/astraeus/src/api/{views,viewerLink,mount,scene}.ts`, `src/shell/{viewCamera.ts,AstraeusShell.tsx,DisplaySwitches.tsx,TopBar.tsx}`, `src/app/viewerPort.ts`, `tests/sceneViews.test.ts` (the view API and its shell hooks, to build the scene and the driver reads); `packages/astraeus-site/tools/validate/{runner,run-browser,harness,driver-guard,public-build-assets,load-budget}.mjs`, `tools/{build-example,measure-example,check-packs}.mjs`, `docs/BROWSER_CHECKS.md`, `docs/agents/{verification,build,browser-policy}.md`, `examples/hello-scene` (step, example and size mechanics); `.savepoint/Design.md` (sections edited).

Changed: `.savepoint/Design.md`, this Task file, `packages/astraeus/{README.md,CHANGELOG.md}`, `packages/astraeus/src/synthetic/syntheticViewsDefinition.ts` (new), `packages/astraeus/tests/syntheticViews.test.ts` (new), `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/tools/validate/{driver.mjs,run-browser.mjs,public-build-assets.mjs,journey-views.mjs (new)}`, `tools/check-node-consumer.mjs`, `docs/BROWSER_CHECKS.md`, and the new evidence folder `docs/evidence/browser-20261031T232753Z/`.

Limitations and unverified:

- Owner decision (actor: owner, 2026-11-01, via the coordinator): "Split engine and demo limits (Recommended)", engine limit once at today's size plus 5%. Implemented: `tools/validate/engine-budget.mjs` holds one limit on the plain example's first download (`examples/hello-scene`, what `node tools/measure-example.mjs` measures; 1,652,588 B raw / 472,895 B gzip) at 1,735,000 B raw / 497,000 B gzip, enforced in `public-build-assets.mjs` (it runs in the one browser check after the example is built, sees both builds, and was already the size gate; message names "engine"). `load-budget.mjs` now holds each page to its own share, its first load less the engine's share (a Vite plugin writes `engine-share.json` when `ASTRAEUS_ENGINE_SHARE=1`, which the runner's public build sets: per script chunk, rendered bytes from `packages/astraeus/` against the chunk total; a chunk's raw and gzip size is scaled by that ratio, so gzip is handled the same way; a build without the sidecar fails by name). New own-share limits (own share measured 2026-11-01 plus 5%, rounded up to the next 10,000 B, the table's standing rule): Apollo 11 4,240,000 raw / 2,850,000 gzip (own 4,036,027 / 2,705,645; engine 463,999 / 136,685), Jupiter 6,570,000 / 4,560,000 (own 6,249,893 / 4,340,005; engine 911,242 / 445,166), Perseids 8,970,000 / 6,760,000 (own 8,541,279 / 6,430,898), Geminids 10,630,000 / 7,340,000 (own 10,118,949 / 6,986,519; engine 897,054 / 414,023 on both showers). The planet views the public build omits were re-derived the same way on a local build (their page sets, already stale, are not held against a public build); the site pages carry no engine code and keep their limits. Planted in `tests/publicBuild.test.ts` (`proveEngineDemoSplit`): engine growth trips only the engine limit; demo growth only the page's. Old raise-history comments in `load-budget.mjs` were trimmed. Design.md and `docs/BROWSER_CHECKS.md` carry a note. The earlier exceeded-limit finding below is superseded by this.
- Rerun after the split (the one remaining `npm run check:browser`, `docs/evidence/browser-20261031T234254Z/`, 351 s): every step exit 0 with 0 error lines, `public-build-assets` included (engine 1,652,588 / 472,895 within 1,735,000 / 497,000; every page within its own-share limit). Lint, typecheck and `npm test` (172 files, 2131 passed, 1 skipped) pass. Superseded finding of the first run: LOAD BUDGET EXCEEDED, not raised (owner decision). In the one `check:browser`, `public-build-assets` failed on `loadBudget`: the Apollo 11 page is 4,500,026 bytes raw against a limit of 4,500,000 (26 over), and `app.html?experience=planets&planet=jupiter` is 7,161,135 against 7,160,000 (1,135 over). Gzip limits hold; every other page and the whole build are within limits. Two scratch public builds: with this step's `main.tsx` change the pages are 4,500,026 and 7,161,135; with `main.tsx` at HEAD 4,500,005 and 7,161,114, so the engine code of the earlier steps already put both over and this step adds 21 bytes. The browser check was not rerun (a limit, not a defect).
- Owner look not done; no screenshots taken.
- The "both" view's rule (`focus probe-a`) is only resolved, never applied, in the browser scene: a rule applies only when the camera's target leaves the view, and "both" hides nothing.
- Stay is asserted by Earth's projected centre (valid off screen); in the held pose Earth is outside the view, so the check proves the camera holds, not how it looks.
- No Task Check requested and no waiver recorded.

## Drift Notes

Reconciled by this step (all architecture notes are in `.savepoint/Design.md`, Interfaces and Data Flow, paragraph "Views of one scene (O-051, I-124)", unless said otherwise):

- T-218 `definition.views`, `ViewSettings`/`ResolvedView`, `api/views.ts`, `bad-view`, camera input normalised to rule `start` with framing, error timing, target must be shown by the view: in Design.
- T-218 pack rule (the 472 file limit replaced by the stray-file check): Design's sentence "The astraeus pack file limit is 472" replaced.
- T-219 hiding rule (`hiddenByView`: ids some view shows and this one does not, so sky, Sun object and shared bodies are never hidden) and the repair (orbit lines and composition paths follow their body through `partOf`): in Design.
- T-219 `SceneControls.viewHidden`, frame stage `applyViewVisibility`, `StoryMarkerLayer.update` taking the hidden sets: in Design.
- T-219 `ViewChoice` in `shell/DisplaySwitches.tsx` reusing `.switch-control` CSS: non-architectural (an internal component prop and a stylesheet reuse; no new boundary or contract).
- T-220 `{ kind: "hold" }` camera request, `OrbitCameraState.fixedPoint`, `cameraTargetAbsolute`, `switchFocus` clearing, rescale; the rule applies from the new view on visitor and host switches, not on open: in Design.
- T-220 `ViewerControl.views/setView`, `ViewerState.view` (compared in `publish`), `MountedScene`, `AstraeusScene` `view`, `ViewerChange.view`: in Design.
- T-220 `AstraeusShell` props `viewCamera` and `onCameraHold`: non-architectural (internal shell props that carry the Design-listed rule; not public API).
- T-221 own: the dev-only `window.astraeusHost` and the `synthetic-views` scene: non-architectural (a test fixture the public build leaves out; `SYNTHETIC_KEYS` in `public-build-assets.mjs` gains `synthetic-views`, guarded by `publicBuild.test.ts`).
