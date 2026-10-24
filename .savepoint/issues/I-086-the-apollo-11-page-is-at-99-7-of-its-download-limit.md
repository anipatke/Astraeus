---
id: I-086
title: The Apollo 11 page is at 99.7% of its download limit
type: other
status: open
source:
  kind: report
  actor: {role: owner, session: improvements-intake-20261024}
  at: '2026-10-24T02:47:47Z'
severity: low
history:
  - at: '2026-10-24T02:47:47Z'
    actor: {role: planner, session: improvements-intake-20261024}
    kind: observed
    note: 'Owner, 2026-10-24: "can we add the fixes as issues, and iterate through and fix them with agents" (after "no more demos, here on in only improvements").'
---

# I-086: The Apollo 11 page is at 99.7% of its download limit

## Summary

The public Apollo 11 page measures 4,355,880 B raw against a 4,370,000 B limit (99.7%) and 2,815,247 B gzip against 2,900,000 B (O-042 T-176 measurement in packages/astraeus-site/tools/validate/load-budget.mjs line 64). Any small engine change can fail the public-build check.

## Evidence

load-budget.mjs lines 46 and 64.

## Proof Needed

Measure what the page loads and find a behaviour-preserving saving (for example code the Apollo page no longer needs since it was rebuilt on the public API, or the on-demand developer panels from O-043 already helping); record before and after on a public build (`ASTRAEUS_PUBLIC_BUILD=1`). Do not raise a limit without the owner's OK; if no safe saving exists, stop and report the options. Public-build output check passes.
