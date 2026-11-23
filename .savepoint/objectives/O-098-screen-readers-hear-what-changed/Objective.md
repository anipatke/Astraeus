---
id: O-098
title: Screen readers hear what changed
status: planned
depends_on: [O-097]
release: G-025
priority: medium
rank: 4
---

# O-098: Screen readers hear what changed

## Outcome

Explainer paragraph changes made through `setParagraphs` are announced politely, never on first render (belt #21, owner decision 5); the readout tile's accessible line uses its shown value text, names its marks and announces value changes politely and throttled (belt #28); the chart's accessible summary names its marks ("marks: 3:1 at 2.50, 5:2 at 2.82, …") (belt #18, summary half).

## Why

Lost accessibility: today these changes are silent or read as raw numbers.

## Success Conditions

Named in full when this Objective is detailed. Headline: a failing-before component test per part; no option added.

## Boundaries

**In scope:** live regions and accessible text in the explainer, readout tile and chart parts.

**Out of scope:** announcements for other parts; readout-tile placement.
