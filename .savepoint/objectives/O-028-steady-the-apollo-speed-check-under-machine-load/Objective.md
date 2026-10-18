---
id: O-028
title: Steady the Apollo speed check under machine load
status: planned
depends_on: []
release: G-007
---

# O-028: Steady the Apollo speed check under machine load

## Outcome

The spike02 browser check of Apollo 11's telemetry speed passes whenever the app is right, whatever else the machine is doing.

## Why

Owner, 2026-10-18 ("Yes add the rest"). `tools/validate/browser-spike02.mjs` (around line 193) failed under machine load in several full runs (C-071 run 1, the T-089 lane's first run) and passed alone each time.

## Success Conditions

1. The check reads the telemetry at a known simulation time (paused or seeked), not after wall-clock waits, so load cannot change what it reads.
2. A negative probe: a deliberately wrong speed still fails.
3. Several full runs under parallel load pass.

## Boundaries

That check only.
