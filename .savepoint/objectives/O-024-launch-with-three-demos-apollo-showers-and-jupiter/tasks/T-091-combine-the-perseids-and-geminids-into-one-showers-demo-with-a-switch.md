---
id: T-091
title: Combine the Perseids and Geminids into one Showers demo with a switch
objective: O-024
status: in_progress
stage: audit
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Combine the Perseids and Geminids into one Showers demo with a switch

## Outcome

One Showers demo replaces the two shower demos. A switch in the top bar changes between the Perseids and the Geminids; each shower keeps its own data, story panels, settings and look, and only the chosen shower's data is downloaded.

## User Check

Open the Showers demo: the Perseids show; switch to the Geminids and back; each shower's stream, comet or asteroid, timeline glow and stories appear; a copied view link reopens the same shower.

## Done When

1. Owner, 2026-10-18 (O-024 Decision 1): "we combine the Perseids and Geminis into a single demo and the user can switch between them. This will be the showers demo". One experience id (`showers`) with a shower choice; the Perseids are the default.
2. The switch is a control in the top bar using the shared control styles (T-081), on desktop and in the phone drawer; accessible name stated. Switching changes shower without a page reload where practical (state, camera reset to the shower's start view, story panels and markers swapped); if a reload is simpler and fast, it is recorded as a Drift Note.
3. Only the chosen shower's data is fetched; the public load budget's page list becomes one Showers entry checked for each shower; no limit raised.
4. The chosen shower is in the view link (`?experience=showers&shower=geminids` or similar) and round-trips. The old `shower-perseids` and `shower-geminids` addresses are removed without redirects (O-024 Decision 4); the public build's address list and the five-address mentions in docs are updated.
5. Shower content stays data (owner rule): `data/showers/*.json` and `data/stories/<shower>/` unchanged except for wiring; no shower names in engine or shell (ARCH-01).
6. Browser checks through the shared driver: the showers scripts run each shower through the switch (both directions, desktop and phone); every prior scenario mapped (TEST-03); full run passes.
7. Owner validation: the owner switches between the showers.

## Context Files

`src/experiences/showers/showerDefinition.ts`, `src/experiences/showers/showerEntry.ts`, `src/experiences/showers/showerSettings.ts`, `data/showers/perseids.json`, `data/showers/geminids.json`, `src/shell/TopBar.tsx`, `src/app/viewLink.ts`, `tools/validate/load-budget.mjs`, `tools/validate/driver.mjs`, `tools/validate/browser-showers.mjs`, `tools/validate/run-full.sh`, `.savepoint/objectives/O-024-launch-with-three-demos-apollo-showers-and-jupiter/Objective.md`.

## Design References

Design.md experiences and shell; O-024 Decisions.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. One `showers` experience with a shower choice; the switch control; view link.
2. Load budget, addresses, scripts; full run.

## Boundaries

Combining and switching only; the move to the 2019-2020 year is the next Task.

## Technical Verification

Configured gates, lite, the showers scripts, full run. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (executor, 2026-10-18)

Design. One experience id `showers`; `src/main.tsx` lists every `data/showers/*.json` as a choice (label and a new optional `order` field; lowest opens by default: Perseids 1, Geminids 2) and `src/experiences/showers/showerChoice.ts` picks the shower and builds the switch. The switch is a generic `ExperienceDefinition.switcher` (`src/shell/SwitchControl.tsx`, rendered first in the top bar, hence also in the phone drawer, shared control styles; group named "Shower", a pressed button per shower). Choosing a shower reloads the page at `?experience=showers&shower=<name>` (the `view` and `t` of the old address are dropped so the shower opens on its own start view; other parameters kept). Address form: `?experience=showers` (Perseids) and `?experience=showers&shower=geminids`; the copied view link keeps `shower`. Old `shower-perseids` / `shower-geminids` addresses open the default experience (asserted).

Done When: 1 yes. 2 yes, desktop and phone drawer; reload chosen (simpler, matches the existing `alternates` mechanism; see Drift Notes). 3 only the chosen shower's orbit file is requested (checkSwitch asserts it; `showerChoice` has settings of both, 5 and 7 KB, already in the entry before); load budget page list is Showers (Perseids) and Showers (`&shower=geminids`), no limit raised (11,190,000 / 13,790,000 raw kept; measured 10,708,176 and 13,192,649). 4 yes; docs/README/home page (four cards) updated. 5 data unchanged except `order`. 6 `browser-showers` `checkSwitch` at both sizes, each shower (both directions), plus removed addresses and default/unknown shower; mapping row in docs/BROWSER_CHECKS.md. 7 owner validation pending.

Gates: `npx tsc --noEmit` clean; `npx vitest run` 65 files, 1016 passed (one earlier run showed a single failure that did not reproduce twice; it was during my first edit cycle, a name check on src that I then fixed); `npm run build` ok; driver guard ok; load budget on the public build ok. Full run: `docs/evidence/o024-t091-full-20261018T013907Z` (`bash tools/validate/run-full.sh`, DEV_PORT=5601 PUBLIC_PORT=5602), every step exit=0 with error-lines=0, total 802 s. Targeted run before it: `browser-showers.mjs geminids` (light) exit 0.

Drift Notes: (1) switching reloads the page (same as the Developer "Data" alternates), recorded per Done When 2. (2) The picture step compared with `docs/evidence/o017-baseline-20261017`; apollo and earth-moon differ by 15-35% of pixels against that old baseline too, so the contact sheet drift is not from this Task (the picture baseline predates later top-bar work), owner to judge the sheet. (3) `capture-experience-pictures` still takes a perseids and a geminids picture (two query strings) for the shower; the home page uses one card with the Perseids picture; T-093 reworks the home page. (4) Dev-server `?import` url requests are ignored by checkSwitch, they are module wrappers, not downloads.
