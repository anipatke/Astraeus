---
id: T-085
title: Keep Apollo 11 at true scale only and keep the scale explanation one tap away
objective: O-020
status: done
depends_on: [{task: T-083, requires: clear}]
owner_validation: {required: true, accepted_check: C-064, accepted_by: {role: owner, session: owner-chat-20261018}}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Keep Apollo 11 at true scale only and keep the scale explanation one tap away

## Outcome

Apollo 11 offers only True scale, so its planets keep their real sizes, and with one scale there is no scale button. Wherever a scale choice exists, its plain-words explanation is one tap away again, not only a hover label.

## User Check

Open Apollo 11: no scale button, bodies at real size. Open Earth–Moon: the scale toggle and an ⓘ beside it; one tap shows what True and Readable mean.

## Done When

1. Owner, 2026-10-17: "I dont like in the Readable view for Apollo it changes the planet size. I think for this story we remove that option is this is about scale." `src/experiences/apollo11/apollo11Definition.tsx` `scaleChoices` becomes `["true-scale"]` (story setting; the engine, Earth–Moon, Jupiter–Io and the showers keep theirs). Any Apollo address or saved view that names `readable-scale` falls back to True scale without an error (test).
2. With a single scale the shell shows no scale button (generic rule on the number of choices, ARCH-01), replacing T-079's held button.
3. Owner: "keep it one tap away": an ⓘ button beside the scale toggle (desktop and phone, 44 px on phones) opens the explanation of the experience's scales; the toggle's tooltip stays. Accessible name stated.
4. Browser scenarios that switched Apollo to Readable (in `browser-shell`, `browser-spike02`, `browser-spike03`, `browser-sky`, `browser-earth-moon` and the on-request scripts, via the shared driver from T-083) move to Earth–Moon or another experience that keeps both scales; each scenario mapped (TEST-03); the full run passes.
5. Pictures: Apollo views unchanged at True scale; the baseline's Apollo pictures already use True scale.
6. Owner validation: the owner looks at Apollo and Earth–Moon.

## Context Files

