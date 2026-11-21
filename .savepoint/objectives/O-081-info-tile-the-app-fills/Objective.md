---
id: O-081
title: Story components off the shelf, readout tile and chart
status: planned
depends_on: [O-080]
release: G-023
priority: medium
rank: 3
---

# O-081: Story components off the shelf, readout tile and chart

## Outcome

Two more shelf components following the same contract: a readout tile (a live label and value with an optional scale line, updated by the app; desktop under the bar at the left, phone a one-line strip above the timeline that expands on tap) and a simple chart (for example counts by orbit size, with a highlighted range the app sets). The decision note may move components between O-080 and O-081.

## Why

G-023 owner decision 3: a status that is a live number is a readout tile, otherwise it sits in About. Closest Calls' floating readout and Belt's Kirkwood chart are the worked examples.

## Success Conditions

Detailed 2026-11-21 from the shelf contract in `docs/architecture/viewer-interface.md` sections 2, 5, 7 and 11 (the design source; not restated here) and the decisions below.

- **Chart.** `chart` is a block factory exported from `astraeus` in its own `src/shelf/chart/` module: `bins [{from, to, count, color?}]`, an axis label, optional labelled `marks [{at, label}]` and an optional `highlight {from, to}` that dims bars outside it; `ChartControl` `setBins`, `setHighlight`, silent; it hears nothing; drawn as SVG from the shared look; an accessible summary of the bars.
- **Readout tile.** `readoutTile` is a factory exported from `astraeus` in its own `src/shelf/readoutTile/` module and added with `scene.addParts` beside panels (the part union widens): `label`, `value`, an optional `scale {min, max, at, stretch?: "linear" | "log", marks? [{at, label}]}` drawn as a line with a dot at `at`, and up to a few small `facts [{label, value}]`; `ReadoutTileControl` `setValue` (and setters for scale position and facts as the section 7 grammar allows), silent; it hears nothing.
- **Tile place.** The `tile` area of section 2: wide, at the top of `left`, always shown, with a `left` occupant below it; phone, a one-line strip (label and value) above the timeline whose tap opens the full tile as the `sheet` detail occupant through the panel rule (closes another detail sheet; Escape closes it). No placement code in the part.
- **One tile per view.** A tile id listed in some `ViewInput.panels` shows only in those views; two tiles that would show in the same view are refused when the scene is built (`bad-part`, naming both). A view switch shows that view's tile.
- **One contract.** Both parts follow O-080's shelf contract: `bad-part` at the factory, `duplicate-id`, `not-mounted`, both embedding paths in one lifecycle suite, two viewers (API-03), synthetic proof (ARCH-03), shared look with the drift check over `src/shelf`, and `check:shelf-split` extended so importing one part never carries the other's marker.
- **Catalogue and docs.** Both parts have plain-words entries and live examples on `packages/astraeus-site/components.html` (the completeness test passes), their types on `api/shelf.html`, README, CHANGELOG (0.9.5 section), doc comments with `@shelf`, `npm run api:errors`, `npm run api:lock`; the site browser driver and journey cover the new entries at 375x667 and 1280x720.
- **Sizes.** The engine pack (9.5 MB) and the API pages are measured after the parts land; any red goes to the owner with measured options before the Full Objective Check.
- **Owner look.** The owner judges the catalogue entries (tile and chart running) on localhost:5490 at phone and desktop sizes before the Full Objective Check.

## Architectural Considerations

Same shelf contract, bar and panel rules and shared look as O-080; the tile is one more area in O-079's panel rule.

## Boundaries

**In scope:**
- The readout tile and the chart, their entries on the public catalogue page, README, CHANGELOG, API lock, tests, a synthetic proof.

**Out of scope:**
- Further components (added later as real stories need them); outside apps; version bump and publishing.

## Decisions

- Owner 2026-11-21: tile content "Number, line, marks, facts (Recommended)": label and big value, an optional straight or stretched line with labelled marks and a dot at the value, and a few small facts, so a Closest Calls-style readout needs no custom panel.
- Owner 2026-11-21: "One tile per view (Recommended)": at most one tile shows in a view; different views may each have one; two in one view is refused at build.
- Owner 2026-11-21: plan reviewed as https://claude.ai/artifact/MXp1kG9mLh5SwMZNCEidga, "Confirmed, set them up (Recommended)": four sequential Tasks (chart; readout tile and its place; catalogue and docs; measure, reconcile Design and owner look). They share the shelf contract, entry exports and split check, so they run one after another.

