---
id: O-014
title: Define Earth, Moon and Sun once and assemble experiences from them
status: in_progress
depends_on: [O-010]
release: G-004
priority: high
lanes:
  - {key: core, title: Catalogue definitions and the state resolver}
  - {key: assets, title: Visual assets and the body renderer}
  - {key: scene, title: Compositions, scene centre and paths}
  - {key: scale, title: Solar-system scale}
  - {key: experiences, title: The three experiences and the public build}
  - {key: planets, title: Planets, Jupiter and Io}
  - {key: integration, title: Cross-experience check and Design}
independence:
  pair: [assets, scale]
  overlap: "Both read src/core/body.ts and src/core/scalePolicy.ts after the core lane lands; assets writes src/assets/** and src/app/BodyView.tsx, scale writes src/core/scalePolicy.ts and src/shell/scaleModel.ts. No shared write."
  reason: "The visual records do not depend on which policy maps a radius, and the policy does not read a visual; both consume the definition's radii, which the core lane fixes first."
---

# O-014: Define Earth, Moon and Sun once and assemble experiences from them

## Outcome

Astraeus has a reusable asset architecture, approved at the design review gate on 2026-10-11 after three independent reviews (`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md`, Addenda 1–2 and the final review). Every celestial body is defined once in the scientific core (identity, dimensions, parent, orientation model, accuracy record) with one state-source binding; a state resolver places any catalogued body relative to any other at a UTC time through the parent chain, with one universal self-centre rule; the asset library joins each definition to a visual record with licensed textures; named compositions (Earth–Moon, Sun–Earth, Jupiter–Io) assemble bodies by id; the scene mounts a composition with its reference centre as data; paths are co-moving orbits or relative or inertial trails; and a solar-system scale policy keeps distances true while enlarging bodies by a declared factor. Three experiences are assembled from the same assets with no body definitions of their own: an Earth–Moon Explorer, Apollo 11 (unchanged behaviour) and the Perseids shower on a Sun–Earth composition without the Moon. The planets arrive through the library's VSOP87A ephemeris, validated against JPL Horizons, and a Jupiter + Io composition proves a non-Earth, non-Sun centre, a planet's gravitational parameter, IAU orientation, a spheroid and licensed donor textures through the same contracts. Every Spike 01–03 browser script passes unchanged as the regression baseline.

## Why

The owner's brief of 2026-10-11 restated the product: build the Solar System once and reuse it across many experiences. The review of Spikes 01–03 found the scientific engine sound and the `Trajectory → State` contract sufficient, but Earth, Moon and Sun defined across eleven files and hard-wired into an Earth-centred scene, which is why the paused Perseids work (O-011) kept going sideways: it needed a Sun-centred composition that did not exist. This Objective supplies the middle layer so that O-011's remaining work, and the next twenty experiences, add data and configuration rather than celestial mechanics.

## Success Conditions

The four approval gates of the design document, each with the evidence it names:

