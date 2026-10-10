---
id: O-010
title: Show time windows and rates on the timeline
status: planned
depends_on: [O-008]
release: G-004
---

# O-010: Show time windows and rates on the timeline

## Outcome

If the O-008 audit confirms the gap: generic timeline support for spans (an activity window), a peak and a rate curve, plus provenance that can vary over time, proven with a non-meteor example as well as a shower.

## Why

The timeline knows only instant events and provenance is per object; Spike 03 recorded time-ranged provenance as a future story-layer need. A shower's activity window and rising and falling rate are the first concrete case.

## Success Conditions

Shaped after O-008. At minimum: a non-meteor configuration uses the same span/rate support, contract tests, shell checks at mobile and desktop, Apollo events unchanged.

## Architectural Considerations

The existing `TimelineEvent` contract is extended or complemented, not forked; the shell stays configuration-driven (ARCH-01).

## Boundaries

**In scope:** generic spans, rate curves, time-ranged provenance.
**Out of scope:** narration, chapters, shower-specific copy in the shell.
