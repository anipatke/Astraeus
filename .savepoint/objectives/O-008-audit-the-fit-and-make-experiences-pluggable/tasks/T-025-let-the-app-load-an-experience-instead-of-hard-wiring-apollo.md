---
id: T-025
title: Let the app load an experience instead of hard-wiring Apollo
objective: O-008
status: done
depends_on: [{task: T-024, requires: clear}]
owner_validation:
    required: false
    accepted_check: ""
planned_by: {role: planner, session: g004-plan-2026-10-10}
check_waiver:
    task: T-025
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-10T20:30:11Z"
---

# Let the app load an experience instead of hard-wiring Apollo

## Outcome

Generic app code mounts whichever experience it is given through a plug-in contract, Apollo is the first experience supplied through it, and Apollo looks and behaves exactly as before.

## Astraeus Hypothesis

- **Capability tested:** the app layer as reusable presentation infrastructure, not an Apollo app.
- **Contract reused:** `ExperienceConfig`, `MissionConfig`/`TrackedBody`, `AstraeusShell` props, `SceneControls`, `ScalePolicy`, `SimulationClock`.
- **Gap or hypothesis:** `App.tsx` imports Apollo directly and the scene assumes Earth + Moon + anchored spacecraft; the hypothesis is that a thin experience contract removes that coupling without core changes.
- **Generic change:** an experience plug-in contract in `src/app/` shaped by the T-024 audit; Apollo assembled in `src/mission/` and passed in; Apollo-only scene parts (anchors, discrepancies, mission panel) become optional layers.
- **Perseids-independent evidence:** behaviour-preserving Apollo regression here; the synthetic experience in the next Task proves reuse (ARCH-03).

## User Check

Open the app and confirm Apollo starts, plays, scrubs, focuses, follows and switches scale as before; read the evidence that all four browser scripts passed with zero console errors.

## Done When

1. Generic `src/app/` code no longer imports `src/mission/`; the entry point chooses the experience.
2. The contract matches the T-024 proposal, or each deviation is recorded in Drift Notes.
3. Existing tests pass unmodified except tests of moved wiring, each change named (TEST-03).
4. `browser-shell.mjs`, `browser-spike03.mjs`, `browser-spike02.mjs` and `browser-anchor-labels.mjs` pass with zero console errors, writing to a fresh run directory (historical evidence preserved).
5. `src/core/` is unchanged.

## Context Files

`docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`, `.savepoint/objectives/O-008-audit-the-fit-and-make-experiences-pluggable/Objective.md`, `src/main.tsx`, `src/app/App.tsx`, `src/app/mission.ts`, `src/app/EarthMoonScene.tsx`, `src/app/TrackedBodyView.ts`, `src/app/MissionPanel.tsx`, `src/app/DebugControls.tsx`, `src/app/metricReadouts.ts`, `src/app/CameraController.tsx`, `src/mission/apollo11.ts`, `src/shell/experience.ts`, `src/shell/AstraeusShell.tsx`, `tests/missionScene.test.ts`, `tests/controls.test.ts`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-spike03.mjs`, `tools/validate/browser-spike02.mjs`, `tools/validate/browser-anchor-labels.mjs`.

## Design References

Design: Components/Codebase Map (`src/app/`, `src/mission/`), Interfaces and Data Flow.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm the T-024 contract proposal exists; return REPLAN REQUIRED if it is missing or needs a core change.
2. Define the experience contract type in `src/app/`.
3. Assemble Apollo's experience in `src/mission/` and pass it from the entry point.
4. Make Apollo-only scene and developer panels optional layers driven by the experience.
5. Run gates and the browser fuller gate.

## Boundaries

No Perseids code, no core changes, no new scale policies, no visual redesign.

## Technical Verification

Focused tests while iterating; handoff runs `npm run typecheck`, `npm run build`, `npm test` and the four browser scripts (scene-affecting fuller gate). Optional Task Check per `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session, 2026-10-10/11. Nothing waived; no Task Check requested yet.

**Per-criterion outcomes**
1. Met. `src/app/` has no `src/mission/` import (new test `tests/experienceDefinition.test.ts` checks every file); `src/main.tsx` passes `apollo11Definition` to `App`.
2. Met with deviations (Drift Notes). Contract is `ExperienceDefinition` in `src/app/experienceDefinition.ts`.
3. Met. No existing test edited. One new test file added.
4. Met. All four scripts ran against `vite --port 5199` at 2026-10-10T20:23Z with `"errors": []`: `browser-shell.mjs`; `browser-spike03.mjs` (ASTRAEUS_EVIDENCE_DIR=docs/evidence/o008-t025-run1/spike03); `browser-spike02.mjs` (.../spike02); `browser-anchor-labels.mjs docs/evidence/o008-t025-run1/anchor-labels`. Earlier evidence directories untouched. `browser-shell.mjs` writes no files unless its screenshot env vars are set; none were.
5. Met. `git status src/core` shows no changes.

**Commands:** `npm run typecheck` pass; `npm run build` pass (chunk-size warning only); `npm test` 172 pass, 1 fail at first: `apollo11Reconstruction.test.ts` "matches the committed data package and report". It failed identically with this Task's changes stashed, so it predates the Task; logged as I-014 and repaired there (tolerance compare). Fresh `npm test` after that: 173 of 173 pass.

**Files changed:** src/app/App.tsx, src/app/EarthMoonScene.tsx, src/main.tsx. **Added:** src/app/experienceDefinition.ts, src/mission/apollo11Definition.tsx, tests/experienceDefinition.test.ts, docs/evidence/o008-t025-run1/. **Read:** all Context Files except tools/validate sources (only grepped for output paths) and tests/controls.test.ts. **Extra reads (logged):** package.json, tsconfig.json, .savepoint/config.yml, .savepoint/Guardrails.md (ARCH-03 line), parts of src/app/DebugControls.tsx, metricReadouts.ts and MissionPanel.tsx, and greps over tests/ and src/ for imports, to size the change.

**Limitations:** browser script pass was judged from their printed JSON (`errors: []`), not their exit codes. Visual identity with before was not compared pixel-wise; the owner's User Check is still open. The test file `tests/apollo11Reconstruction.test.ts` was changed under I-014, outside this Task's scope; see that Issue.

## Drift Notes

Record contract deviations from T-024 and any Design notes deferred to T-026.

- Earth/Moon is still mandatory in the scene. `sceneLayers` lists `earth-moon` but the frame loop is built around it; making it optional is a larger scene change. Left for T-026 to decide when the synthetic experience needs it.
- `MissionPanel`, `metricReadouts` and `DebugControls` stay in `src/app/` (audit section 4 said move). They do not import `src/mission/`; moving them would change several test imports. Only the wiring moved to `src/mission/apollo11Definition.tsx`.
- Optional `camera` limits from the audit proposal are not added; scene constants remain.
- No Design.md notes are deferred beyond the items above.
