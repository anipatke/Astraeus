---
id: T-169
title: Rebuild Apollo 11 on the public API
objective: O-041
status: done
depends_on: [{task: T-170, requires: clear}]
owner_validation: {required: true}
check_waiver:
  task: T-169
  reason: 'Owner approved the O-041 plan ("go ahead") and set the standing run rule of no per-step Task Checks and one Full Objective Check at the end (Decision 8). Not a technical CLEAR; no acceptance criterion or Objective Check is waived. The owner look has since passed (see Technical Evidence).'
  actor: {role: owner, session: o041-run-20261024}
  recorded_at: '2026-10-23T21:50:00Z'
planned_by: {role: planner, session: o041-planning-20261024}
---

# Rebuild Apollo 11 on the public API

## Outcome

The Apollo 11 demo's code imports only `astraeus`, builds its story with the public Scene calls, and the site shows it in place of the old definition, looking as before apart from O-041 Decisions 2 and 3; Design.md is reconciled for O-041.

## User Check

Open `localhost:5490` (Apollo is the default experience), desktop and phone: the opening view, paths, anchor dots, events on the timeline, story panels and the Moon's orbit look as before; each spacecraft's info card shows its notes, known limits and the telemetry bars; the Developer drawer no longer has Apollo's "This demo" section; the camera menu reads Overview / Focus / Follow.

## Done When

- `packages/astraeus-demo-apollo11/src` imports only `astraeus` (`.` entry); `packages/astraeus-site/tests/packageBoundaries.test.ts` enforces it, proved on a made-up offence.
- A scene builder (e.g. `buildApollo11Scene()`) replaces the hand-written definition; `packages/astraeus-site/src/main.tsx` uses its `toDefinition()`.
- `MissionPanel.tsx` and `DebugControls.tsx` are gone (Decision 2); mission notes live in the spacecraft descriptions/provenance; telemetry is the info-card readout bars.
- A comparison test (captured from the pre-rebuild definition) shows the same objects (ids, labels, colours, provenance, known limits), events, panels (ids and times), window, rates, scale choices and opening view; each difference is one allowed by a Decision and named.
- Apollo's 11 test files are rewritten against the public result; every dropped case is named with a reason in Technical Evidence.
- Browser scripts that name the old camera labels or Apollo Developer sections are repaired in `driver.mjs` only and mapped in `docs/BROWSER_CHECKS.md`.
- The Apollo page set in `packages/astraeus-site/tools/validate/load-budget.mjs` is re-measured on a public build; any limit raise is flagged for the owner, not decided by the builder.
- Design.md reconciled for O-041's drift notes (new public calls, moved metrics file, no-timeline shell option, Apollo on the public API), each reflected or named non-architectural with a reason.
- Hand-off gates green, plus `check:engine-alone`; owner look recorded.

## Context Files

`packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11.ts`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Definition.tsx`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/apolloMetrics.ts`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/MissionPanel.tsx`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/DebugControls.tsx`, `packages/astraeus-demo-apollo11/package.json`, `packages/astraeus-demo-apollo11/tests/apollo11Reconstruction.test.ts`, `packages/astraeus-demo-apollo11/tests/controls.test.ts`, `packages/astraeus-demo-apollo11/tests/domApollo.test.ts`, `packages/astraeus-demo-apollo11/tests/infoProvenance.test.ts`, `packages/astraeus-demo-apollo11/tests/metricVisuals.test.ts`, `packages/astraeus-demo-apollo11/tests/missionScene.test.ts`, `packages/astraeus-demo-apollo11/tests/paths.test.ts`, `packages/astraeus-demo-apollo11/tests/pointsLayer.test.ts`, `packages/astraeus-demo-apollo11/tests/storyMarkers.test.ts`, `packages/astraeus-demo-apollo11/tests/sunCentred.test.ts`, `packages/astraeus-demo-apollo11/tests/timeline.test.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/tests/packageBoundaries.test.ts`, `packages/astraeus-site/tools/validate/load-budget.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`, `packages/astraeus/src/api/scene.ts`, `.savepoint/Design.md`.

## Design References

Design Components/Codebase Map (Apollo demo, site), Current Technical State O-035/O-036/O-040.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03.

## Implementation Plan

