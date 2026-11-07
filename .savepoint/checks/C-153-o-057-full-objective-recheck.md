---
id: C-153
scope: {kind: objective, id: O-057}
result: CLEAR
checked_by: {role: checker, session: o057-recheck-20261107}
executed_session: c152-repair-20261107
checked_at: '2026-11-07T06:42:00Z'
health_snapshot: sha256:c4c8fc53dd67e92a4d3c971147187742fd49ee347186263f3be37167ce365647
reviewed:
  base_commit: 7018550e
  head_commit: 3d9949b2
  files: [packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/renamedInputs.ts, packages/astraeus/tests/renamedInputs.test.ts, packages/astraeus/tests/sceneCheck.test.ts, packages/astraeus/CHANGELOG.md, packages/astraeus-site/tests/packagePacks.test.ts, tools/check-node-consumer.mjs, tools/check-packs.mjs, tools/check-packs.d.mts, docs/agents/build.md, docs/BROWSER_CHECKS.md]
  dependencies: []
issues: []
supersedes: C-152
---

# C-153: O-057 Full Objective Re-check

**Verdict: CLEAR.** Every gate passes fresh on `3d9949b2`, including the one browser run. All nine Success Conditions are Proven, and no new Issue is opened. This supersedes C-152, which stays as written.

## Closure Map Of Prior Issues

| Issue | Status at this Check | Proof Needed |
|---|---|---|
| I-145 | closed, `verified` | met word for word (below) |
| I-146 | closed, `verified` | met word for word (below) |
| I-147 | closed, `verified` | met word for word (below) |
| I-148 | closed, `verified` | met word for word (below) |

**Independence.** This session did not plan, build, coordinate or repair any O-057 work, and it did not write C-152. Task evidence, repair notes and C-152 itself were treated as claims. Probes and mutations ran in scratch copies. No tracked file changed apart from this record and the four Issues; `savepoint health check` and `check:browser` added their own new snapshot and run folder.

**Prior owner decisions.** O-057 and its Tasks carry no structured `exception` and no `owner_validation.accepted_check`, so no `carried_forward` entry is needed. T-280's `owner_validation.required` is unaccepted, which is the owner's step. The Objective's Owner Decisions were not reopened. The repair touches none of them.

**Convergence.** This is the one full re-check after the first Check, and it clears, so the limit is not reached.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-152's lock, unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-152's rows, rebuilt and rerun)
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

C-152's lock is used as frozen: the nine Success Conditions, the Owner Decisions, the Done When of T-274 to T-280, the guardrails it names, the full gate and one `check:browser`, its entry points and its matrix rows 1 to 16. Added only as the method allows: the Proof Needed of I-147 and I-148, and the repair's changed paths (`checkDataSources`, `ringFactProblems`, `pastTheEntry`, the reverse table test). No axis, dependency layer or reading was added.

## Admission Ledger

| Re-check item | Prior Issue or claim | Frozen cell | Allowed result |
|---|---|---|---|
| Old picture width at check, load, mount | I-148 | Row 3 `pictures[x].desktop.minViewportWidth` | blocking |
| Row in the table; reverse test; removing the row fails it | I-148 Proof Needed | Row 3, Old names fail clearly | blocking |
| Node and React consumer checks read only public entries | I-147 | Row 6 | blocking |
| Ring facts proven on the packed build; planted case | I-147 Proof Needed | Row 6 | blocking |
| `moonPositions.centre` at `check` | C-152 Observation 1, repair claim | Row 3 | blocking |
| Repeated event id | I-145 | C-152 scope, I-145 Proof Needed | blocking |
| View read equals what the viewer resolves | I-146 | C-152 scope, I-146 Proof Needed | blocking |
| Rows 1, 2, 4, 5, 7 to 16 | C-152 matrix | Each row as listed | blocking |
| `pastTheEntry` with a path given in parts | none | no exact cell | observation only |
| Reverse test's match ignoring scope | none | no exact cell | observation only |

