---
id: C-221
scope: {kind: objective, id: O-098}
result: CLEAR
checked_by: {role: checker, session: check-o098-20261124}
executed_session: orchestrate-o098-20261124 (T-452, T-453, T-454 builders and coordinator)
checked_at: '2026-11-24T08:33:00Z'
health_snapshot: sha256:b3cc2e7903ae911b6f5ffe74a060c521d8939d38cc069eb60e31200212f60d5e
reviewed:
  base_commit: 3cf413e2
  head_commit: d27111cb
  files: [packages/astraeus/src/shelf/explainer/View.tsx, packages/astraeus/src/shelf/explainer/factory.ts, packages/astraeus/src/shelf/explainer/part.css, packages/astraeus/src/shelf/readoutTile/View.tsx, packages/astraeus/src/shelf/readoutTile/announce.ts, packages/astraeus/src/shelf/readoutTile/factory.ts, packages/astraeus/src/app/shelfContract.ts, packages/astraeus/src/shell/useShelfTile.tsx, packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/tests/explainerLive.test.ts, packages/astraeus/tests/readoutTileAnnounce.test.ts, packages/astraeus/tests/chartSummary.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: null
---

# C-221: O-098 Full Objective Check

Fresh session; it did not plan, build or coordinate O-098. Objective diff `git diff main...HEAD` (main at 3cf413e2, HEAD d27111cb; 22 files, 16 outside `.savepoint`). Out of scope: the uncommitted T-388 (O-086) change, untracked `docs/evidence/*` and `docs/research`.

**Result: CLEAR.** Every Success Condition is proven, every gate passes, Code Health does not block. This is the last Objective of G-025.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner only; servers started by `check:browser`, owner's :5490 untouched)
- [x] Workflow And Side-Effect Check Lock (one timed side effect: the tile's pending announcement timer; covered below)
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

1. Criteria: O-098 Success Conditions SC1 explainer, SC2 readout tile, SC3 chart, SC4 no option/input/look change and API lock unchanged, SC5 existing tests unedited except the two owner-approved strings, SC6 CHANGELOG and viewer-interface rows, SC7 engine first download under 527,000 B gzip and `check:shelf-split` ok, SC8 no browser step added; each Task's Done When; Guardrails TEST-01..04, CODE-01, STYLE-*; owner answers 1 to 4.
2. Changed files: as in `reviewed.files`. Public entry points: `explainer` + `setParagraphs`, `readoutTile` + `setValue`/`setScaleValue`/`setFacts`, `chart` + `setBins`/`setHighlight`, via `mount` and `AstraeusScene`; the internal `ShelfTile.live` contract field drawn by `shell/useShelfTile.tsx`.
3. Relied-on runtime: React reconciliation (node identity of the region), the viewer cell subscribe, global timers.
4. Axes: wide/phone, sheet shut/open, first draw/change/reopen, unchanged text, dot-only, facts-only, burst stream, view switch, unmount with pending timer, two viewers, empty/one/many marks, mark at bin edge, mark outside bins, equal mark values, highlight present/absent, empty paragraphs. Not applicable: text classes (no truncation or width in scope), serialization (no new data).
5. Admission: supported public paths only; screen-reader speech itself is out of reach of headless tools (owner looked at the accessibility tree).

## Coverage matrix

| SC | Evidence (this session) | Result |
|---|---|---|
| SC1 explainer | `View.tsx`: always-drawn `div.shelf-explainer-paragraphs[aria-live=polite][aria-atomic=true]`, heading and notes outside, no role/timer. `explainerLive.test.ts` 3 cases pass. Probe P4 (checker test, mount + panel): region drawn on first open, no `role`, same node across `["A.","B."]` -> `[]` (0 children) -> `["C."]` | Pass |
| SC2 tile line | `lineSummary(label, scale, valueText)` = "label: value, on a [log ]scale from low to high; marks: ...". Probe P3: linear no marks "L: x, on a scale from 0 to 1,000"; marks with 3-decimal formatter "M at 1.235, N at 1.1"; handle-level "Gap: 4 units, on a scale from 0 to 10; marks: Q at 2.5". No dot position | Pass |
| SC2 tile announcements | `announce.ts` trailing 2,000 ms throttle; `ReadoutTileLive` drawn once by `useShelfTile` inside `[data-area=tile]`, outside button and sheet. `readoutTileAnnounce.test.ts` 9 cases pass (first draw empty, 1,999/2,000 ms, burst, same/dot/facts silent, return-to-spoken silent, phone sheet open one region outside button and sheet, unmount pending leaves 0 timers, aria-label, two viewers). Probe P1 (handle level, through `mount` and `handle.part(tile)`): `setValue` same text with dot, `setScaleValue`, `setFacts` over 5 s: empty. A 16 ms `setValue` stream for 5 s then 4 s idle: exactly 3 updates at 2000/4000/6000 ms ("1984", "3984", last "4992 units"), each at least 2,000 ms apart, ending on the latest. Pending change then `handle.setView("b")`: the new tile's region is empty after 3 s and only one live region exists. Probe P2 (`announceAfter`): push of the first text arms no timer; cancel clears; A->B->A in window says nothing | Pass |
| SC3 chart | `drawnMarks` shared by drawing and summary; clause sorted by value, before highlight. `chartSummary.test.ts` 5 cases pass. Probe P3: marks at both extent edges included, equal values kept in input order, out-of-range left out, thousands format "1,234.5", input array not mutated by the sort, no marks + highlight unchanged text | Pass |
| SC4 no option/look change; API lock | `git diff main...HEAD -- packages/astraeus/api-surface.lock.json` empty; `ShelfTile` not in the lock. One CSS line only (`explainer/part.css`, tokens). Tile region uses the existing `.visually-hidden`. `lookDrift`, `interfaceLeftovers` pass in `npm test`. Shell imports no shelf module (grep of `src/shell` imports: only `app/shelfContract` types) | Pass |
| SC5 existing tests | Test diff removes exactly 2 lines, both in `lifecycle.test.ts` (1068 chart summary, 1142 tile line), per owner answer 1; other test changes are 3 new files | Pass |
| Fails without the fix | New tests and HEAD's `lifecycle.test.ts` run against a scratch worktree at 3cf413e2 (removed afterwards): explainerLive 3/3 fail, readoutTileAnnounce 9/9 fail, chartSummary 4/5 fail (the "no marks, no clause" negative case passes on both, by design), both changed lifecycle cases fail in both drivers. This covers T-453/T-454 builders' missing red-first evidence | Pass |
| SC6 docs | CHANGELOG 0.11.0: three `Fixed` lines, no breaking entry. viewer-interface section 11 `explainer`, `chart`, `readoutTile` rows state the rule. README untouched. Design.md Viewer interface O-098 sentence matches the code | Pass |
| SC7 size and split | `check:pack` engine 525,880 B gzip of 527,000 (1,833,863 B raw of 1,838,000); `check:shelf-split` ok (markers include `shelf-chart`, `shelf-tile`); the filterChips-only example's emitted JS has no `shelf-tile-live`, `Bar chart of` or `shelf-explainer-paragraphs` | Pass |
| SC8 no browser step added | No change under `packages/astraeus-site/tools/validate/`; quick tier + steps below pass | Pass |
| Owner answers 2, 3 | No timer in the explainer; catalogue example not in the diff | Pass |

## Gates (this session, HEAD d27111cb)

| Gate | Start (UTC) | Time | Result |
|---|---|---|---|
| `npm run typecheck` | 2026-11-24T08:24:44Z | 10 s | pass |
| `npm run lint` | 08:24:54Z | 8 s | pass |
| `npm test` (junit) | 08:25:02Z | 38 s | 348 files, 5634 passed, 2 skipped |
| `npm run build` | 08:25:40Z | 3 s | pass |
| `npm run check:pack` | 08:25:43Z | 24 s | pass; engine 525,880 B gzip of 527,000 (+27 B over main's 525,853) |
| `npm run check:node-consumer` | 08:26:07Z | 7 s | pass (12 tests) |
| `npm run measure:example` | 08:26:14Z | 4 s | pass; first-open total 525,880 B gzip |
| `npm run check:shelf-split` | 08:26:18Z | 4 s | ok |
| `git diff --check main...HEAD` | 08:26Z | 0 s | clean |
| `savepoint health check O-098` | 08:27:20Z | 9 s | snapshot created; does not block |
| `npm run check:browser -- --tier quick --step look-out --step catalogue --step synthetic-journey --skip-examples` (under `flock`, lock taken at once) | 08:27:33Z to 08:31:06Z | 213 s of 411 s | **exit 0.** smoke 48 s, synthetic-journey 65 s, smoke-public-showers 8 s, planets-phone 8 s, look-out 70 s, catalogue 8 s; error-lines 0 everywhere. Evidence `docs/evidence/browser-quick-20261124T082733Z/` |

Browser step choice (browser-policy.md): the diff touches a `.css` under `packages/astraeus/src` (explainer `part.css`) and `packages/astraeus/src/shell/` (`useShelfTile.tsx`), so quick + `look-out`; `src/shelf/` changed, so `catalogue` (a full-tier step; it draws all three parts); `useShelfTile.tsx` draws the phone tile sheet, a shell drawer component, so `synthetic-journey` was added under "when unsure, add". No packaging, `examples/` or API-surface change, so `--skip-examples`.

## Code Health

`savepoint health check O-098` created snapshot `sha256:b3cc2e79…60d5e`: "Code Health does not block clearance." Complexity, duplication, dependency vulnerabilities, tests: no finding. Coverage is stale (refreshed only by `test:full` at release or on the owner's ask); a collection-freshness statement, not a finding.

## File reality

All 16 non-record files exist at HEAD; `announce.ts`, `explainerLive.test.ts`, `readoutTileAnnounce.test.ts`, `chartSummary.test.ts` are new. Tasks name no phantom files. Checker probe file (`zzC221probe.test.ts`) was copied into `packages/astraeus/tests/` only for its runs and deleted; the scratch worktree at 3cf413e2 was removed (`git worktree list` shows the main checkout only). Working tree shows only the out-of-scope T-388 change and untracked evidence.

## Owner decisions and validation

T-453 and T-454 carry `owner_validation: {required: true}`. Their Task notes record the owner's look on localhost:5490 (DevTools Accessibility pane, branch at 0dde837f, 2026-11-24T08:23Z) and "looks good"; the code those looks covered is unchanged at d27111cb (that commit changes records and Design.md only). The coordinator fills `accepted_check: C-221` afterwards; this Check does not. No `exception` is recorded on O-098, so no `carried_forward` entry. Task-check waivers for T-452, T-453, T-454 are recorded (TEST-04).

## Issues

No Issues. No materiality actions are required.

## Observations (non-blocking)

1. `shell/useShelfTile.tsx` header comment still says "a tile draws itself through `view` and `strip`"; it now also draws `live`. Comment drift only.
2. The Objective's SC8 and Decisions call `catalogue` "the existing" step of the quick tier; it is a full-tier step, added here with `--step catalogue` per the browser policy.
3. The tile line lists its marks in input order, while the chart summary sorts by value. Neither Task asks the tile to sort; a host listing marks out of order gets them read out of order.
4. A pending tile announcement is dropped on a view switch or unmount (timer cancelled); the new tile's region starts empty. Matches the Task ("pending timer cleared on unmount").
5. `readoutTileAnnounce.test.ts` drives the cell directly, not `handle.part(tile).setValue`; probe P1 covered the handle path in this session.
6. No screen reader was run by this Check (headless tools cannot hear); proof is the accessibility attributes, node identity, timer logic and the owner's DevTools look.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why** — `useShelfTile.tsx` lines 1-2 still name only `view` and `strip` (observation 1).
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
