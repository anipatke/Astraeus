---
id: T-029
title: Show a made-up debris ring and check nothing else broke
objective: O-009
status: done
depends_on: [{task: T-028, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: o009-plan-2026-10-11}
check_waiver:
    task: T-029
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-10T22:00:13Z"
---

# Show a made-up debris ring and check nothing else broke

## Outcome

A made-up experience shows an Earth-centred debris ring through the plug-in contract. A Sun-centred made-up group is proven in contract tests. The browser checks, Apollo regression and Design record all reflect the new group capability, and the owner has looked at the ring.

## Astraeus Hypothesis

- **Capability tested:** that the group capability is reusable by an experience that is not a meteor shower.
- **Contract reused:** `ExperienceDefinition`, the group contract and orbit-based group (T-027), the `points` layer (T-028), the existing synthetic experience and its entry selection.
- **Gap or hypothesis:** none new. This Task is the ARCH-03 alternative-configuration proof for GAP-1.
- **Generic change:** none expected. A required generic change is a finding and returns to planning.
- **Perseids-independent evidence:** this Task is that evidence: a debris ring and a Sun-centred belt with `illustrative` provenance and no meteor naming.

## User Check

Open the app with the debris-ring experience (the entry's query parameter, named in the evidence). At true and readable scale, confirm you can see the ring around Earth, select it, focus and follow it, and read that it is made up. Record your judgement.

## Done When

1. Objective SC5: a made-up experience in `src/synthetic/` with an Earth-centred ring (at least 10⁴ members, `illustrative` provenance, known limitations naming two-body propagation) is selectable from the entry. A Sun-centred made-up group is covered by contract tests through the same definition path.
2. A new browser script under `tools/validate/` loads the ring experience. It asserts the points layer is mounted, the group is listed, focus/follow work and scale switches leave the group's State unchanged. It finishes with zero console errors and captures a screenshot at each scale into a fresh run directory.
3. Objective SC6: the name check covers every new generic file. Configured gates pass, and all existing browser scripts plus the new one pass with zero console errors in fresh run directories, with each path, command, time and result recorded.
4. Design.md is reconciled for O-009. Each T-027/T-028 drift note is reflected or recorded as non-architectural with a reason. The camera-reach gap stays named for O-011.
5. Owner visual judgement of the ring at both scales is recorded after the integration evidence exists.

## Context Files

`.savepoint/objectives/O-009-provide-state-for-groups-of-objects/Objective.md`, `.savepoint/Design.md`, `src/main.tsx`, `src/synthetic/syntheticDefinition.ts`, `src/app/experienceDefinition.ts`, `tests/experiencePlugIn.test.ts`, `tests/experienceDefinition.test.ts`, `tools/validate/browser-synthetic.mjs`, `tools/validate/browser-shell.mjs`, plus the files T-027 and T-028 created or changed as listed in their evidence.

## Design References

Design: Components/Codebase Map, Experience plug-in boundary and its deferred notes, Current Technical State.

## Guardrails

ARCH-01, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-05, STYLE-09, STYLE-10.

## Implementation Plan

1. Confirm T-027 and T-028 are done, and that their drift notes name this Task for reconciliation.
2. Add the ring and Sun-centred group as made-up data, and an entry choice for the ring experience. Keep the existing `synthetic` and `synthetic-bare` choices unchanged.
3. Add contract tests for both made-up groups through the definition path.
4. Write the browser script, modelled on `browser-synthetic.mjs`, with its own run directory.
5. Run the gates and every browser script, then record the evidence.
6. Reconcile Design.md, then stop and ask the owner for the visual check.

## Boundaries

No Perseids or shower data, no generic code changes beyond wiring the entry, no camera-limit changes, and no overwriting of earlier evidence.

## Technical Verification

Handoff runs `npm run typecheck`, `npm run build`, `npm test` and the scene-affecting fuller gate (all browser scripts in `tools/validate/` that load the app, with `PLAYWRIGHT_CORE` per AGENTS.md) into `docs/evidence/o009-<task>-run1/`. The Full Objective Check follows `agent-skills/references/check-method.md` and needs this fresh full-gate evidence plus the owner's recorded judgement.

## Technical Evidence

Run 2026-10-11 by the executor session (not a Check; these are claims for a fresh Check to verify). Gate run started 2026-10-10T21:44:19Z by the machine clock.

**Per-criterion outcomes**
1. SC5 made-up experience: `src/synthetic/syntheticRingDefinition.ts` holds an Earth-centred ring (10,000 members, `illustrative` provenance, limitations and provenance notes naming two-body propagation) mounted by `?experience=synthetic-ring`; `synthetic` and `synthetic-bare` are unchanged. A Sun-centred belt (10,000 members, `illustrative`) goes through the same definition path in `tests/syntheticRing.test.ts` (10 tests: listing, presets, composed single-member placement, determinism, bounds, scale/ARCH-02, no Apollo or meteor naming). Pass.
2. Browser script `tools/validate/browser-synthetic-ring.mjs`: asserts `data-point-groups` is 1 (points layer mounted), the group is listed once, its info panel shows the illustrative badge and made-up/two-body text, focus and follow work, the info panel is identical after True to Readable and back, playback runs, Apollo stays default with 0 groups. Zero console errors. Screenshots at both scales (overview, focus, follow at True; overview, focus at Readable) in `docs/evidence/o009-t029-run1/ring/`. Pass. Limitation: group State is not readable in the browser, so State-unchanged-on-scale is asserted there only through the unchanged info content; the State equality itself is in the unit tests (T-028 and T-029).
3. SC6: this Task added no generic file (the new files are `src/synthetic/syntheticRingDefinition.ts`, a test, a script), so the existing name check over core, shell and generic app code still covers every generic file and passes. Gates and all six browser scripts passed with zero console errors in the fresh directory `docs/evidence/o009-t029-run1/`. Pass.
4. Design.md reconciled: every T-027 and T-028 drift note is listed under "Groups and the `points` layer (O-009)" as reflected or non-architectural with a reason; camera reach stays named for O-011. Pass.
5. Owner visual judgement, 2026-10-11, in chat: "The ring looks right, performance is shaky though." Recorded as stated: the owner did not say which scales were viewed, or which machine or browser. Owner clarification in chat: camera movement is fine, but the debris ring's own motion looks shaky. Recorded as a finding below, not as acceptance.

**Commands run (from the repo root):** `npm run typecheck` pass; `npm run build` pass; `npm test` 15 files / 236 tests pass (log: `docs/evidence/o009-t029-run1/gates.log`). Dev server on port 5199, then with `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js` and `ASTRAEUS_EVIDENCE_DIR=docs/evidence/o009-t029-run1/<script>`: `browser-shell.mjs`, `browser-spike03.mjs`, `browser-spike02.mjs`, `browser-anchor-labels.mjs`, `browser-synthetic.mjs`, `browser-synthetic-ring.mjs`; all exit 0 with `errors: []` (logs `browser-<name>.log` in the same directory).

**Historical evidence:** the Spike 01/02 regression scripts write to a fixed path under `docs/evidence/regression-spike01-02/` and overwrote three anchor-label files; they were restored from git, so earlier evidence is unchanged. Those scripts do not take an output directory for that path, so their fresh output for this run is only the logs and the other directories listed above.

**Browser regression coverage:** no existing browser script was invalidated; `browser-synthetic.mjs` is unchanged and still passes.

**Extra reads (beyond Context Files):** `src/core/orbitGroup.ts`, `src/core/twoBodyAdapter.ts`, `src/app/PointsView.ts`, `tests/pointsLayer.test.ts` (to build on the T-027/T-028 API; the latter two are T-028 files named in its evidence), `src/shell/ScaleControl.tsx`, `src/shell/InfoPanel.tsx` and `src/app/EarthMoonScene.tsx` by search (selectors for the script).
**Files changed:** `src/main.tsx` (entry choice), `.savepoint/Design.md`; new `src/synthetic/syntheticRingDefinition.ts`, `tests/syntheticRing.test.ts`, `tools/validate/browser-synthetic-ring.mjs`, `docs/evidence/o009-t029-run1/`.

**Finding (owner-reported, not measured here):** the ring's own motion during playback looks shaky; camera movement is fine. Probable cause, consistent with T-027's measured 11.2 ms Earth-centred fill: at the default 600x rate the 60 s refill interval triggers roughly ten fills per real second. The ring therefore moves in steps rather than continuously. Tuning `refillAfterMs` only trades steps against per-fill cost; a smooth fix (for example blending between two fills, presentation-side) is a generic change outside this Task's boundary and needs planning. Not yet measured in a real browser; the Full Objective Check re-measures the refill effect.

**Limitations:** no 10^4 fill re-measure here (Full Objective Check). The Sun-centred belt lies beyond the camera's reach and is test-only. The ring was seen only in headless software-rendered Chromium. The Design.md "Components" row for `tools/validate/` also lists `browser-synthetic.mjs`, which was untracked before this Task.

## Drift Notes

Record architecture deltas here; reconcile Design.md in this Task.
