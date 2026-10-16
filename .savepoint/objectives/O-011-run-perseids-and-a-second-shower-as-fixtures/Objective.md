---
id: O-011
title: Run Perseids and a second shower as test fixtures
status: done
depends_on: [O-010, O-014]
release: G-004
lanes:
  - {key: timeline-window, title: Readable time window}
  - {key: camera-reach, title: Camera reach per experience}
  - {key: sun-scene, title: Sun-centred scenes, paths and solar-system scale}
  - {key: stream-data, title: Measured meteoroid orbit research}
  - {key: showers, title: Shower builder, Perseids and Geminids}
  - {key: sky, title: Real stars and Milky Way}
  - {key: bodies, title: Comet, markers and long orbits}
---

# O-011: Run Perseids and a second shower as test fixtures

## Outcome

Astraeus hosts a Perseids experience that is visually and factually correct against the reference capability spec (`docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md`) and https://www.meteorshowers.org/view/Perseids, except the Earth-based perspective, which stays deferred. The Sun is the scene's centre. The stream is drawn from measured Perseid meteoroid orbits (NASA CAMS) along the orbit of its parent, 109P/Swift–Tuttle. The comet, Earth and the planets sit at their real positions on their orbits, visible as labelled markers at true scale. The comet's whole orbit (aphelion about 51 AU) is reachable by the camera. Every experience has a real starry sky: catalogue stars at their true positions and brightnesses, plus an aligned, licensed Milky Way image. A Geminids experience is then added with configuration and data only. Every piece comes from generic capabilities, each proven on made-up configuration first. Apollo and the other experiences keep working unchanged.

## Why

The brief (`docs/ASTRAEUS_SPIKE_04_BRIEF.md`) asks whether Astraeus can host a materially different experience through generic capabilities. The owner's reference spec sharpens that: an experience comparable to MeteorShowers.org without a bespoke astronomy engine. The first Perseids build sat inside the Earth–Moon scene with an invented local patch of stream and no frame of reference; the owner rejected it. The Earth-centred scene, the Earth-and-Moon package and the Earth–Moon scale settings are the engine assumptions this Objective now tests and replaces with generic choices.

## Success Conditions

