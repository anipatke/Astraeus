---
id: T-269
objective: O-059
title: Let any app put its own picker in the top bar
status: done
depends_on: [{task: T-268, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o059-planning-20261106}
check_waiver: {task: T-269, reason: 'Owner said "orchestrate O-59" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o059-run-20261106}, recorded_at: '2026-11-06T16:35:40Z'}
---

# Let any app put its own picker in the top bar

## Outcome

An app can offer a choice in the viewer's top bar and phone drawer and hear what the visitor picks; the viewer does nothing else, and the host decides what happens.

## User Check

Read the README entry; a test picks an option and the host hears it.

## Done When

The same ability works on `mount` and React (API-02), keeps two viewers apart (API-03), and the private `switcher` address behaviour is no longer the only way; a host can keep the clock time across a choice using public calls; lock, README and CHANGELOG are updated. Apply `docs/agents/verification.md` for evidence.

## Context Files

`docs/architecture/o059-public-forms.md`, `packages/astraeus/src/shell/SwitchControl.tsx`, `packages/astraeus/src/shell/TopBar.tsx`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/listSwitch.ts`, `packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-02, API-03, API-04, API-06, ARCH-01, ARCH-03, TEST-01.

## Implementation Plan

1. Add the public picker setting and its signal. 2. Draw it through the existing control. 3. Run the shared lifecycle suite on both paths. 4. Lock, README, CHANGELOG.

## Boundaries

The signal only: no navigation built into the engine. The site moves onto it in a later step.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built (not at audit: held at stage test, see the size stop below).

- Public: `Scene.setPicker`, `Scene.picker`, `ViewerHandle.pick/setPick/onPick`, `AstraeusScene` `onPick`, types `PickerInput`, `PickerOptionInput`, `PickChange`, error `bad-picker`. Internal: `ExperienceDefinition.picker` (wins over `switcher`), `ViewerControl.picker`, `ViewerPort.pickNow/watchPick/picked`, `ExperienceSwitch.choose`, `pickerSwitch` in listSwitch.ts, `viewerPicker.ts`, `planPicker.ts`.
- Tests: `tests/picker.test.ts` (planner, checks alone, control, link), `tests/lifecycle.test.ts` (both paths: pick/setPick/onPick, throwing listener, unmount, no-picker, clock kept across a choice), `tests/twoViewers.test.ts` (API-03, setPick row, press heard by A only).
- Gates: lint, typecheck, build, check:engine-alone, check:pack pass. `npm test`: 2753 pass, 1 fail: `apiReference.test.ts` page raw 151,008 > 150,000 (gzip 33,365 of 40,000). STOPPED per instruction (no trimming docs, no limit change); owner decides.

## Drift Notes

Record architecture deltas; deferred Design notes go to the final step of this Objective, named here as the integration Task.

### Follow-up (owner 2026-11-07)

- `load-budget.mjs`: `api/index.html` rawLimit 200_000 (gzip stays 40_000); docs not trimmed. API page 151,008 B raw, 33,365 B gzip.
- Direct test of the `onPick` prop on `AstraeusScene` (`tests/lifecycle.test.ts`, "AstraeusScene's onPick prop"): a press is heard, the pressed option is not, nothing moves, a rebuild presses the new scene's value.
- Gates: lint, typecheck, build pass; `npm test` 2755 passed, 2 skipped (213 files, no failures); check:engine-alone and check:pack pass (engine unpacked 9.58 of 9.8 MB, packed 7.26 of 8.0; astraeus-data 123 of 130 files).
