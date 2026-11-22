---
id: T-428
title: Each dot, halo and body picture belongs to what draws it
objective: O-092
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-428, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "Carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:52:00Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: textures
planned_reads: [packages/astraeus/src/app/dotMaterial.ts, packages/astraeus/src/app/bodyDraw.ts, packages/astraeus/src/app/TrackedBodyView.ts, packages/astraeus/src/app/BodySetView.ts, packages/astraeus/src/app/useBodyTexture.ts, packages/astraeus/src/app/BodyMesh.tsx, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/tests/releaseSharedTextures.test.ts, packages/astraeus/tests/glowAndHooksDom.test.ts, packages/astraeus/tests/bodyViewDom.test.ts]
planned_writes: [packages/astraeus/src/app/dotMaterial.ts, packages/astraeus/src/app/bodyDraw.ts, packages/astraeus/src/app/TrackedBodyView.ts, packages/astraeus/src/app/BodySetView.ts, packages/astraeus/src/app/useBodyTexture.ts, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/tests/releaseSharedTextures.test.ts, packages/astraeus/tests/glowAndHooksDom.test.ts, packages/astraeus/tests/bodyViewDom.test.ts, packages/astraeus/tests/ownedPictures.test.ts, packages/astraeus/tests/bodyTextureOwnedDom.test.ts]
---

# Each dot, halo and body picture belongs to what draws it

## Outcome

No GPU picture is shared between viewers any more, so one viewer's unmount can never dispose a picture another viewer draws, and no shared picture keeps an unmounted viewer's renderer reachable (the O-030 reason the release functions exist). The round dot, the anchor ring and the halo picture are made per material that uses them; the halo sprite has its own geometry instead of three.js's one page-wide sprite geometry; a loaded body picture stays cached for the page but each use draws its own clone; a body picture that failed to load is tried again at the next mount (AH-13 "one unmount releases shared glow, anchor and dot textures for all viewers"; part of AH-39).

## User Check

None visual: every picture is generated or loaded exactly as before, so dots, anchors, halos and planet surfaces look the same. The Full Check's browser run covers it (this Task touches `dotMaterial.ts`, a Shaders path in the browser policy, so the run adds `look-out`; its paths also add draft 01's `two-viewers` step).

## Done When