1. **Gate A — Scientific integrity.** Body definitions and state bindings live in `src/core/`; a dependency test proves `src/core/` imports nothing outside itself and the astronomy library. The resolver's native-centre and root rules hold; a self-centred State is valid only at exactly zero and `stateOf(b, t, b)` is that State for every body; the three invariance tests hold (presentation-independence of `stateOf(b, t, c)` for every `c`; round-trip identities within 1e-6 km; byte equality across separately created resolvers from the same constants); the resolver's Moon-from-Sun equals the removed `MoonTrajectory` Sun branch within 1e-9 km at the archived Horizons dates.
2. **Gate B — Asset independence.** Earth, Moon and Sun are defined once: the catalogue and resolver reject duplicate ids, and no module outside `src/core/` exports a definition or binding. The Earth–Moon Explorer and Apollo 11 render from the same two assets with identical scientific results; Apollo's `browser-spike02.mjs` passes without modification and the owner's look finds Apollo unchanged at the six telemetry times.
3. **Gate C — Genuine composability.** Perseids mounts on the Sun–Earth composition with the Sun drawn, Earth on its orbit and no Moon, with the shower builder changed only in its composition and catalogue items. The Jupiter + Io composition renders, focuses, labels and lights both bodies about Jupiter; Io's Jupiter-centred position is checked against JPL Horizons at six or more dates and classified by the one-Io-diameter line, with the figure recorded either way.
4. **Gate D — Production foundations.** GPU precision at 1 AU is measured and recorded (pixel jitter over 60 frames at true scale, both centres); planet positions and IAU rotation are validated against Horizons and published sub-Earth longitudes with maxima recorded; every definition carries an accuracy record (dimension and position provenance, validated date range, orientation limitations, including the Moon's 254 km / 8.4° offset); the per-body lighting loop is compared with a single Sun light and the choice recorded with evidence; every texture carries a licence or an explicit local-only declaration, and a public build is shown to contain no local-only bytes.
5. **Regression.** Configured typecheck, build and test gates pass; every browser script passes with zero console errors in fresh run directories at 1280×800 and 390×844; name check extended to `src/assets/` (bodies may be named there, experiences never); Design reconciled with every drift note accounted for.

## Architectural Considerations

The design document is the contract; its section C interfaces, D worked examples and E migration are the plan, and its Addenda record the review corrections that Tasks carry:

- Layer rule: `src/core/` (engine) imports nothing from `src/assets/`, `src/app/`, `src/shell/` or `src/experiences/`; `src/assets/` imports core and Three.js; experiences import both and are the only place with mission, shower or dataset names (Guardrails ARCH-04).
- One definition per body in core; experiences reference bodies by id and have no field to supply a state source for a catalogued body (ARCH-05).
- `CenterId` opens to any body the resolver knows (Decision 1); `createCenteredPosition` accepts `body === center` only at exactly zero.
- `Trajectory` keeps its signature; catalogued providers compute in their native centre only; the Sun is the root with no binding (`BodyAsset.source` optional for the root only, final review correction 1).
- `PathLayer` is `orbit` (co-moving, optional centre) or `trail` with `frame: "relative" | "inertial"` (final review correction 2); `TrackedBodyView` is a relative trail.
- Spheroids map equatorial and polar radii independently through `mapRadius`; the mean radius remains the metric and framing value (final review correction 3).
- Textures carry an `AssetLicence` or a `localOnly` declaration with a public replacement; a public build substitutes at the import and a validator hashes `dist/` (PROV-02).
- Planets through the pinned Orb package's VSOP87A (Decision 2); no new dependency.
- Lighting: per-body lights kept through the slice; the single-Sun-light comparison is measured in the planets step (Decision 4).
- Renames: `EarthMoonScene` → `AstraeusScene`; `src/mission/` and `src/showers/` → `src/experiences/` as behaviour-free commits (Decision 3).
- ARCH-02 and ARCH-03 as always: presentation never changes State; every generic capability is proven on made-up configuration first.

## Confirmed Decisions — 2026-10-11

Owner decisions 1–8 and the three reviews are recorded in `docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (section F, Addendum 1 Decision 8, Addendum 2, Final review). In the planning session the owner also decided:

- T-041 (Sun and Sun-centred paths) is superseded by this Objective and removed; its partial code (`src/app/SunCentredView.ts`, `src/core/sunCentredSources.ts`, the `sun-centred` layer, the belt fixture and tests) is kept uncommitted as the seed of the Sun asset and the path layer, to be committed as the baseline before the first Task starts.
- The stopped T-041 session's overwrite of the committed Spike 01/02 anchor-label evidence was reverted and its empty run folder removed.
- O-011 resumes after this Objective (its success conditions 3, 4 and 5 are delivered here), and its Tasks T-038 to T-040 are re-planned accordingly.
- **Mandatory Task Checks on T-042 and T-044.** The owner requires an independent Task Check on the core-contracts Task and the scene-generalisation Task before their dependants start, and has declined a Task-check waiver for both in advance; no executor may record one. Task Checks on the other seven Tasks remain optional under TEST-04; the Full Objective Check covers all nine.

## Boundaries

**In scope:**
- Migration steps 1–6 of the design: core definitions, bindings and resolver; visual assets and `BodyView`; compositions, scene centre, `AstraeusScene`, path kinds, precision measurement; solar-system scale and experience-declared scale choices; Earth–Moon Explorer, Apollo rewiring, Perseids on Sun–Earth, folder moves, public-build gate; planets through VSOP87A, IAU orientation, Jupiter + Io, the lighting comparison, planet paths for Perseids; cross-experience regression and Design reconciliation.

**Out of scope:**
- Step 7 of the design (rings primitive, Saturn, remaining moons, the full `solarSystem` composition); the Perseids story, stream data decision, Geminids and findings (O-011, O-012); the Earth-based viewing perspective; the imperative `Astraeus.Scene` API; N-body or perturbations; a star field; new dependencies; a Jupiter texture until a source and licence are recorded.
