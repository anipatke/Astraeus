---
id: T-009
title: Validate Spike 02 and write up what Apollo proved
objective: O-002
status: done
depends_on: [{task: T-008, requires: clear}, {task: T-013, requires: clear}]
owner_validation:
    required: true
    accepted_check: C-003
    accepted_by: {role: owner, session: t009-recheck-conversation}
planned_by: {role: planner, session: astraeus-spike-02-planning-2026-10-06}
---

# Validate Spike 02 and write up what Apollo proved

## Outcome

The integrated Spike 02 has current scientific, reconstruction and browser evidence, and a design note that states honestly what the generic Trajectory contract proved, what Apollo needed, and what remains unproven.

## User Check

Read `docs/ASTRAEUS_SPIKE_02.md` and the reconstruction report. Confirm each brief success criterion has evidence, every change is classified UNCHANGED / GENERIC EXTENSION / MISSION-SPECIFIC, and searching `src/core/` for "apollo" (case-insensitive) finds nothing.

## Done When

1. Every O-002 success condition and brief success criterion is evidenced together on final integrated code, with reproducible inputs and outcomes.
2. Reconstruction is re-run, confirmed byte-identical, and its residuals, join misses, interpolation errors and qualitative checks are current in `docs/APOLLO11_RECONSTRUCTION.md`.
3. Browser evidence covers brief sections 15–18 on both scales: close Earth orbit, translunar coast, close lunar orbit, spacecraft focus/follow, return to Earth, rebasing continuity, event jumps and rate changes; plus Spike 01 Earth/Moon regression (orientation, phase, terminators) at the USNO reference dates.
4. `docs/ASTRAEUS_SPIKE_02.md` covers the brief's fourteen design-note items, including the architecture review table, the landing-site vs runtime Moon orientation offset, and a Spike 03 recommendation; no wording claims an exact flight path or accuracy between anchors without evidence.
5. `src/core/` contains no mission-specific naming; any exception is explained in the note.
6. `.savepoint/Design.md` is reconciled to implemented reality; durable follow-up is captured as Issues. Configured gates pass fresh. No Check record is written and no independent CLEAR is claimed; evidence is prepared for the mandatory Full Objective Check in a fresh session.

## Context Files

`docs/ASTRAEUS_SPIKE_02_BRIEF.md`, `.savepoint/objectives/O-002-apollo-11-sampled-trajectory/Objective.md`, `docs/APOLLO11_SOURCES.md`, `docs/APOLLO11_RECONSTRUCTION.md`, `docs/ASTRAEUS_SPIKE_01.md`, `src/core/body.ts`, `src/core/trajectory.ts`, `src/core/sampledTrajectory.ts`, `src/core/provenance.ts`, `src/core/events.ts`, `src/app/EarthMoonScene.tsx`, `src/app/CameraController.tsx`, `src/app/DebugControls.tsx`, `tests/sampledTrajectory.test.ts`, `package.json`, `.savepoint/config.yml`, `.savepoint/Design.md`.

## Design References

Design: all sections (reconciliation).

## Guardrails

TEST-01, TEST-03, TEST-04, STYLE-07.

## Implementation Plan

1. Re-run reconstruction and gates on integrated code.
2. Collect browser evidence for every scenario above.
3. Audit `src/core/` for mission leakage; build the architecture review table.
4. Write the design note; reconcile Design.md; capture Issues.

## Boundaries

Validation and documentation; code fixes only for defects found, recorded as such. No new features.

## Technical Verification

Fresh configured gates at handoff per AGENTS.md; the Full Objective Check follows `agent-skills/references/check-method.md` in an independent session.

## Technical Evidence

**Record status (2026-10-06).** The owner first completed this Task on the board with a Task-check waiver (02:23:04Z), then requested the optional Task Check. C-002 (02:31:56Z) returned **NEEDS WORK** (I-006). The owner reopened T-009 for repair. The waiver was withdrawn from the frontmatter on the owner's instruction, because no valid waiver or clearance exists. There is no `CLEAR` Check and no `accepted_check`. The original evidence below is kept, and the first-pass statements it contained that C-002 found wrong are corrected in "Rework after C-002". The Task went back to `stage: audit` for a fresh Task Check, then through the final pass below. The O-002 Full Objective Check has not been run.

