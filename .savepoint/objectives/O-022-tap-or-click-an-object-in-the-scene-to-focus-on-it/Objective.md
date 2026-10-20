---
id: O-022
title: Tap or click an object in the scene to focus on it
status: done
depends_on: [O-020]
release: G-005
---

# O-022: Tap or click an object in the scene to focus on it

## Outcome

Tapping (phone) or clicking (laptop) a planet, a moon or the Sun in the scene, or its label, focuses the camera on it, the same as choosing it in the top bar's object picker.

## Why

Owner, 2026-10-18: "at the moment you can only focus on objects through the top panel, we should make them touch/clickable which brings the focus on them".

## Success Conditions

1. A tap or click on a body or its label selects it and runs the same focus as the top-bar picker; the picker shows the new selection.
2. A drag to turn or zoom the view never selects anything; a tap is told apart from a drag on both touch and mouse.
3. Small or distant objects stay easy to hit (labels are targets; a tolerance around tiny bodies).
4. Generic engine and shell behaviour from the experience's listed objects, no experience names (ARCH-01); works in every demo, at every scale.
5. Browser checks through the shared driver (T-083) prove tap-to-focus, drag-not-select, and label taps, desktop and phone; full run passes; owner look.

## Confirmed Decisions (owner, 2026-10-18)

1. **Focus only** ("tap to focus only"): a tap or click focuses the camera; it does not open the information sheet.
2. **Planets, moons and the Sun only** ("lets make it planets moons sun only"): spacecraft (Columbia, Eagle), comets, asteroids, meteor streams and catalogue points are not tap targets.
3. **Hover highlight on laptops** (owner chose "both"): over a tappable body or its label the cursor becomes a pointing hand and the body's label brightens gently; the brightening amount is a live setting (owner rule). Phones have no hover.

## Confirmed Decisions (owner, 2026-10-20, planning)

4. **One tap flies for set members too** (owner chose "One tap flies"): Jupiter's body-set moons drop O-025's two-tap rule (first tap names, second flies); one tap or click focuses them like every other body. Laptop hover still names a dot first.
5. **Design and three-step split confirmed** ("Yes, plan it"): tap-to-focus, then hover hint, then browser checks with Design reconciliation, in one sequential lane.

## Planned Technical Decisions (planner, 2026-10-20)

- *What a tap does:* the same as the moon panel's `chooseMoon` without opening information: the shell activates `focusPresetFor(experience, object)` for an available object, which selects it in the picker. A scene tap reaches the shell through a controls callback (like `onStoryMarker`), never by writing `cameraRequest` directly, so the picker always shows the tapped object. Today's body-set path (`BodySetLabelLayer` writing `cameraRequest`) moves to the same callback.
- *What can be tapped:* objects whose id resolves to a catalogued body (`bodyIdFor`), which are natural bodies only (spacecraft are tracked subjects outside the catalogue), plus body-set members. No new field on `ExperienceObject`.
- *Hit test:* one pure, generic picking module over screen-space candidates: a body's projected disc plus a minimum tolerance (larger for touch), and its shown label's rectangle. Labels stay `pointer-events: none`; the canvas handler hit-tests label rectangles, so drags that start over a label still turn the view. Nearest wins; the existing story and feature marker taps keep priority.
- *Tap versus drag:* one rule shared with the orbit gestures: one pointer, movement under the slop, no second pointer during the press (a pinch is never a tap).
- *Readouts:* the scene exposes the hovered and last picked target as `data-*` readouts on the canvas for the browser driver; no screenshots.

## Architectural Considerations

Picking belongs to the presentation layer (ARCH-02) and reuses the existing camera focus presets; it never changes state or positions. It must respect the floating origin and both scales.

## Boundaries

**In scope:** tap and click to focus bodies and labels; tap-versus-drag; hit tolerance; checks.

**Out of scope:** opening the information sheet on tap; spacecraft, comets and asteroids as targets; multi-select, tapping single meteor or catalogue points, and tapping story markers (already covered by O-015).

Owner closed O-022 on 2026-10-20T08:35:09Z ("looked at it, all works, close it"), on C-088 CLEAR (Full Objective Check). Owner skipped browser-jupiter-io.mjs for this change; next: plan the browser-check slim-down (owner, 2026-10-20).
