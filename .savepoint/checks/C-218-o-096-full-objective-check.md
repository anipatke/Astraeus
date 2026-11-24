---
id: C-218
scope: {kind: objective, id: O-096}
result: CLEAR
checked_by: {role: checker, session: check-o096-20261124}
executed_session: orchestrate-o096-20261124 (T-447, T-448 builders, coordinator)
checked_at: '2026-11-24T07:13:17Z'
health_snapshot: sha256:705e90156a64a05a4330d521468ab38738fdce640e8c0038e1c570bf98aa08c7
reviewed:
  base_commit: 9f73de93
  head_commit: 6264a1c4
  files: [packages/astraeus/src/api/webglCheck.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/errors.ts, packages/astraeus/src/app/style.css, packages/astraeus/src/shelf/part.ts, packages/astraeus/src/shelf/chart/factory.ts, packages/astraeus/src/shelf/colourKey/factory.ts, packages/astraeus/vitest.setup.ts, packages/astraeus/tests/noWebgl.test.ts, packages/astraeus/tests/shelfInputTable.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/shelfContentParts.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/journey-two-viewers.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, docs/BROWSER_CHECKS.md, docs/architecture/viewer-interface.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: null
---

# C-218: O-096 Full Objective Check

Fresh session; it did not plan, build, coordinate or repair O-096. Diff `git diff main...HEAD` on branch `o096-failures-said-plainly` (`9f73de93..6264a1c4`, 27 files). T-447 and T-448 are `done` with owner `check_waiver`s ("orchestrate O-96"); this Check covers both. The uncommitted T-388 (O-086) change and untracked `docs/evidence/*`, `docs/research` are outside this scope.

**Result: CLEAR.** Every Success Condition is proven, every gate passes, the one browser run passed all 10 steps, and Code Health does not block. No Issues opened. T-447 declares `owner_validation.required`; the owner's look ("looks lovely as far as i can tell", Chrome with WebGL off, 2026-11-24T07:06Z at 536bbf99) is in its body, and its acceptance fields are for the coordinator to fill against this Check (not written here). `git diff 536bbf99 HEAD` touches only `.savepoint/Design.md` and the T-447 Task text, so the look covers the code checked.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner only: its own dev servers and scratch public build; the owner's :5490 untouched; error-lines=0 in every step. The WebGL probe's "boundary" is the browser's `getContext`: null, undefined, throw and a real context are all classified below)
- [x] Workflow And Side-Effect Check Lock (mount: prepare -> loaded -> unmounted? -> probe -> render message or viewer -> attach; failure owner and final state traced below; no persistence)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a: not a feature of this scope)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: the Objective's eight Success Conditions (SC1-SC8 below, in order), its Decisions (shared vitest-setup line; chart counts may stay fractional; exactly four named existing test lines may change; after `setBins` an uncovered mark is not drawn, not refused), G-025 decision 1 (one-line migrations under 0.11.0 Breaking changes). Guardrails API-01, API-02, API-03, API-04, API-05, TEST-01..03, CODE-02; STYLE advisory.
2. Entry points: `mount`, `AstraeusScene`, `SceneErrorCode`; the eight shelf factories and the setters `ExplainerControl.setParagraphs`, `ColourKeyControl.setEntries`, `ChartControl.setBins`, `FilterChipsControl.setChoices`, `ReadoutTileControl.setValue/setFacts`.
3. Relied-on runtime: React root render/unmount, `ViewerLink.whenAttached/close`, `prepareScene`, the browser canvas `getContext`; the vitest shared setup.
4. Axes: input shape (blank classes, fraction, backwards, overlap, out-of-range, empty list, not-a-list, non-finite, wrong type); boundaries (touching bins, gaps, mark at exact extent edges and epsilon outside, count 0); state (mount before/after unmount, rebuild with a new scene, StrictMode double effect); environment (no WebGL: null, undefined, throw; WebGL present with and without `WEBGL_lose_context`); output (rejection code, `onError`/console, message element, no canvas, element restored). Text classes beyond whitespace are n/a except where trim() semantics matter (zero-width space noted).
5. Admission: a reproducible violation through a public entry point of a criterion or Decision above.