1. Capture the current definition's comparable shape as a fixture before changing anything.
2. Write the scene builder on public calls; switch the site; drop the Developer sections.
3. Comparison test, boundary rule, rewritten demo tests.
4. Repair browser driver labels if needed; re-measure the page set.
5. Reconcile Design.md.
6. If a needed call is missing from the public API, return REPLAN REQUIRED naming it rather than reaching into internals.

## Boundaries

No new Apollo data or reconstruction re-run; no change to other demos; no custom Developer-panel hook.

## Technical Verification

Hand-off gates plus `check:engine-alone`; public build plus `public-build-assets.mjs` alone for the page set. No `check:browser` per Task (once at the Full Objective Check). Owner look on the preview. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built by a Sonnet builder session, o041-run-20261024. Stopped at `stage: audit`; not marked done, not committed, router untouched. Optional Task Check waived (see `check_waiver`). Owner look at Apollo on `localhost:5490`: PASSED (owner, 2026-10-24): "looks cool, no need for Sky in drop downs though".

**Capture first.** Before any Apollo code changed, `packages/astraeus-demo-apollo11/tests/fixtures/apollo11-before-rebuild.json` was written from the hand-written `apollo11Definition` (objects, presets, events and provenance, window, rates, clock, panels, composition, scale choices, opening view, tracked paths, Developer section ids, and the info-card rows of all four objects at four times) by a throwaway test (deleted).

**What was built.** `src/experiences/apollo11/apollo11Scene.ts`: `buildApollo11Scene(data = APOLLO11_DATA)` on `astraeus` only (`Scene`, `earth`, `moon`, `trueScale`, types). `apollo11Definition.ts`: `toDefinition()` plus the page label (used by tests). `packages/astraeus-site/src/main.tsx` builds the scene from a dynamic import of `apollo11Scene` and adds the label. Deleted: `MissionPanel.tsx`, `DebugControls.tsx`, `apolloMetrics.ts`, `earthMoonMetrics.ts`, `apollo11.ts`, `apollo11Definition.tsx`; the demo's `package.json` no longer exports the `.tsx`. Peak speed in the post-TLI known limit is read through `Scene.stateOf` on a probe scene (public call). A needed capability was missing for two small things (see Limitations); they are named, tested as differences, and flagged for the owner rather than reached around.

