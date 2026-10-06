---
id: I-003
title: Propagated misses at next anchors reach tens of thousands of km
type: other
status: resolved
source:
  kind: report
  actor: {role: executor, session: T-009}
  at: '2026-10-06T00:00:00Z'
tasks: [T-007, T-009]
resolution:
  disposition: escalated
  actor: {role: planner, session: g002-plan-2026-10-06}
  at: '2026-10-06T12:30:00Z'
  reason: Owner decided every G-002 Issue is repaired or decided before the Goal closes.
escalated_to: O-005
history:
  - at: '2026-10-06T00:00:00Z'
    actor: {role: executor, session: T-009}
    kind: observed
    note: Found during T-009 validation; recorded as durable follow-up, not repaired.
  - at: '2026-10-06T02:46:56Z'
    actor: {role: executor, session: t009-rework-2026-10-06}
    kind: repair_attempted
    note: Causal wording corrected under I-006 after C-002. Gravity explains some translunar error (A-10>A-11 falls to 17 km with Earth J2 + Moon + Sun) but not A-32>A-33 or A-34>A-35; those are recorded as unexplained. Summary and Proof Needed updated. Issue stays open.
  - at: '2026-10-06T04:03:54Z'
    actor: {role: executor, session: t010-2026-10-06}
    kind: repair_attempted
    note: T-010 applied owner-approved A-33/A-34 speed overrides. Largest misses are now A-32>A-33 25,125 km (unexplained, T-011) and A-34>A-35 15,344 km (two-body; n-body closes it to 38 km).
  - at: '2026-10-06T05:35:00Z'
    actor: {role: executor, session: o002-recheck-2026-10-06}
    kind: repair_attempted
    note: "T-013 (owner decision 2026-10-06): EQJ-north heading reference for Moon-referenced anchors plus Earth J2/Moon/Sun coasts. Raw misses now A-10>A-11 16.8 km, A-32>A-33 212.6 km, A-34>A-35 38.4 km, Earth coasts 4.5-120 km, lunar orbit 116-1,273 km (mostly timing). Every coast is smoothed onto its next anchor; raw miss and correction published per coast (docs/APOLLO11_RECONSTRUCTION.md, generated files). No visible step remains (1 s scan, T-009). Tens-of-thousands-km misses no longer occur. Issue stays open for the owner's Spike 03 choice on showing uncertainty, and for verification."
  - at: '2026-10-06T12:00:00Z'
    actor: {role: planner, session: g002-plan-2026-10-06}
    kind: deferred
    note: Owner chose data fixes only (O-004) for G-002 in planning; this Issue waits for Spike 03 planning.
  - at: '2026-10-06T12:30:00Z'
    actor: {role: planner, session: g002-plan-2026-10-06}
    kind: escalated
    note: Owner reversed the Spike 03 deferral; repair or decision promoted into O-005 within G-002.
  - at: '2026-10-06T20:00:00Z'
    actor: {role: planner, session: g002-replan-2026-10-06}
    kind: escalated
    note: O-005 moved from G-002 to G-003 and was rewritten as the reusable UI shell; this Issue is repaired there through the provenance affordance and known limitations (owner confirmed 2026-10-06).
---

# I-003: Propagated misses at next anchors reach tens of thousands of km

## Summary

The reconstructed path misses the next NASA anchor by up to 44,194 km (A-34>A-35, 10,951 m/s) and 25,125 km (A-32>A-33). Each miss is a step in the data between segments. It is published and unthresholded by design, but it limits what the path can honestly show.

Corrected after C-002 (see I-006): coasts are two-body or patched two-body, and more complete gravity (Earth J2, Moon, Sun) materially improves some translunar segments, for example A-10>A-11 from 10,945 to 17 km. It does **not** resolve the two largest return-phase misses: A-32>A-33 stays at 25,031 km and A-34>A-35 at 37,893 km / 10,831 m/s, with no burn between A-34 and A-35. Update (T-010): A-34>A-35 was traced to a probable A-33/A-34 speed transcription error. With the owner-approved overrides, the reconstruction's two-body step is 15,344 km, and n-body closes it to 38 km. A-32>A-33 remains unexplained (T-011, I-006).

## Evidence

`docs/APOLLO11_RECONSTRUCTION.md`, Segments table; `data/apollo11/generated/columbia.json` `discontinuities`.

## Proof Needed

Owner decision for Spike 03: keep and display the uncertainty, or reduce it. A perturbed propagator is not a demonstrated fix for the largest misses. Resolve the I-006 anchor and convention questions first, then re-measure every miss from `npm run apollo11:reconstruct` and `node tools/validate/anchor-consistency.mjs`.
