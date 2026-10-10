---
id: C-010
scope: {kind: objective, id: O-008}
result: NEEDS WORK
checked_by: {role: checker, session: o008-check-20261011}
executed_session: t024-t026-20261010-11
checked_at: '2026-10-10T20:53:00Z'
health_snapshot: sha256:03d8d766f4388d64a8e9d60d5a4b6b92ab9c3bef9e39728628e6c7fde6af6d27
reviewed:
  base_commit: ebc40df
  head_commit: ebc40df
  files:
    - src/app/App.tsx
    - src/app/EarthMoonScene.tsx
    - src/app/experienceDefinition.ts
    - src/main.tsx
    - src/mission/apollo11Definition.tsx
    - src/synthetic/syntheticDefinition.ts
    - tests/experienceDefinition.test.ts
    - tests/experiencePlugIn.test.ts
    - docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md
    - tools/validate/browser-synthetic.mjs
    - .savepoint/Design.md
  dependencies: []
issues: [I-015, I-016]
unmet: [O-008.SC1, O-008.SC2, ARCH-03]
supersedes: null
---

# C-010: O-008 Full Objective Check

NEEDS WORK. The Apollo import boundary and working synthetic fixture are proven, with fresh successful gates. Layer opt-in is incomplete, and the audit does not fully justify every GAP. These are two bounded repairs, not a request to build later spike capabilities.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation — first Check; not applicable
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope and independence

Fresh checker conversation; this session built none of T-024–026. Main checkout, not a lane. Baseline is HEAD ebc40df plus the current uncommitted implementation and new files; the equal commit IDs do not imply an empty diff. Existing owner/executor changes were preserved. No implementation, acceptance criteria, Design or router was repaired. All owned Tasks are owner-done with explicit named Task-check waivers; those waive only optional Task Checks. No lane or manifest requirement is imposed.

### Frozen initial scope lock

Written before focused adversarial probes at `/tmp/astraeus-c010/scope.md`, reproduced here as the authoritative recheck boundary:

1. O-008 SC1–4 and T-024–026 Done When; ARCH-01/02/03, PROV-01, TEST-01/03/04. Gates are typecheck, build, configured JUnit test, diff check and all five browser scripts.
2. Changed public paths: `App(definition)`, `ExperienceDefinition`, `trackedBodiesOf`, entry URL selection, Apollo/synthetic factories and scene runtime. Audit and Design reconciliation; core scientific contracts remain unchanged. I-014 accepted tolerance is context, not reopened.
3. Runtime: definition → clock/adapter/Moon → metrics → shell → scene → tracked views/camera. Browser assets are local. Fixtures are trusted typed configuration, not an untrusted parser.
4. Matrix axes/cells are the tables below: both fixtures; exact trajectory bounds and adjacent milliseconds; layer sets empty/earth-only/tracked-only/both/duplicate; optional sections; shell and factory assembly; playback/seek/camera/scale/reload and URL fallback; all audit gaps and drift notes; five browser workflows.
5. Material boundary is advertised layer selection, configuration reuse, audit completeness and unchanged Apollo. Arbitrary future scene backends, data fidelity, remote dependency internals and hot swapping definitions are outside scope. No public entry hot swaps. Wrong/mixed types, nonfinite JS config and mutation after validation are N/A: trusted TypeScript fixture boundary and no new validator. Missing optional sections and empty/duplicate layer lists are supported and included. Unicode width/output-sink modes are N/A: no changed width or CLI formatter. Existing shell tests support unchanged input handling, not a broadened perimeter.

## Invariants and coverage matrix

| Requirement | General invariant and independent evidence | Classification |
|---|---|---|
| SC1; T-024.1/2 | Every need is classified, and every GAP answers capability, reused contract, gap, change, independent evidence and ownership challenge. Need table is complete; GAP-4 and GAP-5 answers are incomplete (I-016); GAP-3b needs explicit shared-answer clarification. | Issue |
| T-024.3 | Existing one-body trajectories are considered before batch abstraction. §3 records count, heap and per-frame cost at 1k/10k/100k; 59 ms exceeds the 16.7 ms frame budget at 100k. Reasoned bound supports high-count gap; numbers are a one-machine claim, not independently rerun. | Proven as a stated measure, not universal performance |
| T-024.4/5/6 | Proposed boundary names shell, clock, layers, metrics, camera and panels; published facts are candidate sources with explicit illustrative boundary; research added no production code. Audit exists in baseline; later source changes belong to T-025/026. | Proven |
| SC2; T-025.1/2 | Generic app imports no experience; entry supplies definition. Import scanner and source review pass. Recorded camera/panel deviations are accounted for, but layer opt-in is not implemented for Earth–Moon (I-015). | Issue |
| T-025.3/4/5 | Existing tests remain unchanged except I-014's separate owner-accepted tolerance; four original browser scripts pass; core diff empty. | Proven |
| SC3; T-026.1/2/4 | Alternative fixture supplies its own objects/events/clock/provenance and factory through the same entry; browser smoke plus URL matrix and contract tests establish actual mount. No claim of arbitrary non-Earth scene support is proven. | Proven for the supplied fixture; generic opt-in gap assigned to SC2 |
| SC4; T-026.3 | Automated name check includes core, shell and generic app and tests nonempty scans. No prohibited names found. | Proven |
| T-026.5 | Design accounts for every T-024/025 drift item: Earth–Moon dependency, camera limits/far, metrics/panels, optional camera and query selection. Recording the layer defect does not grant an exception. | Proven reconciliation |

