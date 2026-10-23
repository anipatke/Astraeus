---
id: C-101
scope: {kind: objective, id: O-031}
result: CLEAR
checked_by: {role: checker, session: o031-recheck-20261023}
executed_session: o031-orchestration-20261023
checked_at: '2026-10-23T00:32:00Z'
reviewed:
  base_commit: 25a80143
  head_commit: bcd57499
  files: [tools/validate/driver.mjs, tools/validate/journey-meteor-shower.mjs, docs/BROWSER_CHECKS.md, docs/evidence/browser-20261023T002726Z/summary.txt, docs/evidence/browser-20261023T002726Z/meteor-shower/results.json, docs/evidence/browser-20261023T002726Z/smoke/results.json, docs/evidence/browser-20261023T002726Z/smoke-public-showers/results.json, docs/evidence/browser-20261023T002726Z/planets-phone/results.json, .savepoint/issues/I-073-the-browser-command-proves-wake-on-a-wheel-turn-not-on-a-tap.md]
  dependencies: []
issues: []
supersedes: C-100
---

# C-101: O-031 Full Objective Recheck

Targeted recheck after remediation of I-073, superseding C-100. Owner decision 2026-10-23 after C-100: "Add the tap, short recheck". This session is independent: it did not plan, build, coordinate, repair or mark any O-031 work, and did not write C-100. It uses C-100's frozen scope lock unchanged; no new axis or interpretation is added. All times are `date -u` output.

**Verdict: CLEAR.** The browser command now rests the scene, taps the canvas through the driver and asserts more frames drawn (afterTap 73 over idleAgain 68). Everything C-100 proved is unchanged: no file under `src/`, `tests/`, the configs or the gate definitions changed since 25a80143, and the fresh full gate reproduces C-100's counts and coverage exactly.

## Closure Map Of Prior Issues

| Issue | Status after this recheck |
|---|---|
| I-073 (SC2 tap clause; T-149 Done When) | **Closed** as `verified` by this Check |

## Diff Since C-100

`git diff --stat 25a80143 bcd57499` (HEAD; working tree clean at 00:29Z): `tools/validate/driver.mjs` +8 (new `tapCanvas`), `tools/validate/journey-meteor-shower.mjs` +6/-3 (rest, wheel, rest again, tap, `waitForMoreFrames`), `docs/BROWSER_CHECKS.md` one line (names the tap), the I-073 history entry, and the new evidence folder `docs/evidence/browser-20261023T002726Z`. `git diff --name-only 25a80143 HEAD -- src tests package.json package-lock.json vite.config.ts eslint.config.js .savepoint/config.yml .savepoint/health` is empty. `git diff --check 25a80143 HEAD` is clean.

## Admission Ledger

