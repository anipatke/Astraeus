---
id: O-001
title: Prove independent Earth–Moon science and rendering
status: done
depends_on: []
release: G-001
---

# O-001: Prove independent Earth–Moon science and rendering

## Outcome

Deliver Astraeus Spike 01 as specified by the owner: a working donor-quality Earth–Moon scene, minimal scientific core, automated tests and docs/ASTRAEUS_SPIKE_01.md.

## Why

Prove that scientific state is independent from visual scale and viewing transforms before expanding Astraeus.

## Success Conditions

Retain deterministic timestamp seeking, FPS-independent play/pause/rate, physical radius ratio, camera independence, trajectory-derived open path, donor appearance and measured lunar accuracy. In addition:

1. Scientific positions use Float64Array kilometres, independent of rendering.
2. Floating origin keeps Earth, Moon, path, camera and focus stable across origin changes.
3. TrueScale and ReadableScale use identical scientific state.
4. Earth orientation follows absolute date, axial orientation and real rotation rate.
5. Moon scientific orientation approximately locks its near-side axis toward Earth.
6. Scientific Sun geometry produces credible Earth day/night and visible lunar phase.
7. Explicit EQJ centers express Moon/Earth, Earth/Sun and Moon/Sun without redefining bodies.
8. Astronomy provider evaluation includes current orb.js 3.x; reuse proven maths where sensible and document unsuitable capabilities.

## Architectural Considerations

Small framework-independent TypeScript core with donor-compatible application rendering. Scientific state → ScalePolicy → floating origin → fixed render-axis conversion → Three.js. No layer changes upstream state.

The owner confirmed the original design with “go” on 2026-10-05, supplied the architecture addendum on 2026-10-06, and requested this replan. Those instructions settle the revised scope; no additional product choice is needed. The revised Task plan is prepared for owner review before execution routing. Preserve all existing identities, statuses, evidence and working code. Canonical scope revision: `docs/ASTRAEUS_SPIKE_01_ADDENDUM.md`.

## Boundaries

**In scope:** Earth–Moon visual scene, minimal Sun geometry for illumination and heliocentric centers, internal donor adaptation, credible ephemeris, explicit clock/state/trajectory/scale, separate floating origin, scientific Earth orientation and approximate lunar locking, debug controls, tests and design note.

**Out of scope:** Full Solar System, eclipses, libration, barycentric simulation, SPICE, N-body physics, terrain, world streaming, general scene management, publishing, unclear-licence assets in public packages, runtime Horizons/mission/sample providers, observatory-grade orientation accuracy and final product UI. No monolithic Simulation owns canvas, renderer, scene, camera, clock, objects and UI.

## Evidence from the donor

Local checkout: `/home/user/code/planetary-explorer`.

- `src/features/moon/EarthCompanions.tsx`: fixed radius 6, inclined circular ring and mutable accumulated orbital angle.
- `src/features/moon/OrbitingMoon.tsx`: per-frame arbitrary angular speed; dragging pauses orbit.
- `src/features/moon/MoonScene.tsx`: EarthCompanions is a child of MoonMesh.
- `src/features/moon/MoonMesh.tsx`: user rotation and display spin rotate that parent mesh.
- `src/features/moon/CompanionMoon.tsx`: reusable textured sphere appearance, but trail and navigation depend on donor application state.
- `src/features/moon/AtmosphereGlow.tsx`: reusable rim shader.
- `src/features/moon/usePlanetTexture.ts`: texture variants, sRGB and anisotropy.
- `src/features/moon/CameraController.tsx`: zoom tweening and outer zoom acceleration; currently camera Z movement rather than orbital camera interaction.
- `src/features/moon/OrbitalTrail.tsx`: reusable line appearance; replace circle generation and lineLoop with sampled trajectory and open line.
- `src/entities/earth.ts` and `moon.ts`: reusable presentation parameters and texture references; do not import editorial metadata into physical bodies.

Only these targeted sources and donor package.json have been examined. Gesture/focus implementation and licence provenance remain to inspect during execution. Adaptation should retain behaviour where sensible without importing the full donor store or application.

## Confirmed core contracts

