---
id: O-015
title: Tell the Apollo 11 and Perseids stories in light panels
status: planned
depends_on: []
release: G-005
---

# O-015: Tell the Apollo 11 and Perseids stories in light panels

## Outcome

Short story panels open as playback reaches key moments: about seven in Apollo 11, and three in Perseids (the stream's shape, Earth's crossing, Swift–Tuttle). Tapping a marker reopens its panel. The Developer panel stays available on the demo pages.

## Why

Owner, 2026-10-16: "We should use some of the UI elements from planetary explorer to tell the story of Apollo 11 and Perseids + Tuttle comet or whats the point! lets leave the developer mode for the demo pages to show whats there".

## Confirmed Decisions (owner, 2026-10-16)

1. Keep it light: "panels with story elements pop up at markers on Apollo 11. One panel explaining the shape of Perseids, when the eart intersects, and another for Tuttle". No chapter system.
2. Apollo panels pop up as playback reaches them, pausing briefly. Tapping a marker reopens the panel.
3. New Goal G-005, built overnight on 2026-10-16 for the owner's morning look (owner: "New goal, build tonight").

## Success Conditions

1. Panel text, times and badges live in each story's settings file. A further story gets panels with no code, proved by a synthetic story in tests (ARCH-03).
2. Each panel shows a badge (observed, modelled or illustrative), and each fact has a source line (PROV-01).
3. Desktop shows a side panel; phone shows a bottom sheet with swipe-to-dismiss. Parts are ported from Planetary Explorer and credited in docs/DONOR_PROVENANCE.md.
4. Playback pauses briefly when a panel opens and resumes on its own or on a tap. Scrubbing past markers never stacks panels.
5. No story wording in engine or generic shell code (ARCH-01, nameCheck green). Existing browser scripts still pass.

## Architectural Considerations

Story panels are story data (owner rule: story data is never part of the engine). The shell reads a generic panel list from the experience definition. Settings-first: pause length and auto-open are settings with live controls.

## Boundaries

**In scope:** the panel capability, the Apollo 11 and Perseids panel files, and a config-only proof.

**Out of scope:** chapters, narration audio, a ground view, and new data sources.
