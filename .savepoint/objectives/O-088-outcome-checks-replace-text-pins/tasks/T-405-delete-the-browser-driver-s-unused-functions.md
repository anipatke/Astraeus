---
id: T-405
title: Delete the browser driver's unused functions
objective: O-088
status: done
depends_on: [{task: T-404, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-405, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/check-hello-planets.mjs, packages/astraeus-site/tools/validate/check-hello-scene.mjs, packages/astraeus-site/tools/validate/check-hello-sky.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tools/validate/journey-look-out.mjs, packages/astraeus-site/tools/validate/journey-meteor-shower.mjs, packages/astraeus-site/tools/validate/journey-planets-phone.mjs, packages/astraeus-site/tools/validate/journey-views.mjs, packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/tools/validate/driver-guard.mjs, packages/astraeus-site/tests/browserDriverGuard.test.ts, packages/astraeus-site/tests/browserDriverPhoneBar.test.ts, packages/astraeus-site/tests/browserDriverScale.test.ts, packages/astraeus-site/tests/driverNoIds.test.ts, packages/astraeus-site/tests/browserDrawnControl.test.ts, docs/agents/browser-policy.md]
planned_writes: [packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/driver.d.mts, docs/BROWSER_CHECKS.md]
---

# Delete the browser driver's unused functions

## Outcome

`tools/validate/driver.mjs` keeps only the functions some browser script, test or kept driver function reaches; the rest (about 225 of 408 exports, about 1,000 lines at 0.9.5: Claude S7, Gemini S-03) are deleted, and one clean browser run shows nothing a script needs was lost (AH-33; Objective success condition 2).

## User Check

None visual. One `check:browser` run (the full tier if O-086 has split them) passes; the driver is about half its size.

## Done When

- A reachability list is built mechanically and recorded in Technical Evidence: roots are every `ui.<name>` / named import from `driver.mjs` in `tools/validate/*.mjs` (except `driver.mjs`) and in `packages/astraeus-site/tests/**`; reached = roots plus every driver function a reached function calls, repeated until stable (a TypeScript 6 syntax walk or an equivalent script; grep alone is not enough for internal calls). The list gives counts before/after and names each deleted export.
- Every unreached export and any non-exported helper only they used is deleted from `driver.mjs`; `driver.d.mts` loses the same declarations. `HOOK` entries no kept function uses are deleted.
- `docs/BROWSER_CHECKS.md` "The interface driver" table lists only kept functions; the O-041 paragraph naming earlier removals stays as history.
- `npm run lint`, `npm run typecheck` (the `.d.mts` is checked) and the driver tests (`browserDriverGuard`, `browserDriverPhoneBar`, `browserDriverScale`, `driverNoIds`, `browserDrawnControl`) pass.
- One clean browser run: `npm run check:browser` (the full tier when O-086 has added tiers, since the driver serves every step), run once, alone on the machine (no other browser job), evidence folder per `docs/agents/browser-policy.md`. Exit 0, no console-error lines. A step failure caused by a deleted function is fixed by restoring that function (and recording why the reachability walk missed it), never by changing a script's assertion.
- No behaviour change in any kept function (deletions only; record `git diff --stat`).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tools/validate/driver.mjs` (whole file: the deletion subject)
- `packages/astraeus-site/tools/validate/driver.d.mts`
- `docs/BROWSER_CHECKS.md` under `The interface driver (...)`
- `docs/agents/browser-policy.md` (whole, short; run rules)
- The scripts and tests in `planned_reads` are read only by the reachability script, not by eye.

## Design References

`docs/BROWSER_CHECKS.md` under `The interface driver (...)`.

## Guardrails

TEST-01, TEST-03, STYLE-05, STYLE-10.

## Implementation Plan

1. Write the reachability walk as a scratch script (not committed); run it; save the list.
2. Delete unreached exports and orphaned helpers; prune the `.d.mts` and `HOOK`.
3. Lint, typecheck, driver tests.
4. One browser run; record path, command, time, result.
5. Update the driver table in `BROWSER_CHECKS.md`.

## Boundaries

Deletions only in the driver; no script, runner or harness change. Do not fix `developerOpen` or other driver behaviour (O-086 owns step speed). One browser run; if it fails for a reason unrelated to this Task (flake, environment), record it and rerun once; a second unrelated failure stops the Task and is reported.

## Technical Verification

Focused: the driver tests above. Then `quality_gates`. Then one `npm run check:browser` (full tier), alone.

## Technical Evidence

Reachability walk (scratch script, Babel AST walk of every top-level declaration; not committed): roots = `ui.<name>` in the 11 scripts/fixture that `import * as ui` (browser-smoke, check-hello-planets/scene/sky, journey-catalogue/look-out/meteor-shower/planets-phone/views, profile-frame-loop, tests/fixtures/browser-exit/draws-through-harness) plus named imports in tests (browserDriverScale, browserDriverSettledCamera, browserDriverPhoneBar); 154 roots, none missing from the driver; no bare or computed `ui` use. Closure over identifiers referenced inside each reached declaration, to a fixed point (re-run after deletion: 0 unreached).

| | before | after |
|---|---|---|
| exports | 412 | 180 |
| top-level declarations | 463 | 180 (all exported; the 16 helpers went too) |
| lines in driver.mjs | 3173 | 1745 |

Deleted helpers: nextButton previousButton SCALE_LABELS scaleTrigger scaleInfo touchDrag centreOf swipeFrom dragPagePoints canvasTopAt sceneReachableAt clearBodyPoint moonFamily standInAddress featureCollisionsNow HOME_FIT. Also deleted: their leading comments, 7 section headers left with nothing under them, and 5 unused HOOK keys (eventContext currentEventButton glow track bootLoader).

Deleted exports (232): timelineText pageText pressKey clockText clockMsFromTimelineText pausePlayback ensurePausedQuietly playPlayback continuePlayback isPlaying storyAutoOpenOn pausePlaybackNow setSpeed speed nextEvent previousEvent hasNextEvent nextEventLabel eventListText pickEventRow eventRowLabel eventContextText insideText openCurrentEventInfo timelineBox glowCount glowText glowGradients glowTooltipAt windowParts windowPeakTimeMs goToWindowPeak goToNamedWindowPeak openNamedWindowInfo pickFirstBody bodyOptionCount waitForBodyAvailability bodyAvailable waitForBodyPicker bodyOptionInfo waitForFallbackToOverview firstPickableBody infoPanelFor waitForInfoClosed infoMetricsText infoMetricCount focusInfoToggle openInfo pressInformationButton closeInfoByKeyboard closeInfoForViewport focusInfoClose closeInfoByPanelButton provenanceBadgeText openProvenance sourcesOpen openSources closeSources sourceLines provenanceDetailText provenanceDetailRaw provenanceDetailContent provenanceDetailVisible pressRelatedObject relatedObject selectOrbit waitForCamera pickBodyWithCamera focusFirstTimelineMarker firstTimelineMarkerLabelVisible sceneLabel sceneLabelVisible visibleSceneLabelBoxes hideSceneLabels showSceneLabels developerGroupOpen developerGroups toggleDeveloperGroup openDeveloperGroup developerButtonCount openDeveloper closeDeveloper pressDeveloperNow metric overflowingMetrics instrumentMetrics advancedReadouts openAdvancedReadouts pressToggle pressToggleNow toggleOn toggleVisible toggleCount setSlider dragSlider sliderValue sliderCount sliderReadout waitForOrbitLines resetOrbitLines pressFirstControlNow storySettings viewValuesText copyViewLink viewLinkValue viewLinkNote frameRate sceneStoryMarkerPressed storySourcesOpen openStorySources storySectionCount storySectionLabel storyPanelDetails storyPanelDetailsShown closeStorySources storyPanelHandleVisible storyPanelBadgeElement sceneStoryMarker sceneStoryMarkerPanelIds pressSceneStoryMarkerOnce pressSceneStoryMarker closeStoryPanelIfPresent seekPositionIso closeStoryPanelIfOpen closeAllPanelsNow offersScale chooseScale scaleToggleName scaleToggleTitle hasScaleExplanation scaleInfoName scaleInfoBox scaleInfoOpen pressScaleInfo pressScaleInfoNow scaleExplanationText anchorLayerHidden visibleAnchorLabelCount waitForAnchorLayer waitForFrameGraphLine shellBounds primaryControlTargets homeDemoLinks homeBrokenPictures tapObjectPicker phoneBoxes tapMenu tapControlsHandle tapTimelineHandle waitForDrawer swipeMenuDown swipeControlsHandleUp swipeTimelineHandleUp swipeTimelineHandleDown dragOnScene swipeInfoSheetDown scrollsSideways storyPanelClearOfPlay clockAndPlaying infoSourcesClosed speedSliderValue setSpeedSlider controlStyles drawerTransition objectListShown speedSliderShown infoSourceLinesShown PHONE_LAYOUT_SLIDERS phoneSettingShown setPhoneSetting watchLoader loaderWasSeen loaderState waitForLoaderGone trackRequests catalogueMoonFamilies bodySetReadout ringReadout pointAtScene tapScene bodyScreenPoint pickTarget pickHover sceneCursor waitForPickTarget waitForPickHover tapBody dragAcross pinchAt hoverBody hoverScenePoint tappableBodies tappableLabelIds emptySceneSpot tappableSetMember bodySetNameShown bodySetNamesShown closeMoonPanel shellPanelBoxes viewportSize moonPanelShown moonFamilies moonListSummaryText moonPanelHighlight tapMoonFamily moonFamilyFoldOpen openUnnamedMoons unnamedMoonsHeading moonRows moonFamilyDescription featuredMoonPictures searchMoons moonSearchResults PORTFOLIO_FRAME_HEIGHT FRAMING_BROWSER_ARGS openInPortfolioFrame embeddedLook shownFeatureKeys hoverFeature featureNameShown featureCollisions featureMarkerPressed featureTapTarget featureNameFits openHomeCurveFits curveFitSetMinutes curveFitReadout curveFitLayout watchHostChanges hostChanges hostControlText catalogueBasics

driver.d.mts: unchanged; every declaration in it is still exported (checked), nothing to prune. docs/BROWSER_CHECKS.md: the "interface driver" table keeps only kept functions (rows filtered, plus a last row listing kept functions the table never named); O-041 paragraph untouched.

| Done When | Evidence |
|---|---|
| Reachability list mechanical, counts, names | above |
| Unreached exports/helpers/HOOK deleted; .d.mts in step | counts above; re-walk finds 0 unreached; d.mts check |
| BROWSER_CHECKS.md table | docs diff, 9 insertions 8 deletions |
| lint, typecheck, driver tests | `npm run lint` clean; `npm run typecheck` clean; full `npm test`: 324 files, 5319 passed, 2 skipped (includes browserDriverGuard/PhoneBar/Scale/SettledCamera, driverNoIds, browserDrawnControl) |
| One clean browser run | `npm run check:browser` (tier full), docs/evidence/browser-20261121T232215Z, 304 s of 450 s: 11 of 12 steps exit 0 with 0 error lines. synthetic-journey exit 1: `locator.waitFor` timeout plus `net::ERR_NETWORK_CHANGED` and a failed dynamic import of journeyData.ts (the machine's network changed mid-run; not a missing driver function). Rerun once with `--step synthetic-journey`: exit 0, 64 s, 0 error lines, docs/evidence/browser-steps-20261121T232739Z |
| No behaviour change in kept functions | deletions only; `git diff --stat`: driver.mjs 1430 lines changed (all deletions), BROWSER_CHECKS.md 17; prettier clean |
| Gates | lint, typecheck, build, test all pass (junit.xml written) |

Extra reads: none beyond Context Files and the roots the walk parsed.


## Drift Notes

None for Design. For the planner: full tier took 304 s against its 450 s limit; no step time moved by the deletion (it is source size only).

## Coordinator (gates)

Set done by the orchestrating session after the gates passed (owner: "I mark them as they pass", O-038; G-024 decision 7): lint, typecheck, build clean; `npm test` 324 files, 5319 passed, 2 skipped; full browser tier docs/evidence/browser-20261121T232215Z 11 of 12 steps green, synthetic-journey red on `net::ERR_NETWORK_CHANGED` (machine network change mid-run, not a driver export) and green on its one rerun (docs/evidence/browser-steps-20261121T232739Z). This run is on the o088 branch, which contains all of O-087 including the T-396 border-box repair.
