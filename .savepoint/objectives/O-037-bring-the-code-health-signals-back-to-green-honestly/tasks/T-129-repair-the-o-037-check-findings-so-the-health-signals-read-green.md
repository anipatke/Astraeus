---
id: T-129
title: Repair the O-037 check findings so the health signals read green
objective: O-037
status: planned
depends_on: []
owner_validation: {required: true}
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

## Drift Notes