`src/experiences/apollo11/apollo11Definition.tsx`, `src/shell/TopBar.tsx`, `src/shell/ScaleControl.tsx`, `src/shell/scaleModel.ts`, `src/app/viewLink.ts`, the shared driver from T-083, the browser scripts named above, `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Design References

Design.md scale policies and the shell; Apollo 11's story.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03.

## Implementation Plan

1. Apollo scale choice; the no-button rule; the ⓘ button.
2. Move the browser scenarios through the driver; full run.

## Boundaries

Apollo's scale choice and the scale control only.

## Technical Verification

Configured gates, lite, the full run, Apollo and Earth–Moon pictures. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (executor, lane o020-t085, 2026-10-17)

Stage: audit (ready for a Check; not passed by itself). Status stays in_progress; the owner sets done.

Changes
- `apollo11Definition.tsx`: `scaleChoices: ["true-scale"]`. `scaleModel.ts` gains `startScaleFor(linked, offered)`; `App.tsx` uses it, so an address with `scale=readable-scale` on Apollo falls back to True without error.
- `ScaleControl.tsx`: fewer than two choices renders nothing (generic rule on the number of choices, ARCH-01; replaces T-079's held button). With two or more, an ⓘ button (`button.scale-info`, accessible name "About the scales", title "What the scales mean", `aria-expanded`/`aria-controls`) sits beside the toggle or menu trigger and opens a region listing each scale's explanation plus the "Only the picture changes" note; second tap, Escape or an outside press closes. It uses the shared `top-bar-button` class (36 px, 44 px under 700 px). The toggle's tooltip is unchanged. `TopBar.css`: panel styles.
- Tests: `tests/controls.test.ts` (one scale renders nothing; ⓘ present with the explanation text for two and three scales; `startScaleFor` fallback incl. `readable-scale` on a True-only experience), `tests/experiences.test.ts` (Apollo choices).

Per criterion
1. Apollo `["true-scale"]`; fallback test `startScaleFor("readable-scale", ["true-scale"])` = true-scale. Pass.
2. One scale: no control; unit test (`render(["true-scale"])` is empty) and browser-shell/spike02/spike03/jupiter-io assert `hasScaleControl` false. Pass.
3. ⓘ with stable name: unit test; browser-shell and browser-earth-moon open and close it (text matches real proportion / closer together / Only the picture changes); browser-earth-moon asserts height >= 44 on the phone viewports, and spike03's touch-target rule covers `.scale-control button`. Pass (owner to look).
4. Scenario moves (driver additions: `hasScaleControl`, `hasScaleExplanation`, `scaleInfoName/Box/Open`, `pressScaleInfo(Now)`, `scaleExplanationText`; `currentScale` null and `scaleOptions` [] with no control; `chooseScale(..."True")` a no-op with no control, other labels throw):
   - browser-shell: Apollo Readable switch (toggle name, readouts identical True vs Readable, tooltip wording) -> Earth–Moon page in the same script (Moon metrics under both, toggle name, tooltip, plus new ⓘ open/close); Apollo asserts no control.
   - browser-spike02: six phases x (Readable, True) with equality pairs -> six phases at True only; equality-under-both-scales mapped to browser-shell Earth–Moon (Moon readouts). Loss noted: spacecraft readouts are no longer compared across scales because Apollo has one scale. `scalePairs` output now means "readouts present at True".
   - browser-spike03: True/Readable metric equality on Columbia -> mapped to browser-shell Earth–Moon; Apollo asserts no control and `capture` asserts no control instead of forcing True. Touch-target count floor lowered from >10 to >8 (the held Scale button is gone).
   - browser-sky: Apollo "scale" requests are skipped (`pressFirstControlNow` returns false); Earth–Moon and the Perseids still run them.
   - browser-jupiter-io: its one-scale assertion became "no control, options empty" (same T-085 rule).
   - browser-earth-moon: adds ⓘ checks. On-request scripts need no change: `chooseScale("True")` on Apollo is a no-op; synthetic/belt/eccentric/marker-existing use experiences that keep both scales or the generic `offersScale` test (not re-run, on request only).
   - browser-orbit-look: already Earth–Moon; its `readable` query value is not a scale id so it silently starts at True (pre-existing, see Drift Notes).
5. Pictures: Apollo views unchanged at True. pictures-diff in the second run: exit 0 (see `diff.json`); Apollo pictures use `scale=true-scale`.
6. Owner validation: pending (Apollo no scale button; Earth–Moon toggle and ⓘ).

Gates (cwd /home/user/code/astraeus-t085)
- `npx tsc --noEmit` clean; `npx vitest run`: 59 files, 958 passed, 1 skipped; `npm run build` ok (chunk-size warning only).
- `node tools/validate/driver-guard.mjs`: "every script uses the driver" (exit 0); `tests/browserDriverGuard.test.ts` in the vitest run.
- No lint gate configured; eslint is not set up in the repo (invoked once, no config).
- Browser: `bash tools/validate/run-full.sh docs/evidence/o020-t085-full-<stamp>` (dev 5497, public 5498; started once the load was low and no headless chrome ran).
  - First run `docs/evidence/o020-t085-full-20261017T082042Z` (pictures removed, logs kept): jupiter-io exit 1 (expected `["true-scale"]`, got `[]`) and spike03 exit 1 (primary controls count not > 10 on tablet); both were this Task's own consequences, fixed in the scripts; everything else exit 0.
  - Second run `docs/evidence/o020-t085-full-20261017T083124Z`: every step exit 0 with zero console errors (lite, shell, spike02, spike03, sky, earth-moon, jupiter-io, orbit-look, orbit-motion, view-link, anchor-labels, synthetic x3, public-showers, showers-perseids, showers-geminids, pictures). My `timeout 570` cut story-panels off at the end of that run; it was rerun alone against a dev server on 5497: exit 0, "zero console errors" (`story-panels.log`, `story-panels-rerun.txt`).
  - Lite is part of the full run (exit 0). Both servers stopped afterwards.

Extra reads (beyond Context Files): `src/app/App.tsx` (startScale fallback, to extract it); `tests/controls.test.ts`, `tests/experiences.test.ts`, `tests/browserDriverGuard.test.ts` (existing tests); `src/experiences/jupiter-io/jupiterIo.ts` (grep, to confirm its one scale); `tools/validate/browser-jupiter-io.mjs`, `browser-orbit-look.mjs` and `run-full.sh` (scripts affected by the single-scale rule).

Drift Notes
- `browser-orbit-look.mjs` passes `scale=readable` (not a valid id), so "desktop-readable" actually renders True; not fixed here (outside Boundaries), worth an Issue.
- The Design.md scale/shell notes (held button for one scale) should now read "no control for one scale; ⓘ explanation beside a choice"; not edited in this lane (Design reconciliation belongs to the integration Task / Objective Check).
- Lane note: no router, Task, Check or Issue records were created.

## Owner Completion — 2026-10-18

Owner looked at Apollo 11 (no scale button) and the Earth–Moon ⓘ on the preview: "apollo and info button both good, mark done". Quick Task Check C-064 CLEAR.
