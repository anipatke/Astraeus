---
id: T-073
title: Spread the shower dot recalculation across frames so the Geminids glide
objective: O-017
status: planned
depends_on: [{task: T-067, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Spread the shower dot recalculation across frames so the Geminids glide

## Outcome

Playing a meteor shower at its default speed (one week per second) shows no periodic hitch. The Geminids glide like the Perseids; the dots stay where they are today at every moment the clock stops.

## User Check

Open the Geminids and press Play at the default speed and at 12 hours per second: the dots glide without a stutter. The Perseids, Apollo 11 and the made-up ring look and play as before.

## Done When

1. Repairs I-034. The points layer (`src/app/PointsView.ts`) computes the next fill, whose time is already known (`before + refillAfterMs`), in slices across the frames before it is needed, instead of all members in one frame; the slice size is a setting with a sensible default, not a hard-coded number (owner rule: tune via settings).
2. A seek, a reversal, a scale change or a clock that outruns the pending fill still gives exactly today's positions (falls back to a whole fill), so a paused or sought view never shows a half-finished fill. Unit tests cover the forward, backward, seek, overrun and scale-change paths on a made-up large group first (ARCH-03), then the shipped showers.
3. Measured with the I-034 probe (`docs/evidence/i034-frames-20261017/frames.mjs`) before and after: the Geminids' periodic long frames (100-117 ms every 0.4 s headless, before) are gone, and no frame is longer than the Perseids' longest by more than a small stated margin. Evidence in a fresh directory.
4. Gates: typecheck, tests, build, the lite browser check, `browser-showers.mjs` and `browser-public-showers.mjs` pass with zero console errors; before/after pictures of both showers match within the 0.024% tolerance.
5. Owner validation: the owner sees the Geminids glide.

## Context Files

`src/app/PointsView.ts`, `src/app/AstraeusScene.tsx` (where points layers update each frame), the listed-orbit group's `fillPositionsKm`, `data/showers/geminids.json`, `data/showers/perseids.json`, `.savepoint/issues/I-034-geminid-dots-jump-during-playback.md`.

## Design References

Design.md "Shower builder" and the points layer.

## Guardrails

ARCH-02 (frame layer only; State and the clock untouched), ARCH-03, TEST-01, TEST-03.

## Implementation Plan

1. Re-run the I-034 probe as the before figure.
2. Add a pending fill that advances a slice of members per frame toward the known next time; swap it in when complete; fall back to a whole fill when the clock passes it or jumps.
3. Tests on a made-up group, then the showers; measure after; pictures.

## Boundaries

No change to orbit data, the refill interval or the blend method; no worker threads unless slicing is shown not to be enough (then stop and report).

## Technical Verification

Configured gates, lite browser check, the two shower scripts and the I-034 probe. Evaluated under `agent-skills/references/check-method.md`.
