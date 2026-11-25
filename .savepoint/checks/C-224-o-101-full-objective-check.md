---
id: C-224
scope: {kind: objective, id: O-101}
result: CLEAR
checked_by: {role: checker, session: check-o101-20261125}
executed_session: orchestrate-g027-20261124 (T-458..T-463 builders and coordinator)
checked_at: '2026-11-25T08:35:00Z'
health_snapshot: sha256:a2056cd8044934ab99ab313d234796f3c2c73b52af16af39729b1b4bef5adfc8
reviewed:
  base_commit: c79a1159
  head_commit: 6148f088
  files: [docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, packages/astraeus-site/src/main.tsx, packages/astraeus-site/src/synthetic/syntheticGroupLabelsScene.ts, packages/astraeus-site/tests/publicBuild.test.ts, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tools/validate/journey-group-labels.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/api-surface.lock.json, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/group.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/labelInput.ts, packages/astraeus/src/api/planLabels.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/viewerSelection.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/GroupSetTarget.ts, packages/astraeus/src/app/PointsView.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/app/groupLabelPoint.ts, packages/astraeus/src/app/hostLabels.ts, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/src/app/sceneDebug.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/scenePicking.ts, packages/astraeus/src/app/sceneTargets.ts, packages/astraeus/src/app/viewHiding.ts, packages/astraeus/src/shell/experience.ts, packages/astraeus/tests/explainerLive.test.ts, packages/astraeus/tests/frameDiagnostics.test.ts, packages/astraeus/tests/groupLabelPoint.test.ts, packages/astraeus/tests/groupSetSelection.test.ts, packages/astraeus/tests/groupShowLabel.test.ts, packages/astraeus/tests/hostLabels.test.ts, packages/astraeus/tests/hostLabelsTap.test.ts, packages/astraeus/tests/labelInput.test.ts, packages/astraeus/tests/sceneInputCopies.test.ts, packages/astraeus/tests/sceneTargets.test.ts, tools/gate-limits.json]
  dependencies: []
issues: []
supersedes: null
---

# C-224: O-101 Full Objective Check

Fresh session; it did not plan, build or coordinate O-101. Objective diff `git diff main...HEAD` (main c79a1159, head 6148f088 on `o101-group-labels`; 49 files outside `.savepoint`). Out of scope: the uncommitted T-388 (O-086) change, untracked `docs/evidence/*` and `docs/research`.

**Result: CLEAR.** Every Success Condition of O-101 and every Done When of T-458..T-463 is proven by the new table tests, by independent probes written for this Check (deleted after), and by a real browser run; every gate passes. The three coordinator-accepted deviations are sound. Owner validation is still to be recorded on T-459 and T-463 (the owner said "looks good" on both; the coordinator fills the acceptance fields with this Check's id). One non-blocking observation matters for the release: `twoViewers.test.ts` failed 2 of 6 full `npm test` runs on this branch (an older timing flake, see Observations).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (the browser runner only; its own dev and preview servers; the owner's :5490 untouched)
- [x] Workflow And Side-Effect Check Lock (no persistence or partial writes; the one multi-step input path is `addLabels` add-all-or-none, probed)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a: advisory only; the Objective's `independence` entries do not load as planning metadata, `savepoint resume` says so; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: O-101 Success Conditions (groups unnamed, names on dots, host labels, taps, `bad-label`, proof, docs and surface, size) with the owner answers of 2026-11-24/25 (sceneTargets.test.ts fixture line; raw and gzip caps raised by measured amounts to 1,846,000 / 530,000; API page gzip 46,000 -> 48,000; `groupLabelChecks` in browser-smoke.mjs finds the name after the drag); each Task's Done When; the belt brief (`/home/user/code/belt/docs/astraeus-labels-and-chart-prompt.md` section 1 "Belt use, for your test scene" and its Tests list; the copy named at the scratchpad path did not exist, the original was read); Guardrails API-01/02/04/05, ARCH-01/02/03/06, PROV-01, CODE-01/02, TEST-01/02/03, STYLE-*; release gate: CHANGELOG 0.12.0 breaking change with migration (`releaseBreaks.test.ts`).
2. Changed files: `reviewed.files`. Entry points: `Scene.addGroup({ showLabel })`, `Scene.addLabels`, build (`mount`, `AstraeusScene`, `definitionOf`), `handle.setSelected/selected/onSelect`, `?labels=`, the Labels switch, `setView`, a pointer tap or drag on a label.
3. Relied-on runtime: `PointsView` fills (whole and look-ahead; graphics-chip and CPU policies), the one label layer, `scenePicking`/`scenePointer`, view hiding, the camera focus and framing lookups.
4. Axes below. Not applicable: text classes (labels are host text drawn as DOM text, no width or truncation rule in scope), serialization (no stored form), environment/output sinks (no CLI).
5. Admission: supported public paths only; Issues must violate a named criterion, guardrail or gate and be introduced or touched by O-101.

