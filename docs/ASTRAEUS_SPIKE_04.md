# Astraeus Spike 04 — Reusable Engine, Tested with Meteor Showers

**Draft.** This note was written on 2026-10-16 while O-011 still awaits the owner's visual looks (the Perseids side-by-side beyond what C-031 records, and the final run sheet in T-040), and refreshed on 2026-10-17 against HEAD `94ee998` (the Refresh and Touch-up entries of the T-065 Technical Evidence list what changed). The Full Objective Checks for O-011 and O-012 are running on 2026-10-17 and are pending; nothing here relies on their results. Where the evidence is missing, the text says so and lists it under "Open questions" instead of stating it as fact. On 2026-10-17 the owner accepted I-019, I-022, I-024, I-029 and I-030 (resolution `accepted`, an owner decision, not a Check and not technical verification). I-026 (the Milky Way picture) stays open by owner decision, since it needs a better photo; I-031 (stacked markers) and I-032 (unused donor pictures) are open; this note says so wherever it relies on them. This is still a draft until the owner reads it (T-065 `owner_validation`).

The Spike 04 brief (`docs/ASTRAEUS_SPIKE_04_BRIEF.md`) makes the findings, not the demo, the deliverable. It asks six questions. This note answers each one and links to the commit, test, Check record, evidence directory or audit row behind the answer. The Perseids experience is a test fixture. Judging whether it looks right is the owner's job.

## Short answers

