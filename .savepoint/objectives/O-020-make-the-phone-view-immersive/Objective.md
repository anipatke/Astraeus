---
id: O-020
title: Make the phone view immersive and slim the larger-screen layout
status: planned
depends_on: [O-017]
release: G-005
---

# O-020: Make the phone view immersive and slim the larger-screen layout

## Outcome

On a phone, the scene fills the screen. The top bar and the bottom timeline panel slide away into drawers and come back with a tap or a swipe, controls sit in sliders and bottom sheets instead of permanent panels, and nothing a viewer needs is lost. On larger screens the same parts get slimmer and simpler: a thinner timeline, one consolidated top bar instead of several panels, and fewer controls in view at once. The first public release waits for this Objective.

## Why

Owner, 2026-10-17: "our UI should be mobile friendly using drawers and sliders to hide the timeline bottom panel and top panels to provide an immersive experience", before launch, since most first visits from a shared link are on phones.

## Success Conditions

1. **Immersive by default on phones.** At phone sizes (today's `max-width: 700px` breakpoint in `src/shell/style.css`, portrait and landscape) the top bar and the timeline panel can be hidden so the scene uses the full screen; a small, always-reachable handle or button brings each back.
2. **Drawers.** The top bar (experience, object, scale and view controls) collapses into a drawer; the timeline bottom panel slides down to a slim strip (play or pause, the time, and a handle) and back up to the full timeline with a swipe or tap. State survives switching between the two (time, playback, selection).
3. **Sliders and sheets.** Settings that are panels on desktop (scale, labels, sky and look settings, the Developer panel) become sliders or bottom sheets on phones; information and story panels keep the existing bottom-sheet pattern with swipe to dismiss.
4. **Gestures don't fight the scene.** Drawer swipes and globe or camera drags never trigger each other; a tap on the empty scene can toggle immersive mode if that tests well (decided at planning).
5. **Phone basics.** Safe-area insets (notches and home bars) respected; touch targets at least 44 px; no horizontal scroll; works with reduced motion; text readable at phone sizes.
6. **Every experience.** Apollo 11, Earth–Moon, Jupiter–Io, Perseids, Geminids and the moons and systems from O-018 and O-019 work in the new layout; the shell stays generic (no experience names, ARCH-01).
7. **Slimmer larger-screen layout.** At desktop and tablet sizes the timeline panel is visibly thinner (its height and the controls shown by default are measured before and after), the panels along the top are consolidated into one bar or a single drawer, and rarely used controls move behind it; nothing a viewer needs is lost. The before/after pictures from O-017 show only these intended changes.
8. **Checks.** Configured gates, the lite browser check at phone sizes in portrait and landscape, a browser check that hides and restores each drawer and that a drag on the scene does not open a drawer, zero console errors, and the owner's look on a real phone.

## Architectural Considerations

- Layout and gestures are presentation in the shell; scientific State and the clock never depend on them (ARCH-02).
- Reuse the existing bottom-sheet and swipe-to-dismiss parts already ported from Planetary Explorer (STYLE-07); Planetary Explorer's mobile patterns may be reused (owner's own work, confirmed 2026-10-17).
- Look-and-feel numbers (drawer heights, animation times, auto-hide delay) are settings with live controls, not hard-coded tweaks.

## Owner Decisions — 2026-10-17

1. **Immersive phone layout with drawers and sliders** hiding the timeline bottom panel and the top panels.
2. **Before the first public release.**
3. **Clean up the larger-screen layout too** (owner, 2026-10-17): "we should also clean up some of the larger view port UIs, i.e. slim down the timeline view, consolidate the panels at the top and simplify." Planned in this Objective rather than a separate one, because the top bar and timeline are the same shell components on every screen size.
4. **Owner's simplification ideas** (owner, 2026-10-17), to be planned as the starting design and shown to the owner before building:
   - **Top bar:** drop the word "Object" (the picked body's name is enough); Info becomes an info symbol (ⓘ); Focus becomes a magnifying glass; the overview button becomes a generic expand or zoom-out icon. It already is generic in the engine (camera request `overview`, frames the scene centre, `src/app/CameraController.tsx`); only its label is per experience (for example "Earth–Moon overview"), so the label moves to the tooltip and accessible name. Scale becomes a toggle (two choices: True and Readable). The showers offer a third, Solar system (`src/shell/scaleModel.ts`), so planning decides between a toggle that cycles and a small menu. Developer mode becomes a cog (settings) icon.
   - **Timeline:** symbols for Play and Pause, Previous and Next.
   - **Layout:** the timeline fits on a single line on larger screens, and collapses into a simplified two lines on phones.
   - **Info and story panels:** the Sources list becomes a collapsible section, closed by default (owner, 2026-10-17: "on the info / story tile, make the sources a collapsible section"). Today it is always open in the info panel (`src/shell/ProvenanceBadge.tsx`) and the story panels (`src/shell/StoryPanelView.tsx`). Browser scripts that read the sources text (`browser-showers.mjs`, `browser-public-showers.mjs` and others) open the section first or read it while closed, with each scenario mapped (TEST-03). The credits stay complete and reachable in one tap (PROV-01).
   - Every icon keeps a text tooltip and an accessible name (screen readers and the browser checks find buttons by name), and touch targets stay at least 44 px on phones.

5. **The portfolio embeds the app** (owner, 2026-10-17, screenshot of the portfolio's Astraeus section, `main-portfolio/components/astraeus/AstraeusBridge.tsx`): the portfolio shows its own story buttons (Apollo 11, The Perseids, The Geminids, Earth & Moon, Jupiter & Io) and a Full Screen button above an iframe of `https://astraeus.anipatke.com/app.html?experience=...`. Consequences:
   - **Stable addresses.** `app.html`, `?experience=shower-perseids`, `shower-geminids`, `earth-moon` and `jupiter-io` are a public contract: they keep opening the same experience through this and later Objectives (O-018, O-019); a browser check asserts each.
   - **Embedded look.** When the app sits inside another page (detected, or an address flag decided at planning), its own top bar is as slim as possible so the two bars do not stack heavily; full screen keeps the full layout.
   - **Developer mode stays public** as the cog icon (owner: "Keep it, its a demo so i want people to know the ins and outs").
## Boundaries

**In scope:**
- Phone and small-tablet layout of the shell, drawers, sliders, sheets, gestures, safe areas, checks.

- Slimming the timeline and consolidating the top panels on larger screens (Owner Decision 3).

**Out of scope:**
- New features or content; a new visual style; phone frame-rate work; native app packaging.
