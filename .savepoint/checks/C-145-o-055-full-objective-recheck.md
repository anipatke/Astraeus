---
id: C-145
scope: {kind: objective, id: O-055}
result: CLEAR
checked_by: {role: checker, session: o055-recheck-20261102}
executed_session: o055-repair-20261102
checked_at: '2026-11-02T11:05:00Z'
health_snapshot: sha256:922c82e02c8c2523f87da173dee9eb970f3db436559e82e8d37692c703bb0231
reviewed:
  base_commit: 86001f4d
  head_commit: 009554b0
  files: [packages/astraeus/src/app/style.css, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/containingBlock.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/README.md, packages/astraeus/tests/computedLook.test.ts, packages/astraeus/tests/fixtures/computed-look.baseline.json, packages/astraeus/tests/loadingCoverFrame.test.ts, packages/astraeus/tests/helpers/frameContext.ts, packages/astraeus/tests/sceneFrame.test.ts, packages/astraeus/tests/hostPageDom.test.ts, packages/astraeus-site/tests/loadingCoverChain.test.ts, tools/look-lock.mjs, package.json, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: C-144
---

# C-145: O-055 Full Objective Check, re-check after remediation

This is the full re-check of O-055 after C-144 returned NEEDS WORK. It uses C-144's frozen scope lock and matrix unchanged. The repair under review is commit `009554b0` (diff `86001f4d..009554b0`, 17 files, +626/-39). The whole Objective (`main..009554b0`) was re-gated.

**Verdict: CLEAR.** Both C-144 Issues hold under independent evidence. Every frozen matrix cell passes, and every gate passes, including the one `check:browser`.

## Closure Map Of Prior Issues

| Issue | State | Proof |
|---|---|---|
| I-140 (open nested fold heading accent -> muted) | **closed, verified** | C-144 cascade probe: 16/16 cells, 0 differences vs main. Planted flip fails the look lock in 8/8 synthetic cells, naming the element and `color: #fc6323 -> #c7bdb3`. The lock's baseline equals main's look (L1) |
| I-141 (loading-cover hand-off untested) | **closed, verified** | Each of the three planted mutations (AstraeusScene claim, App pass-through, main.tsx `cover.claim`) fails at least one test. So does the adjacent first-frame link (M5) |

**Prior owner decisions.** No structured owner acceptance or exception is recorded on O-055, so no `carried_forward` entries are needed. The Task-check waivers on T-250 to T-258 are waivers, not exceptions. T-258's recorded owner look ("looks OK", 2026-11-02T10:05:11Z) is evidence, not an `accepted_check`. The repair changed one colour back to main's value, so the look the owner saw differs from HEAD only in that the open nested fold heading is accent again (see Owner Validation).

**Independence.** This session did not plan, build, coordinate or repair any O-055 step or the C-144 repair. It was not the C-144 checker either. It treated the repair notes in I-140/I-141 history as claims. It is not a lane: `.git` is both the git dir and the common dir.

**What this run wrote.**

- gate outputs: `coverage/`, `junit.xml`, `dist/`, `examples/*/dist`
- one browser evidence folder: `docs/evidence/browser-20261102T105238Z/`
- its own folder: `docs/evidence/check-o055-recheck-20261102/`
- one official health snapshot
- this record
- the closing entries on I-140 and I-141

Every planted mutation was restored with `git checkout -- packages`, and `git diff --quiet HEAD -- packages` was clean after each one.

It did not touch `docs/prds/`, `docs/research/`, the three modified G-012/G-013/G-014 `Release.md` files, C-144's evidence folder or the router. It committed nothing.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (re-check: C-144's lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-144 matrix, every cell re-run)
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

Each blocking probe maps to an exact frozen C-144 cell. Anything without one is an observation.

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| A1 | C-144 cascade probe P-STYLE-1, main sheets vs tree | I-140 | Row 11, all 16 cells (4 layouts x 2 orders x 2 definitions) | 0 differences outside the named intended moves |
| A2 | Plant the I-140 flip; the kept test must fail | I-140 Proof Needed (kept test, `:not()` subject) | Row 11 synthetic cells | lock fails, naming the element |
| A3 | Look lock baseline vs main's sheets | I-140 Proof Needed ("any other computed-style change between main and tree") | Row 11 | only intended page-rule moves differ |
| A4 | AstraeusScene drops the claim | I-141 (C-144 mutation) | Row 7 (SC6 cover) | a test fails |
| A5 | App drops `claimCover` pass-through | I-141 Evidence item 2 | Row 7 | a behavioural test fails (not only lint) |
| A6 | `main.tsx` drops `cover.claim` | I-141 Proof Needed item 2 | Row 7 site claim | a site test fails |
| A7 | First frame never hides the claimed cover | I-141 Proof Needed item 1 ("reaches the first frame and hides") | Row 7 | a test fails |
| A8 | P-STYLE-2/3, P-BOX-1, P-PIC-1, P-ID-1, P-KEY-1, P-MOON-1 | C-144 matrix | Rows 2, 3, 5, 6, 9, 10 | pass |
| A9 | `mount` restores host inline styles on unmount | C-144 Observation 5 (remediation code path) | Row 10 (containing block) | P-BOX-1 still passes; restore test passes |
| A10 | Gates | Row 14 | Row 14 | pass |
| — | Careless regeneration of the baseline (L2, L3) | owner brief question | no exact cell | observation only |