- **Clock:** absolute UTC Unix milliseconds; play/pause/seek/rate with an injected monotonic source. Re-anchor on seek, pause and rate change. Orbital and orientation solutions use requested time, never accumulated frame delta. Reject invalid timestamps/rates and document JavaScript UTC/leap-second limitations.
- **Body:** readonly id and radiusKm, optionally parent id. Source Earth/Moon mean radii (provisionally 6371.0/1737.4 km). Centers belong to State requests, not fixed body definitions. No presentation metadata.
- **State:** readonly time, `positionKm: Float64Array`, optional `velocityKmS: Float64Array`, normalized `orientation` quaternion, frame `EQJ`, and center `earth` or `sun`. Quaternion order is `[x,y,z,w]`, mapping documented body-fixed axes into EQJ. Readonly fields do not freeze typed-array elements: return owned snapshots and never mutate caller buffers. Velocity is omitted unless needed. No React/Three.js/provider types.
- **Trajectory:** `stateAt(time, center?)` returns scientific State; default Moon center stays Earth for compatibility. A small adapter hides the selected astronomy provider. Earth and Sun support only the state needed for this spike. No plugin registry or alternate runtime providers.
- **Centers:** EQJ is a right-handed mean-equatorial J2000 axis convention, independent of origin. Earth/Sun plus Moon/Earth yields Moon/Sun at the same time/frame; Sun/Earth is the negative Earth/Sun vector. Re-centering changes position, not body identity or orientation. Reject mismatched timestamps/frames. Rotating frames are excluded.
- **Orientation:** Earth uses sourced date-based axial orientation and rotational phase from proven provider routines when available; document any approximate UT1/UTC treatment and J2000 conversion. Moon uses its Earth-facing direction and a stable orbital-plane basis; the pole and near-side axes are explicit. Donor texture offsets remain presentation-only. No arbitrary mesh spin or full libration.
- **ScalePolicy:** pure `mapPosition(positionKm)` and `mapRadius(radiusKm)` return fresh values. Named TrueScale and ReadableScale implementations; common normalization initially `1 / earth.radiusKm`. TrueScale preserves distance/size ratios. ReadableScale initially compresses distance by 0.1 and leaves radii unchanged, preserving the original radius-ratio requirement. The formula is replaceable through the interface; size exaggeration is optional and is deferred for this spike.
- **Floating origin:** rendering-owned `scaledCameraOrigin` in Float64 values. Map body, path, camera and target through the same policy in the same center, then subtract the same scaled origin before GPU coordinates. Origin selection and rebasing are independent of policy and scientific state. Camera absolute coordinates or scaled absolute coordinates are application-owned and documented; local Three.js vectors never become scientific input. No world streaming.
- **Illumination:** derive normalized physical body-to-Sun vectors from scientific states before readable compression. Lighting and phase diagnostics use these vectors, not an artificial phase animation or a distorted scaled Sun position. An Earth-observer lunar phase estimate is geometric (illuminated fraction from Moon-to-Sun and Moon-to-Earth angle); the actual viewed phase follows camera geometry.

Fixed render-axis conversion: EQJ `(x,y,z)` maps to Three.js `(x,z,-y)`, preserving handedness. Convert quaternions and light directions consistently; apply texture-facing offsets after scientific orientation. Policy changes or rebasing never change scientific orientation, physical Sun direction or time.

## Astronomy choice and accuracy

Astronomy Engine (`astronomy-engine`) and `GeoMoon(date)` remain candidates, not a selected dependency. Before custom astronomy maths, evaluate current orb.js 3.x from primary documentation/source for time, Earth/Moon positions, reference frames, transforms, Kepler propagation and state vectors. Record exact version/commit, supported capabilities, units/frames/timescales, licence and limitations in `docs/ASTRONOMY_VALIDATION.md`. This bounded first phase produces a provider decision and explicit conversion/orientation recipe before implementing the core. Use orb.js behind an OrbTrajectoryAdapter when useful; retain Astronomy Engine for capabilities orb.js cannot suitably supply, or reject orb.js with evidence. Do not introduce two dependencies without a concrete need. If neither can meet the unchanged accuracy target or the minimal orientation/Sun contract, return REPLAN REQUIRED rather than inventing lunar maths.

For the Astronomy Engine candidate, Its documented result is the Moon centre relative to Earth centre in EQJ, in AU. Convert AU to km once in the adapter using the exact AU conversion. Keep library time conversion inside the adapter. Pin the evaluated version and preserve required notices during implementation.

This supplies dated phase, varying distance and plane orientation without a homemade Kepler approximation. Its lunar algorithm is based on the Improved Lunar Ephemeris; project-level angular accuracy targets are about one arcminute, but that is not a measured spike guarantee or a kilometre-distance guarantee. Compare alternatives briefly against these needs before committing the dependency; an Earth satellite propagator is not a lunar ephemeris substitute.

