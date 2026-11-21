---
id: G-023
title: One bar for story apps, for 0.9.5
status: planned
---

## Outcome

A story app needs no bars of its own around the viewer. The viewer's one bar carries the app's title (opening an About panel with what is drawn, sources, credits, links and an engine-added "Built with Astraeus" mark with the version), the story's switch (picker or views as tabs), and the story's own features picked off a shelf of ready-made story components (filters, readout tile, explainers and more) that the app fills with its words and numbers, or a custom panel the app fills itself; the engine places them all. The basic interface works out of the box with no setup. On phones the bar is one row: the engine keeps as many story buttons as fit, in the story's order, shrinks the title to an "i" when the row is tight, and moves the rest into the controls drawer.

## Why

Owner, 2026-11-21 (session plan-g023-20261121): story apps such as meteors.anipatke.com and belt.anipatke.com each add a blue bar above the viewer and a credits strip below it, so a phone shows four bands (app bar, engine pill, engine timeline, app footer). The owner explored layouts on a design board (https://claude.ai/artifact/8ETT4wvvUHZxKYRW5X7jsk) and chose a single bar with view tabs. Story features fall into four jobs (switch, filter, info tile, explainer), each with one engine slot. Owner chose 0.9.5.

Owner decisions, 2026-11-21: (1) single bar plus tabs; (2) credits, sources and "Built with Astraeus" all move into About; (3) a status that is a live number is an info tile, otherwise it sits in About, the story's choice; (4) the phone row keeps as many story buttons as fit in the story's order, the rest go into the menu; (5) the floating, no-bars layout is dropped for now; (6) the phone title shrinks to an "i" when the row is tight; (7) tabs and story buttons may give an optional short label for phones; (8) a story button tied to one view is hidden in other views, the same rule as panels; (9) engine first, then Belt through a local build; (10) "Doesnt need to be backwards compatible, existing apps stay, we will test and finalise on belt and apps going forward will use it": the new bar is the viewer's only layout, no opt-in; (11) the engine always adds "Built with Astraeus" and its version to About; (12) "Foundations first", then "Whole interface reset": the viewer's whole interface is rebuilt on one layout of screen areas, one look, one bar rule and one panel rule before story features are added (O-079); (13) "clean re-usable modular packaged code thats easy for anyone to pick up", then "Ready-made viewer + shared look": the complete viewer works with no setup, its look settings are public so hosts restyle it and match their own panels, and the interface parts stay internal but modular and documented; (14) "anyone should be able to pick up the package and have the basic components of the UI work out the box and then be able to pick story specific components off the shelf and add based on the story", then "Shelf + custom space": the engine ships ready-made story components (for example filter chips, a readout tile, an explainer panel, a colour key, a simple chart) that an app picks and fills with its own words and numbers, plus a custom panel the app fills for anything not on the shelf; (15) "Inside the engine, pick by import": the shelf lives in the `astraeus` package, each component its own import so an app downloads only what it uses; (16) "lets catalogue them too for clarity and suggested uses on the public page": a public catalogue page on the site lists every shelf component (what it is, suggested uses, a live example, how to add it) and what the basic interface gives out of the box, kept complete by a test.

## Success Conditions

Every member Objective is done.

## Boundaries

**In scope:** the `astraeus` engine package (scene inputs, handle, shell bar, phone row, panels, tile), the site's demos showing the new bar, the public component catalogue page, README, CHANGELOG, API lock and tests.

**Out of scope:** changes to the Belt, Meteor Showers or any other outside app (they stay on their pinned versions; Belt adopts the bar as its own work in its own project after the story-buttons Objective, through a local engine build); the floating layout; the version bump and publishing (the owner's release steps).
