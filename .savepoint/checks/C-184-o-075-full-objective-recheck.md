---
id: C-184
scope: {kind: objective, id: O-075}
result: NEEDS WORK
checked_by: {role: checker, session: o075-recheck-20261116}
executed_session: i179-repair
checked_at: '2026-11-16T08:30:00Z'
health_snapshot: sha256:83871cb28286ac9b552d3901f8629b36b497f99faaad7dd269237e992a200338
reviewed:
  base_commit: e2d24d96
  head_commit: 189c821f
  files: [packages/astraeus/src/shell/storyPanels.ts, packages/astraeus/src/shell/useStoryPanels.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/tests/storyPanelClose.test.ts, packages/astraeus/src/api/planTimeline.ts, packages/astraeus/src/app/displaySwitches.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/objectives/O-075-panels-controls-and-reads/Objective.md]
  dependencies: []
issues: []
unmet: [O-075-SC1, T-317-DW2-close-rule]
supersedes: C-183
---

# C-184: O-075 Full Objective re-check after I-179 repair

Fresh session; I did not plan, build or repair O-075, T-317..T-319 or I-179. Re-check after remediation (check-method.md) against C-183's frozen scope lock and coverage matrix. Repair diff `git diff e2d24d96..HEAD` (HEAD 189c821f, commit "I-179 repaired"). `AstraeusShell.tsx` is listed as relied-on runtime (its `openPanelFromTimeline` and `applyPanelRequest` call the changed hook); it is unchanged.

## Closure Map Of Prior Issues

| Issue | State after this run |
|---|---|
| I-179 | **Still open.** Its three Proof Needed bullets hold (below), but the repair broke frozen C-183 matrix row 7 (same rule, same files, same symptom: an open moment panel that forward playback carries past its close moment never closes). Recorded on I-179 as recurring evidence (issue-capture: a recurring problem reuses the same id), not as a new Issue. Not closable as `verified` without a `CLEAR` Check. |

## Admission Ledger

