---
id: T-088
title: Rewrite the Apollo 11 and Perseids panels in warm, plain words
objective: O-015
status: planned
depends_on: [{task: T-087, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Rewrite the Apollo 11 and Perseids panels in warm, plain words

## Outcome

Apollo 11's seven panels and the Perseids' three read like a good museum label: short, friendly, no jargon or stat lists. Every exact figure and honesty note moves, unchanged, into the folded details.

## User Check

Play Apollo 11 and the Perseids on the preview and read each panel as it opens; nothing should need a science background. Open the details on one panel: the exact figures and sources are all there.

## Done When

1. Owner, 2026-10-18: "Stories need to be plainsplained ... we want people to engage with it, not be turned off by stats and numbers". Voice (O-015 Decision 4), as approved in the owner's sample: "Leaving Earth behind. The rocket's last stage fires one final time and flings the crew out of Earth's orbit. They're now moving about 40,000 km an hour, fast enough to coast all the way to the Moon. Three days of coasting start here."
2. Each `body` is two to four short sentences, at most one everyday number or comparison, no acronyms (S-IVB, GET, UTC, AU, ZHR, IAU), no decimals or coordinates. Titles are plain and inviting.
3. Every figure, time and caveat removed from `body` appears in the panel's `details` with its wording intact or more precise (PROV-01); sources unchanged unless a new fact adds one. Badges unchanged. A test asserts the removed figures are present in `details` (no fact lost).
4. Any comparison added (for example "London to Sydney in 25 minutes") is computed from the panel's own figures and the working shown in `details`.
5. I-031: the powered-descent and touchdown panels no longer put two scene markers on top of each other (for example powered descent names no scene object, or markers for one object merge into one that lists both); every panel stays reachable from the scene and the timeline.
6. Browser story-panels check passes with the new text (it asserts structure, not wording); full run passes.
7. Owner validation: the owner reads both stories on the preview; wording changes from that read are made in this Task.

## Context Files

`data/stories/apollo11/panels.json`, `data/stories/perseids/panels.json`, `.savepoint/issues/I-031-stacked-story-markers-on-one-object-hide-each-other.md` (the overlapping markers), `src/shell/storyPanels.ts`, `tools/validate/browser-story-panels.mjs`, `docs/APOLLO11_SOURCES.md`, `.savepoint/objectives/O-015-tell-the-apollo-11-and-perseids-stories-in-panels/Objective.md`.

## Design References

O-015 Decisions 4-8; the Idea's principle: reliable where data exists, plausible where it doesn't, explicit about the difference.

## Guardrails

PROV-01, ARCH-01, TEST-01, TEST-03.

## Implementation Plan

1. Rewrite, moving figures to `details`; the no-fact-lost test.
2. I-031 marker fix; browser check; owner read.

## Boundaries

Copy for Apollo 11 and Perseids and the I-031 marker fix; no new panels.

## Technical Verification

Configured gates, browser-story-panels, full run, owner read. Evaluated under `agent-skills/references/check-method.md`.
