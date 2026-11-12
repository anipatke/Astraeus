---
id: O-070
title: Flyby lines follow the path where it bends
status: done
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

Confirmed by the owner, 2026-11-12 (session plan-o070-20261112):

1. A synthetic provider about Earth with a one-hour close pass (closest approach a few Earth radii) on six-year bounds: at every minute within closest approach ± 3 h, the drawn line (straight segments between the sample positions) lies within 1% of the body's distance from the path's centre of its true position, so the line passes through the marker.
2. At most 4,096 samples per provider path; the first and last are the bounds; times are whole milliseconds and strictly increasing.
3. The 128 evenly spaced moments drawn today stay in every provider path's sample list, so no path gets fewer points than before.
4. README states how a provider path's line is drawn: 128 even moments plus moments added where the line bends or the body moves fast as seen from the path's `center`, capped at 4,096; and the known limit that bends seen only against another body (a Sun-centred path drawn fixed to Earth) are not refined.
5. No public API change (`api-surface.lock.json` unchanged); CHANGELOG Unreleased entry (fix).
6. No owner preview check: no demo draws a provider path; node tests are the evidence.

## Decisions

- **Frame for judging bends** (owner, 2026-11-12): the path's own `center` (the provider's positions as given), worked out once when the path is built. Rejected: the body the line is pinned to (`lineFixedTo`), which needs planet series before planning and feeds the `"auto"` stretches that are themselves planned from these times.
- **Cap** (owner, 2026-11-12): 4,096 samples; no host density setting.

## Architectural Considerations

Line sampling is presentation planning (ARCH-02): positions stay the provider's own; readouts and `stateOf` are untouched. One pure sampling function, tested in node.

## Boundaries

**In scope:** provider-path line sampling, its tests and README text.
**Out of scope:** `samples` paths (drawn at every sample already); a host density option; the marker's size (F-06).
