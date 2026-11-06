---
id: O-059
title: Build the planets demo and site on the front door
status: in_progress
depends_on: [O-056]
release: G-016
priority: high
---

# O-059: Build the planets demo and site on the front door

## Outcome

The planets demo and the site use only the public API (`import … from "astraeus"` and `astraeus/style.css`): every capability they reached through the internal `ExperienceDefinition` (sky, body sets, desktop textures, scene centre, label, developer sections, the demo switcher and data alternates) is either a public, general feature or moved out of the engine into the site; the per-package deep-import counts from O-053 reach zero for every demo and the site; the internal definition stops being a second way in (review F13; owner D6 brought into 0.8.0; I-131).

## Why

Owner, 2026-11-01: "Yes, in 0.8.0" and "lets do this right, no hurry on the app". 0.8.0 promises one front door (API-01); our richest demo and our own site are the proof that a new app can build what we build. Ordered after O-056 (looks become public settings, which several of these capabilities need) and before O-057 so new public features are named right before the renaming pass.

## Success Conditions

- **Front door, source and tests.** `DEEP_IMPORT_COUNTS` in `packageBoundaries.test.ts` is 0 for `astraeus-demo-planets` and `astraeus-site`, counting `src`, `tests` and `tools`. A test that checks engine internals on purpose moves into `packages/astraeus/tests/` and passes `check:engine-alone`. Apollo and Showers keep their zero source count; their test counts may only fall.
- **Moons are public.** Any app can draw many small moons as dots, show a moon family panel and show tagged surface places through public, general features, proven on a made-up system as well as on the demo (ARCH-03).
- **The picker is public.** Any app can offer its own choice in the top bar and phone drawer; the viewer reports the choice and the host decides what happens. The site's planet and shower pickers use it.
- **Every other private ability has a home.** Each internal ability the demo and site use (scene centre, desktop pictures, info card facts, items left out of the menu, page heading, loading cover, in-page address changes) is public and general or moved into the site, as recorded in the public forms note. `alternates` and `developerSections`, which nothing sets, are deleted.
- **Test scenes are public.** The nine made-up scenes on the local preview are built with `Scene`; one that only exercises internals is dropped or moved to an engine test, and its browser checks still prove the engine is not tied to our demos.
- **The site mounts like any host.** The site no longer draws `App` or builds an `ExperienceDefinition`; `App` stays internal.
- **Same look.** One `npm run check:browser` passes, and the owner approves the demos and site on `localhost:5490` at 375x667 and 1280x720.

## Owner Decisions (2026-11-06)

- Zero covers the planets demo and site in source and tests; Apollo and Showers tests are not included (owner chose "Shipped code and tests, planets and site").
- Picker: a public setting in the viewer's top bar and phone drawer, not a control the site draws outside the viewer. The site's look stays.
- Moon dots, the moon family panel and tagged surface places all become public.
- The nine made-up test scenes are rebuilt on the public way.
- Follow keeps today's look: `camera.setFollowChoices` stays (O3, owner "Keep today's look").
- Surface place lists publish in `astraeus-data`, about 840 KB, with a NOTICE line (O1, owner "Publish in astraeus-data").
- Engine unpacked limit rises to 9.8 MB from T-267 and returns to 9.5 MB at T-270 (owner "Raise briefly, restore at step 6").
- API reference page gzip limit rises from 30,000 to 40,000 B (owner "Raise to 40 KB").
- API reference page raw limit rises from 150,000 to 200,000 B (owner "Raise to 200 KB", 2026-11-07).
- `astraeus-data` file-count limit rises from 40 to 130 for the place lists (owner "Raise the limit to 130").

## Architectural Considerations

New public features follow the Guardrails Public API rules from the start (one word one unit, settings with defaults, signals not behaviour). Story and demo data stay in the demo packages (ARCH-01; owner's "story data, not engine"). `App` stays internal; the site mounts like any host. `ExperienceDefinition` stays as the private seam between `Scene` and `App`; it stops being something a demo or site can hand in. The planets demo keeps Jupiter-only public builds (Vite globs, O-039) and its per-planet chunk loading. New public text adds to the API reference page, which has a 150,000 B raw limit (I-142); the final step measures it.

## Boundaries

**In scope:** `packages/astraeus-demo-planets/`, `packages/astraeus-site/`, the public features they need, the deep-import allowlists.

**Out of scope:** renames of existing names (O-057); removing `toDefinition` (O-057), though the site stops using it here; new demos; deep imports in Apollo and Showers tests and tools; visible changes to any demo.
