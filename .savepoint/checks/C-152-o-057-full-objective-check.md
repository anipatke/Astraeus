---
id: C-152
scope: {kind: objective, id: O-057}
result: NEEDS WORK
checked_by: {role: checker, session: o057-check-20261107}
executed_session: o057-run-20261107
checked_at: '2026-11-07T06:15:58Z'
health_snapshot: sha256:f654a08d9115c402a85ebef18fb8767db68f16a27e6fa1e4ab7a778408e5fc37
reviewed:
  base_commit: 7018550e
  head_commit: 9166785b
  files: [packages/astraeus/src/api, packages/astraeus/src/core, packages/astraeus/src/assets, packages/astraeus/src/shell, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/api-surface.lock.json, packages/astraeus-demo-apollo11, packages/astraeus-demo-planets, packages/astraeus-demo-showers, packages/astraeus-site, tools/check-node-consumer.mjs, tools/check-react-consumer.mjs, tools/api-surface.mjs, tools/api-rules.mjs, .savepoint/Design.md]
  dependencies: []
issues: [I-147, I-148]
unmet: ['Internals stop leaking', 'Old names fail clearly']
supersedes: null
---

# C-152: O-057 Full Objective Check

**Verdict: NEEDS WORK, on two small Issues.** Every gate passes fresh, including the one browser run. Seven of the nine Success Conditions are Proven. Two are not met as worded:

- **I-147.** The node consumer check still reads the packed internal file `assets/catalogue.js`, so it does not use only public calls.
- **I-148.** The old `TextureRef.desktop.minViewportWidth` is a renamed input with no `renamed` refusal. It is ignored without a word, and the desktop picture is lost.

Both are low materiality, and one small repair covers them. Neither touches the look, the scene or the demos.

**I-145 and I-146.** Each one's Proof Needed is met (see Coverage). Both stay open, because `issue-capture.md` defines `verified` as proven by a Check that recorded `CLEAR`, and this Check did not. Each carries a `rechecked` history entry. The `CLEAR` re-check closes them.

**Independence.** This session did not plan, build, coordinate or repair any O-057 work. Task evidence, drift notes, Design's accounting and the Issue repair notes were treated as claims. Probes ran from the scratch folder; no tracked file changed apart from this record and the Issues.

**Prior owner decisions.** O-057 and its Tasks carry no structured `exception` or `owner_validation.accepted_check`, so no `carried_forward` entries are needed. The Objective's "Owner Decisions" were not reopened, and each was tested as worded (see Owner Decisions Carried Out).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (N/A: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria.** The nine Success Conditions of O-057, its Owner Decisions, the Done When of T-274 to T-280, and the Proof Needed of I-145 and I-146. Guardrails API-01, API-02, API-04, API-05, API-07, ARCH-01, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01 to TEST-03. Release gates: the full gate and one `check:browser`.
2. **Changed files and entry points.** `git diff main...HEAD`: 248 files. Entry points: the `astraeus` root, as compiled in `packages/astraeus/dist` and as source. The calls are `addBody`, `addBodyFromElements`, `addTrajectory`, `addGroup`, `addEvents`, `addStoryPanels`, `setStoryPanelPlayback`, `setTimeline`, `setViews`, `check`, `load`, `mount`, `AstraeusScene`, `parseElementsBodyRecord`, and the reads `views`, `activities`, `panels`, `timeline`, `camera`. `DataSource.moonPositions` and `DataSource.pictures` are inputs too.
3. **Relied-on behaviour.** The `Scene` constructor registering `definitionOf`; `installData` at `load` and `mount`; `resolveViews`; the package export maps; the two consumer checks; `tools/api-surface.mjs`; the browser runner.
4. **Axes and cells.** See the matrix. Text classes and output sinks are N/A: no text width or truncation is in scope, and no terminal output is promised.
5. **Issue boundary.** A supported path means a public root call or a documented host data shape. Plain JavaScript callers are in scope, by the Objective's words. Owner-retired planets cover is not a finding. Anything in the Voyagers and showers apps is read-only evidence for the notes.

## Gates

All run fresh on `9166785b`, in this order, alone. Node v24.16.0, npm 12.2.1.