**Per criterion.**
1. Boundary: `packageBoundaries.test.ts` has `PUBLIC_API_DEMOS` (the Apollo demo): its `src/` may import only `astraeus`; proved on a made-up demo with three offences (deep entry, `astraeus/app/App`, another package), and the real packages pass. Met.
2. Scene builder replaces the hand-written definition; `main.tsx` uses `buildApollo11Scene().toDefinition()`. Met.
3. `MissionPanel.tsx` and `DebugControls.tsx` gone; mission notes (the required statement, the dots-and-lines note, the marker-size note, launch and splashdown as events only) are in the spacecraft descriptions; telemetry is five info-card bars per spacecraft (range with Moon marker, speed, distance to Moon, altitude above Earth, altitude above Moon). Met.
4. Comparison test `tests/rebuildComparison.test.ts` (14 cases) against the captured fixture. Same: object ids, order, labels, availability, provenance, label reach; Earth description and limits; Moon description; every spacecraft known limit word for word; events, event provenance, window, rates, opening clock, story panels (ids, times, text), scale choices, opening view, layers, composition bodies/centre/Moon path, tracked paths (ids, labels, colours, bounds, sample count and time sum, anchors, provenance), the Earth/Moon rows, and range/speed/Moon-gap values to 6 decimals. Differences, each named in the test: (a) Decision 2: spacecraft descriptions gain the mission notes; Developer sections gone; altitude bars join the card; (b) Decision 3: preset labels and the nine-item menu, "Earth–Moon overview" is "Overview", Follow Earth and Follow Moon added, order differs, the opening menu item is Focus Earth (was none); (c) Decision 9: a "Path uncertainty" known-limits line added to each spacecraft, two named altitude bars. NOT allowed by any Decision, flagged for the owner: Earth and Moon colours are the catalogue's (`#e8e8e8` and another) not `#9fd8ff` / `#ded7cc`; the Moon's second known limit is the catalogue's landing-site offset line, not "No velocity is modelled for the Moon"; the Moon's label priority is 99 not 90 (rank by order added); the composition id is `scene` not `earth-moon` (nothing reads it). Met, with those four flagged.
5. Demo tests (11 files) rewritten against the public result through `tests/support.ts` (`apollo11Definition`, `apolloMetrics(resolver)`, `spacecraft`, `apollo11Mission` as events/window/rates/bodies) plus the new comparison file. Dropped cases (each with its reason): controls.test.ts "UTC input" (3 cases), "clock controls" (5), "scrub window" (1): they tested `DebugControls` typed-date seek, speeds and scrub, deleted with the Developer sections (Decision 2); metricVisuals.test.ts "measures the spacecraft-Moon gap and altitude ... position metric" (replaced by "gives each spacecraft's info card range, speed, the Moon gap and the two named altitudes", Decisions 2 and 9), "reads each segment's published discrepancy" (the live uncertainty bar is dropped, Decision 9), "measures journey progress" (the journey bar was in the dropped drawer, Decision 2), "metric visuals mounted ... MissionTelemetry" (replaced by a case that the card rows leave State unchanged); missionScene.test.ts "uses the required wording" (rewritten: the statement is in both spacecraft descriptions) and the camera-label case (Overview, Follow Earth now exists). Changed expectations: domApollo (five rows per spacecraft, nine presets), infoProvenance (limits read from `buildApollo11Scene(data)`; trajectory provenance from the body), site tests experiences/compositions (composition id), storyPanels/domDemoStories (read through `apollo11Definition`). pointsLayer, sunCentred, apollo11Reconstruction, paths, storyMarkers, timeline: imports only.
6. Browser scripts: no script named the old labels (they use preset ids `overview`, `focus-columbia`) and none called the Apollo-drawer driver functions; those were deleted from `driver.mjs` (`jumpToMissionEvent`, `missionEventOptions`, `pickMissionEvent`, `setUtc`, `seekToUtcText`, `waitForUtcField`, `utcFieldVisible`, `missionPanel`, `missionReadouts`, `waitForMission`, `missionMetricSvg`, `missionRadars`, `missionMetrics`, `drawerSection`, `scrollDrawerToTelemetry`, `HOOK.missionPanel`) and mapped in `docs/BROWSER_CHECKS.md`. No step ran: no script behaviour changed (no browser run, no evidence folder, no screenshots). Met.
7. Load budget, public build (`ASTRAEUS_PUBLIC_BUILD=1 npx vite build packages/astraeus-site --outDir <scratch>` then `public-build-assets.mjs`): Apollo page 11 files, 4,337,097 B raw / 2,809,174 B gzip against limits 4,370,000 / 2,900,000 (no raise, not lowered). The chunk was renamed (`apollo11Scene.js`), and the chunk graph shifted: `catalogueItem.js` is no longer separate, `preload-helper.js` is, and the planets pages import `events.js`; those names were updated in `load-budget.mjs` and no limit changed. Other pages: Jupiter 6,934,744 / 4,705,702 (limit 7,130,000 / 4,900,000); Perseids 10,077,995 / 7,026,233 (limit 10,080,000 / 7,040,000, 2,005 B raw headroom, the tightest); Geminids 12,564,571 / 7,833,176 (limit 12,680,000 / 7,890,000); whole build 25,043,799 / 17,323,974. `public-build-assets.mjs` ok. Met; nothing for the owner to raise, but the Perseids page has almost no headroom.
8. Design.md reconciled: an "O-041 ... reconciled in T-169" block at the end accounts for each drift note of T-166, T-167, T-170 and T-169 as reflected or non-architectural, and the Components rows were updated. Met.
9. Gates, run once after the last change: `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` 124 files, 1655 passed, 1 skipped; `npm run check:engine-alone` pass (17.6 s). Met. Owner look pending.

