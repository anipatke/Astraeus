---
id: C-066
scope: {kind: task, id: T-087}
result: CLEAR
checked_by: {role: checker, session: o020-orchestrator-20261018}
executed_session: t087-builder-20261018
checked_at: '2026-10-18T02:40:00Z'
reviewed:
  base_commit: 9c505a0
  head_commit: b3c9e5e
  files:
    - src/shell/storyPanels.ts
    - src/shell/Sources.tsx
    - src/shell/StoryPanelView.tsx
    - src/shell/style.css
    - tests/storyPanels.test.ts
    - tools/validate/driver.mjs
    - tools/validate/browser-story-panels.mjs
  dependencies: ['T-059 (C-038 CLEAR)', 'T-081 (C-065 CLEAR)']
issues: []
supersedes: null
---

# C-066: T-087 Task Check (Quick)

## Scope Lock

1. T-087 Done When 1-4 (owner_validation not required; the owner reads the copy under T-088 and T-089).
2. Lane o0xx-t087 at b3c9e5e, branched from 9c505a0 and merged into o018-o019 with no conflicts; main between 9c505a0 and the merge changed only `.savepoint` records and evidence, so the lane's full run covers the merged code.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 `details` field | Optional, string or list, validated like `body` with named errors; absent gives `[]`. | `src/shell/storyPanels.ts`, `tests/storyPanels.test.ts` |
| DW2 one folded section | `Sources` gains `details`: one `<details>`, closed by default, "The details and sources" with details above sources, else "Sources · n"; same markup in the side panel and the phone sheet; `ProvenanceBadge` unchanged on the same part (STYLE-07). | diff, unit tests, browser-story-panels desktop and phone |
| DW3 no story wording | Shell code names no story; a synthetic story in tests proves details with no code (ARCH-03). | tests |
| DW4 checks through the driver | New driver readouts; browser-story-panels asserts one section, closed, stable label, open and fold; earlier scenarios unchanged. Checker on the merged head: `npx tsc --noEmit` 0, driver guard pass, `npx vitest run` 972 passed 1 skipped. Builder: `npm run build` 0; `run-full.sh docs/evidence/o015-t087-full-20261017T225429Z` all steps exit 0. | summaries |

## Issues Pass

DW1-DW4 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. No shipped panel carries `details` yet, so the "The details and sources" label and text are proved by unit tests only; T-088 puts real details in and its browser check should assert them.

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
