---
id: O-066
title: Click sky figures and tell sky stories
status: done
depends_on: [O-065]
release: G-018
priority: high
---

# O-066: Click sky figures and tell sky stories

## Outcome

A sky figure (and optionally its region) is selectable like a body: tap, object menu, `onSelect`, `setSelected`, and a card with `description`, `facts`, `sources` and provenance. Story panels and events can name a sky figure so that opening one turns the view to it, selects it and traces it (each optional), with or without a timeline, built on the existing story layer.

## Why

G-018: "overlay with a story" (owner).

## Success Conditions

Made-up figures and stories only in engine code and tests (ARCH-01, ARCH-03); everything on both embedding paths (API-02); public surface changes update the API lock, README and CHANGELOG (API-01, API-07).

- **Clickable sky figures** (owner decision 2). A tap on a sky figure's label, or within a finger-sized margin of one of its lines, selects it; a tap inside a boundary outline does not; a hidden (`whenTraced`, not traced) figure is not tappable. `setSelected`, `selected` and `onSelect` take sky figure ids as they take body ids; the object menu lists figures under the same listing rule bodies follow. The selected figure's lines and label are emphasised (one look, API-06).
- **Sky figure cards.** `SkyFigureInput` gains the card fields bodies have (`description`, `facts`, `sources`, and a provenance), checked at the call, shown in the same info card (no second card, STYLE-07).
- **Story steps** (owner decision 1). A story panel may omit its moment; such panels are steps, in the order added, shown with Back and Next on the panel (phone first: no collisions at 375x667 and 1280x720), with or without a timeline. Panels with a moment behave as today. The host can open a panel (or close it), read the open one and hear changes, on both paths. Reads (`scene.panels`) show steps.
- **What a step does when it opens** (owner decision 3; each optional): a `camera` target (any target `setCamera` accepts; a look-out `direction` may name a sky figure, meaning its label point), `select` (select the panel's `object`), and `trace` (trace the panel's sky figure with trace options). Leaving a step clears the trace it started (with the default fade). Existing panels are unchanged unless they ask.
- **Events name sky figures.** An event's `object` may be a sky figure: Go to seeks to its time, selects it, and turns toward it when the camera is looking out (no camera change otherwise).
- Design reconciled before the Full Objective Check; `npm run check:browser` once at the Full Check; a made-up three-step sky story on the site for the owner's look on `localhost:5490`.

## Decisions (owner, 2026-11-10, session o066-planning-20261110)

- **Stepping without a timeline:** "Next/Back on the panel" — panels without a moment are ordered steps with Back and Next; the host can also open a panel and hear which is open.
- **What a tap selects:** "Name and lines" — not the area inside an outline.
- **Turning from any view:** "Step names a camera view" — a step may carry any `setCamera` target; a look-out direction may name a sky figure.
- Planner defaults in the confirmed design: leaving a step clears its trace with the default fade; selecting and turning happen only when a step asks; figures follow the bodies' object-menu listing rule.

## Architectural Considerations

Selection is presentation only (ARCH-02) and reuses the one selection path (`viewerSelection`, `scenePicking`, `SceneLabelLayer.shownRects` for name taps); line hit-testing is a pure function with a node test. Cards reuse `InfoPanel` / `infoModel`. Story steps extend `api/story.ts` (`StoryPanelAt` becomes optional), `core/storyPanels.ts` and `shell/useStoryPanels.ts` / `StoryPanelView.tsx`; host panel calls join the ordered host calls (O-061). Step actions reuse `setCamera`'s checks (`viewerCamera.ts`, `core/startView.ts`), `traceSkyFigure`/`clearSkyTrace` (O-065) and `setSelected`. No constellation or body name in `src/api/` (ARCH-06).

## Boundaries

**In scope:** selecting sky figures, their cards, story steps with Back/Next and host panel calls, step actions (camera, select, trace), events naming sky figures, a made-up site story.
**Out of scope:** a separate story system; constellation data and the Orion example (O-067); selecting by tapping inside an outline; timed traces.
