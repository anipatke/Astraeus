---
id: T-015
title: Fly engine burns physically instead of forcing them through both readings
objective: O-004
status: done
depends_on: [{task: T-014, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: g002-plan-2026-10-06}
check_waiver:
    task: T-015
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-06T08:14:32Z"
---

# Fly engine burns physically instead of forcing them through both readings

## Outcome

Every ordinary engine burn in the Apollo 11 reconstruction is flown from its ignition anchor with gravity and a constant thrust acceleration, so no burn produces an impossible speed. The cutoff anchor's residual is published, and the following coast continues smoothly from the modelled cutoff.

## User Check

At 1× zoomed in on Columbia, scrub through LOI-2 (GET 80:11:37) and MCC-1 (GET 26:44:59): no dash. Read the report's burn table: per-burn cutoff residual and peak speed.

## Done When

- All `poweredPairs` use the physical burn segment; special pairs (descent, surface hold, ascent) are byte-unchanged in method and output.
- Burn model: offline integration from the ignition anchor's state with the existing dynamics (Earth J2, Moon, Sun) plus a constant acceleration chosen so the integrated velocity reaches the cutoff anchor's velocity at cutoff time. Position and velocity residual at the cutoff anchor are published per burn.
- The coast after a burn starts from the modelled cutoff state (a generic start-state input to the coast, no burn naming inside it); joins remain continuous and `discontinuities` stays empty.
- A 1 s step scan of Columbia and Eagle through the runtime `SampledTrajectory` flags no second whose move exceeds the local speed; A-13>A-14 peaks near 1.6–1.7 km/s; every burn's peak speed is in the report.
- Every non-cutoff anchor is still met to ≤1e-6 km; cutoff anchors report their residuals; sample interpolation error stays ≤0.25 km target.
- Reconstruction re-runs byte-identical.
- `docs/APOLLO11_RECONSTRUCTION.md` (via `tools/apollo11/report.ts`) describes the burn method, residuals and peak speeds and updates the Known gaps wording; `docs/ASTRAEUS_SPIKE_02.md` and `.savepoint/Design.md` Current Technical State are reconciled (drift notes to the planner if Design needs more than the burn facts).
- `tools/validate/browser-spike02.mjs` re-run with 0 console errors; evidence under `docs/evidence/`.
- Configured gates pass (typecheck, build, test).

## Context Files

`tools/apollo11/segments.ts`, `tools/apollo11/dynamics.ts`, `tools/apollo11/trajectory.ts`, `tools/apollo11/hermite.ts`, `tools/apollo11/reconstruct.ts`, `tools/apollo11/report.ts`, `tools/apollo11/validation.ts`, `tools/apollo11/config.json`, `tests/apollo11Reconstruction.test.ts`, `tests/missionScene.test.ts`, `tools/validate/browser-spike02.mjs`, `docs/ASTRAEUS_SPIKE_02.md`, `.savepoint/Design.md`, `.savepoint/issues/I-007-a-13-longitude-and-burn-arc-speed-spike.md`.

## Design References

Design: Components/Codebase Map (`tools/apollo11/`), Interfaces and Data Flow (`SampledTrajectory`), Current Technical State. O-004 Confirmed Decisions and Architectural Considerations.

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-02, STYLE-05, STYLE-07, CODE-01.

## Implementation Plan

1. Confirm `smoothedCoast` and `poweredHermite` in `tools/apollo11/segments.ts` and the dynamics integrator still match the O-004 Architectural Considerations; return REPLAN REQUIRED if not.
2. Add a physical burn segment (own small module if `segments.ts` would mix jobs): solve the constant acceleration (one fixed-point or linear correction over the integrated gravity velocity change), integrate at a step suited to short burns, record cutoff residuals.
3. Let a coast take its start state from the preceding segment's end when that is a modelled state; keep the anchor-start path for other coasts.
4. Publish per-burn residuals and peak speeds in the generated data and report; add the 1 s speed scan to the validation output.
5. Tests: regression for the A-13>A-14 and A-09>A-10 peak speeds, continuity at burn→coast joins, special pairs unchanged, non-cutoff anchors exact, byte-identical rerun.
6. Regenerate, run the browser check, reconcile the spike note and Design, run gates; record evidence and append I-007 history.

## Boundaries

No variable-thrust, mass-flow or guidance modelling. No change to descent, ascent or surface-hold segments, `src/`, runtime contracts or UI. No new anchor or override edits (T-014 owns data).

## Technical Verification

Focused tests during iteration; handoff runs the configured typecheck, build and test gates per AGENTS.md's Verification Policy. The browser script and the 1 s scan are the platform/scene evidence the Full Objective Check needs (`agent-skills/references/check-method.md`); the executor produces them before handoff.

## Technical Evidence

### Read Log

- Read the active task workflow, router, T-015, O-004, T-014 dependency record, Guardrails rules TEST-01/02/03, STYLE-02/05/07, CODE-01, and configured quality gates.
- Read all listed Context Files: `tools/apollo11/segments.ts`, `tools/apollo11/dynamics.ts`, `tools/apollo11/trajectory.ts`, `tools/apollo11/hermite.ts`, `tools/apollo11/reconstruct.ts`, `tools/apollo11/report.ts`, `tools/apollo11/validation.ts`, `tools/apollo11/config.json`, `tests/apollo11Reconstruction.test.ts`, `tests/missionScene.test.ts`, `tools/validate/browser-spike02.mjs`, `docs/ASTRAEUS_SPIKE_02.md`, `.savepoint/Design.md`, and `.savepoint/issues/I-007-a-13-longitude-and-burn-arc-speed-spike.md`.
- Extra reads: `tools/apollo11/sampling.ts` to understand segment sample boundaries and interpolation checks; `agent-skills/references/issue-capture.md` to preserve I-007's append-only history requirements; current generated Columbia/Eagle outputs to capture the special-segment byte baseline; regenerated Apollo outputs to verify report values and runtime samples. `tsconfig.json` was read after an initial typecheck error to confirm DOM Web Crypto types for the baseline hash test; that extra read was logged after access.

### Acceptance evidence

1. **Physical ordinary burns; special pairs unchanged:** all 12 configured `poweredPairs` generate method `powered-burn-physical`. The three special paths remain `powered-descent-two-anchor`, `surface-hold`, and `powered-ascent-two-anchor`. Regression hashes of their pre-task emitted samples are pinned and pass: A-20>A-LND (1 sample, `f61905af7c238234cb8cf6baa9bd1a2c8c3f000456d0c6f94132d6f79349916f`), A-LND>A-LIFTOFF (22 samples, `6e8e4910c1d285179cd0ed5f8edd2d9b57dced1ae23a61dfa5a2d86c3afeb22d`), A-LIFTOFF>A-21 (1 sample, `d6fcb512c720ea7eaece9084374da0bf0bf46eb91da24e890637cef31d9f1d12`).
2. **Burn model and residuals:** each ordinary burn integrates the ignition anchor's Earth-centred EQJ state with the existing Earth J2, Moon and Sun gravity and a constant inertial acceleration. The solver corrects acceleration until the integrated cutoff velocity is within 1e-9 km/s of the cutoff anchor; step size is 0.25 s. Burn rows publish acceleration, position/velocity cutoff residuals, local reference body, and runtime peak speed.
3. **Burn-to-coast handoff:** `Segment.endState` is the generic modelled end state; `buildSegment` passes it as a generic coast start state. The coast has no burn-specific logic. The cutoff sample is not pinned back to its printed anchor; a shared runtime sample joins burn and coast. Both generated `discontinuities` arrays are empty, and join-position and shared-sample tests pass.
4. **Speed scan and burn peaks:** the runtime `SampledTrajectory` scan checked 701,486 one-second Columbia intervals and 100,260 Eagle intervals; neither had a move greater than the maximum Earth-centred speed sampled at interval start, midpoint and end (0.001 km tolerance). A-13>A-14 peaks at **1.669481 km/s Moon-relative**; A-09>A-10 peaks at **1.531620 km/s Earth-centred**. All 12 burn peaks appear in the generated report and JSON.
5. **Anchors and interpolation:** all 40 non-cutoff anchors have maximum residuals of 0.000001 km and 0.000001 m/s. The 12 cutoff position residuals range from 0.190760 to 454.706052 km; cutoff velocity residuals are at most 0.000001 m/s. Maximum held-out runtime interpolation error is 0.1997 km (≤0.25 km target).
6. **Determinism:** two final `npm run apollo11:reconstruct` runs produced identical SHA-256 values for all six outputs:

   - `data/apollo11/normalised/anchors.json`: `ee377b7f773e6c1ceec30c9ad8c632c67ae64d83adb88161a47fe4735b4bb0e7`
   - `data/apollo11/generated/columbia.json`: `dd646f3cfde6fcdf6ff1edd8c1aa0253dd5ec19b6e627c70de549c67c76dac23`
   - `data/apollo11/generated/eagle.json`: `1d3c2c1bbb91a2f3d98f6cc5272f4eb825b3d3eff03612e0e7512cc348c12c53`
   - `data/apollo11/generated/events.json`: `f03005ee9cee28f0d9c2ce7200a79c82262c74b9df678da4a6ab1497e3dbab3b`
   - `data/apollo11/generated/validation.json`: `7da750917436f2a3427e9d70413df80d5753fa9f80edf0de5868a306c5580090`
   - `docs/APOLLO11_RECONSTRUCTION.md`: `907bd1e38a80ae3ff9caf5b3e829bc92fbde20eb74404a43ce42609725612616`
7. **Documentation:** the generated report now describes the physical burn model, residuals, reference-body peaks, scan and known gaps. `docs/ASTRAEUS_SPIKE_02.md` and `.savepoint/Design.md` record the T-015 method and measured results. I-007's summary/evidence were reconciled and one `repair_attempted` history entry was appended; its escalation disposition remains unchanged.
8. **Browser validation:** `tools/validate/browser-spike02.mjs` completed against the local Vite server with `errors: []`, all six readable/true scale pairs equal, `focusUnchanged: true`, and 30 event jumps. Evidence is in `docs/evidence/spike02-browser.json` and `docs/evidence/spike02/*.png`.
9. **Configured gates:** `npm run typecheck` passed; `npm run build` passed with the existing large-chunk advisory; `npm test` passed (7 files, 127 tests).

### Commands run

- `npm run apollo11:reconstruct` (two final runs; both succeeded and matched hashes above).
- `sha256sum data/apollo11/normalised/anchors.json data/apollo11/generated/columbia.json data/apollo11/generated/eagle.json data/apollo11/generated/events.json data/apollo11/generated/validation.json docs/APOLLO11_RECONSTRUCTION.md` (before and after the second run; all six hashes matched).
- `npm test -- --run tests/apollo11Reconstruction.test.ts` (30/30 passed) and `npm test` (127/127 passed).
- `npm run typecheck` and `npm run build` (both passed).
- `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://127.0.0.1:5199/ node tools/validate/browser-spike02.mjs` (passed with 0 console errors; executed outside the workspace sandbox after Chromium's sandbox launch was denied).

Named reconstruction regressions in `tests/apollo11Reconstruction.test.ts`: “keeps every non-cutoff anchor exact and publishes each burn cutoff residual”; “flies every powered pair physically and publishes runtime peak speeds”; “finds no one-second move beyond local speed in either runtime trajectory”; “leaves the special descent, surface-hold and ascent methods and emitted samples byte-identical”; “keeps runtime Hermite interpolation error at held-out midpoints within the 0.25 km target”; and “keeps position and velocity continuous at every segment join”.

### Read and change record

- Read: the supplied `AGENTS.md`, `agent-skills/savepoint-task/SKILL.md`, `.savepoint/router.md`, this Task, O-004, T-014, the O-002 status header for dependency readiness, `.savepoint/Guardrails.md`, `.savepoint/config.yml`, and every T-015 Context File named in `## Context Files`.
- Extra reads: `tools/apollo11/sampling.ts` (segment sample boundaries and midpoint interpolation checks); `agent-skills/references/issue-capture.md` (append-only I-007 history); current generated Columbia/Eagle data (special-pair baselines); regenerated Apollo outputs/report (runtime and residual evidence); `tsconfig.json` (after initial Node crypto typing failed, to confirm Web Crypto types; this read was logged after access).
- Changed: `tools/apollo11/burn.ts` (new), `tools/apollo11/dynamics.ts`, `tools/apollo11/segments.ts`, `tools/apollo11/trajectory.ts`, `tools/apollo11/config.json`, `tools/apollo11/validation.ts`, `tools/apollo11/reconstruct.ts`, `tools/apollo11/report.ts`, `tests/apollo11Reconstruction.test.ts`, generated Columbia/Eagle/validation data and report, `docs/ASTRAEUS_SPIKE_02.md`, `.savepoint/Design.md`, this Task, `.savepoint/issues/I-007-a-13-longitude-and-burn-arc-speed-spike.md`, and browser evidence under `docs/evidence/`. The raw anchors and runtime `src/` were not changed. `npm run build` wrote ignored `dist/` output.

### Limitations and drift notes

- TLI A-01>A-02 has the largest cutoff position residual (454.706052 km). The following A-02>A-03 coast lasts 10 seconds and needs a 463.219 km correction, with a maximum smoothing velocity correction of 69,263.426 m/s. This is exposed in the generated report and Spike 02 note; planner review is needed before the Full Objective Check decides how to carry this mismatch. No anchor was changed under T-015.
- Browser evidence is headless SwiftShader; required owner visual validation remains pending. No Task Check was requested in this session, and no owner waiver was supplied.

## Drift Notes

No runtime or core architecture changed; the physical burn solver remains in `tools/apollo11/` and the coast accepts a generic start state. Planner review before the Full Objective Check: the fitted TLI cutoff A-01>A-02 misses its printed position by 454.706052 km, and the 10-second A-02>A-03 coast reports a 69,263.426 m/s maximum smoothing velocity correction. The report and Spike 02 note expose this mismatch; T-015 did not alter anchors or expand into a new thrust model.
