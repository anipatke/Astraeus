---
id: I-132
title: The Scene class and the host link carry too many jobs
type: other
status: open
source:
  kind: report
  actor: {role: planner, session: api-review-20261101}
  at: '2026-11-01T06:30:00Z'
guardrail_ids: [STYLE-01]
severity: low
history:
  - at: '2026-11-01T06:30:00Z'
    actor: {role: planner, session: api-review-20261101}
    kind: deferred
    note: 'Review F15; internal, after 0.8.0 (owner plan, 2026-11-01).'
---

# I-132: The Scene class and the host link carry too many jobs

## Summary

`Scene` is one class of about 1,050 lines planning every concern; `src/api` imports `app/` 21 times and `shell/` 5 times; `ViewerLink` has four jobs (clock, views, camera, zones). Internal only; no public change.

## Evidence

[api review](../../docs/architecture/api-review-2026-11-01.md) F15; `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/viewerLink.ts`; C-136 style note (STYLE-10).

## Proof Needed

One planner per concern with a single assembler; input parsers in `api/` or `core/`; the public surface lock (O-053) unchanged by the split.
