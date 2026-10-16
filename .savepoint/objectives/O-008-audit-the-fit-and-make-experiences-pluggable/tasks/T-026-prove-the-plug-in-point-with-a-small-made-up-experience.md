---
id: T-026
title: Prove the plug-in point with a small made-up experience
objective: O-008
status: done
depends_on: [{task: T-025, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: g004-plan-2026-10-10}
check_waiver:
    task: T-026
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-10T20:45:14Z"
---

# Prove the plug-in point with a small made-up experience

## Outcome

A minimal synthetic experience mounts through the same plug-in contract as Apollo, contract-level tests and a browser smoke prove it, the generic name check covers app code, and `Design.md` is reconciled for O-008.

## Astraeus Hypothesis

- **Capability tested:** reuse of the app and shell with an experience that is not Apollo.
- **Contract reused:** the T-025 plug-in contract, `ExperienceConfig`, `Trajectory`, `Provenance`, `TimelineEvent`.
- **Gap or hypothesis:** the plug-in contract still hides Apollo assumptions (required anchors, Earth–Moon overview, spacecraft wording) that only a second experience reveals.
- **Generic change:** none expected; any needed fix to generic code is recorded and returned as REPLAN REQUIRED if it is more than a contract correction.
- **Perseids-independent evidence:** this Task is that evidence (ARCH-03).

## User Check

Open the app with the synthetic experience selected (the evidence names how) and see its own objects, events and labels in the same shell; confirm Apollo still opens normally.

## Done When

1. A synthetic experience fixture (for example one illustrative object on a simple trajectory with two events) lives outside generic code and uses only the plug-in contract.
2. Contract-level tests mount or assemble both Apollo and the synthetic experience through the same entry and assert the shell receives each one's configuration.
3. An automated name check fails if `apollo`, `columbia`, `eagle`, `perseid` or `meteor` appear in `src/core/`, `src/shell/` or generic `src/app/` code.
4. A headless browser smoke loads the synthetic experience with zero console errors and writes to a fresh run directory; Apollo browser scripts still pass.
5. `.savepoint/Design.md` describes the plug-in boundary and accounts for every Drift Note deferred from T-024 and T-025.

## Context Files

`docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`, `.savepoint/objectives/O-008-audit-the-fit-and-make-experiences-pluggable/Objective.md`, `.savepoint/Design.md`, `src/main.tsx`, `src/app/App.tsx`, `src/mission/apollo11.ts`, `src/shell/experience.ts`, `src/core/sampledTrajectory.ts`, `src/core/provenance.ts`, `tests/metricVisuals.test.ts`, `tests/controls.test.ts`, `tools/validate/browser-shell.mjs`.

## Design References

Design: Components/Codebase Map, Interfaces and Data Flow, Current Technical State.

## Guardrails

ARCH-01, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-05, STYLE-09.

## Implementation Plan

1. Confirm T-025's contract is in place; return REPLAN REQUIRED if not.
2. Write the synthetic fixture with `illustrative` provenance.
3. Add contract tests for both experiences and the extended name check.
4. Add the browser smoke and run all browser scripts.
5. Reconcile Design and deferred Drift Notes.

## Boundaries

No Perseids data, no particle provider, no timeline spans, no core changes.

## Technical Verification

Handoff runs `npm run typecheck`, `npm run build`, `npm test` and all browser scripts. The Full Objective Check for O-008 follows per `agent-skills/references/check-method.md`; owner validation confirms the synthetic experience is visibly distinct from Apollo in the same shell.

## Technical Evidence

Executor session, 2026-10-11. No Task Check requested; nothing waived. Owner validation (User Check) is still open.

**Per-criterion outcomes**
1. Met. `src/synthetic/syntheticDefinition.ts`: one invented object ("Survey marker") on a circular Earth-centred loop, two events, `illustrative` provenance and a known limitation. Built only from `ExperienceDefinition`, `SampledTrajectory`, `createProvenance`, `createEvents`, `createObjectMetrics`.
2. Met. `tests/experiencePlugIn.test.ts` runs the same three checks for Apollo and the synthetic experience: the shell, rendered with that definition's config, shows its own objects; tracked bodies match the definition; the metrics factory returns metrics for its body. It also checks the synthetic one shows nothing of Apollo and has the right provenance, window and events.
3. Met. The same file scans `src/core/`, `src/shell/` and `src/app/*` for `apollo|columbia|eagle|perseid|meteor` (case-insensitive) and found none; it also asserts each folder was actually scanned. (The older shell-only check in `timeline.test.ts` is unchanged.)
4. Met. New `tools/validate/browser-synthetic.mjs` (loads `?experience=synthetic`, checks its object and its 2 events, focus and follow, then checks Apollo is still the default) plus the four existing scripts, all against `vite --port 5199` on 2026-10-11 with `"errors": []`. Run directory `docs/evidence/o008-t026-run1/` (synthetic, spike03, spike02, anchor-labels); earlier evidence untouched. `browser-shell.mjs` writes no files.
5. Met. `.savepoint/Design.md` gains a plug-in boundary section and updated component rows, and accounts for each deferred T-024/T-025 note (camera limits, metrics/panel wording and location, Earth/Moon mandatory, `camera` option, experience selection).

**Commands:** `npm run typecheck` pass; `npm run build` pass (chunk-size warning only); `npm test` 182 of 182 pass in 12 files (9 new). `git status src/core` is clean.

**Files changed:** src/main.tsx (now chooses the experience), .savepoint/Design.md. **Added:** src/synthetic/syntheticDefinition.ts, tests/experiencePlugIn.test.ts, tools/validate/browser-synthetic.mjs, docs/evidence/o008-t026-run1/. **Read:** Context Files read except tools/validate/browser-shell.mjs (first 60 lines only), tests/controls.test.ts and tests/metricVisuals.test.ts (greps). **Extra reads (logged):** src/app/experienceDefinition.ts, src/mission/apollo11Definition.tsx and tests/experienceDefinition.test.ts (T-025 output, to build on it), src/app/mission.ts, src/app/metricReadouts.ts, src/app/EarthMoonScene.tsx (grep), src/core/body.ts, src/core/events.ts, src/shell/AstraeusShell.tsx (props), package.json, .savepoint/Guardrails.md (ARCH-03 line), tests/timeline.test.ts (existing name check).

**Also changed outside this Task:** the Claude Code hooks in `.claude/` were renamed from `.js` to `.cjs` because `package.json` is `"type": "module"` and they crashed on start. Savepoint-managed; an upgrade may undo it.

**Limitations:** the synthetic screenshot (`docs/evidence/o008-t026-run1/synthetic/synthetic.png`) has not been looked at by a person; the headless script checks content, not appearance. The User Check (see the made-up experience in the same shell and confirm Apollo opens normally) is the owner's. The synthetic experience is selected by a URL parameter, not a registry. Browser pass was judged from printed `errors: []`, not exit codes.

## Drift Notes

Record any Apollo assumption the synthetic experience exposed.

- The scene still always draws Earth and the Moon, so the synthetic experience had to be Earth-centred and list `earth-moon`. Not fixed here (no core or scene redesign in this Task); recorded in Design.md.
- `createObjectMetrics` works for a non-Apollo body, but its metric names (spacecraft range, Moon distance) are Apollo-flavoured; noted in Design.md.
- Camera limits stay scene constants; the synthetic loop (20,000 km) fits within them.
- No REPLAN REQUIRED: no core or contract change was needed.