| Gate | Time (UTC) | Result |
|---|---|---|
| `npm run lint` | 06:04:08 | pass, exit 0 |
| `npm run typecheck` | 06:04:11 | pass, exit 0 |
| `npm run build` | 06:04:17 | pass, exit 0 |
| `npm run test:full` | 06:04:20-06:05:32 | pass: 230 files, 3264 passed, 2 skipped, 0 failed; lines 95.3%, branches 88.59% |
| `npm run check:engine-alone` | 06:05:32 | pass (23.5 s) |
| `npm run check:pack` | 06:05:56 | pass (14.2 s) |
| `npm run check:node-consumer` | 06:06:10 | pass, 10 tests (but see I-147) |
| `npm run check:react-consumer` | 06:06:15 | pass, React 19.3.1, rendered on the server |
| `savepoint health check O-057` | after the gate | snapshot below, "does not block clearance" |
| `npm run check:browser` | 06:06:48-06:12:43 | pass, once, alone: 10 of 10 steps exit 0, error-lines 0 in every step, 355 s. `docs/evidence/browser-20261107T060648Z` |
| `git diff --check main...HEAD` | | clean |

No screenshots. The run covers the I-146 code, which the earlier run at `e9f191a9` did not.

**Code Health.** `sha256:f654a08d9115c402a85ebef18fb8767db68f16a27e6fa1e4ab7a778408e5fc37`: "does not block clearance". All five instances (complexity, coverage, dependency vulnerabilities, duplication, tests) report no finding. Supporting evidence only.

## Coverage

| Success Condition | Class | Evidence |
|---|---|---|
| Clean-break renames | Proven | Matrix rows 1 to 4. No alias: each old name is refused, even beside the new one |
| Story panels | Proven | Rows 7 to 10; data audit below |
| Internals stop leaking | **Issue I-147** | Rows 5, 6 pass; the node consumer check fails its wording |
| Swift-Tuttle | Proven | Row 11 |
| Groups state their `plane` | Proven | Row 12 |
| Old names fail clearly | **Issue I-148** | Rows 1 to 3: 17 of the 19 `RENAMED_INPUTS` rows probed by hand and all pass; `validToUtc` and `pauseSeconds` rest on `renamedInputs.test.ts`. `TextureRef.desktop.minViewportWidth` has no refusal |
| Checks | Proven | `removedBy` absent from every allowlist; `breaks: []`, `entries: []`; deep imports per package counted with my own search at `main` and `HEAD`: Apollo 129 to 129, showers 68 to 65, planets 0 to 0, site 0 to 0 |
| Docs | Proven | Row 13 |
| Same look | Proven | Fresh browser pass; owner's words in T-280 at `86350829`, and `git diff 86350829 HEAD` is that one Task file. Acceptance of T-280 stays with the owner |

**I-145 Proof Needed: met.** A repeated id throws `duplicate-id` inside one call and across calls, from the compiled engine. A failed batch leaves the first event alone. `addEvents` has its `ADDS` row in `tests/verbGrammar.test.ts`, and the migration table has its `behaviour` row. `bad-event` still answers a malformed event, and the code list no longer says "repeated".

**I-146 Proof Needed: met.** The owner chose the read. `SceneViewRead` has `objects`, `events` and `panels`, with made-up scene tests in `sceneViews.test.ts` and a `read` table row. Independent oracle: a scene with orbit lines, a path, a group, an event-linked panel and three views reads exactly what `definitionOf` resolves, list by list and in order. The scope `Scene.views` supplies uses the same maps as `assembleScene` (read at `assembleScene.ts:171`).

### Matrix

Run through `plain.mjs` on the compiled engine and `parity.test.ts`, `provider.test.ts` in the scratch folder (plain JavaScript, public root, except where `definitionOf` is the oracle).

