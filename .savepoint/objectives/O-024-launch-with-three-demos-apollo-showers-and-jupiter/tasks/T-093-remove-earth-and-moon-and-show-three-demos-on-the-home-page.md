---
id: T-093
title: Remove Earth and Moon and show three demos on the home page
objective: O-024
status: done
depends_on: [{task: T-091, requires: clear}, {task: T-092, requires: clear}]
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: o020-orchestrator-20261018}
check_waiver:
    task: T-093
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-19T10:16:15Z"
---

# Remove Earth and Moon and show three demos on the home page

## Outcome

The Earth–Moon demo is gone; the home page shelf, the catalogue links, page titles and docs show three demos (Apollo 11, Showers, Jupiter); the public addresses are locked for the three; a new picture baseline is taken.

## User Check

Open the home page: three demo cards that open Apollo 11, Showers and Jupiter; nothing links to Earth–Moon or the old shower addresses.

## Done When

1. Owner, 2026-10-18 (O-024 Decisions 2 and 4): "Drop earth and moon, it's covered by Apollo"; its experience, its story file (`data/stories/earth-moon/`) and its checks are removed; old addresses are not redirected. Engine parts it used stay.
2. Home page shelf (three cards, owner's screenshots for Apollo and the showers; the Jupiter card picture is a placeholder until O-025), page titles, catalogue links, README and docs updated; no dangling links (a check scans the built pages).
3. The public addresses (moved here from T-082): `app.html` (Apollo 11), the Showers address from T-091 and the Jupiter address are listed in one place and checked by the full run.
4. Browser scripts that used Earth–Moon move to Apollo 11 or another demo where the scenario still needs a two-scale experience (for example the scale toggle and ⓘ, the orbit-look check); each mapped (TEST-03).
5. New picture baseline for the three demos (owner decision needed to replace the O-017 baseline, asked at the owner look); contact sheet.
6. Full run passes; owner validation: the owner opens the home page and each demo.

## Context Files

`src/experiences/earth-moon/earthMoonExplorer.ts`, `src/main.tsx`, `index.html`, `data/stories/earth-moon/panels.json`, `tools/validate/browser-earth-moon.mjs`, `tools/validate/browser-orbit-look.mjs`, `tools/validate/capture-experience-pictures.mjs`, `tools/validate/run-full.sh`, `tools/validate/load-budget.mjs`, `docs/BROWSER_CHECKS.md`, `README.md`, `.savepoint/objectives/O-024-launch-with-three-demos-apollo-showers-and-jupiter/Objective.md`.

## Design References

O-024; G-005 Launch Definition of Done.

## Guardrails

ARCH-01, TEST-01, TEST-03, PROV-01.

## Implementation Plan

1. Remove Earth–Moon; move scenarios.
2. Home page and links; address list; baseline; full run.

## Boundaries

The line-up, links and baseline; the Jupiter demo's content is O-025.

## Technical Verification

Configured gates, lite, full run, contact sheet. Evaluated under `agent-skills/references/check-method.md`.

## Planning Note — 2026-10-18

Owner: "can we bin the whole screenshots thing" (chose "All of it"). Done When 5 (new picture baseline and contact sheet) is withdrawn; T-102 removes the picture machinery. When T-093 starts, its Done When is revised accordingly.

## Evidence — 2026-10-19 (executor)

**Done When 5 revised on start** (per the Planning Note and T-102): withdrawn, no new picture baseline or contact sheet. Replaced by: the three demos are covered by readout-based checks only.

**Per criterion**
1. Earth–Moon removed: `src/experiences/earth-moon/`, `data/stories/earth-moon/`, `tools/validate/browser-earth-moon.mjs`, `site/earth-moon.jpg`, its entry in `src/main.tsx`, its run-full step and its page-size limit. Engine parts (composition, catalogue, textures) stay. No redirect. Met.
2. Home page has three cards (Apollo 11, Showers, Jupiter–Io); share text, intro and README (table, URLs, size table, folder note) updated. `tools/validate/public-addresses.mjs danglingLinks` scans the built pages for retired addresses; run in run-full against the public build (`public-addresses | exit=0`) and in `tests/homePage.test.ts`. Met. The Jupiter card picture is still the existing one (placeholder until O-025).
3. Addresses listed in one place, `tools/validate/public-addresses.mjs` (`DEMO_ADDRESSES`), read by `browser-lite.mjs` and `tests/homePage.test.ts`; run-full checks them. Met.
4. Scenarios moved (TEST-03), mapped in `docs/BROWSER_CHECKS.md` "Earth–Moon removed": scale toggle/ⓘ and orbit-look to `?experience=synthetic` (Earth, Moon, both scales; dev server only), orbit-motion to Jupiter–Io plus synthetic, embedded/sky/sun/marker/story-panels drop the entry. Unit tests that used the Explorer as a fixture now use `syntheticDefinition`/`apollo11Definition`; the Earth–Moon readout and illumination tests kept. Met. Limitation: the scale scenarios run on a dev-only made-up experience, since no shipped demo offers Readable.
5. Withdrawn (see above).
6. Full run passed (below). Owner validation of the home page and each demo: pending.

**Commands run**
- `npm run typecheck` ok; `npm run build` ok; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 74 files, 1097 passed, 1 skipped (run before the addresses module was added); then `npx vitest run tests/homePage.test.ts tests/browserDriverGuard.test.ts`: 8 passed.
- `tools/validate/run-full.sh docs/evidence/o024-t093-full-20261019T094037Z` (20:40–20:53 local, 741 s): all 22 steps `exit=0`, `error-lines=0` (summary.txt in that folder). Includes lite, shell, orbit-look, orbit-motion, embedded, story-panels, sky, public-addresses.

**Files read:** the Context Files listed, plus extra reads (reason: find every user of Earth–Moon): `src/shell/scaleModel.ts`, `src/synthetic/syntheticDefinition.ts`, the other browser scripts/tests that named `earth-moon` (`browser-shell/-sky/-embedded/-lite/-orbit-motion/-spike03`, `on-request/*`, `tests/experiences/experienceDefinition/storyStoriesAllDemos/homePage/publicBuild`), `src/assets/compositions.ts`.
**Files changed:** the above plus `index.html`, `README.md`, `docs/BROWSER_CHECKS.md`, `tools/validate/load-budget.mjs`, `tools/validate/run-full.sh`, new `tools/validate/public-addresses.mjs`.

**Limitations:** README whole-build size row not re-measured (limit still holds); `data/stories/earth-moon` text lives only in git history; historical docs under `docs/` and old evidence still mention Earth–Moon on purpose.
