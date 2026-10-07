---
id: T-016
title: Audit Planetary Explorer's UI for patterns worth reusing
objective: O-005
status: done
depends_on: []
owner_validation:
    required: false
    accepted_check: ""
planned_by: {role: planner, session: g002-replan-2026-10-06}
check_waiver:
    task: T-016
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-07T07:17:06Z"
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

Started 2026-10-07. Runtime dependency gate reports Ready.

Extra reads: `.savepoint/config.yml` to identify required handoff gates (project policy).

### Targeted extra reads (before access)

- Donor `.savepoint/visual-identity.md`: `docs/design.md` redirects here; establish current typography and token intent.
- Donor `src/features/hotspots/useHotspotSelection.ts` and `src/features/moon/HotspotAutoRotate.tsx`: marker imports selection hook; verify focus tween and manual interruption.
- Both repositories’ `package.json`: verify dependency adoption against installed stack and gate scripts.

- Targeted donor filename lookup for `HotspotAutoRotate`: historical audit omits its directory; guessed moon path absent. Read actual hotspot path if found to verify tween. This is an extra read, not a missing planned Context File.

### Acceptance outcomes — 2026-10-07

1. Satisfied: audit classification table covers all thirteen brief section 1 areas, with donor paths, classification, reason and destination on every row (including explicit none for excluded elements).
2. Satisfied: dependency table declines Tailwind/zustand/drei with reasons grounded in inspected packages/source. Visual token table specifies type/fallbacks, spacing, palette, shape and easing transfer.
3. Satisfied: minimum shell list and ExperienceConfig sketch grow the existing MissionConfig through an app projection, reuse core events/provenance and avoid speculative primitives (STYLE-05/07/09).
4. Satisfied: current UI disposition table names DebugControls, DebugOverlay, MissionPanel, AnchorLabels and camera, with viewer/developer responsibilities.
5. Satisfied: unresolved/local-use-only code licence restated; DONOR_PROVENANCE has Spike 03 source candidates and records that actual adaptations remain future work.
6. Satisfied: git status/diff show only audit, provenance and lifecycle/evidence documents changed. No production code, dependency, generated-data or donor edits.

### Verification

- Source/document review of both deliverables against all six Done When criteria: satisfied as above; no runtime/visual claims made for proposed interactions.
- Fresh configured gates on 2026-10-07, approximately 07:15:31–07:15:57 UTC: `npm run typecheck` exit 0; `npm run build` exit 0 (Vite 8.3.2, existing >500kB chunk advisory); `npm test` exit 0, 7 files / 127 tests passed, duration 25.70s. Toolchain Node v22.22.2, npm 10.9.7; package declares TypeScript 7.0.2 and Vitest 5.0.3.
- `git diff --check`: exit 0. Lint gate is null. No scene-affecting change, so browser fuller gate not applicable.
- Files read: all Task Context Files, router, owning Objective, task skill, Guardrails and the targeted extra reads logged above. Initial combined Astraeus read was truncated; App/mission/DebugControls were reread separately to cover the omitted content. Actual extra focus tween file read: donor `src/features/hotspots/HotspotAutoRotate.tsx`; moon path lookup failed and was corrected before making claims.
- Files changed: `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `docs/DONOR_PROVENANCE.md`, this Task record and owning Objective status. Router already selected O-005/T-016/G-003 and was not changed.
- Limitations: source audit only; donor interaction/appearance not browser-validated. Proposed accessibility, responsive layout, label suppression, camera refinement and font delivery require later implementation evidence. No licence clearance claimed.
- Handoff: Task remains in_progress at audit. No Check, technical CLEAR, owner acceptance or Task-check waiver recorded. Owner decides completion and optional independent Task Check; mandatory Full Objective Check remains required.

## Drift Notes

No material plan gap or architecture drift. Plain CSS/React state and projected DOM labels implement the planned donor-pattern extraction without adopting optional donor dependencies. Historical donor audit path for HotspotAutoRotate required a targeted lookup; every planned Context File existed.
