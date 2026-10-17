---
id: T-076
title: Use the owner's screenshots for the five home page cards
objective: O-017
status: planned
depends_on: [{task: T-074, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Use the owner's screenshots for the five home page cards

## Outcome

The five demo cards on the home page show the owner's own screenshots of the app (clean scenes without controls), cropped to the card shape at full quality.

## User Check

Open the home page: Apollo 11, the Perseids, the Geminids, Earth and Moon, and Jupiter and Io each show the owner's chosen picture.

## Done When

1. Owner, 2026-10-17: "we need some better screenshots, your work is top notch lets show it off", then one screenshot each for Jupiter and Io, Moon and Earth, Apollo 11, the Geminids and the Perseids. Each is cropped to 16:10 without upscaling or visible quality loss (O-017 Decision 7) and replaces `site/apollo-moon.jpg`, `site/perseids-gmn.jpg`, `site/geminids-gmn.jpg`, `site/earth-moon.jpg`, `site/jupiter-io.jpg`; the originals are kept in evidence.
2. Each card's `alt` text describes its new picture.
3. Gates: tests (`tests/homePage.test.ts`), public build, validator with budget, lite.
4. Owner validation: the owner looks at the home page.

## Context Files

`index.html`, `site/`, `docs/evidence/o017-cards-v2-20261017/`.

## Guardrails

PROV-02 (screenshots of our own renders of credited assets), TEST-01.

## Boundaries

Pictures and alt text only.

## Technical Verification

Tests, public build, validator, lite. Evaluated under `agent-skills/references/check-method.md`.
