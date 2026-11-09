---
id: T-288
title: Add a ready-made loading cover and the event zone note
objective: O-061
status: in_progress
stage: audit
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: voyagers-review-20261110}
check_waiver: {task: T-288, reason: 'Owner said "orchestrate O-061" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o061-run-20261110}, recorded_at: '2026-11-09T20:44:20Z'}
---

# Add a ready-made loading cover and the event zone note

## Outcome

A host can ask the viewer for a ready-made loading cover, the same option on `mount` and `AstraeusScene`, which covers the viewer until the first frame and fades out over the `loadFadeSeconds` look; hosts that do not ask see no change. The README says an event has one zone, as wide as its widest pacing rule.

## User Check

On the localhost:5490 preview, at 375x667 and 1280x720, a page using the cover shows it while loading and fades it at the first frame, sized to the viewer, not the window; no overlap with viewer controls.

## Done When

Opt-in option on both paths (API-02), off by default; styles scoped to the viewer root (API-03); `prefers-reduced-motion` honoured; tests for shown, faded at first draw, absent when not asked, two viewers; README row and CHANGELOG; the event-zone README line, checked against `packages/astraeus/src/core/pacing.ts`; API lock updated.

## Context Files

`packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/app/AstraeusScene.tsx`, `packages/astraeus/src/api/look.ts`, `packages/astraeus/src/core/pacing.ts`, `packages/astraeus/tests/viewerStyles.test.ts`, `packages/astraeus/tests/twoViewers.test.ts`, `packages/astraeus/README.md` (`onFirstDraw` row, event zone section), `packages/astraeus/CHANGELOG.md`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

API-01, API-02, API-03, API-06, API-07, TEST-01.

## Implementation Plan

1. Add the opt-in option to the mount and React options, fading on the existing first-draw signal and the `loadFadeSeconds` look.
2. Scope the cover's styles to the viewer root; respect reduced motion.
3. Tests, README rows, CHANGELOG, lock.
4. Add the event-zone README line after reading `pacing.ts`.

## Boundaries

Default off, so existing hosts see nothing new. No change to `onFirstDraw`.

## Technical Verification

`npm run check:gates` (lint, typecheck, build, `npm run test:full`, engine-alone, pack, node and react consumer checks); browser scripts only at the Full Objective Check (`npm run check:browser`). Evaluated later under `agent-skills/references/check-method.md`. Owner look on localhost:5490 at the end of the Objective.

## Technical Evidence

Done When to test (`packages/astraeus/tests/loadingCover.test.ts`, run on `mount` and `AstraeusScene`, 9 tests):

| Done When | Test |
|-----------|------|
| Opt-in option on both paths (API-02) | "shows from the start ... fades ... removed" runs for `mount(..., { loadingCover: true })` and `<AstraeusScene loadingCover />` |
| Shown while loading, faded at first draw over the `loadFadeSeconds` look | same test: cover present before and after the canvas is built (`data-state="covering"`), `fading` with `transitionDuration` `0.1s` (the scene's look) after the engine's own first frame, then removed |
| Off by default | "is absent when not asked for" (both paths, before and after the first frame) |
| Two viewers | "covers two viewers independently" (first draws, second stays covered; API-03) |
| `prefers-reduced-motion` honoured | "is removed at once, without a fade, under prefers-reduced-motion" (JS) plus a CSS `transition: none` rule |
| Styles scoped to the viewer root (API-03) | the cover is a child of the viewer's own `.astraeus-shell` root (test "lies inside the viewer's one root element, before and after the scene has loaded"; one root only, never two), CSS test "all sit under the viewer's root class", plus the existing `apiRules` selector scan and id scan (pass, allowlist untouched) |
| README row, CHANGELOG, event-zone line, API lock | README `loadingCover: true` row and mount/React signature rows (README API table test passes); CHANGELOG Unreleased (0.8.1) two bullets; "An event has one zone, as wide as its widest pacing rule" before the Event zones paragraph, checked against `core/pacing.ts` (`zoneAround`, `eventZonesOf`, `activeEventZones` dedupes by event id: several rule zones on one event are all centred on it, so the union is the widest; an event's own `withinMs` replaces each rule's width); `npm run api:lock` rewrote `api-surface.lock.json` |
| Cover must not stay over an error | "is removed when the scene fails to load" on both paths: `mount` (`ready` rejects) and `AstraeusScene` (`onError` called); the cover is gone in both |
| No change to `onFirstDraw` | `firstDraw.test.ts` unchanged and passing; the cover subscribes through the same `link.onFirstDraw` |

Files changed: `packages/astraeus/src/app/LoadingCover.tsx` (new), `src/app/style.css`, `src/api/mount.ts`, `src/api/AstraeusScene.tsx`, `tests/loadingCover.test.ts` (new), `tests/apiImports.test.ts` (allows `app/LoadingCover`), `packages/astraeus-site/tests/apiRules.test.ts` (README-table self-test strings), `README.md`, `CHANGELOG.md`, `api-surface.lock.json`, `packages/astraeus-site/cover-preview.html` (new, dev-only preview page, not in the build inputs).

Commands: `npx vitest run packages/astraeus/tests/loadingCover.test.ts` 9 passed; `npm run api:lock` wrote the lock; `npx vitest run packages/astraeus/tests/loadingCover.test.ts` 13 passed (repeated 4 times); API-03 scans (`apiRules`, `viewerStyles`, `viewerIds`) pass with the allowlist untouched; `npm run check:gates` all 9 gates passed (total 178 s, none over limit). Browser check not run (policy).

Limits: the cover covers the first frame only (a React rebuild with a new `scene` does not bring it back); it carries no text; fade and phone/desktop no-overlap are by construction (an absolute fill of the viewer's element with no content) and judged by the owner on the preview, not by a browser run. A scene that fails to load removes the cover on both paths (tested).

## Drift Notes

- Design: the cover is a child of the viewer's root `.astraeus-shell`, so the root class is not duplicated. Before the scene's data has loaded no shell exists, so `LoadingShell` (a root holding only the cover) stands in; the real shell replaces it, never sits beside it (a `cover` prop on `App` and `AstraeusShell` carries the cover into the real shell). The cover remounts at that swap, which is harmless since no frame has drawn yet (a listener added after the first draw is told at once).
- The component lives in `app/` (not `api/`) and `apiImports.test.ts` ALLOWED gained `app/LoadingCover`.
- Test note: one viewer hands its canvas more than one frame state while it settles (discarded renders), so `loadingCover.test.ts` draws the first frame on all of them; an earlier version that picked one was flaky under load.
