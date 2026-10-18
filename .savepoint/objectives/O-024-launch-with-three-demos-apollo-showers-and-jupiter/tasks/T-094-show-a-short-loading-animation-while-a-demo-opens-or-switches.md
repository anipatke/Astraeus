---
id: T-094
title: Show a short loading animation while a demo opens or switches
objective: O-024
status: done
depends_on: [{task: T-091, requires: clear}]
owner_validation: {required: true, accepted_check: C-074, accepted_by: {role: owner, session: owner-chat-20261018}}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Show a short loading animation while a demo opens or switches

## Outcome

From the first instant a demo page opens, including after the Showers switch reloads it, the visitor sees a calm loading animation on the dark background instead of a blank screen; it fades away as soon as the scene draws its first frame.

## User Check

Switch between the Perseids and the Geminids, and open each demo fresh: no blank screen; a short animation shows, then fades into the scene.

## Done When

1. Owner, 2026-10-18: "switch is ok, but there is a slight pause and screen goes blank between. Suggest a short loading animation?"
2. The animation is in the page itself (`app.html` markup and inline styles), so it shows before any script loads; it is generic (no demo names in the shell, ARCH-01): for example a faint orbit ring with a small body moving round it in the site's colours, and "Loading" text; the demo's own label may be shown once the experience definition is known.
3. It fades out when the scene's first frame is drawn (a single signal from the app), and never lingers: a failure to load shows the existing error message instead.
4. Reduced motion: a still version. Fade time is a live setting (owner rule); the animation keeps the page within the public load budget (a few kB).
5. Works for every demo and on phones; the Showers switch shows it between showers.
6. Browser checks through the shared driver: the loader is present at first paint, gone once the scene is ready, absent after; full run passes.
7. Owner validation: the owner switches showers and opens each demo.

## Context Files

`app.html`, `src/main.tsx`, `src/app/App.tsx`, `src/app/AstraeusScene.tsx`, `src/shell/style.css`, `tools/validate/driver.mjs`, `tools/validate/browser-lite.mjs`, `tools/validate/load-budget.mjs`, `.savepoint/objectives/O-024-launch-with-three-demos-apollo-showers-and-jupiter/Objective.md`.

## Design References

O-024; Design.md public site and shell.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03.

## Implementation Plan

1. Inline loader in the page; first-frame signal; fade.
2. Reduced motion, setting, checks; full run.

## Boundaries

The loading moment only; switching in place without a reload is not in scope.

## Technical Verification

Configured gates, lite, full run. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (builder, lane o024-t094, 2026-10-18)

- Built: loader markup and inline CSS in `app.html` (`#boot`, orbit ring with a travelling body, "Loading", a failure line; still under reduced motion; `pointer-events: none` so it can never block a tap); `src/shell/bootLoader.ts` ends it (`hideBootLoader` on the scene's first drawn frame via `requestAnimationFrame` in `AstraeusScene.tsx`; `failBootLoader` from `main.tsx` when start rejects); fade time = `?loadfade=`, else saved setting (Developer > Display "Loading fade", applies next load), else 0.6 s. Driver: `watchLoader`, `loaderWasSeen`, `loaderState`, `waitForLoaderGone`; lite asserts them for every experience at both sizes. Unit tests `tests/bootLoader.test.ts`.
- Gates: tsc clean, vitest 66 files 1020 passed, build ok, driver guard ok.
- Full run docs/evidence/o024-t094-full-20261018T0301Z: every step exit 0, error-lines 0, except earth-moon (phone "explanation button is 44 px", a layout measurement unrelated to the loader); reruns alone, idle: earth-moon-rerun1/2 exit 0.
- Earlier run docs/evidence/o024-t094-full-20261018T0236Z: story-panels failed (a forced tap on the phone hit the loader while it was still fading); fixed with `pointer-events: none`; story-panels-rerun exit 0 in that directory.
- Drift: no load-failure message existed in the app; the loader's failure line is new. Design.md public site/shell could mention the loader (not done in the lane).

## Owner Completion — 2026-10-18

Owner switched showers on the preview: "2 good". Quick Task Check C-074 CLEAR.
