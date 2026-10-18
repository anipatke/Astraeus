---
id: O-015
title: Tell the Apollo 11 and Perseids stories in light panels
status: done
depends_on: []
release: G-005
last_check: C-072
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

## Confirmed Decisions (owner, 2026-10-18)

4. **Plain words** (owner: "Stories need to be plainsplained. i.e. they still feel too sciency, we want people to engage with it, not be turned off by stats and numbers, so lets review the copy for each of these"). Voice: warm and plain, short sentences and everyday comparisons, like a good museum label (owner chose "Warm and plain" over playful or documentary).
5. **Figures and honesty notes fold away**: exact times, numbers, measured-versus-reconstructed notes and sources sit in one folded "details and sources" section under the story, closed by default (owner chose the folded section). The badge still shows observed, modelled or illustrative at a glance, so PROV-01 holds.
6. **Stories on every demo** (owner: "Extend stories to all demos"): Geminids, Earth–Moon and Jupiter–Io get about three panels each, at moments inside each demo's own timeline.
7. **Sources collapsible** (owner: "Believe I had asked for Sources to be a collapsible section"): built by O-020 T-081 (O-020 Decision 4); this Objective's folded section builds on it rather than adding a second one.
8. The copy is reviewed by the owner reading the panels on the preview; T-059, T-061 and T-062 stay open and are accepted with the rewritten copy.

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

**Out of scope:** chapters, narration audio, a ground view, and new data sources (new panels use facts with published sources, recorded in each panel's sources).

## Owner Closure — 2026-10-18

All six Tasks done; Full Objective Recheck C-072 CLEAR (supersedes C-071); I-031, I-038, I-039 verified. Owner, asked to close the story panels work: "Story panels are good".