| # | Rule | Cells | Expected | Actual |
|---|---|---|---|---|
| 1 | An old input name is refused with `renamed` naming the new one | `labelReach` (body, path); pacing `from`, `to`, `ramp` (span and rule), `within`; view `paths`, `bodies`; panel `badge`, `sources`, `at.utc`; old panel object (`panels` with `pauseSeconds`, `autoOpen` alone); record `frame`, `validFromUtc` | `renamed` | pass, all |
| 2 | Same, old beside new | view `bodies` with `objects`; `frame` with `plane` | `renamed` | pass |
| 3 | Same, through data | `moonPositions.centre` at `load`; at `check`; `pictures[x].desktop.minViewportWidth` at `check`, `load` | `renamed` | `load` pass; `check` passes silently (Observation 1); **pictures: Issue I-148** |
| 4 | New names work | `objects`, `plane`, `accuracy.valid` as ISO text, Date, ms probed; pacing, `labelReachEarthRadii`, `center` by `renamedInputs.test.ts` and the demos in the fresh gate | accepted | pass |
| 5 | Nothing internal at the root | root keys; `Scene.prototype`; instance keys; `toDefinition`, `missingData`, `camera.lookAt`, `camera.reach`; `new SceneCamera`; packed `exports` map | gone | pass: only `camera` on an instance, no `./tests/*` or deep entries in `dist/package.json` |
| 6 | Consumer checks use public calls | `check-react-consumer.mjs`; `check-node-consumer.mjs` | public only | react pass; **node: Issue I-147** |
| 7 | Panel shape errors throw at the call | wrong `at` (none, two keys), no provenance, empty sources, blank accuracy, bad type, not a list, `undefined`; an entry not an object by `publicApiStory.test.ts` | `bad-panels` naming the field | pass |
| 8 | Panel links wait for `check` | unknown event, unknown object; event added after the panel | call passes, `check` throws; added later passes | pass |
| 9 | `at.time` takes `TimeInput` | ISO, no Z, date only, Date, ms; NaN, null, true, `{}`, nonsense | moment, or `bad-panels` | pass |
| 10 | Panels append and copy | two calls; repeat in one batch and across; failed batch; edit after the call; playback bad, null, set before panels | both kept; `duplicate-id`; nothing added; nothing changes; `bad-panels` | pass |
| 11 | Comet unchanged | 2003 dates, 2000 of them pseudo-random and not in the builder's fixture, old `main` source against the record | under 1 m | **0 km** largest difference; `addBody("swift-tuttle")` gives `unknown-body`; no comet name in `packages/astraeus/src` |
| 12 | `plane` required | undefined, null, "", "ecliptic", 5; both good values | `bad-group`; built | pass |
| 13 | One table, every change | Own diff of the 0.7.0 surface against the lock; fixture regenerated from tag `v0.7.0` | every break has a row; fixture honest | pass: 80 names, whole surface identical to the fixture; every removed or changed name has a row or is one of the four listed widenings |
| 14 | Migration reads are true | `timeline.openUtcMs`, `bodies`, `scales`, `-orbit` paths, `reachEarthRadii * 2.5` | equal to the old definition fields | pass, against `definitionOf` |
| 15 | Notes cover the two apps | Read `voyagers` and `showers` for every old name and definition read | named in the notes | pass, no gap found; every file and function the notes name exists |
| 16 | Elements `valid` bounds | reversed; date only; no Z; with offset | refused | refused with `bad-element`, loudly (Observation 2) |

**Not applicable.** Text classes, output sinks and redirected output: nothing in scope renders or truncates terminal text. Serialization round trips: the only stored form is JSON records and panels, covered by rows 4 and 11 and the demo data.

**Panel data audit.** All 16 panels in the four `panels.json` files with panels have non-blank `accuracy` and `notes`, non-empty `sources`, and no old field. `no-panels` has none. Where a source states no accuracy, the panel says so. The three Perseids panels were read against their text; the wording is honest.

### External Boundary

`check:browser` starts its own servers and writes one new run folder; the run completed with no retry and no failure. `check:react-consumer` needs the registry; the install succeeded. Timeout, redirect and malformed-response cells are N/A: O-057 changed no runner code path beyond `driver.mjs` `watchHostChanges`, which the `views` step ran.

### Workflow And Side Effects

N/A beyond the batch rules: `addEvents` and `addStoryPanels` are the only multi-item writes in scope. Both check the batch before keeping it, and a failure in the middle of a batch leaves the scene as it was (rows 10 and I-145 above). `load` and `mount` keep their existing order; the new check sits inside the existing `installData` loop.

### Owner Decisions Carried Out

