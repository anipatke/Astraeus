---
id: T-085
title: Keep Apollo 11 at true scale only and keep the scale explanation one tap away
objective: O-020
status: planned
depends_on: [{task: T-083, requires: clear}]
owner_validation: {required: true}
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