## Coverage matrix

| SC | Evidence (this session) | Result |
|---|---|---|
| SC1 no WebGL rejects `ready` `no-webgl`; `onError` else console; no `onReady`/`onFirstDraw` | `noWebgl.test.ts` (4 cases: mount null and throwing; AstraeusScene onError once with onReady/onFirstDraw uncalled; console.error once with throwing getContext). Independent probe (temporary file, deleted): StrictMode render reports once per build; a new `Scene` prop reports again (2 total) and still one message; `onReady` never called; `unmount` before `ready` gives `not-mounted`, not `no-webgl`, and leaves the element empty; a `getContext` answering a context does not refuse. Browser `two-viewers` scenario 5: page `ready` rejected with `no-webgl` at both sizes | Pass |
| SC2 message in the viewer's place, inside the window, `unmount` gives the element back | `noWebgl.test.ts`: message with `astraeus-shell` class, no canvas, no `.hud/.bar`; unmount empties the element and restores `isolation`/`position`. Browser `two-viewers`: message inside the window, 0 canvases, at 1280x720 and 375x667 (see observations on the named sizes); owner look at desktop and 390x844 with WebGL off | Pass |
| SC3 code in `SceneErrorCode` and README table; probe holds no context; `scene.check()` unchanged | `errors.ts` doc comment; README table row generated (apiRules/apiReference tests pass in `npm test`); API lock updated. Probe: a context answer -> `true`, only `webgl2` asked, `loseContext` called once; no lose extension -> `true` without throwing; null, undefined, throw -> `false`. `grep` shows `hasWebgl2` called only in `api/mount.ts` and `api/AstraeusScene.tsx`; `check` untouched (no diff in `scene.ts`/check code); `check:node-consumer` passes | Pass |
| SC4 shelf refusals naming the field | Probe: blank classes `" "`, `"\t"`, `"\n \r"`, NBSP, ideographic space, BOM refused; `" x "` accepted and kept as given (not trimmed); refusals reach filterChips choice value and `setChoices` label, actions id, customBlock id, panel `shortLabel`, colourKey `note`, chart `axisLabel`, readoutTile `value` and `setValue`. Bins: touching and gaps accepted; `9.999` after `10` refused naming `bins[1].low ... bins[0].high`; backwards pair refused; a third bin overlapping the second refused naming `bins[2]`. Marks: exact low and high edges and a value inside a gap accepted; `10.0001`, `-1e-9` refused (`marks[0].value must lie within the bins' range`); the second bad mark named `marks[1]`; NaN refused as non-finite. `setBins` narrowing past a mark is accepted (Decision) and lifecycle shows it undrawn. Colour key: 0, 3, absent accepted; 0.5 refused (`whole number`); -1, -0.5, Infinity, `"2"` refused; `[]` refused (`non-empty list`); missing entries refused; `setEntries` `[]` and 1.25 refused, 4 accepted. Chart count 2.5 accepted (owner "No, colour key only") | Pass |
| SC5 one table test, eight factories, all kinds, "accepted" with reason, fails on a factory without rows | `shelfInputTable.test.ts`: 73 rows, "states every kind for every part" (8 parts x 6 kinds), `@shelf` guard over `src/shelf/*/factory.ts`, setter rows through the descriptor's control | Pass |
| SC6 existing tests unchanged except the four lines and the setup line | `git diff main...HEAD -- packages/*/tests packages/astraeus-site/tests`: only `lifecycle.test.ts` and `shelfContentParts.test.ts` among existing files. The four named lines changed as authorised. One extra assertion in `lifecycle.test.ts` (no `[data-shelf-mark]` after `setBins([{0,5}])`) judged additive and in scope: the owner-allowed change says to "move it so the case still proves an out-of-range mark is not drawn through `setBins` narrowing"; the assertion is that proof, nothing in the setup or other assertions loosened. `vitest.setup.ts`: one `vi.mock` of `webglCheck` keeping real exports, `hasWebgl2: () => true` (owner "Shared setup line"); `noWebgl.test.ts` undoes it | Pass |
| SC7 CHANGELOG 0.11.0 Breaking with one-line migrations; viewer-interface §11, README, lock | CHANGELOG: "None" replaced; `no-webgl` line with its migration; five shelf lines each with a one-line migration; two `Fixed` entries. viewer-interface §11 chart and colourKey rows and the One contract line; README `ready` row and props sentence; lock `SceneErrorCode` includes `no-webgl` | Pass |
| SC8 engine under 527,000 B gzip | `check:pack`: engine 525,811 B gzip (limit 527,000; +222 B vs 525,589 before O-096), 1,833,526 B raw (limit 1,838,000); `measure:example` first-open total the same | Pass |

