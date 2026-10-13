---
id: T-038
title: Build Perseids from a settings file through a shared shower builder
objective: O-011
status: planned
depends_on: [{task: T-052, requires: clear}, {task: T-053, requires: clear}, {task: T-054, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: o011-replan-i025-2026-10-13}
lane: showers
planned_reads: [docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md, docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md, data/showers/perseids.json, src/experiences/showers/showerSettings.ts, src/experiences/showers/showerDefinition.ts, src/core/listedOrbitGroup.ts, src/core/bodies/swiftTuttle.ts, src/assets/compositions.ts, src/assets/catalogue.ts, src/app/experienceDefinition.ts, src/main.tsx, tests/showers.test.ts, tools/validate/browser-showers.mjs]
planned_writes: [data/showers/perseids.json, tools/data/fetch-meteoroid-orbits.mjs, src/experiences/showers/showerSettings.ts, src/experiences/showers/showerDefinition.ts, src/assets/compositions.ts, tests/showers.test.ts, tools/validate/browser-showers.mjs, docs/ASTRONOMY_VALIDATION.md]
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

Perseids is visually and factually correct against the reference (I-025, O-011 Success Conditions 6, 8, 11 and 12). The stream is drawn from the measured CAMS Perseid orbits (filtered subset committed under `data/showers/`, each member traceable to its record) through the listed-orbit group. 109P/Swift–Tuttle is drawn as a body with its whole orbit; the planets and Earth sit on their orbits as labelled markers; the real sky is behind them. The shower builder gains only generic wiring: settings name the measured-orbit file, the composition includes the comet and planets, and the presets include a whole-orbit overview. The information panel says which parts are measured, which are modelled, and where each comes from.

## Astraeus Hypothesis

- **Capability tested:** Gate C of the brief end to end: a materially different experience assembled from generic capabilities only (listed-orbit group, catalogued comet, markers, long-orbit paths, sky, Sun-centred scene, solar-system scale).
- **Contract reused:** everything from O-014 and T-052–T-054; `TimelineWindow`, `rateAt`.
- **Gap:** the stand-in uniform-spread stream (`data/showers/perseids.json` `stream.spread`); invisible planets; a truncated parent orbit; no sky.
- **Generic change:** none expected beyond wiring. Any engine need is REPLAN REQUIRED.

## User Check

Open Perseids and meteorshowers.org/view/Perseids side by side. The stream follows Swift–Tuttle's orbit out into the outer solar system, as a swarm, not a sheet. The comet and planets are visible on their orbits, the sky is real, Earth crosses the stream around Aug 12–13, and following Earth through the encounter works. The owner accepts the shape and orbit, or names what differs.

## Done When

1. The stream is the CAMS Perseid subset chosen in T-051, loaded through `createListedOrbitGroup`; the local data file (git-ignored `data/local/`, written by a committed generic fetch tool that selects by the IAU shower code in the settings file; never committed or shipped, owner decision T-051 replan) carries source, release, terms status and access date; without it the experience says the data is not fetched and draws no stream; the member count is recorded; every member's `recordId` resolves to its CAMS record (test on a sample of 20).
2. **Factual checks, each against an independent source, recorded with figures:**
   - (a) Earth's distance to the nearest stream members is smallest within ±2 days of the published peak.
   - (b) The radiant computed from the members crossing Earth's orbit at the peak lies within 3° of the published radiant (RA 48°, Dec +58°, source cited).
   - (c) The comet's position comes from T-054's Horizons-checked body.
   - (d) The planets' positions come from the O-014 catalogue.
3. The comet's whole orbit is drawn, and the overview preset frames it. The planets and comet show as labelled markers at true scale and as bodies under the solar-system scale. The sky is on.
4. Performance: frames per second with every stream member drawn, measured on the owner's machine with the Developer counter, are at least 30. Phone figures are recorded, not required. If the subset has fewer than 20,000 members, all are drawn and the count is stated.
5. The stand-in `stream.spread` is removed, and no invented member remains. `browser-showers.mjs` asserts the members are drawn, the comet and planets are visible with labels, the crossing is at the peak, and there are zero console errors at both sizes. Each prior scenario is kept and mapped.
6. The name check passes; gates pass; every browser script passes in a fresh run directory; the owner's look against meteorshowers.org is recorded separately.

## Context Files

`docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md`, `docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md`, `data/showers/perseids.json`, `src/experiences/showers/showerSettings.ts`, `src/experiences/showers/showerDefinition.ts`, `src/core/listedOrbitGroup.ts`, `src/core/bodies/swiftTuttle.ts`, `src/assets/compositions.ts`, `src/assets/catalogue.ts`, `src/app/experienceDefinition.ts`, `src/main.tsx`, `tests/showers.test.ts`, `tools/validate/browser-showers.mjs`.

## Design References

Design: Asset architecture (O-014); groups and points layer; the shower builder.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, PROV-02, TEST-01, TEST-03.

## Implementation Plan

1. Confirm T-051's local-data decision is recorded, and that T-052–T-054 landed; REPLAN REQUIRED otherwise.
2. Write the generic fetch tool and fetch the Perseid subset locally with its provenance header; wire the settings and builder to the listed group, the comet, the planets and the sky.
3. Factual checks (a)–(d) as tests with cited reference values.
4. Browser assertions and performance measurement; gates and every browser script.

## Boundaries

No Watch-from-Earth view, no radiant marker in the scene, no meteor entry. No invented members.

## Technical Verification

Focused tests, configured gates, every browser script in a fresh run directory, and the performance figure on the owner's machine. Evaluated under `agent-skills/references/check-method.md`.

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

## Replan — 2026-10-13 (I-025)

Rewritten in planning after O-014 and the owner's look at Perseids on the Sun-centred scene. The earlier Outcome, Done When and Implementation Plan (shower builder with an `illustrative` swarm) are superseded by the sections above. The earlier evidence, Replan Handoff and Replan Resolution remain as history. The existing `check_waiver` predates this rewrite, and its scope (the earlier Task content) has materially changed, so it does not cover this Task's new outcome. A Task Check or a fresh owner waiver is needed at handoff.
