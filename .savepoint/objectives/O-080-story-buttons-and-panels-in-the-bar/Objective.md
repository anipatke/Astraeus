---
id: O-080
title: Story components off the shelf, first set
status: planned
depends_on: [O-079]
release: G-023
priority: high
rank: 2
---

# O-080: Story components off the shelf, first set

## Outcome

The first story components on the shelf, each its own import from `astraeus`, that an app picks and fills with its own words and numbers, plus the custom panel for anything not on the shelf. A component can put a button in the bar (label, optional short label, optional views it belongs to) and open its panel through O-079's bar and panel rules, styled from the shared look; on a phone the bar keeps as many story buttons as fit, in the story's order, and the rest go into the drawer under "This story". Expected first set (the decision note confirms it): filter chips (pick one or several, the app hears the choice), an explainer panel (text sections and optional actions such as moving the camera), a colour key (swatches, labels, counts) and the custom panel.

A public catalogue page on the site (beside the assets page) lists every shelf component: what it is, suggested uses (with the story jobs it serves: switch, filter, readout, explainer), a live example on a synthetic scene, and the import and add lines. This Objective creates the page with the first set; a test fails when a shelf component has no catalogue entry (owner, 2026-11-21: "lets catalogue them too for clarity and suggested uses on the public page").

## Why

G-023: Belt's Kirkwood gaps and "How empty is it?", and Meteor Showers' picker panel, are each built by the app today. With the shelf, a story picks components and passes data (owner, 2026-11-21: "pick story specific components off the shelf and add based on the story").

## Success Conditions

Named outcomes only; detailed when O-079 is done, from the shelf contract in O-079's decision note `docs/architecture/viewer-interface.md`.

## Architectural Considerations

Every component follows the one shelf contract; buttons are items in the bar rule and panels use the panel rule (no placement code per component); view scoping reuses the existing view rule (Design "Views of one scene"); the engine signals, the host decides (Design "Public API shape"); unused components stay out of an app's download.

## Boundaries

**In scope:**
- The first shelf components and the custom panel, the public catalogue page and its completeness test, README, CHANGELOG, API lock, tests, a synthetic proof, the site's demos where they fit.

**Out of scope:**
- The readout tile and later components (O-081); outside apps (Belt adopts the shelf in its own project); version bump and publishing.
