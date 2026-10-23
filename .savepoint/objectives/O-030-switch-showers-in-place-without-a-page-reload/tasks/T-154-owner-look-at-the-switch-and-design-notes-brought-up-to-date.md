---
id: T-154
title: Owner look at the switch and design notes brought up to date
objective: O-030
status: planned
depends_on: [{task: T-153, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o030-planning-20261023}
---

# Owner look at the switch and design notes brought up to date

## Outcome

The owner has switched showers and planets on the preview at phone and desktop size and confirmed the change is smooth, with no flash, the right start view and working back and forward; Design.md describes the in-place switch and the lazy shower story.

## User Check

On the preview (`localhost:5490`), at desktop and phone size: Showers, switch Perseids to Geminids and back a few times; Planets (local), switch between several planets; press the browser's back and forward; open a story panel after a switch; reload on a switched address. Say whether anything flashed, stuck, opened in the wrong place or showed the old one's leftovers. The checklist is in Technical Evidence.

## Done When

- A short owner checklist (the moves above, per demo and per size) is written in Technical Evidence and the owner's verdict recorded in their words.
- Anything the owner reports is fixed here if small, or recorded for a repair step.
- Design.md reconciles the two drift notes (lazy shower story; in-place switch), the `src/shell/` row and the load-budget figures.
- Configured gates pass. No browser runs (the Full Objective Check runs `npm run check:browser` once).

## Context Files

`.savepoint/Design.md`, `tools/validate/load-budget.mjs`, and the Technical Evidence of this Objective's two earlier steps.

## Design References

Design: Showers switch (T-091); Boot loader (O-024 T-094); the `src/shell/` row.

## Guardrails

TEST-01, TEST-03; AGENTS.md Astraeus Project Rules (the owner judges looks on the preview, no screenshots).

## Implementation Plan

1. Write the checklist from the two steps' evidence.
2. Run the owner's look and record the verdict.
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
