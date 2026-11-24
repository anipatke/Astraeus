---
id: C-220
scope: {kind: objective, id: O-097}
result: CLEAR
checked_by: {role: checker, session: recheck-o097-20261124}
executed_session: repair-i207-20261124 (I-207 repair); orchestrate-o097-20261124 (T-449..T-451)
checked_at: '2026-11-24T08:06:00Z'
health_snapshot: sha256:cedd2751958a76db50420c9a033d0ca2521463218469a9a907c51a4c5c386de8
reviewed:
  base_commit: 4438469c
  head_commit: 0e871da5
  files: [packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/tests/chartMarkRows.test.ts, packages/astraeus/src/shell/parts/parts.css, packages/astraeus/src/shelf/chart/markRows.ts, packages/astraeus/tests/panelWrap.test.ts, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, docs/architecture/viewer-interface.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: C-219
---

# C-220: O-097 Full Objective Recheck

Fresh session. It did not plan, build, coordinate, repair or run C-219. This is the one full recheck after C-219 (NEEDS WORK). It keeps C-219's mode and frozen scope lock. Objective diff `git diff 4438469c...HEAD` (24 files). Repair diff `git diff ce9abf76..HEAD`: `View.tsx` (+20/-4), a new `describe` block in `tests/chartMarkRows.test.ts` (+51, pure addition), and the I-207 history. Out of scope: main's later homepage change (ad8bcac8), the uncommitted T-388, untracked `docs/evidence/*` and `docs/research`, and the `Astraeus-homepage` worktree.

**Result: CLEAR.** I-207's Proof Needed is met, so I-207 is closed as `verified`. The `catalogue` browser step passes, so `browser-gate-catalogue` is closed. Every gate passes, and Code Health does not block.

## Closure map (C-219)

| Prior item | Status | Evidence |
|---|---|---|
| I-207: chart label rows overlap at a large host text size | **Closed (verified)** | Probe and test results below |
| `unmet: browser-gate-catalogue` (a host network-change console line) | **Closed** | `catalogue` exit 0, 12 s of 16 s, error-lines=0 |
| `unmet: O-097-SC3-chart-labels-never-overlap` | **Closed** | Same as I-207 |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-219's lock is reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-219's matrix; the cells touched by the repair were rerun)
- [x] Finite External-Boundary Matrix (browser runner and one scratch vite server on :5611 for the probe; the owner's :5490 was not touched)
- [x] Workflow And Side-Effect Check Lock (n/a: a pure layout plus a measure-then-place layout effect, as in C-219)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission ledger (recheck)

| Recheck item | Prior Issue or claim | Frozen cell | Allowed result |
|---|---|---|---|
| Two close labels at text sizes 14 and 18, both sizes | I-207 Proof Needed | SC3 × host text size (default 14 through maximum 18) × cluster × 1280x720 / 375x667 | pass/Issue |
| Text sizes 11 to 13 and 15 to 17 | I-207 executor's "unverified" note | SC3 × host text size (the C-219 lock's axis covers 14 to 18; 11 to 13 sits outside the lock) | 15 to 17: pass/Issue; 11 to 13: observation only |
| One-row chart `0 0 320 156` | I-207 Proof Needed; SC3 | SC3 × one mark | pass/Issue |
| Test fails if the row height stops following the text size | I-207 Proof Needed; TEST-01 | SC3 × mutation (fix removed) | pass/Issue |
| `catalogue` step | `browser-gate-catalogue` | release gate | pass/unmet |
| SC1, SC2, SC4 to SC6 unchanged by the repair | C-219 matrix | C-219 rows | pass/Issue |

## Coverage matrix (recheck)

