---
id: T-404
title: Retire the browser assertion text baseline
objective: O-088
status: done
depends_on: [{task: T-402, requires: clear}, {task: T-403, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-404, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus-site/tests/browserDrawnControl.test.ts, packages/astraeus-site/tools/validate/driver-guard.mjs]
planned_writes: [packages/astraeus-site/tests/browserAssertions.test.ts, packages/astraeus-site/tools/validate/assertion-list.mjs, packages/astraeus-site/tools/validate/assertion-list.d.mts, packages/astraeus-site/tests/fixtures/browserAssertionsBaseline.json, packages/astraeus-site/tests/browserExitPath.test.ts, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md]
---

# Retire the browser assertion text baseline

## Outcome

The browser-assertion text baseline (frozen at commit 6aad8e6a) is gone now that drafts 01 and 02 prove the outcomes it stood in for, and reviewers check scenario coverage by hand when a browser assertion changes (AH-33; Claude S7, Gemini S-03, OpenAI F07; Objective success condition 4).

## User Check

None visual. `npm test` no longer runs `browserAssertions.test.ts`; `docs/BROWSER_CHECKS.md` describes the outcome controls and the review step.

## Done When

- Deleted: `packages/astraeus-site/tests/browserAssertions.test.ts`, `packages/astraeus-site/tools/validate/assertion-list.mjs`, `assertion-list.d.mts`, `packages/astraeus-site/tests/fixtures/browserAssertionsBaseline.json`. A repo search for `assertion-list`, `browserAssertions` and `6aad8e6a` outside `docs/evidence`, `audits`, `.savepoint/checks`, `.savepoint/issues`, `.savepoint/objectives` and `docs/architecture/reconciliation-history.md` returns nothing (recorded in evidence; `.savepoint/Design.md` hits go to Drift Notes for the planner).
- Before deleting, the three controls are re-run green and their planted breaks re-confirmed once (one per control is enough: harness console error, run-browser exit code, zero dots), recorded as the proof the replacement is in.
- `browserExitPath.test.ts`'s header comment no longer refers to the assertion list (comment-only edit; no case changes).
- `docs/BROWSER_CHECKS.md`: the "The assertion list" and "Failure routes the list does not see" paragraphs, and the paragraph after them about rebuilding from git, are replaced by a short "Outcome controls" paragraph naming the three controls and their test files (`browserExitPath.test.ts`, `browserDrawnControl.test.ts`, `streamCheck.test.ts`) and the failure routes they do not see (a deleted or loosened assertion inside a step that still passes).
- Review note (Objective success condition 4): one bullet in `docs/agents/browser-policy.md` under "Browser regression maintenance" and the same rule in the new `BROWSER_CHECKS.md` paragraph: when a change removes, loosens or moves a browser assertion, the Task evidence lists each affected scenario and where it is now checked, and the Check reviews that list against the scenario map. Wording plain; no new mechanism.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tests/browserAssertions.test.ts` (header comment, to carry its limits into the new paragraph)
- `docs/BROWSER_CHECKS.md` under `The interface driver (...)` (the assertion-list paragraphs at its end only) and under `Retired scripts, and where each scenario went` (heading and first rows, for the map format)
- `docs/agents/browser-policy.md` (whole, short)
- `packages/astraeus-site/tests/browserExitPath.test.ts` (header comment only)

## Design References

`.savepoint/Design.md` under `Current Technical State` (the gate times and limits paragraph, to see if it names the assertion list; any hit is a drift note).

## Guardrails

TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Re-run the controls and one planted break each; record.
2. Delete the four files; run the search; fix any import left.
3. Edit the two docs and the comment.
4. Gates.

## Boundaries

No driver changes (draft 04). No change to the controls' cases. `browser-policy.md` gains one bullet only; O-086's tier wording there is not touched.

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/browserExitPath.test.ts packages/astraeus-site/tests/browserDrawnControl.test.ts packages/astraeus-site/tests/streamCheck.test.ts packages/astraeus-site/tests/browserDriverGuard.test.ts`. Handoff: `quality_gates`. No `check:browser` run (no browser script changes here).

## Technical Evidence

| Done When | Evidence |
|---|---|
| Four files deleted; search clean | Deleted browserAssertions.test.ts, assertion-list.mjs, assertion-list.d.mts, fixtures/browserAssertionsBaseline.json. Search for `assertion-list`, `browserAssertions`, `6aad8e6a` (excluding docs/evidence, audits, .savepoint checks/issues/objectives/health, research, reconciliation-history.md): only `.savepoint/Design.md` lines 126 and 279 remain (Drift Notes). Also removed one stale `RETIRED in tests/browserAssertions.test.ts` mention in the BROWSER_CHECKS.md map row for views/catalogue |
| Controls green and planted breaks re-confirmed before deleting | Focused run, 4 files, 17 passed. Under flock: harness.mjs line 83 without `&& errors.length === 0` -> browserExitPath console-error case red; run-browser.mjs without `process.exitCode =` -> exit-code case red; stream-check.mjs `!(dots > 0)` -> `dots < 0` -> browserDrawnControl and streamCheck I-071 cases red. All three restored (git diff empty on harness and run-browser; stream-check identical to backup) |
| browserExitPath header comment | line 9 no longer names the assertion list; comment-only |
| BROWSER_CHECKS.md | the two assertion-list paragraphs and the rebuild-from-git paragraph replaced by one "Outcome controls" paragraph naming the three test files and the unseen route (deleted or loosened assertion in a passing step) |
| Review note | bullet added under "Browser regression maintenance" in browser-policy.md, same rule in the Outcome controls paragraph |
| Gates (flock) | lint pass, typecheck pass, build pass, npm test: 324 files passed, 1 failed (scenePin.test.ts, known T-409 red, not mine); 5319 passed, 1 failed, 2 skipped |

Extra reads: none beyond Context Files. Limitations: no check:browser run (no browser script change).

## Drift Notes

`.savepoint/Design.md` line 126 (browser tiers paragraph) and line 279 (gate times and limits) still mention the assertion list or baseline; planner to reconcile before the Full Check.

## Coordinator (gates)

Set done by the orchestrating session after the combined handoff gates passed with T-402..T-404 and T-406..T-412 together (owner: "I mark them as they pass", O-038; G-024 decision 7 "Orchestrate each objective to completion"; owner 2026-11-22 "I am remote now, add park the check and move on"): lint and Prettier clean, typecheck clean, `npm test` 324 files, 5319 passed, 2 skipped; `npm run check:pack` pass, engine 1,836,372 B raw (cap 1,838,000), 525,692 B gzip (cap 527,000).
