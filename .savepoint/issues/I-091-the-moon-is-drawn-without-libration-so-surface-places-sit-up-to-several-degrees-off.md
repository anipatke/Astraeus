---
id: I-091
title: The Moon is drawn without libration, so surface places sit up to several degrees off
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:51:07Z'
severity: medium
history:
  - at: '2026-10-24T02:51:07Z'
    actor: {role: planner, session: improvements-intake-20261024}
    kind: observed
    note: 'Split from I-009 item 5. Owner, 2026-10-24: "Add it as an improvement issue".'
---

# I-091: The Moon is drawn without libration, so surface places sit up to several degrees off

## Summary

The Moon's orientation is an approximate tidal lock with no libration (`packages/astraeus/src/core/bodies/moon.ts`, `TIDAL_LOCK_LIMITATION` and `LANDING_SITE_OFFSET`). An IAU-placed landing site sits 254 km (8.4°) from the same selenographic coordinates on this Moon at Apollo 11 touchdown. Every developer placing anything on the Moon's surface inherits the error, so this is an engine improvement, not demo work.

## Evidence

moon.ts lines 4-5 (documented limitations); docs/ASTRAEUS_SPIKE_02.md (the 254 km measurement); I-009 item 5.

## Proof Needed

A published lunar orientation model (for example the IAU WGCCRE rotation elements for the Moon, or a lunar libration series with its source recorded, PROV-01) drives the Moon's orientation in `src/core/`; a test compares the sub-Earth point or a surface site's direction with JPL Horizons (or the IAU model) at several dates and records the residual; the landing-site offset at touchdown is re-measured and the known-limitation text updated to the new figure; ARCH-02 and ARCH-05 hold (one definition, presentation unchanged); the Apollo demo and the planets demo still draw the Moon (fast suite).
