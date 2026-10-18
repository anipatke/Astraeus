---
id: O-031
title: Lighter app code and gentler drawing
status: planned
depends_on: []
release: G-007
---

# O-031: Lighter app code and gentler drawing

## Outcome

Each demo loads only its own code, the scene stops redrawing when nothing moves, and very high-resolution phones draw at a sharpness capped by a setting.

## Why

Owner, 2026-10-18, accepted the optimisation list ("Yea") with items 4-6 for the clean-up goal: the app bundle (about 1.3 MB) carries every demo's code; the scene redraws about 60 times a second even when paused and untouched; phones with a pixel ratio of 3 draw nine times the pixels of ratio 1.

## Success Conditions

1. **Per-demo code:** each experience's code loads only on its page (dynamic import per experience); each page's script total measured before and after, load budget lowered.
2. **Draw on demand:** when playback is paused and the camera, settings and animations are idle, the renderer stops; any change, input, playing clock or running animation draws again at once; no visible difference (picture check) and measured lower GPU use when idle.
3. **Pixel-ratio cap:** a live setting caps the drawing pixel ratio (default 2) on high-density screens; the owner judges sharpness on a phone before the default is accepted (the owner does not trade quality for size, 2026-10-17).
4. Full run passes; owner look on a phone.

## Boundaries

Code loading, render loop and pixel ratio only; no asset quality changes.