## Gates

All run fresh on `3d9949b2`, in this order, alone. Node v24.16.0, npm 12.2.1.

| Gate | Time (UTC) | Result |
|---|---|---|
| `npm run lint` | 06:29:21 | pass, exit 0 |
| `npm run typecheck` | 06:29:24 | pass, exit 0 |
| `npm run build` | 06:29:30 | pass, exit 0 |
| `npm run test:full` | 06:29:32-06:30:44 | pass: 230 files, 3282 passed, 2 skipped, 0 failed; lines 95.31%, branches 88.59% |
| `npm run check:engine-alone` | 06:30:44 | pass (18.8 s) |
| `npm run check:pack` | 06:31:02 | pass (17.9 s) |
| `npm run check:node-consumer` | 06:31:20 | pass, 10 tests |
| `npm run check:react-consumer` | 06:31:25 | pass, React 19.3.1, rendered on the server |
| `savepoint health check O-057` | 06:31:38 | snapshot below, "does not block clearance" |
| `npm run check:browser` | 06:31:55-06:37:48 | pass, once, alone: 10 of 10 steps exit 0, error-lines 0 in every step, 353 s. `docs/evidence/browser-20261107T063155Z` |
| `git diff --check` from `9166785b` and from `main` | | clean |

Before the browser run the process list showed no other browser or test job. No screenshots. This run covers the repaired code; the C-152 run did not.

**Code Health.** `sha256:c4c8fc53dd67e92a4d3c971147187742fd49ee347186263f3be37167ce365647`: "does not block clearance". All five instances (complexity, coverage, dependency vulnerabilities, duplication, tests) report no finding. Supporting evidence only.

## Coverage

| Success Condition | Class | Evidence |
|---|---|---|
| Clean-break renames | Proven | Rows 1 to 4. All 20 `RENAMED_INPUTS` rows driven by hand on the compiled engine, including `validToUtc` and `pauseSeconds`, which C-152 left to the unit test |
| Story panels | Proven | Rows 7 to 10; panel data audit |
| Internals stop leaking | Proven | Rows 5, 6; I-147 below |
| Swift-Tuttle | Proven | Row 11 |
| Groups state their `plane` | Proven | Row 12 |
| Old names fail clearly | Proven | Rows 1 to 3; I-148 below |
| Checks | Proven | `removedBy` absent from both allowlists; `breaks` 0, `entries` 0; deep imports counted with my own search, `main` to `HEAD`: Apollo 129 to 129, showers 68 to 65, planets 0 to 0, site 0 to 0 |
| Docs | Proven | Rows 13, 15; the repair's CHANGELOG entry matches the behaviour tested |
| Same look | Proven | Fresh browser pass. The owner's words are in T-280: "looks right, run the final check", given at `86350829`. Nothing since changes what is drawn: the repair adds refusals at the data boundary and moves checks earlier, and no shipped data carries an old name. Acceptance of T-280 stays with the owner |

### Issue Proof, Word For Word

**I-145.** A repeated id throws `duplicate-id` inside one call and across calls, on the compiled engine. A failed batch keeps what was there, and `bad-event` still answers a malformed event. `addEvents` has its row in `tests/verbGrammar.test.ts` (line 19). The migration table has its `behaviour` row. **Met.**

**I-146.** The owner chose the read. `SceneViewRead` has `objects`, `events` and `panels` in the lock, with made-up scene tests in `tests/sceneViews.test.ts` and a `read` row in the table. Independent oracle: a new scene with an orbit line, two paths, a group, an event-linked panel and three views reads exactly what `definitionOf` resolves, list by list and in order. **Met.**

**I-147.**

