---
id: C-222
scope: {kind: objective, id: O-100}
result: NEEDS WORK
checked_by: {role: checker, session: check-o100-20261124}
executed_session: orchestrate-g027-20261124 (T-455, T-456, T-457 builders and coordinator)
checked_at: '2026-11-24T10:15:31Z'
health_snapshot: sha256:be5856dab146e213f621d69e265e9aa57a9bbbe25261901aabca9700ec8db529
reviewed:
  base_commit: 7866067a
  head_commit: c4ee9d38
  files: [packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/part.css, packages/astraeus/src/shell/PartBoundary.tsx, packages/astraeus/src/shell/useShelfPanels.tsx, packages/astraeus/src/shell/useShelfTile.tsx, packages/astraeus/src/shelf/panel/View.tsx, packages/astraeus/src/api/listeners.ts, packages/astraeus/src/app/style.css, packages/astraeus/tests/chartSettles.test.ts, packages/astraeus/tests/chartAxisLabel.test.ts, packages/astraeus/tests/partBoundary.test.ts, packages/astraeus/tests/chartMarkRows.test.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md, .savepoint/Design.md]
  dependencies: []
issues: [I-208]
unmet: [T-456]
supersedes: null
---

# C-222: O-100 Full Objective Check

Fresh session; it did not plan, build or coordinate O-100. Objective diff `git diff 7866067a...HEAD` (base 7866067a, the 0.11.0 release; reviewed head c4ee9d38; 14 files outside `.savepoint`). Out of scope: main's homepage-only c6d7db50, the uncommitted T-388 (O-086) change, untracked `docs/evidence/*` and `docs/research`, and O-101 planning records. During this Check another session committed 7f627c6c ("O-101 planned", `.savepoint/objectives/O-101-*` and `task-ids.yml` only; no code), so HEAD is now 7f627c6c with the same code as c4ee9d38.

**Result: NEEDS WORK.** The chart fix (T-455) and the caption (T-457) are proven, including a real headless Chromium run of the belt #34 input; every gate passes and Code Health does not block. One Issue: a failed readout tile's boundary does not reset on a view switch to another tile (I-208, T-456 Done When). Low materiality; the fix is a `key` on two boundaries plus a test.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner and one scratch Vite server on :5597, stopped after; the owner's :5490 untouched)
- [x] Workflow And Side-Effect Check Lock (one side effect: the page report from a caught part error; covered below)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a: advisory only)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: O-100 Success Conditions SC1 Settles, SC2 Contained, SC3 Wraps, SC4 no existing test or browser assertion loosened except the owner-approved constants (G-027 answers 6 and 6b: `chartMarkRows.test.ts` lines 75, 79, 125, 131 and `chartSettles.test.ts` line 75), SC5 CHANGELOG lines and viewer-interface section 11, no breaking change, SC6 engine first download under 527,000 B gzip; each Task's Done When; Architectural Considerations (shell imports no shelf module; chart in its own chunk; no new chart input); Guardrails ARCH-01, ARCH-04, API-03, API-05, TEST-01..04, CODE-01, STYLE-*; Design reconciliation of the T-456 drift note.
2. Changed files: `reviewed.files`. Entry points: `chart` (+ `setBins`/`setHighlight` cells) inside `panel`, `readoutTile`, every shelf part through `mount` / `Scene.addParts` / `setViews` / `handle.setView`; the shell draw sites `useShelfPanels`, `useShelfTile` (card, strip, sheet), `PanelView` blocks.
3. Relied-on runtime: React error boundaries (`getDerivedStateFromError`, `componentDidCatch`, identity by position and `key`), layout effects, `getComputedTextLength` / `getBBox` / `getComputedStyle`, the page's `reportError`.
4. Axes: chart: belt input, height-dependent widths, fixed widths, font-size change, repeat render, no marks, happy-dom (0 widths) vs real Chromium; boundary: block / panel / tile card / strip / sheet, sibling survival, report count, reset on reopen and on view switch, wide and phone; caption: short and long text, 360 px panel, aria. Not applicable: text classes (wrapping is CSS `overflow-wrap`, already proved for every panel text by the `catalogue` step), serialization (no new data), environment/output sinks (no CLI).
5. Admission: supported public paths only (a part view can throw through any host-data or engine fault; a multi-view scene with one tile per view is a documented configuration, `readoutTile.test.ts` "one tile per view").

## Coverage matrix

