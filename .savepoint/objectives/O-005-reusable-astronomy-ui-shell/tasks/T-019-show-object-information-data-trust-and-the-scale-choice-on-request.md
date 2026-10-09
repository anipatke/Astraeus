---
id: T-019
title: Show object information, data trust and the scale choice on request
objective: O-005
status: done
depends_on: [{task: T-022, requires: clear}]
owner_validation:
    required: false
    accepted_check: ""
planned_by: {role: planner, session: g002-replan-2026-10-06}
check_waiver:
    task: T-019
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-09T19:27:11Z"
---

# Show object information, data trust and the scale choice on request

## Outcome

Selecting an object or event opens a compact, configuration-driven info panel (name, short description, current distance/speed, event information) that never covers a large part of the canvas. A compact provenance badge such as "Reconstructed ⓘ" reveals source, accuracy, notes and known limitations. A True/Readable control explains in plain words that Readable pulls bodies closer while keeping their true size, so nearby spacecraft are drawn on top.

## User Check

Select Columbia: see its info, open "Reconstructed ⓘ" and read the sources, accuracy and known limitations including smoothed joins, burn cutoff residuals and the post-TLI speed limitation. Select Eagle during the surface stay and read the landing-site offset. Select the Moon: see "Ephemeris". Switch True/Readable and read its explanation; confirm readouts are identical under both.

## Done When

1. Info content and known limitations live in configuration and data (STYLE-09); the panel renders any experience's objects and events, and shows distance/speed through T-022's Metric Visuals rather than new ad-hoc readouts.
2. The provenance badge reads the existing per-trajectory `Provenance` (and an equivalent for Earth/Moon ephemerides) plus configured known limitations; no core type changes.
3. Apollo's known limitations take their figures from the generated reconstruction data (`data/apollo11/generated/validation.json` and the report), not hand-copied numbers, and cover the smoothed joins, published burn cutoff residuals, I-008's accepted post-TLI speed limitation and I-004's landing-site offset.
4. The scale control states the Readable trade-off; `ScalePolicy` is unchanged and a test confirms identical State under both policies through the shell.
5. Nothing reconstructed or illustrative appears without a reachable provenance status (named test over configured objects).
6. No mission naming in `src/shell/`; core and data unchanged; configured gates pass.

## Context Files

`docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `src/core/provenance.ts`, `src/core/scalePolicy.ts`, `src/core/events.ts`, `src/app/mission.ts`, `src/mission/apollo11.ts`, `data/apollo11/generated/validation.json`, `docs/APOLLO11_RECONSTRUCTION.md`, `.savepoint/issues/I-003-propagated-misses-reach-tens-of-thousands-of-km.md`, `.savepoint/issues/I-004-landing-site-offset-from-runtime-moon-orientation.md`, `.savepoint/issues/I-005-hud-covers-canvas-and-readablescale-radii.md`, `.savepoint/issues/I-008-post-tli-coast-still-produces-impossible-speed.md`, `tests/missionScene.test.ts`.

## Design References

Design: Interfaces and Data Flow (provenance, ScalePolicy), Current Technical State (published residuals, landing offset). Brief sections 3 (scale, info, provenance), 4. Idea success criterion 4.

## Guardrails

TEST-01, TEST-03, STYLE-07, STYLE-09, ARCH-01, ARCH-02, PROV-01.

## Implementation Plan

1. Confirm the I-008 Issue path and the validation JSON fields for residuals and landing offset; log any extra read.
2. Build the info panel and provenance badge from configuration and `Provenance`.
3. Add Apollo info content and known limitations sourced from generated data.
4. Build the scale control with its explanation.
5. Tests for provenance reachability, data-sourced figures and scale independence; run gates.

## Boundaries

No time-ranged provenance, no ScalePolicy or radius change, no reconstruction changes, no encyclopaedia framework.

## Technical Verification

Focused tests; configured gates at handoff; browser script with 0 console errors opening info and provenance for each object.

## Technical Evidence

Executor session t019-2026-10-09, 2026-10-09T08:34Z. Ready for a Check; not a claim that it passed. No Task Check requested or waived yet.

### Per-criterion outcomes

1. **Met.** Info content lives in configuration: `ExperienceObject.description/provenance/knownLimitations` and `ExperienceConfig.eventProvenance` (`src/shell/experience.ts`); Apollo supplies them in `buildApollo11Experience` (`src/mission/apollo11.ts`). `InfoPanel` renders any configured object or event from `infoView` (`src/shell/infoModel.ts`); distance/speed come from T-022 builders through `createObjectMetrics` (`src/app/metricReadouts.ts`) and render with `MetricVisual`; no new readout code. Test `infoProvenance.test.ts` › "renders any experience's objects and events from configuration alone" (non-Apollo fixture). Browser: every object's panel shows ≥1 `.metric`.
2. **Met.** `ProvenanceBadge` ("Reconstructed ⓘ", "Ephemeris ⓘ", "Observed ⓘ") discloses Known limitations, Sources, Accuracy, Notes. Columbia/Eagle pass the `SampledTrajectory.provenance` through unchanged (`TrackedBody.provenance`, app type); Earth/Moon use `createProvenance` records in `src/app/ephemerisProvenance.ts`. No core type changes. Tests: "shows the trajectory's own Provenance for Columbia and Eagle, and Ephemeris for Earth and the Moon" (identity check on the same object), "gives every event its title, time and source status".
3. **Met.** Apollo limitations are built from `data/apollo11/generated/validation.json` (`smoothingReportThreshold`, `segments`, `landingSiteOffset`) and event labels, plus the runtime trajectory's peak speed over `A-02>A-03` at 100 ms: smoothed joins (Columbia 13 coasts, up to 1,963 km; Eagle 3, up to 456 km — matches the report's list), burn cutoff residuals (Columbia 2.3–454.7 km; Eagle 0.2–5.8 km), post-TLI speed (454.7 km miss, 69,263 m/s correction, 73.5 km/s — I-008), landing-site offset (254.18 km / 8.386° at touchdown, 275.37 km / 9.087° at lift-off — I-004). Tests: "cover smoothed joins and burn cutoff residuals…", "covers the accepted post-TLI speed limitation…", "covers Eagle's landing-site offset…", "changes when the generated data changes, so no figure is hand-copied".
4. **Met.** `ScaleControl` (True/Readable + ⓘ explanation from `src/shell/scaleModel.ts`) states that Readable pulls bodies closer at true size so spacecraft are drawn on top, and that readouts do not change. `ScalePolicy` unchanged; `scalePolicyFor` maps the shell choice to the existing `trueScale`/`readableScale`, used by `App`. Tests: "maps each shell choice to the unchanged engine policy", "leaves State and every info readout identical under True and Readable through the shell's choice". Browser: info-panel metrics text identical before/after switching to Readable.
5. **Met.** Test "gives every configured object a provenance status in its info panel, and never hides a reconstructed or illustrative one" iterates all configured objects and every scene body whose trajectory provenance is reconstructed/illustrative. Browser opens the badge for all four objects.
6. **Met.** `git diff --stat -- src/core data` is empty. Existing test `timeline.test.ts` › "generic shell boundary" greps `src/shell/**` for apollo/columbia/eagle and passes (also `grep -rniE` empty). Gates below pass.

### Commands (2026-10-09, Node v22.22.2, TypeScript 7.0.2, Vitest 5.0.3)

- `npm run typecheck` — pass.
- `npm run build` — pass (existing >500 kB chunk warning only).
- `npm test` — 10 files, 170 tests pass.
- Fuller scene gate: `ASTRAEUS_INFO_SCREENSHOTS=docs/evidence/spike03-info PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js node tools/validate/browser-shell.mjs` against the existing Vite dev server on :5199 (this checkout) — pass, `errors: []`. Opens info and provenance for Earth, Moon, Columbia, Eagle; event info via "Just happened"; Escape closes; Readable switch with identical readouts; scale explanation. Screenshots in `docs/evidence/spike03-info/`.
- `tools/validate/browser-spike02.mjs` (copy writing to scratch, so committed Spike 02 evidence is not overwritten) — fails at `Follow Columbia (CSM)` after passing the updated scale step; see limitations.

### Files

Read (Context Files): brief, Objective, UI audit, `src/core/provenance.ts`, `scalePolicy.ts`, `events.ts`, `src/app/mission.ts`, `src/mission/apollo11.ts`, `validation.json`, `docs/APOLLO11_RECONSTRUCTION.md`, I-003, I-004, I-005, I-008, `tests/missionScene.test.ts`.

Extra reads (logged): `src/shell/*` (AstraeusShell, experience, metrics, MetricVisual, ObjectControls, objectModel, TimelineBar, timelineModel, style.css) — the Task builds into the shell; `src/app/App.tsx`, `MissionPanel.tsx`, `metricReadouts.ts` — wiring and T-022 builders to reuse; `src/core/trajectory.ts`, `sampledTrajectory.ts` (header) — where per-trajectory Provenance lives; `src/core/moonTrajectory.ts`, `astronomyAdapter.ts`, `docs/ASTRONOMY_VALIDATION.md` (grep), `.savepoint/Design.md` (grep) — honest Earth/Moon ephemeris provenance; `data/apollo11/generated/{columbia,eagle,events}.json`, `data/apollo11/raw/events.json` (header) — provenance and event source; `docs/APOLLO11_SOURCES.md` (grep) — event table; `tools/validate/browser-shell.mjs`, `browser-spike02.mjs` — fuller gate; `package.json`, `.savepoint/config.yml` — gates; Guardrails rule IDs named by the Task.

Changed: `src/shell/{experience.ts, AstraeusShell.tsx, ObjectControls.tsx, TimelineBar.tsx, style.css}`; new `src/shell/{InfoPanel.tsx, ProvenanceBadge.tsx, ScaleControl.tsx, infoModel.ts, scaleModel.ts}`; `src/app/{App.tsx, metricReadouts.ts, mission.ts}`; new `src/app/ephemerisProvenance.ts`; `src/mission/apollo11.ts`; new `tests/infoProvenance.test.ts`; `tools/validate/browser-shell.mjs`, `browser-spike02.mjs` (scale button names); new `docs/evidence/spike03-info/*.png`.

### Behaviour notes

- Choosing an object in the picker opens its info panel; "Info" toggles it. Clicking an event in the list or a marker seeks and opens the event; "Just happened" opens the current event without seeking; Previous/Next only seek, and an open event panel follows. Panel is non-modal and does not take focus (keyboard use of the picker would otherwise jump); Escape inside it and Close dismiss it.
- The developer "ReadableScale/TrueScale" buttons were removed; the viewer scale control replaces them (developer tools keep Anchor labels).

### Limitations

- `tools/validate/browser-spike02.mjs` is stale beyond scale: it clicks `Follow Columbia (CSM)` without first selecting Columbia, which the T-018 object controls require, and reads selectors (`.controls .readout`) from the pre-shell UI. Not repaired here (outside this Task); it overwrites committed evidence when run as-is. Owner/planner decision.
- Mobile (390×844): no overlaps, but an open info panel covers most of the canvas between the toolbar and timeline. A bottom-sheet treatment and final responsive judgement belong to T-020.
- Event info has title, UTC time and source status only; no per-event descriptions are configured (no encyclopaedia).
- Earth/Moon accuracy text points to `docs/ASTRONOMY_VALIDATION.md` instead of quoting its figures.
- Owner visual judgement not done (not required by this Task; T-020 covers it).

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.

- `ExperienceConfig` grew: per-object `description`, `provenance` (core `Provenance`), `knownLimitations`; experience-level `eventProvenance`. Shell gained `InfoPanel`, `ProvenanceBadge`, `ScaleControl`, `infoModel`, `scaleModel`; `AstraeusShell` takes `scaleId`, `onScaleChange`, `metricsFor`.
- App: `TrackedBody.provenance` passes the trajectory's Provenance through; `createObjectMetrics` and `ephemerisProvenance.ts` (Earth/Moon ephemeris Provenance equivalent) added. Scale choice moved from developer tools to the viewer toolbar.
- Design.md not yet reconciled for these (planner / O-005 close).