| # | Recheck item | Prior Issue / claim | Frozen cell (C-100) | Allowed result | Result |
|---|---|---|---|---|---|
| 1 | The browser command shows a resting scene draws again on a tap | I-073 | Acceptance Coverage SC2 (tap clause); T-149 Done When | passed / Issue | **passed** |
| 2 | The tap goes through the pointer listeners, not a DOM element over the canvas | I-073 Proof Needed ("click on `freeCanvasPoint`") | Coverage matrix row "Camera pose (drag, wheel, pinch)" input class, browser representation | passed / Issue | **passed**: `tapCanvas` uses `freeCanvasPoint`, which only returns a point where `document.elementFromPoint` is the `CANVAS`, then `page.mouse.click` there |
| 3 | The tap proof is not vacuous | I-073 | Coverage matrix row "Browser readout" | passed / Issue | **passed**: the journey first waits for rest again (`waitUntilSceneIdle`, 1.5 s quiet; idleAgain 68 after afterNudge 45, so the wheel's grace finished), then requires at least 3 more frames within 5 s; read 73. The preceding `mouse.move` targets the same point as the wheel step, so it is not a new hover, and hover changes only DOM labels (C-100 adversarial pass) |
| 4 | Driver-only rule kept | AGENTS.md browser rule; driver guard | Scope lock item 1 (AGENTS.md browser rules) | passed / Issue | **passed**: the journey calls only `ui.*`; `tests/browserDriverGuard.test.ts` 4 passed in the full gate; no `.screenshot(` |
| 5 | `docs/BROWSER_CHECKS.md` names the tap | I-073 Proof Needed | Scope lock item 1 (browser regression maintenance) | passed / Issue | **passed** (meteor-shower line: "a wheel turn, a tap on the canvas and play draw again (O-031 T-149, I-073)") |
| 6 | One fresh browser run with the tap in `results.json` | I-073 Proof Needed; SC4 "one browser run" | SC4; External-boundary matrix | passed / Issue | **passed** (reused run, below) |
| 7 | Everything else C-100 proved has not regressed | C-100 Acceptance Coverage, matrices, gates | all C-100 rows | passed / Issue | **passed**: inputs unchanged; fresh gate identical; browser run all steps exit 0 |

No probe was run outside a frozen cell.

## Acceptance Coverage (carried from C-100 where inputs unchanged)

| Requirement | Classification | Basis |
|---|---|---|
| SC1 | Proven (carried) | `src/` unchanged; the fresh run again rests (smoke idleAtFrames 53 desktop / 45 phone; journey idleAt 38) and wakes |
| SC2 | **Proven** | 11 stage-8 unit cases pass in the fresh full gate; browser: rest 38, wheel 45, rest 68, **tap 73**, play 89 frames in 1.5 s |
| SC3 | Proven, measurement only, per Decision 5 (carried) | no code, budget or `App.tsx` change since C-100 |
| SC4 | Proven | T-151 owner look recorded ("all fine, run the final check"); gates fresh below; one browser run after the repair, reused here, not repeated |
| T-149 Done When | **Proven** (the tap clause is now met) | journey lines 17-23 |
| T-150, T-151 Done When | Proven (carried) | unchanged |
| ARCH-02, ARCH-03/04, CODE-01, CODE-02, TEST-01, TEST-03, TEST-04 | Proven (carried; CODE-01 and TEST-01 re-proven by fresh lint and tests) | `src/core/` untouched; waivers unchanged |

## Gates And Commands (fresh, this session)

| Command | Time (UTC) | Result |
|---|---|---|
| `npm run lint` | 00:29:48-00:29:50 | pass |
| `npm run typecheck` | 00:29:50-00:29:54 | pass |
| `npm run test:full` | 00:30:01-00:31:00 | exit 0: 111 files, 1513 passed, 1 skipped; statements 71.9%, branches 70.22%, functions 71.65%, lines 74.76% (identical to C-100); fresh `coverage/coverage-final.json` and `junit.xml` at 00:31:00; `browserDriverGuard.test.ts` 4 passed |
| `flock /tmp/astraeus-build.lock npm run build` | 00:31:00-00:31:01 | exit 0 |
| `git diff --check 25a80143 HEAD` | 00:29 | clean |

## Browser Evidence (reused, not re-run)

Run `docs/evidence/browser-20261023T002726Z` (`npm run check:browser`, run by the coordinator after the repair): 00:27:26-00:28:40Z, total 74 s, all six steps exit 0, 0 error lines (smoke 34 s, smoke-public-showers 9 s, planets-phone 12 s, meteor-shower 15 s, two files-only steps). Every `results.json` reads `"ok": true` with `"errors": []`. meteor-shower: idleAt 38, afterNudge 45, idleAgain 68, afterTap 73, whilePlaying 89, panel `stream-shape`, 25588 stream dots after the seek.

Why it can be trusted, so the project rule "never run the same set twice for one change" applies: `driver.mjs`, `journey-meteor-shower.mjs` and `BROWSER_CHECKS.md` were last modified at 00:27:15Z, before the run started at 00:27:26Z; they were committed unchanged in bcd57499 (00:28:53Z), and the working tree is clean at HEAD = bcd57499. `src/` and every other `tools/validate/` file are unchanged since 25a80143, and nothing changed since bcd57499. The folder keeps only `summary.txt` and `results.json` files (logs in `/tmp/astraeus-check-logs-62OZyl`). No screenshots; port 5490 was not touched.

## Code Health Evidence

Reused from C-100: snapshot `sha256:b9242648e70fcd16c223d753c2d1959cccce1623163c9e0277b3519a0012f4d0`, "Code Health does not block clearance". `savepoint health check` was not re-run, so `health_snapshot` is not set on this record. Reason: tests and coverage are byte-for-byte the same result (same counts, same percentages; coverage excludes browser `tools/validate`), dependencies are unchanged, and the only code change is an 8-line browser-driver function and a 3-line journey edit, which cannot move the complexity or duplication instances past a watch line in a way that matters (all instances are optional, report-only).

## Prior Owner Decisions

No owner `exception` or `accepted_check` is recorded on O-031 or its Tasks, so there is no `carried_forward` entry to write. The three Task-check waivers (T-149, T-150, T-151) are unchanged and remain covered by this Objective Check.

## Issues

None. No materiality actions are required.

## Observations (non-blocking; status of C-100's)

1. Still present: the `FrameState.wakes` doc comment (`src/app/sceneFrame.ts` line 53) still lists "a React render" (STYLE-08).
2. Still present: T-149 paused-list item 12 (line 86) says a tap on empty sky draws nothing; C-100's probe and now the browser command show it draws. Safe over-drawing; the record is wrong.
3. Still present: the router selects T-151, which is done; `savepoint resume` warns the selection is not current.
4. Still present: C-100 observations 1-3 (smoke `idleAtFrames` not asserted above 0, idle fps readout, late texture after the grace). The journey now asserts two wakes, which further covers observation 1 for the set.
5. New: the Objective file still reads `status: planned` though all three Tasks are done. Closing is the owner's step.

## Owner Validation Still Needed

T-151 declares `owner_validation: {required: true}`. To close, the owner records acceptance against this Check, replacing that line in the T-151 frontmatter with:

`owner_validation: {required: true, accepted_check: C-101, accepted_by: {role: owner, session: <owner session>}}`

(an optional `scope:` list may name the accepted items). Then the owner closes O-031: every Task is done, this Check is current and CLEAR, and its only linked Issue (I-073) is resolved. After closing, the owner commits and sets the router to the next ready step.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why**: the `FrameState.wakes` comment (`src/app/sceneFrame.ts` line 53) still names a React-render wake that no longer exists (unchanged since C-100).
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**: the repair is 3 files, +15/-4.