- `tools/check-node-consumer.mjs` reads no packed file. Its only dynamic import is the public `astraeus-data-jupiter` entry.
- Both consumer checks pass.
- The ring facts stay proven by a named case in `check:pack`: `ringFactProblems` runs for `astraeus` in `problemsOf`, and returns no problem on the packed build.
- `packagePacks.test.ts` fails if either consumer check reaches past the entry, with four planted cases. As an independent proof, `pastTheEntry` on the real file at `9166785b` names line 115, the original reproduction, and on both files today names nothing.
- The public entry, `style.css` and `package.json` are allowed.

**Met.**

**I-148.**

- The original reproduction now throws `renamed` naming `minViewportWidthPx` at `check` and `load` on the compiled engine, and at `mount` in a fresh test on a made-up source.
- Old beside new is refused too.
- The refusal comes from the `TextureRefDesktop` row of `RENAMED_INPUTS`.
- The reverse test holds every `renamed` input row of the table against `RENAMED_INPUTS`. Its five exceptions are all a read or a method: `SceneCamera.lookAt`, `SceneCamera.reach`, `MountedScene.time`, `ViewerChange.time`, `State.frame`.

Mutations in a scratch copy:

| Mutation | Result |
|---|---|
| Remove the new table row | the reverse test fails, with three others |
| Remove the `rejectRenamed` call | four tests fail |
| Plant a CHANGELOG input row with no table row | the reverse test fails, naming it |
| Remove `checkDataSources` from `assembleScene` | six tests fail |

The new name still picks the large picture at 1920 and the small one at 500. **Met.**

### Matrix

Run in plain JavaScript on the compiled engine (99 cells, 99 pass) and in fresh tests on a scratch source copy. C-152's own scratch files were not reused.

| # | Rule | Result |
|---|---|---|
| 1 | Old input name refused with `renamed` naming the new one | pass, 18 rows here plus 2 data rows in row 3 |
| 2 | Same, old beside new | pass, 3 cells |
| 3 | Same, through data, at `check`, `load` and `mount` | pass, 12 cells plus mount. **C-152's failing cells now pass**, and C-152 Observation 1 is gone: `moonPositions.centre` and `bad-data` throw at `check` |
| 4 | New names work | pass, 7 cells |
| 5 | Nothing internal at the root | pass, 13 cells; packed `exports` is `.`, `./style.css`, `./package.json` |
| 6 | Consumer checks use public calls | pass, both files |
| 7 | Panel shape errors throw at the call | pass, 9 cells |
| 8 | Panel links wait for `check` | pass, 4 cells |
| 9 | `at.time` takes `TimeInput` | pass, 10 cells |
| 10 | Panels append and copy | pass, 9 cells |
| 11 | Comet unchanged | 2003 dates, 2000 pseudo-random, old `main` source against the Perseids record on the compiled engine: **0 km** largest difference; `addBody("swift-tuttle")` gives `unknown-body` |
| 12 | `plane` required | pass, 5 bad values; good values through the fresh gate and the demos |
| 13 | One table, every change | pass: own diff of the 80-name 0.7.0 fixture against the lock, 2 names gone and 17 changed, none without a row. Lock, fixture and `migrationTable.test.ts` are unchanged since C-152 |
| 14 | Migration reads are true | pass against `definitionOf`: `openUtcMs`, `bodies`, `scales`, `-orbit` paths. `reachEarthRadii * 2.5` equals `far` once a reach is set, and `far` is undefined when none is, which the row's wording allows; a given `farEarthRadii` wins |
| 15 | Notes cover the two apps | pass: both apps searched again for old names. Each engine use found is named by a note, apart from one test that follows a named data change (Observation 5); the other hits are the apps' own unrelated fields, such as `radiant.frame` and `centreDates.from`. The apps were not edited |
| 16 | Elements `valid` bounds | refused with `bad-element`, 4 cells (C-152 Observation 2 stands) |

Text classes, output sinks, redirected output and serialization round trips stay not applicable, for C-152's reasons.

**Panel data audit.** All 16 panels in the four `panels.json` files with panels have non-blank `accuracy` and `notes`, non-empty `sources`, and no old field. `no-panels` has none.

