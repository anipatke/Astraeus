---
id: T-378
title: Turn on the React hooks lint rules and review every suppression
objective: O-093
status: planned
depends_on: [{task: T-371, requires: clear}, {task: T-377, requires: clear}]
check_waiver: {task: T-378, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: tooling
planned_reads: [tools/gate-limits.json, docs/agents/build.md, tools/lint/use-typescript6.cjs]
planned_writes: [eslint.config.js, packages/astraeus/src/shell/ScaleControl.tsx, packages/astraeus/src/shell/panels/usePanels.ts, packages/astraeus/src/shell/useShelfPanels.tsx, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/sceneHooks.ts, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus-demo-planets/tests/planetSystems.test.ts]
---

# Turn on the React hooks lint rules and review every suppression

## Outcome

`react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` are errors, unused disable comments are reported as errors, and each of today's 16 `exhaustive-deps` suppressions is either removed by a behaviour-neutral fix or kept with a written reason on the same line (AH-44: Claude section D.1 `audits/2026-11-21_anthropic_claude-fable-5-2_auditfindings.md:142`, Gemini `audits/2026-11-21_google_gemini-4-neon_auditfindings.md:185,194`, Codex section D).

## User Check

None visual.

## Done When

- `eslint.config.js`: `"react-hooks/rules-of-hooks": "error"`, `"react-hooks/exhaustive-deps": "error"`, `linterOptions.reportUnusedDisableDirectives: "error"`; the comment that says the plugin is registered only for disable comments is replaced. Only these two plugin rules: the plugin's React Compiler rules are not turned on (see the plan's decision).
- Every suppression the planner found is reviewed (re-grep first; O-089 may have moved some): `shell/ScaleControl.tsx:74`, `shell/panels/usePanels.ts:96`, `shell/useShelfPanels.tsx:45`, `shell/AstraeusShell.tsx:353,359,406,421,481`, `app/App.tsx:281,534`, `app/sceneHooks.ts:30`, `app/sceneContentsHooks.ts:93`, `api/AstraeusScene.tsx:97-100`. For each, Technical Evidence records one row: kept (with the `-- reason` text added to the comment) or removed (what made it safe, for example the added value is a ref or a state setter, which never changes). A dependency that would change when the effect runs is never added in this Task: such cases keep the suppression with a reason.
- The `no-console` disable in `packages/astraeus-demo-planets/tests/planetSystems.test.ts:63` names a rule that is not on, so it becomes an unused directive: remove the comment only.
- Planted slips, each run and reverted with output recorded: a `useEffect` reading a prop missing from its dependency list fails `npm run lint`; a hook called inside an `if` fails `npm run lint`; a stale `eslint-disable-next-line react-hooks/exhaustive-deps` on a line with no problem fails `npm run lint`.
- `npm run lint` wall time before and after recorded (limit 15 s in `tools/gate-limits.json`; the two rules are syntax-only, no type information, so little change is expected). If over, report rather than raise the limit.
- DOM tests for the touched components green and unedited (`astraeusSceneConsole.test.ts`, `appScreenDom.test.ts`, `viewerHostDom.test.ts`, `twoViewers.test.ts`).
- Gates per `docs/agents/verification.md`.

## Context Files

- `eslint.config.js`
- Each suppression's surrounding hook (the `useEffect`/`useMemo`/`useCallback` call it sits in) in the files listed in `planned_writes`
- `tools/gate-limits.json`, `docs/agents/build.md` (gate table)

## Design References

`.savepoint/Design.md` under `Current Technical State`.

## Guardrails

CODE-01, STYLE-08, STYLE-10, TEST-01, TEST-03.

## Implementation Plan

1. Time `npm run lint`; turn the rules on; run lint to list every report.
2. Review each report and suppression; fix only behaviour-neutral ones; write reasons for the rest.
3. Plant and revert the three slips; time lint again.
4. Focused DOM tests; gates.

## Boundaries

No change to when an effect runs. No new lint rules beyond these two and the unused-directive report. No change to the viewer coordinator's structure (O-089). No formatter work (drafts 10 and 12).

## Technical Verification

Focused: `npm run lint`; `npx vitest run packages/astraeus/tests/astraeusSceneConsole.test.ts packages/astraeus/tests/appScreenDom.test.ts packages/astraeus/tests/viewerHostDom.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus-demo-planets/tests/planetSystems.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

For Design reconciliation (`Current Technical State`): lint now runs complexity, the two React hooks rules, the constants rule (draft 02) and unused-directive reporting.
