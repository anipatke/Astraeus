---
id: O-096
title: Failures and bad input said plainly
status: done
depends_on: [O-095]
release: G-025
last_check: C-218
priority: high
rank: 2
---

# O-096: Failures and bad input said plainly

## Outcome

With no WebGL, `ready` rejects with a `SceneError` of a new code `no-webgl` (in `SceneErrorCode` and the generated README error table), the host's `onError` hears it when given, and a short readable message stays in the viewer's place instead of an empty element (belt #16). Shelf factories refuse uneven input with `bad-part` naming the field: a label that is empty after trimming; chart bins that overlap or run backwards, and marks outside the bins' range; a fractional colour-key count; an empty colour key (belt #31, owner decision 4).

## Why

The docs already promise both behaviours; hosts currently need their own watchers and checks. Owner decision 1: these checks ship in 0.11.0 as breaking changes with a one-line migration each.

## Success Conditions

- With no WebGL 2 (`HTMLCanvasElement.prototype.getContext` returning null for WebGL), `mount`'s `ready` rejects with `SceneError` `no-webgl`; an `AstraeusScene` host's `onError` hears the same error (else `console.error`); `onReady` and `onFirstDraw` are not called.
- In that case a short readable message stays in the viewer's place (no shell, bar or canvas), inside the window at 1440x900 and 390x844, proven in the `two-viewers` browser step; `unmount` removes it and gives the element back.
- `no-webgl` is in `SceneErrorCode` and the generated README error table; the probe holds no WebGL context after it answers; `scene.check()` is unchanged.
- Every shelf factory and the setters taking the same fields refuse with `bad-part` naming the field: text that is blank after trimming (every shelf text field and id, through the shared checks in `shelf/part.ts`); `chart` bins that run backwards or overlap; `chart` marks outside the bins' range (at build; after `setBins` a mark outside is not drawn, as a dropped highlight); a fractional `colourKey` count; an empty `colourKey` (decision 4).
- One table test (`tests/shelfInputTable.test.ts`) runs all eight shelf factories through blank text, fractions, backwards and overlapping ranges, out-of-range values and empty lists, stating "accepted" with a reason where a field lawfully takes one, and fails when a shelf factory has no rows.
- Existing tests are unchanged except the four lines named in T-448 that pin the old lenient behaviour, and the shared vitest setup line in T-447 if the owner approves it (see Decisions).
- CHANGELOG 0.11.0 "Breaking changes" lists each stricter check and the new code with a one-line migration (replacing "None"); viewer-interface section 11, the README and the API lock match.
- Engine first download stays under its 527,000 B gzip cap (expected about +0.4 to +0.8 KB together).

## Design Confirmation

Owner confirmed this design at Goal level on 2026-11-22 (G-025 decisions 1 and 4; planning session plan-g025-20261122). Tasks detailed in planning session plan-o096-20261124.

## Decisions

- Planner, 2026-11-24: the WebGL check runs in the two entry points (`api/mount.ts`, `api/AstraeusScene.tsx`) before the viewer renders. Catching three's renderer failure instead cannot make `ready` reject: the host link attaches in an effect on the first render, before react-three-fiber measures its box and makes the renderer.
- Planner, 2026-11-24: after `ChartControl.setBins`, a mark the new bins leave out is not drawn and is not an error, matching how `setBins` drops a highlight; marks are fixed at build, where they are checked.
- Planner, 2026-11-24: the blank-text rule lives once in the shared shelf checks, so it covers every shelf text field and id, not only the button label belt #31 named.
- Owner, 2026-11-24 ("Shared setup line"): happy-dom counts as having WebGL through one line in the shared vitest setup; no existing test file is edited. A dedicated new test covers the no-WebGL path.
- Owner, 2026-11-24 ("No, colour key only"): chart bin counts may stay fractional; only colour-key counts must be whole.
- Owner, 2026-11-24 ("Allow the four lines"): T-448 may change exactly the four existing test lines it names (two in `shelfContentParts.test.ts`, two in `lifecycle.test.ts`) that pin the old lenient input, under G-025 decision 1; no other existing fixture changes.
- Owner, 2026-11-24: "orchestrate O-96". Standing orchestration rules: own branch, Sonnet builders in parallel (T-447 and T-448 share only CHANGELOG lines and possibly the API lock), optional step checks waived, coordinator marks steps done when gates pass, owner look on localhost:5490 for T-447's message before one Full Objective Check.

## Boundaries

**In scope:** mount-time WebGL failure, the new error code, the message, the shelf input checks, the shared table test, CHANGELOG breaking entries.

**Out of scope:** WebGL loss after a successful first draw (already handled by context restore); host-supplied message text.

## Closure

Full Objective Check C-218 CLEAR on 2026-11-24 (no Issues). Owner looked at the no-WebGL message on localhost:5490 and said "looks lovely as far as i can tell" (T-447; acceptance recorded against C-218). Marked done and merged by the coordinator under the owner's "orchestrate O-96" (standing rule: CLEAR → merge and push).
