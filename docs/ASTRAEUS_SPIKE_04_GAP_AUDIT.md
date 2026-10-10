# Astraeus Spike 04 — Gap Audit

Task T-024 (O-008). Research only: no `src/` change, no dependency, no data fetched. The question is whether a meteor shower (Perseids as fixture) can be hosted by existing Astraeus contracts, and where it cannot, exactly why. Read against `docs/ASTRAEUS_SPIKE_04_BRIEF.md`.

Classes: **REUSED** (existing contract carries it unchanged), **GAP** (a generic Astraeus change is justified), **FIXTURE-ONLY** (belongs in the Perseids adapter/config, nothing generic).

## 1. Need-by-need classification

| # | Perseids need | Class | Contract / evidence |
|---|---|---|---|
| 1 | Particles / population (10³–10⁵ meteoroids) | **GAP-1** | `Trajectory` is one body → one `State` (`trajectory.ts`); `State` is frozen and validated per call (`state.ts` `createState`). See §3 for the measurement. |
| 2 | Radiant (published RA/Dec) | **REUSED** for display, **FIXTURE-ONLY** for the value | `CoordinatesMetric` already supports `radec` (`metrics.ts:93`). The value is adapter data. A drawn radiant *marker* is a small scene need — see §2, GAP-5. |
| 3 | Activity window (start/end dates) | **GAP-3** | `TimelineEvent` is an instant (`events.ts`). `ExperienceConfig.window` is a whole-timeline span only. |
| 4 | Peak and rate (ZHR over time) | **GAP-3** (events) + **GAP-4** (metric) | Peak is an instant: REUSED as a `TimelineEvent`. Rate-over-time and a rate readout are not: `Metric` has no rate kind (`metrics.ts:123`). |
| 5 | Scale range (atmosphere ≈100 km → stream ≈10⁶ km) | **REUSED**, with one constant to lift | `ScalePolicy` is Earth-radius-based and linear (`scalePolicy.ts`): 100 km ≈ 0.016 units, 10⁶ km ≈ 157 units (true) — inside the camera's `far = 5000` (`EarthMoonScene.tsx:78`, `CameraController.tsx:195`). Failure only appears for the *comet orbit* (1 AU ≈ 23,500 units), which is out of scope. The real gap is that camera limits, `far` and focus reach are scene constants (`focusLimits`, `TRACKED_MIN_DISTANCE`), part of GAP-2. |
| 6 | Provenance (published vs modelled; time-ranged) | **REUSED** whole-object; **GAP-3b** time-ranged | `Provenance` + `eventProvenance` + `knownLimitations` carry published/`illustrative` wording (`provenance.ts`, `experience.ts`). Spike 03 already recorded that provenance is not time-ranged (`ASTRAEUS_SPIKE_03.md` §4, §10). Needed when the activity window changes the status of what is shown. |
| 7 | Camera overview / focus / follow | **REUSED** | `ExperienceCameraRequest` and presets are generic (`experience.ts`); `CameraRequest` matches it. Limits are the constant noted in row 5. |
| 8 | Metrics | **REUSED** shape, **GAP-4** for rate | `metricsFor(objectId, t)` is a generic hook, but `createObjectMetrics` is Earth/Moon/spacecraft-specific (`metricReadouts.ts:237`). |
| 9 | Timeline and labels | **REUSED** | `ExperienceConfig.objects/events/rates/window`, `labelPriority`, `labelMaxDistance`, `availability` carry it. Playback rates already merge (`mergeSpeeds`). |
| 10 | Ground (topocentric) view | **Out of scope — recorded** | `CenterId = "earth" \| "moon" \| "sun"` and a single `EQJ` frame (`body.ts`, `state.ts`). A horizon-based observer needs an observer centre and local frame. Owner decision 2026-10-10: space view only. |
| 11 | App selects an experience | **GAP-2** | `App.tsx:11` imports `apollo11Experience`/`apollo11Mission`; `EarthMoonScene` mounts Earth and Moon meshes and a `MoonTrajectory` unconditionally; `MissionConfig` requires bounded `TrackedBody`s with anchors. No second experience can mount without editing generic code. |

## 2. GAP rows

Each GAP answers the brief's five items and rule 7 (why Astraeus, not the adapter).

### GAP-2 — Experience plug-in boundary (O-008, next Task)
- **Capability tested:** that the app is an engine host, not an Apollo viewer.
- **Contract reused:** `ExperienceConfig`, `MissionConfig`/`TrackedBody`, `AstraeusShell`.
- **Gap:** generic app code imports `src/mission/` and assumes Earth + Moon + tracked spacecraft.
- **Generic change:** an `ExperienceDefinition` supplied to `App`, so the app contains no experience import (§4).
- **Independent evidence:** a synthetic non-mission experience mounts through the same contract; an automated name check covers `src/app/`.
- **Why Astraeus, not the adapter:** by definition — the adapter cannot remove an import from generic code.

### GAP-1 — Group of objects (O-009)
- **Capability tested:** state for thousands of anonymous objects.
- **Contract reused:** `State` semantics (centre, frame, EQJ km, UTC ms), `Provenance`, `TimeBounds`.
- **Gap:** one `Trajectory` per body cannot afford a population (§3).
- **Generic change (proposed, additive, in `src/core/`):** a provider that fills a caller-owned `Float64Array` of positions for time *t*, with its own bounds, centre, frame and provenance. `State` and `Trajectory` stay unchanged; a single member can still be read as a `State`. Plus a generic points scene layer in `src/app/`.
- **Independent evidence:** a synthetic orbiting-debris or asteroid-belt group with no meteor concept, same contract tests, Apollo unchanged.
- **Why Astraeus:** any population (debris, rings, belts, star fields) has the same shape; nothing in it names a shower.

