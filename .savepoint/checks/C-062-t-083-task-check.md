---
id: C-062
scope: {kind: task, id: T-083}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t083-builder-20261018
checked_at: '2026-10-18T04:10:00Z'
reviewed:
  base_commit: 44d7967
  head_commit: 44d7967
  files:
    - tools/validate/driver.mjs (new), tools/validate/driver-guard.mjs (+ .d.mts, new)
    - tools/validate/*.mjs and tools/validate/on-request/*.mjs (23 scripts moved onto the driver)
    - tools/validate/shellScale.mjs (folded into the driver, deleted)
    - tests/browserDriverGuard.test.ts (new)
    - docs/BROWSER_CHECKS.md, AGENTS.md (project rule line)
  dependencies: ['T-079 (C-060)', 'T-080 (C-061)']
issues: []
supersedes: null
---

# C-062: T-083 Task Check (Quick)

## Scope Lock

T-083 Done When 1–6: one shared driver; every script interacts with the interface only through it; a guard that fails on direct interaction; no scenario lost; the rename probe; AGENTS.md rule; gates and the full run. Uncommitted work on `o018-o019` at 44d7967.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW2 driver | `tools/validate/driver.mjs`: actions and readouts by accessible name, role, `data-*` hooks or `data-testid`; the few unnamed controls in one `HOOK` table; logical ids for cameras, toggles and sliders. No app change. | file |
| DW3 every script, guard | Checker: `node tools/validate/driver-guard.mjs` exit 0 ("every script uses the driver"); checker grep for `getByRole`, `getByText`, `getByLabel` across `tools/validate/` and `on-request/` outside the driver: none. Guard also runs in the unit suite (`tests/browserDriverGuard.test.ts`). | guard output |
| DW4 no scenario lost, rename probe | Mapping in `docs/BROWSER_CHECKS.md` and the Task (two dead branches for a camera select that no longer exists removed; one band-click point now measured at click time). Rename probe: renaming "Developer mode" broke `browser-shell`; one line in the driver fixed it with no script edit; restored (`git diff --stat -- src` empty on checker's read). | Task evidence, git |
| DW5 rule | AGENTS.md "Browser regression maintenance" gains the driver line; BROWSER_CHECKS.md section "The interface driver". | diff |
| DW6 gates, full run | Checker: `npx tsc --noEmit` 0; `npx vitest run` 58 files, 943 passed, 1 skipped. Builder full run `docs/evidence/o020-t083-full-20261017T071132Z/`: 20 steps exit 0, zero error lines, 525 s (pictures differ from the O-017 baseline by design). | summary |

## Issues Pass

Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. I-035's new `browser-orbit-look.mjs` and `browser-orbit-motion.mjs` must move onto the driver when that lane merges (toggles and sliders into the driver's `TOGGLES`/`SLIDERS` tables); the guard will enforce it.

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
