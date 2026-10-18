---
id: I-038
title: Design.md not reconciled for O-015 story-panel drift notes
type: drift
status: open
source:
  kind: check
  check: C-071
  actor: {role: checker, session: o015-full-check-20261018}
  at: '2026-10-18T01:45:00Z'
tasks: [T-059, T-062, T-087, T-088, T-089]
checks: [C-071]
history:
  - at: '2026-10-18T01:45:00Z'
    actor: {role: checker, session: o015-full-check-20261018}
    kind: observed
    note: Found by the O-015 Full Objective Check against the AGENTS.md project rule "Deferred Design reconciliation". Five O-015 Task drift notes were deferred to "the O-015 integration", but O-015 owns no integration Task and Design.md still describes the pre-rescope story layer.
    check: C-071
  - at: '2026-10-18T02:20:00Z'
    actor: {role: planner, session: o020-orchestrator-20261018}
    kind: repair_attempted
    note: 'Design.md story-panel paragraph rewritten: details field and the folded Sources section (item 2); markers group by object with groupStoryMarkers/panelForMarkerPress and the clock time (item 1); every demo has a story, Earth–Moon due to go with T-093 (item 3); the eager glob bundling every story panels file on shower pages recorded as kept, with the reason (item 4, non-architectural); load-budget sentence gains the same-stem chunk rule (item 5); open-items paragraph no longer lists I-031 as open, states the owner read and accepted the panels on 2026-10-18 (item 6). Recheck pending.'
---

# I-038: Design.md not reconciled for O-015 story-panel drift notes

## Summary

The AGENTS.md project rule "Deferred Design reconciliation" says an integration Task accounts for each deferred architecture note, as reflected in Design.md or explicitly non-architectural with a reason, before the Full Objective Check. O-015's Tasks deferred their notes to "the O-015 integration Task". T-059 suggested it might be T-063, but T-063 belongs to O-016, and O-015 owns no integration Task. Design.md's story-panel paragraph (`.savepoint/Design.md` line 151, "Story panels (O-015: T-059, T-061, T-062)") and the open-items paragraph (line 193) still describe the story layer as it was on 2026-10-16. Several of their statements are now false.

## Evidence

Deferred notes not reflected (checked against the code on HEAD 88c5d02):

1. **Scene markers group by object** (T-088 drift note, C-069 observation 2). Design line 151 says "two panels on one object stack at one point and only the top is clickable (I-031, open)". `src/app/StoryMarkers.ts` now has `groupStoryMarkers` and `panelForMarkerPress`: one marker per object, carrying `data-panel-ids`. A press opens the panel the clock has reached, or the next one when one of its panels is already open. The marker update now receives the clock time.
2. **The `details` field and the folded section** (O-015 Decision 5, T-087). Line 151 lists the panel fields without `details`. `parseStoryPanels` accepts an optional `details` list, validated like `body`, which defaults to `[]`. `Sources` (`src/shell/Sources.tsx`) is the one folded section, labelled "The details and sources" when there are details and "Sources · n" otherwise.
3. **Every demo has a story** (T-089 drift note). Line 151 says "Geminids carries none". `data/showers/geminids.json` now names `data/stories/geminids/panels.json`. Earth–Moon and Jupiter–Io read their panels in `earthMoonExplorer.ts` and `jupiterIo.ts` through `parseStoryPanels`. The Earth–Moon story is due to be removed by O-024 T-093.
4. **Shower pages load every story's panels up front** (T-089 drift note, C-068 observation 2). `showerDefinition.ts:30` uses `import.meta.glob(..., { eager: true })` over `data/stories/*/panels.json`.
5. **Load budget admits several same-stem chunks only when imported** (T-089 drift note). This is in `tools/validate/load-budget.mjs` (lines 45-123, `proveSameStemChunks`). Design's load-budget sentence on line 153 still says only "one raw and one gzip limit per page set".
6. Line 193 lists I-031 as open and says "O-011, O-012, O-015 and O-016 await their Full Objective Checks; the owner's visual judgement of the panels ... is pending". The owner has since read the panels (Owner Completion sections of T-059 to T-089).

## Proof Needed

1. Design.md's story-panel notes reflect items 1 to 5. Item 4 may instead be recorded as explicitly non-architectural, with a reason.
2. The open-items line no longer lists I-031 as open or describes stacked markers, and it states the owner's panel read.
3. A later Check (or the O-015 recheck) confirms each item against the code.
