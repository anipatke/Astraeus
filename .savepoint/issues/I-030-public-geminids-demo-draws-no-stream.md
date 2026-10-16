---
id: I-030
title: The public Geminids demo draws no stream and says nothing
type: defect
status: resolved
source:
  kind: report
  actor: {role: checker, session: o011-orchestrator-check-20261016-night}
  at: '2026-10-16T22:20:00Z'
tasks: []
history:
  - at: '2026-10-16T22:20:00Z'
    actor: {role: checker, session: o011-orchestrator-check-20261016-night}
    kind: observed
    note: 'Found while probing the public build (ASTRAEUS_PUBLIC_BUILD=1, vite preview :5451) of committed HEAD 8130ff6 during the night Task Checks. Launch blocker for O-016.'
  - at: '2026-10-16T22:30:00Z'
    actor: {role: executor, session: i030-builder-20261016}
    kind: repair_attempted
    note: 'Repair built, not closed (needs a Check). (1) Geminids ship GMN IAU 4 orbits: data/stories/geminids/gmn-iau-4.json (5.63 MB, 2.29 MB gzipped, 51,115 orbits, Dec 2024 and Dec 2025, CC BY 4.0); data/local/gmn-iau-4.json (6.6 MB, git-ignored); geminids.json stream.source gmn with stream.sources.gmn; CAMS stays local. GMN facts in docs/ASTRONOMY_VALIDATION.md (median Vg 33.84 vs 33.8; busiest bin 261.5-262.0 vs 261.6; minimum distance +0.52 d from the peak; radiant 0.18 deg off from 41,300 members) by tests/showersMeasuredGeminids.test.ts. (2) Production offers only shipped sources: offeredSources() in measuredOrbits.ts; the source switch is listed only when two sources can be read (hidden in a public build); ?source=cams falls back to the shipped source in src/main.tsx. (3) An absent stream says in plain words, in the stream item panel, that the build has no orbits (no fetch command in production); the text lives in showerDefinition.ts absentStreamObject, so no shell edit was needed. (4) Gates: typecheck ok; npm run build ok; ASTRAEUS_PUBLIC_BUILD=1 build ok and public-build-assets validator exit 0 with no matches; vitest 882 passed, 1 skipped, the one failure being the T-052 timing test (listedOrbitGroup 30,000-member fill), which passes alone (20/20) and fails only under machine load average 24-35. Browser (dev :5404, public preview :5405, both stopped): browser-showers.mjs both showers exit 0 zero errors; browser-showers-gmn.mjs dev and ASTRAEUS_SHIPPED=1 exit 0 zero errors (its public CAMS case now expects the shipped fallback); new tools/validate/browser-public-showers.mjs shows both streams drawn from the shipped copy, ?source=cams falling back, no source switch, and the absent message, zero console errors. Evidence: docs/evidence/i030-20261016T110308Z/ (before/pubgem-before.png, public/, showers/, gmn/). Credits added to README.md, assets.html, docs/DONOR_PROVENANCE.md.'
  - at: '2026-10-17T10:00:00Z'
    actor: {role: owner, session: owner-chat-20261017}
    kind: owner_decision
    note: 'Owner accepted the repair in chat ("accept the rest"), 2026-10-17. Recorded by the orchestrator on direct instruction; not a technical CLEAR.'
resolution:
  disposition: accepted
  actor: {role: owner, session: owner-chat-20261017}
  at: '2026-10-17T10:00:00Z'
  reason: Accepted by the owner in chat on 2026-10-17, recorded by the orchestrator on direct instruction.
---

# I-030: The public Geminids demo draws no stream and says nothing

## Summary

In the public build, `app.html?experience=shower-geminids` loads with zero console errors, shows Phaethon, the planets and the activity window, but draws no meteor stream and shows no message. The Geminids read CAMS orbits only (`data/showers/geminids.json`, `stream.source: "cams"`), and CAMS is local-only. A production build reads only a story's shipped copy (`src/experiences/showers/measuredOrbits.ts:193`), so the load returns `absent`. README.md links to this demo (`?experience=shower-geminids`).

The same applies to the Perseids "Orbits from CAMS" switch, which is shown in the public build's Developer panel. Choosing it (or `?source=cams`) gives an empty stream with no explanation.

## Evidence

- Screenshot `/tmp/claude-1000/-home-user-code-Astraeus/9f41da67-d196-4cdd-b989-572f65eae286/scratchpad/probes/pubgem.png` (to be copied into the repair's evidence directory). The public Perseids demo draws its stream (`pubper.png`).
- `src/main.tsx:38`: `?source=cams` is honoured whatever the build.

## Proof Needed

1. The public Geminids demo draws a measured stream from a shippable source. The recommended source is GMN GEM rows (CC BY 4.0), shipped as `data/stories/geminids/gmn-iau-4.json` the same way as the Perseids. Otherwise the demo is removed from the public links. GMN figures are added beside the CAMS ones in ASTRONOMY_VALIDATION (median Vg, busiest bin, minimum distance, radiant), the same as for the Perseids.
2. A production build shows only the source switches whose data it ships, and never offers a choice that draws nothing.
3. When orbits are absent in any build, the stream area says so in plain words instead of showing nothing.
4. browser-showers passes for both showers, the public-build validator passes, and a public-build browser probe shows both streams drawn, with evidence in a fresh directory.
