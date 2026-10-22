---
id: T-141
title: Use the sharp Venus map only in the planets demo
objective: O-039
status: in_progress
stage: audit
check_waiver:
  task: T-141
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the recheck of C-096 covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T11:24:09Z'
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: 8d73d3f8}
lane: venus
planned_reads: [.savepoint/checks/C-096-o-039-full-objective-check.md, .savepoint/issues/I-068-desktop-showers-demos-now-download-the-14-mb-venus-map-unmeasured.md, src/app/bodyDraw.ts, src/assets/licence.ts, src/assets/bodies/venus.ts, src/experiences/planets/planetDefinition.ts, src/app/experienceDefinition.ts, tools/validate/load-budget.mjs, tests/venusMap.test.ts, tests/publicBuild.test.ts, .savepoint/Design.md]
planned_writes: [src/app/bodyDraw.ts, src/app/experienceDefinition.ts, src/experiences/planets/planetDefinition.ts, tools/validate/load-budget.mjs, tests/venusMap.test.ts, tests/publicBuild.test.ts, .savepoint/Design.md]
---

# Use the sharp Venus map only in the planets demo

## Outcome

The 8k desktop Venus map is used only by the planets demo; every other demo (Perseids, Geminids, Apollo) asks for the 2k map at any width, so their pages are back to their earlier size; the Venus load-budget limits are re-measured (I-068, C-096 finding 2; owner 2026-10-22: "Sharp map only in the planets demo").

## User Check

None beyond the recheck; Venus in the planets demo looks as already approved.

## Done When

- An experience opts in to desktop texture variants (the planets demo does; the default is off), expressed as data on the experience definition, not a demo-name check in engine code (ARCH-01).
- Node tests: a desktop-width showers composition asks for `venus-2k-balanced.jpg`; the planets demo at desktop width asks for the 8k file; phone width asks for 2k everywhere.
- `tools/validate/load-budget.mjs` limits for the pages that draw Venus are re-measured against the new 2k file and set on purpose with the measurement in a comment; the public-build check passes.
- Design.md describes the opt-in. Configured gates pass.

## Context Files

`.savepoint/checks/C-096-o-039-full-objective-check.md`, `.savepoint/issues/I-068-desktop-showers-demos-now-download-the-14-mb-venus-map-unmeasured.md`, `src/app/bodyDraw.ts`, `src/assets/licence.ts`, `src/assets/bodies/venus.ts`, `src/experiences/planets/planetDefinition.ts`, `src/app/experienceDefinition.ts`, `tools/validate/load-budget.mjs`, `tests/venusMap.test.ts`, `tests/publicBuild.test.ts`, `.savepoint/Design.md`.

## Design References

Design: Current Technical State, O-039 paragraph; Experience plug-in boundary.

## Guardrails

ARCH-01, STYLE-05, STYLE-07, STYLE-09, STYLE-10.

## Implementation Plan

1. Find where `describeBody` picks the variant; thread an opt-in from the experience definition.
2. Set it for the planets demo only.
3. Tests, then re-measure and set the load-budget limits with a public build.

## Boundaries

No change to the maps or to which bodies a demo draws. No browser sets.

## Technical Verification

Focused node tests; configured gates plus a public build and the public-build check. Evaluated by the recheck.

## Technical Evidence

Built 2026-10-22 in lane lane-t141.
- `ExperienceDefinition.desktopTextures?: boolean` (default off); planets definition sets `true`. Threaded `App.tsx` runtime -> `SceneRuntime.desktopTextures` -> `SceneBody` -> `BodyView` -> `describeBody(asset, policy, desktopTextures = false)`, which passes width 0 (base file) when off. No demo-name check in engine code.
- Tests: `tests/venusMap.test.ts` (flag off at 1280 asks for 2k; on at 1280 asks 8k, at 375 asks 2k; Perseids and Geminids definitions have no `desktopTextures` and their composition includes Venus, which draws the 2k file at 1280), `tests/planetDefinition.test.ts` (definition has `desktopTextures` true). Focused run: 15 passed.
- Public build `ASTRAEUS_PUBLIC_BUILD=1 flock /tmp/astraeus-build.lock npx vite build --outDir /tmp/t141-public-313009`; `public-build-assets.mjs` passes (exit 0); `load-budget.mjs`: showers 9,963,746 B raw / 6,994,728 gzip (limit 10,090,000 / 7,050,000), geminids 12,448,219 / 7,800,938 (12,700,000 / 7,900,000), Jupiter 6,780,957 / 4,661,657, whole build 40,482,094 / 31,807,803. The shower pages already fetch only the 2k file, so their limits are unchanged and honest.
- The Venus view is not a public page, so the script never checked it. Measured on a local build (/tmp/t141-local-313630, scratch copy of the script with Venus included): 2k (phone) 3,159,629 B raw / 1,848,065 gzip; the real desktop fetch (8k instead of 2k) 16,543,654 raw / 15,185,633 gzip. Limit set to desktop plus 5%: 17,380,000 / 15,950,000, listing the 8k file; `venus-8k-balanced.jpg` added to the files a public build may hold (like the inner planets' maps). The old limit (3,100,000 / 1,730,000) was already below the 2k measurement.
- Gates (lane): lint, typecheck, build clean; npm test 99 files, 1337 passed, 1 skipped.
- Design.md: bullet "Desktop texture opt-in (T-141, I-068)".
- Deviation: the planned write list lacked nothing, but `tests/publicBuild.test.ts` needed no change. Open: the public build still ships the unused 14.5 MB 8k file (whole build 40.5 MB); aliasing it to the placeholder in `vite.config.ts` (`PLANETS_DEMO_ONLY_TEXTURES`) would drop it. Not done (outside the plan); the owner may want a follow-up Task.
- Owner look on preview: pending. Open http://localhost:5490/app.html?experience=planets&planet=venus at desktop width: the sharp Venus map still shows; and http://localhost:5490/app.html?experience=showers at desktop width: Network shows venus-2k-balanced.jpg, no venus-8k request.

## Drift Notes

Design note written in this Task.
