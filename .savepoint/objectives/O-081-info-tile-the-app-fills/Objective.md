---
id: O-081
title: Story components off the shelf, readout tile and chart
status: planned
depends_on: [O-080]
release: G-023
priority: medium
rank: 3
---

# O-081: Story components off the shelf, readout tile and chart

## Outcome

Two more shelf components following the same contract: a readout tile (a live label and value with an optional scale line, updated by the app; desktop under the bar at the left, phone a one-line strip above the timeline that expands on tap) and a simple chart (for example counts by orbit size, with a highlighted range the app sets). The decision note may move components between O-080 and O-081.

## Why

G-023 owner decision 3: a status that is a live number is a readout tile, otherwise it sits in About. Closest Calls' floating readout and Belt's Kirkwood chart are the worked examples.

## Success Conditions

Named outcomes only; detailed when O-080 is done.

## Architectural Considerations

Same shelf contract, bar and panel rules and shared look as O-080; the tile is one more area in O-079's panel rule.

## Boundaries

**In scope:**
- The readout tile and the chart, their entries on the public catalogue page, README, CHANGELOG, API lock, tests, a synthetic proof.

**Out of scope:**
- Further components (added later as real stories need them); outside apps; version bump and publishing.
