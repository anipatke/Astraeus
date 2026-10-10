---
id: O-009
title: Provide state for groups of objects
status: in_progress
depends_on: [O-008]
release: G-004
---

# O-009: Provide state for groups of objects

## Outcome

Astraeus gives deterministic scientific State for a large group of objects in one batch, including a generic orbit-based group (a base orbit plus a seeded spread, propagated by the existing astronomy library), and draws any group as one selectable scene item. It is proven with made-up groups only; Apollo is unchanged.

## Why

The O-008 gap audit (`docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md` §3, GAP-1) measured that one `Trajectory` per member does not scale: 10⁴ four-sample trajectories cost about 9 ms per frame and 10⁵ about 59 ms, before rendering. Any population (debris, rings, belts, meteoroid streams, constellations) has this shape, so a group contract belongs in Astraeus, not in a shower adapter.

## Success Conditions

1. A group contract in `src/core/` fills a caller-owned `Float64Array` with every member's EQJ km position for a UTC time. It also declares its member count, centre, frame, optional time bounds and provenance, and can return one member as an ordinary `State`. `State`, `Trajectory`, `Provenance`, `TimelineEvent` and `ScalePolicy` are unchanged.
2. A generic orbit-based group (base orbital elements, a spread description and a seed; Earth- or Sun-centred) gives bit-identical positions for the same time and seed, and different positions for a different seed. Its two-body propagation comes from the existing astronomy library behind the adapter boundary; the public core exposes no library types.
3. Fill cost is re-measured at the audit's sizes (10³, 10⁴, 10⁵) on the same kind of run. 10⁴ members fill in at most 8 ms per call (half a 60 fps frame). The 10⁵ figure is reported, not pass/fail. If 10⁴ misses the bar, that is recorded as a finding with the measured cause, not hidden.
4. An experience opts into a generic `points` scene layer and supplies its groups through `ExperienceDefinition`. Sun-centred groups are placed through existing centre composition. Each group is one shell item that the viewer can select, focus and follow, with its provenance in the information panel. A group is hidden outside its time bounds. Scale and camera never change group State (ARCH-02).
5. Made-up evidence (ARCH-03) covers an Earth-centred debris ring that mounts and is visible through the plug-in contract, and a Sun-centred group proven by contract tests, both with `illustrative` provenance. A headless browser script passes with zero console errors, and the owner looks at the ring once at both scales.
6. The name check covers every new generic file and finds no meteor, shower or Perseids naming. Configured gates and all existing browser scripts pass with zero console errors, writing to fresh run directories. Apollo behaviour is unchanged.

## Architectural Considerations

- Group state stays in EQJ km with an explicit centre. Presentation never changes it (ARCH-02).
- The contract is additive in `src/core/`. Single members reuse `createState` so their State is identical to any other body's. The batch path avoids per-member `State` allocation, which is the cost the audit measured.
- Orbit elements arrive in a named reference plane (ecliptic J2000 or EQJ) and are converted to EQJ by the provider, so published elements need no hand conversion.
- Orbit maths uses the astronomy library already pinned (`@lizard-isana/orb`, its `kepler` module: unperturbed two-body). The Idea keeps Astraeus from growing its own orbital-mechanics library. The two-body limitation is carried in the group's provenance.
- The `points` layer joins the existing `SceneLayerId` list. Group shell items reuse `ExperienceObject` and the camera's `FocusId` (string). A group's focus point is a declared representative position (for example the centroid), stated in the group's description.
- Camera reach (`far = 5000`, focus limits) stays a scene constant. Members beyond it are simply not drawn. This open gap carries to O-011 (Design.md deferred note).
- Any per-experience metrics for a group come through the existing `createMetrics` factory. No new metric kind here (rates are O-010).

## Confirmed Decisions — 2026-10-11

Owner confirmed in the O-009 planning session:
1. **Made-up data only.** O-009 proves the group capability with synthetic groups. Perseids data and the "operates with Perseids data" evidence move to O-011.
2. **Orbit-based groups are generic.** A reusable base-orbit-plus-spread group, Earth- or Sun-centred, is in scope, so a second shower can later be configuration rather than code.
3. **One selectable item per group.** A group is one shell item (select, focus, follow, provenance). Individual members are not pickable.

Planner-settled technical choices, stated in the confirmation summary: the 8 ms / 10⁴ fill bar with 10⁵ reported; hidden outside bounds; camera reach left as an open gap; owner visual look at the synthetic ring at both scales.

## Finding And Owner Decision — 2026-10-11

T-027 measured the 10^4 batch fill at 8.2 ms (Sun-centred) and 11.2 ms (Earth-centred) against the 8 ms bar in Success Condition 3. The bar is a miss for Earth-centred groups. Measured cause: the library's `propagateKepler` alone costs 10.5 ms for 10^4 states, so the cost is the library's per-call solve, not Astraeus code. At 10^5 the fill is 82-110 ms, above the audit's 59 ms for interpolated trajectories, though memory is far lower (6.8 MB against 288 MB). Evidence: T-027 Technical Evidence.

Owner decision: keep the 8 ms bar as the stated test, record the miss as a finding, and do not block O-009. No own orbit solver (Idea forbids growing an orbital-mechanics library). Planned mitigation, to be done in T-028: the points layer refills positions only when the clock time has moved by a set amount, which is presentation-side and does not change State (ARCH-02). The Full Objective Check re-measures the effect and reports it.

## Finding And Owner Decision — 2026-10-11 (smooth group motion)

At the T-029 owner look, the ring looked right but its own motion looked shaky (Issue I-017). The cause is that positions refresh in steps (the T-028 mitigation for the fill-cost miss). The owner asked for the smoothing to be planned now, inside this Objective, and asked for the best balance of performance and visuals. Planner choice: present a blend of two exact fills each frame (presentation only, ARCH-02), rather than recalculating every frame (misses the 8 ms bar) or a background thread (not bounded). Planned as T-030. The blend is a straight-line approximation between exact fills, whose error is measured and recorded in T-030. Success Conditions 3 and 4 are unchanged; the owner's visual judgement of the ring's motion is recorded in T-030.

## Boundaries

**In scope:**
- Group contract and orbit-based group in `src/core/` (with an adapter addition for two-body propagation and element-plane conversion), `points` scene layer and shell item wiring in `src/app/`, synthetic groups in `src/synthetic/`, contract tests, name-check coverage, a browser script, regression, Design reconciliation.

**Out of scope:**
- Perseids or any other shower data, meteor/stream physics in generic code, observed meteor data, per-member picking, new metric kinds, time windows, camera-limit changes, perturbations beyond two-body, ground view, the imperative `Astraeus.Scene` API.
