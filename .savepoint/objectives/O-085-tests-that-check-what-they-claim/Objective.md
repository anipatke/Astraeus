---
id: O-085
title: Tests that check what they claim
status: in_progress
depends_on: []
release: G-024
priority: high
rank: 4
last_check: C-199
lanes: [{key: timing, title: Timing warnings}, {key: numbers, title: Rate tolerance}, {key: timeout, title: One timeout}, {key: views, title: Views playing state}, {key: assertions, title: Empty checks}, {key: shaders, title: Patched shaders}, {key: atmosphere, title: Atmosphere log depth}, {key: handedness, title: Render handedness}, {key: layers, title: Core whitelist}]
---

# O-085: Tests that check what they claim

## Outcome

A red test means a real problem and a green test means its title is true: environment-dependent timing and exact-float assertions no longer give false reds, empty assertions check something, the patched shaders and the atmosphere's depth code are exercised, and the core layer guard is a whitelist.

## Why

AH-35 (Gemini F-07, Codex F10, Claude F-22): a "<100 ms" fill assertion in a test titled "an indication only" fails under coverage on some runs; exact float equality fails 3 of 34 cases on Node 22; heavy data tests time out at 5 s under load. AH-34: `viewsDom` queries "Play"/"Pause" while the button says "Play playback", so it compares `undefined` with `undefined`; other unasserted steps. AH-12/AH-32: the atmosphere's JSX shader has no log-depth chunks and the guard regex cannot see JSX; no test calls `onBeforeCompile`. AH-20: `tests/layerRule.test.ts` forbids a list that omits `api`, `shelf` and `types`.

## Success Conditions

- No wall-clock assertion in the default suites (a warning at most); numeric series compared at a stated tolerance with structure and IDs still exact; heavy data tests use the CI timeout locally. `test:full` green on Node 22 and 24.
- `viewsDom` fails when a view switch changes playing state (checked by a deliberate break); the other empty assertions fixed or removed.
- One test per patched material runs `onBeforeCompile` against real three.js shader source and fails when a chunk replacement does not land; the log-depth guard covers JSX materials; the atmosphere carries log-depth code.
- A render-handedness determinant check.
- Core may import only core (whitelist), proved by a planted violation.
- Owner look at atmospheres on localhost:5490 before the Full Objective Check.

## Architectural Considerations

TEST guardrails; the owner's no-screenshot browser rule stands. Shader work touches `src/app/`.

## Boundaries

**In scope:**
- The named tests and guards, the atmosphere shader fix.

**Out of scope:**
- Removing duplicated gate work (O-086); retiring text pins (O-088); disposal tests (O-092).

## Decisions

- Owner 2026-11-21 (G-024 decision 7): design confirmed by "work through this list of objectives one by one. Orchestrate each objective to completion"; step checks waived on every Task. Overnight: the owner's atmosphere look is needed, so O-085 finishes everything else and is parked unmerged until the look.
- Planner (orchestrate-g024-20261121), settled from evidence (details and file:line in each Task):
  1. The three wall-clock assertions (`showersMeasured`, `frameStats`, `pacedAdvance`) become warnings or boundedness checks; no timing allowlist.
  2. One test timeout, 30 s, locally and on CI (`vitest.config.ts`); a hang takes 30 s to fail instead of 5 s.
  3. The shower rate series in `rebuildComparison` is compared at one named relative tolerance set from the measured Node 22 differences; times, ids, units and labels stay exact; the fixture is never re-recorded.
  4. "Other empty assertions" means the Vitest cases (`loadingCoverChain` and the five lone `not.toThrow()` cases); browser-script steps without assertions are left to O-086.
  5. The core layer whitelist reads real imports with `typescript6`'s `preProcessFile`, not a regex over text.
  6. The atmosphere log-depth fix and the guard extended to JSX materials are one Task (T-367), the only one needing the owner's look; nothing depends on it.
  7. Earth is the only atmosphere, so the look covers Earth on the planets page and Apollo 11.
  8. The shader tests compile against three's own `ShaderLib.points` source for the two `onBeforeCompile` sites.
  9. Handedness: reproduce Gemini's probe first (it may already be caught at `sceneTransforms.test.ts`); check the two hand-copied axis changes against `eqjToRenderVector`.
- Planner, task numbering: O-084's T-354..T-360 were allocated on its parked branch, so main's `task-ids.yml` was brought to 360 before these Tasks were created (T-361..T-369); later Checks and Issues on this branch continue after C-198 and I-191.

## Parked (2026-11-22, orchestrate-g024-20261121)

Eight of nine Tasks are done; T-367 (Earth's glow on the log-depth buffer) is built and tested and waits only for the owner's look on localhost:5490 (G-024 decision 7, "Park it, move to the next"). Preliminary Full Objective Check C-199 is CLEAR technically. Left unmerged on branch `o085-tests-that-check-what-they-claim`. After the look: accept T-367 against C-199 and set it done, close O-085, fast-forward merge to main and push.
