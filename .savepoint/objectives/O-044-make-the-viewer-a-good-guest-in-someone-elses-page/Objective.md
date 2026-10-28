---
id: O-044
title: Make the viewer a good guest in someone else's page
status: planned
depends_on: []
release: G-012
---

# O-044: Make the viewer a good guest in someone else's page

## Outcome

A page that embeds the viewer through `mount` or `AstraeusScene` keeps its own tab title and its own Escape key, its overlays sit above the viewer without guessing its layers, and its Node test runner can import `astraeus` without special settings. A scene with no time set opens on today, and on a phone an open story panel no longer stops zooming. The behaviour the showers site could learn only from the source is written in the README and API reference, and each release states its first-download size.

## Why

G-012: the first outside site (showers, on 0.2.0) found these by hitting them. Findings E6, E9, E10, G5, G8 and the documentation parts of R1, R2, R6, R10, E7, E8, E10, E11 and G7 in `/home/user/code/showers/docs/astraeus-handoff.md`. Confirmed against source at `820186e8` on 2026-10-26: `App.tsx` sets `document.title` (line 177); `StoryPanelView.tsx`, `useDrawers.ts` and `DisplaySwitches.tsx` each listen for `keydown` on the document; six `src/` files import JSON without import attributes; `windowOf` in `api/scene.ts` makes a month around now and the clock starts at its beginning, 15 days ago.

## Success Conditions

Settled with the owner, 2026-10-26 (planning session g012-planning-20261026):

- **Title (owner: "Never change it when embedded").** Through `mount` and `AstraeusScene` the viewer never writes `document.title`. The repository site, which renders `App` directly, keeps today's titles.
- **Escape.** The viewer's document `keydown` handlers leave an event alone when `defaultPrevented` is set, so a host that handles Escape first keeps it; with no host handler, Escape behaves as today. The mount element forms its own stacking context, so the viewer's `z-index` values cannot rise above the host page.
- **Node tests.** A consumer test in Vitest's Node environment imports `astraeus` and builds `Scene.toDefinition()` with no `server.deps.inline` setting, proven against the packed package.
- **Default time (owner: "Open on today").** A scene with no `setTime` and nothing that sets its own span opens at the current time, with the month window kept around it.
- **Phone panel.** On a phone, wheel or pinch input over an open story-panel sheet still zooms the scene; the owner judges the feel on the `localhost:5490` preview.
- **Documentation.** README and doc comments cover each item listed in the documentation Task; the CHANGELOG `Unreleased` section lists every behaviour change; `docs/RELEASING.md` has a step to record the first-download size in the release notes.

## Architectural Considerations

Changes go through the public layer (`packages/astraeus/src/api/`) or the viewer it renders; no new public export is needed for this Objective. ARCH-01 to ARCH-05 apply; TEST-02 applies to each fix (a regression test or an explicit failing scenario). The repository site imports `App` directly (`packages/astraeus-site/src/main.tsx`), so a title option belongs on `App` with the embedding routes switching it off. Browser checks follow the project's browser policy: none per step; one `npm run check:browser` at the Full Objective Check.

## Boundaries

**In scope:**
- The host-page fixes, Node loading, default time and phone-panel wheel listed above, with tests
- README, doc comments (API reference), CHANGELOG and RELEASING updates; Design reconciliation

**Out of scope:**
- New public exports or calls (O-045)
- The three.js `Clock` warning; the Showers demo; swapping scenes inside one viewer
- Changing what the public site shows
