---
id: T-215
title: Say which moons have pictures
objective: O-050
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-215, reason: 'Owner said "orchestrate O50"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.', actor: {role: owner, session: o050-run-20261101}, recorded_at: '2026-10-31T21:16:38Z'}
planned_by: {role: planner, session: probe-switch-20261101}
---

# Say which moons have pictures

## Outcome

The docs say which moons the picture pack has pictures for, and that every other listed moon (Uranus's five named) draws flat-coloured with the pack loaded; a test keeps the list true (I-127).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `packages/astraeus-data/README.md` and the engine README (where `addBody` / `listedMoons` are described) carry the list and the sentence about the others, Miranda, Ariel, Umbriel, Titania and Oberon named.
- A test reads the picture pack's registered names and fails if either README's list differs.

## Context Files

`packages/astraeus-data/README.md`, `packages/astraeus-data/src/index.ts`, `packages/astraeus-data/src/pictures.ts`, `packages/astraeus/README.md`.

## Design References

None.

## Guardrails

PROV-02, TEST-01, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Read the registered picture names; write both README passages; add the test.

## Boundaries

Docs and one test only; no new pictures.

## Technical Verification

Focused test; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

- Added `packages/astraeus/tests/pictureList.test.ts` (3 tests): reads `PICTURES` keys from `astraeus-data` (minus milky-way, venus-8k, pluto) and `listedMoons()`; fails unless both READMEs contain `Moons with pictures: <derived list>.` and `Every other listed moon, among them Uranus's Miranda, Ariel, Umbriel, Titania and Oberon, draws flat-coloured`; also asserts the five are listed moons with no picture.
- Docs: passage added to `packages/astraeus-data/README.md` and to the `addBody` row of `packages/astraeus/README.md`. Moons: Io, Europa, Ganymede, Callisto, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton, Charon (Pluto's map noted separately in the data README).
- Focused: `npx vitest run packages/astraeus/tests/pictureList.test.ts` 3 passed.
- Gates: lint pass; typecheck pass; build pass; test 165 files, 2048 passed, 1 skipped.
- Not run: browser (not needed); fail-on-drift not exercised by editing a README, true by construction of the assertions.

## Drift Notes

None expected.
