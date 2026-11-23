---
id: O-096
title: Failures and bad input said plainly
status: planned
depends_on: [O-095]
release: G-025
priority: high
rank: 2
---

# O-096: Failures and bad input said plainly

## Outcome

With no WebGL, `ready` rejects with a `SceneError` of a new code `no-webgl` (in `SceneErrorCode` and the generated README error table), the host's `onError` hears it when given, and a short readable message stays in the viewer's place instead of an empty element (belt #16). Shelf factories refuse uneven input with `bad-part` naming the field: a label that is empty after trimming; chart bins that overlap or run backwards, and marks outside the bins' range; a fractional colour-key count; an empty colour key (belt #31, owner decision 4).

## Why

The docs already promise both behaviours; hosts currently need their own watchers and checks. Owner decision 1: these checks ship in 0.11.0 as breaking changes with a one-line migration each.

## Success Conditions

Named in full when this Objective is detailed. Headline: a forced no-WebGL mount (`HTMLCanvasElement.prototype.getContext` returning null for WebGL) rejects `ready` with `no-webgl` and shows the message at 1440x900 and 390x844; one table test runs every shelf factory through the same bad inputs (blank text, fractions, backwards or overlapping ranges, out-of-range values, empty lists) so an uneven check cannot return.

## Boundaries

**In scope:** mount-time WebGL failure, the new error code, the message, the shelf input checks, the shared table test, CHANGELOG breaking entries.

**Out of scope:** WebGL loss after a successful first draw (already handled by context restore); host-supplied message text.