## Re-check Matrix Results

| # | Row (criterion) | Result | Evidence (`docs/evidence/check-o055-recheck-20261102/`) |
|---|---|---|---|
| 1 | SC1 two viewers isolated | Passed | `twoViewers.test.ts` green in both `test:full` runs; P-ID-1 (A8) |
| 2 | SC2 moons per request | Passed | P-MOON-1 3/3 (`probes-run.txt`). Observation 1 covers two unhandled-rejection reports from the probe itself |
| 3 | SC3 pictures per viewer | Passed | P-PIC-1 16/16 |
| 4 | SC4 developerTools | Passed | `developerToolsOption.test.ts` green |
| 5 | SC5 no fixed ids | Passed | P-ID-1 8/8; `apiRules` green |
| 6 | SC6 Escape | Passed | P-KEY-1; `escapeScope.test.ts` |
| 7 | SC6 cover | **Passed (I-141 fixed)** | `mutations.txt` M2 to M5 (below) |
| 8 | SC6 markers | Passed | `pointerAndFeatureLayerDom.test.ts` green |
| 9 | SC7 no styles outside | Passed | P-STYLE-2 4/4, P-STYLE-3 |
| 10 | SC7 containing block | Passed | P-BOX-1 8/8; `hostPageDom.test.ts` 7/7 including the new restore case |
| 11 | SC7 look unchanged | **Passed (I-140 fixed)** | `cascade-*.txt`: every file reads `N elements x 56 properties; 0 differences` (280/292/349/361 elements) |
| 12 | SC7 owner look | Recorded | T-258 (owner, 2026-11-02T10:05:11Z) |
| 13 | SC8 surface and notes | Passed | README wording now matches P-STYLE-3 (C-144 O3 resolved); Design "Good guest" names the look lock and the unmount restore, accurate against the code; CHANGELOG unchanged since C-144 |
| 14 | Gates | Passed | `gates.log` (below) |

**Probe command.** `npx vitest run --config docs/evidence/check-o055-recheck-20261102/vitest.probe.config.ts docs/evidence/check-o055-recheck-20261102/probes` gives 3 files, 56/56 passed. In C-144 the same run gave 48/56, with the 8 I-140 cells failing.

The probes are byte-identical copies of C-144's, apart from the evidence path. Without that change they would write over C-144's cited `cascade-*.txt` files (browser policy, historical evidence preservation). `diff -r` shows only path lines.

The `old-sheets/` copies were checked against `git show main:packages/astraeus/src/<sheet>` with `cmp`: all 7 are identical. `main` is `72dc9be7`.

**I-140 mutations** (`mutations.txt`). Command: `npx vitest run packages/astraeus/tests/computedLook.test.ts packages/astraeus/tests/loadingCoverFrame.test.ts packages/astraeus-site/tests/loadingCoverChain.test.ts`. The unmutated tree gives 19 passed, 1 skipped (the `LOOK_UPDATE` writer).

- **M1, the C-144 flip planted back** (`color: var(--ui-muted)` on the (0,4,0) rule): 8 failed. These are exactly the 8 synthetic cells. Each names `181 ... button.ui-row.collapsible-toggle | color: "#fc6323" -> "#c7bdb3"` and its span/svg/path children. The nested-fold presence assertion guards the `:not()` subject case.
- **M1b, the repair's rejected all-`:where()` variant:** 8 failed with `font-weight: "500" -> "650"`. The lock catches a weight flip as well as a colour flip.
- **L1, main's seven sheets copied over the tree's** (`look-lock-under-main.txt`): the lock fails 16/16 on one identical 23-entry list:
  - `html` and `body` lose their height, margin, font, colour, background and `color-scheme`
  - the root `main.astraeus-shell` gains its background

  These are exactly the moves T-256 intended, which C-144's probe also excludes by name. There are no other differences. The probe's render routine is the same as the lock's, and the element counts are equal (349/280/361/292 per scenario in the baseline). So the baseline is main's look apart from the intended page-rule moves.

**I-141 mutations** (`mutations.txt`):

