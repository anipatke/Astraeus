---
id: O-020
title: Make the phone view immersive
status: planned
depends_on: [O-017]
release: G-005
---

# O-020: Make the phone view immersive

## Outcome

On a phone, the scene fills the screen. The top bar and the bottom timeline panel slide away into drawers and come back with a tap or a swipe, controls sit in sliders and bottom sheets instead of permanent panels, and nothing a viewer needs is lost. Desktop keeps its current layout unless a change there is needed for the same components. The first public release waits for this Objective.

## Why

Owner, 2026-10-17: "our UI should be mobile friendly using drawers and sliders to hide the timeline bottom panel and top panels to provide an immersive experience", before launch, since most first visits from a shared link are on phones.

## Success Conditions

1. **Immersive by default on phones.** At phone sizes (today's `max-width: 700px` breakpoint in `src/shell/style.css`, portrait and landscape) the top bar and the timeline panel can be hidden so the scene uses the full screen; a small, always-reachable handle or button brings each back.
2. **Drawers.** The top bar (experience, object, scale and view controls) collapses into a drawer; the timeline bottom panel slides down to a slim strip (play or pause, the time, and a handle) and back up to the full timeline with a swipe or tap. State survives switching between the two (time, playback, selection).
3. **Sliders and sheets.** Settings that are panels on desktop (scale, labels, sky and look settings, the Developer panel) become sliders or bottom sheets on phones; information and story panels keep the existing bottom-sheet pattern with swipe to dismiss.
4. **Gestures don't fight the scene.** Drawer swipes and globe or camera drags never trigger each other; a tap on the empty scene can toggle immersive mode if that tests well (decided at planning).
5. **Phone basics.** Safe-area insets (notches and home bars) respected; touch targets at least 44 px; no horizontal scroll; works with reduced motion; text readable at phone sizes.
6. **Every experience.** Apollo 11, Earth–Moon, Jupiter–Io, Perseids, Geminids and the moons and systems from O-018 and O-019 work in the new layout; the shell stays generic (no experience names, ARCH-01).
7. **Desktop unchanged** unless stated; the before/after pictures from O-017 show no unintended desktop change.
8. **Checks.** Configured gates, the lite browser check at phone sizes in portrait and landscape, a browser check that hides and restores each drawer and that a drag on the scene does not open a drawer, zero console errors, and the owner's look on a real phone.

## Architectural Considerations

- Layout and gestures are presentation in the shell; scientific State and the clock never depend on them (ARCH-02).
- Reuse the existing bottom-sheet and swipe-to-dismiss parts already ported from Planetary Explorer (STYLE-07); Planetary Explorer's mobile patterns may be reused (owner's own work, confirmed 2026-10-17).
- Look-and-feel numbers (drawer heights, animation times, auto-hide delay) are settings with live controls, not hard-coded tweaks.

## Owner Decisions — 2026-10-17

1. **Immersive phone layout with drawers and sliders** hiding the timeline bottom panel and the top panels.
2. **Before the first public release.**

## Boundaries

**In scope:**
- Phone and small-tablet layout of the shell, drawers, sliders, sheets, gestures, safe areas, checks.

**Out of scope:**
- New features or content; a desktop redesign; phone frame-rate work; native app packaging.