| Public surface / cell | Normal | Boundary / alternate / bypass | Result and oracle |
|---|---|---|---|
| Definition + trackedBodiesOf, both fixtures | Both layers | Empty, earth-only, tracked-only, duplicate tracked layer | 10 finite cases pass tracked-body counts; Earth layer omission is I-015 |
| App → scene orchestration | Apollo/synthetic browser mount | Synthetic definition with layers empty; no generic source edit | Earth–Moon canvas still mounts; source confirms unconditional Moon and body meshes. I-015 |
| Metrics factories, both fixtures | Own body | Each of 3 bodies at start−1/start/end/end+1; unknown id | 12 rows produce 0/3/3/0 metrics; unknown id returns []; pass |
| Shell config assembly | Both fixture labels | Synthetic excludes Apollo labels, empty anchors/no panels | Contract tests and smoke pass; illustrative provenance/limitations and two events present |
| Entry selection | No query; synthetic | Unknown value; repeated synthetic then unknown; reload synthetic→default | Four independent URL cases pass; first query value follows URLSearchParams contract |
| Apollo time/state workflow | Play/pause/rates/events | 30 event jumps, availability outside bounds, focus/follow, True/Readable and reverse changes | Existing browser-shell/spike02 assertions pass; scientific readouts unchanged |
| Synthetic workflow | Init/pause/events/focus/follow | No developer sections; reload default | browser-synthetic passes, errors empty |
| Browser presentation | Desktop | Tablet/mobile, info/developer panel, anchor toggle off/on/off | spike03, shell and anchor scripts pass; prior scenarios retained |
| Audit decisions | Needs and O-009/O-010 | Deferred GAP-5 and conditional GAP-3b | I-016; other rows and disposition proven |
| Architecture/guards | Generic import/name scan | Alternative config, unchanged core/shell, provenance | ARCH-01/02 and PROV-01 pass; ARCH-03 incomplete for Earth-layer opt-in |

Every mandatory cell is passed, Issue or explicitly N/A above; no required technical cell remains silently unverified. Owner visual judgement is a separate closure requirement. Source, tests, no-name scanner, local browser paths and exact endpoints were reviewed rather than accepting executor checkboxes.

## External-boundary and workflow lock

| Order / actual operation | Side effect and failure ownership | Evidence / classification |
|---|---|---|
| Entry DOM/query selection | Missing #app throws before mount; unknown query falls back | Source guard, independent URL matrix; pass |
| Runtime and metrics factory creation | Clock starts/plays; adapter/Moon created; factory error would prevent render | Source trace, both contract factories, browser mount; pass except mandatory Moon orchestration I-015 |
| Shell/scene construction and local asset load | Scene views/labels/canvas mounted; local resource failure surfaces through browser errors | Five browser scripts successful; page/console listeners empty |
| Subscribe and interactions | Interval updates; camera/scale refs; no scientific mutation | Effect clearInterval cleanup reviewed, browser clock/camera/scale evidence passes |
| Unmount/reload | Effect timers and scene label/gesture handlers cleaned up | Source cleanup plus synthetic→Apollo navigation; pass |
| Verification artifact output | Unique scratch screenshots/JSON; finally browser.close; assertion failures owned by runner | `/tmp/astraeus-c010`; historical directories untouched; pass |

Configured and actual target are `http://127.0.0.1:5199/`; owned Vite started with strictPort before browser runs, so no silent server reuse/port fallback. External failures (refusal, non-success HTTP, redirect, timeout/cancellation, unexpected responses) are N/A to changed product behavior: the new boundary makes no server/subprocess request or retry; these are verifier failure modes. Initial Chromium launch restrictions were tool failures and required runs succeeded outside the sandbox. No persistence, transaction, secret-bearing output, partial product write or retry exists. Browser cleanup is finally-owned. No speculative failure injection into unchanged Orb/Three/Vite internals was added.

