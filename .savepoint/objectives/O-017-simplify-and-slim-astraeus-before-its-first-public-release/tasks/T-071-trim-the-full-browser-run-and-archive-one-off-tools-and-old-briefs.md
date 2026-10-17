---
id: T-071
title: Trim the full browser run and archive one-off tools and old briefs
objective: O-017
status: planned
depends_on: [{task: T-067, requires: clear}, {task: T-068, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Trim the full browser run and archive one-off tools and old briefs

## Outcome

The lite check is proven to catch a broken page, the full browser run is cut to the few scripts that check something neither the lite check, the pictures nor the owner's eyes can, an owner contact sheet makes a 10-second visual look possible, and one-off tools and superseded briefs are archived.

## User Check

One page shows every experience at both sizes for a 10-second look. The full run's summary shows its time well under 20 minutes. A short page lists each removed or moved scenario and where it is now covered.

## Done When

1. Lite check (`tools/validate/browser-lite.mjs`, I-033 step 1): a negative probe shows it fails on a deliberately broken experience (for example a thrown error or a blank canvas), then passes again.
2. Owner direction (2026-10-17): "One 10sec visual inspection beats 40mins of auto browser checks." Keep automated only what eyes cannot judge: crashes and console errors on every page (lite), licence and shipped-data rules (public build, public showers), data correctness and credits that a picture cannot show, and pixel comparison against the before set. Everything else moves to an on-request set or is removed, with each scenario mapped. Target: the trimmed full run under 10 minutes.
3. Contact sheet: the picture tool also writes one HTML or PNG page showing all experiences at desktop and phone side by side with the before set and the differing-pixel figure, so the owner can look in about 10 seconds. `capture-experience-pictures.mjs` and `diff-screenshots.mjs` stay (they are the picture check).
4. Full run trimmed (I-033 step 2): Perseids and Geminids check the phone layout once instead of repeating every scenario; the sky check samples representative experiences; measurement-only scripts (`browser-marker-existing.mjs`, `browser-precision.mjs`) move to an on-request set; quick scripts may run two at a time. Every prior pass/fail scenario is mapped to where it is still asserted (project rule "Browser regression maintenance").
5. A committed full-run script (the checker's `check-run.sh` pattern) runs the trimmed set into a fresh evidence directory and prints a summary; the measured time is recorded.
6. Archive: one-off tools (`tools/validate/capture-apollo-compare.mjs`, `tools/validate/conversion-proof.mjs`, and any other the Task 1 list names) and superseded briefs (`docs/*_BRIEF.md`) move to an archive folder or are removed with a reason; nothing still referenced by a test, script or page is removed.
7. I-033 Proof Needed met; AGENTS.md project rule names the trimmed full set.
8. Gates: typecheck, tests, both builds, the trimmed full run, zero console errors. The `tests/listedOrbitGroup.test.ts` frame-time assertion, which flaked twice under load in O-017, is made robust or moved out of the default test run, with the reason.

## Context Files

`tools/validate/browser-lite.mjs`, `tools/validate/browser-showers.mjs`, `tools/validate/browser-sky.mjs`, `tools/validate/browser-marker-existing.mjs`, `tools/validate/browser-precision.mjs`, `docs/evidence/objective-check-20261016T190443Z/check-run.sh`, `docs/evidence/objective-check-20261016T190443Z/summary.txt`, `.savepoint/issues/I-033-add-a-lite-browser-check-tier-for-everyday-changes.md`, `AGENTS.md`.

## Design References

Design.md tools/validate row.

## Guardrails

TEST-01, TEST-03, STYLE-10.

## Implementation Plan

1. Prove the lite check fails on a broken tree.
2. Trim the two shower scripts and the sky script; map scenarios.
3. Move measurement-only scripts; add the full-run script.
4. Archive tools and briefs.

## Boundaries

No app code changes.

## Technical Verification

Trimmed full run timing and scenario map. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Design tools/validate row (Task 7).
