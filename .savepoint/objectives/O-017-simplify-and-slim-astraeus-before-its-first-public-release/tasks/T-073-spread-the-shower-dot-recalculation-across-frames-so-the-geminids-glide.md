---
id: T-073
title: Spread the shower dot recalculation across frames so the Geminids glide
objective: O-017
status: done
depends_on: [{task: T-067, requires: clear}]
owner_validation: {required: true, accepted_check: C-053, scope: [showers glide on laptops; phone-class improvement measured; real-phone look still owed], accepted_by: {role: owner, session: o017-orchestrator-check-20261017}}
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

No change to orbit data or the refill interval. Owner decision 2026-10-17 (after the slicing build was measured): "It will need to run on phones and laptops, we should optimise for that." The blend may move to the graphics card (both fills uploaded once as attributes, the straight-line mix done in the vertex shader, uniform blend factor), so per-frame CPU work and buffer uploads no longer scale with member count; positions at every stopped moment stay identical to today's within float precision. No worker threads unless the GPU blend plus slicing is shown not to be enough (then stop and report).

## Owner Decision — 2026-10-17: optimise for phones and laptops

Measured after the slicing build (C-053 draft evidence, headless, software rendering, 12 s at one week per second): Perseids long frames gone (over 60 ms: 7 to 0); Geminids frames over 90 ms 28 to 0-2, but 8-11 frames over 60 ms remain with `look.refillSliceMs: 12`. Proof for the GPU blend adds a phone-like run: 390x844 viewport with Chromium CPU throttling (4x), both showers, before and after.

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

## Second Build Pass — GPU blend (executor, main checkout, 2026-10-17)

### Design

- `PointsView` now draws with two position attributes: `position` = the "before" fill and `positionTo` = the "after" fill, both as 32-bit values relative to an anchor (the before fill's centroid, kept in 64 bits), so they stay small and exact wherever the group is. The stock `PointsMaterial` is kept (same colour, size, opacity, transparency, `depthWrite: false`, per-frame `depthTest` rule for true scale) and extended with `onBeforeCompile`: the `begin_vertex` chunk becomes `position + uBlend * (positionTo - position) + uOffset`. Uniforms: `uBlend` (blend factor) and `uOffset` (anchor minus the floating origin, 64-bit subtraction then narrowed), so the floating-origin shift is a uniform, not a per-member subtraction.
- Upload: both attributes are rewritten (one pass over the members) only when a fill changed: opening fill, a slide, a seek, a scale-policy remap, a look-ahead fill swapped in. Each `Fill` has a `version` bumped when its drawn content changes. Frames that only move the blend or the camera upload nothing.
- Slicing is unchanged and still spreads the fill compute; the swap-in is what triggers the one attribute rewrite.
- CPU per frame now: `sync` (blend factor, centroid, extent, look-ahead slice within `refillSliceMs`), `place` (a few uniforms). One O(count) attribute rewrite per slide (every `refillAfterMs`).
- `memberLocalPosition` and a new `blendInputs` getter compute/return the exact numbers handed to the shader (32-bit arithmetic); tests prove them.
- Limitation: the per-slide attribute rewrite is whole (two Float32Array passes over 51,115 members, well under a millisecond-scale loop, but not sliced).

### Tests

- Added `tests/pointsGpuBlend.test.ts` (made-up 500-member ring about the Moon, ARCH-03): shader inputs equal the 64-bit exact blend within 1e-4 Earth radii at a seek, between fills, after a slide, with the origin moved (attributes untouched, only the offset changes) and after a true-to-readable scale change; attributes are rewritten only on a fill change.
- Fixed a stale assertion in `tests/pointsLookAheadShowers.test.ts` (Geminids file now sets `refillSliceMs: 12`; Perseids use the default).
- All existing point/ring/belt/listed tests pass unchanged through `memberLocalPosition`.

### Gates (this pass)

- `npx tsc --noEmit`: clean. `npx vitest run`: 51 files, 902 passed, 1 skipped. `npm run build`: built. `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `node tools/validate/public-build-assets.mjs dist`: ok, 42 files checked, load budget held.
- Lite browser (dev server on 5484): see results below.
- Frame-timing probes (desktop and 390x844 with 4x CPU throttle, both showers): NOT run by the executor; PENDING, the orchestrator times them on a quiet machine.

### Browser evidence (this pass, 2026-10-17, machine busy with other builders, load average about 10)

- Lite: `PLAYWRIGHT_CORE=... ASTRAEUS_URL=http://localhost:5484/app.html ASTRAEUS_EVIDENCE_DIR=docs/evidence/o017-t073-gpu-lite-20261017T023324Z node tools/validate/browser-lite.mjs`: 26/26 loads passed, zero console errors (both showers, synthetic ring/belt/listed/eccentric, Apollo, pages).
- Pictures: `node tools/validate/capture-experience-pictures.mjs --out docs/evidence/o017-t073-gpu-after-20261017T023324Z --port 5484`, then diff against `docs/evidence/o017-before-20261016T205125Z`: first run maxOver16Pct 0.0473 (apollo11-moon-desktop, 613 px; Apollo does not use the changed path beyond its small group, and the earlier T-070 set had none there), over tolerance. Rerun alone, `docs/evidence/o017-t073-gpu-after2-20261017T023324Z`: maxOver16Pct 0.0189, 7 identical, within 0.024%; geminids-desktop 0.0002%, perseids-desktop 0.0011%, perseids-phone 0.0018%.
- Dev server on 5484 stopped (the picture script owned it at the end); no frame probes run (PENDING for the orchestrator). `browser-showers.mjs` and `browser-public-showers.mjs` not run here (O-017 Decision 8: lite and pictures only).

## Owner Completion — 2026-10-17

Owner: "cant reach, but thats OK i think previous version ran ok and this should be better" (after the laptop look at the T-073 build: "thats way smoother"). Accepted with C-053; a real-phone look at the T-075 build is still owed once it is on a preview link or live.
