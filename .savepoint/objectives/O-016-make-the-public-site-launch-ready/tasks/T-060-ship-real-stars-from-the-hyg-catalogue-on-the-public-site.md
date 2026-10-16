---
id: T-060
title: Ship real stars from the HYG catalogue on the public site
objective: O-016
status: planned
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o016-plan-20261016}
---

# Ship real stars from the HYG catalogue on the public site

## Outcome

The public build draws the naked-eye stars from HYG v4.2 (CC BY-SA 4.0), credited, so visitors see real stars. Local builds keep Yale available as an option.

## User Check

Open the public build and compare the sky with the local Yale sky: the same bright stars and constellations in the same places, with similar brightness. The assets page credits HYG.

## Done When

1. A fetch tool downloads HYG v4.2 from its official home (astronexus / Codeberg), checks the licence text, and writes a trimmed naked-eye file (magnitude limit matching today's Yale set) with source, version, URL, access date and licence recorded.
2. A star asset with an AssetLicence record (PROV-02). The public-build validator accepts it, and still rejects Yale in the public build.
3. Position and magnitude check against Yale for shared stars (by HR or HIP id), J2000, within stated tolerances. Test names recorded.
4. The assets page, README credits and DONOR_PROVENANCE are updated. CC BY-SA applies to the star file only; the code stays MIT, and this is said plainly.
5. The sky browser script passes in both builds, with screenshots in a fresh evidence directory.

## Context Files

`src/app/skyModel.ts`, `src/app/SkyView.ts`, `src/assets/sky.ts`, `tests/sky.test.ts`, `tests/publicBuild.test.ts`, `tests/textureLicence.test.ts`, `tools/validate/browser-sky.mjs`, `assets.html`, `README.md`, `docs/DONOR_PROVENANCE.md`.

## Design References

Sky and assets; public build.

## Guardrails

PROV-02, ARCH-04, TEST-01..03, STYLE-06.

## Implementation Plan

1. Find how Yale stars load and how the public build swaps assets.
2. Write the HYG fetch-and-trim tool, then the asset and licence record.
3. Add the comparison tests and the public-build switch.
4. Update the credits, then run the browser scripts.

## Boundaries

No changes to the Milky Way picture. Don't commit data/local. No engine changes.

## Technical Verification

Gates plus browser-sky in both builds. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