**Files read** (Context Files): apollo11.ts, apollo11Definition.tsx, apolloMetrics.ts, MissionPanel.tsx, DebugControls.tsx, the demo `package.json`, the 11 demo tests, main.tsx, packageBoundaries.test.ts, load-budget.mjs, driver.mjs, docs/BROWSER_CHECKS.md, api/scene.ts, Design.md. **Extra reads (logged):** earthMoonMetrics.ts (to delete it); the Task files of T-166, T-167, T-170 (their drift notes); api/story.ts, api/index.ts, api/time.ts, api/bodies.ts (the public calls to use); app/catalogueItem.ts, assets/compositions.ts, core/bodies/moon.ts, core/provenance.ts (what addBody gives: colour, limits, composition); app/trackedMetrics.ts (readout ids and labels); app/experienceDefinition.ts (definition label field); the generated data files' shape (columbia/eagle/events/validation/panels json); site tests that used Apollo (experiences, compositions, domDemoStories, storyPanels; demoRules, experiencePlugIn, experienceDefinition, pointsLayer, sunCentred needed no change); browser-smoke.mjs (it reads `DEFINITIONS` in main.tsx, unchanged); run-browser.mjs; docs/BROWSER_CHECKS.md driver table.

**Limitations.** Not verified: the look of the rebuilt Apollo by eye (desktop and phone), the info-card bars as drawn, the camera menu and opening view in a browser, the story panels firing, `check:browser` (never run, by rule), `check:pack` (not run: engine API unchanged in this Task). Missing capability, not worked around: the public `addBody` takes no colour and no known limits, so Earth and Moon take the catalogue's; if the owner wants them as before, `addBody` needs `color` and `knownLimitations` options (small, a new Task). A path-uncertainty limit line replaces the live bar by Decision 9; its wording is mine.

**Decision 11 follow-up (owner, 2026-10-24, "Add the two options").** `addBody` gained `color` (hex colour) and `knownLimitations` (list of non-empty texts) in `packages/astraeus/src/api/scene.ts` with doc comments (on `/api` through `AddBodyOptions`, already in its SECTIONS group), a new `SceneError` code `bad-body` in `errors.ts`, and a made-up-configuration test in `packages/astraeus/tests/publicApi.test.ts` (set colour and limits, defaults kept for other bodies, five bad values, empty list allowed). `apollo11Scene.ts` passes Earth `#9fd8ff`, Moon `#ded7cc` and the Moon's two original limits. `rebuildComparison.test.ts` now compares colour and the Earth and Moon limits equal to the fixture (the colour and Moon-limit difference cases were removed). Remaining accepted minor differences pending the owner's look: the Moon's label priority is 99 not 90 and the composition id is `scene` not `earth-moon` (no public option carries them; nothing reads the id). Gates rerun after the change: lint clean, typecheck clean, build ok, `npm test` 124 files / 1654 passed / 1 skipped, `check:engine-alone` pass (14.2 s), `check:pack` pass (15.3 s). Items 4 and Limitations above are superseded on colours and the Moon's limit.

**Sky fix (owner look, 2026-10-24).** `skyObject` (`packages/astraeus/src/app/skyModel.ts`) now has `listed: false`, so the Sky item is out of the object drop-downs (desktop top bar and phone drawer) in every experience; the sky is still drawn, still an object, and its credits (NOTICE, home page, Milky Way/HYG sources in its provenance) are unchanged. `tests/sky.test.ts` gained "is not offered in the object drop-downs" (`listedObjects` returns none for it); no existing test expected the Sky entry. Gates after the change: lint clean, typecheck clean, build ok, `npm test` 124 files / 1655 passed / 1 skipped, `check:engine-alone` pass (17.0 s). Not seen in a browser; `check:pack` not rerun (API unchanged). Side effect: the Sky card can no longer be opened from a list.

## Drift Notes

Design.md was reconciled in this Task: every drift note of T-166, T-167, T-170 and T-169 is reflected or named non-architectural in the "O-041 ... reconciled in T-169" block (and the Components rows). Decision 11 added `addBody` `color` and `knownLimitations` and `bad-body` (public options; /api lists them via `AddBodyOptions`); Design.md's O-041 block says the `addBody` colours and limits differ: now only the label priority and composition id remain. Open for the owner: (1) (resolved by Decision 11); (2) the Perseids page is within 2,005 B raw of its load limit; (3) engine leftovers `TrackedBody.positionDiscrepancies`, `MissionConfig.journey` and the discrepancy and journey metric builders now have no user (clean-up for a later Objective).
