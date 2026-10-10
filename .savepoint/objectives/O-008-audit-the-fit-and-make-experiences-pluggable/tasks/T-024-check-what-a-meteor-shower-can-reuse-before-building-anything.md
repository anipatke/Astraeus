---
id: T-024
title: Check what a meteor shower can reuse before building anything
objective: O-008
status: in_progress
stage: audit
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: g004-plan-2026-10-10}
---

# Check what a meteor shower can reuse before building anything

## Outcome

`docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md` tells later Tasks exactly which Astraeus contracts a meteor shower reuses, which are genuine gaps, and which needs belong only in the Perseids adapter, and it confirms, reshapes or drops O-009 and O-010.

## Astraeus Hypothesis

- **Capability tested:** whether the core, app and shell contracts generalise beyond Earth–Moon plus sampled spacecraft.
- **Contract reused:** `State`, `Trajectory`, `SampledTrajectory`, `Provenance`, `TimelineEvent`, `ScalePolicy`, `ExperienceConfig`, `MissionConfig`/`TrackedBody`, camera requests, metrics.
- **Gap or hypothesis:** planning reads suggest five gaps — app hard-wires Apollo; one Trajectory per body; instant events only; two fixed Earth-radius scales; no ground view (out of scope, record only).
- **Generic change:** none; research only.
- **Perseids-independent evidence:** each GAP row names the synthetic or non-meteor case that would prove the generic fix.

## User Check

Open the audit and confirm every Perseids need has a row marked REUSED, GAP or FIXTURE-ONLY, that every GAP says why it belongs in Astraeus rather than the Perseids adapter, and that the last section says what happens to O-009 and O-010.

## Done When

1. Rows cover particles/population, radiant, activity window, peak and rate, scale range (atmosphere to stream), provenance (including time-ranged), camera overview/focus/follow, metrics, timeline and labels, and the ground view (recorded as out of scope).
2. Each GAP row answers the brief's five required items and the "why Astraeus, not the adapter" challenge (brief rule 7).
3. The "many ordinary Trajectories" alternative is evaluated against the group-of-objects hypothesis with a stated measure (for example object count, memory or per-frame `stateAt` cost from a quick throwaway measurement or reasoned bound), and a decision is recorded.
4. It proposes the experience plug-in contract shape used by the next Task: what an experience supplies (shell config, scene layers, metrics, clock start) and what generic app code owns.
5. It lists the published Perseids facts needed later (109P/Swift-Tuttle orbit, radiant, activity window, peak, ZHR) with candidate sources and states the `illustrative` boundary; no data is fetched or committed.
6. No production code changes.

## Context Files

`docs/ASTRAEUS_SPIKE_04_BRIEF.md`, `.savepoint/objectives/O-008-audit-the-fit-and-make-experiences-pluggable/Objective.md`, `docs/ASTRAEUS_SPIKE_03.md`, `src/core/state.ts`, `src/core/trajectory.ts`, `src/core/body.ts`, `src/core/sampledTrajectory.ts`, `src/core/provenance.ts`, `src/core/events.ts`, `src/core/scalePolicy.ts`, `src/app/App.tsx`, `src/app/mission.ts`, `src/app/EarthMoonScene.tsx`, `src/app/TrackedBodyView.ts`, `src/app/CameraController.tsx`, `src/app/metricReadouts.ts`, `src/shell/experience.ts`, `src/shell/scaleModel.ts`, `src/shell/timelineModel.ts`, `src/mission/apollo11.ts`.

## Design References

Design: Architecture, Components/Codebase Map, Interfaces and Data Flow. Idea: Success Criteria 1–4. Brief: all sections.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, STYLE-05, STYLE-07.

## Implementation Plan

1. Read the Context Files and list every contract with its current assumptions.
2. Map each Perseids need to a contract and classify it.
3. Evaluate the many-Trajectories alternative and record the decision with its measure.
4. Sketch the plug-in contract and the scene-layer split.
5. Record O-009/O-010 disposition and the published-facts list.

## Boundaries

Research and documentation only. No `src/` changes, no dependencies, no data downloads.

## Technical Verification

Document review against Done When; record that configured gates were unaffected or run them if any file outside `docs/` and `.savepoint/` changed. Optional Task Check per `agent-skills/references/check-method.md`.

## Technical Evidence

Executed 2026-10-11 (executor session, Sonnet 5.5). Output: `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`.

**Per-criterion outcomes**
1. Rows: audit §1 table covers particles, radiant, activity window, peak/rate, scale range, provenance (incl. time-ranged), camera, metrics, timeline/labels, ground view (out of scope). Met.
2. GAP rows: §2 answers the five brief items and "why Astraeus, not the adapter" for GAP-1…GAP-4; GAP-5 is a minor deferred item. Met.
3. Many-Trajectories alternative: §3 measured 1k/10k/100k `SampledTrajectory.stateAt` per frame (1.4 / 9.0 / 59 ms; 3 / 29 / 288 MB). Decision recorded: rejected for ~10³+ populations. Met, as a single-machine bound.
4. Plug-in contract shape: §4. Met.
5. Published facts and `illustrative` boundary: §5; nothing fetched or committed. Met.
6. No production code changes: `git status` shows no `src/` or dependency changes. Met.

**Commands run:** throwaway benchmark (scratchpad only, bundled with a temporary npx-fetched esbuild, nothing added to the project); `git status`. No configured gate was run: only `docs/` and `.savepoint/` changed.

**Files read:** all Context Files except `src/app/TrackedBodyView.ts`, `src/core/sampledTrajectory.ts` and `src/mission/apollo11.ts`, which were read in part (first ~60 lines, first 60 lines, and the `buildApollo11Experience` section). `src/app/EarthMoonScene.tsx`, `src/app/CameraController.tsx`, `src/app/metricReadouts.ts` and `src/shell/timelineModel.ts` were read through grep and section reads rather than in full.
**Extra reads (outside Context Files):** `src/shell/metrics.ts` (grep of its Metric kinds, to confirm there is no rate kind and that `radec` exists); `agent-skills/savepoint-task/SKILL.md` (the skill tool could not find it).
**Files changed:** `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md` (new), this Task, `O-008` Objective status.

**Limitations:** benchmark numbers come from one machine and a 4-sample trajectory; they bound the alternative, not the future provider. Published Perseids facts are candidate sources only and unverified. No Task Check requested or waived yet.

## Drift Notes

Record architecture deltas for O-008's later Tasks and for O-009/O-010 replanning.

- O-009 confirmed (batch position provider + points layer); O-010 reshaped to time windows, optional time-ranged provenance and a rate metric (audit §6).
- Camera limits and `far` are scene constants; the plug-in Task should let an experience supply them (audit §4 item 5).
- `createObjectMetrics` and `MissionPanel` encode Apollo concepts and move to the Apollo side in the plug-in Task.
- Deferred to the Design reconciliation Task named in O-008: none yet; Design.md is not changed by this Task.
