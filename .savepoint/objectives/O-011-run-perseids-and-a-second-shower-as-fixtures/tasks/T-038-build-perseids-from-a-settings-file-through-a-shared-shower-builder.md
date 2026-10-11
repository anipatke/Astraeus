---
id: T-038
title: Build Perseids from a settings file through a shared shower builder
objective: O-011
status: planned
depends_on: [{task: T-036, requires: clear}, {task: T-037, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: o011-replan-t038-2026-10-11}
lane: showers
planned_reads: [src/app/experienceDefinition.ts, src/core/orbitGroup.ts, src/core/pointGroup.ts, src/core/timeWindow.ts, src/core/provenance.ts, src/shell/experience.ts, src/shell/metrics.ts, src/synthetic/syntheticDefinition.ts, src/synthetic/syntheticRingDefinition.ts, src/main.tsx, src/showers/showerSettings.ts, src/showers/showerDefinition.ts, data/showers/perseids.json, tests/showers.test.ts, tests/experiencePlugIn.test.ts, tests/syntheticRing.test.ts, tools/validate/browser-showers.mjs, tools/validate/browser-synthetic-belt.mjs]
planned_writes: [src/showers/showerSettings.ts, src/showers/showerDefinition.ts, data/showers/perseids.json, src/main.tsx, tests/showers.test.ts, tests/experiencePlugIn.test.ts, tools/validate/browser-showers.mjs]
check_waiver:
    task: T-038
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-11T08:20:03Z"
---

# Build Perseids from a settings file through a shared shower builder

## Outcome

A shared shower builder in `src/showers/` turns a shower settings file into an `ExperienceDefinition`, and Perseids runs from `data/showers/perseids.json`. Published facts are cited and carry their stated source. The modelled stream is the parent's whole loop around the Sun at true scale plus a denser band where Earth crosses, presented with the Sun and the planets' paths through O-014's Sun–Earth composition, catalogue planets and path layer (the Objective's Re-plan of 2026-10-11 replaces every T-041 reference in this Task with O-014). The story target is meteorshowers.org's presentation of a shower (Objective Replan Decision 4), reached only through generic contracts. The whole loop is also an engine stress test: whether camera reach, precision at about 51 AU, groups and frame rate hold, recorded whether they pass or fail. The stream and the rate curve between published points are `illustrative`. Earth visibly passes through the stream across the activity window. The entry finds shower settings files by name, so a later shower needs no entry change.

## Astraeus Hypothesis

- **Capability tested:** that a materially different experience (many particles, a lasting activity window, mixed published and modelled data) is hosted by existing generic contracts alone.
- **Contract reused:** `ExperienceDefinition` with the `points` layer and `groups`; `createOrbitGroup` (Sun-centred, `ecliptic-j2000`, uniform spread, seed); `TimelineWindow` with peak, rate samples and provenance spans; the `rate` metric through `createMetrics` and `rateAt`; the `radec` coordinates metric for the radiant; camera presets; camera reach (T-037); `Provenance`.
- **Contract reused (added by the replan, updated for O-014):** the Sun as a catalogue asset, the `sunEarthSystem` composition with `sceneCenter: "sun"`, `PathLayer` orbits sampled from catalogue planet providers and the parent's Keplerian source, and the solar-system scale choice.
- **Stress hypothesis (added by the replan):** the whole loop at true scale (out to about 51 AU) is hosted by the existing groups, camera reach (T-037) and floating origin without a generic change. Measured: framing within reach, precision at that range, members near Earth, frame rate. A failure is a recorded finding for O-012 and REPLAN REQUIRED, not a patch.
- **Gap or hypothesis:** that no further generic change is needed beyond O-014. Watch in particular: whether a uniform spread of elements gives a stream that Earth passes through across the whole window; whether centroid focus suits a stream; whether `createObjectMetrics`' Moon readings leak into a shower; and whether the entry can find settings by name without per-shower code.
- **Generic change:** none expected. Any need is STOP — REPLAN REQUIRED, with the gap and a proposed generic solution recorded. It is not patched in this Task.
- **Perseids-independent evidence:** the builder's contract tests run with a made-up shower settings object (no Perseids values). The name check confirms generic files gained no shower naming. Geminids (next Task) is the configuration-only test.

