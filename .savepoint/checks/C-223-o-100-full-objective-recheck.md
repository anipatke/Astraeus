---
id: C-223
scope: {kind: objective, id: O-100}
result: CLEAR
checked_by: {role: checker, session: recheck-o100-20261124}
executed_session: orchestrate-g027-20261124 (T-455, T-456, T-457 builders and coordinator); repair-i208-20261124 (I-208 repair)
checked_at: '2026-11-24T10:29:00Z'
health_snapshot: sha256:f2a3cc82527b979e75334370d897504d8ae3211c9ee5df507fdff2df5e99c130
reviewed:
  base_commit: 7866067a
  head_commit: 7df578f6
  files: [packages/astraeus/src/shell/PartBoundary.tsx, packages/astraeus/src/shell/useShelfTile.tsx, packages/astraeus/src/shell/useShelfPanels.tsx, packages/astraeus/src/shelf/panel/View.tsx, packages/astraeus/tests/partBoundaryReset.test.ts, .savepoint/Design.md, packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/part.css, packages/astraeus/src/api/listeners.ts, packages/astraeus/src/app/style.css, packages/astraeus/tests/chartSettles.test.ts, packages/astraeus/tests/chartAxisLabel.test.ts, packages/astraeus/tests/partBoundary.test.ts, packages/astraeus/tests/chartMarkRows.test.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
  dependencies: []
issues: []
supersedes: C-222
---

# C-223: O-100 Full Objective Recheck

Fresh session; it did not plan, build, coordinate or repair O-100, and did not write C-222. Recheck of C-222 (NEEDS WORK, I-208 only) under C-222's frozen scope lock and coverage matrix. Objective diff `git diff 7866067a...HEAD -- packages docs tools` (15 files, +465/-27); repair diff `git diff aec19b97..HEAD` (commit 7df578f6: `shell/PartBoundary.tsx`, `shell/useShelfTile.tsx`, `shell/useShelfPanels.tsx`, `shelf/panel/View.tsx`, new `tests/partBoundaryReset.test.ts`, one Design.md sentence, the I-208 history entry). Out of scope: O-101 planning records (7f627c6c), main's homepage-only c6d7db50, the uncommitted T-388 (O-086) change, untracked `docs/evidence/*` and `docs/research`.

**Result: CLEAR.** I-208's Proof Needed is met and independently reproduced through the public `mount` / `setViews` / `handle.setView` path the executor left unverified; every C-222 matrix row still holds; all gates pass; Code Health does not block.

## Closure map of prior Issues

| Issue | Prior | Now |
|---|---|---|
| I-208 (T-456 Done When: a boundary resets when its part is drawn again, including a view switch) | open (C-222) | **closed**: resolved `verified` by this Check |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-222's lock reused unchanged; no new axes)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-222's matrix re-checked, below)
- [x] Finite External-Boundary Matrix (browser runner only; no scratch server this run; the owner's :5490 untouched)
- [x] Workflow And Side-Effect Check Lock (the caught error's one side effect, the page report, counted per failure below)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a: advisory only)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission ledger

| # | Re-check item | Prior claim | Frozen cell (C-222) | Allowed result |
|---|---|---|---|---|
| 1 | Tile resets on a view switch, wide (card) | I-208 / repair | "T-456 reset on redraw", tile, wide | blocking |
| 2 | Tile resets on a view switch, phone (strip) | I-208 / repair | same row, phone | blocking |
| 3 | Switching back fails afresh with one further report | I-208 Proof Needed | same row + "report count" axis | blocking |
| 4 | Public path `mount` + `setViews` + `handle.setView` | I-208 original reproduction | same row (C-222 probe) | blocking |
| 5 | Panel reopen resets | I-208 Proof Needed | "SC2 open panel contained" / reset on reopen | blocking |
| 6 | Sheet boundary after a view switch | I-208 Evidence (sheet named as adjacent) | boundary axis "sheet" | blocking |
| 7 | All other C-222 rows (SC1-SC6, Design, layering) | C-222 Pass | each C-222 row | blocking |

## Re-check of the repair

The repair is a general rule rather than two `key`s: `PartBoundary` takes a required `part` id and `getDerivedStateFromProps` clears `failed` when the id changes (`PartBoundary.tsx:6-21`). All five draw sites pass it (`grep "<PartBoundary" src`: `useShelfTile.tsx:44,83,89` `part={tile.id}`; `useShelfPanels.tsx:72` and `shelf/panel/View.tsx:28` keep their `key` and add `part`); typecheck refuses a site without it. Trace: first render state.part = props.part (no reset); after a catch, `getDerivedStateFromError` merges `failed: true` and the re-render's `getDerivedStateFromProps` sees the same id (null), so the message holds; a new id clears it before render.

| # | Evidence (this session) | Result |
|---|---|---|
| 1-3 | `tests/partBoundaryReset.test.ts` (new; existing tests unedited: `git diff aec19b97..HEAD` touches no other test) wide and phone cases: message + 1 report; `showParts([ok])` shows "Fine gap" and "7 units", no message, no `.part-failed`, still 1 report; `showParts([broken])` message again, 2 reports, the second the view/strip error. Run with `partBoundary`, `readoutTile`, `readoutTileAnnounce`: 4 files, 46 passed | Pass |
| 4 | Throwaway test (deleted after the run): `new Scene().addBody(earth).addParts([readoutTile broken-tile, readoutTile ok]).setViews([v1: broken-tile, v2: ok], {start: v1})`, `mount` (3D scene stubbed), `handle.setView` v2 -> "Fine gap"/"7 units", no message, 1 report; v1 -> message, 2 reports; v2 again -> working, no `.part-failed`, 2 reports | Pass |
| 5 | `partBoundaryReset.test.ts` panel case: Notes opened (1 `.part-failed`, sibling "Working paragraph." kept, 1 report), Close, reopen -> message again, 2 reports ("key view failed") | Pass |
| 6 | Throwaway probe (deleted): phone, failed tile, press the strip -> the sheet shows its own message (2 reports); `showParts([ok])` closes the sheet, 0 `.part-failed` anywhere, strip "Fine gap", still 2 reports | Pass |
| red | Same two throwaway probes plus `partBoundaryReset.test.ts` in a scratch `git worktree` at aec19b97 (pre-repair; removed after): 4 of 5 fail ("expected 'This part could not be drawn.' to contain 'Fine gap'"); the panel case passes there (panels were already keyed), as the executor reported. The tests discriminate the fix | Pass |

## C-222 matrix rows (regression)

| C-222 row | Re-check evidence | Result |
|---|---|---|
| SC1 settles / belt / font key / layout kept | `chart/View.tsx` unchanged since C-222 (`git diff aec19b97..HEAD` does not touch it); `chartSettles`, `chartMarkRows` pass in the full run | Pass |
| SC2 block, tile, open panel contained | `partBoundary.test.ts` unchanged and green; boundaries still wrap every draw site | Pass |
| T-456 reset on redraw | Rows 1-6 above | Pass (was Issue) |
| SC2 shell imports no shelf module | `check:shelf-split` ok (filterChips only); the repair adds no import | Pass |
| SC3 wraps | `chartAxisLabel` green; `catalogue` browser step at both sizes passes | Pass |
| SC4 test edits | Objective test diff: `chartMarkRows.test.ts` 4 owner-approved constant lines only; all else new files (`chartSettles`, `chartAxisLabel`, `partBoundary`, `partBoundaryReset`) | Pass |
| SC5 docs | CHANGELOG and viewer-interface unchanged since C-222; `api-surface.lock.json` unchanged (`PartBoundary` is internal; its new prop is not public) | Pass |
| SC6 size | engine 526,064 B gzip (cap 527,000; +50 B over C-222's 526,014), 1,834,583 B raw (limit 1,838,000) | Pass |
| Design reconciliation | Design.md Viewer interface O-100 sentence adds "the boundary takes the drawn part's id and clears its failed state when that id changes (I-208)" | Pass |
| Layering (shell -> api `reportToPage`) | Unchanged; C-222 observation stands | Observation |

## Gates (this session, `date -u`)

| Gate | Start | Result |
|---|---|---|
| `npm run typecheck` | 10:22:04Z | pass, 8 s |
| `npm run lint` | 10:22:12Z | pass, 7 s |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 10:22:19Z | 352 files, 5645 passed, 2 skipped, 40 s (C-222: 351 / 5642; +1 file, +3 cases) |
| `npm run build` | 10:22:59Z | pass, 6 s |
| `npm run check:pack` | 10:23:05Z | pass, engine 526,064 B gzip / 1,834,583 B raw, 21.5 s |
| `npm run check:shelf-split` | 10:23:26Z | ok, filterChips only |
| `flock /tmp/claude-1000/astraeus-browser.lock -c 'npm run check:browser -- --tier quick --step look-out --step catalogue --step synthetic-journey --skip-examples'` | 10:23:46Z-10:27:18Z | exit 0, 211 s of 411 s; smoke 44 s, synthetic-journey 68 s, smoke-public-showers 5 s, planets-phone 8 s, look-out 71 s, catalogue 11 s; error-lines 0 everywhere; evidence `docs/evidence/browser-quick-20261124T102346Z` |
| `savepoint health check O-100` | 10:27:25Z | snapshot recorded above; "Code Health does not block clearance" |
| `git diff --check 7866067a...HEAD -- packages docs tools` | | clean |

Browser steps from the repair diff (browser-policy): `look-out` for `src/shell/` (Layout), `synthetic-journey` for the shell panel and tile drawing (`useShelfPanels.tsx`, `useShelfTile.tsx`), `catalogue` for `src/shelf/panel/View.tsx`; `--skip-examples`: no packaging, `examples/` or public API change. The throwaway probe file was written after lint and test collection had started and is not counted in the gate numbers (352 files = 351 + `partBoundaryReset`).

## Code Health

Snapshot `sha256:f2a3cc82...`: does not block. complexity, duplication, dependency vulnerabilities: no finding. tests and coverage (optional): "stale" (the tree carries uncommitted out-of-scope files; coverage is measured at release). Collection state only, not a finding.

## File reality

Every file in the I-208 repair entry exists at HEAD: the four source files, `tests/partBoundaryReset.test.ts`, Design.md. The executor's red-first copy of the old `useShelfTile.tsx` left nothing behind (`git status` clean for `packages`). My throwaway probe and scratch worktree are deleted (`git worktree list` shows the main checkout only).

## Owner decisions

No owner acceptance or exception is recorded on O-100 or its Tasks (T-457 `owner_validation: {required: true}` has no `accepted_check` yet; the Task check waivers are waivers, not Check-bound decisions), so there is nothing to carry forward. T-457's owner look ("Looks good" at 1bb6f809) covers the chart caption; the repair does not touch the chart, so this Check is the one the owner may accept T-457's validation against.

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

1. The reset is keyed on the part id only: a host that replaces a failed part with a new one of the same id (`setViews` or `showParts` with a fixed block under the old id) keeps the message until the boundary remounts. Ids are unique per scene and a same-id part is the same part, so this matches the Done When; outside the frozen lock.
2. C-222 observations 1-5 (measure once per text+font key; first label's font only; the trivially equal viewBox read; the "320 156" test title; `PartBoundary` reports the raw error) and the shell -> api layering note stand unchanged.
3. O-100's `Objective.md` still reads `status: planned` while all three Tasks are `done`; closure is the owner's.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** (the reset branch is now covered: `partBoundaryReset.test.ts`)
- [x] STYLE-04 **Types document intent** (required `part` prop makes the reset impossible to omit)
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** (one reset rule in the boundary, not a `key` per site)
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** (repair: 7 files, +138/-9, mostly the new test)
