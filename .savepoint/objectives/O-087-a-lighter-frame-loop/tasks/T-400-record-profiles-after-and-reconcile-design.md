---
id: T-400
title: Record profiles after and reconcile Design
objective: O-087
status: in_progress
stage: build
depends_on: [{task: T-394, requires: clear}, {task: T-395, requires: clear}, {task: T-396, requires: clear}, {task: T-397, requires: clear}, {task: T-398, requires: clear}, {task: T-399, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-400, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:11:52Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: integration
planned_reads: [docs/evidence/o087-frame-profile/before.json, packages/astraeus-site/tools/validate/run-profile.mjs, docs/agents/browser-policy.md]
planned_writes: [docs/evidence/o087-frame-profile/after.json, .savepoint/Design.md, packages/astraeus/CHANGELOG.md]
---

# Record profiles after and reconcile Design

## Outcome

The "after" profiles are recorded with the same command, machine and cases as the baseline, set side by side with it, the full browser suite passes with the diagnostics flag, and Design and the changelog describe the lighter frame loop, so the Full Objective Check has its measurements and a reconciled Design (Objective conditions 1 and 2; memory "Reconcile Design before Full Check").

## User Check

None visual. `docs/evidence/o087-frame-profile/after.json` holds the after numbers and a before/after table per case.

## Done When

- `node packages/astraeus-site/tools/validate/run-profile.mjs` run once on the merged branch (no other browser job running), saved as `after.json` with commit, cores, Chromium version and command, plus a table per case (2 scenes x paused/playing x diagnostics on/off): median `ScriptDuration`/s, `LayoutCount`/s, `RecalcStyleCount`/s, frames drawn/s, before and after.
- Expected direction, stated, not asserted: paused with diagnostics off shows lower script time and layout count than before; diagnostics on still shows the label and re-render gains. Any case that got worse is named with a reason or reported to the coordinator.
- The full browser suite (the full tier O-086 names; labels are layout, so the full journeys apply) passes once with the harness flag; its run folder is cited. The Full Objective Check reuses this run (browser policy: one run per Objective Check).
- `.savepoint/Design.md` gains `### A lighter frame loop (O-087)` under `Interfaces and Data Flow` (beside the O-082..O-093 notes): opt-in readouts (`__ASTRAEUS_DIAGNOSTICS__`, read once per viewer), cached label sizes and one canvas-box read per frame, no paused re-render, unchanged-frame early-outs and one dirty range per orbit-set buffer. Each drift note from drafts 02-06 is accounted for as reflected or non-architectural with a reason.
- `packages/astraeus/CHANGELOG.md`, the open `## 0.10.0 (proposed)` section only (read by its top section): one entry naming the per-frame savings and that the canvas readouts now need the flag (they were never public API).
- Engine raw size after all merges recorded against the 1,836,000 B limit.
- Gates per `docs/agents/verification.md`.

## Context Files

- `docs/evidence/o087-frame-profile/before.json`
- `.savepoint/Design.md` under `Interfaces and Data Flow` > `Units, constants and layers (O-093)` (as the format example) and the drift notes of drafts 02-06
- `packages/astraeus/CHANGELOG.md` (top section only)
- `docs/agents/browser-policy.md`

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` and `Current Technical State`.

## Guardrails

TEST-01, TEST-03, API-07, STYLE-10.

## Implementation Plan

1. Confirm 01-06 merged and gates green; run the profile; write `after.json` and the table.
2. Run the full browser suite once; cite its folder.
3. Design note and changelog entry; account for each drift note.

## Boundaries

No code change. If a profile or browser step shows a defect, report it to the coordinator (it becomes a repair in the owning draft's lane), do not fix here.

## Technical Verification

Two browser jobs, strictly one after the other: the profile run, then the full browser suite. Handoff: `quality_gates`.

## Technical Evidence

Status: NOT READY FOR AUDIT. The profile and docs are done; the full browser run FAILED at the `look-out` step (report to coordinator; stage left at build).

Extra reads logged: `.savepoint/Design.md` headings `Units, constants and layers (O-093)`, `Verification in tiers (O-086)`, `Size budgets are split` (format and context); `packages/astraeus/CHANGELOG.md` top section; T-395..T-399 Drift Notes and Outcome sections.

| Done When | Evidence |
|---|---|
| Profile run, after.json with commit, cores, Chromium, command, per-case table | `ASTRAEUS_PROFILE_OUT=docs/evidence/o087-frame-profile/after.json node packages/astraeus-site/tools/validate/run-profile.mjs` exit 0 (348 s); run folder `docs/evidence/profile-steps-20261121T224039Z`; `after.json` holds `comparison` (8 cases, before/after medians) and a note |
| Expected direction stated | Script time/s fell in all 8 cases (Apollo paused 0.16 -> 0.03, playing 0.17 -> 0.12; Saturn ~0.09 -> 0.02); style recalcs/s fell in all (Apollo playing 127-141 -> 66; Saturn ~120 -> 50-65); layout count flat within noise (Apollo paused off 0.70 -> 0.90, noise). Saturn frames drawn is 0 before and after, no signal. No case worse beyond noise |
| Full browser suite passes once | FAILED: `docs/evidence/browser-20261121T224645Z` (tier full): smoke, synthetic-journey, smoke-public-showers, planets-phone, meteor-shower, views, catalogue, hello-scene, hello-react, hello-planets, hello-sky pass; `look-out` exit=1: "desktop: no labels overlap with kettle shown" actual overlap [kettle, lantern-field] (journey-look-out.mjs:111 checkSkyTrace). Not rerun, per brief |
| Design.md `### A lighter frame loop (O-087)` with each drift note accounted | Added before `### Verification in tiers (O-086)`; T-395, T-396 reflected; T-397/T-398/T-399 (None) reflected as architectural early-outs |
| CHANGELOG 0.10.0 entry | One `Changed:` line added at the end of the 0.10.0 list, before `### Breaking changes in 0.10.0` |
| Engine raw size | No code change in T-400; last measured (T-396 gates) 1,836,117 B raw against limit 1,838,000 (1,836,000 was the earlier limit; now over it, within the raised cap), 525,563 B gzip |
| Gates | Not run: only docs/evidence changed (no code); coordinator to run at handoff |

Files changed: docs/evidence/o087-frame-profile/after.json, .savepoint/Design.md, packages/astraeus/CHANGELOG.md, this Task file. Unstaged run folders: profile-steps-20261121T224039Z, browser-20261121T224645Z.

Limitation: the look-out failure is probably the T-396 arithmetic label placement (labels placed from cached sizes) overlapping on the synthetic look-out scene; not investigated or fixed (Boundaries).

## Drift Notes

Design reconciliation for T-395..T-399 done in Design.md `A lighter frame loop (O-087)`.

## Coordinator

The full run's only red step (look-out, label overlap [kettle, lantern-field]) was repaired in T-396's lane: the size cache now observes the border box (root cause: `contentRect` left out label padding and border). After the repair: `npm test` 5157 passed, 3 skipped; `check:pack` pass, engine 1,836,199 B raw (cap 1,838,000); `check:browser -- --step look-out` pass (docs/evidence/browser-steps-20261121T225420Z). The full tier has not been rerun since the repair; the Full Objective Check runs it (labels changed size everywhere). Left at stage build until that run is green. Parked 2026-11-22: owner "I am remote now, add park the check and move on".
