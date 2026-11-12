---
id: O-070
title: Flyby lines follow the path where it bends
status: planned
depends_on: [O-069]
release: G-019
priority: medium
rank: 2
---

# O-070: Flyby lines follow the path where it bends

## Outcome

A provider path (`addTrajectory` with `provider` and `bounds`) is drawn from samples the engine places where the line bends or the body moves fast, not 128 evenly spaced moments, with a total cap, so a one-hour flyby on a six-year provider path is drawn as a curve through the marker.

## Why

G-019, Closest Calls F-05: `PROVIDER_PATH_SAMPLES = 128` in `src/api/planPaths.ts` samples a provider path evenly over its bounds (about every 20 days over six years), so a flyby is two straight chords; the app split one asteroid into three paths. The owner chose engine-side adaptive sampling with no host density setting.

## Success Conditions

To be settled when this Objective is detailed (after O-069). Planner's outline: a synthetic provider with a fast close pass is drawn within a stated chord error of its true path near the pass; the sample count stays under a stated cap; slow-moving provider paths draw as before (within tolerance); README states how a provider path's line is drawn; no public API change.

## Architectural Considerations

Line sampling is presentation planning (ARCH-02): positions stay the provider's own; readouts and `stateOf` are untouched. One pure sampling function, tested in node.

## Boundaries

**In scope:** provider-path line sampling, its tests and README text.
**Out of scope:** `samples` paths (drawn at every sample already); a host density option; the marker's size (F-06).