## Coverage matrix

| Criterion | Evidence (this session) | Result |
|---|---|---|
| SC1 `showLabel` (T-458): absent/true/false/"yes"; false starts hidden, switch and `?labels=:on` show it, still listed and `focus-<id>` | `group.ts` check + object field only when given; `groupShowLabel.test.ts` table (4 kinds); probe: `showLabel: 1` -> `bad-group` naming `showLabel` | Pass |
| SC2 names on dots (T-459): one rule, fill cadence, both fill paths, ring held at vernal equinox, swarm follows, pooled, one member; camera still on the centroid | `groupLabelPoint.ts` (pure); `PointsView` computes in `#fill` and the pending look-ahead step only, blends per frame (2 maps); `labelPositionOf` -> `labelAnchor()`, `focusAbsoluteOf`/`framedViewOf` unchanged; `groupLabelPoint.test.ts` 9 cases on both policies | Pass |
| SC3 host labels placed (T-460/T-461): fixed point each plane, with/without centre; on one group, a ring, several groups; follows time; null when out of bounds or view-hidden | `hostLabels.ts`; `hostLabels.test.ts`. Probe A: default centre equals `sceneCenterOf(definition)` for scenes led by Earth, Moon and Sun. Probe B (the brief's "Inner/Middle/Outer belt" shape): four concentric ring-shaped groups at 2.2-3.4 AU pooled under one label, 82 times over 3,000 days on both policies: always 2.0-3.6 AU from the Sun and within 10 degrees of the vernal equinox direction (never at the Sun, never wandering) | Pass |
| SC3 one layout, cover rule, switch ids | `SceneLabels.ts` filters covered groups and ids shared with a host label, adds host entries with own priority; selected bonus via `selectedFor`; `labelIdsOf` feeds the start rule and Labels switch; `hostLabels.test.ts` layer cases | Pass |
| SC4 taps (T-461/T-462): one group, story panel, shelf panel, none, several; wide card vs phone; drag from any label | `routeLabelPick`, `hostLabelTargets`, `pickCandidatesOf.labelTargets`; `hostLabelsTap.test.ts` (all kinds, both widths, drags on 4 labels); `groupSetSelection.test.ts` on mount and React (host/visitor cause, card title/description/provenance, unlisted until selected, view hiding all groups -> hidden + `bad-selection`, drag); browser `group-labels` both sizes | Pass |
| SC4 combined focus/framing | `GroupSetTarget` member-weighted mean, extent sphere holds every group; `groupSetSelection.test.ts` camera cases | Pass |
| SC5 bad input names the field; `duplicate-id` | `labelInput.test.ts` (20 call rows, 6 build rows, good forms). Probes C: one bad label in a call adds none and the good one adds afterwards; id clash label-after-group, group-after-label, body-after, label vs story panel at build -> `duplicate-id`; body id as a group -> `bad-label` `anchor.groups[0]`; unknown centre -> `anchor.center`; card field with a panel selection -> `description`; non-array, empty and `[null]` calls -> `bad-label` | Pass |
| SC6 proof: new test files per Task, tables, no existing setup changed except the owner-approved line | `git diff` on existing tests: `sceneTargets.test.ts` (approved line only, Prettier-wrapped), `sceneInputCopies.test.ts` (new `addLabels` row only), `frameDiagnostics.test.ts` (new case only), `explainerLive.test.ts` (cleanup, judged below), `publicBuild.test.ts` pinned cap (owner item 3) | Pass |
| SC6 browser step `group-labels` (4x2 groups, two group labels, 1440x900 and 390x844) | step in `browser-steps.mjs`, `gate-limits.json`, BROWSER_CHECKS row, browser-policy paths; this Check's run: exit 0, 7 s | Pass |
| SC7 docs and surface | API lock (apiSurface test green), README `addLabels` row, error table `bad-label`, handle sentence; CHANGELOG 0.12.0 Added/Fixed bullets; `### Breaking changes in 0.12.0` lists `bad-label` with a migration; `releaseBreaks.test.ts` green | Pass |
| SC8 size | `check:pack` engine 1,845,916 B raw / 529,465 B gzip, limits 1,846,000 / 530,000 (owner-approved measured raises, dated comments in `engine-budget.mjs`); API page under 48,000 (apiReference green) | Pass |
| Belt brief Tests list | showLabel false unlisted-safe (groupShowLabel); lands within dots incl. ring and follows (hostLabels, groupLabelPoint, probe B); tap selects what `selects` names (hostLabelsTap, groupSetSelection); drag moves camera (both + browser); bad input (labelInput); browser 4x2 groups, two labels, card wide / select phone (group-labels step). "Belt use": L4/L5 swarms as four shaded groups each with `showLabel: false` and one selecting label each = the made-up scene; the second view's four region labels on ring-shaped quads = probe B and `hostLabels.test.ts` "four groups"; bodies keep their labels (made-up planet and Sun labelled in the scene) | Covered |
| Design reconciliation | Design.md Viewer interface O-101 sentence covers every drift note (groupLabelPoint, addLabels/bad-label, hostLabels, cover rule, GroupSetTarget, partOfAll, group-labels step, points box) | Pass (one omission noted below) |

Coordinator-accepted deviations, judged:
- T-462 wrote `shell/experience.ts` (`partOfAll`) and `app/viewHiding.ts` outside planned_writes: needed for the Done When "a view that hides every one of its groups hides the label"; two lines plus an optional field, proved on both embedding paths. Sound.
- T-463 asserts the label rectangle (not centre) within 24 px of the groups' screen box, via the new `minX..maxY` in `sceneDebug.ts` `publishPointsData`: the label is drawn beside its anchor, so the rectangle is what stands on the dots; the anchor-on-a-dot invariant itself is proven in unit tests (within 2,000 km of a member). The readout change is additive and tested (`frameDiagnostics.test.ts`). Sound.
- `explainerLive.test.ts` afterEach unmounting: cleanup only (no input, fixture or assertion change). Independently confirmed needed: a full run on main (worktree at c79a1159) logged 4 unhandled `window is not defined` errors originating in that file; the branch's 6 runs logged none. Sound.

## Gates (this session, real times UTC)

| Gate | Start | Result |
|---|---|---|
| `npm run typecheck` | 08:20:00 | pass, 11 s |
| `npm run lint` | 08:20:11 | pass, 12 s |
| `npm test` (junit) | 08:20:23 | FAIL 1 (twoViewers T-254, 10 s wait for the lazy Developer drawer); 357 files passed |
| `npm run build` | 08:21:12 | pass, 3 s |
| `npm run check:pack` | 08:21:15 | pass, 24 s; engine 1,845,916 B raw / 529,465 B gzip (limits 1,846,000 / 530,000); astraeus packed 7.25 MB, unpacked 9.35 MB, 695 files |
| `npm run check:node-consumer` | 08:21:39 | pass (12 tests) |
| `npm run measure:example` | 08:21:46 | first-open total 1,845,916 / 529,465 |
| `npm run check:shelf-split` | 08:21:50 | ok |
| `npm run check:public-build` | 08:21:54 | pass (`docs/evidence/public-build-20261125T082154Z`) |
| `git diff --check main...HEAD` | 08:22:02 | clean |
| `npm test` rerun | 08:22:20 | FAIL 1 (twoViewers "API-03: one shelf panel descriptor ...", line 528) |
| `npm test` (junit) rerun | 08:23:27 | pass, exit 0, 358 files, 5737 passed, 2 skipped, no unhandled errors |
| `npx vitest run` x3 on branch, x3 on main, interleaved | 08:24:37-08:28:20 | branch 3/3 exit 0, no unhandled errors; main 2/3 exit 0, 1 run with 4 unhandled errors (explainerLive) |
| `npm run check:browser -- --tier quick --step look-out --step synthetic-journey --step two-viewers --step group-labels --step orbit-lines` (under `flock /tmp/claude-1000/astraeus-browser.lock`) | 08:28:45 | exit 0, 12 steps, 342 s (limit 486 s): smoke 48 s, orbit-lines 56 s, synthetic-journey 71 s, smoke-public-showers 5 s, planets-phone 12 s, look-out 72 s, two-viewers 8 s, group-labels 7 s, hello-scene 16 s, hello-react 3 s, hello-planets 3 s, hello-sky 18 s; error-lines 0 everywhere. Evidence `docs/evidence/browser-quick-20261125T082845Z` |
| `savepoint health check O-101` | 08:34:32 | snapshot above, "does not block clearance" |

Browser selection (browser-policy.md): quick tier plus `look-out` (Shaders: `PointsView.ts`; Layout: `shell/experience.ts`); `group-labels` (its own paths); `two-viewers` (`AstraeusScene.tsx`, `sceneContentsHooks.ts`); `orbit-lines` and `synthetic-journey` (both list `browser-smoke.mjs`, changed); packed examples kept (no `--skip-examples`) because `api/index.ts` and `api-surface.lock.json` changed. `driver.mjs` gained `labelBox` only (no existing function changed), so no other step. `views`, `meteor-shower`, `catalogue` not touched.

Full `npm test` verdict: the configured gate passes (four consecutive clean exits, the last at 08:27:43); the two red runs are one pre-existing flaky file, not O-101 code (Observations 1).

## Code Health

Snapshot `sha256:a2056cd8044934ab99ab313d234796f3c2c73b52af16af39729b1b4bef5adfc8`: does not block clearance. Complexity, dependency vulnerabilities and duplication: no finding. Coverage and tests (vitest junit): stale (optional; coverage is refreshed only by `test:full` at release; the junit was written by the 08:23 run and later runs used plain `vitest run`). Collection staleness, not a Check finding.

## Issues

None. No materiality actions are required.

## Owner validation still needed

T-459 and T-463 declare `owner_validation.required`. The owner looked on localhost:5490 (T-459 at 236cfa20, 2026-11-25T07:36Z; T-463 at 0782b706, 08:14Z) and said "looks good"; the acceptance fields (`accepted_check: C-224`) are the coordinator's to record. No prior owner acceptance or exception on O-101 to carry forward (first Check).

## Observations (non-blocking)

1. `packages/astraeus/tests/twoViewers.test.ts` failed 2 of 6 full branch runs (T-254 drawer wait at 08:20; "API-03: one shelf panel descriptor ..." line 528 at 08:22), then passed 4 in a row; it passed alone; main passed 3/3 in this file. The same "API-03 shelf panel" case is recorded failing on 2026-11-22 under I-204, before O-101, and T-461's builder saw the file fail once under load. The file is untouched by O-101, so this is not admitted as an O-101 Issue, but the 0.12.0 release gate runs the full suite again and may hit it; worth a durable follow-up (a named wait for the lazy Developer drawer and the panel-close report in that file, as I-203 did for viewerIds).
2. `ExperienceLabel`'s doc comment in `app/experienceDefinition.ts` still says "Nothing reads it yet." (true after T-460, stale after T-461).
3. Design.md does not mention that `HostLabelPlacer.groupSetOf` answers the camera lookups instead of a `SceneTargets` field (T-462 drift note); the remaining drift is reflected.
4. `tools/gate-limits.json` sets `group-labels` to 16 s where T-463 planned 15 s (slowest measured 12 s); within the 450 s full total by projection (about 442 s).
5. `HostLabelPlacer.#onGroups` builds a stamp string per label per frame; cheap at the expected label counts, but an allocation per frame.
6. A several-group label whose groups are all outside their time bounds (not view-hidden) stays selectable (T-462 limitation, as recorded).
7. All three `independence` entries in O-101's Objective.md use `pair` and fail to load as planning metadata (advisory, reported by `savepoint resume`).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why** — `experienceDefinition.ts` `ExperienceLabel` comment "Nothing reads it yet." is now wrong.
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — 49 files, about 2,700 lines for one Objective; spread over six Tasks, each with its own new test file, so reviewable.
