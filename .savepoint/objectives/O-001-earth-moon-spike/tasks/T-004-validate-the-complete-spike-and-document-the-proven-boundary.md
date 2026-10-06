---
id: T-004
title: Validate the complete spike and document the proven boundary
objective: O-001
status: done
depends_on: [{task: T-003, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: astraeus-spike-01-planning-2026-10-05}
check_waiver:
    task: T-004
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-05T21:19:23Z"
---

# Validate the complete spike and document the proven boundary

## Outcome

The integrated Earth–Moon spike has current scientific and visual evidence and a short design note describing what was actually implemented, its accuracy and remaining limitations.

## User Check

Exercise the original and additional owner success criteria, compare visual quality with the donor and read docs/ASTRAEUS_SPIKE_01.md. Confirm the result demonstrates scientific state → trajectory → scale policy → floating origin → rendered scene without wider architecture.

## Done When

1. Validate all O-001 success conditions together: timestamp seeking, credible dated motion, playback, true/compressed scale, camera independence and identical scientific state. Record evidence for each with reproducible inputs and outcomes, including Float64 units, both policies, independent origin rebasing, Earth rotation, lunar locking, Sun geometry/phase, center composition and provider reuse.
2. Re-run independent lunar fixtures and configured gates on final integrated code. Report actual angular/distance errors, supported measured date range, justified recurrence tolerances, timescale/frame handling and accuracy limits without inflating library claims.
3. Record browser evidence for Earth/Moon appearance and texture orientation, atmosphere, focus, scale framing, path/position alignment, debug values and interactions across pause/play/seek/rate/scale, rebasing at large offsets/close focus, and day/night and Moon phase at independent reference dates.
4. docs/ASTRAEUS_SPIKE_01.md covers architecture implemented, library choice, coordinate/frame conventions, units, accuracy assumptions, scale approach, donor reuse, application-specific code, discovered problems and recommended next spike. Record each addendum change as adopted/rejected/deferred with reasons and architecture consequences. Explain scientific orientation/illumination approximations, quaternion and center conventions, provider evaluation including orb.js, floating origin independently of policy, and unresolved asset provenance without overstating guarantees.
5. Reconcile .savepoint/Design.md to implemented reality and capture any durable follow-up using the issue workflow if needed. Do not write a Check record, mark work done or claim independent CLEAR; prepare evidence for the mandatory Full Objective Check in a fresh session.

## Context Files

Predecessor outputs: `src/core/clock.ts`, `src/core/body.ts`, `src/core/state.ts`, `src/core/trajectory.ts`, `src/core/moonTrajectory.ts`, `src/core/scalePolicy.ts`, `src/core/astronomyAdapter.ts`, `src/core/referenceCenters.ts`, `src/core/bodyOrientation.ts`, `src/core/illumination.ts`, `tests/orientationIllumination.test.ts`, `docs/ASTRAEUS_SPIKE_01_ADDENDUM.md`, `src/app/App.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/BodyMesh.tsx`, `src/app/AtmosphereGlow.tsx`, `src/app/useBodyTexture.ts`, `src/app/renderCoordinates.ts`, `src/app/floatingOrigin.ts`, `src/app/orbitPath.ts`, `src/app/CameraController.tsx`, `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `tests/core.test.ts`, `tests/sceneTransforms.test.ts`, `tests/controls.test.ts`, `tests/fixtures/moon-horizons.json`, `tests/fixtures/moon-horizons-source.txt`, `docs/ASTRONOMY_VALIDATION.md`, `docs/DONOR_PROVENANCE.md`, `package.json`, `package-lock.json`, `.savepoint/config.yml`, `.savepoint/Design.md`.

Planned new output: `docs/ASTRAEUS_SPIKE_01.md`. Read any browser verification files created by the preceding Task only after logging exact paths and reason. Donor appearance comparison may reuse paths already named in O-001, logging the exact reads.

## Design References

Owning Objective: Confirmed core contracts, Astronomy choice and accuracy, Scene integration, Verification and handoff, and Discovered risks. Planned changes remain in the Objective until implementation is reconciled into Design.

## Guardrails

SEC-01, TEST-01, TEST-02, TEST-03, TEST-04 and STYLE-01 through STYLE-10. Existing scaffold rules outside this work do not introduce authentication or unrelated infrastructure requirements.

## Implementation Plan

1. Map the complete owner success criteria to integrated evidence and identify any unresolved interaction failures.
2. Validate trusted fixtures and browser scenarios on final code; repair defects within this integration scope.
3. Write the requested short design note from actual source/evidence, including measured errors and limitations.
4. Reconcile Design and record final per-criterion evidence with fresh gate command results.
5. Hand off for owner validation and mandatory independent Full Objective Check; do not perform that Check in this executor session.

## Boundaries

No new engine features, premature optimisations, external publishing, self-issued Check clearance or owner completion decisions. Follow-up outside this spike is recorded rather than implemented.

## Technical Verification

Fresh configured build/typecheck/test gates plus the project's full gate if separately defined. Offline lunar comparisons and integrated browser scenarios. Independent Full Objective Check follows in a new session using agent-skills/references/check-method.md; this Task does not replace it or run health collection reserved for that Check.

## Technical Evidence

Gates on final code (2026-10-06, Node v22.22.2): `npm run typecheck` clean; `npm run build` built (chunk-size warning only); `npm test` 4 files, 58 tests passed. Lint not configured; no separate full gate defined. Executor evidence only; no Check run, no health collection.

Per criterion:
1. All O-001 conditions validated together (details in `docs/ASTRAEUS_SPIKE_01.md`, Validation). Browser at USNO dates 2024-01-04/11/18/25: lit 50.1/0.2/50.1/99.8 %; same timestamp at 1×/1 h/s/1 d/s/7 d/s identical scientific rows; ReadableScale vs TrueScale at 2024-01-25 17:54 differ only in policy, rendered distance (6.2940 vs 62.9404) and Moon local; both rebase during 7 d/s Moon-focus playback (8 distinct origins each); drag/zoom during playback advanced time two days; Float64 units, ~1 AU offsets, Earth rotation, lunar locking, Sun geometry, centers and provider reuse covered by the 58 offline tests.
2. Fixtures re-run on final code through a temporary test (removed): Moon max 0.0708 arcmin / 6.385 km, Sun max 0.0001 arcmin / 1.373 km over eight 2022–2025 samples; recurrence 0.295°/656 km vs tolerance 0.6°/1500 km; timescale/frame handling and limits in the note.
3. Browser evidence as in 1 plus screenshots reviewed in session (phases, Earth at 2026-04-01 12:00 UTC, both scales, close Moon, rebase). No page or console errors. Not archived in the repo.
4. `docs/ASTRAEUS_SPIKE_01.md` written: architecture, library choice, conventions, units, accuracy, scale, donor reuse, app-specific code, problems, next spike, addendum table (adopted/rejected/deferred with consequences), orientation/illumination approximations, orb.js evaluation, floating origin independent of policy, unresolved provenance.
5. `.savepoint/Design.md` reconciled. No Check written, nothing marked done, no CLEAR claimed. No Issue created (open items are recorded in the note and Design; the owner may promote texture provenance to an Issue).

Files read: Task, Objective, `AGENTS.md`, `agent-skills/savepoint-task/SKILL.md`, `.savepoint/{router.md,config.yml,Design.md}`, `docs/{ASTRONOMY_VALIDATION,DONOR_PROVENANCE,ASTRAEUS_SPIKE_01_ADDENDUM}.md`, `package.json`, `vite.config.ts`, `src/core/{moonTrajectory,astronomyAdapter}.ts`, `src/app/{App,DebugControls,DebugOverlay}.tsx`, first 80 lines of `src/app/CameraController.tsx`, `tests/core.test.ts` (head), fixture heads, T-002/T-003 evidence. Logged extra reads: `/home/user/code/planetary-explorer/node_modules/playwright-core` (browser driver only; the Task's browser-file allowance did not cover it) and `ls` of `licenses/`, `~/.cache/ms-playwright`. Other Context Files were not re-read because tests and the T-002/T-003 evidence cover them.
Files changed: `docs/ASTRAEUS_SPIKE_01.md` (new), `.savepoint/Design.md`, this Task. Temporary `tests/zz_measure.test.ts` created and deleted. Scratchpad only: `verify.mjs`, screenshots.

Limitations: manual headless SwiftShader browser run, script and screenshots not in the repo; donor not run, so appearance is by eye; accuracy measured on eight samples only; no video-level smoothness check; texture provenance unresolved; no source defects were found, so none were repaired.

## Drift Notes

Record implementation deltas and reconcile Design before the independent Full Objective Check. Return REPLAN REQUIRED for a material design gap.