### GAP-3 — Time windows (O-010)
- **Capability tested:** that the timeline can show something that lasts and changes.
- **Contract reused:** `TimelineEvent`, `ExperienceConfig.window/rates`, `Provenance`.
- **Gap:** events are instants; there is no window or rate-over-time.
- **Generic change:** a time-ranged counterpart to `TimelineEvent` (start, end, optional peak/rate samples) and, if needed, a time-ranged provenance span. Additive; existing events untouched.
- **Independent evidence:** a synthetic eclipse or launch-window experience.
- **Why Astraeus:** eclipses, occultations, comms windows and mission phases are windows too.

### GAP-4 — Rate metric (O-010)
- **Gap:** `Metric` has no rate kind for "N per hour". **Generic change:** one `rate` kind in `src/shell/metrics.ts` with the existing scalar/range/context fields. **Evidence:** a synthetic event-rate readout. **Why Astraeus:** the shell owns metric kinds; the adapter can only supply values.

### GAP-5 — Fixed-direction marker (minor, deferred)
A radiant is a direction, not a body. Using a stationary two-sample `SampledTrajectory` at an arbitrary distance would make a presentation choice look like scientific State, which the brief's stop condition forbids. Decide in O-011 whether a generic direction-marker layer is worth adding; default is to leave it out and show the radiant as a `radec` metric only.

## 3. "Many ordinary Trajectories" versus a group provider

Throwaway measurement (scratchpad only, not committed): N four-sample `SampledTrajectory` instances, `stateAt` for each once per frame, Node, this machine.

| N | build | heap | per-frame `stateAt` cost |
|---|---|---|---|
| 1,000 | 9 ms | 3 MB | 1.4 ms |
| 10,000 | 46 ms | 29 MB | 9.0 ms |
| 100,000 | 277 ms | 288 MB | 59 ms |

At 60 fps the whole frame budget is about 16 ms, and rendering has not started. 10⁴ particles already consume more than half of it; 10⁵ is nearly four frames. Cost is dominated by per-call `createState` allocation and validation, which a batch fill into one typed array avoids.

**Decision:** the many-Trajectories alternative is rejected for populations of roughly 10³ and above and kept for ordinary bodies. It is viable for a few hundred members, which is why single members stay readable as `State`. This is a measured bound on one machine, not a benchmark of the final provider; O-009 must re-measure its own provider against the same N.

## 4. Proposed plug-in contract (input to the next Task)

An experience supplies, as data and factories:
1. `ExperienceConfig` (existing) — objects, camera presets, events, window, rates, provenance.
2. `clockStartUtcMs` and initial rate (App currently reads these from `apollo11Mission.window` and hard-codes 3,600).
3. `sceneLayers` — which generic layers it uses. Initially `earth-moon` (the current bodies, light and Moon trajectory) and `tracked-bodies` (existing `TrackedBody` list); later `points` (O-009).
4. `metricsFor(objectId, t)` (existing hook, now supplied by the experience).
5. Optional `camera` limits (min/max distance, `far`) replacing the scene constants.
6. Optional developer-tool panels.

The generic app owns the clock, shell wiring, canvas, camera execution, label layers and scale policy. The Apollo experience becomes the first definition, and a synthetic one the second. The contract grows from `ExperienceConfig`/`MissionConfig` (STYLE-07) and never makes Earth, Moon or spacecraft mandatory: a definition lists the layers it uses. `createObjectMetrics` and `MissionPanel` move to the Apollo side because they encode Apollo concepts.

## 5. Published Perseids facts needed later

Nothing is fetched or committed here. Candidates for O-011, to be verified against the primary source when used:
- **109P/Swift-Tuttle orbit** (a, e, i, ω, Ω, q): JPL Small-Body Database.
- **Radiant** (RA/Dec, drift): International Meteor Organization (IMO) Working List of Meteor Showers; IAU Meteor Data Center.
- **Activity window, peak date/solar longitude, ZHR, speed:** IMO calendar and Working List.
- **Second shower** (e.g. Geminids, 3200 Phaethon): same sources.

Boundary: published facts keep `ephemeris` or `observed` provenance only where a source states them. The particle spread, individual meteoroid positions and any smoothed rate curve are modelled, carry `illustrative` provenance and are never shown as observed.

## 6. Disposition of O-009 and O-010

- **O-008:** confirmed. GAP-2 is the next Task, then name-check extension and regression.
- **O-009 (group of objects): confirmed.** Evidence: §3. Scope fixed to a batch position provider with its own bounds/provenance plus a generic points layer; a synthetic non-meteor group is the independent evidence.
- **O-010 (time windows and rates): reshaped.** It covers GAP-3, GAP-3b (time-ranged provenance, only if the window needs it) and GAP-4 (rate metric). "Rates" in its title means the metric and rate samples, not the existing playback rates.
- **Not planned:** ground view (recorded gap), comet-orbit drawing at true scale, GAP-5 unless O-011 needs it.
- **Stop condition check:** nothing found requires changing `State`, `Trajectory`, `Provenance`, `TimelineEvent` or `ScalePolicy`. All proposals are additive.
