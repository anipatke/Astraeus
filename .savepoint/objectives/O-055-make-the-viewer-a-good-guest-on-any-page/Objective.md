---
id: O-055
title: Make the viewer a good guest on any page
status: planned
depends_on: [O-054]
release: G-016
priority: high
---

# O-055: Make the viewer a good guest on any page

## Outcome

Several viewers work on one page and a viewer rebuilt with a new scene loads what it needs (no missing moons); the viewer no longer styles the host page's `html`, `body` or `#app`, scopes every style under its root class and uses no fixed ids; the Developer drawer is hidden unless a host asks (API-03; review F1, F3; owner D8, D9).

## Why

G-016 chunk 3. The review proved moon data loads once per page (F1), and `style.css` restyles the host page while generic classes and fixed ids clash with a host or a second viewer (F3).

## Success Conditions

1. **Two viewers on one page behave as if alone.** One table-driven test file (`packages/astraeus/tests/twoViewers.test.ts`) puts two viewers in one document over every pairing (`mount` + `mount`, `AstraeusScene` + `AstraeusScene`, `mount` + `AstraeusScene`) and proves, per pairing: each handle reads and sets only its own viewer (time, rate, view, playing, camera, selection); unmounting one leaves the other working; no element id appears twice in the document; each case below that later steps add. This is the O-055 two-viewer test O-053 named.
2. **Moon data loads for every scene (F1).** A second load of a planet's moons (a later window, another moon, a rebuild with a new scene, a remount, or a load that starts while another is in flight) fetches and decodes the chunks it needs that are not yet held; nothing a scene needs is skipped because an earlier scene loaded first. A table-driven load-twice test covers each of those entry paths, plus the history look-back and the year-after-window chunks and an out-of-span second load.
3. **Pictures come from the viewer's own data packages.** A viewer draws a data package's pictures (body textures, the Venus large variant, the Milky Way) only when that package was passed to it; there is no page-wide picture book, so two viewers with different packages draw their own looks whatever order they load in.
4. **The Developer drawer is hidden unless a host asks (D8).** New `developerTools?: boolean` on `MountOptions` and `AstraeusSceneProps` (default false, read when the viewer is built, like `address`): off, there is no Developer toggle, no drawer and its code is not fetched; on, the drawer is as today. The demo site passes it on, so the site is unchanged.
5. **No fixed ids.** Every element id the viewer writes is made per viewer (`useId`), and `aria-*` references follow; tests and the browser driver find parts by role, label or class within the viewer, not by fixed id. The 36 `id` entries of `apiIsolation.allowlist.json` are removed in the changes that fix them.
6. **The viewer keeps its hands off the rest of the page.** The engine looks up no element of the page by id: the site's loading cover is handed to the viewer by the site (an outside host has none); Escape pressed inside a viewer reaches only that viewer, pressed with focus on the page body reaches each viewer as it does today, and pressed in a host's own control reaches none; the marker layer measures only its own viewer's panels.
7. **No styles outside the viewer (F3).** No rule names `:root`, `html`, `body` or `#app`; the custom properties and base font sit on `.astraeus-shell`; every selector in `src/app/style.css` and `src/shell/*.css` starts with the root class, so the 389 `selector` entries are removed and `apiIsolation.allowlist.json` has no breaks left. The site's pages and both examples set their own page styles. The look of the site is unchanged at 375x667 and 1280x720, panels do not collide, and the owner confirms it on `localhost:5490`.
8. **Surface and notes recorded honestly.** `api-surface.lock.json` regenerated for `developerTools`; README API rows, a "Several viewers on one page" section and the sizing note match; CHANGELOG Unreleased opens with one O-055 migration paragraph (page styles removed, drawer hidden by default, generated ids, pictures only from passed packages); Design.md reconciled. The full gate, `check:pack`, `check:node-consumer`, `check:react-consumer`, `check:engine-alone` and one `check:browser` pass at the Full Objective Check.

## Architectural Considerations

Page-wide module state (moon chunks, pictures, planet series) becomes per-load or per-viewer without changing State (ARCH-02).

Planned decisions (planner recommendations, confirmed by the owner on 2026-11-02, "All recommendations; #7 later"; actor: owner, relayed by the coordinator):

- **Moon chunks stay one shared, append-only store per planet, loaded per request.** The decoded fits are the same data for every viewer, so a shared store is a cache, not shared state; what changes is that every load fetches what its own request needs (per-chunk in-flight dedupe), so no load is ever skipped. The planet series and the star file stay page-wide: each loads whole, so no viewer can miss any of it.
- **Pictures travel with the viewer.** A body look names its picture (`withPicture(name, ...)` keeps the name instead of a global getter); the definition a viewer draws carries the pictures of the data packages passed to it, and the draw code resolves names there. The site and the demos' definitions hand their pictures in the same way; the global `registerPictures` book is removed.
- **Root-class prefix, not zero-specificity scoping.** Selectors are written `.astraeus-shell .x` (as the O-053 scan expects), so a host's generic rules (`button {}`) cannot beat the viewer's; every rule that gains specificity is checked against the already-scoped rules it now ties or beats.
- **The loading cover belongs to the site.** The engine hides a cover element it is given (an internal `App` prop) instead of finding `#boot`; `showBootLoader`'s clone-and-prepend moves to the site. `?loadfade=` and its Developer setting stay as they are.
- **`place: "developer"` switches** are simply not shown when `developerTools` is off (documented in the README); no new error.
- **Out of this Objective:** panel sizes still follow the browser window (`vw`/`dvh`, phone layout by window width), not the viewer's own box; a small viewer beside another on a wide page keeps the desktop layout. The owner deferred it to a later Objective (2026-11-02); recorded as I-139.

## Boundaries

**In scope:** F1, F3, D8, D9.

**Out of scope:** renames (O-057); settings API (O-056); panel sizes and the phone layout following the viewer's own box instead of the browser window (I-139, owner 2026-11-02: later).