| # | Re-check item | Prior Issue / remediation claim | Frozen cell (C-183) | Allowed result | Result |
|---|---|---|---|---|---|
| A1 | Span shorter than one frame closes, cause playback | I-179 Proof 1 | row 5 | blocking | pass: repair DOM test + probe P1 (C-183 repro, span 1 s, 9 ticks): changes end `{id:null, cause:"playback"}` |
| A2 | Speed raised after opening closes | I-179 Proof 1 | row 5 ("any span after the visitor raises the speed") | blocking | pass: repair DOM test "closes after the speed is raised" |
| A3 | Forward / seek past / rewind / paused / no span table | I-179 Proof 2 | row 1 | blocking | pass: original 16-row `MOVES` table unchanged in the diff (additions only) and green; new state-test table green |
| A4 | Stop exactly on end | I-179 Proof 2 | row 2 | blocking | pass (unchanged test, green) |
| A5 | DOM 20 s span closes; no span never closes | I-179 Proof 2 | row 3 | blocking | pass (unchanged tests, green) |
| A6 | Hold (`pauseSeconds`) then resume | repair path (`armedId` on crossing) | row 4 | blocking | pass: probe P2, span 1 s, `pauseSeconds: 2`: opens paused, resumes, closes with cause playback |
| A7 | Marker reopen after close moment, then play | I-179 adjacent case; Proof 3 | row 6 | blocking (docs must state the rule) | pass: stays open (repair DOM test); README and CHANGELOG state it |
| A8 | Panel opened from the timeline track/event list (seeks to its time), then play | repair changes the arming of every `open` | **row 7** ("rule applies as rows 1-3") | blocking | **fail**, see Findings |
| A9 | Host `setPanel` before the close moment, then play | repair `open(id, "host")` arms | row 7 neighbour (host path named in row 7's README rule) | observation | probe H1: closes, cause playback |
| A10 | `timeline.pacing` nested `near` frozen | C-183 observation | row 22 | observation | fixed (`Object.freeze` in `planTimeline.ts`); full gate green |
| A11 | `displaySwitches.ts` label comment | C-183 STYLE-08 note | Code Style | observation | fixed |
| A12 | Rows 8-24 (bad values, SC2-SC6) | untouched by the repair (no changed file in their paths except the two comment/freeze lines above) | rows 8-24 | blocking | pass: carried from C-183, full gate green at HEAD |

## Findings

**A8, frozen row 7, O-075 SC1 / T-317 close rule (recorded on I-179).** `openPanelFromTimeline` (`packages/astraeus/src/shell/AstraeusShell.tsx:333-336`) calls `seek(panel.timeUtcMs)` then `story.open(panel.id)` in one handler. The repaired `open` (`packages/astraeus/src/shell/useStoryPanels.ts:77-83`) decides `armedId` from `latest.current.snapshot.timeUtcMs`, the clock of the last render, i.e. the time **before** the seek. So the arming of a panel opened from the timeline depends on where the clock was before the jump, not where it is when the panel opens:

- Probe L1 (span 20 s, pauseSeconds 0): play through the panel (opens, closes, cause playback), clock reaches T+59 s; press the track marker "Open story panel: ..." → clock jumps to T (0 s past the panel's time, before its close moment), panel open, playing. Ten 100 ms ticks carry the clock to T+60 s: **the panel stays open** (changes end `{id:"marker-loop", cause:"visitor"}`, no close).
- Probe L2 (same, but the clock was at T-50 s before the press): the same press then the same play **closes** it (`{id:null, cause:"playback"}`).

Expected (SC1: "once forward playback passes the panel's time plus that span, an open moment panel closes by itself"; and the coordinator's repaired rule: a panel opened while the clock is before its close moment is armed): after L1's press the clock is at T, so forward playback to T+60 s closes it, as it did before the repair (C-183 row 7 passed). Actual: stays open. README (`setStoryPanelPlayback` row, "a visitor reopening it from its marker or the list after the span") and CHANGELOG ("reopening it from its marker or the list") describe the list case as staying open, but a list press never leaves the clock past the span (it seeks to the panel's time), and L2 shows the code does not apply that consistently either. Test gap: the new DOM tests reopen only by marker (`requestPanel`, no seek); no test opens from the timeline track.

Diagnosis (why the re-check found a new failure): the repair moved the decision from the tick (where the clock is current) to `open`, which reads a render-time snapshot; the only caller that seeks then opens in one handler is the timeline track. The tracker is already re-based by `noteSeek` before `open` runs, so the current clock is available there. Narrow, one-file fix; no plan needed.

## Acceptance Classification

- O-075 SC1 / T-317 close rule: **Issue** (I-179, row 7 regression). One-frame span, raised speed, hold, marker reopen, table rows: Proven.
- SC2, SC3, SC5, SC6: Proven (unchanged since C-183; full gate green).
- SC4: Proven for top bar and switch panel; the Developer drawer part is now covered by owner decision D4 (below).

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-179 (row 7 regression) | Low-Medium: a visitor replaying a panel from the timeline track or event list after playback passed it, a natural "show me that again" action | Medium: the panel then stays over the scene for the rest of playback, the F-18 symptom; outcome depends on a hidden prior clock position | Medium | Fix now under I-179 (targeted remediation; this is the convergence limit's one remaining round): arm in `open` against the clock after any seek (the re-based tracker time, or the time passed by the caller), add DOM tests for a timeline-track open after and before the span, and correct the README/CHANGELOG "or the list" wording. Or the owner decides list reopen always stays open, and then the code must do that regardless of the prior clock and the docs must say so. |

## Gates

All at HEAD 189c821f, repo root, this session (UTC):

- `npm run test:full` (08:26:21Z to 08:27:33Z): pass, 263 files, 4035 tests, 0 failures, 2 skipped; fresh `coverage/coverage-final.json` and `junit.xml` (08:27:33Z). Coverage statements 92.96%, branches 89.66%.
- `savepoint health check O-075` (08:27:46Z, after the full gate): snapshot `sha256:83871cb2…200338` (created); "Code Health does not block clearance"; complexity, coverage, dependency vulnerabilities, duplication, tests reported with no blocking finding.
- `npm run lint` pass (08:28:01-05Z); `npm run typecheck` pass (08:28:05-12Z); `npm run build` pass (08:28:12-14Z).
- `npm run check:engine-alone` pass (08:28:14-38Z); `npm run check:pack` pass (08:28:38-55Z); `npm run check:node-consumer` pass (08:28:55Z-08:29:00Z); `npm run measure:example` pass (first-open total 1,773,001 B raw / 510,087 B gzip).
- `git diff --check e2d24d96..HEAD` and `main...HEAD`: clean.
- `npm run check:browser`: **not rerun; C-183's run reused** (2026-11-16T08:13:53Z to 08:19:22Z, all 12 steps passed, `docs/evidence/browser-20261116T081353Z`). The repair changed no browser script or page wiring; it changed the shell's story-panel hook and two read/comment lines, whose behaviour is covered by the DOM tests and probes above. No browser step exercises `closeAfterSeconds`.
- Probes: temporary `packages/astraeus/tests/zzCheckI179Probe.test.ts` (L1, L2, H1, P1, P2) run with `npx vitest run`, deleted before the full gate; working tree left as found.

## File Reality

Every file named in I-179's repair entry exists at HEAD and is in the diff (`storyPanels.ts`, `useStoryPanels.ts`, `storyPanelClose.test.ts`, README, CHANGELOG, `planTimeline.ts`, `displaySwitches.ts`). No phantom file.

## Design Reconciliation

Design.md's O-075 paragraph says the close rule "closes once forward playback passes its time plus closeAfterSeconds"; the repair did not touch it. The repaired rule (armed panels, never on the opening tick, panels opened at or past the close moment stay open) is a refinement the planner should reflect there when I-179 is closed.

## Owner Decisions Assessed

- D4, switch labels not in the Developer drawer (owner, 2026-11-16T08:20:48Z, Objective Design Decisions): applies; covers C-183 row 19 and SC4's drawer wording. The repair changed only the internal comment to match it. Recorded as an Objective Design Decision, not a structured `exception`; no `carried_forward` entry written.
- API page gzip limit 45,000 B (owner, T-318): applies; unchanged scope, page under it in the full gate.
- T-318 owner look "looks good" (2026-11-15T10:29:23Z): applies; camera choices and switch labels unchanged by the repair. T-318 still has `owner_validation: {required: true}` with no `accepted_check`; the owner may record it against a later CLEAR Check.

## Owner Validation Still Needed

- None for looks. Optionally, the owner's call on whether a panel reopened from the timeline track after playback passed it should close or stay open (see Materiality).

## Observations (non-blocking)

- I-179's `repair_attempted` history entry is stamped `2026-11-16T09:00:00Z`, later than this re-check (08:26Z onward); the time looks made up rather than taken from `date -u`.
- C-183's remaining observations (`timeline.pacing` span-end naming; `Scene.look` `sunGlow` for `addBody` Suns only) stand unchanged.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function** — `panelCloseMs`, `panelArmedAt`, `panelSpanPassed` split cleanly.
- [ ] STYLE-03 **Test branches** — no test opens a panel from the timeline track (seek then open), the branch A8 fails on.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why** — `displaySwitches.ts` comment now matches D4.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**

## Handoff

`NEEDS WORK` on I-179 (row 7 regression) only. This is the convergence limit's one targeted remediation round: a direct repair under I-179 (`savepoint-task` under `issue-capture.md`), T-317 stays done, then one targeted re-check of A1-A9 against this ledger. If that re-check still fails in scope, stop and ask the owner.