| Decision | Result |
|---|---|
| Spans bind inputs only | carried out: `valid: { start, end }` in, flat `windowStartUtcMs` out; Guardrails and Design say so |
| Reported time is `timeUtcMs` | carried out on the handle, `ViewerChange`, `EventZoneChange`; `time` prop and `setTime` unchanged |
| `provenance` replaces `badge` and `sources` | carried out; old forms refused |
| Own `setStoryPanelPlayback` call | carried out |
| Planets compare retired, public parts kept | carried out: fixture and helper gone, `planetViews.test.ts` on public reads, planets at 0 deep imports |
| I-145 repaired in T-280 | carried out |
| I-146 read added; one fresh `check:browser` | carried out; run above |

### Adversarial Pass

- **Bypass.** Old names reach the engine by `pictures` (I-148) and by what a `provider` returns (Observation 3). All other routes refuse.
- **Back door.** `astraeus/tests/definitionOf` is a dev route only: absent from the packed exports, counted as a deep import, used by no `src` file. The count did not rise, because each new use replaced another.
- **Self-graded test.** The comet fixture was captured by the builder, so it was re-proved from `main` source. The 0.7.0 surface fixture was regenerated from the tag.
- **Claim reinterpreted.** Design's T-274 accounting calls the `assets/catalogue.js` read "non-architectural" and says the public-call rule "covers the scene". No owner decision narrows the Objective's words, so this is treated as a claim and fails (I-147).

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-147 consumer check reads a packed internal file | High: it runs every time | Low: a gate named public-only reaches past the export map, and breaks on a file move with no public change | Low | Fix now; small |
| I-148 old picture field is ignored silently | Low: neither app nor any shipped data package uses `desktop` | Medium: a third-party data package silently loses its large picture, with no error | Low | Fix now, with the guard, before 0.8.0 locks the name |

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `core/elementsBody.ts` repeats the old record names of `RENAMED_INPUTS` by hand, because ARCH-04 keeps `core/` from importing the table.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — 248 files, many of them mechanical renames across tests.

## Observations (non-blocking)

1. **`check` misses what `installData` refuses.** `scene.check({ data })` passes with `moonPositions.centre`, while `load` and `mount` throw `renamed`. The migration table says `check` throws what `mount` would. `bad-data` has the same gap, from before O-057. The condition's promise of a `SceneError` is kept at `load` and `mount`. The I-148 repair sits in the same place, so the owner may want both looked at together.
2. **`accuracy.valid` takes less than `TimeInput` says.** The type is `TimeInput`, but text must be full UTC ISO with a Z: `1990-01-01` and offsets are refused, though `at.time` takes them. This falls short of API-04's "every moment input accepts `TimeInput`". It stays an observation for three reasons: the refusal is loud and clear, the strictness keeps stored records free of machine-local time, and the CHANGELOG says "ISO text as before". Widening it later breaks nobody.
3. **`frame` from a provider.** A plain JavaScript `provider.stateAt` returning the old `frame` passes `check`, `load` and `stateOf`, and `stateOf` hands it back as given. By reading only, not by a run: composing such a state in `referenceCenters.ts` would throw a plain `RangeError` about "identical frames". The table's `State.frame` row speaks only of reads. No demo, example or app uses a provider, and the README does not document it.
4. **`parseElementsBodyRecord`** refuses old names with `ElementsBodyError`, not `SceneError`. T-277 asked only that it name the replacement, and `addBodyFromElements` gives `renamed`.
5. **Panel overlap at 375x667 and 1280x720** has no script proof for the longer panels. It rests on the owner's look.
6. **T-278's question on Apollo badges.** Powered descent, touchdown and ascent-docking stay `observed` while their notes call the drawn path a reconstruction. The owner's words do not address it directly; it is a data judgement for the owner.
7. **Record wording.** The T-278 and T-280 evidence says "Task-check waiver: none recorded", while their frontmatter records one. `docs/agents/build.md` says `check:browser` takes about 1 minute; it took 355 s here and 340 s before.

## Owner Validation Still Needed

T-280 stays at `stage: audit`, and its `owner_validation` acceptance is unrecorded. After the repair and a `CLEAR` re-check, the owner accepts T-280 and records O-057 done. I-145 and I-146 close as `verified` at that re-check.