## Adversarial pass

Challenged optional layer omission rather than repeating the happy-path fixtures; found I-015. Challenged deferred GAP status against the unchanged every-GAP rule; found I-016. Checked backward time through event jumps, representation/scale changes against physical readouts, unknown metrics ids, exact inclusive bounds and empty/duplicate layer lists. Generic name/import scans and no core/shell diff establish the scientific boundary. No alternate serializer, sink or authorization state is introduced.

Independent deterministic harness: `/tmp/astraeus-c010/probe.mjs` and `probe-results.json`, exit 0. It loads real TS modules through Vite, exercises both factories and the finite layer/bounds matrix. A nonfatal HMR listen EPERM appeared during scratch SSR server setup; module probes still completed and output was inspected. Browser harness: `/tmp/astraeus-c010/browser-matrix.mjs`, final exit 0, five scenarios/errors []; `browser-matrix-results.json`, `layers-empty.png`. Initial harness import was corrected for CommonJS; an attempted debug-text oracle remained blank, so it was discarded in favour of the actual canvas marker plus unconditional source trace. Blank text is not reported as a product defect. The final result's mention of Moon diagnostics is not proof: only the canvas marker and source trace are used.

## Gates and Code Health

Fresh run on 2026-10-11 local / 2026-10-10 UTC, Node v22.22.2, project-pinned TypeScript/Vite/Vitest, headless Chromium 1217 with SwiftShader:

- `npm run typecheck`: exit 0.
- `npm run build`: exit 0; existing large-chunk warning.
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: exit 0; 182 tests, 12 files, 26.38 s; fresh junit.xml.
- `git diff --check`: exit 0 before and after review. Lint unconfigured.
- Five scripts `browser-shell.mjs`, `browser-synthetic.mjs`, `browser-spike03.mjs`, `browser-spike02.mjs`, `browser-anchor-labels.mjs`: exit 0, errors []. Common environment: `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_URL=http://127.0.0.1:5199/`. Each screenshot-writing script used `ASTRAEUS_EVIDENCE_DIR=/tmp/astraeus-c010/{synthetic,spike03,spike02}`; anchor script received `/tmp/astraeus-c010/anchor-labels` as argument; shell wrote no screenshots. Run window approximately 07:47–07:49 environment time; clock sources disagree with shell UTC, so timestamps are retained as displayed rather than invented precision.
- `savepoint health check O-008`: after full gate, exit 0, official snapshot in frontmatter, does not block clearance. Tests: 182/0 failures; complexity maximum 19 Watch; duplication 9.7% needs attention but optional; coverage unconfigured; optional OSV collection failed, so vulnerability health is unknown. No high/critical finding was obtained. These health observations alone are not admitted as Issues.

Named files exist, including fixture, tests and all browser artifacts. The original throwaway benchmark is explicitly discarded scratch, not a missing claimed deliverable. No src/core, src/shell or dependency-definition changes. I-014 tolerance is the only existing test edit and carries owner acceptance; this Check does not relabel it verified or broaden that decision. There is no prior O-008 Check or originating Objective acceptance/exception to supersede or carry forward. Owner Task-check waivers retain their scope unchanged.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — Earth-layer omission absent from tests (I-015).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries** — trusted typed configuration; no new untrusted parser.
- [x] STYLE-07 **One source of truth** — definition extends existing shell/body contracts.
- [x] STYLE-08 **Comments explain why**
- [ ] STYLE-09 **Content lives in data** — App developer heading still embeds mission-context wording at App.tsx:70; advisory.
- [x] STYLE-10 **Small diffs**

Style checkboxes do not independently change the verdict.

## Materiality and handoff

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-015 | High for any definition omitting Earth–Moon | Medium: intended plug-in reuse remains constrained | High relative to O-008's boundary purpose | Fix the layer boundary or return the decision to planning |
| I-016 | High: documentation already incomplete | Low: bounded planning justification gap | Medium: explicit engine-first criterion unmet | Complete missing GAP answers; no new implementation |

Observations: benchmark rejects roughly 1k+ populations although its 1k result alone is 1.4 ms; interpret it as high-count evidence rather than universal 1k cutoff. Design overstates the test as forbidding synthetic imports (the import regex forbids mission imports; name scan is separate). Camera limits and generic spacecraft wording are recorded deviations, not newly imposed requirements. Optional health findings are listed above without inventing blockers.

T-026 requires owner visual validation, and accepted_check remains empty; its Task-check waiver does not supply that acceptance. Owner validation remains pending after technical remediation. Completed Tasks stay done. Remediation belongs in direct Issue repair or planner-selected new work, followed by a new immutable Check against this scope. Objective closure is not eligible now.