## User Check

Open the Perseids experience at desktop and phone sizes. In the Sun-centred overview, the stream is a loop around the Sun among the planets' orbits, crossing Earth's orbit. Switch to the follow-Earth view and play through the activity window: Earth passes through the denser band, the timeline shows the window with its peak, and the rate readout rises and falls. Open the stream's, the band's and the window's details and see which parts are published and which are modelled.

## Done When

1. **Facts.** `perseids.json` holds the 109P/Swift-Tuttle orbital elements and epoch (JPL Small-Body Database), the radiant RA/Dec, activity start and end, peak time and peak ZHR (IMO Working List or calendar), each with its source and access date. Values are fetched and checked by the executor from the primary source, not recalled. Anything not stated by a source is marked modelled.
2. **Settings contract.** `src/showers/showerSettings.ts` validates a settings object with named errors: required facts, finite numbers, window order, peak inside the window, spread widths, seed, member count. The builder (`showerDefinition.ts`) produces the definition from settings alone and contains no Perseids values.
3. **Stream (revised by the 2026-10-11 replan).** Two Sun-centred orbit-based groups from the settings file, both `illustrative` with limitations "modelled spread, two-body, not observed": the **whole loop** (true-anomaly spread covering the full orbit, at true scale) and a **crossing band** (the earlier local spread around the encounter node, or a justified revision). Spreads and member counts are justified in Technical Evidence. A test measures the nearest member of the combined stream to Earth at start, peak and end (under 0.05 AU, or a justified bound). Stress measurements recorded: framing the whole loop (about 51 AU aphelion) within camera reach, depth and floating-origin behaviour at that range, and frame rate with both groups (Developer frame-rate counter). A failure is recorded as a finding and returned (REPLAN REQUIRED), not patched in generic code.
3a. **Sun, paths and views.** The definition mounts the `sunEarthSystem` composition (O-014 rewired the builder to it) and declares Earth's orbit path and the planets' orbit paths as `PathLayer` entries sampled from the catalogue's providers (Mercury, Venus, Mars, Jupiter at least; their provenance is the catalogue's accuracy record; PROV-01), with no shower or planet naming in generic code. Camera presets: a Sun-centred overview that frames the whole loop, and follow Earth.
4. **Window and rate.** The activity window carries the published peak and ZHR and an `illustrative` rate curve. Provenance spans make the published peak and the modelled shape distinguishable in the info panel. The rate readout and the timeline curve both use `rateAt` over the same samples.
5. **Radiant.** The radiant appears as a `radec` readout in the info panel only, with its source.
6. **Entry discovery.** The entry finds every `data/showers/*.json` by name (for example through Vite's glob import) and mounts it as `?experience=shower-<name>` or an equivalent stated scheme. Existing experience names still work.
7. **Evidence.** Contract tests with a made-up shower settings object (`tests/showers.test.ts`). The name check still passes, and `src/showers/` is outside its generic scope only by design (stated). A browser script loads Perseids at desktop and phone sizes, steps to window start, peak and end, and checks the stream, window and readouts with zero console errors in a fresh run directory. Every other browser script still passes.
8. Configured typecheck, build and test gates pass; record counts. Owner visual judgement of Perseids as a story, against the story target (Objective Replan Decision 4), is recorded. It is required, and it is separate from the engine evidence above; neither stands in for the other.

## Context Files

`.savepoint/objectives/O-011-run-perseids-and-a-second-shower-as-fixtures/Objective.md`, `docs/ASTRAEUS_SPIKE_04_BRIEF.md`, `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`, `src/app/experienceDefinition.ts`, `src/core/orbitGroup.ts`, `src/core/pointGroup.ts`, `src/core/timeWindow.ts`, `src/core/provenance.ts`, `src/shell/experience.ts`, `src/shell/metrics.ts`, `src/synthetic/syntheticDefinition.ts`, `src/synthetic/syntheticRingDefinition.ts`, `src/main.tsx`, `tests/experiencePlugIn.test.ts`, `tests/syntheticRing.test.ts`, `tools/validate/browser-synthetic-ring.mjs`.

## Design References

Design: Experience plug-in boundary; Groups and the `points` layer (O-009); Time windows and rates (O-010); T-037's camera reach.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-05, STYLE-06, STYLE-07, STYLE-09.

## Implementation Plan

Rework after the 2026-10-11 replan. The earlier work stands (facts, settings contract, builder, entry discovery, window and rate, radiant); rework only what the replan changed. The owner returned the Task to `planned`; the rework starts it again at `build`.

1. Confirm O-014 landed as planned (Sun asset, `sunEarthSystem`, `PathLayer` orbits from catalogue planets, solar-system scale, the shower builder already on the Sun–Earth composition); return REPLAN REQUIRED if not.
2. Extend the settings contract for the whole loop, the crossing band, and the Sun and planets' paths if they come from the settings file; named errors and made-up tests as before.
3. Build both stream groups and declare the Sun and planets' paths; widen camera reach to frame the whole loop; add the overview and follow-Earth presets.
4. Re-measure Earth's nearest member at start, peak and end; record the stress measurements in criterion 3.
5. Update `browser-showers.mjs` (each prior scenario mapped to its new assertion): overview shows loop, Sun and orbits; follow Earth through start, peak, end. Run every browser script in a fresh run directory; gates; owner look.

## Boundaries

No change to `src/core/`, `src/shell/` or generic `src/app/` code. A need for one is REPLAN REQUIRED. No radiant marker, no meteor entry effects, no observed meteor data, no perturbations. Geminids is the next Task.

## Technical Verification

Focused tests during iteration. Handoff runs the configured gates and every browser script (scene-affecting fuller gate). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

The evidence below is from the first build, before the 2026-10-11 replan. Criteria 3, 3a, 7 and 8 must be re-evidenced by the rework; record the rework's evidence after this block, not over it.

Executed 2026-10-11 by the executor session (not a Check).

**Per-criterion outcomes**

1. Facts: PARTIAL, by owner decision. IMO is offline (cyberattack reported 14 Sep 2026; unreachable from this machine and from the owner's). The owner chose: run with alternatives, and supply IMO figures if found. Orbit elements and epoch are from the primary source (NASA/JPL SBDB, fetched 2026-10-11). Activity dates, peak night, ZHR 100 and radiant RA 03h 12m / Dec +58.1 deg are from the American Meteor Society Meteor Shower Calendar 2026/2027 (https://www.amsmeteors.org/calendar/, fetched 2026-10-11), labelled as AMS and not IMO in `data/showers/perseids.json`. The AMS page gives no peak time and no equinox for the radiant, so the peak instant (2027-08-13T00:00Z) is chosen inside the published night "Aug 12-13" and the radiant frame reads "equinox not stated by source". The window end reads "through Aug 24" as 2027-08-25T00:00Z. Replacing these with IMO values needs only a settings-file edit.
2. Settings contract: met. `showerSettings.ts` validates with named field errors (13 error cases tested); `showerDefinition.ts` holds no shower values.
3. Stream: met. Sun-centred, `illustrative`, "Modelled spread, two-body, not observed." Spread half-widths: node longitude 24 deg, true anomaly 40 deg, inclination 1 deg, argument of periapsis 1 deg, eccentricity 0.0005, semi-major axis 0. Reasoning: Earth moves about 1 deg of heliocentric longitude per day, so a 39-day window needs about +/-19.5 deg of node spread; members move about 1.3 deg of true anomaly per day near the node, so about +/-25 deg of along-orbit spread; margins added after trial runs (22 / 35 deg left the nearest member 0.07 AU away at the start; 24 / 40 gave 0.029 AU). A test measures the nearest member to Earth at start, peak and end: all under 0.05 AU (trial values 0.029, 0.0045, 0.0092 AU). A uniform spread suffices; no REPLAN needed.
4. Window and rate: met. The published peak of 100 and the daily samples feed both the timeline curve and the readout through `rateAt` (tested equal). Provenance spans: modelled rise (illustrative), published peak night plus/minus 12 h (observed, AMS), modelled fall (illustrative). The browser shows 0 at start, 100 at peak, 6 at end.
5. Radiant: met. A `radec` readout in the stream's info panel only, with its source; no marker.
6. Entry discovery: met. `import.meta.glob("../data/showers/*.json")` in `src/main.tsx` mounts `?experience=shower-<name>`; only the requested one is built. Apollo, synthetic, synthetic-ring and synthetic-belt names verified in the browser script.
7. Evidence: met. `tests/showers.test.ts` (made-up shower, no Perseids values, plus Perseids checks). `tests/experiencePlugIn.test.ts` gained a shell-mount test and a statement that `src/showers/` is outside the generic-name check by design. `tools/validate/browser-showers.mjs` ran at 1280x800 and 390x844, stepping to start, peak and end, with zero console errors, in the fresh directory `docs/evidence/o011-t038-2026-10-11/`. All other browser scripts re-ran there with empty error files and exit 0: browser-shell, browser-spike02, browser-spike03, browser-synthetic, browser-synthetic-ring, browser-synthetic-belt, browser-anchor-labels, plus anchor-consistency.
8. Gates: typecheck clean; build succeeded (existing chunk-size warning only); tests 18 files, 351 tests passed. Owner visual judgement of Perseids as a story: PENDING (owner_validation required).

**Commands run:** `npm run typecheck`; `npm run build`; `npm test`; `npx vitest run tests/showers.test.ts` (iteration); `npx vite --port 5199` (stopped afterwards); `node tools/validate/browser-showers.mjs` and the eight other scripts above with `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`; a curl fetch of the JPL SBDB record.

**Files read:** the Task's Context Files. Extra reads beyond them, with reasons: `src/core/referenceCenters.ts` (Earth position from the Sun, for the distance test); `src/app/metricReadouts.ts` (whether Moon readings leak into a shower); `src/shell/TimelineBar.tsx` (window and peak button hooks for the browser script); `src/shell/ObjectControls.tsx` (the Info button's name); `tools/validate/browser-spike03.mjs` (seek and compact camera picker patterns).

**Files changed:** new `src/showers/showerSettings.ts`, `src/showers/showerDefinition.ts`, `data/showers/perseids.json`, `tests/showers.test.ts`, `tools/validate/browser-showers.mjs`; edited `src/main.tsx`, `tests/experiencePlugIn.test.ts`; evidence under `docs/evidence/o011-t038-2026-10-11/`. No change to `src/core/`, `src/shell/` or generic `src/app/`.

**Limitations:** AMS (secondary) figures stand in for IMO. The peak instant, the window-end reading, the rate-curve shape (fall-off 0.1 powers of ten per day; it looks asymmetric because the peak is late in the window) and the stream spread are modelled. Two-body from the peak epoch: the 1995 element epoch is not propagated to 2027 (the stream is placed at the node at the peak). Earth is a few pixels against an AU-scale stream and is found by its label. The browser "stream visible" check counts amber pixels only. Uncommitted T-037 work is in the same tree.

## Drift Notes

Record architecture deltas and every reuse or gap observation here. T-040 reconciles them, and O-012 uses them for the findings.

- **Reused unchanged (hypothesis held):** `ExperienceDefinition` with `points` and `groups`, `createOrbitGroup` (Sun-centred, ecliptic-j2000, uniform spread), `TimelineWindow` with peak, rate samples and provenance spans, the `rate` metric and `rateAt`, the `radec` coordinates metric, camera presets and camera reach (T-037), `Provenance`. No generic change was needed.
- **Uniform spread works for a stream:** node and anomaly spreads of about the window length in Earth-days keep a member near Earth across the window. This is a two-body placement at the peak epoch, not a propagation of the published element epoch.
- **Camera and scale:** centroid focus frames the stream, but Earth is nearly invisible at AU scale. The builder keeps Earth's label visible at long range (`labelMaxDistance` set to the camera far plane). O-012 finding: a generic way to mark a small body inside a large group may be wanted.
- **Moon readings:** `createObjectMetrics` with no tracked bodies gives Moon readings on Earth only and none on the stream, so nothing leaks (tested).
- **Entry discovery:** a glob of `data/showers/*.json` gives name-based mounting with no per-shower code. For T-040 (Design.md, or explicitly non-architectural): the shower builder module `src/showers/` sits outside the generic-name check by design; the entry glob.
- **Provenance source types:** a published calendar value is marked `observed`; there is no `published` type. O-012 finding candidate.
- **Source gap:** IMO is offline and AMS is used. Replace the figures and source lines when IMO is back.
- Deferred to T-040: Design reconciliation of all notes above.

## Replan Handoff

Recorded by the executor after the owner's visual look at the Perseids screenshots and the owner's decision to stop and replan.

- **What broke:** the scene layers are `earth-moon`, `tracked-bodies` and `points`; the Sun is only a lighting direction (`EarthMoonScene.tsx`), never drawn. Perseids is Earth-centred with a Sun-centred stream about 0.5 AU wide, so with no Sun marker or Earth-orbit line the owner has no frame of reference. The owner's words: "without the sun, i dont have a frame of reference".
- **Related finding:** the close-up reads as a dense amber slab and the zoomed-out view as a solid patch; Earth is a few pixels and shows only by its label. "Earth passes through the stream" holds in the numbers (nearest member under 0.05 AU at start, peak, end) but cannot be seen.
- **Proposed generic solution (for the planner):** an optional generic reference layer, for example a `references` list on `ExperienceDefinition` with a Sun marker and an Earth-orbit path drawn in the same render space, labelled and clickable like other objects. Its own Task, with camera and scale checks, before T-038 is re-looked at.
- **State kept:** all partial work stands (builder, Perseids settings, tests, browser script, evidence) and all gates passed as recorded in Technical Evidence. The Task stays `in_progress`, `stage: audit`. Owner visual judgement is not given.
- **Owner direction on the stream shape (after the replan was recorded):** the stream should be the parent body's whole orbit, a loop around the Sun that Earth crosses, not a local patch at the crossing. The current model spreads true anomaly only +/-40 deg around the encounter node (and node longitude +/-24 deg) so that Earth is always inside it; this was the executor's choice, not the owner's, and it reads as a floating block. A full-orbit version needs a true-anomaly spread of 180 deg (reachable with the existing group, untested). Open points for the planner: the orbit reaches about 51 AU while Earth's orbit is 1 AU, so framing needs an inner-region view or camera reach; fewer members would sit near Earth, so the "Earth inside or beside the stream" measure (under 0.05 AU at start, peak, end) must be re-measured, possibly with more members or a denser sampling near the crossing.

## Replan Resolution

Resolved 2026-10-11 by the planner (session o011-replan-t038-2026-10-11) with the owner's decisions recorded in the Objective's "Replan Decisions — 2026-10-11 (T-038)". The proposed generic reference layer became T-041 (landmarks, proven on the made-up belt), and this Task now depends on it. The stream becomes the whole loop at true scale plus a crossing band (criteria 3 and 3a). The `replan:` frontmatter block is removed; the original reason, recorded by the executor at 2026-10-11T08:12:36Z, is kept in the Replan Handoff above. Status and stage are unchanged by the planner.