Sources:
- [Astronomy Engine project](https://github.com/cosinekitty/astronomy)
- [GeoMoon JavaScript/TypeScript documentation](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md#geomoondate--vector)
- [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html)

Initial independent acceptance targets for modern-date fixtures: angular separation ≤2 arcminutes and physical distance error ≤100 km against Horizons geometric Earth-centred equatorial J2000 vectors. These are proposed tolerances, not measured results. Verify several dates across a lunar month plus dates in different years. Use target 301, Earth-centre 500@399, no light-time/aberration correction, km and matched time scales. Archive query parameters, raw results, retrieval time, ephemeris identity and conversion details; ordinary tests run offline. If evidence misses the targets, investigate frame/time configuration first, then revisit the model or tolerance explicitly. UI should accept valid timestamps; only a measured, documented date range carries a quantified accuracy claim.

## Scene integration

Earth, Moon and orbit line are siblings under a stationary scientific scene root. Earth texture/display rotation applies only to Earth mesh. Camera drag, zoom and focus affect the camera/target, never scientific state. Focus follows the mapped Moon position and uses physical-relative body radii. Camera limits and clipping must fit the approximately 60-Earth-radius real-distance scene and still permit close views.

Use scientific Sun directions for directional illumination at each body. Preserve donor materials/atmosphere where compatible, but tune ambient fill so the day/night boundary and lunar phase remain visible. No eclipse/shadow-occlusion claim. Minimal Sun state need not draw a Sun mesh.

Consume Earth and Moon scientific quaternions from State. Test date-based Earth rotation and the Moon's designated near-side axis against physical Earth direction. Only donor texture-facing offsets belong in application code. Rebasing applies to Earth, Moon, path, camera and targets together; focus behavior and projected geometry must remain continuous when the origin changes.

Sample `stateAt` over a moving window of one sidereal month around the selected date, then map each sample through the same policy. Use an open line: a perturbed Moon trajectory does not close exactly after one month. Include the selected timestamp among samples. Rebuild sampled data on seek/window change, with an appropriate update cadence during playback; scale changes remap existing physical samples. No fake ellipse or independently tuned orbital ring.

## Verification and handoff

Clock tests use fake monotonic time: freeze on pause, deterministic backward/forward seeks, continuous rate changes, and equivalent elapsed time under different frame schedules. Same requested timestamp yields identical orbital state at all rates.

Trajectory tests verify reproducibility, varying distance, plausible average distance and approximate sidereal recurrence. Do not assert exact recurrence: perturbations, apsidal motion and different sidereal/anomalistic periods are real. Record a justified angular/radial recurrence tolerance based on fixture evidence rather than allowing the model to dictate its own correctness.

Scale tests verify unchanged input state, initial ReadableScale distance ratio 0.1, TrueScale physical ratios, identical body radius mappings and matching path/position mapping. Center-composition tests prove Moon/Sun = Earth/Sun + Moon/Earth. Scientific orientation tests cover normalized quaternions, date-based Earth rotation and lunar locking. Independent solar/phase reference dates and documented approximate tolerances validate Sun direction, Earth subsolar direction and lunar illuminated fraction. Floating-origin tests prove pairwise distances and camera projections remain invariant under origin changes, including a common heliocentric offset near one AU and close Moon focus; subtract Float64 values before GPU conversion. Transform tests use an actual Three.js hierarchy to rotate camera and Earth visual mesh and confirm unchanged scientific state and Moon scene-world position. Test approximate locking across dates.

Browser validation covers seek while playing and paused, speed changes, both scales, Moon/Earth focus, drag/zoom during playback, path alignment, texture orientation, atmosphere quality, real-scale framing, origin rebasing during focus/playback, and day/night plus Moon phase at independently sourced new/quarter/full-Moon dates. Record visual evidence and compare donor appearance.

Currently all Astraeus quality gates are null. During setup, establish project-owned build, typecheck and test commands (plus lint only when configured), then record them in `.savepoint/config.yml`. No implementation gates ran for this planning-only turn. Optional independent Task Check requires a separate session or an explicit owner waiver; mandatory Full Objective Check follows integration in an independent session. Only the owner completes Tasks/Objectives.

## Discovered risks

The donor's object rotation model cannot be copied intact without preserving the orbit defect. Its companion component bundles navigation and a circular comet trail with mesh rendering. Real scale requires substantially different camera reach. Lunar paths are not closed rings. Donor texture longitude/near-side offset needs visual validation. Licence provenance remains unresolved; local/internal use does not establish redistribution permission. The current checkout is a Git repository, with git-dir/common-dir both `.git`; the earlier no-Git setup note is superseded by this replan.

## Suggested next spike

After this boundary is proven, demonstrate a second trajectory data source with the same state and rendering contract. Choose it from actual storytelling needs; do not implement it in Spike 01.

## Replan Readiness — 2026-10-06

The addendum resolves the material scope conflict. Interfaces, state ownership, centers, orientation conventions, independent rendering layers, exclusions and verification are specified above. Astronomy provider capability remains factual research, bounded by a decision deliverable at the start of the scientific Task; no provider capability is asserted before that research. Existing Task dependencies and independent Check requirements remain intact. No production code or gates ran during this replan. Revised Task plan awaits owner review before execution routing.
