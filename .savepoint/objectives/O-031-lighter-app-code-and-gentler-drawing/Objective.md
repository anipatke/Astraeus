---
id: O-031
title: Lighter app code and gentler drawing
status: planned
depends_on: []
release: G-007
lanes:
  - {key: idle, title: Stop drawing when idle}
  - {key: trim, title: Trim the shared download}
  - {key: close, title: Owner look and Design}
---

# O-031: Lighter app code and gentler drawing

## Outcome

The scene stops redrawing when nothing moves, so phones and laptops run cooler and use less battery, and the shared download every page fetches is smaller through cuts visitors cannot notice.

## Why

Owner, 2026-10-18, accepted the optimisation list ("Yea") with items 4-6 for the clean-up goal: the app bundle carries every demo's code; the scene redraws about 60 times a second even when paused and untouched; phones with a pixel ratio of 3 draw nine times the pixels of ratio 1.

Planning, 2026-10-23, found two of the three already met: each demo's code is its own chunk fetched only on its page (I-022; public build: `apollo11Definition` 117 kB gzip, the showers and planet chunks likewise), and React Three Fiber's default `dpr` of `[1, 2]` (the `<Canvas>` in `src/app/AstraeusScene.tsx` sets none) already caps drawing at pixel ratio 2. What every page downloads is the shared `app.js`, 1,366 kB raw / 404 kB gzip (public build, 2026-10-23). The scene still draws every frame (`LayeredRender` renders in `useFrame` under the default `frameloop: "always"`).

## Success Conditions

1. **Idle stops drawing.** With playback paused and the camera, panels, animations and settings idle, the scene stops drawing; any tap, drag, wheel, key, settings change, playing clock or running animation draws again at once.
2. **Proof.** Fast tests prove the "draw this frame?" rule case by case (CODE-02 stage, TEST-01); `npm run check:browser` confirms a paused, untouched page stops drawing (a scene readout of frames drawn) and draws again on a tap and on play.
3. **Shared download.** `app.js` is measured and only invisible cuts are made (for example the developer panel fetched when the cog is first opened); before and after sizes recorded, the load-budget limits lowered to the new size. Bigger ideas are listed for the owner, not built.
4. **Owner look.** The owner checks a phone and a desktop on the preview and says nothing freezes or looks stale. Configured gates pass; the Full Objective Check runs `npm run check:browser` once.

## Confirmed Decisions (owner, 2026-10-23)

1. **Scope**: "Idle redraw + trim shared code". Per-demo code is already done; the pixel-ratio slider is dropped (the cap is already 2).
2. **Trim limit**: "Only invisible cuts". Nothing visitors notice; larger ideas (a short wait the first time a panel opens, library swaps) are listed, not built.
3. **Proof**: "Tests + your look on a phone": fast tests for the rule, the one browser command for stop-and-resume, the owner's look for nothing frozen or stale.
4. **Plan** (owner, "Yes, write these steps"): three steps; idle redraw and trimming side by side, the owner look and Design notes last.

## Architectural Considerations

Drawing on demand fits React Three Fiber's `frameloop: "demand"` with `invalidate()`, or a skip inside `LayeredRender`; the step decides and records why. The "draw this frame?" rule is a named stage in `src/app/sceneFrame.ts` with node tests (CODE-02). Scientific State is unchanged (ARCH-02); a playing clock always draws. Anything that animates while paused (camera flights, fades, the boot loader, story markers) keeps drawing until it settles, so nothing visible changes. Trimming moves code into lazily loaded chunks only; no engine or experience behaviour changes.

## Boundaries

**In scope:**
- The render loop and the "draw this frame?" rule
- Lazily loading shared code no visitor needs on first paint
- The load-budget limits, the browser command's idle assertion, Design notes

**Out of scope:**
- Asset quality, textures, data formats (O-026)
- A pixel-ratio setting
- The Showers switch (O-030) and story loading (O-029)
- Anything visitors see changing
