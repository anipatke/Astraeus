---
id: T-064
title: Update the site pages to describe what landed tonight
objective: O-016
status: done
depends_on: [{task: T-063, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o016-plan-20261016}
---

# Update the site pages to describe what landed tonight

## Outcome

The front page, assets page and README describe the current product: story panels in the Apollo 11 and Perseids demos, real HYG stars on the public site, and credited NASA Earth and Moon maps. Every credit and figure on the pages matches the code and data as they stand.

## User Check

Read the front page, the assets page and the README on GitHub. Each feature mentioned exists in the live demo. Each asset's credit line names the right source and licence. No stand-in or out-of-date claim remains.

## Done When

1. Owner request, 2026-10-16: "can we ensure we also update our pages once this is all done". Front page: the story panels are mentioned where the demos are introduced, in plain, non-cheesy wording.
2. Assets page: rows and credits for HYG stars (CC BY-SA 4.0, star file only), the NASA Moon (SVS 4720) and Earth (Blue Marble NG, July 2004), and the Planetary Explorer panel parts. Any "planned" or "wish-list" item that is now done is removed. Every credit is checked against each asset's AssetLicence record by a script or test, not by eye alone.
3. README: features, credits and the licence note are updated to match.
4. The public build passes public-build-assets, and the pages render at 1440 and 390 widths in a fresh evidence directory.

## Context Files

`index.html`, `assets.html`, `README.md`, `docs/DONOR_PROVENANCE.md`, `tests/textureLicence.test.ts`.

## Design References

Public build.

## Guardrails

PROV-01, PROV-02, TEST-01.

## Implementation Plan

1. List every claim and credit on the three pages.
2. Compare them with the asset records and the landed features.
3. Edit the wording, then capture the pages.

## Boundaries

Wording and credits only. Pictures come from T-063. No app changes.

## Technical Verification

Build, public-build-assets, and page screenshots. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session: T-064 builder, 2026-10-17 (system clock showed 2026-10-16T16:11Z for the capture directory name).

Files read: the Task, index.html, assets.html, README.md, docs/DONOR_PROVENANCE.md, tests/textureLicence.test.ts. Extra reads (logged, to verify claims): src/assets/licence.ts, src/assets/sky.ts, src/assets/bodies/*.ts (licence records), data/stories/{apollo11,perseids}/panels.json, src/shell/useStoryPanels.ts, src/app/App.tsx and src/app/viewLink.ts (view link), src/assets/stars/hyg-v42-naked-eye.json header, site/apollo-moon.jpg, perseids-gmn.jpg, apollo-provenance.jpg, apollo-phone.jpg (viewed for alt text).
Files changed: index.html, assets.html, README.md, tests/assetsPageCredits.test.ts (new). Pictures, router, data/local untouched; nothing committed or staged.

Per criterion:
1. Front page: layer 04 text, both demo cards (7 and 3 story panels, with tag), Developer-mode sentence now mentions copying a view link. Counts verified from panels.json (7 Apollo, 3 Perseids; autoOpen true, 6 s hold). Alt text for the two demo pictures describes what the re-shot pictures show. Stale claim fixed: the shelf tile said "8,404 naked-eye stars placed to 0.0001 deg" (Yale count); now "8,920 naked-eye stars from the HYG catalogue". Footer credits the HYG stars (CC BY-SA 4.0).
2. Assets page: HYG, NASA Moon (SVS 4720), NASA Earth (Blue Marble NG, July 2004) rows and credits were already present and match the records; added a Story panels row (10 panels, badges, sources: Apollo 7 observed; Perseids 2 observed, 1 illustrative), extended the Planetary Explorer credit with the panel parts (rewritten, not copied, per DONOR_PROVENANCE T-059), "info panel" line now says info panel and story panel, dates moved to 17 October. Wish list checked: Milky Way sharpness and CAMS terms are still true, so kept. New test tests/assetsPageCredits.test.ts (10 tests) checks every shipped credit row (Milky Way, five Solar System Scope maps, Io, Earth, Moon, HYG) against its AssetLicence record: licence label, credit words (must be in both the record attribution and the row), a link that is a prefix of the record URL, the surface-picture card chips, that the HYG file header licence matches, that CC BY-SA covers the star file only, and that Yale and CAMS rows are marked local. Mutation check: changing a credit URL and a licence label on the page made 2 tests fail; reverted.
3. README: story panels section, panels in the intro, demo table, src/shell line, view-link sentence, Geminid orbits (51,115) on the GMN row, Planetary Explorer credit, Done list (HYG stars, panels, view links).
4. Public build passes public-build-assets (ok: true, matches: [], star asset ok). Screenshots in docs/evidence/o016-t064-20261016T161100Z/ (index and assets at 1440 and 390 from npx vite preview --port 5414, public build dist): documentElement scrollWidth equals clientWidth at both widths, no horizontal scroll, zero console errors. Preview stopped, ports 5414/5415 free.

Gates: npm run typecheck pass; npx vitest run 49 files, 906 passed, 1 skipped (before the test was switched to ?raw imports; the new file re-run alone after the change: 10 passed, typecheck pass again); npm run build pass; ASTRAEUS_PUBLIC_BUILD=1 npm run build pass; node tools/validate/public-build-assets.mjs ok. Browser validation scripts under tools/validate were not run: no scene, camera, control or UI code changed.

Limitations: the full vitest run was not repeated after the final test edit (only that file, plus typecheck). Page pictures were checked by eye for alt text only. The Perseids alt text says each dot's place along its orbit is filled in (illustrative), matching the panel badge. Faster first load and the timeline activity window are not mentioned: no page talked about them. Not verified in a live browser: that "Copy view link" works on the public build (covered by tools/validate/browser-view-link.mjs from earlier work, not re-run). The savepoint resume Next line currently points at the router's O-011/T-040 (router untouched by request).

## Drift Notes

None yet.

Owner closed this Task on 2026-10-20 (structured question in the agent session: "Close five, plan portfolio"), on its CLEAR Task Check. The O-016 Full Objective Check still covers it.
