---
id: O-002
title: Fly a reconstructed Apollo 11 through the generic Trajectory contract
status: done
depends_on: [O-001]
release: G-002
lanes:
  - {key: sources, title: Apollo 11 source research}
  - {key: core, title: Generic sampled trajectory core}
---

# O-002: Fly a reconstructed Apollo 11 through the generic Trajectory contract

## Outcome

Deliver Astraeus Spike 02 as specified in `docs/ASTRAEUS_SPIKE_02_BRIEF.md` (canonical brief), narrowed by the confirmed decisions below. The result is an interactive Apollo 11 educational trajectory reconstruction based on NASA postflight trajectory data, in the existing Earth–Moon scene, plus a generic `SampledTrajectory`, a deterministic offline reconstruction pipeline, a data package, a validation report, tests and `docs/ASTRAEUS_SPIKE_02.md`.

## Why

Spike 01 proved time → State → ScalePolicy → floating origin → Three.js for an ephemeris body. Spike 02 tests whether a sampled, reconstructed spacecraft source fits the same contract, so that downstream layers stay unchanged and the word "Apollo" can be deleted from every generic abstraction.

## Success Conditions

The brief's twelve success criteria, with these confirmed specifics:

1. Columbia (CSM) and Eagle (LM) are two separate sampled trajectories through the same generic SampledTrajectory: Columbia from Earth orbit insertion to entry interface; Eagle from undocking/separation to docking (or the latest supported ascent/rendezvous anchor), including descent, surface stay and ascent.
2. The sampled window runs from Earth orbit insertion to entry interface. Launch and splashdown exist only as events; outside a trajectory's bounds the spacecraft is not drawn.
3. Each reconstructed segment starts on its converted NASA anchor within ≤1 km position and ≤1 m/s velocity (conversion/rounding check). The miss at the next anchor of propagated segments is measured and published with no pass/fail threshold. Any discontinuity between segments is handled openly (documented method, magnitude and location), never silently smoothed.
4. Runtime samples are Earth-centred EQJ kilometres; Moon-relative anchors are normalised offline using Astraeus Moon state at the same timestamp.
5. Interpolation error is measured against the offline propagator at a held-out sample set and documented with the sample interval; the sample density is chosen so that interpolation error is negligible compared with the reconstruction's own uncertainty (target ≤1 km, reported as measured).
6. TrueScale and ReadableScale render identical scientific states; spacecraft marker size is exaggerated by presentation only.
7. Earth/Moon orientation, Sun direction, lunar phase, terminators and existing tests are unchanged.

## Confirmed Decisions — 2026-10-06

Owner confirmed in the planning session:

- **Goal:** new Goal G-002 for this spike; G-001 is left for the owner to close.
- **Vehicles:** two trajectories (Columbia whole mission; Eagle separation → docking).
- **Span:** Earth orbit insertion → entry interface; launch and splashdown as events only; no illustrative ascent or parachute segments.
- **Anchor tolerance:** exact at segment-start anchors (≤1 km, ≤1 m/s); propagated misses at following anchors measured and reported, not gated.
- **Design summary** (below) confirmed with "Confirm".

## Confirmed Decisions — 2026-10-06 (visible jumps)

Owner confirmed in the O-002 recheck conversation ("do 1 2 and 3", after "I don't mind minor inaccuracies that won't be visually obvious"). These supersede the "two-body Kepler" default in Offline pipeline below, for coasts only:

- **Moon-referenced heading reference:** for Moon-referenced, non-surface anchors, flight-path angle and heading are measured in a local basis built from EQJ (J2000) north, not lunar north (T-011 finding, `docs/ASTRAEUS_SPIKE_02.md` 7.2). Adopted because the data fits it (15 lunar-orbit anchors share one plane to 0.6° against a 16.5° scatter, re-measured independently in the recheck). Primary sources do not state it; documents must say so. Position conversion is unchanged.
- **Coast dynamics:** offline coasts are integrated numerically with Earth (point mass + J2), Moon and Sun, Moon and Sun from the Astraeus adapter, replacing two-body and patched two-body. Offline only; the runtime is unchanged.
- **Remaining joins:** the residual miss of each coast at its next anchor is first measured and published, then spread smoothly along that coast so the path meets the anchor with no visible step. Method, raw miss and largest correction per coast are documented. This is open, documented smoothing, which success condition 3 allows; it is never silent.

## Architectural Considerations

**Existing contract fit (verified in `src/core/state.ts`, `src/core/trajectory.ts`, `src/core/body.ts`):** `State.orientation` already accepts `null` for unmodelled attitude, so spacecraft State needs no attitude. `BodyId` is the closed union `"earth" | "moon" | "sun"` and `Trajectory` exposes no time bounds — these are the two generic gaps.

Planned generic extensions (smallest possible; record UNCHANGED / GENERIC EXTENSION / MISSION-SPECIFIC for each in the design note):

