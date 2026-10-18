---
id: C-069
scope: {kind: task, id: T-088}
result: CLEAR
checked_by: {role: checker, session: o020-orchestrator-20261018}
executed_session: t088-builder-20261018
checked_at: '2026-10-18T04:30:00Z'
reviewed:
  base_commit: 92559e4
  head_commit: 837cc3a
  files:
    - data/stories/apollo11/panels.json
    - data/stories/perseids/panels.json
    - src/app/StoryMarkers.ts, src/app/App.tsx, src/app/AstraeusScene.tsx
    - tests/storyPanels.test.ts, tests/storyMarkers.test.ts (new), tests/fixtures/storyPanelBodiesBeforeT088.json (new)
    - tools/validate/driver.mjs, tools/validate/browser-story-panels.mjs
    - .savepoint/issues/I-031-stacked-story-markers-on-one-object-hide-each-other.md (history entry)
  dependencies: ['T-087 (C-066 CLEAR)']
issues: ['I-031']
supersedes: null
---

# C-069: T-088 Task Check (Quick)

## Scope Lock

1. T-088 Done When 1-7; 7 is the owner's read.
2. Lane o015-t088 at 837cc3a merged into o018-o019 after T-086 and T-089 without conflict.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1-2 voice and rules | Ten panels rewritten; checker read all ten: warm, plain, no jargon; the owner-approved sample is panel 1 nearly verbatim. A test enforces two to four sentences, at most one number, no acronyms, decimals, coordinates or timestamps, plain titles. | panel files, `tests/storyPanels.test.ts` |
| DW3 no fact lost | Frozen copy of the old bodies (`tests/fixtures/storyPanelBodiesBeforeT088.json`); a test checks every old figure and sentence, or its more precise form, is in `details`; badges unchanged; earlier sources kept, three added for new facts. | tests |
| DW4 comparisons | Each has its working in `details` (e.g. 10.84 km/s x 3,600 = about 39,000 km an hour; lift-off minus touchdown 21 h 36 min). | panel files |
| DW5 I-031 | One scene marker per object (`groupStoryMarkers`); a press opens the panel the clock has reached, or the next one when one of its panels is open, wrapping (`panelForMarkerPress`, no object names); Apollo panels now all reachable from the scene; tests with a synthetic three-panel object; browser-story-panels presses one Eagle marker through all three of its panels. | `src/app/StoryMarkers.ts`, `tests/storyMarkers.test.ts` |
| DW6 checks | browser-story-panels asserts details hidden while folded and matching the settings file once opened (C-066 observation). Builder: full run `docs/evidence/o015-t088-full-20261017T235957Z` 24/24 (an earlier run's sky step failed at load about 30 and passed alone and in the final run; kept as history). Checker on the merged head (T-086 + T-087 + T-088 + T-089): `npx tsc --noEmit` 0, driver guard pass, `npx vitest run` 1008 passed 1 skipped, `npm run build` 0, `run-full.sh docs/evidence/o020-o015-head-20261018T001413Z` 24/24 exit 0, error-lines 0, 789 s. | summaries |

## Issues Pass

DW1-DW6 Proven. I-031's Proof (both panels reachable, no stacked markers) is met by this repair; I-031 is left open for the O-015 Full Objective Check to verify. No materiality actions are required.

## Observations (non-blocking)

1. Three plain sentences carry no new source line ("people have landed on another world", "a huge lump of ice and rock", "sheds a little more dust"); each is general knowledge covered by the panel's existing sources in substance. The O-015 Full Check may ask for explicit lines.
2. Design.md story-panel notes should record that scene markers group by object (O-015 integration).

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
