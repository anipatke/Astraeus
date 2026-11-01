---
id: I-131
title: The planets demo and the site use the engine's internal way in
type: drift
status: resolved
source:
  kind: report
  actor: {role: planner, session: api-review-20261101}
  at: '2026-11-01T06:30:00Z'
guardrail_ids: [API-01]
severity: medium
resolution:
  disposition: escalated
  actor: {role: planner, session: api-review-20261101}
  at: '2026-11-01T07:00:00Z'
  reason: 'Owner brought it into 0.8.0 ("lets do this right"); promoted into O-059 (build the planets demo and site on the front door), G-016.'
escalated_to: O-059
history:
  - at: '2026-11-01T06:30:00Z'
    actor: {role: planner, session: api-review-20261101}
    kind: deferred
    note: 'Review F13; owner D6: retire the internal ExperienceDefinition way in over later Goals. In 0.8.0 only the shrinking deep-import allowlist (O-053). After 0.8.0.'
  - at: '2026-11-01T07:00:00Z'
    actor: {role: planner, session: api-review-20261101}
    kind: escalated
    note: 'Owner: in 0.8.0, not after. Promoted into O-059.'
---

# I-131: The planets demo and the site use the engine's internal way in

## Summary

Features reach the internal `ExperienceDefinition` before the public `Scene` (sky, body sets, desktop textures, scene centre, label, developer sections, switcher, alternates). The planets demo makes 65 deep imports into engine internals and the site draws the internal `App`, so the richest demo cannot be built on the public API, and site-only switchers live inside the engine's `App`.

## Evidence

[api review](../../docs/architecture/api-review-2026-11-01.md) F13; `packages/astraeus/src/app/experienceDefinition.ts` (lines 160–220 at review time); `packages/astraeus-demo-planets/` deep imports; `packages/astraeus-site/src/main.tsx`.

## Proof Needed

The planets demo builds on `Scene` gap by gap, each gap closed by a public capability; the site's switchers move out of the engine; the per-package deep-import counts (O-053) reach zero for the demos.
