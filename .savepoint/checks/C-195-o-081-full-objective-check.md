---
id: C-195
scope: {kind: objective, id: O-081}
result: CLEAR
checked_by: {role: checker, session: check-o081-20261121}
executed_session: orchestrate-o081-20261121
checked_at: '2026-11-21T08:10:23Z'
health_snapshot: sha256:ad5a42ec308c9cdab0cab5a706b079ac662ca77e5b55631aa7f83ddf7f895645
reviewed:
  base_commit: df0c3eb8
  head_commit: fe923d11
  files: [docs/architecture/viewer-interface.md, packages/astraeus-site/components.html, packages/astraeus-site/data/shelf-catalogue.json, packages/astraeus-site/src/catalogue/examples/chart.ts, packages/astraeus-site/src/catalogue/examples/readoutTile.ts, packages/astraeus-site/src/catalogue/page.ts, packages/astraeus-site/tests/apiReference.test.ts, packages/astraeus-site/tests/apiTypeLint.allowlist.json, packages/astraeus-site/tests/shelfCatalogue.test.ts, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/api-surface.lock.json, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/planParts.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/viewerParts.ts, packages/astraeus/src/app/shelfContract.ts, packages/astraeus/src/app/style.css, packages/astraeus/src/app/useShelf.ts, packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/factory.ts, packages/astraeus/src/shelf/chart/part.css, packages/astraeus/src/shelf/panel/factory.ts, packages/astraeus/src/shelf/part.ts, packages/astraeus/src/shelf/readoutTile/View.tsx, packages/astraeus/src/shelf/readoutTile/factory.ts, packages/astraeus/src/shelf/readoutTile/part.css, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/areas/areas.css, packages/astraeus/src/shell/panels/panelRule.ts, packages/astraeus/src/shell/panels/usePanels.ts, packages/astraeus/src/shell/parts/parts.css, packages/astraeus/src/shell/useShelfPanels.tsx, packages/astraeus/src/shell/useShelfTile.tsx, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/panelRule.test.ts, packages/astraeus/tests/readoutTile.test.ts, packages/astraeus/tests/shelfContentParts.test.ts, packages/astraeus/tests/twoViewers.test.ts, tools/check-shelf-split.mjs]
  dependencies: []
issues: []
supersedes: null
---

# C-195: O-081 Full Objective Check

Fresh session; I did not plan, build or reconcile O-081. Diff `main...HEAD` (`df0c3eb8..fe923d11`, T-337..T-340, 52 files). Step checks waived by the owner on every Task (`check_waiver`); this Check covers all four.