## Workflow lock (mount)

| Order | Operation | Failure owner / final state |
|---|---|---|
| 1 | element check, `prepareScene` | sync throw `bad-element`/scene error, nothing changed |
| 2 | isolation + containing block set, root created | restored by `unmount` (proved for the no-WebGL path) |
| 3 | `loaded` resolves; `open` false -> `not-mounted` (handled) | probe not reached; element empty (probe) |
| 4 | `hasWebgl2()` false -> render message, throw `no-webgl` | `ready` rejects, unhandled until awaited (Task: "ordinary rejection"), message stays until `unmount` |
| 5 | render `App`, `whenAttached` | unchanged path; every existing mount/AstraeusScene test passes with the setup mock |

## Adversarial pass

- Bypass paths: every shelf text goes through `checkedId`/`checkedText`/`checkedStrings` (`grep` of `src/shelf` finds no other blank test); `filterChips.setSelected` values are not blank-checked but must match a choice, which is. Setters reuse the factory checkers (`orderedBins`, `entriesOf`, `checkedStrings`).
- Representation: `" x "` kept as given (no trimming), matching the Task boundary.
- Environment: probe never throws out; `WEBGL_lose_context` absent still answers yes.
- SSR: the probe runs only after `prepared.ready` inside an effect (AstraeusScene) or after load (mount), so server rendering never reaches `document` (`check:react-consumer` not in this gate set; the call sites are unchanged for SSR).

## Gates (this session, branch at 6264a1c4, uncommitted T-388 change outside scope)

| Gate | Start (UTC) | Time | Result |
|---|---|---|---|
| `npm run typecheck` | 2026-11-24T07:07:01Z | 8 s | pass |
| `npm run lint` | 2026-11-24T07:07:09Z | 7 s | pass (ESLint + Prettier) |
| `npm test` (junit) | 2026-11-24T07:07:16Z | 38 s | 343 files, 5601 passed, 2 skipped |
| `npm run build` | 2026-11-24T07:07:54Z | 4 s | pass |
| `npm run check:pack` | 2026-11-24T07:07:58Z | 23 s | pass; engine 525,811 B gzip / 527,000; 1,833,526 B raw / 1,838,000 |
| `npm run check:node-consumer` | 2026-11-24T07:08:21Z | 7 s | pass |
| `npm run measure:example` | 2026-11-24T07:08:28Z | 4 s | 12 tests passed; first-open 1,833,526 B raw, 525,811 B gzip |
| `git diff --check main...HEAD` | 2026-11-24T07:08:32Z | 0 s | clean |
| `npm run check:shelf-split` (O-096 changes shelf parts) | 2026-11-24T07:13Z | 5 s | ok, no other part's marker class |
| `npm run check:browser -- --tier quick --step look-out --step two-viewers --step catalogue` (no `--skip-examples`) | 2026-11-24T07:09:32Z (lock taken at once) | 213 s total / 305 s limit | all 10 steps exit 0, error-lines=0: smoke 44 s, smoke-public-showers 6 s, planets-phone 9 s, look-out 70 s, two-viewers 8 s / 15 s, catalogue 7 s, hello-scene 19 s, hello-react 3 s, hello-planets 3 s, hello-sky 22 s. Evidence `docs/evidence/browser-quick-20261124T070932Z` |

