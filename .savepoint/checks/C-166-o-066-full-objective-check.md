---
id: C-166
scope: {kind: objective, id: O-066}
result: CLEAR
checked_by: {role: checker, session: o066-check-20261110}
executed_session: o066-run-20261110
checked_at: '2026-11-10T08:15:00Z'
health_snapshot: sha256:e3c76da692297664315ca29c1b1440a214414d7218b38667722fe0b58ab4b4b2
reviewed:
  base_commit: 4589c6b7
  head_commit: 3cf9ccc8
  files: [packages/astraeus/src/api/cameraRequest.ts, packages/astraeus/src/api/viewerPanels.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/api/planStory.ts, packages/astraeus/src/api/planSkyFigures.ts, packages/astraeus/src/api/skyFigureInput.ts, packages/astraeus/src/api/viewerCamera.ts, packages/astraeus/src/api/viewerSelection.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/core/storyPanels.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/scenePicking.ts, packages/astraeus/src/app/scenePointer.ts, packages/astraeus/src/app/SkyFiguresView.ts, packages/astraeus/src/app/skyFigures.ts, packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/useStoryPanels.ts, packages/astraeus/src/shell/StoryPanelView.tsx, packages/astraeus/src/shell/objectModel.ts, packages/astraeus/src/shell/infoModel.ts, packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts, packages/astraeus-site/tools/validate/journey-look-out.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, tools/gate-limits.json, .savepoint/Design.md, docs/BROWSER_CHECKS.md, docs/architecture/demo-contracts.md, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json]
  dependencies: []
issues: []
supersedes: null
---

# C-166: O-066 Full Objective Check

**Verdict: CLEAR.** Every Success Condition of O-066 is proven by the code, the tests named below, independent probes and a fresh `npm run check:browser`; the full gate passes fresh; Design is reconciled; the two owner-approved limit changes are recorded with the owner's words. No Issue is admitted. Observations below are non-blocking.

Fresh session: this checker did not build or coordinate any O-066 step. Scope: `git diff main...o066-sky-stories` (merge base 4589c6b7 = main, head 3cf9ccc8; 78 files, +1,970 / -273). `docs/prds/` and `docs/research/` were not read or touched.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature of this scope; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria and rules.** O-066 preamble (made-up figures and stories only, both embedding paths, lock/README/CHANGELOG); SC1 Clickable sky figures; SC2 Sky figure cards; SC3 Story steps; SC4 What a step does when it opens; SC5 Events name sky figures; SC6 Design reconciled, `check:browser` once, made-up three-step story for the owner's look. Decisions (owner, 2026-11-10): Next/Back on the panel; name and lines (not inside an outline); step names a camera view; planner defaults (leave clears trace with default fade; select/turn only when asked; figures follow the `listed` rule). Guardrails API-01..07, ARCH-01/02/03/06, CODE-01/02, TEST-01/03/04, STYLE-01..10 (advisory). Release gates: `quality_gates`, `test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer`, `check:browser` once, health snapshot.
2. **Changed files and public entry points.** `Scene.addSkyFigures` (card fields), `Scene.addStoryPanels` (optional `at`, `camera`, `select`, `trace`, figure `object`), `Scene.addEvents` (figure `object`), `scene.panels`, `scene.skyFigures`; handle `setSelected`/`selected`/`onSelect` (figure ids), `panel`/`setPanel`/`onPanel`, `setCamera` (look-out `direction` naming a figure), `setLook` (`skyLines.selected`), `skyFigures`; `AstraeusScene` (same handle); canvas tap; object menu; story panel Back/Next/Close.
3. **Relied-on orchestration.** `App.markOpenPanel` (actions on open, trace clear on leave), `selectWith`/`selectRequest` (`quiet`), `ViewerLink.#afterHost` and `publishPanel`, `useStoryPanels` cause tracking, `attachScenePointer` (bodies first), `SkyFiguresView.screenFigures` / `#emphasise`, `aimAtFigure`, `applyLookOut`.
4. **Matrix axes** below; text-class and redirected-output axes not applicable (no text width/truncation or CLI output in scope).
5. **Admission boundary.** Supported public paths only (`mount`, `AstraeusScene`, public `Scene` calls, the shell UI); internal-only misuse is an observation.

