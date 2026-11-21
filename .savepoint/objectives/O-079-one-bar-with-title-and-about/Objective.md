---
id: O-079
title: Reset the viewer interface, with About first
status: in_progress
depends_on: []
release: G-023
priority: high
rank: 1
---

# O-079: Reset the viewer interface, with About first

## Outcome

The viewer's whole interface (everything drawn over the 3D scene: bar, panels and cards, story panels, moons sheet, drawers, timeline, developer drawer, loading and error states it owns) is rebuilt on shared foundations, the old interface code and stylesheets are removed, and About is the first new feature built on them.

The foundations:

- **One screen layout.** Named screen areas for desktop and phone (bar, places under the bar, the phone sheet above the timeline, the timeline, drawers) defined once; every part of the interface sits in an area, not at its own hand-set position. One description of what changes on a phone, replacing today's 16 scattered screen-size rules.
- **One look.** One set of design settings (colours, spacing, text sizes, corner radius, motion) under the viewer's root class, replacing the 58 hand-typed colours in 7 stylesheets; a test fails on a colour or size typed outside that set, so the look cannot drift again. The design board's chosen layout (https://claude.ai/artifact/8ETT4wvvUHZxKYRW5X7jsk) is the reference look.
- **One bar layout rule.** Everything in the bar is an item in one ordered list (title, switch, engine controls, and in O-080 story buttons), each with a kind, a priority and a full and optional short label. One pure decision picks, for the measured width, which items sit on the row and which go into the menu, and when the title becomes "i". On a phone the object-name pill is gone: one row shows the title place, the switch as tabs and a menu whose drawer holds what the rule puts there.
- **One panel placement rule.** One owner decides which panel holds which area and what opening one closes; every panel, card, sheet and drawer goes through it, replacing today's scattered close rules. O-080's host panels and O-081's tile will use it.
- **One interface for the whole Goal.** The public inputs and handle members for About (here), story buttons and host-filled panels (O-080) and the tile (O-081) are designed together before building.

About, built only on those: `scene.setAbout({ title, shortTitle?, status?, credits?, links? })`, `handle.about` and `handle.setAbout(about)` (run-time replace, for example the status once data has loaded). The title is the bar's title item and opens an About panel (desktop under the title; phone the sheet above the timeline) with the status, credits and links and, always added by the engine, "Built with Astraeus" with the engine's version. Picker options and views take an optional `shortLabel` for the phone row.

## Why

G-023: story apps add their own bars because the viewer has no place for a title, credits or status. The interface code grew one feature at a time (about 5,000 lines, 7 stylesheets, 58 hand-typed colours against 8 shared ones, 16 screen-size rules, a main component with about 50 inputs), so adding the Goal's features to it would deepen the tangle. Backwards compatibility is off (owner), so this is the cheapest moment to reset it.

## Success Conditions

- A decision note (`docs/architecture/viewer-interface.md`) settles, with evidence from today's code: the screen areas on desktop and phone; the look settings and the drift check; the bar items and fit rule (worked at 360, 390, 430, 768, 1280 px); the panel areas and close-rule table (with an inventory of every rule it replaces); a keep-or-rebuild verdict for every interface part with any deliberate behaviour change listed; the public interface for O-079, O-080 and O-081 (names, inputs, handle members, errors, React parity, how a host fills panel and tile content); embedded viewers; and the test and browser-driver migration. The owner confirms its plain-language summary before building starts.
- Every part of the interface renders in a named area, styled only from the look settings; the drift check passes; the old stylesheets and placement code are gone (each removal named in evidence).
- The desktop bar and phone row render only from the bar rule; every panel, card, sheet and drawer is placed only by the panel rule; both rules are pure, unit-tested decisions.
- Existing behaviour is kept except the changes the note lists; existing scenario tests pass or are migrated as the note lists, each change named.
- About: `title` a non-empty string; `shortTitle` optional non-empty string; `status` optional string; `credits` optional list of `{ text, url? }`; `links` optional list of `{ text, url }`; `url` an http(s) URL; bad shape → new code `bad-about` naming the field; `setAbout` replaces the whole About; `scene.about` reads it. `handle.about` / `handle.setAbout` on both embedding paths, in host call order, `not-mounted` outside the lifecycle. The panel ends with "Built with Astraeus" linking to https://astraeus.anipatke.com/ and the version read from the engine's `package.json` at build. With no About the title place shows the selected object's name. Shapes may be refined by the note; the note's version is what is built.
- `PickerOptionInput.shortLabel` and `ViewInput.shortLabel` optional non-empty strings, checked under `bad-picker` and `bad-view`.
- **Clean, modular, easy to pick up** (owner): the interface code is organised as small modules with one job each (areas, look, bar rule, panel rule, and one module per part), each with a short header saying what it does and what it must not do; a contributor guide section in the note (and a pointer from the README) explains the structure, how to add a bar item or panel, and the drift check. Out of the box: `mount` with no options gives the complete interface.
- **Shared look** (owner): the look settings are public, with defaults: a host restyles the viewer through them, and the content a host puts in its own panels and tile (O-080, O-081) can use the same settings (for example as documented CSS custom properties under the viewer's root class) so it matches. The basic interface parts stay internal; story components are the public, pick-by-import shelf (O-080, O-081).
- **Shelf designed here, built later** (owner): the decision note defines the story-component shelf: the first components and which Objective builds each, one contract every shelf component follows (how an app adds it, gives its data, hears its events, where it sits through the bar and panel rules, its look from the shared look), the custom panel for anything not on the shelf, and pick-by-import packaging (each component its own import from `astraeus`, unused ones not in an app's download, checked by a size or bundle test). About is built here as a basic part, not a shelf component.
- Two viewers on a page stay independent (API-03); the engine never looks up page elements (Design "Good guest").
- Synthetic proof (ARCH-03) in contract tests; the site's demos set an About from their existing titles and credits, and the owner judges every demo on localhost:5490 at 375×667 and 1280×720 with no overlaps.
- README, CHANGELOG under a proposed 0.9.5 (the interface reset and the pill's removal: no backwards compatibility, owner decision), doc comments, `npm run api:errors`, `npm run api:lock`; no version bump; configured gates plus `check:engine-alone` and `check:pack` pass; browser checks migrated.

## Architectural Considerations

- Public API rules (Design "Public API shape", Guardrails API-01..07); API-06: any look made public is a setting with a default, and the address mapping test holds.
- ARCH-01 and ARCH-02: no app names in interface code; the interface reads State and never changes it.
- Design "Good guest": ids via `useId`, every style under `.astraeus-shell`, keys scoped to the viewer, no page lookups, no `document.title`.
- CODE-02: per-frame work stays in `src/app/sceneFrame.ts` stages; the reset is presentation only.
- The 3D drawing (`src/app/`, Three.js layers, labels, markers) is not part of the reset except where markers and labels measure interface areas (for example the marker layer measuring panels).

## Decisions

- Owner 2026-11-21: new Goal G-023 for 0.9.5, three Objectives in order (this one, story buttons and panels, info tile).
- Owner 2026-11-21: no backwards compatibility ("existing apps stay, we will test and finalise on belt and apps going forward will use it").
- Owner 2026-11-21: "Engine adds it, always (Recommended)": About always ends with "Built with Astraeus" and the engine version.
- Owner 2026-11-21: "Foundations first (Recommended)": one bar rule, one panel rule, the Goal's interface designed together, About as the first user.
- Owner 2026-11-21: "if we need to rip and reset the UI now is the time", then "Whole interface reset (Recommended)": layout areas, one look, the timeline, cards and drawers rebuilt too; old stylesheets removed. Supersedes the bar-and-panels-only plan.
- Owner 2026-11-21: "I want clean re-usable modular packaged code thats easy for anyone to pick up and re-use as an out the box interface", then "Ready-made viewer + shared look (Recommended)": the complete viewer works with no setup; the look settings are public so hosts restyle it and match their own panels; the interface parts stay internal but cleanly modular and documented, offered later only when a real app needs one (Design D1).
- Owner 2026-11-21: "anyone should be able to pick up the package and have the basic components of the UI work out the box and then be able to pick story specific components off the shelf and add based on the story"; "Shelf + custom space (Recommended)"; "Inside the engine, pick by import (Recommended)". This Objective builds the basic interface and designs the shelf contract; O-080 and O-081 build shelf components.
- Owner 2026-11-21, on T-328's note `docs/architecture/viewer-interface.md` (reviewed as artifacts: summary page, catalogue, desktop and phone prototypes): "Title shrinks first", "Light up straight away" (filter chips), "Viewer's own size" (layout from the viewer's size, not the window's), then "confirmed, start building". Build order: T-330, T-329, T-326, T-331, T-325, T-327. The note is the design source for the build Tasks and for O-080 and O-081.
- Owner 2026-11-21, after T-330 put the engine pack at 9.51 MB unpacked (limit 9.5 MB, `tools/check-packs.mjs`; tokenised CSS 71,532 → 88,901 bytes): "Wait for cleanup". The limit stays; the two `packagePacks.test.ts` pack-size failures are a known red until later Tasks remove old interface code; it must be green before the Full Objective Check, or the choice comes back to the owner. Owner 2026-11-21 (after T-329, engine at 9.53 MB): "Let's assess the limit post cleanup" — the coordinator brings the measured size and options to the owner once the cleanup Task T-332 is done, before the Full Objective Check.
- Owner 2026-11-21: "Do we have a clean up task", then "Add the cleanup task (Recommended)": T-332 (after T-325, before T-327) removes unused styles, tokens and dead code, merges leftover stylesheets, adds an unused-class test, and measures the pack before and after for the owner's size-limit decision.
- Owner 2026-11-21, after T-325 put the API reference page at 46,408 B gzip (cap 46,000, `tools/validate/load-budget.mjs`, `apiReference.test.ts`): "Review with the package size". The cap stays; that failure is a known red reviewed together with the pack size after T-332.
- Owner 2026-11-21: "Follow the viewer (Recommended)": the phone drawer, sheet and menu height limits follow the viewer's own height, not the window's (done in T-332; one pinned assertion's expected values change).
- Owner 2026-11-21, after T-332's measurements (engine unpacked 9,576,647 B, 76,647 B over 9.5 MB; API page 46,408 B gzip, 408 B over 46,000), reviewed on https://claude.ai/artifact/A6v8x3YBNuy7hKxMVrDjNZ: (1) "Load styles from one place (Recommended)": every stylesheet is imported from the viewer's entry files, removing the build's duplicate `.node.js` copies (about -104 KB); limit stays 9.5 MB. (2) "Stop listing entries twice (Recommended)": the API reference draws `MountedScene` as `ViewerHandle` plus its own members; cap stays 46,000. (3) "Approve, do it together (Recommended)": the seven tests that read the old stylesheets by path are updated so the sheets move into the §9 layout. Done in T-332 before T-327.
- Owner 2026-11-21 (design board): status sentence in About when it is not a live number; credits and the built-with mark in About; title shrinks to "i" when the phone row is tight; optional short labels.

## Boundaries

**In scope:**
- The decision note; `packages/astraeus/src/shell/` and the interface parts of `src/app/` (stylesheets, panels, timeline, drawers, loading and error states the viewer owns); `src/api/` for About and short labels; tests, the site's demos and browser checks, README, CHANGELOG, API lock.

**Out of scope:**
- Story buttons, host-filled panels (O-080); the info tile (O-081); the 3D drawing itself; the site's own page chrome outside the viewer; outside apps (Belt, Meteor Showers); the floating layout; version bump and publishing.
