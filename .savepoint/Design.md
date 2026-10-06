---
type: project-design
status: active
---

# Astraeus — Design

## Architecture

The Earth–Moon spike has a small framework-independent scientific core and a separate rendering layer. Absolute UTC time feeds dated trajectories and body orientation; explicit center composition and physical Sun directions remain in EQJ kilometres; replaceable scale policies produce fresh render-scale values. A Float64 floating origin and fixed EQJ→render-axis conversion sit downstream, feeding an adapted-donor React Three Fiber scene and a debug UI. Full note: `docs/ASTRAEUS_SPIKE_01.md`.

## Components/Codebase Map

| Component | Current purpose |
|---|---|
| `.savepoint/` | Goal intent, proposed Objective and workflow selection |
| `src/core/` | Absolute-time clock, physical body/state contracts (open `BodyId`, closed `CenterId`), Orb adapter, Moon/Earth trajectories, optional trajectory `bounds`, generic `SampledTrajectory`, provenance, timeline events, center composition, body orientation, scale policies and illumination geometry. No mission naming |
| `src/app/` | Rendering and UI: render-axis conversion, floating origin, scene layout, sampled open orbit path, tracked-body view and generic `MissionConfig`, adapted donor meshes/atmosphere/textures, generic focus/follow/overview camera, debug controls (optional mission window, rates, event jump), mission panel and overlay |
| `src/mission/apollo11.ts` | The only app-side mission module: imports the generated data, builds Columbia/Eagle `SampledTrajectory` objects, labels, required wording, rates, window |
| `tools/apollo11/`, `data/apollo11/` | Deterministic offline reconstruction (`npm run apollo11:reconstruct`): anchor conversion, integrated and smoothed coasts (`dynamics.ts`, `segments.ts`), sampling, report; raw/normalised anchors, generated samples, events and validation JSON |
| `tools/validate/` | Diagnostics and browser checks, not gates: `browser-spike02.mjs` and `browser-anchor-labels.mjs` (headless browser), `anchor-consistency.mjs` and `conversion-proof.mjs` (independent anchor and conversion audits); write `docs/evidence/` |
| `src/main.tsx` | Vite entry that mounts the React app |
| `tests/` | Offline clock, scale, center, provider, orientation and illumination checks with archived references |
| `docs/ASTRONOMY_VALIDATION.md` | Provider decision, conversion limits and JPL/USNO/SOFA validation basis |
| `docs/ASTRAEUS_SPIKE_01.md` | Design note: implemented architecture, conventions, measured accuracy, addendum decisions, risks and browser validation |
| `docs/ASTRAEUS_SPIKE_02.md` | Design note: what Apollo 11 proved through the generic Trajectory contract, architecture review, limitations, Spike 03 recommendation |
| `docs/APOLLO11_SOURCES.md`, `docs/APOLLO11_RECONSTRUCTION.md` | Source hierarchy and conventions; generated validation report |
| `docs/DONOR_PROVENANCE.md` | Donor reuse and unresolved texture provenance |

## Interfaces and Data Flow

`SimulationClock` produces integer UTC Unix milliseconds from a monotonic anchor. `MoonTrajectory.stateAt(time, center)` returns Moon State in EQJ for Earth or Sun centers. Earth orientation comes from the provider adapter; the Moon near-side axis and local pole basis come from the dated trajectory. `SampledTrajectory.stateAt(time)` returns Earth-centred EQJ km for a vehicle, cubic Hermite when velocity is present, and throws `TrajectoryOutOfRangeError` outside its `bounds`; the scene draws a tracked body only inside its bounds. `CenteredPosition` composition changes the origin while preserving body identity. `ScalePolicy` maps physical kilometres/radii without changing State. Sun geometry is represented by an explicit Sun/Earth position and derived physical directions/illuminated fraction. The public core has no Orb, React or Three.js types.

## Boundaries

G-001 covers the internal Earth–Moon spike only. Planetary Explorer is a read-only donor at `/home/user/code/planetary-explorer`.

## Decisions

The owner's complete brief defines intent and exclusions. Owner clarified G-001 is this spike, the first step is planning, and the plan is the Goal → Objective → Task records rather than a separate document. Original design was confirmed on 2026-10-05. The owner supplied the 2026-10-06 addendum and the revised contracts now have a T-001 implementation. Provider evaluation selected `@lizard-isana/orb` 3.1.1 alone: its truncated Meeus-style lunar series met the sampled Horizons thresholds, its structured frame/time modules supply the needed conversions/orientation, and EPV00 supplied Sun/Earth geometry. Astronomy Engine remains documented as a rejected extra dependency because no uncovered capability justified it. Exact evidence and limits live in `docs/ASTRONOMY_VALIDATION.md`.

