---
id: T-255
title: Keep the viewer's hands off the rest of the page
objective: O-055
status: done
depends_on: [{task: T-254, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-255, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o055-run-20261102}, recorded_at: '2026-11-02T09:39:49Z'}
planned_by: {role: planner, session: o055-planning-20261102}
---

# Keep the viewer's hands off the rest of the page

## Outcome

The engine no longer reaches into the host page: it hides a loading cover only when its host hands one in (the site does; an outside host has none), the Escape key reaches only the viewer it belongs to, and the marker layer measures only its own viewer's panels (O-055 Success Condition 6; review F3; API-03).

## User Check

Not owner-facing as a step: the site's cover still fades on the first frame and Escape still closes panels on a page with one viewer, which the DOM tests prove. The owner's one look is at T-258.

## Done When

- **Loading cover.** `src/shell/bootLoader.ts` no longer calls `document.getElementById`, `document.body.prepend` or clones page markup: the fade and hide logic takes the cover element as an argument; `App` gets it through an internal prop (for example `cover?: () => HTMLElement | null`) and passes it to the first-frame hide in `src/app/sceneFrame.ts`; `mount` and `AstraeusScene` pass none, so an outside host's own `#boot` is never touched. The show-again and fail parts (clone, prepend, `data-state="failed"`) move to the site (`packages/astraeus-site/src`), which owns `#boot` in its `app.html`. `?loadfade=` and the Developer fade setting behave as before. The `shell/bootLoader.ts` `id` entry is removed from `apiIsolation.allowlist.json`; `idLiteralBreaks()` returns none, so the `id` rule has no entries left. The site's deep-import count changes as the imports do; `DEEP_IMPORT_COUNTS` is set to match (down only).
- Cover paths, each a row of one table test (`packages/astraeus/tests/bootLoader.test.ts` reworked, plus a site test for the moved parts): first frame hides the handed cover after the fade; a showing taken before a later show cannot hide it (I-074 rows kept); show again on a site switch; fail; `mount` with a page `#boot` present leaves it untouched; `AstraeusScene` likewise.
- **Escape.** Every document key listener in the viewer (`shell/useDrawers.ts`, `shell/StoryPanelView.tsx`, `shell/DisplaySwitches.tsx`, and any other found by `grep -rn "addEventListener(\"keydown\"" packages/astraeus/src`) acts on Escape only when the event's target is inside its own viewer's root, or is the page `body` / document element (today's one-viewer behaviour); a key pressed in a host's own control outside the viewer reaches none. One table-driven test over every listener x {inside this viewer, inside the other viewer, page body, a host input} checks which panels close. The Escape placeholder of `twoViewers.test.ts` becomes a real case per pairing.
- **Markers.** `FeatureMarkers` (`src/app/FeatureMarkers.ts`) measures occluding panels only inside its own viewer's `.astraeus-shell` (not `document`); `featureMarkers.test.ts` gains a case with a second viewer's panel over the same screen area that does not hide this viewer's markers.
- No other `document.` or `window.` lookup of page elements remains in `src/shell/` or `src/app/` (a grep listed in Technical Evidence; listeners for resize and outside-press closing are not lookups and stay).
- **Nothing public moved:** `git diff --exit-code -- packages/astraeus/api-surface.lock.json` is empty; `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes. CHANGELOG Unreleased gains one line (the viewer no longer touches page elements outside its own; Escape scoped).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/shell/bootLoader.ts`, `packages/astraeus/src/app/sceneFrame.ts` under the first-frame hide, `packages/astraeus/src/app/App.tsx` under its props and the load-fade setting, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/app.html`, `packages/astraeus/tests/bootLoader.test.ts`, `packages/astraeus/src/shell/useDrawers.ts`, `packages/astraeus/src/shell/StoryPanelView.tsx`, `packages/astraeus/src/shell/DisplaySwitches.tsx`, `packages/astraeus/src/app/FeatureMarkers.ts` under `FEATURE_OCCLUDER_SELECTOR` and `#measureOccluders`, `packages/astraeus/tests/featureMarkers.test.ts`, `packages/astraeus/tests/twoViewers.test.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts` under `DEEP_IMPORT_COUNTS`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` and `O-053 checks (Guardrails API-01 to API-07)`; the O-055 Objective under `Architectural Considerations` (planned decisions: the loading cover belongs to the site); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F3).

## Guardrails

API-03, ARCH-02, TEST-01, TEST-03, STYLE-02, STYLE-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Cover: element in, hide in the engine; show, clone and fail move to the site; allowlist entry out.
3. Escape: one small helper that says whether a key event belongs to this viewer, used by every listener.
4. Markers: measure within the viewer's root.
5. Table tests, two-viewer case, CHANGELOG line; gates.

## Boundaries

No look change. No public option for the cover. Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the Full Objective Check's one `npm run check:browser` covers the site's cover. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built under the O-055 run (Task check waived by the owner's run rules).

Entry paths and tests:
- Loading cover: engine `hideBootLoader(cover, seconds)` takes a getter and never looks up the page; `App` prop `claimCover` -> `AstraeusScene` prop -> `createFrameState(policy, claim)` (claimed at scene mount) -> `runFrame` first frame. Site: new `packages/astraeus-site/src/bootCover.ts` (show, fail, claim; clone and prepend moved here), wired in `main.tsx`. Table rows in `packages/astraeus/tests/bootLoader.test.ts` (hide+remove, failed left, no cover, I-074 show during fade, stale removal timer, page `#boot` untouched with no claim, claim once at mount) and `packages/astraeus-site/tests/bootCover.test.ts` (show existing, show after removal, fail, I-074 claim, page without cover). `sceneFrame.test.ts` first-frame test updated: handed cover hidden; no cover asks for no frame. `twoViewers.test.ts` per pairing: page `#boot` untouched, no viewer handed a claim (mount and AstraeusScene).
- Escape: listeners found by grep: `useDrawers.ts`, `StoryPanelView.tsx`, `DisplaySwitches.tsx` (the only document keydown listeners; React onKeyDown ones in InfoPanel, ScaleControl, MoonsSheet, TimelineMarkerGroups are element-scoped). New `shell/viewerKeys.ts` `keyIsForViewer(event, part)`: target inside the part's `.astraeus-shell` or body/document/documentElement. `escapeScope.test.ts`: 3 listeners x {inside A, inside B, page body, host input} on two real shells, plus the document itself with one viewer and two. `twoViewers.test.ts` per pairing: real phone drawer, host input / A / B / body.
- Markers: `FeatureMarkers.#measureOccluders` queries `this.#root.closest(.astraeus-shell)` only. Case added in `pointerAndFeatureLayerDom.test.ts` (that file holds the layer tests; the Task named featureMarkers.test.ts, which has no layer DOM tests): other viewer's panel over the same area hides nothing; own panel does.
- Grep `document.|window.` lookups in src/shell and src/app (excluding createElement, listeners, title): none remain except `viewerKeys.ts` comparing the event target to document/body, and `ScaleControl.tsx` `document.activeElement` compared with its own items (a focus read, not a page-element lookup).
- Allowlist: `id` entry for shell/bootLoader.ts removed from apiIsolation.allowlist.json (no id entries left). `DEEP_IMPORT_COUNTS["astraeus-site"]` 93 -> 92. api-surface.lock.json unchanged (git diff --exit-code clean). CHANGELOG Unreleased entry added.
- Gates: `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok; `npm test` 198 files, 2476 passed, 1 skipped; `npm run check:pack` pass; `npm run check:react-consumer` pass. apiSurface/apiRules/allowlistGrowth/packageBoundaries tests pass. New DOM test files (escapeScope, bootLoader, bootCover, twoViewers, pointerAndFeatureLayerDom) run 10x: 89 tests, zero failures each run. No browser run.

## Drift Notes

Record architecture deltas here; T-258 reconciles them into Design.md.

- T-258 (integration): the loading cover is now the host's: the engine exposes only an internal `claimCover` prop (App -> AstraeusScene -> FrameState.cover); showing/failing live in `packages/astraeus-site/src/bootCover.ts`. Design.md should say the engine never looks up page elements.
- T-258: viewer-scoped keys: `shell/viewerKeys.ts` (`VIEWER_ROOT_CLASS`, `keyIsForViewer`); every document key listener of the viewer uses it; `useDrawers` now takes the viewer root ref. Marker layer measures within its viewer root.
- Plan named `featureMarkers.test.ts` for the markers case; the occluder tests live in `pointerAndFeatureLayerDom.test.ts`.
