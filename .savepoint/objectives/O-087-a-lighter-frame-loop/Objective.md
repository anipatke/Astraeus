---
id: O-087
title: A lighter frame loop
status: planned
depends_on: [O-086]
release: G-024
priority: medium
rank: 6
---

# O-087: A lighter frame loop

## Outcome

Embedders stop paying every frame for work only the browser checks read: diagnostics are collected only when an opt-in flag is set, labels are placed without forced layout reads, the viewer does not re-render while nothing changes, and orbit lines skip re-sampling when time and look are unchanged.

## Why

AH-09 (all three): `sceneFrame.ts` projects paths, samples up to 512 points per group and `JSON.stringify`s readouts every frame. AH-10: `SceneLabels.ts` writes then reads layout up to three times per label per frame. AH-11: a 100 ms interval re-renders the coordinator while paused. AH-14: orbit lines re-sample about 129 states a frame. AH-15: update ranges accumulate for hidden orbit sets. Nobody profiled; measure first.

## Success Conditions

- A paused and a playing CPU profile recorded before and after, with diagnostics off and on.
- Diagnostics collected only with the opt-in flag, which the browser scripts set; a test proves no readout writes by default; the browser suite passes with the flag.
- Label sizes measured once per label or style change; collisions resolved arithmetically.
- No coordinator re-render while the clock snapshot is unchanged (render-count test).
- Unchanged-time early-out for orbit lines; one dirty range per orbit set, none while hidden.
- No visual change: owner look on localhost:5490.

## Architectural Considerations

`src/app/` frame stages (CODE-02); readouts remain the browser checks' mechanism.

## Boundaries

**In scope:**
- Frame-loop diagnostics, label placement, the paused re-render, orbit-line sampling, update ranges.

**Out of scope:**
- Lighting passes; resource disposal (O-092); coordinator restructuring (O-089).