### External Boundary

`check:browser` started its own servers and wrote one new run folder, with no retry and no failure. `check:react-consumer` reached the registry and installed. The repair changed no runner code. Other cells stay not applicable, as in C-152.

### Workflow And Side Effects

The repair changes one order. `installData` used to check and load source by source; it now checks every source first. New cell: with a good moon source before a bad picture source, `load` throws `renamed` and the good source's `loadIndex` is never called, so a refusal loads nothing. `MOON_SYSTEMS[positions.center]!` in `installData` is safe, because `checkDataSources` runs first in the same function. `addEvents` and `addStoryPanels` batch rules pass (rows 10 and I-145).

### Adversarial Pass

- **Bypass.** `pictures` now refuses at all three calls. `check`, `load` and `mount` share one function, and mutation D shows the tests hold that. Provider states stay C-152 Observation 3.
- **Self-graded test.** The reverse test and the planted cases were checked by mutation and against the real old file, not by reading them.
- **Claim reinterpreted.** "`check` throws what `mount` would" is now true for these data faults, and the CHANGELOG and README wording match.

### File Reality

Every file named in the repair notes on I-147, I-148 and T-280 exists. `ringFactProblems` and `pastTheEntry` are exported from `tools/check-packs.mjs` and typed in `tools/check-packs.d.mts`.

## Materiality

No Issues, so no materiality actions are required.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `core/elementsBody.ts` still repeats the old record names of `RENAMED_INPUTS` by hand, because ARCH-04 keeps `core/` from importing the table.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — 265 files against `main`, many of them mechanical renames and records. The repair itself is small: 10 files under `packages` and `tools`.

## Observations (non-blocking)

New in this Check:

1. **Design's accounting is out of date on one line.** `.savepoint/Design.md` line 193 says the O-048 packed-consumer test "still reads `assets/catalogue.js`". The repair removed that read. The note's disposition still holds, but its words are now untrue. A one-line planner edit.
2. **`pastTheEntry` is a line scan.** It catches the planted forms, but not a path given in parts, such as `join(modules, "astraeus", "src", "assets", "catalogue.js")`. The I-147 proof asks only for a planted case, and neither consumer check does this today.
3. **The reverse test matches on field name, not scope.** A new row reusing an old name from another scope, with the same replacement, would pass. Today's table has no such gap.
4. **The planted ring test borrows `astraeus-data-pluto/dist`** to write its fake catalogue, and removes the file afterwards. Nothing was left behind after the gate, but a scratch folder would be safer.
5. **One showers test is not named in its note.** `tests/parentAssociations.test.ts` line 141 in the showers app expects `{ bodyId: "swift-tuttle" }`. The note names the `associations.json` change that this test follows, but not the test. The app maker will see it fail at once.

Carried from C-152, left unchanged on purpose:

6. **`accuracy.valid` takes less than `TimeInput` says** (C-152 Observation 2), confirmed by row 16.
7. **`frame` from a provider** (C-152 Observation 3).
8. **`parseElementsBodyRecord`** refuses old names with `ElementsBodyError`, not `SceneError` (C-152 Observation 4).
9. **Panel overlap at 375x667 and 1280x720** has no script proof for the longer panels; it rests on the owner's look (C-152 Observation 5).
10. **T-278's question on Apollo badges** remains a data judgement for the owner (C-152 Observation 6).

C-152 Observation 1 is resolved by the repair. Observation 7 is resolved: `docs/agents/build.md` and `docs/BROWSER_CHECKS.md` now say about 6 minutes, and T-280's evidence notes that `check_waiver` is the record.

## Owner Validation Still Needed

T-280 stays at `stage: audit`, and its `owner_validation` acceptance is unrecorded. Technical clearance is current. The owner may accept T-280 and then record O-057 done. Every material Issue linked to this Check is resolved.