### Final pass after the O-002 recheck (2026-10-06, session o002-recheck-2026-10-06)

Context: an unrecorded O-002 recheck in this session (no Check record written) found the owner-reported jump at lunar orbit insertion, the unapplied T-011 heading defect, stale write-ups and stale browser evidence. The owner chose to fix the jumps (new T-013, planned and built in this session) and then finish T-009. T-009 depends on T-013 (`requires: clear`); T-013 has no Check or waiver yet, so that dependency is unmet until the owner closes T-013. This session planned and built T-013 and did the recheck pass, so it cannot run any Check on O-002.

**Per-criterion outcome (final pass)**

1. **Met, with stated limits.** Spike note "Brief success criteria" and 7, 7.3 restated on the final integrated code (after T-010 to T-013). O-002 SC3: segment starts within 1e-6 km / 1e-6 m/s; raw misses published without threshold; joins smoothed with documented method, magnitude and location (report Segments table, generated `segments`, provenance `accuracy`). SC5: interpolation max 0.157 km. SC6/SC7: browser `scalePairsIdentical` all true, USNO phases unchanged, 58 Spike 01 tests unmodified.
2. **Met.** `npm run apollo11:reconstruct` run twice at the start and twice at the end; combined SHA-256 of `data/apollo11/**` and `docs/APOLLO11_RECONSTRUCTION.md` `b5a198e7ed4c53fc…` every time. The report regenerates residuals, raw misses, corrections, interpolation and qualitative checks.
3. **Met with limits.** `PLAYWRIGHT_CORE=…/planetary-explorer/node_modules/playwright-core/index.mjs node tools/validate/browser-spike02.mjs` against `vite --port 5199` (05:11Z, after all code changes): 0 errors; `scalePairsIdentical` true at all six times (Earth orbit, translunar, Columbia lunar orbit, Eagle surface, return, entry) under both scales; `focusUnchanged` true; 30 event jumps; rates 1× 1.004, 100× 99.9, 1,000× 1,004, 10,000× 10,018; 30-sample follow track at 100× monotone 390,554 → 391,812 km (largest step 77 km); USNO lit 50.1 / 0.2 / 50.1 / 99.8 %. Output overwrote `docs/evidence/spike02-browser.json` and `docs/evidence/spike02/*.png` (T-009's own evidence). `browser-anchor-labels.mjs` (output to scratch, T-012's screenshot left as is): 0 errors, 40 labels, hidden after toggle. Path scan (1 s steps through the runtime `SampledTrajectory`, both vehicles): no step anywhere; the largest local anomaly is inside burn arcs (I-007).
4. **Met.** Spike note updated: status; 1, 4, 5, 6, 7 (raw misses, qualitative, 123 tests); 7.1 marked historical with its finding-2 contradiction resolved; 7.2 marked applied; new 7.3 (T-013 before/after, step check, audit agreement, I-007); 8; 11 (re-run browser figures); 12; 13 (smoothing, heading reading, burn-arc speeds, insertion point, rates, bundle 1.40 MB / 417 kB); 14.1 rewritten. No wording claims an exact path or accuracy between anchors. The 254 km landing offset, review table and 14 items stand.
5. **Met.** `grep -rniE 'apollo|columbia|eagle' src/core` returns 0 lines; T-013 changed no `src/` file.
6. **Met.** `.savepoint/Design.md` reconciled (Components: `tools/validate/` and the reconstruction parts; Current Technical State: dynamics, smoothing, heading reference, current misses, 123 tests, insertion point; open items rewritten). Issues: new I-007 (A-13 longitude, burn-arc speed spikes); `repair_attempted` history on I-001 (document fixed), I-003 and I-006. Gates fresh (below). No Check record written; no CLEAR claimed.