- `dotMaterial()` (`dotMaterial.ts` ~39) makes a new round-dot `DataTexture` for each material that has no `map` of its own, and makes none when the caller passes a `map` (today the disc is built and then replaced by the anchor ring's `map`, `TrackedBodyView.ts` ~121–123). The module-level `dotTexture` and `releaseDotTexture` (~4, ~27–30) are gone.
- `anchorSpriteTexture()` (`TrackedBodyView.ts` ~57) returns a new texture on each call; the module-level `anchorSprite` and `releaseAnchorSprite` (~50, ~80–83) are gone.
- `createGlow()` (`bodyDraw.ts` ~231) gives each sprite a new soft-glow texture and its own clone of the sprite geometry, so nothing a glow draws with is shared; the module-level `glowTexture` and `releaseGlowTexture` (~196, ~219–225, including the probe that disposes three's page-wide sprite geometry) are gone.
- `BodySetView.dispose()` (`BodySetView.ts` ~266) also disposes its dot material's map (now its own).
- `useBodyTexture` (`useBodyTexture.ts` ~20–29) keeps `useLoader`'s page cache for the decoded picture but returns a per-use clone (`texture.clone()` with `needsUpdate = true`, because a fresh clone has version 0 and three would never upload it) and disposes only the clone on unmount, never the cached original. When the load failed (the empty stand-in texture, no `image`), unmount clears that URL from the loader cache (`useLoader.clear(SafeTextureLoader, url)`: the cache is keyed by the file's own `SafeTextureLoader` class, ~7) so the next mount tries again; it is never cleared while mounted (that would refetch in a loop).
- `useReleaseSharedTextures` (`sceneContentsHooks.ts` ~215–229) and its call and import in `AstraeusScene.tsx` (call ~271, import ~7) are removed (re-checked after O-087/O-089: still there, unchanged).
- New `tests/ownedPictures.test.ts` (plain Vitest, happy-dom only for the glow canvas, with the canvas-context stub pattern of `glowAndHooksDom.test.ts` ~29–37):
  - two `dotMaterial()` calls give two different maps; a call with its own `map` creates no disc (count `DataTexture` constructions or compare to the passed map);
  - two `createGlow()` calls give different maps and different geometries, and neither geometry is three's shared sprite geometry (`new Sprite().geometry`);
  - two-viewer case (API-03): build "viewer A" and "viewer B" objects (two of each: dot material, anchor material, glow) and dispose all of A's geometries, materials and maps; B's geometries, materials and maps hear no `dispose`, and three's shared sprite geometry hears none either.
- New `tests/bodyTextureOwnedDom.test.ts` (r3f mocked as in `bodyViewDom.test.ts` ~10–14, with `useLoader` replaced by a recorder that returns one cached texture per URL): two mounted uses of one URL get different textures, both with version > 0; unmounting one disposes only its clone (the other clone and the cached original hear no `dispose`); a failed load (texture without `image`) is cleared from the loader cache at unmount and a loaded one is not.
- Old tests whose subject this Task removes, and only those lines:
  - `tests/releaseSharedTextures.test.ts` is deleted: both cases test the release functions removed here; their purpose (an unmounted renderer is not kept reachable) is now the ownership cases above, recorded in Technical Evidence as the replacement.
  - `tests/glowAndHooksDom.test.ts`: the `releaseGlowTexture` import (~19) and the call in `afterEach` (~41) are removed; the case "shares one soft picture between halos until it is released, then makes a new one" (~122–130) is removed (its claim is now false by design; the ownership case replaces it). No other line of the file changes.
  - `tests/bodyViewDom.test.ts`: the `releaseGlowTexture` import (~37) and the call in `afterEach` (~65) are removed. No other line changes.
- `rg 'release(Glow|Dot)Texture|releaseAnchorSprite|useReleaseSharedTextures' packages docs` finds nothing outside history files; the result is recorded.
- Engine size from `npm run check:pack` is recorded before and after; expected change about zero (three release functions and a hook go, a clone and per-call creation come in), allowance +150 B (cap 1,838,000 B raw; 1,826,428 B at C-211, about 11.5 KB headroom before O-092).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/dotMaterial.ts` (whole, 41 lines)
- `packages/astraeus/src/app/bodyDraw.ts` (`softGlowTexture`, `releaseGlowTexture`, `createGlow`, ~196–255)
- `packages/astraeus/src/app/TrackedBodyView.ts` (`anchorSpriteTexture`, `releaseAnchorSprite` ~49–83; the anchors material ~119–131)
- `packages/astraeus/src/app/BodySetView.ts` (the dot material ~86, `dispose` ~266–272)
- `packages/astraeus/src/app/useBodyTexture.ts` (whole, 30 lines)
- `packages/astraeus/src/app/sceneContentsHooks.ts` (`useReleaseSharedTextures` ~215–229, imports ~11, ~26–27)
- `packages/astraeus/src/app/AstraeusScene.tsx` (imports ~1–10; the `SceneContents` hook calls ~251–290)
- `packages/astraeus/tests/glowAndHooksDom.test.ts` (setup ~29–42; the halo cases ~83–130)
- `packages/astraeus/tests/bodyViewDom.test.ts` (setup ~1–66)
- `packages/astraeus/tests/releaseSharedTextures.test.ts` (whole)

## Design References

`.savepoint/Design.md` under `Good guest` (item 2, pictures per viewer).

## Guardrails

API-03, TEST-01, TEST-02, TEST-03, STYLE-02, STYLE-05, STYLE-07, STYLE-10.

## Implementation Plan

1. Re-read the files at Task start (O-087 and O-089 have landed; the anchors here were refreshed after them on 2026-11-22 and the release functions, hook and call were unchanged by either).
2. Write the ownership tests first and see them fail on today's code (record which).
3. Make each picture per material: dot, anchor, glow (texture plus cloned sprite geometry). Check that `sprite.geometry.clone()` keeps the interleaved position and uv attributes three's sprite needs (a glow case in the test draws nothing, so assert the clone's attribute names and counts match the original's).
4. Clone body pictures per use with `needsUpdate`; clear failed URLs from the loader cache at unmount.
5. Remove the release functions, the hook and its call; make the three named test-file edits; delete `releaseSharedTextures.test.ts`.
6. Focused tests, size, gates.

## Boundaries

No view gains or changes a `dispose` here except `BodySetView`'s map line (draft 03 owns view disposal). No change to `SkyView` or `RingView` pictures (each already owns its own). No loading-manager change (draft 04). No change to a picture's pixels, size, filtering or colour space. Existing tests change only in the lines listed above.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/ownedPictures.test.ts packages/astraeus/tests/bodyTextureOwnedDom.test.ts packages/astraeus/tests/glowAndHooksDom.test.ts packages/astraeus/tests/bodyViewDom.test.ts packages/astraeus/tests/bodyMarkers.test.ts packages/astraeus/tests/patchedShaders.test.ts`. Plus `npm run typecheck`, eslint (`node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js <changed files>`) and `npx prettier --check <changed files>` (builder rule 7; no repo-wide `npm test` or `npm run lint`). Size: `npm run check:pack` (engine limit), before and after. No browser run (draft 01's step, added to the Full Check's browser run by its policy row, covers the real two-viewer page).

## Technical Evidence

Pending execution.

## Drift Notes

Design `Good guest` gains a line that no GPU picture is shared between viewers (reconciled by draft 07).