| Mutation | Result |
|---|---|
| M2: `createFrameState(props.controls.policy.id)` in `app/AstraeusScene.tsx` | `loadingCoverFrame` and `loadingCoverChain` both fail |
| M3: `claimCover={claimCover}` removed from `App.tsx`'s scene | both fail on behaviour assertions (not the packagePacks lint side effect C-144 saw) |
| M4: `claimCover={cover.claim}` removed from site `main.tsx` | `loadingCoverChain` fails |
| M5 (adjacent): first-frame `hideBootLoader` branch disabled in `sceneFrame.ts` | `loadingCoverFrame` fails: `expected 'loading' to be 'done'` |

Limit: the engine test runs the first-frame step (`stepAndPoseCamera`) by hand on the scene's own frame state, because the canvas is stubbed. The real `useFrame` scheduling is not driven, and `check:browser` still reads no loader state. The Issue's Proof Needed allowed a fast-suite test plus a site test in place of a browser step, and both exist.

**Remediation code paths.**

- `makeContainingBlock` now returns a restore. `mount`'s `unmount` restores the host's inline `isolation`, `position` and `overflow`. `hostPageDom.test.ts` tests an empty host, `overflow: auto` and `position: fixed`, and P-BOX-1 still passes 8/8.
- `AstraeusScene` styles only its own wrapper, so it needs no restore.
- The doc comment moved back above `MoonsSheet` (C-144 O6 resolved).
- `sceneFrame.test.ts` moved its context builder to `tests/helpers/frameContext.ts` without changing its tests. Both runs are green.