**Also done:** I-001 repair in `docs/APOLLO11_SOURCES.md` 4.1 (constant −14552880000, correction note; `Date.parse` confirmed). Header notes in `tools/validate/anchor-consistency.mjs` and `conversion-proof.mjs` saying their "tool" results now equal the EQJ-north reading and the committed evidence JSON predates T-013 (comments only).

**Owner observation (2026-10-06):** "Columbia launches from the middle of the Atlantic." The path starts at Earth orbit insertion (GET 00:11:39.3) by design; the start point is 33.0°N, 55.5°W, 111 n mi (A-01 integrated backward about 2.5 h). Apollo 11 did reach orbit over the Atlantic, but the sources hold no published insertion position, so the point is unchecked. Recorded in spike note 13 and Design.md as a small follow-up (add the published insertion state as a cross-check); no Issue opened.

**Commands (fresh, 05:27Z):** `npm run typecheck` pass; `npm test` 7 files, 123 tests pass; `npm run build` pass (chunk-size warning only; 1,396.99 kB / 417.16 kB gzip); `git diff --check` clean (vacuous, files untracked); `savepoint resume` strict-loads. Lint: none configured.

**Extra reads (final pass):** `tools/validate/browser-anchor-labels.mjs` (usage); T-012 and T-011 Task evidence (what to re-run, which statements to update); `agent-skills/references/issue-capture.md` (template, search); `data/apollo11/raw/events.json` E-02 (insertion time); `.savepoint/checks/C-002` (earlier, for scope).

**Files changed (final pass):** `docs/ASTRAEUS_SPIKE_02.md`, `docs/APOLLO11_SOURCES.md` (4.1), `docs/evidence/spike02-browser.json`, `docs/evidence/spike02/*.png`, `.savepoint/Design.md`, new `.savepoint/issues/I-007-…`, I-001, I-003, I-006 (history), `tools/validate/anchor-consistency.mjs` and `conversion-proof.mjs` (header comments), this Task, `.savepoint/router.md` (selection).

**Limitations (final pass):** headless SwiftShader only; no human has judged the smoothed arcs, where large corrections make the spacecraft speed up or slow down (A-30>A-31, A-28>A-29). The I-007 burn-arc dash (A-13>A-14, about 650 km in 16.8 s) is visible at 1× when zoomed in on the Moon. The insertion point is unchecked. The committed `anchor-consistency.json` and `conversion-proof.json` were not regenerated (they are T-010/T-011 evidence); re-running them in a scratch copy works and matches the tool.

### Rework after C-002 (I-006)

Scope, per owner: correct the scientific interpretation of the largest misses and audit A-32 to A-35. No architecture change: `SampledTrajectory`, the trajectory contract, ScalePolicy, floating origin, camera, events and provenance types are untouched. No source value or conversion was changed.

1. **Unsupported explanation removed.** The gravity attribution was removed from `docs/ASTRAEUS_SPIKE_02.md` (7, 13, 14.1, 12), `.savepoint/Design.md` (Current Technical State, open items), I-003 (Summary, Proof Needed, history), the provenance `accuracy` text (`tools/apollo11/reconstruct.ts`), and the report's "Known gaps" (`tools/apollo11/report.ts`). The data and report were then regenerated. The replacement wording says the largest return-phase residuals are currently unexplained; it names likely investigation areas and states no cause. `Objective.md` line 80 states this as a planning risk, not a finding, and was left unchanged (planner-owned).
2. **Return-phase audit.** New `tools/validate/anchor-consistency.mjs`, a diagnostic that writes `docs/evidence/anchor-consistency.json` (n-body: Earth J2, Moon, Sun). Table 7-II, 7-I, 7-VI and 3-I were re-read from the NTRS scan of MSC-00171. Findings are in spike note 7.1 and I-006. A-32>A-33 remains **unexplained**, and the Moon-referenced heading convention is a lead only. A-34>A-35 is consistent with a suspected transcription defect in the illegible hundreds digit of the A-33/A-34 speed: 4 074.0 reproduces A-35 within 38 km and the Table 7-VI entry conditions. It is not confirmed and not applied, and adopting it is an owner decision.
3. **Spike 03 recommendation corrected.** A perturbed propagator is no longer presented as the fix for the largest misses (14.1).
4. **Record fixes.** The "within about 2.5%" rate claim was replaced with both runs' figures (executor 1× 1.0; C-002 1× 0.54) and a statement that the method is weak and claims no bound. The status and waiver contradiction is resolved above.
5. **Rendered jump at about GET 150:31:33** (owner question). It is the A-32>A-33 discontinuity between Columbia samples 1313 and 1314 (150:29:56.4 → 150:29:57.4, 25,125 km / 434 m/s). The source state is A-33, Table 7-II p. 7-9 "Second midcourse correction Ignition" (raw → normalised `earthCentred` [-285156.7, -123973.4, -73576.3] km). The samples from A-34 onward are continuous. The readout trails by about a frame at high rates.

