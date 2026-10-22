---
id: T-151
title: Owner look on the preview and design notes brought up to date
objective: O-031
status: planned
depends_on: [{task: T-149, requires: clear}, {task: T-150, requires: clear}]
owner_validation: {required: true}
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

Pending execution.

## Drift Notes

Reconciles the two earlier steps' drift notes into Design.md.
