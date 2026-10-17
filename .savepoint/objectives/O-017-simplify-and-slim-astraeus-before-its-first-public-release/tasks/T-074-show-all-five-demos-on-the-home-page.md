---
id: T-074
title: Show all five demos on the home page
objective: O-017
status: planned
depends_on: [{task: T-070, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Show all five demos on the home page

## Outcome

The Astraeus home page (`index.html`) offers every real experience, not just two: Apollo 11, the Perseids, the Geminids, Earth and Moon, and Jupiter and Io, each with a picture, a short description and a link that opens it. The page's share text names them too.

## User Check

Open the home page on desktop and phone: five demo cards, each opening its experience; the pictures look like the app; nothing else on the page changed.

## Done When

1. Owner, 2026-10-17: "Im just cognisant on our home page we only link two demos, when there are 5". `index.html` gains cards for the Geminids (`app.html?experience=shower-geminids`), Earth and Moon (`?experience=earth-moon`) and Jupiter and Io (`?experience=jupiter-io`), in the same pattern as the existing Apollo 11 and Perseids cards (`index.html` around lines 261-276), on desktop and phone without horizontal scroll.
2. Each new card's picture is a capture of the real experience (from `tools/validate/capture-experience-pictures.mjs`), resized and compressed for the card like the existing `site/` pictures, at a quality the owner accepts (O-017 Decision 7: no visible quality trade).
3. Card text is plain and true to each experience's own data and story panels (no claim the experience does not support); the made-up experiences are not listed.
4. The `og:description` and any other share text name all five, or say "five demos" with the list.
5. The index page's load budget in `tools/validate/load-budget.mjs` and the README table are raised on purpose with the new measurement (T-070 rule), and the validator passes.
6. Gates: typecheck, tests, both builds, validator with budget, lite browser check, before/after pictures of the site pages (the index page differs by design; every app view within tolerance); a test or browser assertion that the home page links all five experience addresses (the same addresses the owner's portfolio embeds, O-020 Decision 5).
7. Owner validation: the owner looks at the home page.

## Context Files

`index.html`, `site/` (card pictures), `tools/validate/load-budget.mjs`, `README.md`, `tools/validate/capture-experience-pictures.mjs`, `tools/validate/browser-lite.mjs`.

## Design References

Design.md "Public site and launch".

## Guardrails

ARCH-01 (experience names in site content, not engine or shell), PROV-01, PROV-02 (pictures are captures of our own renders of credited assets), TEST-01.

## Implementation Plan

1. Capture the three experiences; make card pictures like the existing ones.
2. Add the cards and share text.
3. Re-measure and raise the index budget; add the link assertion; pictures.

## Boundaries

No redesign of the home page; no new experiences; the app itself unchanged.

## Technical Verification

Configured gates, lite check and pictures (O-017 Decision 8 until the trimmed run exists). Evaluated under `agent-skills/references/check-method.md`.