1. **Readable window (I-019).** Done in T-036. On the timeline, a window's band, rate curve and peak read as one linked shape. An experience without windows (Apollo) looks unchanged.
2. **Camera reach per experience.** Done in T-037. `ExperienceDefinition` takes optional camera reach; without it every existing experience keeps today's limits. Presentation only (ARCH-02).
3. **Sun-centred scenes.** An experience declares its scene's reference centre (Earth or Sun). Earth is a scene component independent of the Moon; the Moon is never mandatory. The Sun is drawn. In a Sun-centred scene Earth moves on its actual orbit. Apollo stays Earth-centred and renders, navigates and measures exactly as before. Frame and centre conversion go through the existing composition; State never depends on the chosen centre (ARCH-02). Precision at solar-system distances is measured. Proven on the made-up Sun-centred belt.
4. **Paths from any source, with visibility.** An experience declares paths, each sampled from an existing state source (a `Trajectory`, including Keplerian orbital-element providers and Earth's own Sun-centred state) over a span. Paths are labelled, selectable and carry provenance. The viewer can show or hide paths. Planets' paths are data supplied by an experience, never a built-in list. Proven on made-up sources.
5. **Solar-system scale.** A scale setting for solar-system distances keeps distances true and draws bodies larger by a factor stated in each body's info (presentation only, PROV-01). An experience declares which scale settings it offers; Apollo keeps True and Readable unchanged.
6. **Stream from measured orbits (I-025).** A bounded research Task establishes that the NASA CAMS Meteoroid Orbit Database (v3.0 or later) may be redistributed as a filtered subset, and records licence, format, Perseid member count, accuracy and how members are propagated. The stream is drawn from those measured orbits, each member traceable to its database record, and the information panel says so (spec item 7). If the licence does not permit redistribution, the Objective stops and the finding returns to the owner. There is no silent fallback to an invented swarm (owner decision 2026-10-13). *Amended 2026-10-13 (T-051 replan):* the terms are silent, so the measured data is fetched locally and never committed or shipped; see Replan — 2026-10-13 (T-051 data terms).
7. **Shared shower builder.** Shower code lives outside generic code (`src/showers/`). It turns one shower settings file (`data/showers/<name>.json`) into an `ExperienceDefinition` using only generic contracts. The entry finds shower settings files by name. Generic code gains no meteor, shower or Perseids naming (name check).
8. **Perseids to the reference spec, visually and factually correct (I-025).** In a Sun-centred scene with no Moon: Earth, the planets and 109P/Swift–Tuttle at their real positions as catalogued bodies on their paths, with the comet's whole orbit drawn and reachable; the stream from the measured orbits; Earth's crossing of the stream visible; the activity window and rate relating the crossing to the annual shower; presets for a solar-system overview and following Earth; orbit, pan, zoom, time, selection and path visibility. Published facts are cited with their stated source; modelled parts are `illustrative` (PROV-01). **Performance:** at least 30 frames per second with at least 20,000 stream members on the owner's machine, measured with the Developer frame-rate counter; phone figures recorded, not required. **Factual checks, each against an independent source:** the comet's position against JPL Horizons; Earth's crossing of the stream at the published peak (Aug 12–13); the radiant computed from the drawn stream against the published radiant; every member traceable to its CAMS record. **The owner's look side by side with meteorshowers.org** (stream shape, comet orbit, planets and sky) is required and separate from the engine evidence.
9. **Geminids, configuration only (pass/fail).** A Geminids settings file, plus its measured-orbit data file filtered from the same database, runs with zero code change anywhere. Any code need is a recorded finding returned to the owner, never patched silently.
10. **Cross-experience regression and spec walk-through.** Configured gates pass. Every browser script passes with zero console errors in fresh run directories: Apollo, synthetic, synthetic-ring, the belt, Perseids and Geminids at mobile and desktop sizes. Scripts the changes invalidate are updated with each prior scenario mapped. Each of the spec's six viewer acceptance criteria is walked through and recorded as met, partly met or a gap. Deferred drift notes are reconciled into Design.
11. **A real starry sky for every experience.** Stars from the Yale Bright Star Catalogue (5th rev. ed.), fetched locally and never committed (T-051 replan), are drawn at their J2000 positions in the EQJ frame, with brightness from magnitude. A Milky Way image with a recorded source and licence is aligned to the same frame. The sky sits at infinity: it does not move with the scene centre, floating origin or scale policy, and it rotates only with the camera (ARCH-02). It is a generic capability, proven on a made-up star list, and the information panel cites its sources (PROV-01, PROV-02).
12. **Bodies visible on their orbits.** Catalogued bodies shown in an experience (the planets, 109P/Swift–Tuttle) are drawn at their real positions. At true scale they appear as labelled markers, stated as a drawing aid; under the solar-system scale they appear as enlarged bodies. This is generic: any composition body too small to see gets a marker.

## Architectural Considerations

- Stop condition (brief): bypassing a contract, adding shower logic to generic code, or changing State for presentation returns REPLAN REQUIRED.
- One generic scene, not a second engine. The scene's reference centre is an experience setting; the existing floating origin, render axes and centre composition do the placement. `EarthMoonScene` is generalised or renamed as the executor finds cleanest; Apollo's behaviour is the regression baseline.
- Earth and the Moon become separate scene components. The `earth-moon` layer may stay as Apollo's shorthand, but an experience can have Earth without the Moon.
- The `Trajectory → State` contract stays valid for single objects. Keplerian providers are `Trajectory` sources built on `TwoBodyAdapter`; groups (`PointGroup`, `createOrbitGroup`) stay the contract for large populations and the `points` layer stays their batched renderer.
- A new `ScalePolicy` implementation for solar-system distances is allowed; the `ScalePolicy` contract itself changes only with a recorded reason.
- The shower builder is an experience adapter, not engine code. It may hold shower concepts (radiant, ZHR, parent body).
- A group built from a list of measured per-member orbits, if the data decision needs one, is a generic capability with its own made-up proof, planned after the research Task.
- The window and rate contracts (`TimelineWindow`, `rateAt`) stay unchanged; the rate readout and the timeline curve share them (STYLE-07).

## Confirmed Decisions — 2026-10-11

Owner confirmed in the O-011 planning session:
1. **Configuration only means a settings file.** One shared shower builder is written with Perseids. The second shower adds only a settings file and no code. This is a clear pass/fail test.
2. **Experiences set their own camera reach.** This is a generic change in this Objective, proven on the made-up belt; Apollo keeps today's limits.
3. **I-019 is repaired here, first**, on the made-up window, before Perseids uses the window.
4. **Radiant appears in the information panel only** (a `radec` readout). No scene marker; GAP-5 stays a recorded open gap for the findings.

Planner-settled choices, stated in the confirmation summary and confirmed with it: Geminids as the second shower; the entry discovers shower settings by name, so the entry itself does not change for a new shower; a Geminids code need stops and is reported as a finding; owner looks at the repaired window, at Perseids, and at the final cross-experience run; the window repair and camera reach can run side by side.

## Owner Decision — 2026-10-11 (dependency on O-009)

The owner directed that O-009 be removed from `depends_on`. O-009 was closed by owner exception (C-013 NEEDS WORK, not CLEAR), so the dependency gate kept O-011 from starting. O-011 still uses O-009's delivered group contract and `points` layer; removing the dependency waives only the gate, not that reliance. Recorded by the agent on the owner's direct instruction.

## Replan Decisions — 2026-10-11 (T-038)

T-038 returned REPLAN REQUIRED after the owner's look at Perseids: the scene draws no Sun or Earth orbit, so the stream had no frame of reference ("without the sun, i dont have a frame of reference"), and the local patch of stream read as a floating block. The owner pointed to meteorshowers.org as the kind of view wanted. Owner decisions, of which 1 is superseded by the reference spec below:
1. *(Superseded.)* T-041 was to draw the Sun and Sun-centred paths inside the Earth-centred scene and test whether that scene could present a Sun-centred view.
2. **The stream is the parent's whole orbit, not a local patch,** at true scale; framing it tests camera reach, precision and frame rate, and a failure is a recorded finding, not a silent patch.
3. **Camera views:** a Sun-centred overview preset and a follow-Earth preset.
4. **Story target and engine acceptance are both required.** meteorshowers.org's presentation of a shower is the story target for the Perseids fixture, and the owner's look against it is a real requirement. It never replaces engine acceptance: every piece must come from reusable capabilities proven on made-up configuration with no shower naming in generic code. This is the owner's explicit exception to the project rule that a demo's fidelity is not an acceptance target; it covers presentation only.

## Reference Capability Decisions — 2026-10-11

The owner supplied the reference capability spec (`docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md`) and, after a review against it, stopped the T-041 build session. Owner decisions:
1. **The spec is this Objective's target**, reworked in place so finished work stays counted. Its prohibitions apply: no Perseids in the Apollo Earth–Moon scene, no mandatory Moon, no Apollo reconstruction pipeline for streams, no stream orbiting Earth, no decorative animation in place of orbits, no Perseid logic in core, no single scale or centre for every experience.
2. **Stream data: research first, fall back.** A bounded research Task looks for usable published measured meteoroid orbits; if none, an `illustrative` swarm around the published mean orbit, labelled as such.
3. **Earth-based perspective: deferred.** Spec item 5 is met for the overview and following Earth only; the Earth-based view is a recorded gap for O-012.
4. **Solar-system scale: true distances, enlarged bodies,** the factor stated in each body's info.
5. **Performance target: at least 30 frames per second with at least 20,000 stream members** on the owner's machine.
6. **The O-013 workflow retrospective is removed** (owner: "bin the retro").

Planner-settled choices, confirmed with the plan: the order is Sun-centred scenes (T-041, reframed), then paths with visibility, then solar-system scale, with the research Task running alongside; then Perseids (T-038), Geminids (T-039), and the cross-experience check (T-040). Geminids stays configuration-only, stricter than the spec's "substantially less work". The stopped session's partial code (Keplerian and Earth Sun-centred `Trajectory` sources, path sampling, Sun and path views) is reviewed by the Tasks that own it and kept, reworked or removed with a record.

## Re-plan — 2026-10-11 (asset architecture, O-014)

The owner paused this Objective after the T-041 build session and supplied a new brief, "Spike 04: Reusable Asset Architecture", because Perseids was becoming another experience-specific construction without the architectural foundation. The resulting design (`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md`) was approved after three independent reviews and is implemented by O-014, which this Objective now depends on. Owner decisions in the planning session:

1. **T-041 is superseded and removed.** The Sun as a drawn body, Sun-centred paths and the Sun-centred view become O-014's Sun asset, Sun–Earth composition and path layer. Its partial code is kept as O-014's seed; its empty run folder and its overwrite of committed Spike 01/02 evidence are scrapped.
2. **Success conditions 3, 4 and 5 are delivered by O-014**, not here: Sun-centred scenes with Earth independent of the Moon (O-014 Gate C), paths from any source (`PathLayer` as orbit or trail) and the solar-system scale. This Objective verifies them only in the Perseids context. The planets' paths come from O-014's catalogue (Jupiter, Mars, Venus, Mercury through VSOP87A), not from a planet list in the shower builder.
3. **What remains here:** the stream data decision (condition 6); Perseids to the reference spec on the Sun–Earth composition with the planets' paths, performance and the owner's look (8); Geminids from configuration only (9); the cross-experience walk-through and Design reconciliation (10). T-038, T-039 and T-040 carry it; T-038 no longer depends on T-041.
4. **Entry rewiring:** the shower builder's composition swap (`sunEarthSystem`, `sceneCenter: "sun"`, catalogue items for Sun and Earth, no Moon) is O-014's work; T-038 starts from that state and confirms it before adding the stream decision and planet paths.

## Boundaries

**In scope:**
- Research on CAMS licence, format and count, and choice of star catalogue and Milky Way image; a generic group built from measured per-member orbits; the starry sky; 109P/Swift–Tuttle as a catalogued body checked against Horizons; markers for small composition bodies; camera reach and long-orbit paths to about 60 AU; the Perseids rebuild with factual checks and the owner's look; Geminids from configuration and data only; regression, spec walk-through, Design reconciliation. Timeline-window repair and camera reach are done (T-036, T-037). Sun-centred scenes, path kinds, planets and the solar-system scale are consumed from O-014.

**Out of scope:**
- The Earth-based "Watch from Earth" view (deferred again on 2026-10-13); meteor entry or atmosphere effects; a radiant marker in the scene; perturbations beyond two-body; lazy loading of the planet series (I-022); a Jupiter texture (I-024); the imperative `Astraeus.Scene` API; the findings note (O-012).

## Replan — 2026-10-13 (I-025, after O-014)

After O-014, the owner looked at Perseids on the Sun-centred scene, compared it with meteorshowers.org and found the stream a "square sheet" (the stand-in uniform-spread patch), the planets invisible, and no starry sky. The owner directed: "O11 MUST have the right shape and orbit of perseids and tutle" (I-025), "Perseids needs to be visually and factually correct", and include the starry background. Owner decisions in the planning interview:

1. **Stream data: measured CAMS orbits**, with no modelled fallback. If redistribution is not permitted, stop and return to the owner. This supersedes Reference Capability Decision 2 ("research first, fall back").
2. **Starry sky: real catalogue stars plus a licensed, aligned Milky Way image**, for every experience.
3. **Planets and the comet: real bodies with labelled markers** at true scale and enlarged bodies under the solar-system scale. This narrows the earlier out-of-scope line "planet bodies beyond drawn markers".
4. **"Watch from Earth" stays deferred.**

Planner-settled choices, confirmed with the summary: Geminids "configuration only" now means a settings file plus its measured-orbit data file, with no code. The order is research, then the measured-orbit group, the sky, and the comet with markers and reach (each proven on made-up configuration), then Perseids (T-038, rewritten), Geminids (T-039, amended) and the cross-experience check (T-040, amended). The superseded T-041 file, which was never committed, was deleted on the owner's instruction.

## Replan — 2026-10-13 (T-051 data terms)

T-051 returned REPLAN REQUIRED: the CAMS Meteoroid Orbit Database v3.0 publishes no licence or redistribution terms (only a citation request), and no bright-star catalogue is cleanly public domain (Yale BSC terms known only second-hand; Hipparcos is CC BY-NC). Owner decisions, given through the coordinator's structured questions:

1. **CAMS: ask, and keep the data local meanwhile.** The owner asks the CAMS PI (Dr. Peter Jenniskens, SETI Institute) for permission. Until written permission is recorded, measured orbit data is never committed and never in a public build. A committed, generic fetch tool downloads the release from its source (cams.seti.org) and writes filtered per-shower files under a git-ignored local data directory (`data/local/`), selecting members by the IAU shower code in each shower's settings file. No invented fallback: without the local file the experience says the data is not fetched and how to fetch it, and draws no stream.
2. **Stars: Yale Bright Star Catalogue, same local approach.** A committed fetch tool writes the subset under `data/local/`; nothing from the catalogue is committed. Without it the sky draws the Milky Way only and says the stars are not fetched.
3. **Milky Way image:** ESO/S. Brunier panorama (eso0932a), CC BY 4.0, may be committed with credit.

Planner consequences: the public-build validator must prove no `data/local/` content reaches the build. Tests that need real data skip with a stated reason when it is absent, and factual checks run on the owner's machine with the data fetched; made-up fixtures stay committed and always run. Geminids "configuration only" means its settings file plus running the existing fetch tool, with no code change; its data file is local, so the diff is the settings file alone. If permission arrives, committing the data is a later owner decision and a small change.

## Owner Decision — 2026-10-13 (placing measured members)

C-027 observation 1: CAMS gives each member's orbit but no position along it, and propagating each member from its own observation epoch to one display time scatters members 22–32 AU from the Sun. The owner chose, through the coordinator's structured question: **spread dots along each real orbit.** Each measured orbit carries a dot whose position along that orbit (mean anomaly at a reference time) is a deterministic, evenly spread drawing choice, then advances by two-body motion. The orbit's shape and orientation are measured; the position along it is `illustrative` and the information panel says so (PROV-01). This is not an invented swarm: no orbit is invented, only the phase.

Follow-up the same day: the owner asked whether real streams are evenly spread. The coordinator's answer: mostly, for an old stream such as the Perseids, but younger dust is concentrated near the parent comet (the early-1990s Perseid outbursts around 109P's 1992 return), the dots crowd at aphelion by Kepler's law, and the CAMS sample holds only Earth-crossing orbits, so the stream's true width is not shown. Owner decision: **show a clump near the comet**, clearly labelled as a model (`illustrative`). It concentrates a stated fraction of the measured orbits' dots around the parent's position along the orbit; it never adds an invented orbit. Its size and fraction are cited from published stream-modelling literature where available, otherwise stated as illustrative defaults. The information panel states: the position along each orbit is illustrative; the clump near the comet is a model; the parts of the stream that miss Earth are not shown.
