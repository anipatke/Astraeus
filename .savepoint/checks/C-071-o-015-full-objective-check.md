---
id: C-071
scope: {kind: objective, id: O-015}
result: NEEDS WORK
checked_by: {role: checker, session: o015-full-check-20261018}
executed_session: o015-builders-20261016-20261018
checked_at: '2026-10-18T01:45:00Z'
health_snapshot: sha256:5b7f9760a6b95aba8eba92fb038c86ace66285d97b0b95cc171db0f472b5b169
reviewed:
  base_commit: 3e1d130
  head_commit: 88c5d02
  files:
    - src/shell/storyPanels.ts
    - src/shell/useStoryPanels.ts
    - src/shell/StoryPanelView.tsx
    - src/shell/Sources.tsx
    - src/app/StoryMarkers.ts
    - src/experiences/showers/showerDefinition.ts
    - src/experiences/showers/showerSettings.ts
    - src/experiences/apollo11/apollo11.ts
    - src/experiences/earth-moon/earthMoonExplorer.ts
    - src/experiences/jupiter-io/jupiterIo.ts
    - data/stories/apollo11/panels.json
    - data/stories/perseids/panels.json
    - data/stories/geminids/panels.json
    - data/stories/earth-moon/panels.json
    - data/stories/jupiter-io/panels.json
    - data/showers/perseids.json
    - data/showers/geminids.json
    - tools/validate/load-budget.mjs
    - tools/validate/browser-story-panels.mjs
    - tools/validate/driver.mjs
    - tests/storyPanels.test.ts
    - tests/storyMarkers.test.ts
    - tests/storyStoriesAllDemos.test.ts
    - tests/showers.test.ts
    - tests/publicBuild.test.ts
    - docs/DONOR_PROVENANCE.md
    - .savepoint/Design.md
  dependencies: ['C-038 T-059', 'C-040 T-061', 'C-041 T-062', 'C-066 T-087', 'C-069 T-088', 'C-068 T-089']
issues: [I-038, I-039]
supersedes: null
unmet: [T-089 DW5, PROV-01, AGENTS Deferred Design reconciliation]
---

# C-071: O-015 Full Objective Check

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory only. T-087, T-088 and T-089 ran in lanes that were merged before this Check, so it is not a finding.)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: this is the initial Objective Check. I-031's repair is verified inside the matrix below.)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. **What is tested:**
   - O-015 Success Conditions 1–5.
   - Its Architectural Considerations: story data is never engine; settings come first.
   - Confirmed Decisions 1–8 (2026-10-16 and 2026-10-18, after the rescope to plain-words stories on every demo).
   - The Done When lists of T-059, T-061, T-062, T-087, T-088 and T-089.
   - I-031's Proof Needed.
   - Guardrails ARCH-01, ARCH-03, ARCH-04, PROV-01, TEST-01..03 and STYLE-*.
   - The AGENTS.md project rules: the scene-affecting full browser tier, the shared driver, historical evidence, and Deferred Design reconciliation.
2. **Files and entry points:** the files under `reviewed.files`. The public entry points are `parseStoryPanels`, `panelsCrossed`, `CrossingTracker`, `useStoryPanels`, `StoryPanelView`, `Sources`, `groupStoryMarkers`, `panelForMarkerPress` and `StoryMarkerLayer`, plus the shower `story.panels` setting and the five demo pages (`app.html`, `?experience=shower-perseids|shower-geminids|earth-moon|jupiter-io`).
3. **What they rely on:** the simulation clock (play, pause and seek), the Vite JSON import and glob, the public build's load budget, and the dev and preview servers used by the browser run.
4. **Matrix axes:**
   - Input shape (parser).
   - State and transitions (crossing, hold, seek, close, shared marker).
   - Environment: desktop side panel and phone sheet; dev and public build.
   - Boundaries: window ends, pause bounds, marker times.
   - Representations: settings file, parsed set, rendered panel.
   - Content accuracy: every figure against its named source.
   - The text-width and Unicode class is not applicable. No truncation or width logic is in scope, and panels wrap freely.
5. **Admission boundary:** supported paths only, meaning the five shipped stories and synthetic stories through the public parser. Hypothetical hand-edited settings that break React keys are an observation, not an Issue.

Out of scope: O-020, O-024 and O-025 work, including the T-090 developer panel that is on HEAD (it is checked by C-070).

## Fresh full gate

