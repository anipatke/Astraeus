---
id: T-069
title: Simplify the code the owner picked from the ranked list
objective: O-017
status: in_progress
stage: audit
depends_on: [{task: T-066, requires: accepted}, {task: T-067, requires: clear}, {task: T-068, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Simplify the code the owner picked from the ranked list

## Outcome

Every candidate the owner ticked in `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` is simplified with behaviour unchanged, and the complexity and duplication signals for those files fall.

## User Check

The ranked list shows each ticked candidate marked done with its before and after figures. The demos look and behave as before.

## Done When

1. Each ticked candidate is done or returned to the owner with a reason; nothing outside the ticked list is restructured.
2. For each: behaviour-preserving (existing tests pass unchanged, or a changed test is listed with the reason), the code-health figure for that function or file recorded before and after.
3. If `LayeredRender` in `src/app/AstraeusScene.tsx` is ticked, it is split into named parts with one job each and the file's responsibilities are separated (STYLE-01, STYLE-02); scene behaviour is proven unchanged by the before/after pictures and the full scene scripts it touches.
4. No engine contract changes (`State`, `Trajectory`, `Provenance`, `TimelineEvent`, `ScalePolicy`); a needed change returns REPLAN REQUIRED.
5. Gates: typecheck, tests, both builds, validator, lite browser check, plus the full scripts for each area touched, zero console errors, fresh evidence directory.

## Context Files

`docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`, `src/app/AstraeusScene.tsx`, `src/app/experienceDefinition.ts`, `src/experiences/showers/showerDefinition.ts`, `.savepoint/health/config.json`. Further files are exactly those named in the ticked rows; log each as a planned read.

## Design References

Design.md Components/Codebase Map and the sections for each touched area.

## Guardrails

ARCH-01, ARCH-02, ARCH-04, TEST-01, TEST-03, STYLE-01, STYLE-02, STYLE-07, STYLE-10, CODE-01.

## Implementation Plan

1. Take the ticked rows in order of risk, smallest first.
2. One commit-sized change per candidate, gates between them.
3. Record before and after figures per candidate.

## Boundaries

Only ticked candidates; no new features; no contract changes.

## Technical Verification

Configured gates, lite check, full scripts for touched areas, before/after pictures. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session: Sonnet 5.5 builder, 2026-10-17 (system clock reads 2026-10-16 23:2x UTC in the evidence directory names). Candidates taken smallest risk first (C8, C2, C5, C3, C7, C4, C1); typecheck and the affected tests ran between candidates. T-067 and T-068 were done, so each candidate was re-measured on the current code first.

### Per-criterion outcome

1. **Each ticked candidate done or returned.** All seven (C1, C2, C3, C4, C5, C7, C8) are done; none returned. Nothing outside the ticked rows was restructured. C6, C9 and C10 untouched. `src/app/PointsView.ts` untouched (reserved for T-073). Each row is marked done with its figures in `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` (new "T-069 results" table).
2. **Behaviour-preserving, figures recorded.** `npm test`: 877 passed before, 879 after (the only test change is C7, mapped below); no other test file was edited. Before/after figures (lizard CSV over `src/`, jscpd 5.4.0 `--min-lines 5 --workers 1 --reporters json`, same flags as T-066; raw files in `docs/evidence/o017-t069-browser-20261016T232625Z/`: `lizard-src-before.csv`, `lizard-src-after.csv`, `jscpd-src-before.json`, `jscpd-src-after.json`, `jscpd-tests-before.json`, `jscpd-tests-after.json`):

| # | Re-measure on current code, then the change | Before | After |
|---|---|---|---|
| C8 | Three of the five dead exports were already gone (T-067, T-068). Deleted `BODY_FIXED_TO_MESH_NOTE` (`renderCoordinates.ts`, with its orphaned comment) and `MetricKind` (`shell/metrics.ts`). | 2 unused exports | 0; 8 lines removed |
| C2 | `validatePathSpec` split into `must`/`isPositiveFinite` helpers, `checkPathRule`, `checkRollingSpan`, `checkFixedSpan` and the source probe; error messages, types and order of checks unchanged. | lizard CCN 45, 56 lines, one function | validatePathSpec CCN 10 (30 lines), checkFixedSpan CCN 10, checkPathRule 7, checkRollingSpan 5; file 399 to 412 lines |
| C5 | `memberStatesOf` and `propagatedPositionOf` added to `orbitGroup.ts` and used by `createOrbitGroup` and `createListedOrbitGroup`; `rotateInto` is no longer exported (nothing else used it). | jscpd: 2 clones (9 + 9 lines) between `listedOrbitGroup.ts` and `orbitGroup.ts`; `src/` 6 clones | 0 between them; `src/` 4 clones; `listedOrbitGroup.ts` 301 to 287, `orbitGroup.ts` 175 to 184 |
| C3 | New `src/core/fieldReaders.ts` (`fieldReaders(fail)` returns `record`, `text`, `finite`, `instant`, bound to each parser's own error type and wording); `parseElementsBodyRecord` split into `parseOrbitElements`, `parseEpoch`, `parseSource`, `parseRadius`, `parseAccuracy`, `parseMarker`. `showerSettings.ts` uses the same readers. Error messages and check order unchanged. | `parseElementsBodyRecord` CCN 41, 176 lines; jscpd 32 lines (21 + 11) shared by `elementsBody.ts` and `showerSettings.ts`; files 294 + 396 | `parseElementsBodyRecord` CCN 5, 17 lines; largest piece `parseOrbitElements` CCN 14, 21 lines; 0 shared lines; files 266 + 372 + 40 (new) |
| C7 | Re-measured: the CAMS-only cases were already gone with T-067, and the "46 inside the first file" no longer exists. `showersMeasured.test.ts` is now one `describe.each` over Perseids and Geminids plus a Perseid-only block; `showersMeasuredGeminids.test.ts` removed (plain `rm`). | 2 files, 357 lines; tests jscpd 104 lines (10 clones), 46 of them between the two files | 1 file, 240 lines; tests jscpd 58 lines (6 clones); 0 between showers files |
| C4 | `showerDefinition.ts` split (no behaviour change, CAMS lines already gone): `showerBasics.ts` (ids, bounds, catalogue, shared constants), `showerStreamText.ts` (panel sentences, stream and absent-stream items), `showerStream.ts` (stream layer), `showerPaths.ts` (Earth, planet and parent orbit paths), `showerActivity.ts` (activity window, rate and radiant metrics), `showerBodies.ts` (composition and body items); `showerDefinition.ts` keeps story panels, the alternates switch and `buildShowerDefinition`, and re-exports every name callers imported from it (tests and `main.tsx` unchanged). | 1 file, 581 lines, the largest in `src/` | 7 files: 134 (assembler) + 41 + 74 + 56 + 151 + 86 + 82 = 624 lines; no file over 151; largest function CCN 8 |
| C1 | See criterion 3. | `AstraeusScene.tsx` 542 lines; lizard block CCN 126, 377 lines | 298 lines; lizard block CCN 54, 164 lines |

   Whole `src/`: duplicated lines 63 (0.44%, 6 clones) to 13 (0.09%, 2 clones); functions over CCN 20: 5 to 3 (`AstraeusScene` 54, `parseShowerSettings` 21, `AstraeusShell` 21); functions over CCN 10: 24 to 23. `src/` lines 14,242 to 14,471 (the splits add import headers and four small new files); `tests/` lines 10,035 to 9,918. The C2 and C4 splits are readability changes, not size savings (the ranked list estimated this for C4; C2's estimated 15-line saving did not happen, the file grew by 13).
3. **C1 split.** The frame callback in `SceneContents` is now an orchestrator of about 45 lines. New files, one job each (STYLE-01, STYLE-02): `sceneTargets.ts` (what a focus or label id names this frame), `sceneCamera.ts` (opening view, camera request, up change, zoom limits; `stepCameraTarget`), `sceneBodies.ts` (`placeBodies`, `swapSmallBodiesToMarkers`), `sceneLights.ts` (`placeBodyLights`), `sceneSky.ts` (`updateSky`), `sceneDebug.ts` (canvas data attributes, frame stats, the Developer readout), `sceneHooks.ts` (`useHostLayer` for the three DOM layers that repeated one effect, `useSkyStars`, `useSceneViews`) and `LayeredRender.tsx` (moved as is). The ref `placed` was dropped (the frame's own map is passed instead). Every new function has CCN 9 or less (largest: `applyCameraRequest` 9, `framingDistance` 8). Lizard still reads `AstraeusScene` (component plus `SceneContents`) as one block, now CCN 54 / 164 lines. Behaviour proof: pictures (criterion 5) and every scene browser script (criterion 5).
4. **No engine contract change.** `State`, `Trajectory`, `Provenance`, `TimelineEvent`, `ScalePolicy` untouched; no REPLAN needed. `rotateInto` (core helper, not a contract) lost its `export`.
5. **Gates, all green.**

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` and `--noUnusedLocals` | exit 0 |
| Tests | `npm test` | 48 files, 879 passed (before: 49 files, 877) |
| Build | `npm run build` | exit 0 |
| Public build + validator | `ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir <scratch>/pubbuild`, then `node tools/validate/public-build-assets.mjs <scratch>/pubbuild .../public-build-assets.json` | built; validator exit 0 (`sources: [], matches: []`) |
| Lite browser tier | `ASTRAEUS_URL=http://localhost:5474/app.html ASTRAEUS_EVIDENCE_DIR=<dir>/lite node tools/validate/browser-lite.mjs` | 26/26 loads passed, zero console errors |
| Full scripts (scene-touching) | `<dir>/run-all.sh` (commands as in the Full Objective Check `summary.txt`, minus the removed lighting, sky-map and showers-gmn scripts), dev server on 5474, public preview on 5475 | all 22 exit 0, zero console errors; `<dir>/summary.txt` lists each with times: lite, public-showers (public preview), spike02, spike03, shell, anchor-labels, synthetic, synthetic-ring, synthetic-belt, synthetic-listed, synthetic-eccentric, marker-existing, sky, sun, earth-moon, jupiter-io, showers-perseids, showers-geminids, view-link, precision, story-panels |

   Evidence directory for scripts: `docs/evidence/o017-t069-browser-20261016T232625Z/` (one `<name>.log` per script, JSON and screenshots in its folder, `summary.txt`, `run-all.sh`). Run 10:26 to 11:03 on the clock.
   **Pictures.** `node tools/validate/capture-experience-pictures.mjs --out docs/evidence/o017-t069-after-20261016T232415Z --port 5475` (20 pictures, 0 errors; port 5474 was held by the dev server for the scripts). `tools/validate/diff-screenshots.mjs` against `docs/evidence/o017-before-20261016T205125Z` gives `diff-vs-before.json` in the after folder: 8 identical, worst 0.0231% of pixels over 16 levels (noise bound 0.024%), only the two assets pages differ in size (by design, T-067/T-068). A second capture taken just before C1 (`docs/evidence/o017-t069-preC1-20261016T231958Z`, after C2 to C7) against the after set gives `diff-vs-preC1.json`: 13 identical, worst 0.0194%, assets pages identical. Earlier evidence directories were not overwritten.

### C7 scenario map (TEST-03)

Reason: the two measured-shower test files were the largest test duplication (the same checks with one shower's numbers); one parametrised suite keeps every scenario and adds none that a shower did not already have. Logged output lines now carry the shower letters. Tests: 25 before, 27 after.

| Before | After |
|---|---|
| Perseids: "keeps the settings-side row columns equal to the fetch tool's" | unchanged (top-level test) |
| Perseids "holds the files the settings name, CC BY 4.0, ..." (iau code and letters, licence, 2 citations, months, hashes, byte sizes, counts balance, rows = kept) ; Geminids "is the GMN file for IAU 4 ... and parses as the builder's input" (iau, letters, licence, 2 citations, months, rows = kept, rows above 40,000, `parseMeasuredOrbits` count); Geminids "holds the files the settings name" (letters, licence, months, hashes, bytes, counts balance, rows = kept) | per shower: "holds the files the settings name ..." (all of the above; `minRows` is 40,000 for Geminids, 0 for Perseids) |
| Perseids citation regexes (506(4), 491(2)), shipped columns equal `SHIPPED_COLUMNS`, August 2025 count 30,338 (part of the Perseid "holds" test) | Perseid-only "cites the two papers and counts the August rows ..." |
| Perseids "is drawn from the GMN file by the builder ..."; Geminids "is drawn from the GMN file ... and the reliable set is the rule's"; Geminids "shipped with the story" builder count | per shower: "is drawn from the GMN file by the builder ... and the reliable set is the rule's" (now also asserts, for Geminids, the kept-count sentence, "Qc" and no "double entries are kept" that only the Perseid test asserted before) |
| Perseids "DW3(i)" (both sets in one test); Geminids median (one test per set) | per shower, per set: "DW3(i), <set> orbits ..." (MDC values 58.8 and 33.8) |
| Perseids "DW3(ii)" (both sets, 0.5 and 1 degree bins logged); Geminids busiest bin (per set) | per shower, per set: "DW3(ii) ..." (MDC 140.1 and 261.6 held in the case table; the 1 degree bin is still only logged) |
| Perseids and Geminids Earth-nearest-peak (per set; 120 s and 240 s timeouts) | per shower, per set: "DW3(iii) ..." (240 s) |
| Perseids and Geminids radiant (per set) | per shower, per set: "DW3(iv) ..." |
| Perseid-only: draws no invented member; resolves a sample of 20; clump share; DW2(c)/(d); fills quickly | unchanged, in the Perseid-only block |

### Files read beyond the Context Files (all named by the ticked rows unless stated)

Planned reads (rows C1-C8): `src/core/elementsBody.ts`, `src/core/listedOrbitGroup.ts`, `src/core/orbitGroup.ts`, `src/app/renderCoordinates.ts`, `src/shell/metrics.ts`, `tests/showersMeasured.test.ts`, `tests/showersMeasuredGeminids.test.ts`, `tests/helpers/measuredOrbits.ts`, `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`. Extra reads, logged with reason: `agent-skills/savepoint-task/SKILL.md` (skill); `src/app/PathView.ts`, `PointsView.ts`, `CameraController.tsx`, `sceneLayout.ts`, `sceneFraming.ts`, `DebugOverlay.tsx`, `BodyView.tsx`, `lighting.ts`, `frameStats.ts`, `FrameRateSection.tsx`, `catalogue.ts` (signatures only, by search, to type the C1 helpers; PointsView not edited); `src/experiences/showers/measuredOrbits.ts` (lizard only); `tools/validate/browser-*.mjs` headers and `docs/evidence/objective-check-20261016T190443Z/summary.txt` (to run the same script set with the same arguments); `.savepoint/Guardrails.md` STYLE lines; `tests/paths.test.ts`, `tests/orbitGroup.test.ts` and the other test files by name only (run, not edited).

### Limitations

- Pictures are compared with the noise tolerance, not bit-identically (as T-066 recorded); the lite check and scripts do not judge the look.
- Lizard reads `AstraeusScene` plus `SceneContents` as one block, so its CCN (54) overstates the frame callback; the new pieces each measure 9 or less.
- The original T-066 "before" pictures predate T-067 and T-068; the pre-C1 capture was added so C1 is isolated from them.
- The two chosen refactors in C2 and C4 do not reduce line counts (C2 +13, C4 +43); they reduce the per-function complexity and the single-file size only.
- Did not run the full-gate-for-migration or the Full Objective Check (not this Task). Optional Task Check not requested here.

## Drift Notes

Deferred to the O-017 integration Task (Task 7 in the plan), which must account for each as reflected in Design.md or explicitly non-architectural:

- Components/Codebase Map: `src/app/` gains `LayeredRender.tsx` and the `scene*` helpers (`sceneTargets`, `sceneCamera`, `sceneBodies`, `sceneLights`, `sceneSky`, `sceneDebug`, `sceneHooks`); `src/core/` gains `fieldReaders.ts`; `src/experiences/showers/` gains `showerBasics`, `showerStream`, `showerStreamText`, `showerPaths`, `showerActivity`, `showerBodies` (the assembler `showerDefinition.ts` remains the entry). Architectural for the map; no contract or behaviour change.
- `rotateInto` is no longer exported from `orbitGroup.ts`; `memberStatesOf` and `propagatedPositionOf` are new core helpers shared by the two orbit groups (non-architectural, internal).
- `tests/showersMeasuredGeminids.test.ts` no longer exists; its scenarios live in `tests/showersMeasured.test.ts` (map above).
