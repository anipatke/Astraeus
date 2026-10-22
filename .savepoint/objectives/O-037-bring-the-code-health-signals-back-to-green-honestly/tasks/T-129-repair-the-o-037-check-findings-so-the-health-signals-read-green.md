---
id: T-129
title: Repair the O-037 check findings so the health signals read green
objective: O-037
status: done
depends_on: []
owner_validation: {required: true, accepted_check: C-095, scope: ["preview look 2026-10-22: 'both fine' (Io phone marker and the reworked scene)"], accepted_by: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}}
check_waiver:
  task: T-129
  reason: "Owner waived the optional Task Check for O-037 ('dont run full checks until the final objective check'); the targeted recheck covers it."
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  recorded_at: '2026-10-22T20:55:00Z'
planned_by: {role: planner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
planned_reads: [.savepoint/checks/C-094-o-037-full-objective-check.md, .savepoint/issues, tests/compositions.test.ts, vite.config.ts, tools/validate/load-budget.mjs, src/app/AstraeusScene.tsx, src/app/sceneFrame.ts, tests/sceneFrame.test.ts, tools/validate/browser-jupiter-io.mjs, src/app/FeatureMarkers.ts]
planned_writes: [tests/compositions.test.ts, vite.config.ts, tools/validate/load-budget.mjs, tests, src/app/AstraeusScene.tsx, src/app/sceneFrame.ts, src/app, tools/validate/browser-jupiter-io.mjs, .savepoint/issues]
---

# Repair the O-037 check findings so the health signals read green

## Outcome

The findings of the O-037 Full Objective Check C-094 (NEEDS WORK) are repaired: the full gate passes and writes a fresh coverage report, the public load budget knows the new chunk, the scene component reads under 20 by the health scanner too, every frame stage has a node test, and the Io phone failure is explained (and fixed if O-037 caused it). A targeted recheck can then sign the Objective.

## User Check

Run `npm run test:full`: it passes and writes `coverage/coverage-final.json`. Open the planets demo at a phone size on the preview (`localhost:5490`), choose Jupiter, focus Io and turn it so Loki Patera faces you: its marker shows.

## Done When

1. I-060: `npm run test:full` passes twice in a row and writes `coverage/coverage-final.json` and `junit.xml`. Fix the slow `tests/compositions.test.ts` case under coverage at its cause (or give that one case an explicit, justified timeout); no blanket timeout increase.
2. I-061: the public-build load budget (`tools/validate/load-budget.mjs` and whatever lists its page sets) accounts for T-125's `settingsFields` chunk; its node test passes. The `public-build-assets` engine step is not rerun here (owner: no browser sets); the targeted recheck decides.
3. I-062 (owner, 2026-10-21: "Slim the scene file so it reads under 20 (Recommended)"): `src/app/AstraeusScene.tsx` reads at most 20 in a scratch lizard run with the project's health arguments (as well as under ESLint), by moving its remaining effect and hook callbacks into named hooks or stage modules; behaviour unchanged, ARCH rules held.
4. I-063: the three frame stages without a node test get one each in `tests/sceneFrame.test.ts` (CODE-02).
5. I-065 (owner asked "what failed?", then paused for the night; answer recorded in the Issue): read-only, compare O-037's changes to what `browser-jupiter-io.mjs:218` reads on the phone pass ("io:loki-patera is shown when its side faces the camera"), especially T-124's `updateOverlays` stage and the feature-marker visibility path; record whether O-037 changed that behaviour, with file and line. If it did, fix it with a node test. Then ask the owner how to prove it: their phone-size look on the preview, or one run of that script alone (about 3 minutes in C-094's log, longer under load). No browser set runs without the owner's say-so.
6. I-064: the four `.gif` files under `docs/evidence/o016-t063-*` are removed by the owner (deletion is owner-run: `find docs/evidence -name '*.gif' -delete`, then `git add -A docs/evidence`); the builder only records it.
7. Gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, then `npm run test:full` once. No browser sets, no `savepoint health check` (the recheck runs one).

## Context Files

`.savepoint/checks/C-094-o-037-full-objective-check.md`, `.savepoint/issues/I-060-*.md` to `I-065-*.md`, `tests/compositions.test.ts`, `vite.config.ts`, `tools/validate/load-budget.mjs`, `tests/publicBuild.test.ts`, `src/app/AstraeusScene.tsx`, `src/app/sceneFrame.ts`, `src/app/scenePointer.ts`, `tests/sceneFrame.test.ts`, `src/app/FeatureMarkers.ts`, `tools/validate/browser-jupiter-io.mjs` (around line 218), `.savepoint/Guardrails.md`.

## Design References

Design: the scene row (stage order, `scenePointer.ts`, CODE-02) and the O-037 paragraph; `tools/validate/` row (harness, load budget).

## Guardrails

CODE-01, CODE-02, TEST-01, TEST-03, ARCH-01, ARCH-02.

## Implementation Plan

1. Reproduce I-060 with `npm run test:full`; find why the composition case is slow under coverage; fix.
2. Add the chunk to the load budget; run its node test.
3. Lift AstraeusScene's remaining callbacks into named hooks; scratch lizard and lint.
4. Add the three stage tests.
5. Read-only I-065 comparison; record the finding; fix with a test only if O-037 caused it.
6. Gates; record I-064 once the owner has run the deletion.

## Boundaries

Owner-reported I-054 to I-058 (Venus map, illuminate-all, Pluto orbit laps, map turns and Titan, card fonts and fact cards) and I-059 are a later G-007 Objective, not this Task. I-066 (vite advisory, pre-existing on main) awaits an owner decision and is not changed here. No browser sets, no screenshots, no evidence deletion by an agent.

## Technical Verification

Gates above; scratch lizard run on `src/app/AstraeusScene.tsx`; the targeted recheck of C-094 (tests, health snapshot, and only the browser proof the owner chooses) closes the Objective with the owner's preview look (T-124, SC4).

## Technical Evidence

Built 2026-10-22 by the T-129 builder; Task Check waived by the owner (`check_waiver`). Nothing was run in a browser; no screenshots; no `savepoint health check`; nothing deleted.

1. I-060: timing the case showed the cost was `new TrackedBodyView(...)` (its constructor samples the Apollo trajectory, about 75 ms) built 36 times; `tests/compositions.test.ts` now builds it once. The case went from 1.47 s to 0.58 s alone and 2.5 s to 1.0 s under coverage; no timeout changed. `npm run test:full` twice in a row: 92 files passed, 1287 passed / 1 skipped, about 53 s each; `coverage/coverage-final.json` (2.4 MB) and `junit.xml` written both times; headline Statements 68.89% (7627/11070), Branches 65.8%, Lines 72.09%.
2. I-061: `tools/validate/load-budget.mjs` lists `settingsFields.js` in `SPLIT_CHUNKS`, `SHOWER_COMMON` and the planet page sets. A fresh public build in the scratch folder (`ASTRAEUS_PUBLIC_BUILD=1 vite build`, node only) passes `node tools/validate/load-budget.mjs` with exit 0; `tests/publicBuild.test.ts` has a new case holding the listing (19 pass). The `public-build-assets` step was not rerun.
3. I-062: the scene's callbacks moved to `src/app/sceneContentsHooks.ts` (`useBodyRefs`, `useSceneDerived`, `useOverlayLayers`, `useScenePointer`, `useSceneFrame`, `bodyIdOf`, `refFor`) and a `SceneBody` component; behaviour and stage order unchanged. Scratch lizard on `src/app/AstraeusScene.tsx` with the health-config exclusions: highest CCN 13 (was 38). `npm run lint` passes. Whole-project lizard still shows `tools/validate/runner.mjs` at 27 (not in this Task; owner question).
4. I-063: `tests/sceneFrame.test.ts` gained tests for `syncViews`, `publishCanvasReadouts` and `placeViews` (13 pass).
5. I-065: read-only. O-037 did not change the marker path: `src/app/FeatureMarkers.ts` has no diff against main; the old call (`AstraeusScene.tsx:379` on main) and `updateOverlays` (`src/app/sceneFrame.ts:235`) pass the same arguments in the same stage order; `browser-jupiter-io.mjs:218` changed only in the harness preamble. Cause not established; timing under load is the likely one. Recorded in the Issue history. The owner decides how to prove it.
6. I-064: pending the owner's deletion (`find docs/evidence -name '*.gif' -delete`, then `git add -A docs/evidence`).
7. Gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (junit written) all pass; one first `npm test` failure (`tests/nameCheck.test.ts`: the word "sun" in a new type) was fixed by retyping and rerun green.

## Drift Notes

Owner, 2026-10-22, after a phone-size look on the preview at Io (Loki Patera marker) and a general look at the scene: "both fine, mark it done and run the recheck". Coordinator set status done on that instruction.
