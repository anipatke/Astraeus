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
  - at: '2026-10-17T00:00:00Z'
    actor: {role: executor, session: builder-i022-i019-20261017}
    kind: repair_attempted
    note: 'Planet series now load only when needed (public build, first-load JS, ungzipped/gzipped): index 0 -> 0; Apollo 3.04 MB/1.05 -> 1.60/0.48; Earth-Moon 3.04/1.05 -> 1.24/0.36; Perseids 3.04/1.05 -> 2.68/0.94 (planets in composition; Geminids the same). Main app chunk 3,041.8 -> 1,185.1 kB (gzip 1,057 -> 345.6); planetModels chunk 1,391.8 kB is fetched only for a composition with a planet; Apollo data is its own 358 kB chunk. Split: src/core/planetSeries.ts (lazy loadPlanetSeries, throws before load), src/core/planetModels.ts (VSOP87A series + planet classes, imported from the library source modules so the compact tables leave the main chunk), Luna from the library source module, per-experience dynamic imports in src/main.tsx, src/app/planetNeeds.ts, vitest.setup.ts loads the series for tests. index.html loads no JS; each shower orbit file is fetched only when opened (probe: Apollo/Earth-Moon fetch no gmn-*.json). tests/planets.test.ts and all 895 tests pass (vitest 48 files, 1 skipped); tsc clean; public build + public-build-assets.mjs no matches. Browser (frozen tree, vite :5409, evidence docs/evidence/i022-20261016T115528Z and docs/evidence/i019-20261016T132151Z): zero console errors; failures not from this repair: synthetic-eccentric also fails on HEAD baseline (rerun-baseline-clean); sky flaked once and passed on rerun; sun and view-link and showers-perseids depend on T-063 perseids startView (sun passes with it removed); showers-perseids ?span=activity throws "story panel stream-shape: at falls outside the timeline window" from the panel content change. Unverified: owner timing on a real connection; the earlier rerun dirs marked INVALID used a stale server and should be ignored. Probe and before/after json in docs/evidence/i022-20261016T115528Z.'
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
