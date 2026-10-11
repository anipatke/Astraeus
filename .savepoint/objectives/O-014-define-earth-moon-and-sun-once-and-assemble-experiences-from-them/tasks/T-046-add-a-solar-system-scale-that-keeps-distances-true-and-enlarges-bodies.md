---
id: T-046
title: Add a solar-system scale that keeps distances true and enlarges bodies
objective: O-014
status: done
depends_on: [{task: T-042, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: scale
planned_reads: [src/core/scalePolicy.ts, src/core/body.ts, src/shell/scaleModel.ts, src/shell/ScaleControl.tsx, src/shell/AstraeusShell.tsx, tests/core.test.ts, tests/controls.test.ts, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md]
planned_writes: [src/core/scalePolicy.ts, src/shell/scaleModel.ts, src/shell/ScaleControl.tsx, tests/core.test.ts, tests/controls.test.ts]
---

# Add a solar-system scale that keeps distances true and enlarges bodies

## Outcome

A third scale policy, `solar-system`, maps distances exactly as True scale does and enlarges each body's radius by a factor declared per body (with a default), so a Sun-centred scene can show Earth as more than a pixel without moving anything. The policy id union is open, `mapRadius` takes the body id, and the shell's scale choices come from a list the application supplies rather than a constant pair. Apollo keeps True and Readable only and is unchanged.

## Astraeus Hypothesis

- **Capability tested:** that `ScalePolicy` is the right place for presentation-only enlargement and that a third policy needs no change to State, the views or the shell's rendering.
- **Contract reused:** `ScalePolicy` (contract unchanged in shape), `scalePolicyFor`, `SCALE_CHOICES`, `ScaleControl`.
- **Gap:** design A.4 item 5; O-011 success condition 5.
- **Generic change:** `SolarSystemScalePolicy` created with `{ exaggeration: Record<BodyId, number>; defaultExaggeration: number }`; `mapRadius(radiusKm, bodyId?)`; `ScaleId` open; `scaleChoicesFor(ids)` in the shell model. The wiring of an experience's declared choices and factors into `ExperienceDefinition` is the experiences Task's job, so this Task shares no file with the scene lane.
- **Evidence independent of any experience:** policy tests on fake bodies; shell tests with a three-choice list and with the existing two.

## User Check

None required in this Task; the belt and Perseids looks happen in the experiences Task.

## Done When

1. `createSolarSystemScale` positions equal True-scale positions exactly for any vector; `mapRadius(r, id)` equals `trueScale.mapRadius(r) × factor(id)`; without an id the default factor applies; a factor must be finite and at least 1; the policy's explanation text states the factor for the info panel (PROV-01).
2. `ScalePolicy.id` is a string type; `trueScale` and `readableScale` are byte-for-byte unchanged in behaviour (existing tests).
3. `scaleChoicesFor(["true-scale", "readable-scale"])` yields today's two choices and wording; adding `"solar-system"` yields a third with its explanation; an unknown id throws; `ScaleControl` renders N choices and keeps its keyboard and ARIA behaviour (existing `controls.test.ts` cases pass).
4. Gates pass; browser scripts pass in a fresh run directory (no visual change expected; record it).

## Context Files

`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (C.7 "True vs readable scale", E step 4), `src/core/scalePolicy.ts`, `src/core/body.ts`, `src/shell/scaleModel.ts`, `src/shell/ScaleControl.tsx`, `src/shell/AstraeusShell.tsx`, `tests/core.test.ts`, `tests/controls.test.ts`.

## Design References

Design: Architecture (scale policies); Interfaces and Data Flow (`ScalePolicy`, `scalePolicyFor`). Design document C.7, E step 4; O-011 Reference Capability Decision 4.

## Guardrails

ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-05, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm the core Task's definitions expose radii by id; REPLAN REQUIRED if not.
2. Open the id type; add `bodyId` to `mapRadius`; write the solar-system policy as a factory.
3. Make the shell choices a function of ids; keep the two existing choices' wording.
4. Tests; gates; browser scripts.

## Boundaries

No `ExperienceDefinition`, scene or experience change (the experiences Task wires `scaleChoices` and factors). No change to how True and Readable behave.

## Technical Verification

Focused tests during iteration; handoff runs the gates and every browser script. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

### Per-criterion outcomes

1. Met. `createSolarSystemScale({exaggeration, defaultExaggeration})` in `src/core/scalePolicy.ts`: `mapPosition` delegates to `trueScale` (tests assert array equality on several vectors, NaN still throws TypeError); `mapRadius(r, id)` = `trueScale.mapRadius(r) * factor(id)` asserted with `toBe`; no id uses the default; factors (default and each declared) must be finite and >= 1 (RangeError, checked for 0.5, 0, -2, NaN, Infinity); `explanation` lists each `id xN` and the default (PROV-01). Tests: `tests/core.test.ts` "solar-system scale policy".
2. Met. `ScalePolicy.id` is `string`; `mapRadius(radiusKm, bodyId?)`; True/Readable code path unchanged (only the `id` field type on the abstract base); all pre-existing tests pass unmodified; a test shows both ignore the id.
3. Met. `scaleChoicesFor(ids)` in `src/shell/scaleModel.ts`: the two existing ids `toEqual(SCALE_CHOICES)` (same wording); `"solar-system"` adds label "Solar system" with explanation; unknown id throws RangeError. `ScaleControl` takes optional `choices` (default `SCALE_CHOICES`); static-render tests show 3 buttons with correct `aria-pressed` and the ARIA label built from the labels, and 2 buttons with the unchanged "What do True and Readable scale mean?" label. Keyboard/ARIA behaviour of existing buttons untouched; browser-shell.mjs (which clicks that label and exercises the scale buttons) passes. Tests: `tests/controls.test.ts` "scale choices".
4. Met with one pre-existing failure. Gates and browser runs below; no visual change expected and none observed in assertions.

### Commands run

- `npm run typecheck`: pass.
- `npm run build`: pass (existing chunk-size warning only).
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 23 files, 426 tests pass (junit.xml is untracked/ignored output).
- Browser: vite started by hand on :5199, `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`, fresh run directory `docs/evidence/o014-t046-20261011T210310/` (logs `<script>.log`, screenshots per script subdirectory), 2026-10-11 ~21:03 local. Results: browser-shell, browser-spike02, browser-spike03, browser-anchor-labels, browser-synthetic, browser-synthetic-ring, browser-showers all exit 0 with `"errors": []`. browser-synthetic-belt exit 1: `AssertionError desktop/True: Earth's path is drawn (16)`, the known pre-existing failure (Issue I-020, owned by T-045); same assertion as before, nothing new failed and no console errors recorded before it. Vite stopped afterwards.

### Files

Read: the Task, router, AGENTS.md/CLAUDE.md, savepoint-task skill, all Context Files except the architecture doc beyond C.7 (read C.7 only). Extra reads (logged): none of files outside Context Files; `grep` over `src/` and `tests/` for `mapRadius`/`SCALE_CHOICES`/`scalePolicyFor`/`ScaleId` users, and a grep of `tools/validate/` for the env vars and the scale-help label, to find callers and how the scripts take output paths.
Changed: `src/core/scalePolicy.ts`, `src/shell/scaleModel.ts`, `src/shell/ScaleControl.tsx`, `src/shell/AstraeusShell.tsx`, `tests/core.test.ts`, `tests/controls.test.ts`, this Task, `.savepoint/router.md`. New: `docs/evidence/o014-t046-20261011T210310/`.

### Limitations

- Nothing yet consumes `solar-system`: no experience declares it or the factors (T-047). The policy and choices are verified by unit and static-render tests only; no browser run exercises a third button.
- `ScaleControl` interaction with three choices is not exercised in a real browser.
- Shell wording for the Solar system choice is generic; the per-factor text is on the policy's `explanation`, which T-047 must surface in the info panel.


## Drift Notes

Record architecture deltas here; the integration Task reconciles them into Design.

- `AstraeusShell` gained an optional `scaleChoices` prop (not in planned_writes; needed so the application supplies the list). Passes straight to `ScaleControl`. Architecture-relevant for Design: shell props. Reconciling Task: T-050.
- `scalePolicyFor(id, supplied?)` gained an optional list of application-supplied policies, because the solar-system policy needs per-experience factors that the shell model cannot know. T-047 passes the policy it builds. Reconciling Task: T-050.
- `ScaleId` is now plain `string`; `SolarSystemScalePolicy` also exposes `factorFor(bodyId?)` and `explanation`. Reconciling Task: T-050.

## Completion

- 2026-10-11T10:30Z — Task Check C-017 CLEAR (orchestrator checker session `o014-orchestrator-check-20261011`). `status: done` set by the orchestrator under the owner's explicit delegation in chat on 2026-10-11 ("I authorise you to move tasks to Done once you have checked and are satisfied"), actor {role: owner-delegate, session: o014-orchestrator-check-20261011}.
