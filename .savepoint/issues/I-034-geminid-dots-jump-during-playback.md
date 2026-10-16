---
id: I-034
title: Geminid dots jump during playback
type: defect
status: open
source:
  kind: report
  actor: {role: checker, session: o017-orchestrator-check-20261017}
  at: '2026-10-17T08:30:00Z'
history:
  - at: '2026-10-17T08:30:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner, 2026-10-17: "geminids stream is a bit janky"; asked which kind, chose "Dots jump or stutter in playback". Not yet reproduced by the orchestrator. Deferred until T-067 (CAMS/Yale removal, which edits the shower files) lands, to avoid two sessions editing the same files.'
  - at: '2026-10-17T08:35:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner: "Persseids is smooth by comparison". Same playback rate and refill interval in both settings files, so the difference lies in the stream (orbit shape or member count), consistent with both candidate causes.'
  - at: '2026-10-17T08:40:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner: "geminids is janky at speeds more than 12 hours per second". At 12 h/s a 72 h refill happens every 6 s of real time; at the default one week per second, every 0.43 s. A blend error would show at any speed, so a speed threshold points to cause 2 (the main-thread fill of 51,115 orbits causing a hitch whose frequency grows with playback speed). Measure the fill frame time first.'
---

# I-034: Geminid dots jump during playback

## Summary

During playback the Geminid dots step or stutter instead of gliding. The owner did not report it for the Perseids.

## Evidence

Both showers play at 604,800 s per second (one week per second, `data/showers/*.json` `timeline.rateSecondsPerSecond`) and refill exact positions every 72 hours of scene time (`look.refillAfterHours`), so a fill happens about every 0.43 s of real time, and in between the dots move on a straight-line blend of two fills (`src/app/PointsView.ts`, `DEFAULT_REFILL_AFTER_MS` overridden by the shower setting).

Two likely causes, not yet measured:
1. **Blend error on short, tight orbits.** Geminid orbits follow 3200 Phaethon: period about 1.4 years, perihelion about 0.14 AU. Near perihelion a dot sweeps a large curved arc in 72 hours, so the straight-line blend cuts the corner and the dot jumps back onto its orbit at the next fill. Perseid orbits (period about 133 years) move slowly, so the same blend looks smooth.
2. **Fill cost.** The shipped Geminid set is 51,115 orbits against 25,588 Perseids (`data/stories/geminids/gmn-iau-4.json` 5.6 MB, `data/stories/perseids/gmn-iau-7.json` 2.9 MB). Each fill runs on the main thread in one frame, so a larger set gives a longer hitch every 0.43 s.

## Proof Needed

1. Reproduce at the default playback rate on desktop and phone sizes: measure the largest per-frame jump of a dot near perihelion and the frame time of a fill frame, for both showers.
2. Repair the cause found. Options: a shorter refill interval for this shower as a settings change (cost measured), a blend that follows the orbit's curvature, or spreading a fill across frames. Prefer configuration if it is enough; any engine change is proven on made-up configuration first (ARCH-03).
3. The owner sees the Geminids glide; the Perseids, Apollo and the made-up ring are unchanged; the shower browser scripts and the lite check pass with zero console errors.