The T-090 lane run (`docs/evidence/o020-t090-full-20261018T005955Z`) was **not reused**. Its code does match HEAD: `git diff --stat 023b55a HEAD -- . ':!.savepoint' ':!docs/evidence'` shows only the seven T-090 files, and `git diff fe83e49 HEAD` outside `.savepoint` and evidence is empty. But it ran in an uncommitted lane worktree with no recorded commit, and this Check is not a metadata-only correction. AGENTS.md therefore requires a fresh run.

Fresh run on HEAD `88c5d02` (clean tree), node v24.16.0, 2026-10-18 01:18Z to 01:32Z UTC (12:18–12:32 local). It started only after `pgrep -f '[c]hrome-headless-shell'` came back empty and the 1-minute load was 0.55. Command:

```
PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js DEV_PORT=5611 PUBLIC_PORT=5612 bash tools/validate/run-full.sh docs/evidence/o015-full-check-20261018T011817Z
```

- **Result:** 24/24 steps exit 0, error-lines 0, 852 s, exit 0 (`summary.txt`). Story-panels: 23 ok lines, zero console errors, every story included.
- **Picture check:** 20 pictures, 2 identical, max 12.3788% over 16 levels against `o017-baseline-20261017`. That is the same order as the T-087, T-088 and T-090 runs (12.386%). The baseline predates the merged O-020 timeline and phone work, so the figure is not an O-015 signal. The owner contact sheet is `docs/evidence/o015-full-check-20261018T011817Z/contact-sheet.png`.
- **Unit gates:**
  - `npx tsc --noEmit`: exit 0.
  - `npx vitest run`: 64 files, 1012 passed, 1 skipped. This includes `tests/nameCheck.test.ts` and `tests/browserDriverGuard.test.ts`.
  - The configured test gate, `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: passed.
  - `npm run build`: exit 0, with the usual chunk-size warning only.
- **Checker probe harness:** an independent scratch vitest file, not committed, run with `npx vitest run --config <scratch>/vitest.config.mts`. 27 cases passed, listed in the matrix below.

## Coverage matrix

| Requirement | Result | Evidence |
|---|---|---|
| SC1 / ARCH-03 text, times and badges in story settings; a further story needs no code | Proven | Five stories in `data/stories/<story>/panels.json`. Geminids is wired by settings only (`data/showers/geminids.json` `story.panels`). Synthetic stories in `tests/storyPanels.test.ts` (made-up orbiter, 2100 dates), `tests/showers.test.ts` "story panels carried by shower settings (ARCH-03)" (made-up `test-drift` shower), and `tests/storyMarkers.test.ts` (three panels on one made-up object). |
| SC2 / PROV-01 badge per panel, source line per fact | **Issue I-039** (one panel), otherwise Proven | Checker data probe over all 22 panels: every panel has a badge and at least two source lines. Every number in a body appears in its `details`. Apollo figures were re-derived from `anchors.json`: A-02 at 2:50:03.2 GET is 16:22:03 UTC, and 10.84 km/s × 3600 is 39,024 km/h. The red-moon panel quotes NASA's TD greatest-eclipse time as UT (I-039). |
| SC3 desktop side panel, phone bottom sheet with swipe; donor ports credited | Proven | Story-panels run: "side panel at right", "phone shows a bottom sheet with a handle (329 px tall)", "swipe down dismisses", "a short drag keeps the sheet open". `docs/DONOR_PROVENANCE.md` §"Spike 04 — story panels" (line 128). |
| SC4 brief pause then resume; scrubbing never stacks | Proven | Story-panels run: holds, resumes on its own, Continue, "scrubbing back and forth … opens nothing", one panel at a time, pause 0 and live pause length. Probes: an exact landing on a panel time opens it once and a repeat tick does not; one big tick over two panels opens only the newest; backward, paused, auto-off and double-rebase transitions open nothing. |
| SC5 / ARCH-01 no story wording in engine or shell; existing scripts pass | Proven | `tests/nameCheck.test.ts` passes. A checker grep of `src/shell`, `src/app` and `src/core` for the story names finds only `src/core/bodies/` body definitions, which are owned by the bodies rule. The full run passed 24/24. |
| Decision 1–3 light panels, no chapters, auto-open at markers | Proven | No chapter construct. The Apollo seven open in order. |
| Decision 4 / T-088 DW1–4 warm plain words, figures in details, no fact lost | Proven (wording accepted by the owner) | Probe: Apollo and Perseids bodies have 2–3 sentences, at most one number and no acronyms. `tests/storyPanels.test.ts` "no fact lost" cases run against the frozen fixture `tests/fixtures/storyPanelBodiesBeforeT088.json`. The comparison working was checked by hand (12 min 34.8 s, 21 h 36 min 20.9 s, 3 h 40 min 59.2 s). Owner read, "3 good", is recorded in T-088 Owner Completion. |
| Decision 5 / T-087 one folded "details and sources", closed by default | Proven | `src/shell/Sources.tsx` is the single `<details>`, labelled by whether there are details. Story-panels and phone scripts open and fold it through the driver. Parser probes: `details` that is `[]`, blank, a number or an object each throw a named `details` error, and an absent `details` becomes `[]`. |
| Decision 6 / T-089 stories on every demo | Proven, except I-039 | Geminids, Earth–Moon and Jupiter–Io each have three panels opening in order in the browser run, each panel inside its window (`tests/storyStoriesAllDemos.test.ts`). The `span=activity` view keeps the two December Geminids panels. |
| Decision 7 sources collapsible built once (T-081) | Proven | The story panel reuses `Sources`, so there is no second collapsible. |
| Decision 8 owner accepts T-059, T-061 and T-062 with the rewritten copy | Proven | Owner Completion sections dated 2026-10-18 in each Task. The acceptance scope (the copy as rewritten by T-088) has not changed since, so it still applies. |
| T-089 DW5 eclipse time checked against a published table | **Issue I-039** | The NASA decade table's column is "TD of Greatest Eclipse". The panel opens at 06:59:56 and calls it UT. UT is about 06:58:41. |
| I-031 Proof Needed 1–3 | Proven | `groupStoryMarkers` and `panelForMarkerPress` are generic. Probes: one marker per object with panels in time order; the clock rule at −∞, 9, 10, 20, 29.9 and 1e9; a press while another object's panel is open; three presses reach all three panels; a single-panel group returns its own panel. Browser: "a shared marker reaches every panel on it (powered-descent, touchdown, ascent-docking)". Shell and spike03 passed in the fresh run. |
| Shared driver rule | Proven | `tests/browserDriverGuard.test.ts` passes. The new story steps call `driver.mjs` only. |
| Historical evidence | Proven | A fresh directory was used. The earlier T-088 and T-089 failed runs are kept as history. |
| Deferred Design reconciliation (AGENTS.md) | **Issue I-038** | See Design reconciliation below. |

### Finite external-boundary matrix

| Cell | Result |
|---|---|
| Configured vs actual target | Dev server on 5611 and a scratch public build on 5612, both started by `run-full.sh` and stopped afterwards. Nothing was left listening. |
| Startup and reuse ordering | `wait_for` gates both servers. The pictures step runs alone first. |
| Unavailable dependency or non-success response | The script exits on a failed public build or a server that never answers. Not exercised; the boundary is not touched by O-015. |
| Bundler split of `panels.json` | `load-budget.mjs` admits same-stem chunks only when a listed script imports them. `proveSameStemChunks` and `tests/publicBuild.test.ts` pass, and `public-build-assets` exit 0. |
| Timeout, cancellation, retry, secrets | Not applicable: no network, retry or secret path in the story layer. |

### Workflow and side-effect lock

| Order | Operation | Side effect | Failure / final state | Oracle |
|---|---|---|---|---|
| 1 | Parse settings at module load (`parseStoryPanels`) | none | A named `StoryPanelError` aborts the experience build. The data mistake surfaces at build or test time. | Parser probes and existing tests |
| 2 | Clock tick crosses a panel (`CrossingTracker.advance`) | opens panel | none | Probes |
| 3 | Hold (`setPlaying(false)`, `holding`) | playback paused | Timer resumes. Continue, Play or Close end the hold. A seek clears the hold without resuming. | Browser: held 4212 ms for a 2 s setting under load; resumes |
| 4 | Marker press | opens panel (no seek) | none | Browser and probes |
| 5 | Close or Escape during a hold | resumes playback | none | Browser "Escape closes"; `close()` code path |

## Adversarial pass

1. Could another path bypass validation? Showers go through `showerStoryPanels`, which calls `parseStoryPanels`. Apollo, Earth–Moon and Jupiter–Io call it directly. There is no unvalidated path to `experience.storyPanels`.
2. Could a backward, skipped or looped transition open a panel? No: rewind, loop wrap, seek and paused ticks are all probed.
3. Could a mode change lose information on the phone sheet? The sheet and the side panel render the same `Sources` section (phone script).
4. Could duplicates create an impossible model? A duplicate id throws. Duplicate body, details or source lines are accepted by the parser and would give React duplicate-key warnings, because `Sources` and `StoryPanelView` key paragraphs by their text. No shipped panel has a duplicate line (probe). This is an observation.
5. Are the tests independent? The red-moon test asserts the builder's own reading of the catalogue, and that reading is wrong (I-039). The other content tests compare against frozen pre-rewrite text or the anchors file.
6. Content facts were spot-checked against independent knowledge:
   - Apollo GETs and UTCs: correct.
   - Voyager 1 Io encounter (5 March 1979) and the Peale et al. date (2 March 1979): correct.
   - Full Moon of 13 January 2025 at 22:27 UT: correct.
   - Lunar eclipse greatest time: wrong time scale (I-039).

## Design reconciliation

The AGENTS.md rule requires each deferred note to be accounted for before this Check. O-015 has no integration Task; T-059's drift note asked the planner to name one, and none was named. The current `.savepoint/Design.md` is stale on the following points (I-038):

1. Line 151 says two panels on one object stack and I-031 is open. The code now groups markers by object.
2. The `details` field and the folded "The details and sources" section are not described.
3. Line 151 says "Geminids carries none". In fact all five demos now have a story. The Earth–Moon story is planned for removal by O-024 T-093; this Check notes that and takes no action on it.
4. Shower pages load every story's panels file eagerly (`showerDefinition.ts:30`). Design needs a line on this, or a note that it is non-architectural.
5. The line-153 load budget needs the same-stem chunk rule.
6. The line-193 open items still list I-031 open and the owner's panel read as pending.

This Check does not edit Design.md (savepoint-check Rules). The repair belongs to the planner or an executor under I-038.

## Code health

Snapshot `sha256:5b7f9760a6b95aba8eba92fb038c86ace66285d97b0b95cc171db0f472b5b169` from `savepoint health check O-015 .`, run once after the full gate: "Code Health does not block clearance."
- Complexity, duplication, dependency vulnerabilities and tests: no finding.
- Coverage: stale. It is optional and not written by this gate.

This is supporting evidence only.

## Issues pass

- **I-038 (drift):** O-015's deferred Design notes are not reconciled. This violates the AGENTS.md "Deferred Design reconciliation" project rule.
- **I-039 (defect):** The Earth–Moon eclipse panel gives NASA's TD greatest-eclipse time as UT, 75 s late. This violates T-089 DW5 and PROV-01.
- **I-031:** Proof Needed met (matrix above). It stays open because only a `CLEAR` Check may close it as `verified`. A `rechecked` history entry naming C-071 has been appended.

Every other criterion is Proven.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-038 Design not reconciled | High: Design.md is wrong today for anyone reading it | Low to Medium: wrong architecture notes mislead later planning (for example "markers stack", "Geminids has none"). No user-facing effect. | Medium | Fix now. It is a documentation-only edit by the planner or an executor, and it is cheap. |
| I-039 eclipse time scale | Low: only visible to someone who opens the red-moon details | Low: 75 s on a demo at 1 hour per second; one stated figure and its source label are wrong | Low | Fix in place (shift the panel time to UT, show the working in details, fix the test), or let O-024 T-093's removal of the Earth–Moon story resolve it. If T-093 lands first, the owner may resolve I-039 on that basis. |

## Owner decisions carried forward

The owner acceptances on T-059, T-061, T-062, T-088 and T-089 (`owner_validation`, Owner Completion 2026-10-18) cover the copy as read on the preview. That copy is unchanged since, so the acceptances still apply. No owner exception exists on O-015.

## What closes O-015

1. Repair I-038: a Design.md edit by the planner or executor.
2. Repair I-039, or the owner resolves it as `accepted`, or it is mooted by T-093.
3. Run a recheck (a new Full Check superseding C-071). It would also close I-031 as verified.

Every owned Task is already done.

## Observations (non-blocking)

1. Duplicate body, details or source lines would produce React duplicate-key warnings (`src/shell/Sources.tsx`, `src/shell/StoryPanelView.tsx` key by text). The parser does not reject them. No shipped panel has one.
2. `git diff --check 023b55a HEAD` reports trailing whitespace in `src/app/App.tsx` lines 303, 405 and 426. These come from T-090 (O-020 scope), not O-015.
3. Three plain sentences carry no dedicated source line (C-069 observation 1: "landed on another world", "a huge lump of ice and rock", "sheds a little more dust"). They are general statements covered in substance by each panel's sources, so they are not admitted as a PROV-01 Issue.
4. The picture baseline `o017-baseline-20261017` is out of date (about 12% difference on every picture since the O-020 merges). Until it is renewed, the picture step informs only the owner's look, not a tolerance.
5. Under the three-lane load, the "pause length 2 s" hold measured 4212 ms. The script's loose bound accepts this (T-059 limitation). The timer is correct; browser timing under load is not exact.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: O-015 work was batched with other Tasks in shared commits (C-038 observation, 8f0bcec, 28 files).
