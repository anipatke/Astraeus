---
id: C-185
scope: {kind: objective, id: O-075}
result: CLEAR
checked_by: {role: checker, session: o075-recheck2-20261116}
executed_session: i179-repair-2
checked_at: '2026-11-16T08:38:30Z'
health_snapshot: sha256:c7182f1a410fd2370be4f8bd53f0c61fde04e97e071322c9ac46c221a9976344
reviewed:
  base_commit: 524b59bb
  head_commit: bfb93558
  files: [packages/astraeus/src/shell/useStoryPanels.ts, packages/astraeus/src/shell/storyPanels.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/app/App.tsx, packages/astraeus/tests/storyPanelClose.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
  dependencies: []
issues: []
supersedes: C-184
---

# C-185: O-075 Full Objective re-check after the second I-179 repair

Fresh session; I did not plan, build or repair O-075, T-317..T-319 or I-179. Targeted re-check after remediation (check-method.md) against C-183's frozen scope lock and C-184's admission ledger (A1-A9), with the further Proof Needed C-184 added to I-179. Repair diff `git diff 524b59bb..HEAD` (HEAD bfb93558): `CrossingTracker.timeUtcMs` getter (`storyPanels.ts:64-65`), `useStoryPanels.open` arms from it instead of the render snapshot (`useStoryPanels.ts:77-83`), three tests, README and CHANGELOG wording. `AstraeusShell.tsx` (`openPanelFromTimeline`, `seek`, `applyPanelRequest`) and `App.tsx` (`hostSeekTo` -> `storySeekNote`) are unchanged, read as the callers of the changed function. This is the last re-check in the convergence limit.

## Closure Map Of Prior Issues

| Issue | State after this run |
|---|---|
| I-179 | **Closed, `verified`.** Original Proof Needed and the further Proof Needed from C-184 hold; no frozen cell fails. |

## Rule Judged

Coordinator's rule: a panel is armed when it opens while the clock, read after any jump the open makes, is before its close moment; it closes on the first forward-playing tick after its opening tick ending at or past that moment; a panel opened at or past its close moment without moving the clock stays open until closed. Against O-075 SC1 ("once forward playback passes the panel's time plus that span, an open moment panel closes by itself"): every panel forward playback carries from before its close moment to past it now closes, whatever opened it; the stays-open case is a panel opened when the span has already passed, which the README and CHANGELOG state.

## Admission Ledger

| # | Re-check item | Prior Issue / claim | Frozen cell (C-183) | Allowed result | Result |
|---|---|---|---|---|---|
| A1 | Span shorter than one frame closes, cause playback | I-179 Proof 1 | row 5 | blocking | pass: probe P1 (C-183 repro, span 1 s, 9 ticks) ends `{id:null, cause:"playback"}`; repair-1 DOM test green |
| A2 | Speed raised after opening closes | I-179 Proof 1 | row 5 | blocking | pass: DOM test "closes after the speed is raised" green |
| A3 | Forward / seek past / rewind / paused / no span table | I-179 Proof 2 | row 1 | blocking | pass: `MOVES` and state-test tables unchanged in this diff (additions only) and green |
| A4 | Stop exactly on end | I-179 Proof 2 | row 2 | blocking | pass (unchanged test, green) |
| A5 | DOM 20 s span closes; no span never closes | I-179 Proof 2 | row 3 | blocking | pass (unchanged tests, green) |
| A6 | Hold (`pauseSeconds`) then resume | repair path | row 4 | blocking | pass: probe P2 (span 1 s, `pauseSeconds: 2`): opens held, resumes, closes, cause playback |
| A7 | Marker reopen after close moment (no seek), then play | I-179 Proof 3 | row 6 | blocking (docs state rule) | pass: probe A7 and repair-1 DOM test stay open; README and CHANGELOG say "from its scene marker" stays open |
| A8 | Panel opened from the timeline track/event list (seeks to its time), then play | C-184 further Proof Needed | **row 7** | blocking | **pass**, see below |
| A9 | Host `setPanel` before / at-or-past the close moment, then play | row 7 neighbour | row 7 (README host rule) | observation | H1 (before): closes, cause playback; H2 (past, no seek): stays open, as README states |

### A8 detail

Probes through `tests/domSetup.ts` `mountShell` (temporary `packages/astraeus/tests/zzCheckC185Probe.test.ts`, deleted before the full gate):

- L1, C-184's failing scenario (span 20 s, `pauseSeconds: 0`): play through `marker-loop` (opens, closes, cause playback) to T+59 s; press the track button "Open story panel: ..." -> clock at T, panel open; ten 100 ms ticks to T+60 s -> **closes**, changes end `{id:null, cause:"playback"}`. (C-184: stayed open.)
- L2, same press with the clock at T-50 s: closes, cause playback.
- L3, span 1 s (shorter than one frame): play through, track press, `advance(0)` keeps it open (no forward movement), next 100 ms tick closes it, cause playback; not on the opening tick.
- L4, track press while paused at T+59 s: stays open over five paused ticks; Play then closes it, cause playback.
- R1, track press at T+59 s, then rewind (negative rate) ten ticks: stays open (rewind never closes).
- L5, track press then the first render: open, cause visitor.

Old-code control: with `useStoryPanels.ts` temporarily restored to 524b59bb, the repair's new DOM test "closes when opened from the track after playback passed its close moment" and probes L1, L3, L4 fail; restored to HEAD (`git checkout HEAD -- ...`, `git status` clean for tracked files) before the gate. So the new test pins the regression.

Every open path reads the same clock: the track and event list both call `openPanelFromTimeline` (`TimelineBar.tsx:132` `onPanelOpen`; `AstraeusShell.tsx:333-336`), which runs `seek` -> `story.noteSeek` (rebases the tracker) before `story.open`; a host `setTime` goes through `hostSeekTo` -> `storySeekNote` before the clock seeks (`App.tsx:490-494`), and a host `setPanel` or marker press reaches `open` from the `panelRequest` effect after render, when the tracker already holds the rendered clock. Steps (Back/Next, step marker, host step) are not in the moment-panel list, so `armedId` is null for them as before. The getter returns `#previousMs`, which `rebase` and `advance` set, so it is the clock as panel logic last saw it; a tracker-vs-clock lag only exists between a render and its effect, where no event handler runs.

## Acceptance Classification

- O-075 SC1 / T-317 close rule: **Proven** (A1-A8; one-frame span, raised speed, hold, marker and host reopen, timeline reopen from before and after the span).
- SC2, SC3, SC5, SC6: Proven (no file in their paths changed since C-184; full gate green).
- SC4: Proven for top bar and switch panel; the Developer drawer part is covered by owner decision D4.

No Issues; no materiality actions are required.

## Gates

All at HEAD bfb93558, repo root, this session (UTC, `date -u`):

- `npm run test:full` (08:35:00Z to 08:36:13Z): pass, 263 files, 4036 passed, 2 skipped, 0 failures; coverage statements 92.96%, branches 89.66%; fresh `junit.xml` and coverage.
- `savepoint health check O-075` (08:36:18Z, after the full gate): snapshot `sha256:c7182f1a…9976344` (created); "Code Health does not block clearance"; complexity, coverage, dependency vulnerabilities, duplication, tests: no blocking finding.
- `npm run lint` pass (08:36:33Z); `npm run typecheck` pass (08:36:37Z); `npm run build` pass (08:36:43Z).
- `npm run check:engine-alone` pass (08:36:46Z); `npm run check:pack` pass (08:37:10Z); `npm run check:node-consumer` pass (08:37:24Z); `npm run measure:example` pass (08:37:29Z, first-open total 1,773,029 B raw / 510,085 B gzip).
- `git diff --check 524b59bb..HEAD` and `main...HEAD`: clean.
- Focused: `npx vitest run tests/storyPanelClose.test.ts` plus the temporary probe file, green at HEAD.
- `npm run check:browser`: **not rerun; C-183's run reused** (2026-11-16T08:13:53Z to 08:19:22Z, all 12 steps passed, `docs/evidence/browser-20261116T081353Z`). The repair changed one read inside the shell's story-panel hook and added a getter; no browser script, page wiring or rendered markup changed, and no browser step exercises `closeAfterSeconds`. The changed behaviour is covered by the DOM tests and probes above.

## File Reality

Every file named in I-179's second `repair_attempted` entry exists and is in the diff (`storyPanels.ts`, `useStoryPanels.ts`, `storyPanelClose.test.ts`, README, CHANGELOG). No phantom file. The probe file was deleted; tracked tree unchanged by this run.

## Design Reconciliation

Design.md's O-075 paragraph ("a moment panel closes once forward playback passes its time plus `closeAfterSeconds` ... decided by the pure `panelSpanPassed`") is still accurate in outline but does not name the arming refinement (`panelArmedAt`, the tracker clock read after a jump, panels opened at or past the close moment stay open). Non-blocking, as in C-184: the planner should add one clause when reconciling after I-179's close.

## Owner Decisions Assessed

- D4, switch labels not in the Developer drawer (owner, Objective Design Decisions): applies; scope unchanged by this repair (no switch or drawer file touched). Recorded as a Design Decision, not a structured `exception`; no `carried_forward` entry written.
- API page gzip limit 45,000 B (owner, T-318): applies; unchanged scope, full gate green.
- T-318 owner look "looks good" (2026-11-15T10:29:23Z): applies; camera choices and switch labels unchanged. T-318 still has `owner_validation: {required: true}` with no `accepted_check`.

## Owner Validation Still Needed

- T-318: the owner may record `owner_validation.accepted_check: C-185` (looks already approved 2026-11-15). Needed before the Objective closes.

## Closure Readiness

`CLEAR`. I-179 closed `verified` by this Check. Every owned Task (T-317, T-318, T-319) is `done`; once the owner records T-318's acceptance, the owner may accept O-075.

## Observations (non-blocking)

- The repair test "closes when opened from the track after playback passed its close moment" sets up "after playback passed" with `m.clock.seek` (bypassing `noteSeek`), not by playing through; probe L1 covers the played-through path.
- I-179's second `repair_attempted` entry (08:31:26Z) precedes its commit bfb93558 (2026-11-16T08:33:25Z); the times are consistent.
- C-183's remaining observations (`timeline.pacing` span-end naming; `Scene.look` `sunGlow` for `addBody` Suns only) stand unchanged.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function** — one getter and one changed read.
- [x] STYLE-03 **Test branches** — the timeline-track open branch C-184 named is now tested from before and after the span.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — arming and the crossing check read the same tracker clock.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — 3 source lines changed plus tests and docs.

## Handoff

`CLEAR`. No remediation. Owner: record T-318's acceptance against C-185, then accept O-075 and commit; the planner may add the arming clause to Design.md.
