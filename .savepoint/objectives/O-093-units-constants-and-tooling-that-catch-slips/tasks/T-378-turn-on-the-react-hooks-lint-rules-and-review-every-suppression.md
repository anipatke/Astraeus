---
id: T-378
title: Turn on the React hooks lint rules and review every suppression
objective: O-093
status: done
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

### Done When -> evidence
| Done When | Evidence |
|---|---|
| Config: two rules error, unused directives error, comment replaced | `eslint.config.js` diff; `npm run lint` clean |
| Every suppression reviewed (16 + new reports) | table below |
| planetSystems no-console directive removed | comment line deleted; lint clean |
| Planted slips | temp `Plant.tsx`: missing dep `n` -> exhaustive-deps error; hook in `if` -> rules-of-hooks error; stale disable -> "Unused eslint-disable directive" error; file deleted, lint clean again |
| Lint time | before ~4.9 s wall, after ~4.4 s (limit 15 s) |
| DOM tests unedited and green | full `npm test`: 311 files, 5071 passed, 2 skipped; no test file edited except the comment deletion |
| Gates | lint, typecheck, build, test all pass |

### Suppressions
Kept, `-- reason` added on the directive line: ScaleControl:74, usePanels:96, useShelfPanels:45, AstraeusShell:353,359,406,421,481, App:281 (definition/address reset key), App:534 (read once at mount), sceneHooks:30 (caller deps contract), sceneContentsHooks:93 (read at call time via refs). Each would change when an effect runs if its dependency were added, so none was added.
Removed: AstraeusScene:97-100 (four directives; rule reported nothing, so they were unused).
New reports once the rule was on, handled: App `groupLooks` useMemo [runtime] (suppressed, reset key); App host-attach effect missing `stateNow` (suppressed, adding it would re-attach the host); App dev-stats cleanup `controls.current` (suppressed, stable ref, cleanup must clear the current stats); `useShelf.ts` `cells` useMemo [blocks] (suppressed, reset key); `TimelineBar.tsx` `windows` wrapped in `useMemo(() => experience.windows ?? [], [experience.windows])` (behaviour-neutral: same value, only stable identity when windows is undefined; the memos below recompute less often, never differently).

### Deviations
`useShelf.ts` and `TimelineBar.tsx` are not in planned_writes; the new rule reported them, so they were edited (one comment line and one line).


## Drift Notes

For Design reconciliation (`Current Technical State`): lint now runs complexity, the two React hooks rules, the constants rule (draft 02) and unused-directive reporting.

Coordinator (orchestrate-g024-20261121): gates green (lint 4.4 s, typecheck, build; `npm test` 311 files, 5071 passed). Accepted: the `TimelineBar.tsx` memo (same values, stable identity when `windows` is absent) and the `useShelf.ts` reasoned suppression, outside the planned writes because the new rule reported them. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