Browser tier choice (browser-policy.md): `look-out` because `src/app/style.css` is a `.css` under `packages/astraeus/src` (Layout); `two-viewers` because `api/mount.ts` and its own script `journey-two-viewers.mjs` changed; `catalogue` because `src/shelf/` changed; examples run (no `--skip-examples`) because `api-surface.lock.json` changed. `driver.mjs` only gained two new helpers (no existing function changed), used only by `two-viewers`. Run once; not repeated.

Probes: two temporary test files under `packages/astraeus/tests/` (`zzC218Probe*.test.ts`, 7 cases, all passed) were run alone after `npm test` and deleted; they were not in the gate count.

## Code Health

`savepoint health check O-096` (2026-11-24T07:09:14Z) created snapshot `sha256:705e9015…08c7`: "Code Health does not block clearance." complexity, duplication, dependency vulnerabilities, tests: no finding; coverage stale (expected: a Full Objective Check runs `npm test`, coverage is refreshed at release). No other snapshot was produced in this session.

## File reality

Every file named in both Tasks' evidence exists at HEAD; `webglCheck.ts`, `noWebgl.test.ts`, `shelfInputTable.test.ts` are new. Browser evidence `docs/evidence/browser-steps-20261124T070025Z` (T-447) is present (untracked). No phantom files.

## Design reconciliation

Both Tasks report no drift notes. `.savepoint/Design.md` "Errors and labels that tell the truth (O-083)" carries the O-096 paragraph (6264a1c4) and matches the code: probe in `api/webglCheck.ts`, both entry points, shared vitest setup, shelf checks in `part.ts` and the chart/colourKey factories, the table test. viewer-interface §11 matches.

## Guardrails

API-01 (lock and CHANGELOG move with `SceneErrorCode`), API-02 (both entry points, tests for each), API-03 (message carries `.astraeus-shell`; CSS rule under it; probe releases its context), API-04 (shape errors at the call), API-05 (`no-webgl` is a `SceneError`, README table generated), TEST-01..03 (named tests above), CODE-02 (no per-frame work added): satisfied.

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

1. SC2 and T-447 name 1440x900 and 390x844 for the browser proof; the `two-viewers` step runs at the project's standard 1280x720 and 375x667 (the Task evidence says so). The owner's look covered desktop and 390x844. The message is `position:absolute; inset:0` in the viewer's own element, so the window size does not change how it fits. Same as the C-217 precedent; a planner should name the step's own sizes.
2. The zero-width space (`"​"`) is not blank to `trim()` and is accepted; outside the stated rule ("empty after trimming").
3. CHANGELOG: the `no-webgl` breaking entry is a paragraph and the five shelf entries are bullets; reads fine, format uneven.
4. `mount`'s no-WebGL rejection is unhandled until a host awaits `ready` (as the Task asks, like a failed load); a `mount` host that never awaits `ready` sees an unhandled rejection on a no-WebGL browser, which is the intended "never silent".
5. The `@shelf` guard in `shelfInputTable.test.ts` reads `src/shelf/<part>/factory.ts` only; a part whose factory lives in another file name would not be seen.
6. `journey-two-viewers.mjs` shows a 195-line diff mostly from re-indenting the existing scenarios (the `checkScript` call now takes `browser`/`errors`); scenarios 1-4 are unchanged in content.

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
- [ ] STYLE-10 **Small diffs** — `journey-two-viewers.mjs` re-indents its four existing scenarios to add a fifth (observation 6).
