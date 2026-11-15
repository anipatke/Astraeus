---
id: C-181
scope: {kind: objective, id: O-073}
result: CLEAR
checked_by: {role: checker, session: o073-recheck-20261115}
executed_session: plan-g020-20261115
checked_at: '2026-11-15T04:53:21Z'
health_snapshot: sha256:641ba18aa7282ba63a531f883d02cb610de75808141b5760c1ed81f5e2ca24cb
reviewed:
  base_commit: 13ecf688
  head_commit: 54810bcb
  files: [packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, README.md, .savepoint/objectives/O-073-sky-view-engine-bugs/Objective.md, .savepoint/issues/I-178-readme-and-changelog-say-every-bad-time-is-bad-time.md]
  dependencies: []
issues: []
supersedes: C-180
---

# C-181: O-073 Full Objective recheck

Fresh session; I did not plan, build or repair O-073 or I-178. This recheck supersedes C-180 (NEEDS WORK, unmet SC7, I-178). Scope: everything C-180 covered, plus the I-178 repair.

## What changed since C-180

`git diff --name-only 13ecf688..HEAD` (commits c8fdee9c, 54810bcb) lists only: the C-180 record, the I-178 Issue, the O-073 Objective (SC7 line), root `README.md` (two demo links lose "(going live soon)"), `packages/astraeus/README.md` and `packages/astraeus/CHANGELOG.md`. No source, test, fixture, dependency, lockfile, tool or `.savepoint/config.yml` gate definition changed. `git status` shows no package or tool edits in the tree. `git diff --check 13ecf688..HEAD`: clean.

## Reused gate evidence (metadata/docs-only rule)

Reused from C-180 under docs/agents/verification.md (inputs unchanged, proof above): `npm run check:gates` at HEAD 13ecf688, 2026-11-15, started 04:32:37Z, Node v24.16.0. Lint, typecheck, build, `npm test`, `test:full` (3,927 tests, 0 failures), check:engine-alone, check:pack, check:node-consumer, check:react-consumer all passed. `check:browser` passed once (04:37:10Z-04:42:37Z, 12 of 12 steps, evidence `docs/evidence/browser-20261115T043710Z/`); not rerun. The Code Health snapshot `sha256:641ba18a…` from C-180 stands ("does not block clearance").

Fresh at HEAD 54810bcb:

| Command | Result |
|---|---|
| `npm run lint` (04:51:48Z) | pass, 3.7 s |
| `npm test` (04:51:52Z-04:52:39Z) | pass: 259 files, 3,925 passed, 2 skipped, 42 s. Includes `tests/badTime.test.ts` and the README-reading tests |

## I-178 Proof Needed

| Proof | Result |
|---|---|
| Owner decision recorded against the Success Condition | Met. O-073 SC "Fractional time (F-08, I-176)" now carries "Owner decision (2026-11-15T04:50:00Z, I-178)": panel `at.time` `bad-panels`, anchors `bad-anchor`, `shownDuring` `bad-body`/`bad-trajectory`; fractional panel times refused. I-178 history has a matching `owner_decision` entry. |
| README time rule names each call's code | Met. The `addTrajectory` row says `bad-time` for `stateOf`, `setTime`, timeline, event, sample and provider times, else the call's own code, listing the four. |
| README `addStoryPanels` row | Met: `at.time` is a whole-millisecond moment; a fractional or out-of-range one throws `bad-panels`. |
| CHANGELOG | Met. The Fixed bullet no longer lists panel or path times. A new Changed bullet lists the new refusals of panel `at.time`, anchor `time` and `shownDuring` with their codes. |
| Docs match code | Met. `tests/badTime.test.ts`: 14 calls x 5 values throw `bad-time`; per-call table pins `bad-body` (addBody shownDuring), `bad-trajectory` (addTrajectory shownDuring), `bad-anchor`, `bad-panels`. Unchanged since C-180 and passing. |

SC7 is now met; with C-180's matrix (SC1-SC6, SC8, SC9, API lock, Design) unaffected by docs-only changes, all nine Success Conditions and the CHANGELOG `Unreleased` / no-bump condition hold.

## Owner decisions carried forward

Scope unchanged since C-180 (no code change), so each still applies: T-313/T-314/T-315 check waivers (04:10:47Z); T-313 owner look "Looks right" (04:18:59Z); panel-time refusal (04:31:55Z); I-178 call-code decision (04:50:00Z, new since C-180, recorded in the Objective).

## Owner validation still needed

T-313 declares `owner_validation.required`; the look was given (04:18:59Z) but no `accepted_check` is recorded. The owner may record it against C-181 when closing.

## Observations (non-blocking)

- The README time rule's `bad-time` list does not name group (`referenceTime`, orbit time) or activity times, which also throw `bad-time`; the CHANGELOG covers them as "body-set times" and the rule opens with "Every moment".
- C-180 observations still stand (look-out non-listed member tap; `loop` doc sentence; `playing` read doc; CHANGELOG blank line).

## Code Style Review

Unchanged from C-180 (docs-only diff): STYLE-03 still lacks a DOM test for the shell keepSky branch; all others pass.
