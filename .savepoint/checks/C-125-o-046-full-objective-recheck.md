---
id: C-125
scope: {kind: objective, id: O-046}
result: CLEAR
checked_by: {role: checker, session: o046-recheck-20261030}
executed_session: o046-repair-20261031
checked_at: '2026-10-30T21:55:00Z'
health_snapshot: sha256:bd0c96a656baa9704635611788b8f923942f25c7057343cca5465f2b2c7b3274
reviewed:
  base_commit: d0d49d8d
  head_commit: 670e261f
  files: [docs/BROWSER_CHECKS.md, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/src/api/bodies.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/synthetic/syntheticProbeDefinition.ts, packages/astraeus/tests/nameCheck.test.ts, packages/astraeus/tests/overlayLayers.test.ts, packages/astraeus/tests/publicApiSunPaths.test.ts, .savepoint/issues/I-108-the-browser-check-fails-the-probe-label-is-not-shown-on-a-phone.md, .savepoint/issues/I-109-the-readme-probe-example-says-it-ends-at-earth-but-it-does-not.md]
  dependencies: []
issues: []
supersedes: C-124
---

# C-125: O-046 Full Objective re-check after C-124

The re-check of O-046 ("Draw a spacecraft path across the solar system", T-189 to T-194) after C-124 NEEDS WORK. Same Full mode and the C-124 scope lock, unchanged. This is the one full re-check the convergence limit allows.

**Independence.** This session did not plan, build, repair or coordinate O-046 and did not write C-124. It wrote only: gate outputs (`coverage/`, `junit.xml`, `dist/`, example builds), the official health snapshot, browser run folder `docs/evidence/browser-20261030T214946Z/`, throwaway probes in its scratchpad, this record, the I-108 and I-109 resolutions, and one loader fix in those two Issues (below).

**Baseline.** HEAD `670e261f` on `o046-sun-paths`; repairs reviewed as `d0d49d8d..670e261f` (commits `48865721`, `670e261f`), and the whole Objective as `608ea79b..670e261f`. Not a worktree lane (`git-dir` = `git-common-dir` = `.git`). Untracked `docs/prds/` and `docs/research/` not read or touched. Times UTC.

**Verdict: CLEAR.** Both Issues are repaired and proven; every gate passes, including the one browser run.

## Closure Map Of Prior Issues

| Issue | Status | Evidence |
|---|---|---|
| I-108 (probe label not shown on a phone) | Closed, verified | Fresh `check:browser` passes all 8 steps; `synthetic-probe` desktop and phone `ok: true` with the label checked at seek 0.2 and 0.8, then the line-still check |
| I-109 (README probe example prose) | Closed, verified | README prose and comment now match the samples; my run of the README code as written gives 0.6 AU at day 0 and 1.4866 AU at day 200, centre `sun` |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-124 lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-124 rows re-run through the full gate; rows 9 and 12 re-probed)
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature in scope; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| L1 | Probe label shown at phone and desktop size in the browser case | I-108 | Row 9 (desktop, phone) | Blocking |
| L2 | Line still between two times after picking the Sun | I-108 repair moved this check after `pickBody("sun")` | Row 2 / row 9 browser case | Blocking |
| L3 | No regression in Apollo 11, planets, showers views from "labels start hidden" | I-108 repair, engine-wide | Row 5 (Earth-centred scenes unchanged, Apollo 11 labels) plus the browser gate | Blocking |
| L4 | README example prose matches its samples, and a test checks the claim | I-109 | Row 12 | Blocking |
| L5 | ARCH-06 guard catches `?? "earth"` in `scene.ts` | C-124 observation 1 | Row 15 | Blocking only if row 15 regresses |
| L6 | Fixture uses the engine obliquity | C-124 STYLE-07 note | Style (advisory) | Non-blocking |
| L7 | CHANGELOG wording line | C-124 observation 4 | Row 13 | Non-blocking |
| L8 | Whitespace | C-124 `git diff --check` | Style (advisory) | Non-blocking |
| L9 | Selected label wins collisions; README/CHANGELOG text on it | New doc text from I-108 repair | Row 11 (docs match code) | Blocking if false |

## Re-check Results

