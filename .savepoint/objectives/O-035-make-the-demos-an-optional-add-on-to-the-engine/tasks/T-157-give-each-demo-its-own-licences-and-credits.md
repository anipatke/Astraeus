---
id: T-157
title: Give each demo its own licences and credits
objective: O-035
status: done
depends_on: [{task: T-156, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o035-planning-20261023}
check_waiver:
    task: T-157
    reason: 'owner chose no per-step checks, one Full Objective Check at the end of O-035; quote: "Same as O-030 (Recommended)"'
    actor:
        role: owner
        session: owner-run-rules
    recorded_at: "2026-10-23T04:25:20Z"
---

# Give each demo its own licences and credits

## Outcome

Each demo package carries the licences and credits for its own data (Apollo reconstruction sources, GMN CC BY 4.0, story pictures), the engine carries those for core data and libraries, and the site's assets page and the public-build licence gate gather them from the packages, with the same visible credits as today.

## User Check

None on screen beyond the assets page reading the same (the owner's look is the last step).

## Done When

- Each package has its licence and credit records beside its data (files moved, not reworded); the engine's `licenses/` keeps the third-party library licences it ships (ERFA, orb.js, sgp4) if those belong to engine code.
- The assets page (`assets.html`, `tools/site/assets-sections.mjs`) and `tools/validate/public-build-assets.mjs` find credits and licences from the packages; their output (the credit list and the gate's result) is the same as before, compared and recorded.
- A fast test proves a made-up demo package with its own credit record is picked up by the site's credit gathering without a site code change (ARCH-03); existing credit tests (`tests/assetsPageCredits.test.ts`, `tests/assetsSections.test.ts`) still pass (named, TEST-03).
- Configured gates pass; public build, `public-build-assets` and the load budget pass. No browser runs.

## Context Files

`src/assets/licence.ts` (new path), `tools/site/assets-sections.mjs`, `tools/validate/public-build-assets.mjs`, `tests/assetsPageCredits.test.ts`, `tests/assetsSections.test.ts`, the `licenses/` folder, and the previous steps' Technical Evidence.

## Design References

Design: Public site and launch (O-016); Measured orbits: GMN only; texture provenance (PROV-02).

## Guardrails

PROV-01, PROV-02, ARCH-01, ARCH-03, TEST-01, TEST-03.

## Implementation Plan

1. List every licence and credit record and which package's data it covers.
2. Move each next to its data; teach the site's gathering to read the packages.
3. Compare the assets page credit list and the gate result before and after.
4. Test with a made-up demo; gates.

## Boundaries

No wording or licence change; no data change. No browser runs, no screenshots.

## Technical Verification

Focused tests; configured gates and public build checks at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-23, uncommitted.
- Moved (git mv): `licenses/` (ERFA.txt, orbjs-MIT.txt, python-sgp4.txt) to `packages/astraeus/licenses/` (engine library notices). README and docs/ASTRONOMY_VALIDATION.md paths updated. Not moved: docs/APOLLO11_SOURCES.md (a decision record, path quoted in data files, generated reports and tool code; moving it means data/code edits) and docs/DONOR_PROVENANCE.md (mixed across packages).
- Demo credits: the shower, Apollo and planet licences already sit in each demo's data files (`provenance.licence`); the assets-page credit rows are hand-written HTML in the site (unchanged, byte-identical to before).
- New `packages/astraeus-site/tools/site/package-credits.mjs` (+ .d.mts): gathers every package's `licenses/` and `credits/` files and the `provenance.licence` of its data JSON, by scanning packages/*; `public-build-assets.mjs` now reports `packageCredits` and fails if the engine lacks its three library licences.
- New test `packages/astraeus-site/tests/packageCredits.test.ts`: a made-up demo package with its own credit file and licensed data file is gathered with no site change (ARCH-03). Existing assetsPageCredits and assetsSections tests pass.
- Before/after: assets.html Credits section identical (cmp); public-build-assets result identical apart from the two new keys.
- Gates: lint, typecheck, build (public), npm test (116 files, 1529 passed, 1 skipped), public-build-assets, load-budget: all pass. No browser runs.
- Note: assets.html credit rows are not generated from the packages; a generated credits section would change the page and was left out.

## Drift Notes

Note for Design: credits and licences live with each package. Reconciled in the last step.

### Follow-up, owner "Finish it, short (Recommended)" (2026-10-23)
- `docs/APOLLO11_SOURCES.md` moved (git mv) to `packages/astraeus-demo-apollo11/credits/APOLLO11_SOURCES.md`; path strings only updated in README.md, docs/APOLLO11_RECONSTRUCTION.md, docs/ASTRAEUS_SPIKE_02.md, apollo11 data (normalised/anchors.json, generated/validation.json, stories/apollo11/panels.json) and tools (anchors.ts, config.json, conventions.ts, reconstruct.ts, report.ts). Nothing regenerated.
- New `credits/CREDITS.md` in the apollo11, showers and planets packages: rows copied from the assets.html Credits section (Apollo 11; GMN, IAU MDC, Shower calendar; Planetary Explorer), plus a heading and one line.
- packageCredits now lists all four packages; test extended so each demo must have a credit record. Credits section of assets.html still byte-identical.
- Gates re-run: lint, typecheck, public build, npm test (116 files, 1529 passed, 1 skipped), public-build-assets, load-budget all pass. No browser runs.
