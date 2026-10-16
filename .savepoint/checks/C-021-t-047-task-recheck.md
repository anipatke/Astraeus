---
id: C-021
scope: {kind: task, id: T-047}
result: CLEAR
checked_by: {role: checker, session: o014-orchestrator-check-20261012}
executed_session: o014-t047-sonnet-executor-repair-20261012
checked_at: '2026-10-12T09:25:00Z'
reviewed:
  base_commit: 2d8b2dd
  head_commit: 2d8b2dd
  files:
    - tests/nameCheck.test.ts
    - tests/experiences.test.ts
    - tests/compositions.test.ts
    - tests/scenePlacement.ts
    - src/app/App.tsx
    - src/app/AstraeusScene.tsx
    - src/app/CameraController.tsx
    - src/app/experienceDefinition.ts
    - src/app/metricReadouts.ts
    - src/assets/catalogue.ts
    - src/experiences/apollo11/spacecraftMetrics.ts
    - src/synthetic/syntheticDefinition.ts
    - tools/validate/browser-synthetic.mjs
    - tools/validate/browser-synthetic-belt.mjs
  dependencies: []
issues: []
supersedes: C-020
---

# C-021: T-047 Task Re-check (Quick)

Same checker session as C-020; the repair was made by the separate executor sub-session.

## Closure Map

| Prior Issue | Result |
|-------------|--------|
| I-021 | Closed (verified) |

## Admission Ledger (frozen C-020 lock: DW5 and I-021 Proof Needed 1–4; regressions only elsewhere)

| Item | Frozen cell | Result | Evidence |
|------|-------------|--------|----------|
| 1. Mechanised name check with reasoned allowlist that proves itself | I-021 PN1 / DW5 | Pass | `tests/nameCheck.test.ts` (5 cases) proves itself on a planted tree and on a stale or unreasoned allowlist entry. Checker's own planted offences: `"moon"` in a new `src/app/` file → test fails naming it; `"Perseids"` in a new `src/shell/` file → test fails naming it; both removed, test passes again. Checker grep finds no body literal or body constant in `src/app/` or `src/shell/`. |
| 2. Defaults from the experience; Earth-free composition test | I-021 PN2 | Pass | `initialObjectIdOf` (`src/app/experienceDefinition.ts:243`) returns the scene centre if listed, else the first shell item; the camera starts on `sceneCenter`; `sceneCenterOf` has no Earth fallback; `tests/experiences.test.ts` mounts Moon-alone and Sun-alone compositions |
| 3. Remaining body names removed or allowlisted with reasons; core allowlist recorded for T-050 | I-021 PN3 | Pass | Spacecraft metrics moved to `src/experiences/apollo11/spacecraftMetrics.ts`; the Earth/Moon hierarchy helper became a test fixture; `usesEarthMoon` removed; allowlist = `src/assets/compositions.ts` plus nine `src/core/` providers, each with a reason; drift note names T-050 |
| 4. Gates and browser scripts | I-021 PN4 / DW7 regression | Pass | Checker: typecheck exit 0, build exit 0, 28 files / 535 tests passed, `git diff --check` clean. Executor fresh run `docs/evidence/o014-t047-repair-20261012-2012/`: all ten browser logs end `"errors": []`. `browser-synthetic*.mjs` now assert `data-bodies` in place of the retired `data-earth-moon` flag (mapped, same scenario) |

DW1–DW4 and DW6 are unaffected by the repair except for the moved metrics file and the retired canvas flag, both covered by the passing scripts above. Public-build validation from C-020 stands: the repair changes no import of a texture.

## Prior Owner Decisions

None on T-047 yet.

## Observations (non-blocking)

1. Timestamp correction: C-020 and I-021's `observed` entry carry `2026-10-12T10:10:00Z`, which was later than the machine clock (09:21Z when the executor appended its entry). The correct time is about 09:15Z. C-020 is immutable, so the error is recorded here rather than edited.
2. `DebugOverlay` and `sceneMetrics` keep Earth/Moon wording in labels and field names but no ids or constants (developer readout).
3. The Apollo pixel comparison was not re-run after the repair; Spike 02/03 scripts pass unchanged, and the owner's look covers it.

## Owner Validation Still Needed

`owner_validation.required: true`: the owner's look at Earth–Moon Explorer, Apollo and Perseids. Task stays at `stage: audit` until accepted.

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
- [x] STYLE-10 **Small diffs**
