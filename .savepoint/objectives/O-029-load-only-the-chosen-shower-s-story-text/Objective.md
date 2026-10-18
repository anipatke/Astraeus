---
id: O-029
title: Load only the chosen shower's story text
status: planned
depends_on: []
release: G-007
---

# O-029: Load only the chosen shower's story text

## Outcome

The Showers page downloads only the chosen shower's story panels, not every demo's.

## Why

Owner, 2026-10-18 ("Yes add the rest"). `showerDefinition.ts` loads every `data/stories/*/panels.json` up front through an eager glob (a few kB; recorded as kept in Design.md during O-015).

## Success Conditions

1. A shower's panels are loaded on demand from its settings' `story.panels` path; other stories' files are not requested (browser check).
2. No shower names in engine or shell (ARCH-01); a made-up shower still gains panels from settings alone (ARCH-03).
3. Load budget updated; full run passes.

## Boundaries

Story panel loading on the Showers page only.
