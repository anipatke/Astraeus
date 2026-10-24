---
id: I-086
title: The Apollo 11 page is at 99.7% of its download limit
type: other
status: in_progress
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
  - at: '2026-10-24T14:05:00Z'
    actor: {role: executor, session: improvements-repair-I-086}
    kind: repair_attempted
    note: 'Measured on a public build (ASTRAEUS_PUBLIC_BUILD=1, scratch outDir) with load-budget.mjs: Apollo 11 page 4,342,461 B raw / 2,811,207 B gzip, 11 files, against 4,370,000 / 2,900,000 (99.4% raw, 96.9% gzip; 27,539 B and 88,793 B headroom; before O-043 the recorded figure was 4,355,880 / 2,815,247). No behaviour-neutral saving found: the page loads app.js 1,488,126, Earth 4k 1,559,348, Moon 2k 565,978, stars 284,317, apollo11Scene 350,791 (Columbia samples, 2244 rows), scene 35,278; no duplicate chunks, no unneeded eager file, validation.json is used by the story text. Limits not raised. Options needing an owner choice: re-encode the Earth 4k picture (looks), round the Columbia/Eagle sample digits in the reconstruction tool (data fidelity), trim engine app.js (larger piece of work). Only the measurement comment in load-budget.mjs changed.'
---

# I-086: The Apollo 11 page is at 99.7% of its download limit

## Summary

The public Apollo 11 page measures 4,355,880 B raw against a 4,370,000 B limit (99.7%) and 2,815,247 B gzip against 2,900,000 B (O-042 T-176 measurement in packages/astraeus-site/tools/validate/load-budget.mjs line 64). Any small engine change can fail the public-build check.

## Evidence

load-budget.mjs lines 46 and 64.

## Proof Needed

Measure what the page loads and find a behaviour-preserving saving (for example code the Apollo page no longer needs since it was rebuilt on the public API, or the on-demand developer panels from O-043 already helping); record before and after on a public build (`ASTRAEUS_PUBLIC_BUILD=1`). Do not raise a limit without the owner's OK; if no safe saving exists, stop and report the options. Public-build output check passes.
