---
id: O-060
title: Make the checks faster with the same protection
status: in_progress
depends_on: [O-057]
release: G-016
priority: high
---

# O-060: Make the checks faster with the same protection

## Outcome

A Full Objective Check takes much less time with the same protection: `npm run check:browser` runs in about 230 s, the fast tests repeat less setup, every gate has a stated time limit that warns when it is passed, and no test or assertion is removed.

## Why

Owner, 2026-11-07: "before we close off 0.8.0, can we optimise the tests?", then "Faster, same protection". Measured on an idle machine at 6aad8e6a: lint 3.5 s, typecheck 5.6 s, build 2.3 s, `npm test` 42 s, `test:full` 72 s, `check:engine-alone` 25 s, `check:pack` 14 s, `check:node-consumer` 5 s, `check:react-consumer` 9 s, `check:browser` 353 s. The browser check grew from 44 s (2026-10-22) to 351 s (2026-10-31) with no signal; the `synthetic-journey` view at two sizes is 172 s of it, much of that fixed waits.

## Success Conditions

- **Browser check.** `npm run check:browser` runs in about 230 s on an idle machine (baseline 353 s), every step passing. The first target of 180 s was changed by the owner; see Owner Decisions.
- **Same protection.** Every browser assertion at the baseline commit still exists, proved by a test against a committed list, and `npm test` runs at least as many tests as the baseline (3,282 passed, 2 skipped). No test, assertion or tolerance is removed or loosened; coverage is not lower.
- **Fast tests.** Setup repeated across test files is shared, with `npm test` aiming for about 30 s (baseline 42 s). The aim is not a pass mark: the measured result is reported either way.
- **Time limits.** Every gate has a stated limit in one place. A run over its limit shows a warning in its summary and never fails on time alone. A test proves the warning appears.
- **Proof.** Before and after timings for every gate, taken on an idle machine, are recorded, and the docs state the new times.

## Owner Decisions (2026-11-07)

- Faster with the same protection: no test removed (owner "Faster, same protection").
- A check over its time limit warns in its summary and does not fail (owner "Warn in the run summary").
- No owner look: nothing on screen changes.
- Design confirmed by the owner, 2026-11-07, session o060-planning-20261107.
- Browser target moved from 180 s to about 230 s (owner, 2026-11-07, during T-281, told 231 s was measured and the last 51 s is page loading): no further side-by-side running, because "side by side is machine depedent and i sometimes work on mutiple things at once. I will Accept".
- The two `synthetic-journey` sizes stay side by side (owner, 2026-11-07, "Keep the pair, about 231s", told in-turn running is about 285 s), still subject to T-281's three passing runs.

## Architectural Considerations

Browser scripts touch the interface only through `driver.mjs` (browser policy). A fixed wait may only be replaced by a wait on the condition it stood for, read from the scene's own readouts. "One browser job at a time" stays: side-by-side passes run inside the one job and only if they prove stable. Each Vitest file runs isolated, so sharing work across files needs a real shared step, not a module-level cache.

## Boundaries

**In scope:** browser scripts and runner, test setup and test tooling, gate time limits, docs, and the C-153 tidy-ups of `pastTheEntry` and the planted ring test.

**Out of scope:** removing or merging tests; changing what is tested; engine, public API or on-screen changes; publishing.
