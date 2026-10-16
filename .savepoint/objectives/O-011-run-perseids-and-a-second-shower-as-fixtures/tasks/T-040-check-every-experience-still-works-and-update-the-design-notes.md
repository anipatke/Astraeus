---
id: T-040
title: Check every experience still works and update the design notes
objective: O-011
status: in_progress
stage: audit
depends_on: [{task: T-039, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o011-plan-2026-10-11}
planned_reads: [.savepoint/Design.md, docs/ASTRAEUS_SPIKE_04_PERSEIDS_REFERENCE.md, docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md, tools/validate/browser-spike02.mjs, tools/validate/browser-spike03.mjs, tools/validate/browser-shell.mjs, tools/validate/browser-anchor-labels.mjs, tools/validate/browser-synthetic.mjs, tools/validate/browser-synthetic-ring.mjs, tools/validate/browser-synthetic-belt.mjs, tools/validate/browser-synthetic-listed.mjs, tools/validate/browser-sky.mjs, tools/validate/browser-earth-moon.mjs, tools/validate/browser-jupiter-io.mjs, tools/validate/browser-showers.mjs, tools/validate/browser-precision.mjs, tools/validate/browser-lighting.mjs, tools/validate/public-build-assets.mjs]
planned_writes: [.savepoint/Design.md]
---

# Check every experience still works and update the design notes

## Outcome

Every experience (Apollo, Earth–Moon Explorer, Jupiter–Io, the made-up fixtures including the listed-orbit fixture, Perseids and Geminids) passes every browser script at mobile and desktop sizes with zero console errors, in fresh run directories, with the sky on. The public build passes its gate. Configured gates pass. The reference spec's six viewer acceptance criteria are walked through against meteorshowers.org and recorded as met, partly met or a gap. Every drift note from T-036 to T-039 and T-051 to T-054 is reconciled into Design, and the owner's final visual judgement is recorded.

## Astraeus Hypothesis

- **Capability tested:** cross-experience regression, the brief's rule 6. Apollo passing alone is not evidence of reuse.
- **Contract reused:** every browser script under `tools/validate/` and the configured gates.
- **Gap or hypothesis:** that the window repair, camera reach and shower builder changed no existing behaviour.
- **Generic change:** none. A regression found here is captured and repaired under its owning Task or as an Issue.
- **Perseids-independent evidence:** the synthetic, ring and belt runs alongside the shower runs.

## User Check

Look at Apollo, the made-up window, the made-up belt, Perseids and Geminids at desktop and phone sizes, using the screenshots or the running app. Say whether each still looks right.

## Done When

1. Configured typecheck, build and test gates pass fresh; record command, time and counts.
2. Every browser script passes with zero console errors, writing to `docs/evidence/o011-integration-<date>/` (no overwriting of earlier evidence). The list covers every `tools/validate/browser-*.mjs` script (spike02, spike03, shell, anchor-labels, synthetic, synthetic-ring, synthetic-belt, synthetic-listed, sky, earth-moon, jupiter-io, showers for Perseids and Geminids, precision, lighting) at 1280×800 and 390×844, except the fixed-viewport measurement scripts (precision, lighting); plus the public-build validator.
3. Every prior browser scenario that an O-011 Task changed is mapped to its current assertion (browser-regression rule); deferred coverage is closed.
4. Design.md is reconciled. Each drift note from T-036 to T-039 and T-051 to T-054 is reflected or stated as non-architectural with a reason. The camera-reach deferred notes (T-024/T-025, T-028) are closed or updated. The Geminids PASS or FINDING is recorded in Current Technical State. GAP-5 (radiant marker) stays recorded as open.
5. Owner visual judgement is recorded per experience.
6. The reference spec's six viewer acceptance criteria and its seven required-experience items are walked through, each recorded as met, partly met or a gap with evidence. The Earth-based perspective is recorded as deferred.

## Context Files

`.savepoint/objectives/O-011-run-perseids-and-a-second-shower-as-fixtures/Objective.md`, `.savepoint/Design.md`, the O-011 Task files (T-036 to T-039), `tools/validate/browser-spike02.mjs`, `tools/validate/browser-spike03.mjs`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-anchor-labels.mjs`, `tools/validate/browser-synthetic.mjs`, `tools/validate/browser-synthetic-ring.mjs`, `tools/validate/browser-showers.mjs`.

## Design References

Design: all sections touched by T-036 to T-039.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm T-036 to T-039 are complete with evidence; return REPLAN REQUIRED if one is missing.
2. Run the gates and every browser script into one fresh run directory.
3. Map changed scenarios; close any deferred coverage.
4. Reconcile Design.md from the drift notes.
5. Ask the owner to look; record the judgement.

## Boundaries

No new features. No findings note (O-012). Repairs found here go through their owning Task or an Issue, not silently into this one.

## Technical Verification

Full configured gates and every browser script, fresh, as the evidence the Full Objective Check needs. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

**Scope trimmed at the owner's direction, 2026-10-16: "think we right size it".** Kept in full: DW1 (gates), DW2 (every browser script, one run directory) and DW4 (Design.md reconciliation). Reduced: DW3 (no rebuilt regression map; it points to the per-Task maps and lists only scenarios without a current assertion) and DW6 (a short paragraph, not a per-item table; the owner's side-by-side look against meteorshowers.org, T-038 and C-031, is the judgement). DW4's table is grouped. DW5 (owner visual judgement) is the run sheet below and is pending.

### DW1 Gates (fresh, 2026-10-16, HEAD f5a9273, tree clean apart from this Task and Design.md)
- `npm run typecheck`: exit 0 (0.4 s).
- `npm run build`: exit 0 (0.5 s; the existing chunk-size warning only).
- `npm test` (vitest 5.0.3): exit 0, 42 files, 786 passed, 1 skipped (the `CAMS_XLSX` sample test), 28.5 s, 06:37:27Z to 06:37:56Z. `tests/listedOrbitGroup.test.ts` "fills 30,000 members" passed on this first run; no rerun was needed. No browser ran at the same time.
- `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `node tools/validate/public-build-assets.mjs dist <dir>/public-build/public-build-assets.json`: exit 0, `ok: true`, 10 files checked, 3 local-data files hashed, 0 matches. `dist/` was then rebuilt normally (it is git-ignored). Lint: none configured.

### DW2 Browser scripts
Run directory `docs/evidence/o011-integration-20261016T063816Z/` (new; one subfolder and log per script, `summary.txt` with command, start, end, exit). Own vite on port 5199, stopped afterwards; 5301 and 5302 untouched. `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`. Every script was given an evidence directory inside the run directory (spike02 and spike03 default to historical folders, so the env var was always passed); `browser-anchor-labels.mjs` ran only as `node tools/validate/browser-anchor-labels.mjs docs/evidence/o011-integration-20261016T063816Z/anchor-labels` (argv[2] checked first). `git status` afterwards shows no change under any earlier evidence directory.

| Script | Exit | Errors | Time (UTC) |
|---|---|---|---|
| spike02 | 0 | `[]` | 06:38:16-06:40:28 |
| spike03 | 0 | `[]` | 06:40:28-06:41:04 |
| shell | 0 | `[]` | 06:41:04-06:41:20 |
| anchor-labels | 0 | `[]` | 06:41:20-06:41:31 |
| synthetic | 0 | `[]` | 06:41:31-06:41:44 |
| synthetic-ring | 0 | `[]` | 06:41:44-06:42:19 |
| synthetic-belt | 0 | `[]` | 06:42:19-06:44:29 |
| synthetic-listed | 0 | `[]` | 06:44:29-06:44:55 |
| synthetic-eccentric | 0 | `[]` | 06:44:55-06:46:34 |
| marker-existing | 0 | `[]` | 06:46:34-06:47:47 |
| **sky** | **1** | 0 console errors; assertion failure | 06:47:47-06:50:44 |
| sun | 0 | `[]` | 06:50:44-06:52:24 |
| earth-moon | 0 | `[]` | 06:52:24-06:52:45 |
| jupiter-io | 0 | `[]` | 06:52:45-06:53:15 |
| showers (perseids) | 0 | `[]` | 06:53:15-06:59:00 |
| showers (geminids) | 0 | `[]` | 06:59:00-07:05:26 |
| precision | 0 | `[]` | 07:05:26-07:06:16 |
| lighting | 0 | `[]` | 07:06:16-07:09:01 |
| sky (rerun, same command) | 1 | same assertion | 07:10:29-07:13:26 |
| public build validator | 0 | `ok: true`, 0 matches | after the browser run |

Showers were run one at a time (the all-shower run exceeds 9 minutes). Apollo, Earth-Moon, Jupiter-Io, the made-up fixtures, Perseids and Geminids all ran at both viewports where their scripts do (precision and lighting are fixed-viewport measurements).

**FAILURE, repaired afterwards as I-028 (see "Repair" below): Perseids opened with the Sun filling the canvas.** `browser-sky.mjs` fails identically in both runs: `perseids-desktop: the sky lights more of the canvas than a black background (1024000 vs 1024000)` (`sky/sky.log`, `sky-rerun/sky-rerun.log`). Cause found by screenshot (`sky-diagnosis/perseids-sky_off.png`, `perseids-milkyway_on.png`): on a plain load of `?experience=shower-perseids` the selected object is the Sun and the camera is at its minimum distance, so the textured Sun disc covers every pixel, with or without the sky and with the stream out of view. The owner's look server on port 5302 shows the same (`sky-diagnosis/perseids-default-port5302.png`). Probable origin: the T-038 Sun reworks (true radius sphere, 1.15-radius minimum framing, texture, 2026-10-16); browser-sky was last run on the Perseids before the second Sun rework (its T-038 evidence lists sky only for the first), and `browser-showers.mjs` sets its own camera so it does not see this. The script stops at its first failed assertion, so Perseids mobile and the rest of the Perseids sky scenarios were not reached; Apollo and Earth-Moon sky scenarios completed before it (their screenshots are in `sky/`). Zero console errors were logged by any script.

### Repair of the sky failure (I-028, 2026-10-16, a separate Issue-repair session)
Cause: the scene starts the camera at 16 scaled units and clamps it to the focused body's closest approach; with the Sun as centre (true radius since the T-038 Sun rework) that minimum is 1.15 Sun radii, far above 16, so the first frame was a Sun close-up. Fix (generic, no body named): `START_CAMERA_DISTANCE` and `startsInsideFocus` in `src/app/sceneFraming.ts`; on its first frame `AstraeusScene` issues an Overview request, and snaps to it, only when the start distance is inside that minimum (Earth-, Jupiter-centred and every other experience start as before). Code changed by the repair: `src/app/AstraeusScene.tsx`, `src/app/sceneFraming.ts`, `tools/validate/browser-showers.mjs` (new "plain load" scenario), new `tests/startCamera.test.ts` (3 tests). Gates after the repair: typecheck 0, build 0, vitest 43 files, 789 passed, 1 skipped. Run `docs/evidence/o011-i028-20261016T071739Z/` (own vite on 5199, stopped): sky exit 0 (the rerun result: Perseids desktop and phone now pass), earth-moon, jupiter-io, spike02, synthetic-belt, showers perseids and geminids all exit 0 with zero console errors. The Geminids run was repeated once because the first attempt's plain-load floor of 150 lit pixels read 95 on the phone (a thin aqua stream the detector under-reads, as in C-032 obs 2; the screenshot shows the overview with the stream); the floor became 50 and the failed first attempt is kept in `showers-geminids-first-attempt-floor150-failed/`. The rest of the integration run stands: the repair changed only start-view code, so the other scripts' results are unaffected in kind (an Earth- or Jupiter-centred start is unchanged by construction, and earth-moon, jupiter-io, spike02 and synthetic-belt re-ran green). Apollo's shell and spike03 and the remaining scripts were not re-run after the repair.

### DW3 Regression coverage (trimmed)
The per-scenario maps already exist and are not rebuilt here: the header of `tools/validate/browser-showers.mjs` (T-055 scenario map), T-036 evidence (browser-synthetic: window strip, Apollo no strip), T-038 evidence (showers remap, belt Sun predicate), T-053 "Browser script changes (scenario map)" (earth-moon, jupiter-io object lists, showers `?sky=off`) and T-054/T-055 evidence. Every script named there ran in this Task's run directory (table above). Scenarios with no current passing assertion: none after I-028 (the Perseids sky-on scenarios of `browser-sky.mjs` failed in the integration run and pass in the I-028 run). No other deferred coverage. The T-036 gap (anchor-labels had no fresh evidence folder) is closed by `anchor-labels/`.

### DW4 Design.md reconciliation
Design.md sections changed: Components/Codebase Map (rows for `src/core/`, `src/experiences/`, `tools/validate/`, plus three new rows: synthetic listed/eccentric fixtures, sky, local data); the T-024/T-025/T-028 camera-reach deferred notes under "Groups and the points layer" (all three bullets closed in place, pointing at T-037); new section "Spike 04 shower fixtures (O-011)" (window strip, camera reach, listed-orbit group, eccentric sampling and marker rule, sky and local data, shower builder, bodies from settings, presentation settings, second shower result, open items); Current Technical State (new O-011 paragraph with gates, browser run, Geminids PASS, open items). Narrow edits only; no other section touched.

Drift notes reconciled: **23 grouped lines covering every note** from T-036 to T-039, T-051 to T-055, I-027 and the C-027 to C-033 observations (55 individual notes). R = reflected in Design.md (section named), N = non-architectural (reason).

| Source | Disposition |
|---|---|
| T-036 window strip | R: window strip paragraph (presentation only) |
| T-037 `camera`, `validateCameraReach`, `cameraReach`, `focusLimits`; T-024/T-025/T-028 notes | R: camera-reach paragraph; the three deferred bullets closed |
| T-037 `synthetic-belt` entry | N: a made-up fixture; named in the Components row |
| T-038: reuse held; label at long range; entry glob; builder outside name check | R: shower builder and presentation paragraphs |
| T-038 rework: composition from catalogue; async local data; derived eccentric sampling | R: shower builder (a) (b) (c) |
| T-038 rework: label setting, glow and emissive, sphere-radius framing, view-up, loop, refill, year span, one planet enlargement, Sun texture stand-in | R: presentation-settings paragraph |
| T-038 rework: dot opacity not a setting; Sun-close line depth | R: shower builder (e); open-items paragraph |
| T-038 uniform-spread note; moon readings do not leak; Overview framing and presets; workbook layout and scanner bug; IMO/AMS source; `published` provenance type | N: superseded by the measured stream, tested behaviour, behaviour of T-054's rule plus settings, a data-tool fact, a source choice; the provenance type is an O-012 candidate in the open-items paragraph |
| T-038 wall-clock test load-sensitive (also C-030 obs 3, C-031 obs 4, C-032 obs 3, C-033 obs 5, T-039) | R: open items; passed first time in this run |
| T-039 FINDING (parent not catalogued) and second-attempt PASS | R: bodies from settings; second shower result; Current Technical State |
| T-039 peak instants derived; equinox convention; I-027 J2000 | R: shower builder (d) |
| T-039 Perseid-only `showersMeasured.test.ts`; 9-minute all-shower run | R: second shower result |
| T-051 scatter 22 to 32 AU; true anomaly helper; 1904 date system | R: listed-orbit group paragraph |
| T-051 CAMS terms silent, local-only | R: sky and local-data paragraph |
| T-052 `createListedOrbitGroup`, phase rule, mu probe; C-029 obs 2 (mean-anomaly band) | R: listed-orbit group paragraph; Components row |
| T-052 touched `main.tsx` and `orbitGroup.ts` outside planned writes; C-029 obs 1 relative tolerance | N: one registry line, two `export` keywords; a test tolerance reading |
| T-053 notes 1 to 5 (sky field, layer, shell item, local data, `data-sky-*`) | R: sky paragraph; Components rows |
| C-028 obs (seam, constellation shapes) | N: picture off by default (I-026); positions proven by probe |
| T-054 notes 1 to 3, 5, 7; C-030 obs 1 and 2 | R: eccentric-sampling and marker-rule paragraph |
| T-054 notes 4 and 6 | N: periapsis rounded to whole ms (superseded by derived sampling); `synthetic-eccentric` is a fixture |
| T-055 `catalogue`, `catalogueOf`, `extendCatalogue`, elements-body record; C-032 obs 4 | R: bodies-from-settings paragraph |
| T-055 Geminid prose says "comet"; C-032 obs 2 (228 vs 150 pixels) | R: second shower result |
| C-032 obs 1 `ASTRAEUS_SOFT_PEAK` | N: diagnostic script option; strict run is the acceptance |

Camera-reach deferred notes (T-024/T-025, T-028): closed. Geminids PASS (configuration only after T-055) recorded in Current Technical State. GAP-5 (radiant marker) stays open and is recorded in the open-items paragraph.

### DW6 Reference spec (trimmed)
The owner's side-by-side look at Perseids against meteorshowers.org (T-038, accepted in C-031, 2026-10-15/16: "very cool", "Yea i think this is good") is the judgement for the six viewer criteria (Earth's orbit, the stream in its own inclined geometry, time advance through the encounter, rotate and zoom, follow Earth, a second shower from configuration). Technical support in this run: Perseids and Geminids pass every showers assertion at both sizes (Earth path, whole-orbit stream, crossing at the peak within 0.3 deg in J2000, follow Earth, orbit and zoom sweep, Geminids from settings alone). Real gaps only: GAP-5, a drawn radiant marker (RA and Dec are a readout only), and the Earth-based viewing perspective, deferred. The Perseids start-view problem found here was repaired as I-028.

