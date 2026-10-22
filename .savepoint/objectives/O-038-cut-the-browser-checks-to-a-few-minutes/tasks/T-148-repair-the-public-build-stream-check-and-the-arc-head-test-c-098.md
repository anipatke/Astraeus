---
id: T-148
title: Repair the public-build stream check and the arc-head test (C-098)
objective: O-038
status: in_progress
stage: audit
depends_on: [{task: T-147, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o038-orchestration-20261023}
lane: close
issues: [I-071, I-072]
check_waiver:
  task: T-148
  reason: 'owner decision on the two C-098 gaps: "Fix both, short recheck"'
  actor: {role: owner, session: o038-orchestration-20261023}
  recorded_at: '2026-10-23T00:00:00Z'
---

# Repair the public-build stream check and the arc-head test (C-098)

## Outcome

I-071: the browser command opens the showers views on the scratch public build, and the smoke check and the meteor-shower journey fail when the meteor stream is not drawn. I-072: the arc-head orbit-look test runs with a clear margin under the full gate. Small C-098 tidy-ups.

## User Check

None.

## Done When

- `npm run check:browser` runs smoke on the showers views of the public build and requires stream dots in view; the journey requires dots too; a fast test proves the assertion fails on zero dots.
- The arc-head test is fast; `npm run test:full` passes twice in a row; its time is recorded.
- `docs/BROWSER_CHECKS.md` rows are true; lint, typecheck, build pass.

## Context Files

`.savepoint/checks/C-098-o-038-full-objective-check.md`, `tools/validate/browser-smoke.mjs`, `tools/validate/journey-meteor-shower.mjs`, `tools/validate/run-browser.mjs`, `tools/validate/runner.mjs`, `tests/orbitLook.test.ts`, `docs/BROWSER_CHECKS.md`

## Guardrails

TEST-01; browser scripts use the shared driver; no screenshots.

## Implementation Plan

1. Add a stream assertion helper with a fast test; use it in smoke and the journey.
2. Add a public-build smoke step limited to showers views.
3. Cut the frames of the arc-head test.
4. Tidy runner.mjs comment, domShell trailing space; update docs.
5. Gates.

## Boundaries

No change to what visitors see. No screenshots.

## Technical Evidence

- I-071: new `tools/validate/stream-check.mjs` (`assertStreamDrawn`, fed `ui.sceneDotsInView`); `browser-smoke.mjs` requires stream dots in view for every `showers*` view and takes `ASTRAEUS_VIEWS=showers`; new step `smoke-public-showers` in `run-browser.mjs` runs it on the scratch public build (preview now started by the runner); `journey-meteor-shower.mjs` requires dots after the seek and now uses a normal story-panel click (passed). Deliberate-failure proof: `tests/streamCheck.test.ts` (zero and NaN dots throw). Driver guard passes. `docs/BROWSER_CHECKS.md` rows updated.
- I-072: `tests/orbitLook.test.ts` arc-head case cut from 240 frames at 3 h to 60 frames at 12 h (same 30 days, the moon's whole orbit, larger steps so a stricter chord test). Time: 445 ms alone; 1.68 s in `test:full` junit.xml (was 4665 ms to over 5000 ms).
- Tidy: `runner.mjs` line 1 comment; trailing space removed at `tests/domShell.test.ts:64`.
- Gates (UTC 2026-10-22): lint pass, typecheck pass, build pass; `npm run test:full` 20:51:58 to 20:52:54 and 20:53:00 to 20:53:57, both 111 files, 1502 passed, 1 skipped. `npm run check:browser` 20:54:00 to 20:54:57 (57 s, all six steps exit 0, zero error lines): `docs/evidence/browser-20261022T205400Z`.
- Task Check waived: owner "Fix both, short recheck". Stopped at stage audit.
