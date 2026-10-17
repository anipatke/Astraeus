---
id: I-035
title: The Moon's orbit line has a moving gap opposite the Moon
type: defect
status: open
source:
  kind: report
  actor: {role: checker, session: o017-orchestrator-check-20261017}
  at: '2026-10-17T23:59:00Z'
history:
  - at: '2026-10-17T23:59:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner: "in the moons orbit directly on the other side of the moon there is a break in the orbit line that moves with the moon". Also visible in the owner''s Earth and Moon card screenshot (the line near Earth is broken).'
  - at: '2026-10-18T00:40:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'First repair in lane i035-orbit-gap (bc11d78: window 1.1 periods) measured the gap at 3,215-7,952 km for the Moon and 0 km for Io, and closed it, but the top-down picture shows the ends as a short double line. Shown to the owner side by side; owner chose "Fade the line out at both ends" over keeping the overlap or drawing a closed osculating ellipse. Builder asked to replace the overlap with a per-path end fade.'
  - at: '2026-10-18T00:55:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner: "ACTUALLY planetary explorer had a cool trailing fading orbit effect". Donor (owner''s own project) OrbitalTrail.tsx: faint full ring, opacity 0.18; OrbitalTrailArc.tsx: trailing arc behind the moon over 1/5 of the orbit, 16 segments, quadratic fade 0.65 to 0, brighter when zoomed out. Builder asked to reproduce it for composition paths on the real path, combined with the end fade, every number a setting with the donor values as defaults.'
  - at: '2026-10-18T01:00:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner: "can we bring in as fully toggable and configurable". Each layer (base ring, end fade, trailing arc, zoom brighten) switchable on and off, and every number a live control in the settings panel, defaulting to the path data and resettable; generic for every composition path.'
  - at: '2026-10-18T01:40:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner looked at the lane build 393e900 on the local preview (faint ring with faded ends, trailing arc, zoom brighten, Developer > Display settings > Orbit lines controls, Io without end fade): "like it all". To be checked and resolved after merging with T-079/T-080.'
  - at: '2026-10-18T01:45:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner, same look: "EXCEPT - IOs, line jumps rather than moving smoothly with the moon". Likely the arc follows sample indices on the rolling window (steps at the sample spacing, a jump at each rebuild), visible for fast Io. Builder asked to drive the fade from time per vertex every frame and start the arc at the body''s live position, with a per-frame check at Io''s fastest rate.'
  - at: '2026-10-18T02:40:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner on 0e94678 (Io smooth arc): "no it just looks like its shooting laser beams. But only at the start then it stabilises?" Likely stale ring-window samples after the load/seek clock jump, joined to the live head as long chords until the next rebuild. Builder asked to sample the arc per frame from the body''s own trajectory and rebuild the ring immediately when the clock leaves or jumps within its window, with tests and a browser check for chords after load and seek.'
  - at: '2026-10-18T03:20:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner on 1d8c8a7: "NO, now it looks like a dashed line following it around. Why cant we just copy the same thing we did in the other one". Likely two coincident 1-px lines (ring and arc) interleaving. Builder told to port Planetary Explorer''s OrbitalTrailArc technique directly (16 ribbon segments, donor opacity 0.65 t^2, depthWrite off, double-sided), bent onto the real path, with the ring hidden under the arc.'
---

# I-035: The Moon's orbit line has a moving gap opposite the Moon

## Summary

The Moon's orbit line is a rolling window exactly one sidereal month wide, centred on the clock (`src/assets/compositions.ts` line 61, `paths: [{ body: "moon", spanMs: SIDEREAL_MONTH_MS }]`, drawn by `compositionPathLayer` in `src/app/PathView.ts` as an open polyline over `span: { windowMs }`). Its two ends sit half a month either side of now, which is directly opposite the Moon, and the real Moon does not retrace its path each month (solar perturbation, apsidal and nodal motion), so the ends do not meet: a gap that moves with the Moon. Io's line is built the same way (`compositions.ts` line 79, `spanMs: IO_PERIOD_DAYS * 86_400_000`).

## Evidence

Owner's report; owner's Earth and Moon card picture (`docs/evidence/o017-cards-v2-20261017/owner-earth-moon.png`); code read above.

## Proof Needed

1. Reproduce: measure the gap (distance between the window's first and last sample, in km and in pixels at the default view) for the Moon and Io at a few dates.
2. Repair: draw slightly more than one period (a small stated overlap, as a setting of the composition path, not a hard-coded number) so the ends overlap, for every composition path; no change to the positions themselves.
3. Pictures of Earth and Moon, Apollo 11 and Jupiter and Io show a closed line; the lite check passes; the owner sees no gap.