| SC | Evidence (this session) | Result |
|---|---|---|
| SC1, SC2 (panel wrap) | `git diff ce9abf76..HEAD` touches no CSS or panel code. `panelWrap.test.ts` passes in `npm test`. The `catalogue` long-word assertions passed at both sizes in this run | Pass (unchanged) |
| SC3 (chart labels never overlap) | **Independent probe** (08:02:31Z to 08:03:09Z, under the browser lock). A throwaway Playwright script in this session's scratchpad (not committed) used the project's `launchBrowser` and the driver's `pressCatalogueRun`/`waitForCatalogueState`. It ran the real `components.html` chart example on a scratch vite server at 1280x720 and at 375x667 with touch. It set `--astraeus-text-size` to 11 through 18 px with an `!important` stylesheet injected before load; this is the same custom property that `interfaceLook.ts:77` writes for `textSizePx`, and the computed value was read back each time. It measured each label's `getBBox` and its glyph extents (canvas `actualBoundingBoxAscent`/`Descent` at the label's computed font). **Result: at all 16 combinations, "Limit" and "Survey edge" sit in different rows with a box overlap of 0.00 px.** The quarter limit is 2.40 to 4.12 px. The glyph gap is positive everywhere: +0.58 px at the minimum, 11 desktop; 14: +3.41 desktop and +2.10 phone; 18: +2.29 desktop and +2.50 phone. Both labels stay inside the viewBox width, and there were no page errors. Row pitch equals the measured box height: 13.41 at 14 and 16.29 at 18 on desktop, 12.10 and 16.50 on phone. The viewBox grows to `0 0 320 169.41` at 14 and `0 0 320 172.29` at 18 (desktop). **One row:** `extra = maxRow × row`, so a chart whose marks all stay in row 0 adds 0 whatever the pitch. The unchanged unit case "keeps a one-mark chart at 0 0 320 156" passes. **Mutation:** with `const row = ROW;` swapped into `View.tsx`, `chartMarkRows.test.ts` fails "spaces two rows by the measured label box height and grows the viewBox by it" (1 failed, 6 passed). Restored, 7 passed, and `git diff` on the file is empty | **Pass**: I-207 Proof Needed met |
| SC4 (no existing test or assertion edited) | The repair adds only a new `describe` block (hunk `@@ -80,3 +80,54 @@`, additions only). No browser script changed in the repair | Pass |
| SC5 (CHANGELOG, viewer-interface) | The `Fixed` line and the viewer-interface `chart` row ("take further rows … grows one row taller for each") still describe the code. Neither names a fixed row height. Design.md's O-097 sentence still matches | Pass |
| SC6 (engine size, catalogue limit) | `check:pack`: engine **525,853 B gzip** of 527,000, 1,833,752 B raw of 1,838,000, the same as C-219 (the chart is not in the first-open bundle). `catalogue` took 12 s of the owner's 16 s limit | Pass |

## Adversarial pass (repair code)

- **Convergence.** The layout effect now also measures `getBBox().height`, which depends on the font only, not on placement or `y`. The bail-out compares the height too, so a render settles in one extra pass, as before. With no marks, `Math.max(0)` gives 0 and the code falls back to 12.
- **Fallback.** A height of 0, or no `getBBox`, gives `ROW = 12`, as the unit case "falls back to 12 units" checks (`0 0 320 168`). Measured height is used only when `measured.key === key`, so a new set of labels cannot inherit a stale pitch.
- **Box against glyph.** The pitch equals the full text box height (ascent plus descent plus line gap). Glyphs therefore can never cross into the next row, which the probe confirms with a positive gap at every size.
- **Bypass via a runtime text-size change.** C-219 observation 2 still stands, now for height as well as widths. It sits outside the lock (see the observations).

## Gates (this session, branch at 0e871da5)

| Gate | Start (UTC) | Time | Result |
|---|---|---|---|
| `npm run typecheck` | 2026-11-24T08:00:04Z | 8 s | pass |
| `npm run lint` | 08:00:12Z | 7 s | pass |
| `npm test` (junit) | 08:00:19Z | 37 s | 345 files, 5612 passed, 2 skipped |
| `npm run build` | 08:00:56Z | 3 s | pass |
| `npm run check:pack` | 08:00:59Z | 25 s | pass; engine 525,853 B gzip of 527,000; 1,833,752 B raw of 1,838,000 |
| `npm run check:shelf-split` | 08:01:24Z | 4 s | ok, no other part's marker class in the emitted JS |
| `git diff --check 4438469c...HEAD` | 08:01:28Z | 0 s | clean |
| `npm run check:browser -- --tier quick --step catalogue --skip-examples` (under `flock`, lock taken at once) | 08:03:39Z to 08:04:52Z | 72 s of a 296 s limit | **exit 0.** smoke 43 s, smoke-public-showers 5 s, planets-phone 9 s, catalogue 12 s (limit 16 s): all exit 0 with error-lines=0. Evidence `docs/evidence/browser-quick-20261124T080340Z/`, logs `/tmp/astraeus-check-logs-i5XklL` |

Browser step choice (browser-policy.md): the repair changes only `packages/astraeus/src/shelf/chart/View.tsx` (a `src/shelf/` path, so `catalogue`) and a unit test. It changes no CSS, `shell/` or story-panel code, so C-219's `look-out`, `synthetic-journey` and `meteor-shower` passes still cover the unchanged code. The browser check ran once.

## Code Health

`savepoint health check O-097` (08:04:56Z) created snapshot `sha256:cedd2751…6de8`: "Code Health does not block clearance." Complexity, duplication and dependency vulnerabilities: no finding. Tests and coverage are marked stale. Coverage is refreshed at release. The tests reading is stale because the browser run wrote files after `junit.xml`. The gate's own result above is current. This is a collection note, not a finding. This session made no other snapshot.

## File reality

`View.tsx` and `chartMarkRows.test.ts` exist at HEAD. The mutation swap was restored (`git diff` is empty on `View.tsx`). The probe script sits in the session scratchpad and is not committed. The working tree shows only the out-of-scope T-388 change. No phantom files.

## Owner decisions and validation

No structured `owner_validation` acceptance or `exception` is recorded on O-097 yet: T-449 and T-450 carry `{required: true}`, and the coordinator fills them in. So there is no `carried_forward` entry to write. The owner's 16 s `catalogue` limit is unchanged and holds (12 s). **Owner look still needed for T-450:** C-219 predicted that the I-207 repair would leave the default-size chart unchanged. That prediction did not hold. The owner saw the catalogue chart at 03c9be33 with a 12-unit row pitch. At the default size the pitch is now the measured box: 13.4 units on desktop and 12.1 on phone, so the two-row chart is about 1.4 units taller on desktop. The change is small and in the safe direction, but it is a visible change to the look the owner accepted. The owner, or the coordinator on the owner's word, decides whether "both look fine" still covers it.

## Issues

No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Text sizes 11 to 13 are outside C-219's frozen lock, which covers 14 to 18. They were probed anyway and pass, with glyph gaps of +0.58 to +2.46 px.
2. C-219 observation 2 now applies to height too. A live change of `textSizePx` with no chart re-render keeps the old widths and pitch until the next render.
3. The new test helper restores `getBBox` but leaves its `getComputedTextLength = () => 34` stub on `SVGTextElement.prototype`. The existing helper at line 61 does the same. This is test-only and harmless today.
4. The probe was Chromium only, which matches the project's browser runner.
5. C-219 observations 1, 3, 4, 5 and 6 are unchanged. The repair does not touch them.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the per-character width fallback in `View.tsx` (`CHAR = 6`) is still never exercised; the height fallback is now tested.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — the anchor-side rule `x > width / 2` is still in both `markRows.ts` and `View.tsx` (unchanged since C-219).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