**Commands (fresh, after rework):** `npm run typecheck` pass. `npm run build` pass (existing chunk-size warning only). `npm test`: 7 files, 116 tests pass. `npm run apollo11:reconstruct` was run twice after the wording change, and the combined SHA-256 of `data/apollo11/**` and `docs/APOLLO11_RECONSTRUCTION.md` was identical across the two runs (791ce9e4…). Only the text in the provenance `accuracy` fields and the report changed; samples, anchors and discontinuities are unchanged. `node tools/validate/anchor-consistency.mjs` (about 37 s) reproduces C-002's figures. `savepoint resume` strict-loads. Lint: none configured. The browser script was not re-run, because no runtime code changed.

**Extra reads (rework):** `.savepoint/checks/C-002`, I-003, I-006, `agent-skills/references/issue-capture.md` (history rules). `tools/apollo11/anchors.ts`, `frames.ts`, `conventions.ts`, `ephemeris.ts`, `config.json`, `reconstruct.ts`, `report.ts` (conversion audit and wording source). `src/core/astronomyAdapter.ts` (probe dynamics). `data/apollo11/raw|normalised|generated` (anchor and sample tracing). `tools/validate/browser-spike02.mjs` (script conventions). The NTRS PDF 19700008096 was downloaded to scratch only, not into the repo.

**Files changed (rework):** this Task, `.savepoint/router.md` (task selection), `.savepoint/Design.md`, I-003, I-006, `docs/ASTRAEUS_SPIKE_02.md`, `tools/apollo11/reconstruct.ts`, `tools/apollo11/report.ts`, regenerated `data/apollo11/**` and `docs/APOLLO11_RECONSTRUCTION.md` (text only), new `tools/validate/anchor-consistency.mjs` and `docs/evidence/anchor-consistency.json`.

**Limitations (rework):** The source digit in question is illegible on the only scan used. No second source (AFJ or postflight trajectory documents) was consulted. The heading-convention lead was tested numerically but not found in any source. A-30>A-31 (200 km / 1,737 m/s) is also unexplained and was not investigated further. The probe's Earth model is J2 only, with Orb's Moon and Sun.

### Original evidence (first pass, before C-002)

**Per-criterion outcomes**

1. Met, with stated limits. O-002 success conditions and brief criteria are tabulated with evidence in `docs/ASTRAEUS_SPIKE_02.md` ("Brief success criteria"). Evidence is on final integrated code from the commands below.
2. Met. `npm run apollo11:reconstruct` re-run twice (start and end of Task); SHA-256 of every file under `data/apollo11/` identical before and after; `docs/APOLLO11_RECONSTRUCTION.md` regenerated unchanged in content (it is among the outputs). Residuals, misses (4.5 to 44,194 km), interpolation error (max 0.13 km), qualitative checks and the 254 km landing-site offset are current there.
3. Met with limits. `tools/validate/browser-spike02.mjs` (headless SwiftShader Chromium) ran: close Earth orbit, translunar coast, close lunar orbit (Columbia), Eagle on the surface, return coast and entry, each under both scales with follow; focus Earth/Moon/Columbia/Eagle, follow, overview at a fixed time; all 30 event jumps; rates 1×/100×/1,000×/10,000×; 30-sample follow track at 100×; Spike 01 phase readouts at the four USNO dates (50.1, 0.2, 50.1, 99.8 %, identical to Spike 01). 0 console errors. Both-scale scientific readouts identical at all six times; focus changes left readouts unchanged. Output: `docs/evidence/spike02-browser.json`, `docs/evidence/spike02/*.png`.
4. Met. `docs/ASTRAEUS_SPIKE_02.md` has the fourteen numbered items, the architecture review table, the landing-site offset and a Spike 03 recommendation; wording says "educational trajectory reconstruction", never an exact flight path or accuracy between anchors.
5. Met. `grep -rni apollo src/core` returns 0 lines. One generic comment says "spacecraft" (`src/core/body.ts:4`).
6. Met. `.savepoint/Design.md` reconciled (components, interfaces, current state, open items). Issues I-003, I-004, I-005 captured (existing I-001, I-002 left open). Gates fresh below. No code defect was found, so no code was changed.

