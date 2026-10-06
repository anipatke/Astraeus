---
id: I-005
title: Overlays cover the canvas and ReadableScale puts spacecraft inside body spheres
type: other
status: resolved
source:
  kind: report
  actor: {role: executor, session: T-009}
  at: '2026-10-06T00:00:00Z'
tasks: [T-008, T-009]
resolution:
  disposition: escalated
  actor: {role: planner, session: g002-plan-2026-10-06}
  at: '2026-10-06T12:30:00Z'
  reason: Owner decided every G-002 Issue is repaired or decided before the Goal closes.
escalated_to: O-005
history:
  - at: '2026-10-06T00:00:00Z'
    actor: {role: executor, session: T-009}
    kind: observed
    note: Found during T-009 validation; recorded as durable follow-up, not repaired.
  - at: '2026-10-06T12:00:00Z'
    actor: {role: planner, session: g002-plan-2026-10-06}
    kind: deferred
    note: Owner chose data fixes only (O-004) for G-002 in planning; this Issue waits for Spike 03 planning.
  - at: '2026-10-06T12:30:00Z'
    actor: {role: planner, session: g002-plan-2026-10-06}
    kind: escalated
    note: Owner reversed the Spike 03 deferral; repair or decision promoted into O-005 within G-002.
  - at: '2026-10-06T20:00:00Z'
    actor: {role: planner, session: g002-replan-2026-10-06}
    kind: escalated
    note: O-005 moved from G-002 to G-003 and was rewritten as the reusable UI shell; overlay coverage is repaired by the shell layout and ReadableScale radii stay unchanged, explained in the scale control (owner confirmed 2026-10-06).
---

# I-005: Overlays cover the canvas and ReadableScale puts spacecraft inside body spheres

## Summary

On a 1280×800 viewport the controls, mission panel and debug overlay occupy the upper left half of the canvas. Separately, ReadableScale compresses distance by 0.1 but not radii, so near Earth or the Moon the spacecraft lies inside the body spheres; the scene works around it with a final overlay pass that depth-tests only under TrueScale.

## Evidence

`docs/evidence/spike02/lunar-orbit-columbia-readable.png`; T-008 Technical Evidence limitations.

## Proof Needed

Owner choice of presentation treatment (collapsible HUD; radius treatment in ReadableScale); confirm in a screenshot at the same viewport.
