---
id: I-022
title: Load the planet ephemeris only when an experience needs it
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: owner-chat-o014-20261012}
  at: '2026-10-12T09:45:00Z'
history:
  - at: '2026-10-12T09:45:00Z'
    actor: {role: owner, session: owner-chat-o014-20261012}
    kind: owner_decision
    note: 'Raised from C-022 observation 1. Owner chose "Load it only when needed, later": a follow-up after O-014, not inside it. Recorded by the orchestrator on the owner''s direct instruction.'
---

# I-022: Load the planet ephemeris only when an experience needs it

## Summary

T-048 registers the library's full VSOP87A series (the compact table was measured and rejected, with errors of 2,877–142,044 km). That raises the main bundle for every experience from 1,537.6 kB to 2,938.7 kB (458.8 → 1,022.5 kB gzip), including Apollo and the Earth–Moon Explorer, which mount no planets. The owner decided on 2026-10-12 to load the series only when a mounted composition contains a planet, as follow-up work after O-014.

## Evidence

- C-022 observation 1; T-048 drift note 2; `npm run build` output (`dist/assets/index-*.js` 2,938.67 kB, gzip 1,022.54 kB) at 769dffc.

## Proof Needed

- Planet-free experiences (Apollo, Earth–Moon Explorer) ship a main bundle at or near the pre-T-048 size, measured from `npm run build`.
- An experience whose composition contains a planet loads the series on demand, and planet positions still match the Horizons fixtures (`tests/planets.test.ts`).
- The configured gates and the browser scripts pass in a fresh run directory with zero console errors.