| SC / Done When | Evidence (this session) | Result |
|---|---|---|
| SC1 settles: measure once per key | `View.tsx:65-88`: `taken` ref keyed on label texts + first label's computed `fontSize`/`fontFamily`; returns before measuring when the key is taken; `setMeasured` once per key. The key depends only on data and CSS, never on rows or height, so at most one state update per key: bounded. | Pass |
| SC1 fails on 0.11.0 | Throwaway test (deleted): the belt input with height-dependent widths against `git show 7866067a:.../chart/View.tsx` reports "Maximum update depth exceeded"; the same input on HEAD passes (`chartSettles.test.ts` 3 cases) | Pass |
| SC1 real browser (belt #34) | Throwaway Playwright page on a scratch Vite server (:5597, components.html, viewer mounted full-window), 1440x900, swiftshader, no screenshots: 40 bins 2.00-4.00, marks 3:1 2.50, 8:3 2.52, 11:4 2.54, 44-char label 2.82. Natural widths: 4 `getComputedTextLength` calls total (one pass), viewBox `0 0 320 176.24` equal at 1.5 s and 3 s, rows 4 distinct, no `.part-failed`, canvas present, 0 page errors, 0 reports. Adversarial (long label 205 if viewBox height > 136+28 else 225, as the unit test): also 4 calls, viewBox stable `0 0 320 162.83`, 0 errors | Pass |
| SC1 font follows host size (I-207) | `chartSettles.test.ts` "measures again once for a font-size change and not for a repeat render" (no measure on repeat, re-measure on 11px -> 22px, rows move, none on a further repeat) | Pass |
| SC1 layout kept | "places the long label in the row the pure layout gives" (`placeMarkRows` oracle) | Pass |
| SC2 block contained | `partBoundary.test.ts` case 1: message in the block's place, explainer sibling, title, Close, bar button, canvas host kept, one report with the original error | Pass |
| SC2 tile contained | case 2 (wide card); strip and sheet wrapped (`useShelfTile.tsx:44,83,89`); my probe: phone strip shows the message too | Pass |
| SC2 open panel contained | `useShelfPanels.tsx:72` `PartBoundary key={current.id}` around `current.view` | Pass (code) |
| T-456 reset on redraw | Panel: keyed by panel id and block id, remounts on reopen. Tile: **fails** - probe through `mount` + `setViews` + `handle.setView("v2")` keeps "This part could not be drawn." in place of the working tile; same with `mountShell` + `showParts` at wide and phone (I-208) | Issue |
| SC2 shell imports no shelf module | `check:shelf-split` ok; `grep` of `src/shell` imports: `app/shelfContract` types, `api/listeners` (see Layering) | Pass |
| SC3 wraps | `chartAxisLabel.test.ts` 2 cases (HTML `div.shelf-chart-label` outside the SVG, `aria-hidden`, summary names the axis, viewBox 0 0 320 136); real Chromium probe: a 70-char axis label wraps to 2 lines inside the 360 px panel (334 px wide); `catalogue` step at both sizes passes unedited; owner "Looks good" on :5490 | Pass |
| SC4 test edits | `git diff 7866067a...HEAD -- packages/astraeus/tests`: in existing files only `chartMarkRows.test.ts` lines 75, 79, 125, 131, each changing 156->136 or 168->148 only; `chartSettles.test.ts` is new in O-100 (its line 75 uses 136 per 6b); other test changes are new files. No browser script changed | Pass |
| SC5 docs | CHANGELOG `## 0.12.0 (unreleased)`: three `Fixed` lines; `### Breaking changes in 0.12.0` "None yet"; viewer-interface section 11 chart row and "fails alone" bullet; `api-surface.lock.json` unchanged (`reportToPage` is internal) | Pass |
| SC6 size | `check:pack`: engine 1,834,433 B raw (limit 1,838,000), 526,014 B gzip (cap 527,000; +134 B over 0.11.0's 525,880) | Pass |
| Design reconciliation | T-456 drift note reflected in Design.md Viewer interface (O-100 sentence names `shell/PartBoundary.tsx` and `reportToPage` from `api/listeners`); T-455, T-457 none | Pass |

Workflow lock (caught error): order render throw -> `getDerivedStateFromError` (message) -> `componentDidCatch` -> `reportToPage` (`reportError`, else rethrow on a timer). Failure owner: the boundary; final state: message in place, siblings live; one report per failure (tests assert exactly 1). No cleanup or partial write.

## Layering (shell -> api)

`shell/PartBoundary.tsx` value-imports `reportToPage` from `api/listeners.ts`, the first value import from `api/` into `shell/` (others are types: `aboutInput`). No written rule forbids it: ARCH-04 covers `core/`, `presentation/` and `assets/`; `tests/apiImports.test.ts` limits only `api/ -> app/, shell/`. `api/listeners.ts` has no imports, so no cycle and no bundle growth beyond the export. Design.md records the dependency. Observation, not an Issue: a page-report helper that both the host link and the viewer use would sit more naturally in a neutral module (for example `core/` or `app/`), keeping `api/` a consumer of the viewer rather than a supplier to it.

## Gates (this session, `date -u`)

| Gate | Start | Result |
|---|---|---|
| `npm run typecheck` | 10:09:06Z | pass, 8 s |
| `npm run lint` | 10:09:14Z | pass, 7 s |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 10:09:21Z | 351 files, 5642 passed, 2 skipped, 36 s |
| `npm run build` | 10:09:57Z | pass, 6 s |
| `npm run check:pack` | 10:10:03Z | pass, engine 526,014 B gzip / 1,834,433 B raw, 22 s |
| `npm run check:node-consumer` | 10:10:25Z | pass, 12 tests |
| `npm run measure:example` | 10:10:32Z | pass, first-open 1,834,433 raw / 526,014 gzip |
| `npm run check:shelf-split` | 10:10:39Z | ok, filterChips only |
| `savepoint health check O-100` | 10:11:20Z | snapshot recorded above; "Code Health does not block clearance" |
| `flock ... npm run check:browser -- --tier quick --step look-out --step catalogue --step synthetic-journey --skip-examples` | 10:11:17Z-10:14:49Z | exit 0, 211 s of 411 s; smoke 44 s, synthetic-journey 68 s, smoke-public-showers 5 s, planets-phone 8 s, look-out 71 s, catalogue 11 s; error-lines 0 everywhere; evidence `docs/evidence/browser-quick-20261124T101117Z` |

Browser steps chosen from the diff (browser-policy): `look-out` because the diff touches `src/shell/` and CSS under `src` (Layout); `catalogue` because it touches `src/shelf/`; `synthetic-journey` because it touches shell panel and sheet drawing (`useShelfPanels.tsx`, `useShelfTile.tsx`; added when unsure, per policy). `--skip-examples`: no packaging, `examples/` or public API change.

`git diff --check 7866067a...HEAD`: clean.

## Code Health

Snapshot `sha256:be5856da...`: does not block. complexity, duplication, dependency vulnerabilities: no finding. tests and coverage (optional): "stale" (the snapshot does not tie the fresh `junit.xml` to the tree, which carries uncommitted out-of-scope files; coverage is measured at release). Collection state only, not a finding.

## Issues

- **I-208** (T-456 Done When, reset on a view switch): `shell/useShelfTile.tsx:83-91` card and strip `PartBoundary` have no `key`, so a failed tile's boundary survives a view switch to another view's working tile, which then shows "This part could not be drawn.". Reproduced through `mount` / `setViews` / `setView` and `mountShell` wide and phone. `partBoundary.test.ts` has no reset case.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-208 | Low: needs a tile whose view throws and a multi-view scene with a different tile per view | Low-Medium: the viewer stays up, but a healthy tile is hidden behind a stale failure message until the tile area unmounts | Low | Fix now: `key={tile.id}` on the card and strip boundaries plus one reset test (and a panel reopen case); small and inside O-100 |

## Owner validation

T-457 declares `owner_validation.required`; the owner said "Looks good" on :5490 at 1bb6f809 (desktop and phone). The acceptance fields stay for the coordinator; this Check is NEEDS WORK, so the recheck's Check id is the one to accept against unless the owner chooses this one (T-457's own scope is unaffected by I-208).

## Observations (non-blocking)

1. The measure is taken once per text+font key. A web font that finishes loading after the first measure (same `font-family` string), or a first measure taken while the chart is not laid out, keeps that measure until the text or font changes; rows may then sit on the estimate. This is the design T-455 chose ("a differing measure for the same key is ignored"); the belt's own check after release covers its real page.
2. The font key reads the first label only (builder-stated); per-label font differences are not possible through the public input today.
3. `chartSettles.test.ts` "draws the belt's chart" compares two synchronous reads of the viewBox, which is trivially equal; its real proof is that the render does not throw (confirmed red on 0.11.0's view above).
4. The test title "keeps a one-mark chart at 0 0 320 156" still says 156 while asserting 136 (owner allowed constants only).
5. `PartBoundary` reports the raw error (not a `SceneError`), which is right for a page report; API-05 governs throws from `src/api/`, and none is added.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the boundary's reset branch (key change / redraw) has no test (`tests/partBoundary.test.ts`), the gap I-208 sits in.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** (one boundary, one page-report helper, look tokens only)
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** (340 lines across 14 files, mostly new tests)
