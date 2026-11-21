---
id: O-093
title: Units, constants and tooling that catch slips
status: done
depends_on: [O-082, O-084]
release: G-024
priority: low
rank: 12
last_check: C-202
lanes: [{key: layout, title: Moves out of core and src}, {key: units, title: Constants and fit seconds}, {key: frames, title: Render vectors}, {key: accuracy, title: Earth and Moon tolerances}, {key: tooling, title: Hooks rules and Prettier setup}, {key: docs, title: Changelog}, {key: format, title: One reformat commit}]
---

# O-093: Units, constants and tooling that catch slips

## Outcome

Unit and frame slips at the riskiest internal boundaries stop compiling, physical constants live in one place, Earth and Moon accuracy tests are as tight as the real error allows, presentation code and scaffolding leave the science core and engine source, and a formatter plus the React hooks lint rules keep diffs reviewable.

## Why

AH-21 (all three): ms, s, days, km and AU are all `number`; `AU_KM` and J2000 are defined three times; three orbital-element schemas. AH-46: Earth/Moon tests allow 100 km while the real error is about 6 km; three TT−UTC models. AH-22: about 880 lines of UI vocabulary in `core/`, `src/synthetic` ships in the engine. AH-44: one active lint rule, no formatter, long lines. All three auditors advise against a full dimensional-type framework.

## Success Conditions

- Light nominal types at 2–3 boundaries (UTC ms vs TDB seconds; EQJ vs render vectors), proved by a deliberate slip that fails typecheck.
- One constants module; no duplicate definitions.
- Earth/Moon tolerances tightened to about the measured error with margin; the Moon model's limits noted in provenance.
- UI modules out of `core/`; scaffolding out of engine `src/`; pack size measured.
- A formatter applied in one mechanical commit; React hooks rules on with existing suppressions reviewed.

## Architectural Considerations

ARCH-02, ARCH-04, STYLE rules. Horizons fits at 1 km unchanged.

## Boundaries

**In scope:**
- The named types, constants, tolerances, moves and tooling.

**Out of scope:**
- A dimensional-analysis framework; storing planets as EQJ km (next data regeneration).

## Decisions

- Owner 2026-11-21 (G-024 decision 7): design confirmed by "work through this list of objectives one by one. Orchestrate each objective to completion"; formatter "Prettier, one commit", kept separate from logic changes; owner 2026-11-22 "carry on". Step checks waived on every Task.
- Planner (orchestrate-g024-20261121), settled from evidence (details and file:line in each Task; flagged to the owner, defaults taken):
  1. The Prettier reformat runs last, over the whole code scope, as one commit of Prettier output only (T-381). If O-085 is still parked then, its branch takes the written format-pass recipe (merge main before the format commit, run `npm run format` on the branch and commit that alone, then merge the format commit preferring the branch's formatted lines); T-380 writes the recipe into `docs/agents/build.md`.
  2. A proof run (T-379) precedes the reformat: text-reading checks are made layout-proof first.
  3. Prettier options: defaults plus `printWidth: 120` (the line length the audits measured).
  4. The ~880 lines of UI vocabulary (eight modules) move from `core/` to a new `src/presentation/` layer (Success Condition "UI modules out of core"), guarded by a new `presentationLayer.test.ts`; ARCH-04 is amended at Design reconciliation.
  5. Constants live in one `core/constants.ts`, guarded by a lint rule, not a text scan; values unchanged.
  6. Two typed boundaries: fit seconds branded by scale (TT planet fits, TDB moon chunks) apart from UTC milliseconds; render vectors tagged apart from EQJ.
  7. Earth/Moon tolerances set to 2× the measured maximum on the existing fixtures, with a 69 s time-slip case that must fail; the Moon model's limit noted in provenance.
  8. React hooks: `rules-of-hooks` and `exhaustive-deps` as errors plus unused-directive errors; the React Compiler rules stay off (O-089 reshapes `App.tsx`); all 16 suppressions reviewed.
- Planner, numbering: O-085's T-361..T-369 and C-199 sit on its parked branch, so main's `task-ids.yml` was brought to 369 first (T-370..T-381); Checks here continue from C-201, Issues from I-192.
- Owner "carry on" (2026-11-22). O-093 set done by the orchestrating session after Full Objective Check C-202 CLEAR (G-024 decision 7, "Orchestrate each objective to completion"; "CLEAR: fast-forward merge to main and push"). Numbering note: C-201 went to the O-085 re-check, so this Check is C-202.
