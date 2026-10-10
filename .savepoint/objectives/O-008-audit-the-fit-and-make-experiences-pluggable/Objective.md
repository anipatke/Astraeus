---
id: O-008
title: Audit the meteor-shower fit and make experiences pluggable
status: done
depends_on: []
release: G-004
---

# O-008: Audit the meteor-shower fit and make experiences pluggable

## Outcome

A written gap audit that classifies every Perseids need against existing Astraeus contracts, and an app that loads its experience through a generic plug-in boundary: Apollo is the first experience behind it and a minimal synthetic experience proves the boundary works. No Perseids code.

## Why

The brief (`docs/ASTRAEUS_SPIKE_04_BRIEF.md`) requires reuse before extension and a precise gap before any change. Planning reads already show the app hard-wires Apollo (`App.tsx` imports `apollo11Experience`/`apollo11Mission`; `EarthMoonScene` and `MissionConfig` assume Earth + Moon + sampled spacecraft with anchors), so no second experience can mount without editing generic app code. That boundary is the precondition for every later Spike 04 Objective.

## Success Conditions

1. `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md` lists each Perseids need (particles, radiant, activity window and rate, scale range, provenance, camera, metrics, timeline) as REUSED / GAP / FIXTURE-ONLY, each GAP answering the brief's five required task questions and explaining why it belongs in Astraeus rather than the Perseids adapter. It explicitly tests the alternative "many ordinary Trajectories" before proposing a group-of-objects provider, and states which later Objectives (O-009, O-010) are confirmed, reshaped or dropped.
2. The app selects an experience through a generic plug-in contract; `src/app/` generic code no longer imports `src/mission/`, and Apollo behaviour is unchanged (existing tests and all four browser scripts pass, zero console errors).
3. A minimal synthetic experience (non-astronomy-mission naming, no Earth–Moon assumptions beyond what the contract requires) mounts through the same contract with contract-level tests and a headless browser smoke.
4. An automated name check covers the generic app code as well as `src/core/` and `src/shell/`.

## Architectural Considerations

- Every Task states the brief's five items (capability tested, contract reused, gap or hypothesis, generic change, Perseids-independent evidence) in an `Astraeus Hypothesis` section.
- `src/core/` State, `Trajectory`, `Provenance`, `TimelineEvent` and `ScalePolicy` are read-only in this Objective; a needed core change returns REPLAN REQUIRED.
- The plug-in contract grows from existing `ExperienceConfig` and `MissionConfig`/`TrackedBody`, not a parallel model (STYLE-07). It may name which scene layers an experience uses (for example Earth–Moon bodies, tracked bodies) but must not encode Apollo concepts as required.
- Planned decisions only; `Design.md` is reconciled when the work lands.

## Confirmed Decisions — 2026-10-10

Owner confirmed in the G-004 planning session: space view only (ground view is a recorded gap); Perseids data is published facts plus an `illustrative` modelled spread; a configuration-only second shower is pass/fail. The gap audit and the plug-in boundary share this Objective so only one Objective carries detailed Tasks.

## Boundaries

**In scope:**
- Gap audit document; generic experience plug-in contract in `src/app/`; Apollo moved behind it; synthetic experience fixture and its tests; name-check extension; browser regression.

**Out of scope:**
- Perseids data or adapter, particle providers, time-ranged events, new scale policies, ground view, core contract changes, the imperative `Astraeus.Scene` API.
