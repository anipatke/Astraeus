---
id: T-073
title: Spread the shower dot recalculation across frames so the Geminids glide
objective: O-017
status: in_progress
stage: audit
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

## Technical Evidence

### Handoff summary (executor, worktree lane `o017-t073`, 2026-10-17)

Built side by side with T-071 as a lane. Built and unit-proven; browser measurement, pictures and the lite check are PENDING (the machine was busy with another builder's browser runs, so no browser script, dev server or frame probe was run here; the orchestrator runs them after merge). Task status not set done; router untouched.

### Design

- `PointGroup` gains an optional `fillPositionsRangeKm(t, out, start, end)` (same values as the whole fill for members start..end; others untouched). `createOrbitGroup` and `createListedOrbitGroup` implement it and their whole fill now calls it, so values are identical by construction. No State, clock or provenance change (ARCH-02).
- `PointsView` keeps a third spare `Fill`. After each frame's sync (and not in a frame that paid for a whole fill) it starts, then carries on, a pending fill for the next time, known in advance: `min(after + span, bounds.end)` when the clock moves forward, `max(before - span, bounds.start)` backward. Work runs in chunks of 1,024 members, in two phases (positions + centre offset + sums; then extent + scale mapping), in the same member order and arithmetic as a whole fill, until the per-frame time budget is spent. Only when complete and for the wanted time, direction and scale policy is it swapped in (old end becomes the spare).
- Fallbacks to today's whole fill: the clock passes the pair before the pending fill is done (overrun); a seek (outside `[before - span, after + span]`); a reversal of direction (pending dropped); a scale-policy change (pending dropped). A half-finished fill is never in the drawn pair. Paused: the pending fill may finish, which changes nothing drawn.
- Only groups that offer a range fill and hold more than 1,024 members slice; the Apollo 11, made-up ring and other small groups run exactly as before.
- Setting: `GroupLayer.refillSliceMs` (ms per frame spent on look-ahead), default `DEFAULT_REFILL_SLICE_MS = 8`; 0 turns it off; negative/NaN throws RangeError. Shower files may set `look.refillSliceMs` (optional, non-negative; neither shipped file sets it so the default applies), plumbed through `showerSettings.ts` and `showerStream.ts` like `refillAfterHours`. `PointsView`'s second constructor argument is an injectable clock (default `performance.now`) for tests.
- Known cost: the first two fills after a seek are whole (the opening seek, then the first slide, because the direction is not known until the clock has moved once).

### Per-criterion outcome

1. Repair implemented as above; slice size is a setting with a default. Budget not yet tuned on a real run: at one week per second a 72 h interval is about 0.43 s (about 13 frames at 33 ms); 51,115 members x 2 phases need roughly 100 chunks, so whether 8 ms per frame is enough to finish before the interval ends is for the probe to show (an overrun is safe, it just reverts to the old hitch). PENDING measurement; the owner may raise `look.refillSliceMs` in the Geminids file.
2. Covered by `tests/pointsLookAhead.test.ts` (made-up 3,072-member group, a view with look-ahead is compared position-for-position, centroid and extent with a view with `refillSliceMs: 0` at every step): forward, backward, mid-fill (one chunk per frame), seek mid-fill, overrun, reversal, scale change (true to readable and back), pause, bounds end, no range fill / switched off, invalid setting. Then `tests/pointsLookAheadShowers.test.ts` on the shipped Perseids and Geminids (sampled members, forward two-plus intervals, back, seek; asserts most fills were made a slice at a time) and the settings field.
3. PENDING: I-034 probe before/after (`docs/evidence/i034-frames-20261017/frames.mjs`) by the orchestrator, fresh evidence directory.
4. Typecheck, tests and build pass in the lane (below). PENDING: lite browser check, `browser-showers.mjs`, `browser-public-showers.mjs`, before/after pictures (0.024%).
5. PENDING: owner validation.

### Commands and results

- `npx tsc --noEmit`: clean.
- `npx vitest run`: 50 files, 900 tests passed (includes the 13 new tests; `listedOrbitGroup` frame-time test did not flake).
- `npm run build`: built (only the existing chunk-size warning).
- No browser script, dev server, picture capture or frame probe run.

### Files

Changed: `src/app/PointsView.ts`, `src/app/experienceDefinition.ts`, `src/core/pointGroup.ts`, `src/core/orbitGroup.ts`, `src/core/listedOrbitGroup.ts`, `src/experiences/showers/showerSettings.ts`, `src/experiences/showers/showerStream.ts`. Added: `tests/pointsLookAhead.test.ts`, `tests/pointsLookAheadShowers.test.ts`.

### Extra reads (logged)

- `src/core/pointGroup.ts`, `src/core/orbitGroup.ts`, `src/core/listedOrbitGroup.ts`, `src/core/twoBodyAdapter.ts`: the group fill had no range form, which slicing needs.
- `src/experiences/showers/showerSettings.ts`, `showerStream.ts`, `src/app/experienceDefinition.ts`: plumbing the setting like `refillAfterHours`.
- `tests/pointsLayer.test.ts`, `tests/showersMeasured.test.ts`, `tests/helpers/measuredOrbits.ts`, `tests/scenePlacement.ts`: test fixtures and helpers.

### Limitations

- Per-frame cost of `place()` (blending 51,115 members each frame) is unchanged and not addressed here.
- Look-ahead needs the clock direction; the first fills after a seek are whole.

## Drift Notes

Design "Shower builder" and the points layer gain: the optional `fillPositionsRangeKm` on `PointGroup`, the pending look-ahead fill with its fallbacks, and the `refillSliceMs` setting (layer field and `look.refillSliceMs`). Deferred to Task 7 (Design reconciliation), which accounts for each as reflected in Design.md.