- **L1 Proven.** `browser-smoke.mjs` `sunPathChecks` now requires `"probe"` in `shownSceneLabelIds` at seek 0.2 and at 0.8, on both sizes, and throws otherwise. The fixture calls `camera.follow("probe", { distance: 70_000 })`, so `initialObjectIdOf` is `"probe"` (repo test) and the probe is the selected object. In `SceneLabels.update` the selected entry gets `+SELECTED_PRIORITY` (1000; the largest `labelPriority` in the code is 100, and the built-in formula `100 - index` only goes down), so it is sorted first and placed into an empty `occupied` list: it cannot lose a collision. Being followed, it stays on screen; Sun-centred scenes have no label reach. So the pass is deterministic, not timing luck. Run `browser-20261030T214946Z`: `synthetic-probe` desktop and phone `ok: true`, no failures.
  - Strictness of the read: `shownSceneLabelIds` counts `!el.hidden`. Before the repair, labels were created visible, so an unplaced label counted as shown (a false-pass risk). Now they start `hidden = true` and only a layout shows them, which makes the read stricter, not looser.
  - Independent probe (scratch Vitest, happy-dom, own rect stub of 60x12 px): six labels at one point, the selected one with priority -50 and the last id: before any update all six are hidden; after update the selected one is shown among the 3 that fit; with the selected one behind the camera it is hidden and the top three by priority show; with it in `hiddenIds` it is hidden. Passed.