**Commands run (final, fresh):** `npm run typecheck` pass; `npm run build` pass (existing chunk-size warning only); `npm test` 7 files, 116 tests pass; `npm run apollo11:reconstruct` byte-identical; `grep -rni apollo src/core` 0 lines; `savepoint resume` strict-loads the index. Lint: none configured.

**Files read:** all Context Files except `src/app/CameraController.tsx`, `src/app/EarthMoonScene.tsx`, `tests/sampledTrajectory.test.ts`, `package.json` was read for scripts only, and `docs/ASTRAEUS_SPIKE_01.md` was read for format and USNO dates only. `src/core/body.ts`, `trajectory.ts`, `events.ts`, `provenance.ts`, `sampledTrajectory.ts` (head), `DebugControls.tsx`, `DebugOverlay.tsx`, `App.tsx`, `mission.ts`, `MissionPanel.tsx`, `src/mission/apollo11.ts`, `.savepoint/Design.md`, config read.

**Extra reads (outside Context Files):** `agent-skills/savepoint-task/SKILL.md`, `agent-skills/references/issue-capture.md`, `.savepoint/router.md`, `.savepoint/task-ids.yml` (workflow, Issue format); `.savepoint/Guardrails.md` rule rows; sibling Task files T-006/T-007/T-008 Technical Evidence (to build the review table); `.savepoint/issues/I-001`, `I-002`; `src/app/App.tsx`, `src/app/mission.ts`, `src/app/MissionPanel.tsx`, `src/mission/apollo11.ts` (app wiring and selectors for the browser script); generated data JSON shapes. `/home/user/code/planetary-explorer/node_modules/playwright-core` was used read-only to run the browser script (Astraeus has no browser-driver dependency).

**Files changed:** new `docs/ASTRAEUS_SPIKE_02.md`, `tools/validate/browser-spike02.mjs`, `docs/evidence/spike02-browser.json`, `docs/evidence/spike02/*.png`, `.savepoint/issues/I-003`, `I-004`, `I-005`; edited `.savepoint/Design.md` and this Task. No source or data file changed.

**Limitations**
- Headless software-GL browser; no human judgement of visual jitter. The WebGL canvas cannot be read back, so evidence is screenshots plus DOM readouts. Rate measurement via a whole-second readout is weak: the first pass reported about 2.5% agreement, but C-002 measured 0.54 at 1×, so no accuracy bound is claimed (see the rework section).
- `tools/validate/browser-spike02.mjs` is not part of the configured gates and needs a Playwright install pointed at via `PLAYWRIGHT_CORE`.
- Accuracy between anchors is unsupported: misses of tens of thousands of km are published (Issue I-003); the two largest are unexplained (I-006).
- I-001 (wrong range-zero constant in `docs/APOLLO11_SOURCES.md`) is still open; the tool uses the correct value.
- The architecture review classification relies on the Drift Notes in T-006 to T-008 evidence; no git history exists to diff (all files untracked).
- The Full Objective Check and owner validation are outstanding.

## Drift Notes

Reconcile any architecture delta through the planner before the Full Check.
