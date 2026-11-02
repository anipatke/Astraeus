---
id: I-141
title: Nothing fails when the site's loading cover is no longer handed to the scene
type: verification
status: open
source:
  kind: check
  check: C-144
  actor: {role: checker, session: o055-check-20261102}
  at: '2026-11-02T10:50:00Z'
tasks: [T-255]
checks: [C-144]
guardrail_ids: [TEST-01, TEST-03, API-03]
severity: medium
history:
  - at: '2026-11-02T10:50:00Z'
    actor: {role: checker, session: o055-check-20261102}
    kind: observed
    check: C-144
    note: 'C-144 mutation probe: `createFrameState(props.controls.policy.id, props.claimCover)` changed to `createFrameState(props.controls.policy.id)` in packages/astraeus/src/app/AstraeusScene.tsx; `npx vitest run`: 200 files, 2494 passed, 1 skipped; `tsc --noEmit` clean. Restored with git checkout.'
---

# I-141: Nothing fails when the site's loading cover is no longer handed to the scene

## Summary

T-255 moved the loading cover to the site. The engine no longer finds `#boot`; the site hands a claim down: `main.tsx` `claimCover={cover.claim}` -> `App` -> internal `AstraeusScene` -> `createFrameState(policy, claim)` -> first-frame `hideBootLoader`. T-255's User Check says "the site's cover still fades on the first frame ... which the DOM tests prove", and its Technical Verification says "the Full Objective Check's one `npm run check:browser` covers the site's cover". Neither holds. The tests cover the two ends: `bootLoader.test.ts` and `sceneFrame.test.ts` call `createFrameState` with a claim directly, and `bootCover.test.ts` covers the site helper. Nothing tests the chain between them. `check:browser` never reads the cover: `loaderState` and `waitForLoaderGone` in `driver.mjs` are called by no step, and `#boot` has `pointer-events: none`, so clicks pass through a cover that never fades.

The consequence is credible. If any link in that chain is dropped, the site's opaque black cover (`position: fixed; z-index: 50`) stays over every demo for good, and every gate, including `check:browser`, still passes. Before O-055 this could not happen, because the engine found `#boot` itself.

The code is correct today: it was read link by link, and the owner's look on 2026-11-02 saw the site load. What is missing is the TEST-01 evidence the Task promised.

## Evidence

- Mutation: in `packages/astraeus/src/app/AstraeusScene.tsx:171`, drop the claim from `createFrameState`. Then `npx vitest run` gives 200 files, 2494 passed, 1 skipped, and `npx tsc --noEmit` is clean (C-144, restored with `git checkout`).
- Dropping `claimCover={claimCover}` from `App.tsx`'s `<AstraeusScene>` fails only `packagePacks.test.ts` (3 tests, the package build trips on the now-unused destructured prop). That is a lint side effect, not a check of the behaviour.
- `grep -rn "claimCover" packages/astraeus-site/tests packages/astraeus/tests` finds only the `twoViewers.test.ts` mock, which asserts that a host passes no claim.
- No test reads `packages/astraeus-site/src/main.tsx`'s `App` props, apart from `publicBuild.test.ts`, which reads its entry keys.

## Proof Needed

- A fast-suite test renders the real `App` with a `claimCover` the way the site does, and proves the claim reaches the first frame and hides the handed cover. For example, the internal scene's `createFrameState` receives it, or the first frame of a stubbed scene calls `hideBootLoader` with it. The same test fails when the claim is dropped at either the `App` or the `AstraeusScene` link (the mutation above).
- One of the following proves the site wiring, and fails when `claimCover` is removed from `main.tsx`: a site test of `main.tsx`, or a browser step that reads `ui.loaderState` / `waitForLoaderGone` after the first frame (smoke at both sizes). Either joins the gate set the owner approves.