## Coverage Matrix

| # | Row (invariant) | Cells | Evidence | Result |
|---|---|---|---|---|
| SC1a | A tap on a shown name or within 16 px of a drawn line selects; inside an outline selects nothing | normal; exactly 16 px (selects); 16.01 px (not); past a segment end; diagonal 16.12 px (not); inside a 200 px square (not); empty list; zero-length segment | probe (independent geometry), `tests/scenePicking.test.ts`, `tests/skyFigureSelect.test.ts`; browser `look-out` desktop: inside-outline tap selects nothing and opens no card, name tap and near-line tap select `lantern-field` and open its card | Proven |
| SC1b | Hidden figures not tappable | `whenTraced` untraced; switch off; traced again | `SkyFiguresView.#tappable`; `skyFigureSelect.test.ts` "leaves out a figure whose switch is off..." | Proven |
| SC1c | Bodies win where hit | body over figure | `attachScenePointer` `pickTarget ?? pickSkyFigure`; `pointerAndFeatureLayerDom.test.ts` | Proven |
| SC1d | Off-screen / behind-camera lines | both ends off screen; wholly behind; one end behind | `projectSegmentClipped`; probe (centre maps to centre, wholly behind null); `scenePicking.test.ts` | Proven |
| SC1e | `setSelected`/`selected`/`onSelect` take figure ids, both paths | figure id; unknown -> `bad-selection`; clear | `ViewerSelection.setSelected`; `lifecycle.test.ts` (both paths) | Proven |
| SC1f | Menu lists figures by the `listed` rule | listed; unlisted; unlisted but selected | probe (`listedFigures` [a] / [a,b]); `skyFigureSelect.test.ts` | Proven |
| SC1g | Emphasis one look with a default, live and in the drawer | default `#ffffff`; set; switch off hides | `skyLines.selected`; `look.test.ts`, `skyLooks.test.ts`, `developerSettingsDom.test.ts`, computed-look baseline; browser `sky-selected:<id>` | Proven |
| SC2 | Card fields checked at the call, read back, one card | each field malformed (6 cases); defaults; sources appended; id colliding with a body | probe (6 malformed -> `bad-sky-figure`; collision refused); `infoModel.skyFigureInfo` in `InfoPanel`; `skyFigureSelect.test.ts` | Proven |
| SC3a | Steps: optional `at`, order across calls, never from playback, with/without timeline | order across two calls; first/last neighbours; no-timeline; playback crossing | probe (s1..s3 numbered, neighbours undefined at ends, no time in reads); `publicApiStorySteps.test.ts`, `domStorySteps.test.ts` | Proven |
| SC3b | Moment panels unchanged | existing story tests | `domStory.test.ts`, `publicApiStory.test.ts` (one row removed by design: no `at` now valid) | Proven |
| SC3c | Host open/close/read/hear, both paths, causes, order | open; close; unknown -> `bad-panels`; non-string; `not-mounted`; unchanged -> no report; visitor/host/playback/move | `ViewerPanels`; `publicApiStorySteps.test.ts`, `twoViewers.test.ts`, `lifecycle.test.ts` | Proven |
| SC3d | Phone first: 44 px targets, no collisions at 375x667 and 1280x720 | phone; desktop | `domStorySteps.test.ts` (CSS rules); browser `look-out` both sizes: Back/Next reachable at steps 1-3, panel in window, no label overlap, trace control clear | Proven |
| SC4a | Step actions in order camera, select, trace, whoever opens | first step at start; host `setPanel`; visitor Back/Next; moment panel | `App.markOpenPanel`; `lifecycle.test.ts` "story step actions"; `storyActions.test.ts`; browser per-step readings | Proven |
| SC4b | Look-out direction may name a figure (its label point); unknown keeps `bad-camera` | figure id; unknown; figure as body/focus refused | `aimAtFigure`; `storyActions.test.ts`; browser step 2 reading ra 288.5 / dec -18 (Lantern's `labelAt`) | Proven |
| SC4c | Leaving a step clears its trace with the default fade; nothing else undone | Next; Back; close; step with no trace | `lifecycle.test.ts`; browser `sky-trace:lantern` absent after Next, `sky-trace:kettle` absent after Back | Proven |
| SC4d | Bad action shapes/names | 9 shapes, 5 names; `select: "yes"`; `trace` without object | `storyActions.test.ts`; probe (trace of a boundary figure accepted) | Proven |
| SC5 | Event naming a figure: seek, select, turn only while looking out | looking out; orbiting; unknown name -> `bad-event` | `AstraeusShell` event Go to + `onTurnToFigure`; `storyActions.test.ts`, `lifecycle.test.ts` | Proven |
| SC6 | Design reconciled; browser once; made-up story on the site; owner look | Design "Sky figures" (10) and "Sky stories" (1)-(6); T-302 Drift Notes map each earlier note; fresh browser run; owner words in T-302 | read in full | Proven |
| Pre | Made-up only; no body/constellation name in `src/api/`; both paths; lock/README/CHANGELOG | grep of added `src/api` lines for body/constellation names: none; API lock regenerated and the reachable-type/lock tests pass; README/CHANGELOG entries for each step | Proven |

## External Boundary, Workflow And Side Effects

- Browser runner (`run-browser.mjs`): dev and preview servers started and stopped by the runner; all 11 steps exit 0 with 0 error lines; evidence kept as summary plus results only. Redirect, malformed-response and secret cells not applicable (local servers, no credentials).
- Panel-open workflow (`markOpenPanel`): order is (1) record open id and publish a change to the host, (2) skip if this panel already acted, (3) clear the previous panel's trace, (4) camera, (5) select (quiet), (6) trace and remember it. A host `setPanel` publishes once from `#afterHost` (state already shows the id) and the shell's later report is not re-published (`changed` false); verified by reading and by `publicApiStorySteps.test.ts` "nothing when unchanged". Failure cells: ids are checked at build (`checkLinks`), so no run-time failure path; an unknown host id throws before any side effect (`ViewerPanels.setPanel` checks before `control.setPanel`).

## Owner Decisions And Recorded Changes

- **API reference raw limit 200,000 -> 230,000 B**: `packages/astraeus-site/tools/validate/load-budget.mjs` line comment cites owner 2026-11-10 "Raise to 230 KB, restore", O-066 T-301, gzip 44,000 kept; T-301 Technical Evidence records the same words. Recorded.
- **`look-out` warn limit 50 -> 75 s**: `tools/gate-limits.json`; T-302 owner validation records "looks ok, raise to 75 s"; `docs/BROWSER_CHECKS.md` row states 62 s and both owner quotes. Fresh run: 62 s within 75 s. Recorded.
- **Planner rule: a panel's `select` opens no card on a phone** (T-302 evidence, Design "Sky stories" (6), CHANGELOG, README row). Judgement: consistent. SC4 asks that `select` select the panel's object, which it does on every screen (lines, name, `onSelect`); the card rule is the existing visitor-tap rule (`pickOpensInfo`, the one phone test, STYLE-07), and it serves the Objective's phone-first no-collision condition, which the browser run proves (Back and Next reachable at 375x667). Host `setSelected` is unchanged (still opens the card on every screen, `domStorySteps.test.ts`), so no public behaviour a host relied on changed. No guardrail conflict.
- **Task-check waivers**: each of T-299..T-302 carries a structured `check_waiver` (task, reason, owner actor, time); TEST-04 satisfied.
- **T-302 owner validation**: the owner's look is recorded in prose ("looks ok, raise to 75 s", coordinator session o066-run-20261110); the frontmatter still reads `owner_validation: {required: true}` without `accepted_check` / `accepted_by`. The owner may record it against this Check (`accepted_check: C-166`).

## Verify Evidence And Gates (fresh, this session)

- `npm run check:gates` (2026-11-10, exit 0): lint 4.3 s, typecheck 6.3 s, build 2.4 s, test 43.3 s, test:full 75.7 s (junit 3,648 tests, 0 failures, 0 errors; fresh `coverage/coverage-final.json`), check:engine-alone 25 s, check:pack 17.5 s, check:node-consumer 4.7 s, check:react-consumer 5.8 s; no `WARNING:` lines.
- `git diff --check main...o066-sky-stories`: clean.
- `npm run check:browser` once (exit 0, total 297 s, limit 320 s): smoke 122 s, smoke-public-showers 17 s, planets-phone 10 s, meteor-shower 21 s, views 22 s, look-out 62 s (limit 75 s), hello-scene 11 s, hello-react 7 s, hello-planets 6 s, public-build-assets 2 s, public-addresses 0 s; evidence `docs/evidence/browser-20261110T080544Z`. No screenshots.
- Independent probe: a temporary Vitest file (11 cases, made-up figures and stories) run alone and deleted after; 10 passed, 1 my own oracle error (see observation 1); plus a `tsx` script confirming the tie case.

## Collect Code Health Evidence

`savepoint health check O-066` after the full gate: snapshot `sha256:e3c76da692297664315ca29c1b1440a214414d7218b38667722fe0b58ab4b4b2` (created), "Code Health does not block clearance"; complexity, coverage, dependency vulnerabilities, duplication and tests: reported only, no blocking finding.

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

1. **Name-versus-line tie.** `pickSkyFigure`'s doc says a shown name wins, else the nearest line; a tap exactly on another figure's line (distance 0) inside a name rectangle is a tie and the earlier figure in the list wins (`[near, stick]` at (530, 510) -> `near`; one pixel off -> `stick`). Measure-zero in practice; figures are not ordered by the Objective. A strict name-first rule would make the doc exact.
2. **`trace: false`** on a panel is silently accepted as "no trace" though the type is `true | SkyTraceOptions` (`panelActionsOf`). Harmless; API-04 prefers shape checks to accept only the typed forms.
3. **Browser tap coverage** exercises the always-shown outline `lantern-field` on desktop only; the figure kind's name/line taps and phone taps rest on node and DOM tests (`skyFigureSelect.test.ts`, `scenePicking.test.ts`, `pointerAndFeatureLayerDom.test.ts`). Adequate for the criteria; noted for O-067's real figures.
4. **T-302 record hygiene.** The Task file repeats Context Files through Technical Evidence twice; the second Technical Evidence block still carries the superseded "Finding (not fixed, engine)" bullet and "Owner look: pending", and its Drift Notes line says the phone card-over-story finding is "recorded ... as a known gap" whereas Design "Sky stories" (6) correctly records the fix. Design and code are right; only the Task narrative is stale.
5. **Known, recorded limits** (Design "Sky stories" (1)): beside moment panels no step opens at the start, and a closed steps-only story has no visitor control to reopen it (marker or `setPanel` only). The owner did not ask for one (T-302).

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
- [ ] STYLE-10 **Small diffs** — one Objective adds ~1,970 lines across 78 files over four steps; expected for a new capability, noted only.

## Closure Readiness

Every owned Task (T-299..T-302) is `done` with a recorded owner waiver; this mandatory Objective Check is CLEAR and current; no Issue is linked. The owner may record T-302's structured owner validation against C-166 and accept O-066's outcome.