**Result: CLEAR.** No Issues.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner and packed example build: configured target = scratch servers; exit codes and error lines read)
- [x] Workflow And Side-Effect Check Lock (no new persistent workflow; the split check's build-then-scan is exercised pass and fail)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality (every file named in T-337..T-340 evidence exists)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: the eight O-081 Success Conditions and Decisions; T-337..T-340 Done When; Guardrails ARCH-01..03, API-01..05, API-07, TEST-01, TEST-03, TEST-08; the full gate set in `docs/agents/build.md`.
2. Entry points: `chart`, `readoutTile`, `scene.addParts(PanelPart | TilePart)`, `handle.part` (`ChartControl`, `ReadoutTileControl`) on `mount` and `AstraeusScene`; the panel rule's `tile` occupant; the `tile` area; `check-shelf-split`; `components.html` and `api/shelf.html`.
3. Relied-on: `PartPlan.checkTiles` against resolved views (`api/views.ts`: an unlisted part shows in every view), per-viewer cells (`useShelf`), `shownParts`.
4. Matrix axes: factory input shape per field (normal, empty, missing, wrong type, non-finite, reversed, outside, too many, mutation after the call); setters (valid, invalid, before/after mount, silent); layout (wide, phone, phone to wide); views (none, one tile per view, two in one view, listed + unlisted); panel-rule transitions (open wide no-op, phone open, replaced by another left occupant, Escape with and without a pop-up, close, view switch); embedding path x2; two viewers; split import (each alone, pairs with one disallowed). Text classes not applicable (no width or truncation logic in scope).
5. Admission: supported public paths only, against the criteria above.

## Coverage (criterion: evidence)

- **Chart**: Proven. `src/shelf/chart/`; `shelfContentParts.test.ts` refuse rows for every field (empty bins, `low >= high`, negative/non-finite count, bad colour, highlight reversed/outside/malformed, bad marks), frozen copy; lifecycle on both paths (dims, redraws while open, silent, bad setter `bad-part`, bar tap unheard, `not-mounted`, `aria-label` summary); `setBins` drops a highlight the new range no longer holds (read in `factory.ts`).
- **Readout tile**: Proven. `readoutTile.test.ts` 26 refuse rows (label, value, scale shape, log with `low <= 0`, marks outside/NaN, facts > 4); setters `setValue(value, scaleValue?)`, `setScaleValue`, `setFacts` checked and silent on both paths.
- **Tile place**: Proven. `useShelfTile.tsx` draws via `view`/`strip` only; `areas.css` rows under `:has` (no `@media`); shell tests wide card + About, phone strip, tap opens sheet, Escape, About replaces, view switch closes; panel-rule named cases. Browser `catalogue` step: desktop card top-left, phone strip opens sheet.
- **One tile per view**: Proven. `checkTiles` throws `bad-part` naming both; unlisted tile meets every view; test covers all four cases.
- **One contract**: Proven. `duplicate-id`, `not-mounted`, both paths, two viewers (API-03), synthetic scenes (ARCH-03), `lookDrift.test.ts` clean, split check probes below.
- **Catalogue and docs**: Proven. Entries + `?raw` examples, `shelfCatalogue.test.ts` green, `apiReference.test.ts` names the types on `api/shelf.html`, README rows, CHANGELOG 0.9.5 lines, API lock/errors (`apiRules` in the gate), journey covers both at 1280x720 and 375x667.
- **Sizes**: Proven. `check:pack` pass this session (engine within limits); T-340 table matches; measure:example first-open 1,828,138 / 522,471 B gzip.
- **Owner look**: recorded in the Objective Decisions and T-340 ("Looks right, run the final check").
- **Design reconciliation**: every T-337..T-339 drift note appears in `viewer-interface.md` sections 2, 7, 11 and Design "Viewer interface" Shelf bullet, or is marked non-architectural in T-340 with a reason.

## Gates (this session)

- `lint` 0 (5 s); `typecheck` 0 (7 s); `build` 0 (3 s); `test:full` 0: 289 files, 4627 passed, 2 skipped (97 s; junit to scratch, not the repo); `git diff --check main...HEAD` clean.
- `check:engine-alone` pass (31 s); `check:pack` pass (16 s); `check:node-consumer` pass (7 s); `measure:example` 0.
- `check:shelf-split` ok (default). Probes (`--no-build`): `--import chart` ok; `--import readoutTile` ok; `--import chart,readoutTile --allow chart` FAIL naming `shelf-tile`; `--import readoutTile,chart --allow readoutTile` FAIL naming `shelf-chart` (both as required).
- `npm run check:browser` once, 08:03:11-08:09:57 UTC: exit 0, every step exit 0, no error lines; evidence `docs/evidence/browser-20261121T080311Z`. Time warnings (look-out 110 s / 75, hello-sky 21 s / 15, total 406 s / 320) match C-194's on unchanged scenes; not failures.
- `savepoint health check O-081`: snapshot above, "does not block clearance"; all instances optional. The tests instance reads the root `junit.xml` and reported stale because this run wrote junit to scratch (coordinator instruction); collection statement, not a finding.

## Adversarial pass

Bypass via `addParts` (non-factory value, tile in a panel, tile id reused) refused; tile-in-blocks refused at `panel`; setters re-run the factory checks; descriptors frozen copies; tile on a scaleless tile refuses a position; phone-to-wide closes the sheet by effect; a view switch to another tile dispatches `dropsTile`; split markers are not in the shell's own class names (`tile-card`, `tile-strip-button`, `tile-sheet`). Journey `waitForSelector` calls use `[data-` selectors, which the driver guard allows.

## Materiality

No Issues; no materiality actions required.

## Owner Decisions

No owner acceptance or exception is recorded on O-081 yet (step-check waivers and owner design decisions only), so no `carried_forward` entries.

## Owner Validation

T-340 declares `owner_validation.required`. This Check is CLEAR, so the owner may accept T-340 against C-195; not recorded here. O-081 closes after that acceptance.

## Observations (non-blocking)

- Two layouts in one page are not tested together (happy-dom shares one window); each layout is proven separately, and the browser step runs both sizes.
- The `catalogue` `results.json` records only part count and fit; the chart and tile assertions live in the journey and passed (exit 0).

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
- [ ] STYLE-10 **Small diffs** — 52 files, ~1,800 lines across four Tasks; each Task's share is proportionate to a new part, so advisory only.
