---
id: O-022
title: Tap or click an object in the scene to focus on it
status: planned
depends_on: [O-020]
release: G-005
---

# O-022: Tap or click an object in the scene to focus on it

## Outcome

Tapping (phone) or clicking (laptop) a planet, moon, spacecraft or comet in the scene, or its label, focuses the camera on it, the same as choosing it in the top bar's object picker.

## Why

Owner, 2026-10-18: "at the moment you can only focus on objects through the top panel, we should make them touch/clickable which brings the focus on them".

## Success Conditions

1. A tap or click on a body or its label selects it and runs the same focus as the top-bar picker; the picker shows the new selection.
2. A drag to turn or zoom the view never selects anything; a tap is told apart from a drag on both touch and mouse.
3. Small or distant objects stay easy to hit (labels are targets; a tolerance around tiny bodies).
4. Generic engine and shell behaviour from the experience's listed objects, no experience names (ARCH-01); works in every demo, at every scale.
5. Browser checks through the shared driver (T-083) prove tap-to-focus, drag-not-select, and label taps, desktop and phone; full run passes; owner look.

## Open Questions (to settle when this Objective is planned)

- Does a tap only focus, or also open the object's information sheet?
- What can be tapped in the showers (the comet, Earth, the planets; not single meteor dots)?
- Hover feedback on laptops (cursor, highlight)?

## Architectural Considerations

Picking belongs to the presentation layer (ARCH-02) and reuses the existing camera focus presets; it never changes state or positions. It must respect the floating origin and both scales.

## Boundaries

**In scope:** tap and click to focus bodies and labels; tap-versus-drag; hit tolerance; checks.

**Out of scope:** multi-select, tapping single meteor or catalogue points, and tapping story markers (already covered by O-015).
