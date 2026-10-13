---
id: T-050
title: Check every experience still works and reconcile the design notes
objective: O-014
status: in_progress
stage: audit
depends_on: [{task: T-049, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: integration
planned_reads: [.savepoint/Design.md, .savepoint/Guardrails.md, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md, tools/validate/browser-spike02.mjs, tools/validate/browser-spike03.mjs, tools/validate/browser-shell.mjs, tools/validate/browser-anchor-labels.mjs, tools/validate/browser-synthetic.mjs, tools/validate/browser-synthetic-ring.mjs, tools/validate/browser-synthetic-belt.mjs, tools/validate/browser-earth-moon.mjs, tools/validate/browser-showers.mjs, tools/validate/browser-jupiter-io.mjs, tools/validate/public-build-assets.mjs]
planned_writes: [.savepoint/Design.md, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md, docs/DONOR_PROVENANCE.md]
---

# Check every experience still works and reconcile the design notes

## Outcome

Every experience and fixture passes its browser script in a fresh run directory at desktop and phone sizes with zero console errors, the public build passes its output gate, the configured gates pass, and `.savepoint/Design.md` describes the implemented asset architecture: every drift note from the eight Tasks is reflected or marked non-architectural with a reason, the Codebase Map lists `src/assets/` and `src/experiences/`, and the lighting choice is recorded with its evidence. The design document's status section records what was built as planned and what differs. This is the integration gate before the Full Objective Check.

## Astraeus Hypothesis

- **Capability tested:** Gates A–D together, on the whole tree, with the regression baseline of Spikes 01–03 intact.
- **Contract reused:** every browser script; the gates in `.savepoint/config.yml`.
- **Gap:** none expected; any failure is a finding.
- **Generic change:** none. A needed fix is recorded as an Issue or returned as REPLAN REQUIRED, never patched silently here.
- **Evidence independent of any experience:** the synthetic fixtures' scripts and the fake-texture public-build test.

## User Check

Open each of Earth–Moon Explorer, Apollo, Perseids, Jupiter–Io and the belt once at desktop and phone and confirm each looks as it did at its own Task's look. Record it.

## Done When

1. Configured typecheck, build and test gates pass, counts recorded; `ASTRAEUS_PUBLIC_BUILD=1` build passes `public-build-assets.mjs`.
2. All eleven browser scripts pass with zero console errors in `docs/evidence/o014-final-<date>/` at 1280×800 and 390×844; every scenario from the pre-O-014 scripts is mapped to its current assertion.
3. `Design.md`: Architecture, Codebase Map, Interfaces and Data Flow and Current Technical State describe the catalogue, resolver, compositions, scene centre, path kinds, scale policies, planets, Jupiter–Io, lighting choice and texture rights; each Task's drift notes are accounted for by name; the deferred notes from T-024/T-025/T-027/T-028 that O-014 resolved (camera limits, Earth/Moon mandatory, metrics reading the Moon, scene called `EarthMoonScene`) are closed.
4. The design document gains a "Built — <date>" section listing deviations from the plan, if any, and the measured figures (precision, planet maxima, Io classification, lighting difference).
5. The owner's look recorded; handoff to the Full Objective Check with current full-gate evidence.

## Context Files

`.savepoint/Design.md`, `.savepoint/Guardrails.md`, `docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md`, `docs/DONOR_PROVENANCE.md`, every `tools/validate/*.mjs` script listed in the frontmatter, and the eight preceding Tasks' Drift Notes.

## Design References

The whole of Design; the design document's Gates A–D and section I.

## Guardrails

ARCH-01 to ARCH-05, PROV-01, PROV-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Run the gates and the public build; run every browser script into the fresh directory.
2. Walk each Task's Drift Notes into Design or mark them non-architectural with a reason.
3. Update the Codebase Map and Current Technical State; close the resolved deferred notes.
4. Write the design document's "Built" section; record the owner's look; hand off.

## Boundaries

No code change beyond a browser-script assertion update. No new capability. No Perseids story work (O-011).

## Technical Verification

Full configured gate fresh, every browser script, the public build gate. Evaluated under `agent-skills/references/check-method.md` as the Full Objective Check's integration evidence.

## Technical Evidence

### Execution (2026-10-12, executor session `o014-t050-exec`)

Evidence directory (one fresh run, untracked; screenshots are git-ignored): `docs/evidence/o014-t050-20261012T103336/`. Dev server `npx vite --port 5199 --strictPort` (stopped afterwards), `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`, each script given its own sub-directory as `ASTRAEUS_EVIDENCE_DIR` (`anchor-labels` also as its positional output argument). Logs per script in `docs/evidence/o014-t050-20261012T103336/logs/browser-<name>.json|.err`, exit codes in `logs/browser-exit.txt`. Command per script: `ASTRAEUS_EVIDENCE_DIR=docs/evidence/o014-t050-20261012T103336/<name> node tools/validate/browser-<name>.mjs`. Started 10:33Z.

**Gates (all exit 0).** `npm run typecheck` (`logs/typecheck.log`); `npm run build` (`logs/build.log`; main bundle 2,947.50 kB, 1,025.08 kB gzip; the chunk-size warning is expected, see I-022); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 31 files, 568 tests passed (`logs/test.log`; `junit.xml` is git-ignored). Lint: none configured.

**Browser scripts (all exit 0, `errors: []`, zero console errors).** Twelve `browser-*.mjs` scripts (the Task says eleven; `browser-lighting.mjs` was added by T-049). Sizes are those each script drives itself.

| Script | Sizes it drives | Result |
|---|---|---|
| browser-spike02 | 1280x800 | pass |
| browser-spike03 | 1440x900, 1280x800, 768x1024, 390x844 | pass |
| browser-shell | 1280x800, 390x844 | pass |
| browser-anchor-labels | 1280x800 | pass |
| browser-synthetic | 1280x800, 390x780 | pass |
| browser-synthetic-ring | 1280x800 | pass |
| browser-synthetic-belt | 1280x800, 390x844 | pass |
| browser-earth-moon | 1280x800, 390x844 | pass |
| browser-showers (perseids) | 1280x800, 390x844 | pass |
| browser-jupiter-io | 1280x800, 390x844 | pass |
| browser-precision | 1280x800 (True) | pass; figures in Design |
| browser-lighting | 1280x800 | pass (numbers in `lighting/lighting-comparison.json`) |

(First run only; superseded by the Repair section below: ring, anchor-labels and spike02 now also run at 390x844. Precision and lighting stay at 1280x800.) Scenario map for the pre-O-014 scripts: `git diff 8fc6fce HEAD -- tools/validate` shows spike02, spike03, shell, anchor-labels and synthetic-ring unchanged in their assertions; synthetic changed only `data-earth-moon` to `data-bodies` (empty for the bare variant, `earth,moon` where both mount); synthetic-belt gained the path scenarios (T-045: Earth-path pixels, True and Readable, desktop and phone); showers, earth-moon, jupiter-io, precision, lighting are new, with their scenario maps in each script's header. I did not diff each scenario beyond that.

**Public build.** `ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir <scratch>/public-dist --emptyOutDir` exit 0 (`logs/public-build.log`); `node tools/validate/public-build-assets.mjs <scratch>/public-dist docs/evidence/o014-t050-20261012T103336/public-build-assets.json` exit 0, `matches: []` (`logs/public-validate.log`).

**Committed evidence untouched.** `git status` after all runs shows only this Task file, the router, the three docs/Design edits and the new untracked run directory (and the pre-existing untracked T-041 file); no modified or deleted path under `docs/evidence/`.

**Done When.** 1 met (gates and public build). 2 met for the browser runs (directory named `o014-t050-20261012T103336`, not `o014-final-<date>`, per the orchestrator's instruction; sizes as the table). 3 met: Design.md gained Asset architecture (catalogue, resolver, compositions, scene centre, path kinds, scale policies, planets, Jupiter-Io, lighting, texture rights, name rule, precision, Moon validUtc), the Codebase Map lists `src/assets/` and `src/experiences/`, and the deferred T-024/T-025/T-027/T-028 notes are closed or restated as still open (Apollo-flavoured wording in panels and debug labels; groups centred on the Moon). 4 met: "Built — 2026-10-12" in `docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (11 deviations, measured figures). 5 NOT met by the executor: the owner's look (User Check) is not recorded and is not mine to record; handoff to the Full Objective Check has current full-gate evidence from this run.

**Files read.** Context Files; Drift Notes of T-042 to T-049; Observations of C-015 to C-023; planned reads. Extra reads (reason: reconciliation accuracy): `.savepoint/config.yml` (gates), `package.json`, `vite.config.ts` header, `tests/nameCheck.test.ts` (allowlist), `src/app/experienceDefinition.ts` (composition, layers), `src/core/bodies/moon.ts` and `earth.ts` (validUtc), `src/core/stateResolver.ts`, `src/assets/compositions.ts`, `src/main.tsx` (entry keys), `tools/validate/browser-*.mjs` headers, `git diff 8fc6fce HEAD -- tools/validate`, `docs/evidence/o014-t050-20261012T103336/logs/browser-precision.json`, the Task files T-042 to T-049 (Context Log and Technical Evidence figures). **Files changed.** `.savepoint/Design.md`, `docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md`, `docs/DONOR_PROVENANCE.md` (stale `EarthMoonScene` row and lighting-values note), this Task file, `.savepoint/router.md`; new `docs/evidence/o014-t050-20261012T103336/`. No source, test or script change.

**Limitations.** Headless SwiftShader only; the User Check (owner's look at Earth-Moon Explorer, Apollo, Perseids, Jupiter-Io and the belt at both sizes) is outstanding; the precision figures exclude the GPU's Float32 arithmetic; the earth-focus path-vertex sweep residual in `precision.json` is off screen and not a precision figure (C-019 obs 1). The Task's text calls the run directory `o014-final-<date>`; I used the orchestrator's name. A stale comment on `sunEarthSystem` (T-045 note 6) was left, since this Task changes no code. The `synthetic` script's phone height is 780 (its own), not 844. DONOR_PROVENANCE.md otherwise already records the O-014 texture rows (T-048, T-049).

### Repair under I-023 (2026-10-13, after C-024 NEEDS WORK)

Owner decision (recorded on I-023): add phone runs to the three desktop-only regression scripts. Test-script change only; no app source changed. Task moved back to `stage: build`, then `test`, then `audit`.

**Script changes.** Each script now runs its whole scenario at 1280x800 and again at 390x844 in one browser; every desktop assertion and expected value is unchanged, and each header comment holds the desktop to phone map.
- `tools/validate/browser-spike02.mjs`: scenario wrapped in `run(label, viewport)`; `chooseCamera` picks the option of the native "Camera mode" select where the phone hides the camera buttons; new `chooseScale` closes the Developer panel around the Scale click on the phone (the panel is a fixed overlay above the scale buttons); `selectObject` closes the info sheet with Escape from the focused Close button on the phone (the Developer panel overlays the button). Phone assertions (all with the desktop expected values): six phases readouts present and identical under both scales; six camera presets leave UTC and readouts unchanged; 30 events, list equals timeline, every jump lands; four playback rates within 0.5x to 1.5x; 100x follow track numeric, monotonic, continuous; four USNO phases within 1 point; zero console errors. Results `browser-spike02-results.json` (desktop) and `-phone.json`.
- `tools/validate/browser-anchor-labels.mjs`: same `run` wrapper, `choosePreset` through the camera select, Escape close on the phone, `-phone` suffix on screenshots and results. Phone assertions: layer hidden initially with zero visible labels; toggle on reports pressed and creates 40 label elements; follow Columbia; toggle off hides the layer; zero errors. One counterpart differs, with reason: on screen the desktop overview shows all 40 (asserted, unchanged), while on the phone the narrower view projects only some anchors inside it (12 observed) and `AnchorLabels` hides an off-screen anchor, so the phone asserts 40 elements created and 1 to 40 on screen.
- `tools/validate/browser-synthetic-ring.mjs`: `run` wrapper, `choosePreset` through the camera select, `phone-` screenshot prefix. Phone assertions: one point group and no Apollo objects; panel Illustrative badge, "Made up", two-body; Overview, Focus ring, Follow ring; group information identical under True and Readable and after switching back; counter absent with Developer mode off, present and labelled with it on, gone again; Apollo default has no groups, lists Columbia, no ring. Frame pacing is measured at both sizes, still not asserted.
- `browser-precision` and `browser-lighting` stay at 1280x800 (out of I-023 scope).

**Fresh run.** `docs/evidence/o014-t050-repair-20261013T080032/` (untracked; screenshots git-ignored), own vite on :5199 (stopped with `fuser -k 5199/tcp`), `PLAYWRIGHT_CORE` exported in the same shell, per-script `ASTRAEUS_EVIDENCE_DIR` and positional output-directory argument; logs in `logs/`, exit codes in `logs/browser-exit.txt`. All twelve scripts exit 0 with `errors: []`:

| Script | Sizes | Result |
|---|---|---|
| browser-spike02 | 1280x800, 390x844 | pass (new phone run) |
| browser-anchor-labels | 1280x800, 390x844 | pass (new phone run) |
| browser-synthetic-ring | 1280x800, 390x844 | pass (new phone run) |
| browser-spike03 | 1440x900, 1280x800, 768x1024, 390x844 | pass |
| browser-shell | 1280x800, 390x844 | pass |
| browser-synthetic | 1280x800, 390x780 | pass |
| browser-synthetic-belt | 1280x800, 390x844 | pass |
| browser-earth-moon | 1280x800, 390x844 | pass |
| browser-showers (perseids) | 1280x800, 390x844 | pass |
| browser-jupiter-io | 1280x800, 390x844 | pass |
| browser-precision | 1280x800 | pass (fixed size, out of scope) |
| browser-lighting | 1280x800 | pass (fixed size, out of scope) |

Gates re-run fresh: `npm run typecheck` exit 0; `npm run build` exit 0; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` exit 0, 31 files, 568 tests; public build (`ASTRAEUS_PUBLIC_BUILD=1 npx vite build` to a scratch outDir) exit 0 and `public-build-assets.mjs` exit 0 with `matches: []`. `git status` shows no change under `docs/evidence/` beyond the two new untracked run directories; the only modified scripts are the three above. The earlier run `o014-t050-20261012T103336/` remains as the first-attempt record.

**Scenario mapping (DW2) now.** The spike02, anchor-labels and synthetic-ring maps are in each script's header (desktop assertion to phone counterpart). The earlier statement that those three have no phone mode is superseded. `synthetic` still uses its own 390x780 phone height (unchanged script). Limitations unchanged: headless SwiftShader, and the owner's look is not recorded here. The phone ring run's Apollo fps reading is a software-renderer number and is not asserted beyond being positive.

### Drift-note reconciliation (Deferred Design reconciliation rule)

63 rows: 53 reflected in `.savepoint/Design.md` (or the design document's Built section), 10 explicitly non-architectural with a reason. "Design >" names a subsection of "Asset architecture (O-014)" in `.savepoint/Design.md`, or the stated Design paragraph.

| Source | Note | Disposition | Where reflected, or reason |
|---|---|---|---|
| T-042 | D1 core/bodies holds EARTH/MOON ephemeris records; app file re-exports | Reflected | Design > Catalogue and resolver; Interfaces (ephemerisProvenance re-export) |
| T-042 | D2 createState takes orientation rule as optional 2nd argument | Reflected | Design > Catalogue and resolver |
| T-042 | D3 TwoBodyTrajectoryInput.center / createOrbTwoBodyAdapter(definitions) | Reflected | Design > Catalogue and resolver |
| T-042 | D4 sunFrom returns a State; CatalogueError | Reflected | Design > Catalogue and resolver |
| T-042 | D5 Moon validUtc is the sampled range | Reflected | Design > Moon validUtc |
| T-043 | BodyView split into bodyDraw.ts and BodyView.tsx | Reflected | Design > Visual records and one renderer; Codebase Map |
| T-043 | SunView replaced by BodyMarkerView; SunBody folding deferred | Reflected | Superseded by T-044/T-047: Sun is a BodyView, SunBody reduced; Design > Visual records |
| T-043 | AtmosphereConfig/BodyMaterialConfig moved to src/assets/visual.ts; BodyMesh accepts no texture; yaw from visuals | Reflected | Design > Visual records; Codebase Map src/assets |
| T-043 | createCatalogue takes three lists | Reflected | Design > Catalogue and resolver; Spike 04 doc Built deviation 1 |
| T-043 | Fixture scene-placement-pre-t043.json added | Non-architectural | Test fixture for regression of placement; adds no interface |
| T-044 | composition optional; earth-moon layer alias; sceneCenter default; declared sun mounted | Reflected | Design > Compositions and scene centre; the alias was retired by T-047 (SceneLayerId has no earth-moon) |
| T-044 | SceneRuntime carries resolver/bodies/composition/sceneCenter; ExperienceRuntime moon | Reflected | Design > Compositions and scene centre (moon removed by T-047) |
| T-044 | sceneFraming.ts and placeComposition/placeBody framing numbers | Reflected | Design > Compositions and scene centre (framing figures) |
| T-044 | Per-body light on layers skipping overlay; pass loop over composition; limit 29 not measured | Reflected | Design > Lighting choice |
| T-044 | SunBody presentation only; BodyMarkerView/createSunCentredViews removed | Reflected | Design > Visual records (SunBody) |
| T-044 | TrackedBodyView relative trail shifted per sample; Moon orbit co-moving | Reflected | Design > Path kinds |
| T-044 | Moon-focus start side generalised to toward the body's parent | Reflected | Design > Compositions and scene centre |
| T-044 | data-scene-center, data-bodies; data-earth-moon retired | Reflected | Design > Compositions and scene centre; plug-in boundary paragraph |
| T-044 | Belt Focus Earth preset and parent-facing start side | Non-architectural | Experience presentation presets; no contract change |
| T-044 | Test-only tests/scenePlacement.ts; capture-apollo-compare / diff-screenshots tools | Non-architectural | Test and evidence tooling, not shipped code |
| T-045 | 1 PathLayer tagged intersection; RollingSpan | Reflected | Design > Path kinds |
| T-045 | 2 CompositionPath to orbit PathLayer; PathStyle presentation only | Reflected | Design > Path kinds |
| T-045 | 3 renderOrder 1 for lines, 0 for dots (I-020) | Reflected | Design > Path kinds (one sentence; also a presentation rule) |
| T-045 | 4 rule functions in pathRules.ts; orbitPath.ts gone; SIDEREAL_MONTH_MS only in compositions | Reflected | Design > Path kinds; Codebase Map src/app |
| T-045 | 5 root frame via sunFrom, no offsetKm(...,'sun') literal | Reflected | Design > Path kinds |
| T-045 | 6 sunEarthSystem doc comment stale; belt declares Earth's year itself | Non-architectural | Comment wording; Earth's path declaration is covered by the T-047 Earth-path row. Stale comment not edited (no code change in this Task) |
| T-046 | AstraeusShell optional scaleChoices prop | Reflected | Design > Scale policies |
| T-046 | scalePolicyFor(id, supplied?) | Reflected | Design > Scale policies |
| T-046 | ScaleId plain string; factorFor, explanation | Reflected | Design > Scale policies |
| T-047 | Layer boundary: bodyMetrics/catalogueItem in src/app | Reflected | Design > Visual records; Spike 04 doc Built deviation 3 |
| T-047 | ExperienceRuntime {clock, resolver, catalogue}; C-018 obs 1 closed | Reflected | Design > Compositions and scene centre |
| T-047 | composition optional only for synthetic-bare; decision on fixture or type | Reflected | Decision: type stays optional, fixture must declare sceneCenter. Design > Compositions and scene centre; Spike 04 doc Built deviation 2 |
| T-047 | SunBody reduced to shell item; visualOverrides sun marker 10 | Reflected | Design > Visual records |
| T-047 | C-017 obs 1: drawnRadii/focusLimits pass body id | Reflected | Design > Visual records |
| T-047 | visualOverrides semantics (visible, exaggeration, appearance merge; invisible still a centre) | Reflected | Design > Visual records |
| T-047 | Earth path declared by Perseids experience; parent orbit peak +/-180 d, illustrative | Reflected | Design > Path kinds |
| T-047 | Shower presets focus/follow Earth; Earth panel 'Distance from Sun'; no Moon in Perseids | Non-architectural | Experience content and presets; the no-Moon fact follows from the composition (covered by Compositions row) |
| T-047 | Explorer window 2025-01-01 to 2025-04-01 | Reflected | Design > Moon validUtc; Spike 04 doc Built deviation 9 |
| T-047 | Public build mechanism: aliases in vite.config.ts, placeholder png, public-build-assets.mjs | Reflected | Design > Texture rights |
| T-047 | Small additions: data-composition-paths, tests/experiences.test.ts, publicBuild.test.ts, .d.mts, import guard | Non-architectural | Test and tooling additions; the attribute is listed in Design > Compositions anyway |
| T-047 | Deferred-notes meta line (layer boundary, optional composition, SunBody, visualOverrides, Earth path, public build) | Reflected | Each is its own row above |
| T-047 | Core providers allowlisted in nameCheck vs design E check 7 | Reflected | Decision: allowlist stands. Design > Name rule; Spike 04 doc check 7 amended and Built deviation 6 |
| T-047 | Repair: rootBodyId/readoutPairOf/initialObjectIdOf generic lookups; sceneCenter required without composition; spacecraft metrics under experiences/apollo11; data-bodies | Reflected | Design > Compositions and scene centre; Codebase Map src/experiences |
| T-048 | 1 AstronomyAdapter gained planetPositionFromSunKm and daysSinceJ2000Tt | Reflected | Design > Planets |
| T-048 | 2 Full VSOP87A registered; ~1.4 MB bundle cost; lazy load later | Reflected | Design > Planets (figures); I-022 open by owner decision |
| T-048 | 3 Rotation data beside definitions; planetTrajectory.ts under bodies/ | Reflected | Design > Planets; Spike 04 doc Built deviation 8 |
| T-048 | 4 Horizons IAU 2009 Mars frame vs engine 2015 | Non-architectural | Data provenance note, recorded in docs/ASTRONOMY_VALIDATION.md |
| T-048 | 5 Existing tests assumed a three-body catalogue; updated | Non-architectural | Test maintenance |
| T-048 | 6 Planet validUtc is the sampled range | Reflected | Design > Moon validUtc (planets 1969-07-21 to 2030-06-01) |
| T-049 | 1 Lighting choice with measured figures | Reflected | Design > Lighting choice (7.2e-9, 1.5e-6 deg, 0.006/255, Moon 7.7-13.0, 0.16 deg); decision keep per-body |
| T-049 | 2 Generic changes: illuminatedFraction by role; lighting.ts; fullTurnSpanMs; Io tidal-lock wrapper | Reflected | Design > Lighting choice; Jupiter and Io |
| T-049 | 3 Contracts held for Io | Reflected | Design > Jupiter and Io |
| T-049 | 4 Jupiter-Io True scale only | Reflected | Design > Scale policies |
| T-049 | 5 Io accuracy tier: approximate demonstration, 2.6 diameters | Reflected | Design > Jupiter and Io (9,387.47 km, 2.58 diameters) |
| T-049 | 6 Perseids planet orbits from catalogue; Jupiter extrapolated past 2030; edge-on default view | Reflected | Design > Path kinds; the tilted default is an owner presentation choice, non-architectural |
| T-049 | 7 Planned-write drift (files touched beyond the manifest) | Non-architectural | Manifests are advisory; each touch was required and logged in the Task |
| C-015 | obs 1 stateOf drops velocity | Reflected | Design > Catalogue and resolver |
| C-015 | obs 2 Moon validUtc 2022-2025, nothing reads it | Reflected | Design > Moon validUtc (only the shower builder reads it now) |
| C-016 | obs 3 BodyView React branches tested via describeBody/createMarker; spheroid first real body in T-048/T-049 | Non-architectural | Test coverage note; Jupiter now exercises the spheroid branch in the browser (jupiter-io script) |
| C-018 | obs 1 and 3 moon outside resolver; resolver memo 64 FIFO | Reflected | obs 1 closed by T-047; memo size in Design > Catalogue and resolver |
| C-019 | obs 1 precision projected from Float32 buffers, GPU arithmetic excluded | Reflected | Design > Precision at 1 AU |
| C-022 | obs 1 bundle size doubled | Reflected | Design > Planets; I-022 follow-up (not a T-050 item) |
| C-023 | obs 1 retrograde apsidal sign chosen against fixture dates | Reflected | Design > Jupiter and Io |


## Drift Notes

None new. This Task's reconciliation table above closes the drift notes of T-042 to T-049. Open items outside this Task: I-022 (lazy-load the planet series); the stale `sunEarthSystem` doc comment (T-045 note 6); Apollo-flavoured labels in `MissionPanel`, `DebugControls`, `DebugOverlay`.