1. **Reused:** the `State` / `Trajectory` contract, the clock, the shell, the camera, provenance, scale policies and the Apollo reconstruction all carried the new experiences unchanged.
2. **Insufficient:** one `Trajectory` per object for populations, a single hard-wired Earth–Moon scene, instant-only events, a closed set of centres, and Earth-only scale policy.
3. **Added or changed:** point groups, a plug-in boundary, time windows with rate and provenance spans, a body catalogue with a state resolver, a Sun-centred scene, orbit paths, a sky layer, a body-from-settings record, and, after the Full Objective Check, story panels, lazy planet loading, a one-shape timeline window and view links. All additive; `State`, `Trajectory`, `Provenance`, `TimelineEvent` and the scale-policy contract were not changed as of C-026 (the later additions were not re-audited against that list).
4. **Reuse evidence:** each capability has a made-up (non-meteor) configuration and contract tests, plus a name check that fails if generic code names an experience.
5. **Limitations:** no ground observer view, no drawn radiant, two-body orbits only, headless browser evidence only, CAMS and Yale data local only, stacked story markers (I-031), and a Milky Way picture the owner finds too soft (I-026).
6. **Second shower:** the Geminids ran from a settings file with no further code change (C-033's working-tree review; the commit also carries T-055), after one generic addition (a body defined from settings) that the first attempt found it needed.

## 1. Capabilities reused

The first audit (`docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md` §1) classified 11 Perseids needs against the Spike 01–03 contracts. Five were reused as they stood.

| Capability | Evidence |
|---|---|
| Camera overview, focus and follow through generic presets | Gap audit §1 row 7; `tests/experiencePlugIn.test.ts` ("hands the shell its own objects"); browser: `tools/validate/browser-showers.mjs`, run `docs/evidence/o011-integration-20261016T063816Z/` |
| Timeline, labels, playback rates, availability | Gap audit §1 row 9; `tests/timeline.test.ts` |
| Scale range from a 100 km atmosphere to a 10^6 km stream | Gap audit §1 row 5 (the constant that needed lifting is camera reach, below) |
| Whole-object provenance and `illustrative` wording for modelled data | Gap audit §1 row 6; `tests/infoProvenance.test.ts` |
| Radiant shown as a published `radec` readout | Gap audit §1 row 2; Design.md "Open after O-011" |
| `State`, `Trajectory`, `TwoBodyAdapter`, `MoonTrajectory` and `ScalePolicy` | Gap audit §6 ("nothing found requires changing `State`, `Trajectory`, `Provenance`, `TimelineEvent` or `ScalePolicy`"); C-026 rows A3 and A4 |
| The Apollo reconstruction, unchanged | C-026 row B2: the unmodified pre-O-014 `tools/validate/browser-spike02.mjs` was run against the new code and passed; the owner accepted Apollo unchanged at the six telemetry times (T-043 and T-044 acceptance) |

## 2. Abstractions that failed or proved insufficient

| Abstraction | What went wrong | Evidence |
|---|---|---|
| One `Trajectory` per body, for a population | At 10^4 particles, per-frame `stateAt` cost about 9 ms of a 16 ms frame budget; at 10^5, about 59 ms. Cost came from per-call `createState` allocation and validation. | Gap audit §3 (a one-machine measurement, not a benchmark) |
| The app as an Apollo viewer | `App` imported Apollo and `EarthMoonScene` mounted Earth, Moon and a Moon trajectory unconditionally. | Gap audit §1 row 11 (GAP-2); I-015 "Earth–Moon layer cannot be omitted" (closed by C-011) |
| `TimelineEvent` as instants only | A shower is a window with a peak and a rate over time. | Gap audit GAP-3, GAP-3b, GAP-4 |
| Closed `CenterId` (`earth`, `moon`, `sun`) and an Earth-centred scene | Sun-centred data had to be composed back to Earth in three places, and a fourth body could not be added without editing generic code. The first Perseids build sat inside the Earth–Moon scene with an invented local patch of stream; the owner rejected it (O-011 "Why"). | `docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` §A.1; commit `864b139` (replan after I-025) |
| `ScalePolicy` being Earth-radius based | No policy for solar-system distances. | Asset architecture §A.1, limitation 5; built in `b9081fd` (T-046, C-017) |
| Camera limits and far plane as scene constants | Experiences could not set their own reach. | Gap audit §1 row 5; T-037 (O-011 success condition 2) |
| A single common-time snapshot of measured meteoroid orbits | It scatters members 22 to 32 AU from the Sun and does not put particles at Earth. The stream has to be drawn from orbit geometry. | `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md` §1 "Design consequence"; commit `864b139` |
| Hand-written, comet-specific path code | The first attempt at a planet-specific orbit mode was replaced by a generic planet source. | Asset architecture §A.1 (Perseids limitations); `src/core/bodies/planetTrajectory.ts` |

Two things were found inside the work, not by the audit. First, the Geminids' parent, 3200 Phaethon, was not catalogued, so the first configuration-only attempt returned a finding (T-039, described in C-033 "History"). Second, the shower peak was first read in the equinox of date, not J2000; the checker caught it and I-027 fixed it (`tests/solarLongitudeConvention.test.ts`).

## 3. Capabilities added or changed, and why

All of these were chosen under rule 7 of the brief (why it belongs in Astraeus and not in the Perseids adapter). Each reasoning is in the gap audit §2 or the asset architecture note.

| Capability | Why generic | Commit and Check |
|---|---|---|
| Experience plug-in boundary (`ExperienceDefinition`, layer flags, name check) | The adapter cannot remove an import from generic code. | `bc080c4` (O-008); C-010 NEEDS WORK, C-011 CLEAR |
| Point group (`PointGroup`, batch fill into a typed array, orbit group, points layer) | Debris, belts and rings have the same shape. | `bc080c4` (O-009); C-012 and C-013 (see Open questions for the exception) |
| Time windows, rate and provenance spans (`src/core/timeWindow.ts`) and a rate metric | Eclipses, comms windows and mission phases are windows too. | `a3dd20a` (O-010); C-014 CLEAR |
| Body catalogue, `StateResolver`, open `CenterId`, solar-system scale, scene centre as data | Earth, Moon and Sun were defined in eleven files. | `ea592a3`, `57db960`, `b9081fd`, `15c381f`, `493ef28`, `4702e20`, `769dffc`, `20a4aff`; C-015 to C-025; Full Objective Check C-026 CLEAR |
| Camera reach per experience | Scene constants cannot serve a 1 AU scene. | T-037 (inside `f29d0fa` to `b8c813c` range; see Open questions) |
| Group from a list of measured orbits (`src/core/listedOrbitGroup.ts`) | Any catalogue of per-member orbits has this shape. | `dc0b9c7`; C-029 |
| Real stars and Milky Way sky layer | Sky sits at infinity, any experience can use it. | `5d063f1`; C-028 |
| Comet, planets on their orbits, marker rule, eccentric sampling | Any body too small to see gets a marker. | `258ca6e`; C-030 |
| Body from a settings record (`src/core/elementsBody.ts`) | Found necessary by the Geminids attempt. | `1734bd8`; C-032 |
| Shared shower builder and settings schema | Adapter code, outside generic folders. | `5eb6fb7`; C-031 |
| Second orbit source (GMN, CC BY 4.0), shipped with the public build, Perseids default | Alternative to CAMS, which has no stated terms. The owner chose GMN as the Perseids default and to ship it (T-056 Owner decisions). | `baebee7` (T-056); C-035 CLEAR. Geminid GMN orbits shipped in `3e1d130` (I-030, accepted by the owner 2026-10-17; no Check record) |
| Story panels: text that opens as playback reaches its moment, stored as story data | A panel is a time, an object and short text, so any experience can carry one. | `8f0bcec` (T-059, C-038); Apollo 11 panels `64d1e32` (T-061, C-040); Perseids panels `30e6201` (T-062, C-041). The owner's reading of the wording is still pending (`owner_validation`). On 2026-10-17 the owner badged the Swift–Tuttle panel `modelled`, because its 2126 return is a two-body figure, and kept the Perseids "Earth crosses the stream" panel's mix of IAU MDC and AMS sources (`data/stories/perseids/panels.json`, `94ee998`). I-031 (open): panels on the same object stack their scene markers and only the top one is clickable; each still opens from the timeline |
| Planet ephemeris loaded only for an experience that mounts a planet | Apollo and the Earth–Moon Explorer need no planets. | `1eb8b05` (I-022, accepted by the owner 2026-10-17; no Check record): main app chunk 3,041.8 kB to 1,185.1 kB, gzip 1,057 to 345.6 kB; first-load JS for Apollo 3.04 MB to 1.60 MB; numbers in `docs/evidence/i022-20261016T115528Z/` and the I-022 history. Owner timing on a real connection is unverified |
| Timeline window drawn as one shape with a named caption | The window and its rate are the same thing; the label comes from the window data, not the shell. | `c19aacf` (I-019, accepted by the owner 2026-10-17; no Check record); before and after screenshots in `docs/evidence/i019-20261016T132151Z/screenshots/`. The Perseids window is narrow on a phone at the year span (about 30 px, I-019 history) |
| Camera view links and a tidied Developer panel | A view is camera, time and scale, not an experience feature. | `721d95a` (T-058, C-037); `tests/viewLink.test.ts`, `tools/validate/browser-view-link.mjs` |
| Real stars on the public site from HYG v4.2 | Replaces the local-only Yale catalogue in public builds. | `cbc920d` (T-060, C-039) |
| Earth and Moon pictures replaced by credited NASA maps | The donor never recorded where the old textures came from. | `a2f82e0` (I-029, accepted by the owner 2026-10-17; no Check record) |

Stop condition: the brief says to stop if Perseids would require bypassing contracts. It was triggered twice and recorded. The Earth-centred first build was rejected and replanned (`864b139`, I-025). The CAMS redistribution terms were silent, so T-051 returned REPLAN REQUIRED and the owner decided to keep the data local (C-027).

## 4. Evidence the capabilities are reusable

The brief asks for Perseids data, a minimal alternative configuration, no Perseids-specific assumptions, contract tests and preserved Apollo behaviour.

| Capability | Alternative configuration | Contract tests | Browser script |
|---|---|---|---|
| Plug-in boundary | `src/synthetic/syntheticDefinition.ts` | `tests/experienceDefinition.test.ts`, `tests/experiencePlugIn.test.ts` ("the synthetic experience") | `tools/validate/browser-synthetic.mjs` |
| Point groups | Made-up debris ring, `src/synthetic/syntheticRingDefinition.ts` | `tests/orbitGroup.test.ts`, `tests/pointsLayer.test.ts`, `tests/syntheticRing.test.ts` | `tools/validate/browser-synthetic-ring.mjs`, `browser-synthetic-belt.mjs` |
| Time windows and rates | Made-up window in the synthetic experience | `tests/timeWindow.test.ts`, `tests/timeline.test.ts`; independent probe in `docs/evidence/o010-check-2026-10-11/` | Four Apollo scripts plus bare and ring sections (C-014) |
| Listed orbit group | Made-up list, `src/synthetic/syntheticListedDefinition.ts` | `tests/listedOrbitGroup.test.ts` | `tools/validate/browser-synthetic-listed.mjs`; C-029 re-run in `docs/evidence/o011-t052-check-20261015T083601Z/` |
| Eccentric paths and markers | `src/synthetic/syntheticEccentricDefinition.ts` | `tests/longOrbitPaths.test.ts`, `tests/paths.test.ts` | `tools/validate/browser-synthetic-eccentric.mjs`; `browser-marker-existing.mjs` |
| Body catalogue, resolver | Jupiter with Io, Earth–Moon Explorer | `tests/stateResolver.test.ts`, `tests/compositions.test.ts`, `tests/planets.test.ts`, `tests/jupiterIo.test.ts` | `tools/validate/browser-jupiter-io.mjs`, `browser-earth-moon.mjs` |
| Sky layer | A three-star made-up catalogue | `tests/sky.test.ts`, `tests/skyPicture.test.ts` | `tools/validate/browser-sky.mjs` (C-028) |
| Body from settings | Reproduces the hand-written comet bit for bit | `tests/elementsBody.test.ts` | `tools/validate/browser-showers.mjs` |
| No experience names in generic code | Planted offences are caught | `tests/nameCheck.test.ts`, `tests/layerRule.test.ts` | n/a |

Cross-experience regression: the T-040 integration run ran 17 browser scripts (Perseids and Geminids as separate runs), all with zero console errors except `browser-sky.mjs`, which failed on the Perseids start view and was repaired as I-028 (`docs/evidence/o011-integration-20261016T063816Z/`, `docs/evidence/o011-i028-20261016T071739Z/`, `docs/evidence/o011-i028-check-20261016T074424Z/`). Gates at that run: typecheck and build exit 0, 786 tests in 42 files passed with 1 skipped (T-040 Technical Evidence DW1). The public-build validator found no local-only data in the bundle (`tests/publicBuild.test.ts`).

Accuracy checks against JPL Horizons are in `docs/ASTRONOMY_VALIDATION.md` and the Checks: 109P/Swift–Tuttle within 0.114% to 0.146% of distance (C-030), Phaethon between 0.004% and 2.18% depending on the date, classified "indicative" (C-032), and planets and Io (C-022, C-023).

## 5. Remaining limitations

- **No ground-observer view.** Owner decision 2026-10-10: space view only. `CenterId` has no observer centre and there is no local horizon frame (gap audit §1 row 10; brief "Confirmed Decisions"). A topocentric view is the main thing a later spike would add; this is a recommendation, not a plan.
- **No drawn radiant.** GAP-5 stayed deferred: the radiant is a published RA and Dec readout only (gap audit GAP-5; T-040 DW6; Design.md "Open after O-011").
- **Two-body orbits only.** The comet departs from Horizons by up to 0.15% of its distance, and Phaethon by up to 2.18% close to the Sun (C-030, C-032).
- **Orbit semi-major axes are weak.** Measured members scatter between 12 and 49 AU against the comet's 26.1 AU. The display relies on `e`, `i`, `w`, Node and the 1 AU node crossing (stream data note §1).
- **Dot places are illustrative.** The orbit of each dot is measured; where it sits on its orbit is a stated display rule, labelled as a model (C-029 row 3, T-052 phase rule).
- **Data terms.** CAMS has no stated redistribution terms, so CAMS orbit data and the Yale Bright Star Catalogue stay local in `data/local/` and are not in a public build (stream data note §5, C-027, C-028). Shipped in the public build: GMN orbits under CC BY 4.0, 25,588 Perseids (`data/stories/perseids/gmn-iau-7.json`, `baebee7`, C-035) and 51,115 Geminids (`data/stories/geminids/gmn-iau-4.json`, `3e1d130`, I-030); stars from HYG v4.2 under CC BY-SA 4.0, covering the star file only (`cbc920d`, C-039); the ESO Milky Way picture (CC BY 4.0, credited "ESO/S. Brunier"); and NASA maps for the Moon (SVS 4720) and Earth (Blue Marble Next Generation) (`a2f82e0`, I-029). The shipping loader only accepts files whose declared licence is CC BY 4.0 or CC0, and CAMS and Yale are refused (T-056 Owner decisions, tests named there).
- **Stacked story markers.** Panels on one object overlap in the scene (I-031, open); the timeline markers still reach each panel.
- **Headless evidence only.** The browser runs use software GL in headless Chromium. They show no console errors and the asserted geometry; they do not show physical-device feel. Frame rate was measured by the owner on their own machine (C-028 "Frame rate").
- **Group fill cost at 10^4.** O-009 recorded that the fill time at 10^4 members misses the bar it set, with the cause in the library's `propagateKepler` (C-012 row SC3). T-052's later 30,000-member fill measured 5.6 to 5.8 ms (C-029 row 4). A wall-clock test of that fill flaked under load in several runs (C-030 obs. 3, C-033 obs. 5).
- **Test and tooling gaps.** `tests/showersMeasured.test.ts` hard-codes Perseids figures (C-033 obs. 3). The Geminid GMN facts now have their own file, `tests/showersMeasuredGeminids.test.ts` (`3e1d130`, I-030), which repeats the checks rather than discovering showers, so a third shower would need a third file. The all-shower browser run takes over 9 minutes, so showers are run one at a time (T-040 DW2). The Geminid lit-pixel margin is thin (228 against a floor of 150, C-032 obs. 2).
- **Wall-clock test under load.** The 30,000-member fill test also failed once in the I-030 full run under machine load 24 to 35 and passes alone (I-030 history).
- **Time-ranged provenance is built, but there is no `published` type.** `ProvenanceSourceType` has four members: ephemeris, observed, reconstructed, illustrative (`src/core/provenance.ts`). A fifth, `published`, was a candidate in the T-040 drift table row for T-038; Design.md "Open after O-011" now says it does not exist and leaves the decision to the owner (T-065 evidence, Design reconciliation 2026-10-17).
- **Unused donor pictures.** The donor's planet and moon pictures beyond those shipped were traced and assessed on paper only; none is copied into Astraeus (I-032, open; `docs/DONOR_TEXTURE_INVENTORY.md`, `e5b7f08`, `8b3ad85`).
- **Milky Way picture.** The ESO picture reads as too soft beside the catalogue stars; the owner wants a better photo, so I-026 stays open. The picture is off unless a sky setting turns it on (`milkyWay` defaults to false in `resolveSkySettings`, `src/app/skyModel.ts`).

## 6. Could a second shower run mostly from configuration?

Yes, with one qualification, and it is recorded as a finding as the brief requires.

- The Geminids were added by `data/showers/geminids.json` and a measured-orbit data file filtered from the same database. The change to `src/` was zero (C-033 row 2: "the only T-039 change outside `.savepoint/` and `docs/evidence/` is `data/showers/geminids.json`"). That claim is C-033's review of the T-039 working tree; commit `1734bd8` carries the settings file together with T-055's generic body code, so `git show 1734bd8` also shows `src/` changes (C-044 observation 2).
- The first attempt failed: Phaethon was not a catalogued body. The owner chose "let settings define a body", T-055 added a generic record-to-body path with a test that it reproduces the hand-written comet bit for bit (`tests/elementsBody.test.ts`, C-032). After that the Geminids passed with no further code. In the brief's terms: the shared builder needed one generic capability, and the second shower after it needed none. Commit `1734bd8` (the capability) and `f5a9273` (the Geminids).
- `tools/validate/browser-showers.mjs` reads peak longitude, radiant, counts, parent and window from each settings file and runs over every shower it finds. Both showers pass at desktop and phone sizes with zero console errors; the stream crosses Earth's path at the peak within 0.3 degrees in J2000: Perseids -0.006, Geminids -0.007 (C-033 row 3, `docs/evidence/o011-t039-20261016T062113Z/`).
- A third shower should work the same way provided its parent has an orbit published in JPL's Small-Body Database and its measured orbits are fetched with `tools/data/fetch-meteoroid-orbits.mjs`. That is a prediction, not a result: only two showers have been run.

## Data provenance

- **GMN** (Global Meteor Network): public, CC BY 4.0. The default source for the Perseids, shipped with the public build (T-056, C-035, owner decisions recorded there), and the shipped source for the Geminids (I-030; `docs/DONOR_PROVENANCE.md`; `docs/ASTRONOMY_VALIDATION.md`).
- **CAMS** (Cameras for Allsky Meteor Surveillance): local only, and the CAMS source switch is hidden in a public build, which falls back to the shipped GMN copy (`3e1d130`, I-030). The published terms ask only for a citation; permission is unresolved and a request email to the CAMS PI is drafted in the stream data note §5 and has not been recorded as sent.
- **Yale Bright Star Catalogue:** local only (stream data note §3). Public builds use HYG v4.2 instead (`cbc920d`, C-039; HYG's archive has since moved to v4.4, the shipped file stays v4.2).
- **Published facts:** 109P/Swift–Tuttle and 3200 Phaethon elements from JPL SBDB; peak, radiant and speed from the IAU Meteor Data Center file (stream data note §2). Activity window and ZHR come from the American Meteor Society calendar, since the IMO calendar could not be read.
- **Dot places** are illustrative. Each dot follows a measured orbit, but where it is along that orbit is a display rule and is labelled as a model.

## Open questions

1. **Owner looks on O-011** (final run sheet in T-040, DW5) are pending, so no claim here relies on them beyond the owner words in C-028 and C-031.
2. **T-056 (GMN)** now has a Check, C-035 CLEAR. The Geminid GMN shipping (`3e1d130`, I-030) has no Check record; the owner accepted I-030 on 2026-10-17, and the technical side rests on the builder's evidence in `docs/evidence/i030-20261016T110308Z/`. The same holds for I-019 and I-022, also accepted by the owner and not Checked.
3. **Later O-011 changes without a Check record in the evidence read:** the I-024 Jupiter texture, I-026 ESO default and I-029 NASA maps (I-024 and I-029 accepted by the owner 2026-10-17, which is not a Check; I-026 still open, needs a better photo) (`docs/evidence/o011-i024-20261016T095602Z/`, `o011-i026-eso-default-20261016T102732Z/`, `o011-i029-20261016T103813Z/`). Only the builder evidence was read.
4. **T-037 (camera reach) and T-036 (window strip)** are cited from O-011 success conditions and the T-040 drift table, not from their own Check records. The commit range is `f29d0fa..b8c813c`; the exact commit has not been matched.
5. **O-009 and the exception.** C-013 is NEEDS WORK because T-030 Done When 3 (a "before" frame-pacing figure) rests on an owner exception. The note does not claim a frame-pacing comparison.
6. **No test establishes that a different engine configuration is "mostly configuration" beyond two showers.** The prediction in section 6 for a third shower is untested.
7. **Is CAMS permission granted?** The email is drafted; no reply is recorded.
8. Closed: GMN ships and is the Perseids default, an owner decision recorded in T-056 ("Owner decisions").
9. **Owner looks on the new pages and panels.** The wording of the Apollo and Perseids panels (T-061, T-062) and the HYG sky (T-060) require the owner's reading; Checks C-038 to C-041 do not cover it.
10. **Is the stacked-marker gap (I-031) acceptable for the public site?** Unresolved.

## Recommendations for later spikes (not findings)

- A ground-observer view: an observer centre and local horizon frame.
- A generic direction-marker layer, if the radiant should be drawn (GAP-5).
- Make the measured-shower tests discover showers the way the browser script does, instead of one file per shower (C-033 obs. 3; `tests/showersMeasuredGeminids.test.ts`).
- Decide whether `published` becomes a provenance type (it does not exist today; four members in `src/core/provenance.ts`).
- A lite browser check tier for everyday changes, now in the AGENTS.md project rule beside the full tier (I-033, open; `tools/validate/browser-lite.mjs`). Process, not engine.
- A better Milky Way photo (I-026) and a decision on the traced donor pictures (I-032).

## Evidence index

- Brief: `docs/ASTRAEUS_SPIKE_04_BRIEF.md`; audit: `docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`; architecture: `docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md`; data: `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md`; reference spec: `docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md`; validation: `docs/ASTRONOMY_VALIDATION.md`.
- Checks: `.savepoint/checks/C-010-o-008-full-objective-check.md`, `C-011-o-008-full-objective-recheck.md`, `C-012-o-009-full-objective-check.md`, `C-013-o-009-full-objective-recheck.md`, `C-014-o-010-full-objective-check.md`, `C-026-o-014-full-objective-check.md`, `C-027-t-051-task-check.md`, `C-028-t-053-task-check.md`, `C-029-t-052-task-check.md`, `C-030-t-054-task-check.md`, `C-031-t-038-task-check.md`, `C-032-t-055-task-check.md`, `C-033-t-039-task-check.md`, `C-034-t-040-task-check.md`, `C-035-t-056-task-check.md`, `C-037-t-058-task-check.md`, `C-038-t-059-task-check.md`, `C-039-t-060-task-check.md`, `C-040-t-061-task-check.md`, `C-041-t-062-task-check.md`, `C-044-t-065-task-check.md` (the Task Check of this note, CLEAR; the owner's reading is still pending). The Full Objective Checks for O-011 and O-012 are running on 2026-10-17; no result is claimed here. Issues accepted by the owner on 2026-10-17 (not Checked): I-019, I-022, I-024, I-029, I-030. Open Issues relied on: I-026, I-031, I-032 and I-033.
- Browser evidence: `docs/evidence/o011-integration-20261016T063816Z/` and the run directories named above, written to new directories so earlier spike evidence was not overwritten (`docs/evidence/regression-spike01-02/` is unchanged).