- **Body identity:** open `BodyId` so a non-natural body (any spacecraft id) can be a State subject, while center ids stay the natural bodies that `referenceCenters` can compose. Earth/Moon orientation requirement is unchanged.
- **Trajectory bounds:** an optional, generic way for a Trajectory to declare its valid time range. Ephemeris trajectories stay unbounded.
- **SampledTrajectory (core, no mission naming):** sorted, validated samples with one explicit frame (EQJ) and one explicit center; optional velocity; cubic Hermite when velocity is present, linear otherwise; exact samples returned at sample times; named out-of-range error before the first / after the last sample; rejects requests for a center or frame it does not hold, non-monotonic or duplicate times, and mixed frames/centers. Returns fresh State snapshots, never internal buffers.
- **Provenance:** small metadata with `sourceType: ephemeris | observed | reconstructed | illustrative`, sources, accuracy and notes. No framework.
- **Events:** small `{ timeUtcMs, id, label, type? }` list, kept separate from trajectory physics.

**Mission-specific (outside `src/core/`):** extracted anchors, conventions and the reconstruction tool live under `tools/` and `data/apollo11/`; any Apollo wiring in the app stays in a mission data/config module, not in scene, camera, scale or floating-origin code.

**Offline pipeline:** deterministic Node script (no runtime dependency, no network at run time) that converts extracted anchors (GET, reference body, lat/long/alt, inertial speed, flight-path angle, heading) to Cartesian states in the documented inertial frame, propagates each phase with the simplest defensible method (two-body Kepler about the segment's center-of-attraction; patched centers offline), normalises Moon-relative states to Earth-centred EQJ using the existing Astraeus Moon state, and writes generated samples plus events and provenance. Same inputs produce byte-identical output. It may import Astraeus core (Orb adapter, center composition); core never imports the tool.

**Conventions to settle from sources, never guess:** GET zero and UTC conversion; latitude definition (geodetic vs geocentric) and Earth/Moon reference radii; longitude sign; heading and flight-path angle definitions; Earth-fixed → inertial conversion (sidereal angle source); Moon-fixed → inertial conversion. Moon-fixed conversion uses an IAU lunar rotation model offline. The runtime Moon keeps Spike 01's approximate tidal-lock orientation, so a landing site placed correctly in inertial space may not sit exactly on the textured Tranquility Base: measure and document that offset; do not alter Moon orientation to hide it.

**Powered descent:** the 2022 NASA reconstruction is used only if the research Task finds its time/coordinate conventions documentable and integration straightforward; otherwise descent is a documented two-anchor reconstruction flagged in provenance.

**Data package:** `data/apollo11/` holds extracted raw anchor values with page/table citations, normalised anchors, generated samples, events and provenance. Store extracted factual values and references, not NASA PDFs.

**Rendering:** spacecraft State flows through the existing ScalePolicy → floating origin → render-axis conversion. New pieces are generic: a spacecraft marker with presentation-only size exaggeration; travelled/future path split at the current time, reusing the sampled open-path approach; anchor markers distinguished from reconstructed samples; event jump control; focus Earth/Moon/spacecraft, follow spacecraft, Earth–Moon overview; rates 1×/100×/1,000×/10,000× added to existing controls. Floating origin changes only if a reproducible problem requires it.

## Boundaries

**In scope:** canonical brief sections 1–23 as narrowed above; generic core extensions listed above; offline reconstruction tool and data package; demo inside the existing scene; validation report; tests; design note; Design.md reconciliation.

**Out of scope:** brief section 24 in full; illustrative ascent or parachute segments; spacecraft attitude; changing Spike 01 Earth/Moon orientation or lighting; runtime propagation, runtime network fetches or runtime reference-centre switching for spacecraft samples; calling the result the exact Apollo 11 flight path.

## Verification Approach

Task-level focused tests during iteration; configured `typecheck`, `build` and `test` gates at each handoff (AGENTS.md Verification Policy). SampledTrajectory tests cover brief section 21 (determinism, bounds, interpolation fixtures, frame/center rejection, scale, floating-origin and playback independence). Reconstruction validation records anchor residuals, segment-join misses, interpolation error and the qualitative checks in brief section 20. Browser validation covers both scales, focus/follow transitions across Earth orbit, translunar coast, lunar orbit and return, rebasing continuity and event jumps. The Full Objective Check follows `agent-skills/references/check-method.md` in an independent session.

## Discovered Risks

Table 7-II parameter conventions may be ambiguous in the scanned report; extraction is manual and must be cited per value. Propagated two-body coasts ignore lunar/solar perturbation and burns between anchors, so join misses may be large on translunar/trans-Earth coasts. Eagle's surface position depends on the lunar rotation model. The approximate runtime Moon orientation will not match an IAU-placed landing site exactly. Sample volume for a ~8-day mission at lunar-orbit density may affect bundle size; the executor may vary sample interval per segment.
