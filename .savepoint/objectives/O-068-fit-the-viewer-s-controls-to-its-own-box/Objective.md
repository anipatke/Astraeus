---
id: O-068
title: Fit the viewer's controls to its own box
status: planned
depends_on: [O-061]
release: G-017
priority: high
---

# O-068: Fit the viewer's controls to its own box

## Outcome

A viewer smaller than the window (in a box, or two side by side) picks its phone or desktop layout from its own size and sizes its panels, bars and menus against its own box, so its controls fit and never collide; a viewer that fills the window looks exactly as today.

## Why

Owner, 2026-11-10, on the T-288 preview: in the 480x320 box "the controls dont fit"; the full page is fine; "add I-139 to 0.8.1". I-139 (deferred from O-055) records the cause: panel sizes use window units (`vw`, `dvh`) and the phone layout reads `window.matchMedia`. Placed before O-062 so the timeline zoom is built on box-sized layout.

## Success Conditions

I-139's Proof Needed: a viewer in a box smaller than the window (phone-sized inside a desktop window, and two side by side at 1280x720) picks its layout from its own size and sizes its panels against its own box (for example container queries or `cqw`/`cqh` units with the viewer's root as the container); a DOM or layout test proves the layout choice per viewer; the owner confirms no panel collisions on `localhost:5490` at 375x667 and 1280x720 with one and two viewers. A full-window viewer is unchanged (existing layout tests pass unchanged). Detailed when planned.

## Boundaries

**In scope:** the viewer's stylesheets and phone-layout choice; a dev preview page with boxed and side-by-side viewers.
**Out of scope:** new controls; timeline zoom (O-062); breaking changes (0.8.1 adds only).
