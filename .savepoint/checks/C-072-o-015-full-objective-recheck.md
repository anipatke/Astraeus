---
id: C-072
scope: {kind: objective, id: O-015}
result: CLEAR
checked_by: {role: checker, session: o015-full-recheck-20261018}
executed_session: o020-orchestrator-20261018
checked_at: '2026-10-18T02:30:00Z'
health_snapshot: sha256:49c681c2f8bfd5641ea6b3eafd115611796fe13ac97bffd30e0116d5ed04aa93
reviewed:
  base_commit: 88c5d02
  head_commit: 43b51df
  files:
    - .savepoint/Design.md
    - data/stories/earth-moon/panels.json
    - tests/storyStoriesAllDemos.test.ts
    - src/shell/storyPanels.ts
    - src/shell/Sources.tsx
    - src/app/StoryMarkers.ts
    - src/experiences/showers/showerDefinition.ts
    - tools/validate/load-budget.mjs
    - tests/storyPanels.test.ts
  dependencies: ['C-071 O-015']
issues: []
supersedes: C-071
---

# C-072: O-015 Full Objective Recheck

Fresh checker session. It built and repaired none of O-015's Tasks and none of the I-038 or I-039 repairs. Main checkout (not a lane), branch `o018-o019`, HEAD `43b51df`, clean tree at start. The scope lock is C-071's frozen lock, unchanged; no axis was added. Every owned Task (T-059, T-061, T-062, T-087, T-088, T-089) is owner-`done`, and no Task or Objective file changed since `88c5d02`. This run edited no Task status, Objective status, router, Design or implementation file.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope (C-071's lock, reused unchanged as the method requires for a re-check)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-071's matrix, re-run below)
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory only; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Closure map of prior Issues

| Issue | Prior state (C-071) | Now |
|---|---|---|
| I-038 Design not reconciled | Issue | **Closed, verified** by this Check |
| I-039 eclipse time TD given as UT | Issue | **Closed, verified** by this Check |
| I-031 stacked story markers | Proof met, left open | **Closed, verified** by this Check |

## What changed since C-071

