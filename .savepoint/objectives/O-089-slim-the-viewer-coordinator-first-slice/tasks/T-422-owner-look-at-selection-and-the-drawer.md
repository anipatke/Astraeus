---
id: T-422
title: Owner look at selection and the drawer
objective: O-089
status: in_progress
stage: audit
depends_on: [{task: T-418, requires: clear}, {task: T-420, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: owner-look
planned_reads: []
planned_writes: []
---

# Owner look at selection and the drawer

## Outcome

The owner confirms on `localhost:5490` that choosing objects and the Developer drawer look and behave as they did before this Objective (behaviour unchanged).

## User Check

On `http://localhost:5490`, served from the Objective branch with drafts 01 and 03 merged:

1. **Planets, wide window** (`app.html?experience=planets`):
   - Pick Jupiter in the object menu: its card opens and its label takes the selected colour.
   - Click Saturn in the scene: the camera flies to it and its card opens.
   - Press Overview, then Focus: the menu still names Saturn.
2. **Planets, phone size** (375 x 667 in the browser's device mode): tap a planet in the scene. It is selected (the title place names it) and the card does not open by itself. Open it from the title place.
3. **Apollo 11** (`app.html`):
   - Step through the story with Next. A step that selects an object selects it; on the phone size the card stays closed so Back and Next stay reachable.
   - Select a spacecraft part, then drag the timeline to a moment it is not available and back: the selection falls back to the first available object, as before.
4. **Look-out** (`app.html?experience=synthetic-lookout`, where the local server offers it): tap a sky figure. It is selected and its card opens, and the camera stays looking out.
5. **Developer drawer** (any of the pages above): open the cog.
   - The drawer shows "Developer tools" and the same folds in the same order. "Camera and view" is open first where it appears.
   - Move one slider in each fold (for example Marker threshold, Glow colour, Ring opacity, Sheet height): the picture or bar changes at once, as before.
   - Close and reopen the drawer: settings you changed are kept, and the frame-rate graph starts again.

Answer "looks the same" or name the step that differs.

## Done When

The owner's answer is recorded in Technical Evidence with the date. A difference becomes a repair note for draft 01 or 03 (or an Issue), and this check is repeated after the repair.

## Context Files

None for the owner. The coordinator starts the local server per `docs/agents/browser-policy.md` and gives the owner the link.

## Design References

`docs/agents/browser-policy.md` (the owner judges appearance on `localhost:5490`).

## Guardrails

TEST-01.

## Implementation Plan

1. The coordinator serves the merged branch on `localhost:5490` and sends the owner the steps above.
2. Record the answer.

## Boundaries

No code, no screenshots (browser policy). Offline owner: park per G-024 decision 7 ("Park it, move to the next").

## Technical Verification

Owner answer, 2026-11-22T03:42:37Z (on localhost:5490, dev server from branch o089-slim-viewer-coordinator at f4c43e2f, which contains T-418..T-421): step 1 "focus on saturn after overview does nothing"; after the rest, "check steps look good otherwise". Coordinator: reproduced the Focus/Overview framing headless with the shared driver on the branch and on main before O-089 (fcde39b5) with identical readouts (opening r 57.1 px; after Focus, Overview and Focus again r 7 px, centred), so it predates O-089; owner chose "Log it for later" -> I-200. The two "stuck on loading" reports were the preview server (stale after 19 h, then a checkout switch under it), not the code: a fresh server loads planets and Apollo 11 headless with no errors -> I-201 (preview tooling repair). No repair to T-418 or T-420 needed.

Owner validation only.

## Technical Evidence

Pending execution.

## Drift Notes

None.
