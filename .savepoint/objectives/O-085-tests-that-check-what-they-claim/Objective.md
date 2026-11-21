---
id: O-085
title: Tests that check what they claim
status: planned
depends_on: []
release: G-024
priority: high
rank: 4
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
