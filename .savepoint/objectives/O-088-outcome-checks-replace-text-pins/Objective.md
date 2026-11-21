---
id: O-088
title: Outcome checks replace text pins
status: planned
depends_on: [O-086]
release: G-024
priority: medium
rank: 7
---

# O-088: Outcome checks replace text pins

## Outcome

Tests that freeze source text are replaced by tests that check outcomes, then retired, and the browser driver loses its unreachable code.

## Why

AH-33 (all three): `browserAssertions.test.ts` freezes browser-assertion source text at one commit (a renamed variable fails it; an early return can pass), blocking deletion of about 225 unreachable driver exports; `scenePin.json` is one 837 KB self-generated snapshot; the computed-look baseline keys by element index; the migration and allowlist-growth tests guard history. Owner decision 4: retire only after replacement.

## Success Conditions

- Outcome negative controls in place first: a failing browser step exits non-zero, a console error fails, zero drawn dots fail.
- Then the assertion-text baseline, its list and fixture are retired; unreachable driver exports deleted with one clean browser run.
- The scene pin replaced by focused contract cases (no verbatim message text); the computed-look baseline narrowed to what the owner's look rules need, or retired; the 0.7 migration and empty-allowlist checks retired or reduced.
- Review checklist note: scenario coverage is checked in review when browser assertions change.

## Architectural Considerations

TEST guardrails; ARCH-06 allowlist rules if any guard is reduced.

## Boundaries

**In scope:**
- The named pins and baselines, driver dead code, replacement controls.

**Out of scope:**
- Science reference tests and API surface lock (kept).

## Decisions

- Owner 2026-11-21 (G-024 decision 7): "work through this list of objectives one by one. Orchestrate each objective to completion"; owner 2026-11-22 "I am remote now, add park the check and move on" (O-087 parked). Step checks waived on every Task. No owner look (nothing visible changes).
- Branch `o088-outcome-checks` is built on top of the parked `o087-lighter-frame-loop` (both change the browser driver and harness), so O-087 merges first.
- Planner (orchestrate-g024-20261121), settled from evidence; conservative defaults taken on the planner's open questions (flagged to the owner):
  1. Look lock narrowed, not retired (T-410).
  2. `docs/RELEASING.md` step 3 gains one sentence to refresh the previous-release API surface in each release commit (T-411).
  3. Deep-import counts keep their "may only go down vs `main`" check (T-412).
  4. Controls run real tooling (harness, runner, run-browser), not source text; retire the text baselines only after their replacements land (G-024 decision 4).
  5. The scene pin is split into fault order (T-406), build contract (T-407, capped at about 25 new cases) and load order (T-408), then retired (T-409).
  6. Driver dead code is removed by mechanical reachability, with one full browser tier run (T-405), the Objective's only 3D browser job; the Full Check reuses it if code is unchanged since.
- Waves: T-402, T-406, T-407, T-408, T-410, T-411, T-412 side by side; then T-403 (after T-402) and T-409 (after T-406..T-408); then T-404; then T-405. Planted breaks in production files run inside the shared gate lock so they never overlap another builder's gate run.
- Drafts were written before O-086 and O-087 landed: builders re-read `harness.mjs` (O-087 T-395 made `openPage`/`openContext` async and sets the diagnostics flag), `run-browser.mjs`/`browser-steps.mjs`/`runner.mjs` (O-086 tiers), and `browserAssertions.test.ts` (O-086 added its `RETIRED` list), and find code by name, not line.