`git diff --stat 88c5d02 43b51df` outside `.savepoint` records and `docs/evidence` touches exactly two files: `data/stories/earth-moon/panels.json` (the `red-moon` panel's time, first details line and two source lines) and `tests/storyStoriesAllDemos.test.ts` (the eclipse assertion). `.savepoint/Design.md` changed in the story-panel paragraph (line 151), the load-budget sentence (line 153) and the open-items paragraph (line 193). No unrelated lane merged in this range. No source, tool, dependency or gate-definition file changed, so every C-071 finding outside these files is unaffected; all of them were re-run in the fresh gate below.

## Admission ledger

| Re-check item | Prior Issue or claim | Frozen cell (C-071) | Allowed result |
|---|---|---|---|
| Design items 1–6 | I-038 Proof 1–3 | "Deferred Design reconciliation (AGENTS.md)" row | Proven or Issue |
| Panel time and details in UT with working; sources say TD | I-039 Proof 1 | "T-089 DW5" and "SC2 / PROV-01" rows | Proven or Issue |
| Test derives UT from TD and Delta T | I-039 Proof 2 | Adversarial pass item 5 (test independence) | Proven or Issue |
| Shared marker reaches every panel | I-031 Proof 1–3 | "I-031 Proof Needed 1–3" row | Proven or Issue |
| Every other C-071 row | none | each row as written in C-071 | Proven or Issue |

## Repair verification

### I-038 (Design reconciliation)

Each deferred note was checked against the code on `43b51df`:

1. **Markers group by object.** Design line 151 now says `groupStoryMarkers` makes one marker per object carrying `data-panel-ids`, `panelForMarkerPress` opens the panel the clock reached or the next in time order, wrapping, and the marker layer receives the clock time. Code: `src/app/StoryMarkers.ts:28` (`groupStoryMarkers`), `:43-46` (`panelForMarkerPress`, `(openIndex + 1) % panels.length`). Matches.
2. **`details` and the folded section.** Line 151 lists the optional `details` list "validated like `body`, default `[]`" (`src/shell/storyPanels.ts:110`, `raw.details === undefined ? [] : lines(id, "details", raw.details)`) and the single `Sources` section labelled "The details and sources" or "Sources · n" (`src/shell/Sources.tsx:10`). The plain-voice rules it cites (two to four sentences, at most one number, no acronyms, body numbers repeated in details, no fact lost) match `tests/storyPanels.test.ts:228-243` and the frozen-fixture cases. Matches.
3. **Every demo has a story.** Line 151 says so, names the Earth–Moon and Jupiter–Io panel files and `parseStoryPanels` in `earthMoonExplorer.ts`/`jupiterIo.ts`, says "Perseids and Geminids carry three panels each", and notes the Earth–Moon story is due to go with O-024 T-093. "Geminids carries none" is gone. Matches.
4. **Eager glob.** Recorded as kept, with a reason (a few kB; narrowing would need the generic path to know shower stories by name). Code: `src/experiences/showers/showerDefinition.ts:30`, `import.meta.glob(..., { eager: true })`. This satisfies Proof 1's "explicitly non-architectural, with a reason" option.
5. **Same-stem chunk rule.** Line 153's load-budget sentence now describes admitting same-named chunks only when a listed script imports them, naming `proveSameStemChunks` (`tools/validate/load-budget.mjs:179`). Matches.
6. **Open items.** Line 193 no longer lists I-031 as open or describes stacked markers as current; it says I-031 was repaired by T-088 and awaits verification in this recheck, and states the owner read the panels on 2026-10-18 and accepted all six O-015 Tasks. That matches the Owner Completion sections. The sentence will read as slightly dated once this Check closes I-031; that is ordinary Design upkeep, not a finding.

Result: I-038 Proof Needed 1, 2 and 3 are met. **Proven.**

### I-039 (eclipse time scale)

- `data/stories/earth-moon/panels.json:54`: `red-moon` now opens at `2025-03-14T06:58:41Z`.
- Details line 1 gives "06:58:41 UT" with the working: catalogue 06:59:56 TD minus Delta T 75 s.
- Both NASA catalogue source lines now label 06:59:56 as TD. A repo-wide search (`src tests tools data docs`, evidence excluded) finds no remaining "06:59:56 UT".
- Independent probe (checker's own node script, not the repo test): `Date.UTC(2025,2,14,6,59,56) - 75000` equals the panel time. The NASA Science totality window 06:26 to 07:31 UTC has its midpoint at 06:58:30, 11 s from the panel time, which fits UT and not TD (86 s off).
- The panel order (same-face, drifting-away, red-moon) is unchanged, and `tests/storyStoriesAllDemos.test.ts` still proves each panel is inside the Earth–Moon window.
- `tests/storyStoriesAllDemos.test.ts:51-55` now derives the expected instant as `catalogueTd - deltaTSeconds * 1000` and asserts "06:58:41 UT" in the details. Reverting the panel to the TD instant would fail it. This is the oracle Proof 2 asks for.
- Browser: the fresh run's story-panels step reports "Earth–Moon panels open in order on playback; a marker reopens one (same-face > drifting-away > red-moon)".
- The panel body (the plain story) is unchanged.

Result: I-039 Proof Needed 1 and 2 are met. **Proven.**

### I-031 (stacked markers)

There is no change to `src/app/StoryMarkers.ts`, the Apollo panels or `tests/storyMarkers.test.ts` since C-071 verified the proof. The fresh run repeats Proof 3: story-panels "a shared marker reaches every panel on it (powered-descent, touchdown, ascent-docking)", and shell and spike03 exit 0 with zero error lines. `tests/storyMarkers.test.ts` passes in the fresh unit gate. **Proven.**

## Fresh full gate

The data and a test changed, so nothing was reused. All runs were on HEAD `43b51df`, node v24.16.0.

- `npx tsc --noEmit`: exit 0. `npm run typecheck`: exit 0 (01:39Z).
- Configured test gate `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` (vitest run): 64 files, 1012 passed, 1 skipped, exit 0. This includes `tests/nameCheck.test.ts`, `tests/browserDriverGuard.test.ts`, `tests/storyPanels.test.ts`, `tests/storyMarkers.test.ts` and `tests/storyStoriesAllDemos.test.ts`.
- `npm run build`: exit 0, with the usual chunk-size warning only.
- `git diff --check 88c5d02 43b51df -- . ':!docs/evidence'`: clean.
- Browser full tier. Each launch waited until `pgrep -f '[c]hrome-headless-shell'` was empty and the 1-minute load was under 6, re-checked right before launch.
  - **First run**, `docs/evidence/o015-recheck-20261018T015434Z` (launched 01:54Z, load 2.57): 23/24 steps exit 0. `spike02` exited 1 on "range changes continuously within the speed bound" (`tools/validate/browser-spike02.mjs:193`, the Apollo 100× follow-telemetry sampling bound that T-071 already loosened once for load). Zero console errors in every step. This is the load-sensitive timing bound running beside the other parallel steps. It is outside O-015's change set, which touched no Apollo, telemetry or scene file. The directory is kept as history.
  - **Second run**, the gate of record, `docs/evidence/o015-recheck-20261018T020900Z` (launched 02:09Z, load 5.48):

    ```
    PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js DEV_PORT=5621 PUBLIC_PORT=5622 bash tools/validate/run-full.sh docs/evidence/o015-recheck-20261018T020900Z
    ```

    Result: **24/24 steps exit 0**, error-lines 0, 800 s (`summary.txt`). spike02 passed in 239 s. Story-panels gave 23 ok lines, including "zero console errors". The public build licence gate (`public-build-assets`) and the public showers check passed.
  - **Picture check:** 20 pictures, 2 identical, max 12.3788% over 16 levels against `o017-baseline-20261017`. This is the same figure as C-071, so nothing visible changed. The baseline predates O-020, as C-071 observation 4 notes. The owner contact sheet is `docs/evidence/o015-recheck-20261018T020900Z/contact-sheet.png`.

## Coverage matrix (C-071's frozen rows, re-run)

| Requirement | Result | Evidence on 43b51df |
|---|---|---|
| SC1 / ARCH-03 story settings; no code for a further story | Proven | Unchanged code; `tests/storyPanels.test.ts`, `tests/showers.test.ts` (made-up `test-drift` shower), `tests/storyMarkers.test.ts` pass |
| SC2 / PROV-01 badge and sources per panel | Proven | I-039 repaired (above). Other panels unchanged since C-071's 22-panel probe |
| SC3 desktop side panel, phone sheet, swipe; donor credit | Proven | Story-panels run: side panel, phone sheet, swipe dismiss, short drag keeps open. `docs/DONOR_PROVENANCE.md` unchanged |
| SC4 hold then resume; scrubbing never stacks | Proven | Story-panels run passes the hold, resume, Continue and scrub steps. `src/shell/useStoryPanels.ts` and `storyPanels.ts` unchanged |
| SC5 / ARCH-01 no story wording in engine or shell; scripts pass | Proven | `tests/nameCheck.test.ts` passes; full run 24/24 |
| Decisions 1–3 | Proven | Unchanged |
| Decision 4 / T-088 DW1–4 | Proven | Voice tests pass, including on the edited red-moon panel (body unchanged) |
| Decision 5 / T-087 one folded section | Proven | `Sources.tsx` unchanged; story-panels "details folded then shown" passes |
| Decision 6 / T-089 stories on every demo | Proven | Earth–Moon, Jupiter–Io and Geminids panels open in order in the browser run |
| Decision 7 one collapsible | Proven | Unchanged |
| Decision 8 owner acceptances | Proven | See Owner decisions carried forward |
| T-089 DW5 eclipse time checked against a published table | **Proven** (was I-039) | See I-039 above |
| I-031 Proof 1–3 | Proven | See above |
| Shared driver rule | Proven | `tests/browserDriverGuard.test.ts` passes; no script changed |
| Historical evidence | Proven | Both recheck runs went to new directories; C-071's directory is untouched |
| Deferred Design reconciliation | **Proven** (was I-038) | See I-038 above |

External-boundary matrix: unchanged from C-071. Dev server on 5621 and scratch public preview on 5622 were started by `run-full.sh` and stopped afterwards; nothing was left listening on either port. Workflow and side-effect lock: unchanged from C-071, and every listed operation was exercised by the passing story-panels step.

## Adversarial pass (re-check)

- Is the new test independent? It derives UT from the catalogue's published TD and Delta T rather than repeating the panel's value. The checker also cross-checked the result against a third, separate figure (the NASA Science totality window).
- Could the time shift break the order or window? No. Red-moon is still last, about two months after drifting-away, and inside the window (tests pass).
- Did the Design edit introduce a false claim? Each new sentence was compared with the code it names (I-038 items 1 to 5). No false claim was found.

## Code health

Snapshot `sha256:49c681c2f8bfd5641ea6b3eafd115611796fe13ac97bffd30e0116d5ed04aa93` from `savepoint health check O-015 .`, run once after the full gate: "Code Health does not block clearance."

- Complexity, duplication and dependency vulnerabilities: no finding.
- Coverage: stale. It is optional and not written by this gate.
- Tests (vitest-junit): stale. It is optional. `junit.xml` was written by the 01:39Z test gate, about 50 minutes before collection, because the two browser runs ran in between. This is a collection-age statement, not a test failure: the gate passed.

This is supporting evidence only.

## Issues pass

Every criterion in the frozen lock is Proven. No new Issue was admitted. I-031, I-038 and I-039 are closed as `verified` by this Check.

No materiality actions are required.

## Owner decisions carried forward

The five owner acceptances (`owner_validation` on T-059, T-061, T-062, T-088 and T-089) were assessed. All five apply.

Their applicability is recorded here, in the same way as C-071, and not as `carried_forward` entries on the Tasks. Savepoint refuses an Objective-scoped Check in a Task acceptance's `carried_forward`. The load error was: "check C-072 is scoped to objective O-015, not task T-059 of the originating check C-038". The attempted entries were therefore reverted. The per-decision assessment follows.

- T-059, T-061, T-062 and T-088: nothing in their scope changed since C-071.
- T-089: the only change is the I-039 correction. The eclipse panel opens 75 s earlier, which is about 0.02 s of playback at 1 hour per second, and its folded details and source lines now give the time scale correctly. The plain story the owner read and accepted ("3 good") is unchanged, as is the experience of panels opening in order. That is not a material change to what the owner judged.

No owner exception exists on O-015.

## What closes O-015

1. Every owned Task is done.
2. This Check is CLEAR and current.
3. Every Issue linked to O-015's Checks is now resolved.

The owner may close O-015 and commit, per the "commit at Objective close" rule. Owner look, if wanted: the contact sheet `docs/evidence/o015-recheck-20261018T020900Z/contact-sheet.png`.

## Observations (non-blocking)

1. C-071 observations 1, 3, 4 and 5 still stand: duplicate-key risk on hand-edited duplicate lines; three general sentences without a dedicated source line; the outdated picture baseline; hold timing under load. Observation 2 (trailing whitespace in `src/app/App.tsx`) is O-020 scope.
2. `browser-spike02.mjs:193`'s follow-telemetry bound failed once under the full tier's own parallel load (first run above) and passed on the immediate fresh rerun. This is O-020/Apollo telemetry scope. It is worth watching; if it recurs, it is a candidate for the I-033 lite/full tier maintenance.
3. Design line 193 says I-031 "awaits verification in the O-015 recheck". After this Check it is verified; the planner may update the sentence at the next Design touch.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why** (the new test comment states why UT = TD − Delta T)
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: O-015 work was batched with other Tasks in shared commits (C-038 observation, 8f0bcec, 28 files). The repair commit itself is small.
