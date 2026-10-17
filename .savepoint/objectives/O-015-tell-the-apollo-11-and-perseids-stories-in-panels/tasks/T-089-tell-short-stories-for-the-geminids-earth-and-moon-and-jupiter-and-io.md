---
id: T-089
title: Tell short stories for the Geminids, Earth and Moon, and Jupiter and Io
objective: O-015
status: planned
depends_on: [{task: T-087, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Tell short stories for the Geminids, Earth and Moon, and Jupiter and Io

## Outcome

The three demos without a story get about three panels each, in the same warm, plain voice, opening at moments inside each demo's own timeline, with figures and sources in the folded details.

## User Check

Play each of the three demos on the preview: panels open at their moments and read easily; markers reopen them.

## Done When

1. Owner, 2026-10-18: "Extend stories to all demos" (O-015 Decision 6). Same voice and rules as the Apollo/Perseids rewrite (two to four short sentences, at most one everyday number, figures and caveats in `details`, sources with every fact, a badge per panel).
2. Proposed moments (the owner may change them at the read):
   - Geminids (`shower-geminids`): the "rock comet" 3200 Phaethon as the parent; why the Geminids are the year's best shower; Earth's December crossing at the peak.
   - Earth–Moon (`earth-moon`, window January to March 2025): why we always see the same face; the Moon drifting slowly away; the total lunar eclipse of 14 March 2025, inside the window.
   - Jupiter–Io (`jupiter-io`, window 1 to 15 January 2000): the most volcanic place in the solar system; the tug-of-war with Jupiter that heats it; its rhythm with Europa and Ganymede.
3. Panel files are story data, not engine (owner rule): one file per story under `data/stories/<story>/`; wiring follows the existing generic panel path with no story wording in engine or shell (ARCH-01). If an experience cannot take panels without code, the generic path is extended once, for all, with a test.
4. Every panel time falls inside its demo's timeline and validates (named error otherwise); the Geminids panels respect the shower's narrowed `span=activity` view as the Perseids do (C-041 observation).
5. Facts come from published sources named in each panel's sources (NASA, IAU, JPL and similar); nothing is invented. The eclipse time is checked against a published table.
6. Browser story-panels check covers each new story (panels open in order, badge and sources present, details folded); full run passes.
7. Owner validation: the owner reads all three on the preview; wording changes from that read are made here.

## Context Files

`data/stories/perseids/panels.json` (the pattern), `src/experiences/showers/showerDefinition.ts`, `src/experiences/earth-moon/earthMoonExplorer.ts`, `src/experiences/jupiter-io/jupiterIo.ts`, `src/experiences/apollo11/apollo11.ts` (how a story is wired), `src/shell/storyPanels.ts`, `tools/validate/browser-story-panels.mjs`, `.savepoint/objectives/O-015-tell-the-apollo-11-and-perseids-stories-in-panels/Objective.md`.

## Design References

O-015 Decisions 4-8; Design.md story layer.

## Guardrails

PROV-01, ARCH-01, ARCH-03, TEST-01, TEST-03.

## Implementation Plan

1. Research and write the nine panels with sources.
2. Wire each story through the generic path; browser check; owner read.

## Boundaries

Three new stories; no new data sources for the scene itself.

## Technical Verification

Configured gates, browser-story-panels, full run, owner read. Evaluated under `agent-skills/references/check-method.md`.