**Finite external-boundary matrix and workflow lock.** These are unchanged from C-144. The one new side effect, workflow step 5 (unmount restores the host's inline styles), has its oracle in `hostPageDom.test.ts`. The workflow step 4 cover oracle that C-144 found missing now exists: M2 to M5.

**Adversarial pass (re-check axes only).**

- A source-order or specificity flip: M1 and M1b are caught. Sheet order: both orders are in the lock.
- A bypass of the claim at any link of the chain is caught (M2 to M5).
- The lock is an independent oracle for the cascade: it uses happy-dom computed styles, not a specificity model. It is not a second copy of the old `cascade.mjs`.

## Gates (this run, `docs/evidence/check-o055-recheck-20261102/gates.log`; node v24.16.0, HEAD `009554b0`)

| Command | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 |
| `git diff --check 86001f4d HEAD` | clean |
| `git diff --check main HEAD` | exit 2, only on C-144's committed evidence `.txt` files (blank line at EOF); clean over `packages tools .savepoint package.json examples` (Observation 3) |
| `npm run test:full` (1) | exit 0, 10:48:52Z to 10:50:01Z |
| `npm run test:full` (2) | exit 0, 10:50:01Z to 10:51:10Z; `junit.xml`: 203 files, 2516 tests, 0 failures, 2 skipped; coverage statements 92.64%, branches 87.92%, functions 93.02%, lines 94.87% (both runs identical) |
| `npm run check:engine-alone` | pass in 21.7 s (138 files, 1536 passed, 2 skipped) |
| `npm run check:pack` | pass (14.1 s) |
| `npm run check:node-consumer` | pass (9 tests) |
| `npm run check:react-consumer` | pass |
| `npm run build:example` | exit 0 (hello-scene and hello-react from packed tarballs) |
| `npm run check:browser` (once; the shell/app CSS changed since C-144's run) | exit 0, 9/9 steps, 0 error lines, 349 s; evidence `docs/evidence/browser-20261102T105238Z/` |

The new tests ran inside the full gate: `computedLook` 17 (16 + the skipped writer), `loadingCoverFrame` 2, `loadingCoverChain` 1, `hostPageDom` 7, all with 0 failures.

## Code Health Evidence

`savepoint health check O-055 .` was run after the full gate and the browser run. Output: `health-check.txt`.

- Snapshot: `sha256:922c82e02c8c2523f87da173dee9eb970f3db436559e82e8d37692c703bb0231` (created).
- Verdict: "Code Health does not block clearance."
- Complexity (lizard), duplication (jscpd) and dependency vulnerabilities (osv-scanner): no finding.
- Coverage and tests: reported **stale**. That is a collection statement, not a finding. The reports are from the second `test:full` (10:51:10Z). Since then the tree has gained only this run's evidence files, the browser evidence folder and the snapshot, none of them inside `vitest.config.ts`'s include, and the 2516/2516 result stands.

The verdict neither grants nor withholds clearance.

## Acceptance Coverage

| Criterion | Class | Note |
|---|---|---|
| SC1 / T-250 | Proven | rows 1, 5 |
| SC2 / T-251 | Proven | row 2 |
| SC3 / T-252 | Proven | row 3 |
| SC4 / T-253 | Proven | row 4 |
| SC5 / T-254 | Proven | row 5 |
| SC6 / T-255 | Proven | rows 6 to 8; the cover chain is now guarded at every link (M2 to M5) |
| SC7 / T-256, T-257 | Proven | rows 9 to 11; look equal to main in every frozen cell; owner look recorded (row 12) |
| SC8 / T-258 | Proven | row 13; gates row 14 |

Design reconciliation: Design.md "Good guest (O-055)" now records:

- that the static model was retired, and why (I-140)
- the look lock and its regenerate command
- `mount`'s inline-style restore
- the new tests in the codebase map

This matches the code read here.

## Issues

None. No materiality actions are required.

## Owner Validation Still Needed

- T-258 declares `owner_validation.required: true`. The owner look is recorded, but no `accepted_check` is. The owner may record `accepted_check: C-145`.
- The owner's look on 2026-11-02 was taken before the repair. The only intended visible change since then is that an open nested fold heading in the Developer drawer (for example "Fine-tune") is accent orange again, as on main. A glance on `localhost:5490` with the Developer drawer open would confirm it. No criterion requires a new look.
- O-055 may close once the owner records T-258's acceptance and closes the Objective. I-140 and I-141 are verified below, and every owned Task is `done`.

## Observations (non-blocking)

1. **P-MOON-1 reports two "unhandled rejections"** (out of scope; probe artefact, not the engine). The probe attaches its `rejects` handler only after `releaseAll()`, so Node sees the rejection before the handler exists. A variant that only adds a no-op `.catch` at creation runs 3/3 with no errors (`probes/moons-early-handler.probe.test.ts`, `moons-early-handler-run.txt`). `moonSystem.ts` is unchanged since C-144.
2. **Careless regeneration of the look lock** (asked by the coordinator; no frozen cell, so this is not an Issue). The baseline is a fair guard today: it encodes main's look (L1), and any flip fails `npm test` with the element named. Regeneration has two weak points (`look-lock-regeneration.txt`):
   - **L2.** With the I-140 flip planted, `npm run look:lock` exits 0 and rewrites the baseline without a prompt; afterwards the lock passes 16/16. The baseline diff is 12 changed lines, and `#fc6323 -> #c7bdb3` is visible. But the changed lines are deduplicated style strings, not elements: which elements use a style lives in a separate index list. So `tools/look-lock.mjs`'s comment "every changed line is one element's computed style" is not accurate, and a reviewer sees what value changed, not where.
   - **L3.** With `LOOK_UPDATE=1` set in the environment, a plain `vitest run` of the lock skips every comparison, passes 17/17, and silently rewrites the tracked baseline.

   A possible follow-up, in the spirit of "Strategic fix first": refuse `LOOK_UPDATE` under `CI`, and/or have `look:lock` print the per-element differences it is accepting.
3. **`git diff --check main..HEAD` flags C-144's committed evidence files** (out of scope). The `cascade-*-listed.txt` files and `probe-guest-moons.txt` end with a blank line. The code is clean. This run's own `cascade-*.txt` files have the same shape and are not committed.
4. **Timestamps in records run ahead of the clock** (out of scope; record hygiene). The system clock read about 10:48Z to 11:05Z during this run. C-144 records `checked_at: 10:55Z`, and its browser folder is stamped 10:18Z. The `repair_attempted` entries on I-140 and I-141 say 12:00Z, which is later than this re-check. The order of events is clear from git (`86001f4d` then `009554b0`), so the evidence holds. The times were written by hand, not taken from the clock.
5. **Look lock limits.** These are stated in the test file: happy-dom cascade, no `:hover`/`:focus`, matchMedia stub. A browser computes specificity the same way, so the I-140 class of flip is covered; pseudo-state looks remain the owner's eye.
6. Resolved from C-144: O3 (the README wording), O5 (inline styles left after unmount, now restored and tested) and O6 (the misplaced comment).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**: the cover chain and the restore branch are now tested
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**: `PROPS`, `LAYOUTS` and the sheet orders are duplicated between the look lock and the C-144 evidence probe, but the probe is evidence, not code
- [ ] STYLE-08 **Comments explain why**: `tools/look-lock.mjs` says "every changed line is one element's computed style", but a changed baseline line is a deduplicated style row (Observation 2)
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**: the repair is 17 files; 309 of its lines are the generated baseline

## Probe Sources

Everything is in `docs/evidence/check-o055-recheck-20261102/`:

- `probes/`: C-144's three probes (path-adjusted) plus `moons-early-handler.probe.test.ts`
- `vitest.probe.config.ts`
- `old-sheets/`
- `probes-run.txt`
- `cascade-*.txt`
- `mutations.txt` (M1, M1b, M2 to M5)
- `look-lock-under-main.txt` (L1)
- `look-lock-regeneration.txt` (L2, L3)
- `gates.log`
- `health-check.txt`