- **L2 Proven.** After the label reads, the check picks the Sun, waits 2.5 s for the ease, then reads the line box at 0.2 and 0.8. Because the camera followed the probe until then, picking the Sun is needed for the check to mean anything: a camera on the moving probe would move a Sun-fixed line. The read is not vacuous: it requires `visible`, `inView > 0`, and a box within 0.002 at both times; an unfinished ease or a moving line fails rather than passes. Results: desktop `[0.476, 0.666, 0.331, 0.934]` at both times, phone `[0.418, 0.993, 0.331, 0.86]` at both times, so a large part of the view, not a dot. (In this fixture the default `lineFixedTo` is also the Sun, so the browser case cannot tell a broken `lineFixedTo` from a working one; that was already so in C-124, and row 3's Node probe proves `lineFixedTo` against a different centre.)
- **L3 Proven.** Labels are laid out on every frame, even paused and idle (`LayeredRender` skips only the draw; `sceneFrame.ts:256` updates labels each frame), so "hidden until the first layout" lasts at most one frame. Fresh `check:browser`: smoke `apollo11`, `planets`, `showers`, `showers-geminids`, `showers-perseids` all `ok` on both sizes; `planets-phone`, `meteor-shower`, `hello-scene`, `hello-react`, both public-build checks exit 0, 0 error lines. Full gate green, including `rebuildComparison` and the Apollo 11 path tests. The priority order itself is unchanged (T-192 Boundary): only the constant was named.
- **L4 Proven.** README prose: "starts 0.6 AU from the Sun, inside Earth's orbit, and ends about 1.49 AU out ... not aimed at any planet"; comment: "x runs 0.6 to 1.1 AU, y 0 to 1.0 AU". Hand arithmetic: last sample (1.1, 1.0, 0) AU is sqrt(2.21) = 1.4866 AU. My scratch run of the README code as written: centre `sun`, 0.6 AU at day 0, 1.4866 AU at day 200, z non-zero after the ecliptic rotation. The repo test "builds the README example" now asserts the centre and both distances, and a new fixture test asserts the dev fixture's probe meets Earth at the flyby (rel. < 1e-6).
- **L5 Proven.** `scene.ts` is no longer allowlisted; the fallback is `FALLBACK_SCENE_CENTRE` in `bodies.ts` (already allowlisted for the handles). A grep of `scene.ts` finds body literals only in comments, which the check strips. The planted-offence test now includes a reintroduced `"earth"` in `src/api/scene.ts` and expects it caught; the stale-allowlist test still passes.
- **L6 Done.** The fixture uses `createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix()` transposed (row-major, `m[0],m[3],m[6]` …), which is the right inverse of a rotation; the new flyby test proves the result.
- **L7 Done.** CHANGELOG Unreleased has the "events per hour" wording line, and an I-108 "Labels" line.
- **L8 Done.** `git diff --check 608ea79b..HEAD` and `d0d49d8d..HEAD`: no output.
- **L9 Proven.** README `setReach` row and CHANGELOG say the selected (opening) object's label wins every collision and is never the one hidden by an overlap; the code above makes that true when the label is on screen and in reach, which is what the text covers.

All other C-124 matrix rows (1 to 8, 10, 11, 13 to 17) were re-run through the full gate on the repaired code and still pass; the repairs touch none of their code paths except row 5 (L3) and row 15 (L5).

## Gates (fresh, 2026-10-30 21:47 to 21:52 UTC, HEAD 670e261f)

| Gate | Result |
|---|---|
| `npm run lint` | pass (exit 0) |
| `npm run typecheck` | pass |
| `npm run build` | pass (chunk-size warning only) |
| `npm run test:full` | 146 files passed; 1915 passed, 1 skipped; statements 91.55%, lines 94.18% |
| `npm run check:engine-alone` | pass (16 s) |
| `npm run check:pack` | pass (15 s) |
| `npm run check:node-consumer` | pass, 3 tests |
| `git diff --check` (both ranges) | clean |
| `npm run check:browser` (run once) | **pass**: all 8 steps exit 0, 0 error lines, 130 s; folder `docs/evidence/browser-20261030T214946Z`; logs `/tmp/astraeus-check-logs-qngXde`. The runner used its own servers (app on 5479); the owner's 5490 and the stray 5601 were left alone |

`measure:example` was not rerun: no source in the example's first-open path changed beyond `SceneLabels.ts` (one line) and the dev-only fixture.

## Code Health

`savepoint health check O-046 .` after the full gate: snapshot `sha256:bd0c96a656baa9704635611788b8f923942f25c7057343cca5465f2b2c7b3274` (created), "Code Health does not block clearance". Complexity, duplication and dependency vulnerabilities: no finding. Coverage and tests: "stale" again although `test:full` had just written both reports; a collection statement, not a code finding (as in C-124).

**Loader fix.** The first health run and `savepoint resume` refused to load the project: I-108 and I-109 history entries written by the repair session used `actor.role: builder`, which is not a valid role. I changed those entries to `role: executor` (same session, note and time) so the records load; nothing else in them was edited.

## Owner Decisions Assessed

No structured owner acceptance (`owner_validation.accepted_check`) or `exception` exists on O-046 or its Tasks, so no `carried_forward` entries are written. The six Task-check waivers stand as recorded. The owner's "Fix the rule now" choice for I-108 was checked as built: the fix is in the engine and fixture, and the phone label check stays strict.

## Issues

None. No materiality actions are required.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** (the fixture's obliquity copy is gone)
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** (repairs: 20 files, about 117 lines, half tests and records)

## Owner Validation Still Needed

- T-193 has `owner_validation: {required: true}` and the owner's "OK" (2026-10-30) is in evidence prose only. The owner may record `accepted_check: C-125`. Note: since that look, the fixture now opens following the probe (I-108 repair), so the opening view at `localhost:5490/app.html?experience=synthetic-probe` differs from what the owner saw; a quick glance before recording acceptance is advisable.
- With that recorded and I-108 and I-109 resolved, every condition for the owner to close O-046 is met (all six Tasks are `done`).

## Non-blocking Observations

1. **The stated cause of the run-to-run variation is not proven.** I-108's repair note says the variation came from labels created visible before the first layout. Labels are laid out every frame from the first, so that window is one frame, well before any seek; the variation more likely came from the label layout changing with the view. The follow fix makes the check deterministic whatever the cause, and starting hidden is still a sound, stricter change.
2. **The browser label case now proves the label of a followed path.** It no longer shows whether an unselected path label survives among the planets on a phone; by T-192's Boundary (no change to priority order) that may still lose a collision. This is the owner's chosen rule, not a defect.
3. **I-108 and I-109 repair timestamps** (`2026-10-31T08:45:00Z`, `09:10:00Z`) look like local time (+11:00) marked as UTC; the commits are at 21:42 and 21:47 UTC on 2026-10-30. Left as written.
4. **The CHANGELOG "Labels (I-108)" line** describes as new a rule the code already had ("before, the rule was the same in code"); the user-visible change is the fixture and labels starting hidden. Optional wording tidy.
5. Coverage and tests health instances report "stale" right after `test:full` (repeat of C-124).

## Next

Owner: optionally re-glance at the probe view, record T-193 `accepted_check: C-125`, then close O-046 and commit at Objective close.
