---
id: O-080
title: Story components off the shelf, first set
status: done
last_check: C-194
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

Detailed 2026-11-21 from the shelf contract in `docs/architecture/viewer-interface.md` sections 7 and 11 (the design source; not restated here).

- **One shelf contract.** `scene.addParts` appends parts; `handle.part(descriptor)` gives a typed control per viewer on both embedding paths (`mount` and `AstraeusScene`, one lifecycle suite); `bad-part` (factory shape, unknown part, part not in this viewer's scene) and `duplicate-id` across parts and blocks; `not-mounted` outside the lifecycle; setters are silent and `on*` hears visitor actions only.
- **First set.** `panel`, `explainer`, `actions`, `filterChips`, `colourKey` and `customBlock`, each a factory exported from `astraeus` in its own `src/shelf/<part>/` module, with the data, controls and events of section 11. A custom panel is a `panel` whose only block is a `customBlock`; its element lives from `ready` to `unmount`, hidden while the panel is closed.
- **Bar and panels.** A panel's button is a `story` item in the bar rule (full and short label, story order, phone row keeps as many as fit and the rest go to the menu under "This story"); its panel is the `left` occupant on desktop and the detail sheet on a phone through the panel rule; a part id listed in some view's `panels` shows only in those views, and a view switch closes a shelf panel the view does not show. No placement code per part.
- **Shared look.** Parts take every colour and size from the shared look; the drift check covers `src/shelf`.
- **Pick by import.** `tools/check-shelf-split.mjs` builds an example importing only `filterChips` and fails if another part's marker class is in the emitted JS or CSS (CSS fallback recorded in the Task if needed).
- **Catalogue.** `packages/astraeus-site/components.html`, linked beside Assets, lists each part (what it is from its doc comment, suggested uses by story job, a live example on a synthetic scene shown as its own source, the import and add lines) and an out-of-the-box section; `shelfCatalogue.test.ts` fails on a `@shelf` export with no entry or an entry with no export.
- **Proof and docs.** Synthetic proof (ARCH-03), two-viewer test (API-03), README, CHANGELOG (0.9.5 section), doc comments, `npm run api:errors`, `npm run api:lock`; the site browser driver and a journey cover the catalogue page at 375x667 and 1280x720.
- **Sizes.** The engine pack (9.5 MB) and API reference page (46,000 B gzip) are measured after the parts land; any red goes to the owner with measured options before the Full Objective Check.
- **Owner look.** The owner judges the catalogue page on localhost:5490 at phone and desktop sizes before the Full Objective Check.

## Architectural Considerations

Every component follows the one shelf contract; buttons are items in the bar rule and panels use the panel rule (no placement code per component); view scoping reuses the existing view rule (Design "Views of one scene"); the engine signals, the host decides (Design "Public API shape"); unused components stay out of an app's download.

## Boundaries

**In scope:**
- The first shelf components and the custom panel, the public catalogue page and its completeness test, README, CHANGELOG, API lock, tests, a synthetic proof, the site's demos where they fit.

**Out of scope:**
- The readout tile and later components (O-081); outside apps (Belt adopts the shelf in its own project); version bump and publishing.

## Decisions

- Owner 2026-11-21 (O-079, carried): chips "Light up straight away"; title shrinks to "i" before story buttons move to the menu; layout follows the viewer's own size.
- Owner 2026-11-21: size limits "Measure, then decide (Recommended)": the limits stay; if the shelf pushes the engine pack or API reference page over, the measured numbers and options go to the owner before the Full Objective Check.
- Owner 2026-11-21: plan reviewed as https://claude.ai/artifact/Bc8Fuknyja8ZgtFme1786d, "Confirmed, set them up (Recommended)": four sequential Tasks (groundwork and custom panel; the ready-made parts and split proof; the catalogue page; measure, reconcile Design and owner look). The site's existing demos are not changed; the catalogue examples are the proof (improvements only).
- Owner 2026-11-21, on T-336's measurements (engine unpacked 9,565,101 B, 65,101 B over 9.5 MB; API page 45,974 B gzip, 26 B under 46,000), reviewed on https://claude.ai/artifact/UD5tnCmNvkmvNNin6CuMSo: (1) "Remove shipped code comments (Recommended)": the build strips comments from the packed JS and keeps them in the `.d.ts`, with a pack-check rule; the 9.5 MB limit stays. (2) "Separate page for story components (Recommended)": the API reference puts the `@shelf` exports on their own page; the 46,000 B cap stays. Both done in T-336 before the Full Objective Check.
- Owner 2026-11-21, on the catalogue page preview: "I dont understand the http://localhost:5490/components.html page and its purpose", then "Plain words first, code tucked away (Recommended)": each part opens with a plain name, one plain sentence on what it is for, a when-to-use example and its live demo; the import/add lines, the doc-comment sentence and the whole example sit in a "For developers" fold; the intro says plainly who the page is for. Done in T-336 before the Full Objective Check.
- Owner 2026-11-21, after C-194 CLEAR and the merge: "80 is done, accept T-336 against C-194".
