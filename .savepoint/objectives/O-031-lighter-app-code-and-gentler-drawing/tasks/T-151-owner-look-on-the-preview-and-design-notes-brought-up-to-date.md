---
id: T-151
title: Owner look on the preview and design notes brought up to date
objective: O-031
status: done
check_waiver:
  task: T-151
  reason: 'owner asked for one full fresh check at the end of O-031 instead. Owner quote: "orchestrate the delivery of O-31. Ask questions before execution, one full test at end"'
  actor: {role: owner, session: o031-orchestration-20261023}
  recorded_at: '2026-10-23T00:00:00Z'
depends_on: [{task: T-149, requires: clear}, {task: T-150, requires: clear}]
owner_validation: {required: true, accepted_by: {role: owner, session: o031-orchestration-20261023}, accepted_at: '2026-10-23T00:16:39Z', verdict: 'all fine, run the final check'}
planned_by: {role: planner, session: o031-planning-20261023}
lane: close
---

# Owner look on the preview and design notes brought up to date

## Outcome

The owner has looked at every demo on a phone and a desktop with the scene drawing on demand and the trimmed download, and confirmed nothing freezes or looks stale; Design.md describes both changes.

## User Check

On the preview (`localhost:5490`), on a phone and a desktop, for Apollo, the planets and the showers: pause, leave it a few seconds, then tap a body, drag, zoom, open the cog and a story panel, change a setting and press play. Say whether anything froze, lagged or looked stale. The checklist is in Technical Evidence.

## Done When

- A short owner checklist (the paused-then-act moves above, per demo and per size) is written in Technical Evidence and the owner's verdict is recorded in their words.
- Anything the owner reports is fixed in this step if small, or recorded for a repair step.
- Design.md reconciles the two drift notes (draw on demand; the shared script's split), the `src/app/` row and the load-budget figures.
- Configured gates pass. No browser runs (the Full Objective Check runs `npm run check:browser` once).

## Context Files

`.savepoint/Design.md`, `tools/validate/load-budget.mjs`, and the Technical Evidence of the two earlier steps of this Objective.

## Design References

Design: the `src/app/` row; Current Technical State; Public site and launch (O-016).

## Guardrails

TEST-01, TEST-03; AGENTS.md Astraeus Project Rules (the owner judges looks on the preview, no screenshots).

## Implementation Plan

1. Write the checklist from the two steps' evidence.
2. Run the owner's look on the preview and record the verdict.
3. Reconcile Design.md.
4. Run the gates.

## Boundaries

No new features. No screenshots. No browser runs.

## Technical Verification

Configured gates at hand-off; the owner's recorded look. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

**Owner checklist** (built from T-149's paused-animation list; preview `localhost:5490`, branch o031-lighter-app at 1ae421a9). For each of Apollo 11 (`/app.html`), Planets (`/app.html?experience=planets`) and Showers (`/app.html?experience=showers`), at desktop and at phone size:

1. Pause, leave it 3 seconds untouched (the scene stops drawing here).
2. Drag to turn the view, then let go: it moves and comes to rest smoothly, no jump.
3. Scroll or pinch to zoom.
4. Tap a planet or moon (Apollo: the Moon): the camera flies there and the information card opens.
5. Use a camera button (Focus, Follow, Overview).
6. Open the cog and change a look setting (for example Sun halo size or label size): the scene updates at once.
7. Switch Readable / True scale.
8. Move along the timeline, and jump to the next event: the scene shows the new time.
9. Open a story panel from its marker.
10. Press play: it moves smoothly.
11. Phone size only: rotate, or resize the window: the scene redraws at the new size, not stretched.
12. Reload and watch the first seconds: planet and moon pictures appear (none stays blank or blurry after loading). This is T-149's one named risk: a picture arriving late could stay stale until the next touch.

Owner verdict (2026-10-23T00:16:39Z, after walking the checklist on the preview): "all fine, run the final check". Nothing to fix.

Design.md reconciled: a new O-031 paragraph in Current Technical State (draw only when needed: `decideDraw`, `drawThisFrame`, `useDrawWakes`, the 30-frame grace, `data-frames-drawn` and its driver functions; the shared `app.js` measurement and the dropped cut; pixel ratio at the default cap). T-149's drift note is reflected there; T-150's was withdrawn with the cut.

Gates: none run by this step beyond the records (Design and Task records only; no code changed since T-149's merge, where `npm test` passed 1513). The Full Objective Check runs the full gate and `npm run check:browser` once.

Marked done by the coordinator at 2026-10-23T00:16:39Z on the owner's authority (O-031 run: "Yes, same as O-038", whose rule was "I mark them as they pass"; the owner's look is recorded above).

## Drift Notes

Reconciles the two earlier steps' drift notes into Design.md.
