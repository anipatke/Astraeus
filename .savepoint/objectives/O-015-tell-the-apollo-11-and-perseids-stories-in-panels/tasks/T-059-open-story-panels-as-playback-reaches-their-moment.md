---
id: T-059
title: Open story panels as playback reaches their moment
objective: O-015
status: planned
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o015-plan-20261016}
---

# Open story panels as playback reaches their moment

## Outcome

Any experience can list story panels in its settings. Each panel opens when playback reaches its time (pausing briefly), sits on a marker you can tap to reopen it, and shows a title, short text, a badge (observed, modelled or illustrative) and its sources.

## User Check

Open a synthetic or demo story with two panels, press play, and watch each panel open in turn and pause playback briefly. Tap a marker to reopen a panel. Scrub back and forth past the markers: panels never stack. On a phone the panel is a bottom sheet that swipes away.

## Done When

1. Panel schema (id, time UTC or event/anchor id, title, body, badge, sources[]) validated with named errors (STYLE-06), read from the experience definition. No story wording in shell code (ARCH-01; nameCheck green).
2. Auto-open on forward playback crossing a panel's time; brief pause, then resume on its own (pause length a setting with a live control in Developer > Display settings) or on a tap. Seeking or scrubbing does not auto-open. Only one panel is open at a time.
3. Markers on the timeline (and, where the panel names a body or anchor, a marker in the scene) reopen the panel.
4. Desktop side panel; phone bottom sheet with swipe-to-dismiss. Ported from Planetary Explorer's SidePanel, BottomSheet, HotspotMarker and Badge, with each port recorded in docs/DONOR_PROVENANCE.md.
5. Contract tests on a synthetic story (ARCH-03); browser script `tools/validate/browser-story-panels.mjs` writes to a fresh evidence directory. Existing browser scripts still pass with zero console errors.

## Context Files

`src/shell/AstraeusShell.tsx`, `src/shell/experience.ts`, `src/shell/TimelineBar.tsx`, `src/shell/timelineModel.ts`, `src/shell/ProvenanceBadge.tsx`, `src/shell/style.css`, `src/app/App.tsx`, `src/app/experienceDefinition.ts`, `/home/user/code/planetary-explorer/src/features/hotspots/SidePanel.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/BottomSheet.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/HotspotMarker.tsx`, `/home/user/code/planetary-explorer/src/shared/components/Badge.tsx`, `docs/DONOR_PROVENANCE.md`.

## Design References

Design sections on the shell, experience definitions and settings.

## Guardrails

ARCH-01, ARCH-03, PROV-01, TEST-01..03, STYLE-06, STYLE-09.

## Implementation Plan

1. Define the panel schema and validator in the shell's experience types.
2. Port the panel and sheet parts, restyled to the shell's look.
3. Add the crossing detector (forward playback only), the pause setting and one-at-a-time state.
4. Add timeline markers, and scene markers where a body or anchor is named.
5. Write tests on a synthetic story, then the browser script.

## Boundaries

No chapters, narration or audio. No engine changes. Don't change State or the camera's behaviour.

## Technical Verification

Gates from `.savepoint/config.yml` plus the scene-affecting browser scripts (AGENTS.md project rules). Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
