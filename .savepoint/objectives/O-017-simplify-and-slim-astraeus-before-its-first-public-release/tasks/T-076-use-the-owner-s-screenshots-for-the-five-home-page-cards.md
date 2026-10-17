---
id: T-076
title: Use the owner's screenshots for the five home page cards
objective: O-017
status: done
depends_on: [{task: T-074, requires: clear}]
owner_validation: {required: true, scope: [owner's screenshots on the five home page cards], accepted_by: {role: owner, session: o017-orchestrator-check-20261017}}
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

## Technical Evidence

Executed by the orchestrator session (o017-orchestrator-check-20261017), 2026-10-17, commit 8dc81e9.

1. The owner's five screenshots (originals in `docs/evidence/o017-cards-v2-20261017/owner-*.png`) cropped to 16:10 with ffmpeg, no upscaling, JPEG quality 3: Apollo 11 837x523, Perseids 863x539, Geminids 956x598, Earth and Moon 1200x750, Jupiter and Io 1200x750; copied over the five `site/` card pictures. A contact sheet (`cards-sheet.jpg`) was checked by eye for the right picture on each card (two pastes had first been swapped and were redone from their exact files).
2. Each card's `alt` text rewritten to describe its new picture.
3. `npx vitest run tests/homePage.test.ts` 3 passed; public build exit 0; `public-build-assets.mjs` exit 0; `load-budget.mjs`: index 530,611 B raw (limit 600,000), 479,624 gzip (limit 530,000). Lite against the public preview of 8dc81e9 (port 5490): every real experience and both site pages pass at both sizes; the made-up experiences fail only the page-title assertion because the public build leaves them out by design (they open Apollo), as expected. Evidence `docs/evidence/o017-t076-lite-*`.

## Owner Completion — 2026-10-17

Owner looked at the new cards on the public preview (http://localhost:5490/) and said "cards look good, mark T-076 done".

Owner Task-check waiver: Task T-076; reason: pictures and alt text only, owner-supplied screenshots accepted by the owner's own look, gates above; actor: owner (instruction relayed by the orchestrator, who also executed the Task, so no independent Task Check ran); time 2026-10-17. Not technical CLEAR; the Full Objective Check still covers T-076.
