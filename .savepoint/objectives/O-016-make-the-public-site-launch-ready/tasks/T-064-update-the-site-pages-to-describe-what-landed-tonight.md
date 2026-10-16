---
id: T-064
title: Update the site pages to describe what landed tonight
objective: O-016
status: planned
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

Pending execution.

## Drift Notes

None yet.
