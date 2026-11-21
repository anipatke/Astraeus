# Astraeus 0.9.5

## astraeus 0.9.5 (2026-11-21)

One bar for story apps. The viewer's interface is rebuilt so a story app needs no bars of its own around the viewer: one bar carries the app's title (opening an About panel), the story's switch, and story parts the app picks off a shelf and fills with its own words and numbers. The basic viewer still works with no setup. The nine packages move together to 0.9.5; the `astraeus-data*` packages keep peering on `astraeus` `>=0.9.0 <0.10.0`.

**The interface is not backwards compatible** (owner decision): apps built on 0.9.4 keep working on 0.9.4 and move when they are ready. The scene, data and State calls are unchanged.

First download of the packed example (`npm run measure:example`): 1,828,138 bytes raw, 522,471 bytes gzip (code and styles loaded on first open), against 1,777,827 raw and 511,436 gzip at 0.9.4 (+50,311 raw, +11,035 gzip).

### What changed for app makers

- **One bar.** The desktop bar and the phone row are drawn from one item list and one fit rule: labels shorten (optional `shortLabel` on picker options and views), the title shrinks to its short form and then an "i", and what does not fit moves into the menu (a ⋯ drop-down on a wide bar). The phone's name pill is gone; `.controls-pill` is replaced by `.bar-menu-button`. (O-079)
- **Title and About.** `scene.setAbout({ title, shortTitle?, status?, credits?, links? })`, `scene.about`, `handle.about`, `handle.setAbout`. The title opens an About panel that always ends with "Built with Astraeus" and the engine version. New error code `bad-about`. (O-079)
- **One look, one panel rule.** `LookInput.interface` restyles the whole interface (colours, font, text size, radius, motion) through `--astraeus-*` custom properties a host can reuse. The layout follows the viewer's own size, not the window's. One rule decides which panel holds which place and what opening one closes; Escape closes only the topmost thing. (O-079)
- **Story parts off the shelf.** `scene.addParts(parts)` and `handle.part(part)` with typed controls, new error code `bad-part`. Parts, each its own import so an app downloads only what it uses: `panel` (a story button in the bar and a panel), `customBlock` (an element the host fills), `explainer`, `actions`, `filterChips`, `colourKey` (O-080), and `chart` (bars with marks and a highlighted range) and `readoutTile` (a live number with an optional line, marks and facts, at the top left on desktop and a strip above the timeline on a phone) (O-081). A part listed in a view's `panels` shows only in that view.
- **Parts catalogue.** The site's new Parts page (`components.html`) shows every shelf part in plain words with a live example, and the parts' types have their own API page (`api/shelf.html`).
- **Smaller package.** The published JavaScript carries no comments (the `.d.ts` files keep them), about 300 KB less unpacked.

Full details: `packages/astraeus/CHANGELOG.md`.

## astraeus-data 0.9.5

No changes to the pictures, data or code. Released with `astraeus` 0.9.5 to keep the version numbers together.
