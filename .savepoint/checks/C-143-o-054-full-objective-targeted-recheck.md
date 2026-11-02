---
id: C-143
scope: {kind: objective, id: O-054}
result: CLEAR
checked_by: {role: checker, session: o054-recheck2-20261102}
executed_session: o054-repair-2
checked_at: '2026-11-02T08:33:00Z'
health_snapshot: sha256:a0311b61efc012a2f7acfc7808f9423e0cb4f77d948f2e6c57dcf3671d4d3bae
reviewed:
  base_commit: f8646234
  head_commit: 46d73ad0
  files: [packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/tests/selectionCauseDom.test.ts, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: C-142
---

# C-143: O-054 Full Objective Check, targeted re-check after the second repair

This is the targeted re-check of O-054, "Give React and plain apps the same handle" (G-016), after C-142 returned NEEDS WORK on one regression inside I-137. It reviews repair commit `46d73ad0` (`git diff f8646234..46d73ad0`: 6 files, +66/-45), made on the owner's instruction "make the fix" (2026-11-02). Its scope is C-141's frozen scope lock, unchanged: the Objective diff `main..46d73ad0`, Tasks T-240 to T-249 (all `done` with owner Task-check waivers), and C-141's matrix rows 1 to 20. It adds no axis.

**Independence.** This session did not plan, build, coordinate or repair O-054, and did not write C-141 or C-142. It is not a lane (`git rev-parse --git-dir` and `--git-common-dir` both print `.git`). It wrote only:

- gate outputs (`coverage/`, `junit.xml`, `dist/`, scratch folders)
- one official health snapshot
- one browser evidence folder, `docs/evidence/browser-20261102T082653Z/`
- one temporary probe test, `packages/astraeus/tests/zzC143probe.test.ts`, removed before the gates ran (a copy is in the checker scratchpad, `/tmp/claude-1000/-home-user-code-Astraeus/6ace7dd6-3481-4a4c-93b6-30c2035a8bd4/scratchpad/zzC143probe.test.ts`)
- one temporary checkout of `AstraeusShell.tsx` and `App.tsx` at `f8646234`, one planted edit to `AstraeusShell.tsx` and one to `viewerSelection.ts`, each restored with `git checkout HEAD --` and confirmed by `git diff --quiet HEAD -- packages/astraeus/src`
- this record and history entries on I-137 and I-138, which it closes as `verified`

It did not touch `docs/prds/`, `docs/research/`, the three modified G-012/G-013/G-014 `Release.md` files or the router, and it committed nothing.

**Verdict: CLEAR.** The repair fixes C-142's R8 by the general rule, not a special case: the shell's `onSelectionChange` now takes a required `SelectionOrigin` (`"visitor"` | `"move"`), so a path that omits it fails `tsc`. Every selection-change path in `src/shell` and `src/app` names its origin correctly, and each cause was reproduced on a real `Scene`. I-138's proof still holds. Every gate passes.

**Probe source note.** C-142's probe file (`zzC142probe.test.ts`) was no longer in the scratchpad (the folder was empty at the start of this session). V1 and P6a to P6f were rebuilt from C-142's ledger description into an independent probe, `zzC143probe.test.ts`, with the same scene shape plus extra views (a `follow` rule, a `stay` rule, and a framing rule whose target is not yet available).

## Closure Map Of Prior Issues

| Issue | State | Proof |
|---|---|---|
| I-137 (onSelect cause on a drop caused by time; C-142 R8 regression) | **Closed: verified** | R1 to R8 below, on mount and `AstraeusScene`. V1 now gives `[pa visitor, earth host, pb host]` (C-142: `pb visitor`). The two framing rows fail on `f8646234` source and pass on HEAD. An omitted origin fails `tsc` (TS2554). |
| I-138 (listener scan misses viewerSelection; no throwing onSelect case) | **Closed: verified** | R10: planted break B still fails 2 named `listeners.test.ts` cases. Unchanged by the repair. |

**Owner decisions.** No owner acceptance or exception exists on O-054 or its Tasks, and every Task has `owner_validation: {required: false}`. Nothing carries forward, and no `carried_forward` entry is needed. The owner's "make the fix" (2026-11-02) is an instruction to repair, not an acceptance.

**Convergence.** This is the one targeted remediation and re-check that C-142 allowed. No in-scope failure remains, so the cycle ends here.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-141's lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-141 rows re-run; ledger below)
- [x] Finite External-Boundary Matrix (unchanged: `check:react-consumer` registry install)
- [x] Workflow And Side-Effect Check Lock (mount workflow unchanged by the repair; lifecycle suite passes)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advice only; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Selection-Change Path Enumeration (independent)

Source: `grep -rn "setSelectedObjectId\|onSelectionChange\|selectedObjectId\b" src/shell src/app`, then callers of `activatePreset`, `selectObject`, `pickObject`, `chooseMoon` and `seekToEvent`, and `setCamera` in `App.tsx`. `controls.current.selectedObjectId` is written only in `App.updateSelectedObject` (`App.tsx:370-371`). The shell state is written at five sites:

| # | Site | Triggered by | Origin passed | Expected cause | Builder row |
|---|---|---|---|---|---|
| 1 | `selectObject` (`AstraeusShell.tsx:326-327`) | object menu (`ObjectControls` `onSelectObject`) | `visitor` | visitor | (1) |
| 2 | `activatePreset` (`:348-349`) | Focus/Follow buttons, `chooseMoon` (moon panel), `pickObject` (canvas pointer through `controls.onPickObject` -> `requestPick`, `App.tsx:327,338`), `seekToEvent` (timeline event) | `visitor` | visitor | (2) |
| 3 | mirror effect (`:250-252`) | any `selectedObjectId` state change | `visitor` | never reports: every site that sets the state calls `onSelectionChange` first, so `changed` is false | (3) |
| 4 | fallback drop in the move-driven effect (`:261-262`) | `snapshot.timeUtcMs` or `viewId` (and `experience`, `activePresetId`) change | `move` | last mover | (4) |
| 5 | `applyViewRule` framing target (`:291-292`) | only called from the move-driven effect (`:271`) | `move` | last mover | (5) |

The initial `useState` selection is not published (it waits for the attach reading). Host `setCamera` writes only `controls.current.cameraRequest` (`App.tsx:417`) and never touches the selection. The `experience` change through `starStatus` or `runtime.sky.visible` reaches only site 4 (builder row 6, C-142 O2), outside the lock. The builder's table is complete, and each cause is right.

## Admission Ledger And Results

Probe: `zzC143probe.test.ts`, a real `Scene` and real `prepareScene` (only the 3D canvas and the star catalogue are stubbed; fake `setInterval` and `performance`). The scene has `earth`, path `pa` (30 minutes from T0), path `pb` (full span), path `pc` (days 50 to 60), views `a` (pa), `b` (pb, `camera: {focus: "pb"}`), `c` (pb), `f` (pb, `camera: {follow: "pb"}`), `s` (pb, `camera: "stay"`), `late` (pc, `camera: {focus: "pc"}`), and a 100-day timeline. Command: `npx vitest run packages/astraeus/tests/zzC143probe.test.ts --silent=false`. 34 of 34 passed (rows record and do not assert). Identical output on both paths, so it is shown once.

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result | Actual (mount and AstraeusScene) | Result |
|---|---|---|---|---|---|---|
| R1 | P6a host `setTime` past the end | I-137 | C-141 row 13 | `host` | `[pa visitor, earth host]` | Pass |
| R2 | P6b playback past the end, started by host `setPlaying(true)`; P6b2 by the visitor's Play button | I-137 | row 13 | `playback` | both `[pa visitor, earth playback]` | Pass |
| R3 | P6c visitor seek past the end after a host move | I-137 | row 13 | `visitor` | `[pa visitor, earth visitor]` | Pass |
| R4 | P6d visitor pick after a host move | repair claim | row 12 | `visitor` | `[pa visitor, earth visitor]` | Pass |
| R5 | P6e host `setView` drop, then a visitor view drop | I-137 Proof Needed | row 12 | `host`, then `visitor` | `[pa visitor, earth host, pa visitor, earth visitor]` | Pass |
| R6 | P6f no change (same pick, a host move that keeps the path, `setPlaying(false)` again, 2 s of ticks) | row 12 "no change" | row 12 | no report | `[pa visitor]` | Pass |
| R7 | V1 host `setView("b")` while the camera focuses `pa` (C-142 R8) | I-137, C-142 R8 | row 12 (view drop by host) | every report `host` | `[pa visitor, earth host, pb host]`; visitor switch: `[pa visitor, earth visitor, pb visitor]` | **Pass** |
| R8 | V1 bypass forms of the same rule: `follow` rule (V2), `stay` rule (V3), a framing target not available now (V4), the host switch while playing then 3 s of ticks (V5), a visitor pick after it (V6), a visitor seek that keeps `pb` (V7) | I-137 Proof Needed; repair claim (every move path marked) | row 12 | host switch -> `host`; visitor move -> `visitor`; no extra report | V2 `[pa visitor, earth host, pb host]` (visitor: all `visitor`); V3 `[pa visitor, earth host]`; V4 `[pa visitor, earth host]`; V5 `[pa visitor, earth host, pb host]`, nothing more; V6 `[..., pb host, earth visitor]`; V7 `[..., pb host]`, nothing more | Pass |
| R9 | Red before / green after, and the type guard | repair claim | rows 12 and 13 | the framing rows fail on old source; an omitted origin fails `tsc` | With `AstraeusShell.tsx` and `App.tsx` at `f8646234`: `selectionCauseDom` fails exactly the 2 "host setView to a view whose camera rule frames another object" rows (50 passed), and the probe's V1 and V2 give `pb visitor`. On HEAD: 18 of 18. Planted `onSelectionChange(target.id)` at `AstraeusShell.tsx:292`: `npm run typecheck` gives `error TS2554: Expected 2 arguments, but got 1.` | Pass |
| R10 | Planted break B: `ViewerSelection.publish` loops over its own listeners | I-138 | row 8 | a named test fails | `listeners.test.ts` + `lifecycle.test.ts`: 2 failed, 42 passed (the scan names `viewerSelection.ts`; the throwing-onSelect link case fails) | Pass |
| R11 | Rows 1 to 7, 9 to 12 and 14 to 20 | C-141 | rows as listed | unchanged | Every suite behind them passes in both `test:full` runs (191 files, 2351 passed, 1 skipped). `check:browser` passes (row 18, the hello-react step) | Pass |

One extra row was recorded and is not blocking: V8, a host `setRate` while playing, then a drop on the next tick, reports `playback`. The tick moved the clock after the host call, so this matches the documented rule ("whatever last moved them").

## Issues

None. No materiality actions are required.

## Gates

All run on HEAD `46d73ad0`, with the probe file removed. Logs are in the checker scratchpad (`gate-*.log`, `full1.log`, `full2.log`, `browser.log`).

| Command | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 |
| `git diff --check main...HEAD` | clean |
| `npm run test:full` #1 (08:23:19-08:24:30Z) | 191 files passed, 2351 passed, 1 skipped; Lines 94.68%; exit 0 |
| `npm run test:full` #2 (08:24:30-08:25:39Z) | 191 files passed, 2351 passed, 1 skipped; Lines 94.68%; exit 0; no flaky case |
| `npm run check:engine-alone` | pass in 21.5 s |
| `npm run check:pack` | pass (14.3 s) |
| `npm run check:node-consumer` | pass |
| `npm run check:react-consumer` | pass; newest and installed react 19.3.1; `AstraeusScene` server render |
| `node tools/build-example.mjs hello-react` | exit 0, from `astraeus-0.7.0.tgz` |
| `npm run check:browser` (once, 08:26:53-08:32:41Z, HEAD 46d73ad0) | exit 0. Smoke, smoke-public-showers, planets-phone, meteor-shower, views (a visitor switch and a host `setView`), hello-scene, hello-react, public-build-assets and public-addresses all `exit=0`, `error-lines=0`; total 348 s. Evidence `docs/evidence/browser-20261102T082653Z/`; logs `/tmp/astraeus-check-logs-dCOBpX` |

## Code Health

`savepoint health check O-054` ran right after the second `test:full` (08:25:46Z). It created snapshot `sha256:a0311b61efc012a2f7acfc7808f9423e0cb4f77d948f2e6c57dcf3671d4d3bae`. The verdict was "Code Health does not block clearance". Complexity, coverage, dependency vulnerabilities, duplication and tests are all optional, and none reports a blocking finding. This is supporting evidence only.

## File Reality

Every file named in the second repair entry exists: `AstraeusShell.tsx` (exports `SelectionOrigin`), `App.tsx`, `viewerPort.ts`, `selectionCauseDom.test.ts` (9 rows x 2 paths) and `Design.md` (T-247 note names the required origin). There are no phantom files.

## Observations (non-blocking)

- **O1. Experience-driven drop (outside the frozen lock; C-142 O2, builder row 6).** A change of `experience` through `starStatus` or `runtime.sky.visible` (`App.tsx:260`) that removed the selected object would reach site 4 and take the last mover's cause. No probe was run, because the lock's axis is "menu, view switch, time". It is not in scope and is not a credible blocker. It is recorded for follow-up only.
- **O2. Two reports for one framing switch (in scope, not an Issue).** A switch to a framing view reports the fallback first (`earth`) and then the framing target (`pb`), both with the same cause. Pre-repair source gave the same two reports (C-142 R8), and `selected` settles on the target. A host may see a brief intermediate object.
- **O3. Interface spelling.** The shell passes `origin`, and `ViewerPort.publishSelection` still takes a boolean `byMove` (`App.tsx:372` converts). This is internal (not public surface) and consistent. A later tidy-up could pass the origin through.
- **O4. Record hygiene (not in scope).** I-137's second `repair_attempted` entry is stamped `2026-11-02T09:00:00Z`, but commit `46d73ad0` is `2026-11-02T08:20:07Z` and this Check ran at 08:2xZ. The entry is future-dated by about 40 minutes. This does not affect the evidence.
- **O5. C-142's probe file was not kept.** The scratchpad copy that C-142 cites was gone. A later Check that wants a byte-for-byte rerun should keep probes under a cited evidence path, not a temporary scratch folder.

## Owner Validation Still Needed

None is required by the Tasks. With this CLEAR, I-137 and I-138 resolved as `verified`, and all ten Tasks `done`, the owner may close O-054. The branch `o054-one-handle` is not merged.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**: `selectionCauseDom.test.ts` is now one row per selection path on both embeddings. The experience-driven drop (O1) is not driven, which is outside the lock.
- [x] STYLE-04 **Types document intent**: the required `SelectionOrigin` makes the choice explicit and checked by `tsc`.
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**: the cause comes from the link's last mover; the shell names only the origin.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**: 6 files, +66/-45.
