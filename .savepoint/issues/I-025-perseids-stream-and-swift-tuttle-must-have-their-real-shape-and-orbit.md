---
id: I-025
title: Perseids stream and 109P/Swift-Tuttle must have their real shape and orbit
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: owner-chat-o014-live-look-20261013}
  at: '2026-10-13T08:49:53Z'
history:
  - at: '2026-10-13T08:49:53Z'
    actor: {role: owner, session: owner-chat-o014-live-look-20261013}
    kind: owner_decision
    note: 'Owner, after the live look at Perseids against https://www.meteorshowers.org/view/Perseids: "O11 MUST have the right shape and orbit of perseids and tutle". Recorded by the orchestrator on the owner''s direct instruction as a must-have for O-011 (success conditions 6 and 8), not a condition on O-014.'
---

# I-025: Perseids stream and 109P/Swift-Tuttle must have their real shape and orbit

## Summary

The Perseids experience still uses the stand-in stream from T-038's first build: 10,000 invented members whose elements are spread uniformly (hard-edged) around the parent orbit, with large spreads in only two elements (RAAN ±24°, true anomaly ±40°) and the others near zero. That produces a flat four-sided sheet covering a ~40° arc near Earth's crossing, not a stream along the comet's orbit. The owner had already rejected this local patch as a "floating block" (O-011 replan). The parent orbit is drawn only for peak ±180 days, because the full orbit (aphelion ≈ 51 AU) exceeds the camera reach (T-047 drift note).

The reference (`docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md`, https://www.meteorshowers.org/view/Perseids) shows streams from meteoroid orbits measured by NASA's CAMS network (computed by P. Jenniskens), tracing the shower's orbit out into the outer solar system.

The owner's decision: O-011 **must** give the Perseids stream and 109P/Swift-Tuttle their right shape and orbit.

## Evidence

- `data/showers/perseids.json` `stream.spread`; `src/core/orbitGroup.ts:98` (uniform spread `base + (2·random − 1)·width`).
- Owner's look on 2026-10-13 ("why does perseids look like a square sheet"); the T-049 screenshot `docs/evidence/o014-t049-20261012-211714/owner/desktop-perseids-planet-orbits-oblique.png` (local).
- O-011 Objective success conditions 6 (stream data decision) and 8 (Perseids to the reference spec, the owner's look against the reference site required).

## Proof Needed

- 109P/Swift-Tuttle's whole orbit is drawable and reachable by the camera (aphelion ≈ 51 AU), from its published elements.
- The stream comes from measured meteoroid orbits (CAMS or another published source) if a usable source exists. Otherwise it is an `illustrative` swarm whose distribution has a measured or cited basis, not uniform hard-edged boxes, with members spread along the orbit as the reference shows, and that choice is recorded with its provenance (PROV-01).
- Earth's crossing of the stream at the right dates is visible, and the activity window still relates to it.
- The owner's look against meteorshowers.org accepts the shape and the orbit.
- Every capability involved stays generic (orbit-group distributions, long-orbit paths, camera reach), proven on made-up configuration first (ARCH-03), with no shower naming in generic code.
