---
id: T-016
title: Audit Planetary Explorer's UI for patterns worth reusing
objective: O-005
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: g002-replan-2026-10-06}
---

# Audit Planetary Explorer's UI for patterns worth reusing

## Outcome

`docs/PLANETARY_EXPLORER_UI_AUDIT.md` exists and tells the later Tasks exactly which donor interaction patterns, visual language and dependencies Astraeus will keep, adapt or reject, and where each lands in `src/shell/` or `src/app/`.

## User Check

Open the audit and confirm every brief section 1 area (navigation/selection, focus transitions, camera, labels, info panels, responsive layout, mobile, typography, hierarchy, hover/selection, gestures, transitions/easing, metadata presentation) has at least one classified row or an explicit "nothing found".

## Done When

1. Each row records donor source path, KEEP / ADAPT / APP-SPECIFIC / REJECT, reason and Astraeus destination (brief deliverable A).
2. It decides, with reasons, whether to adopt Tailwind, zustand and drei, and how the donor's visual tokens (type, spacing, colour, easing) are carried over.
3. It names the proposed generic shell primitives and the shape of the experience configuration that grows from the existing `MissionConfig`, keeping only primitives that the Apollo stress test needs (brief section 13, STYLE-05).
4. It records which current Astraeus UI (`DebugControls`, `DebugOverlay`, `MissionPanel`, `AnchorLabels`, camera) is replaced, kept, or moved behind the developer toggle.
5. Licence status of reused donor code is restated (unresolved, local use only) and `docs/DONOR_PROVENANCE.md` gets a Spike 03 section listing the donor sources to be adapted.
6. No production code changes; the donor repository is not edited.

## Context Files

`docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `docs/DONOR_PROVENANCE.md`, `src/app/App.tsx`, `src/app/mission.ts`, `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `src/app/MissionPanel.tsx`, `src/app/AnchorLabels.ts`, `src/app/CameraController.tsx`, `src/app/style.css`, `src/mission/apollo11.ts`, `/home/user/code/planetary-explorer/docs/design.md`, `/home/user/code/planetary-explorer/docs/astraeus-extraction-audit.md`, `/home/user/code/planetary-explorer/src/app/App.tsx`, `/home/user/code/planetary-explorer/src/app/store.ts`, `/home/user/code/planetary-explorer/src/app/globals.css`, `/home/user/code/planetary-explorer/src/shared/components/Badge.tsx`, `/home/user/code/planetary-explorer/src/features/moon/ExplorerView.tsx`, `/home/user/code/planetary-explorer/src/features/moon/ControlBar.tsx`, `/home/user/code/planetary-explorer/src/features/moon/CameraController.tsx`, `/home/user/code/planetary-explorer/src/features/moon/useGestures.ts`, `/home/user/code/planetary-explorer/src/features/moon/GestureLayer.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/BottomSheet.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/SidePanel.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/InfoPanelRouter.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/BodyOverviewDetails.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/HotspotMarker.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/HotspotLayer.tsx`, `/home/user/code/planetary-explorer/src/features/hotspots/useSwipeToDismiss.ts`, `/home/user/code/planetary-explorer/src/features/intro/MobileGlobeMenu.tsx`.

## Design References

Design: Components/Codebase Map (`src/app/`), Boundaries (donor read-only). Brief sections 1, 6, 7, 8, 13.

## Guardrails

TEST-01, STYLE-05, STYLE-07, STYLE-09.

## Implementation Plan

1. Read the Astraeus UI files to list what exists and what the brief replaces.
2. Read the donor files; follow imports only where a pattern cannot be judged otherwise, logging each extra read.
3. Classify each candidate and record source, reason and destination.
4. Decide dependencies and visual tokens; propose the primitive list and configuration shape.
5. Update `docs/DONOR_PROVENANCE.md` with the Spike 03 donor list and licence note.

## Boundaries

Research and documentation only. No `src/` changes, no dependency installs, no donor edits.

## Technical Verification

Document review against Done When; configured gates are not affected (record that no code changed). Optional Task Check per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
