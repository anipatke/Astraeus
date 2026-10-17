---
id: T-074
title: Show all five demos on the home page
objective: O-017
status: in_progress
stage: audit
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

## Context Log

Lane `o017-t074` (worktree /home/user/code/astraeus-t074, from d586a57). Router untouched. Extra reads, each for the card text facts: `data/showers/geminids.json` (parent 3200 Phaethon, peak, no story panels), `src/experiences/earth-moon/earthMoonExplorer.ts` (window, rates), `src/experiences/jupiter-io/jupiterIo.ts` (Io description, window), `README.md` and `docs/ASTRAEUS_SPIKE_04.md` (51,115 Geminid orbits), `tools/validate/capture-site-pictures.mjs` (how the existing card pictures were made: ffmpeg -q:v, 1200 to 1440 wide).

## Evidence

1. Cards: `index.html` has five `a.demo` cards in order Apollo 11, Perseids, Geminids (`app.html?experience=shower-geminids`), Earth and Moon (`?experience=earth-moon`), Jupiter and Io (`?experience=jupiter-io`), same markup; the fifth spans the row (`.demo:last-child:nth-child(odd)`). Lite check: no horizontal scroll at 1440x900 and 390x844.
2. Pictures: captured from the app with the capture tool's method (paused, pinned time, developer UI hidden). Geminids from the tool's own `geminids` view; Earth (view earth,30,30,4, 2025-01-10T12:00Z, Africa lit) and Jupiter (view jupiter,200,10,100, 2000-01-05T00:00Z) from scratch runs of the tool with other views, since its own views showed Earth in night or very small. 1440x900 PNG to 1200x750 JPEG, ffmpeg -q:v 6 (better than the Perseids card's q9): geminids-gmn.jpg 73,671 B, earth-moon.jpg 43,979 B, jupiter-io.jpg 37,261 B (Apollo 88,521, Perseids 86,182). Sources: `docs/evidence/o017-t074-card-sources-20261017/` (PNGs untracked) and `o017-t074-cards-20261017T023043Z/`.
3. Text: only what each experience's data supports (51,115 GMN orbits, Phaethon, published peak; catalogue-only Earth and Moon with NASA maps; Io about 42 h, approximate orbit stated in Io's info). Geminids has no story panels, so none is claimed.
4. Share text: og:description names all five. No other share text exists in index.html.
5. Budget: index 567,702 B raw / 503,261 B gzip measured; limits 600,000 / 530,000 (+5%, up to 10 kB); whole build 21,427,066 / 14,148,373, limits 22,500,000 / 14,860,000. README table and `load-budget.mjs` updated; `load-budget.mjs` and `public-build-assets.mjs` pass on the public build.
6. Gates: `npx tsc --noEmit` ok; `npm run build` ok; public build + validator ok. `npx vitest run`: 902 pass, 1 fail, `tests/pointsLookAheadShowers.test.ts` (Geminids look-ahead, "expected 12 to be undefined"), which fails identically on the unmodified base d586a57 (T-073 test, not this Task). New `tests/homePage.test.ts` (3 tests: five addresses in order, pictures exist, share text) passes. Lite (`docs/evidence/o017-t074-lite-20261017T023639Z`): 26/26 loads, with a new assertion that the index page links the five addresses and its card pictures load. Pictures: `docs/evidence/o017-t074-after-20261017T023820Z` vs `o017-before-20261016T205125Z` (before PNGs read from the main checkout): 16 app views, 0 errors, largest difference 0.024% of pixels over delta 16 (diff-vs-before.json). Site pages differ in height: index 3003 to 3771 px by design; assets.html 7630 to 7224 px from earlier O-017 Tasks (not touched here).
7. Owner validation pending: `docs/evidence/o017-t074-after-20261017T023820Z/site-index-desktop.png` and `site-index-phone.png` (untracked PNGs, in the lane worktree).

## Drift Notes

None for Design. Browser scripts other than lite were not run (lite plus pictures suffice per O-017 Decision 8).
