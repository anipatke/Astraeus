---
id: C-083
scope: {kind: objective, id: O-025}
result: NEEDS WORK
checked_by: {role: checker, session: o025-orchestrator-20261019}
executed_session: o025-builders-20261019
checked_at: '2026-10-19T11:40:00Z'
health_snapshot: sha256:1d88c55f5d583019348524299452b7addc781207a50b42650b6a1340f2fb297e
reviewed:
  base_commit: 4b62ea9
  head_commit: 6e1bbae
  files:
    - src/shell/MoonFamilyPanel.tsx
    - src/shell/moonFamilies.ts
    - src/shell/AstraeusShell.tsx
    - src/app/FeatureMarkers.ts
    - src/shell/bodyFeatures.ts
    - src/experiences/jupiter-io/jupiterIo.ts
    - src/assets/moonCatalogue.ts
    - src/core/planetModels.ts
    - index.html
    - tools/validate/driver.mjs
    - tools/validate/browser-moon-panel.mjs
    - tools/validate/browser-jupiter-io.mjs
    - tools/validate/browser-home-curve-fits.mjs
    - .savepoint/Design.md
  dependencies: []
issues: [I-043, I-044, I-045]
supersedes: null
unmet: [SC1-count-and-date-shown, SC6-full-run, T-099-no-collisions]
---

# C-083: O-025 Full Objective Check

Owned Tasks: T-096, T-097 (done; Quick Checks C-076, C-077), T-098 (done; Task Check waived), T-099, T-101, T-103 (in progress, stage audit; Task Checks waived by the owner on 2026-10-19, "Skip, one check at the end").

Independence: the orchestrating session wrote no product code. It briefed the Sonnet builders, resolved the T-101 lane merge (kept both sides' added driver functions and BROWSER_CHECKS rows in `tools/validate/driver.mjs` and `docs/BROWSER_CHECKS.md`; no logic edited), and checks under the owner's orchestration model.

**Result: NEEDS WORK.** Three Issues: the browser driver's Developer helpers catch the moons panel's folds (I-043, two scripts fail), a real phone overlap between the Developer button and the top bar (I-044), and Success Condition 1's count and table date are not shown (I-045). Everything else passed.

## Scope lock
1. O-025 Success Conditions 1-6, Decisions 1-3 and 6-11, the owner's 2026-10-19 rules (no browser checks until this Check; no panel collisions, phone first), and each owned Task's Done When.
2. Gates: `quality_gates` (typecheck, build, test), `git diff --check`, `tools/validate/run-full.sh`, Code Health.
3. Integration: moons panel + feature markers + info panel sharing screen areas; T-101 lane merged with T-099/T-103 driver changes; planets as curve fits under every demo.
4. Design reconciliation (commit 6e1bbae).
5. Material: a failing configured gate or full-run step, or a Success Condition unmet.

## Evidence
- Gates on merged head a9df6fc (2026-10-19T11:23Z): typecheck 0, build 0, `npm test` 77 files, 1121 passed, 1 skipped; `git diff --check` clean. Since then only `.savepoint/Design.md` changed (6e1bbae), so reused.
- Full run `docs/evidence/o025-check-full-20261019T112609Z` (HEAD 6e1bbae, 686 s): 21 of 24 steps exit 0 with error-lines 0, including lite, phone, home-curve-fits, public-build-assets (load budgets), showers, story-panels, sky, view-link. Failed: jupiter-io and embedded (I-043), moon-panel (I-044). No screenshots.
- Health: snapshot above, "does not block clearance"; coverage and tests evidence stale (optional).

## Success conditions
1. Every Horizons moon present with name and source: met (115 in `data/ephemerides/jupiter-moons/index.json` and `data/moons/jupiter.json`). Count and table date shown: **not met** (I-045).
2. Positions from Horizons fits, checked at sample dates: met by T-096 (C-076) unit tests in the gate run.
3. Tagged places as the import defines them: met in unit tests (`tests/featureMarkers.test.ts`, all 78 places equal the donor formula); browser readout unverified (jupiter-io stopped before `places()`, I-043).
4. Dots at any distance, balls up close, names on demand: unit-level met (T-098); browser part unverified (I-043).
5. Load budget: met (public-build-assets exit 0; T-101 shrank `planetModels` 1,391,805 to 214,459 B raw). Phone performance: unverified (browser-jupiter-io did not reach it).
6. Driver-only browser checks; full run passes: **not met** (3 steps fail).

## Findings
- **I-043:** `tools/validate/driver.mjs:437-452` selects every `[data-fold-toggle]`; the moons panel's hidden folds match first, so `openDeveloper`/`toggleDeveloper` time out on the Jupiter page.
- **I-044:** phone 375x667, Developer button (323-367 x 8-52) over the top bar (12-363 x 8-104).
- **I-045:** no viewer text shows the 115 total or the Horizons list date.

## Materiality
| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-043 | High (every Jupiter browser run) | Medium (hides the Jupiter checks; product unaffected) | Medium | Fix now: scope the driver helpers to the Developer panel |
| I-044 | High (every phone viewer) | Low-Medium (a button over the bar's end) | Medium (owner's collision rule) | Fix now |
| I-045 | High | Low (a missing line of facts) | Medium (named Success Condition) | Fix now, small |

## Owner validation still needed
T-098, T-099, T-101, T-103: the owner looks on the preview at the end. Owner questions from builders: the place badge wording ("Reconstructed"), the 60 px minimum moon width for markers, lowering the app pages' load limits now that `planetModels` shrank, and the Jupiter opening view framed on Callisto.

## Observations (non-blocking)
- `browser-moon-panel.mjs` stops at its first assertion, so its later cases are untested until I-044 is fixed.
- Planets now throw outside 1969-2045; no demo reads outside it today (full run otherwise green).

## Code Style Review
No STYLE departures noticed in the files read.

## Full Check Progress Checklist
- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (Success Conditions x gates x full-run steps)
- [x] Finite External-Boundary Matrix (dev server, public preview started and stopped by run-full)
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock (unverified cells named under Success conditions)
- [x] Parallel Planning Advice (T-101 lane merged; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable, first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style