## Current Technical State

Astraeus is a private, pinned TypeScript/Vite/Vitest/React Three Fiber package. Configured typecheck, build and test gates passed fresh during T-015 on 2026-10-06 (127 tests in 7 files); lint is not configured. The checkout is a Git repository, not a worktree lane.

Spike 01 (O-001) behaviour is unchanged: Orb adapter Moon/Earth/Sun states, Earth rotation, near-side Moon locking, USNO phase checks, scale policies (ReadableScale ×0.1 distance, radii unchanged), Float64 floating origin with 1-Earth-radius threshold. Spike 02 (O-002) added a generic `SampledTrajectory`, optional trajectory bounds, provenance and events to core, a generic tracked-body scene path and camera, and an offline Apollo 11 reconstruction. The reconstruction is re-run byte-identical. All 40 non-cutoff anchors remain within 1e-6 km and 1e-6 m/s; each of the 12 physical-burn cutoff residuals is published, with a maximum position residual of 454.706 km and velocity residual at most 0.000001 m/s. Coasts are integrated offline (RK4, 10 s) with Earth point mass + J2, Moon and Sun from the Astraeus adapter (`tools/apollo11/dynamics.ts`), forward from the start state and backward from the end anchor, then blended with a smoothstep weight; a post-burn coast starts from the modelled burn end state, while other coasts start from their anchor. Each raw miss and largest correction is published, and `discontinuities` is empty (T-013, T-015). Moon-referenced flight-path angle and heading use an EQJ-north local basis, adopted from data consistency (spike note 7.2; T-011, T-013). Post-T-015 coast raw misses and corrections are published per segment; the 10-second A-02>A-03 coast reaches about 73.55 km/s because the fitted cutoff is 454.706 km from A-02, and remains an accepted Apollo sample limitation under I-008. Overrides in effect: A-05, A-33, A-34; raw data is unchanged. All 12 configured ordinary burns integrate Earth J2, Moon and Sun gravity plus a constant EQJ acceleration fitted to cutoff velocity. The following coast starts from the modelled cutoff state through a generic start-state input. Runtime burn peaks are reported in each burn's reference body: A-13>A-14 is 1.669 km/s Moon-relative and A-09>A-10 is 1.532 km/s Earth-centred. The one-second `SampledTrajectory` scan found zero intervals beyond local speed for Columbia and Eagle. Sample interpolation error is at most 0.1997 km. Columbia's path starts at Earth orbit insertion (GET 00:11:39.3) over the Atlantic, from A-01 integrated backward; no published insertion position is in the sources to check it against. The IAU-placed landing site is 254 km (8.4°) from the same coordinates on the runtime tidal-lock Moon; the runtime Moon is intentionally unchanged. Browser validation (headless SwiftShader Chromium, `tools/validate/browser-spike02.mjs`, re-run for T-015; evidence in `docs/evidence/`) covered both scales, six mission times, focus/follow, the 30 events, rate changes and the Spike 01 USNO phases with 0 console errors. Full detail and the UNCHANGED / GENERIC EXTENSION / MISSION-SPECIFIC table: `docs/ASTRAEUS_SPIKE_02.md`.

Known open items: O-001 and O-002 have CLEAR Full Objective Checks (C-001, C-004); I-001 and I-006 are resolved (verified); I-008 is resolved by owner acceptance as an Apollo sample limitation, not verified as physically plausible. I-002 (A-05 override not documentary-confirmed) and I-007 (A-13 longitude, burn-arc speed spikes) are escalated to O-004; I-003 (how uncertainty is shown), I-004 (landing site 254 km from the runtime Moon surface point, to be shown as a stated liberty) and I-005 (HUD coverage, ReadableScale radii) to O-005, now the G-003 reusable UI shell (brief: `docs/ASTRAEUS_SPIKE_03_BRIEF.md`). No human has judged visual jitter; Earth and original-Moon texture provenance is unresolved (local use only); the donor code licence was not found. The donor repository `/home/user/code/planetary-explorer` remains read-only (its `playwright-core` was used only to run the browser scripts).