### DW5 Run sheet input (owner's look server, port 5302; all stand-in marks from the Task records)
- Apollo: http://localhost:5302/ — Earth-Moon trajectory, both vehicles, events. Earth and Moon textures are local-only.
- Earth-Moon Explorer: http://localhost:5302/?experience=earth-moon — Moon and Earth, the Moon is now a marker at True overview.
- Jupiter-Io: http://localhost:5302/?experience=jupiter-io — Io at True overview is a marker; Jupiter flat colour (no texture); Io approximate demonstration.
- Made-up window and ring: http://localhost:5302/?experience=synthetic and http://localhost:5302/?experience=synthetic-ring — the window strip and the debris ring. Made-up data.
- Made-up belt: http://localhost:5302/?experience=synthetic-belt — Sun-centred belt visible at True and Readable. Made-up data.
- Made-up listed orbits and eccentric orbit: http://localhost:5302/?experience=synthetic-listed and http://localhost:5302/?experience=synthetic-eccentric — a group from a list of orbits; the 1 to 51 AU orbit with markers. Made-up data.
- Perseids: http://localhost:5302/?experience=shower-perseids — the stream crossing Earth's path. Opens at the overview after the I-028 repair (it opened at the Sun close-up in the integration run). Stand-ins: Sun texture orientation, Milky Way picture off, stream dots sit at their orbit phase by a model, CAMS terms unresolved (local data only).
- Geminids: http://localhost:5302/?experience=shower-geminids — same builder, settings only; 3200 Phaethon from published elements; it mounts the Sun, Earth, Mercury, Venus, Mars and Jupiter but not Swift-Tuttle (C-032), though the prose still says "comet"; the stream is thin (about 228 lit pixels).
- Phone sizes: the same URLs at 390 x 844 (browser dev tools); screenshots are in each script's folder under the run directory.

### Files
Read: Task, the T-036 to T-039 and T-051 to T-055 evidence and drift notes, C-027 to C-033 observations, I-027, Design.md, the reference spec (headings and criteria), the browser scripts' argument handling, the gap audit (GAP-5 line), `src/main.tsx` and `showerDefinition.ts` (entry names, presets). Extra reads: `tools/validate/browser-sky.mjs` (failure diagnosis), `tools/validate/public-build-assets.mjs` header (command). Changed: `.savepoint/Design.md`, this Task file, new `docs/evidence/o011-integration-20261016T063816Z/`. No source, test or earlier evidence changed; no Checks or Issues written; nothing committed.

### Limitations
Headless Chromium only, software GL. Owner visual judgement not recorded (pending). The Perseids sky scenarios were unverified in the integration run and pass in the I-028 run.


## Drift Notes

None expected; this Task reconciles the others.

## Replan — 2026-10-13 (I-025)

Amended in planning to cover T-051 to T-054 (measured stream, sky, comet and markers), the scripts added since O-014, and the reference spec walk-through.
