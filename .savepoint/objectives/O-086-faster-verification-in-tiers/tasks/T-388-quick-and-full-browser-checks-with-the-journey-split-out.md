---
id: T-388
title: Quick and full browser checks, with the journey split out
objective: O-086
status: planned
depends_on: []
check_waiver: {task: T-388, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/src/entryChoice.ts, packages/astraeus-demo-showers/data/showers/perseids.json, packages/astraeus-demo-showers/data/showers/geminids.json, tools/gate-limits.mjs, docs/agents/browser-policy.md, packages/astraeus-site/tests/browserAssertions.test.ts]
planned_writes: [packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/browser-steps.d.mts, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus-site/tools/validate/runner.mjs, packages/astraeus-site/tools/validate/runner.d.mts, packages/astraeus-site/tools/validate/browser-smoke.mjs, packages/astraeus-site/tests/gateLimits.test.ts, tools/gate-limits.json, docs/BROWSER_CHECKS.md]
---

# Quick and full browser checks, with the journey split out

## Outcome

`npm run check:browser -- --tier quick` runs the quick tier of owner decision 1 (every page and view loads at desktop and phone size, the planets phone journey, the four packed examples, the shipped showers stream); `npm run check:browser` (or `-- --tier full`) runs everything. The made-up journey leaves the smoke step and becomes its own full-tier step, `synthetic-journey`, and duplicate shower loads are dropped (AH-29; Claude and Gemini value matrices: smoke SPLIT, smoke-public-showers SIMPLIFY).

## User Check

None visual.

## Done When

- The step list moves from `run-browser.mjs` to a new `browser-steps.mjs` that exports `STEPS` (each step gains `tier: "quick" | "full"`) and `selectSteps({ tier, steps })`; `run-browser.mjs` parses `--tier quick|full` (default `full`), `--step <name>` (repeatable; runs exactly the named steps whatever their tier, in list order) and `--list` (prints the selected step names and tiers, starts nothing, exits 0); an unknown tier or step exits 2 naming it.
- Tiers (planner decision 3): **quick** = `smoke`, `smoke-public-showers`, `planets-phone`, `hello-scene`, `hello-react`, `hello-planets`, `hello-sky`, and (until draft 08 moves them) `public-build-assets`, `public-addresses`; **full** adds `synthetic-journey`, `meteor-shower`, `views`, `look-out`, `catalogue`. The full tier runs every step.
- `browser-smoke.mjs`: `discoverViews` honours `ASTRAEUS_SKIP_VIEWS` (comma list of view ids left out) and `ASTRAEUS_SIZES` (comma list of `desktop`/`phone`; default both). The `smoke` step sets `ASTRAEUS_SKIP_VIEWS=synthetic-journey`; the new `synthetic-journey` step runs the same script with `ASTRAEUS_VIEWS=synthetic-journey`, keeping its two sizes side by side (O-060) and every check in `journeyChecks`, including the phone `nearSaturnChecks` sequence that caught I-185. No raise site or guard in the script changes (the assertion baseline test stays green untouched).
- Duplicate loads dropped: (a) the named view of the default shower (`showers-<name>` where `<name>` is the shower `?experience=showers` opens, chosen by the same lowest-`order` rule as `src/entryChoice.ts`; confirm which from the JSON files) is left out because `showers` loads the same file; derived from the data, not a hard-coded name; (b) `smoke-public-showers` runs at desktop size only (`ASTRAEUS_SIZES=desktop`), so it loads `showers` and the other named shower once each (6 loads become 2; both shipped stream files still load). Everything else in smoke (every page, Apollo idle, the Sun-centred probe, `components-page`) stays.
- `runner.mjs` `runSet` takes the tier: the summary's first line names it, the evidence folder is `docs/evidence/browser-<stamp>` for full and `browser-quick-<stamp>` for quick, and the total is compared with `browser.total` (full) or the new `browser.quickTotal` (quick); a `--step` run prints step lines and the total without a limit.
- `tools/gate-limits.json`: `browser.quickTotal` added; `synthetic-journey` step limit added; `smoke` and `smoke-public-showers` limits set from this Task's measured run (slowest × about 1.4, the O-060 rule). `browser.total` is not changed here (draft 12 sets it; build.md's table must still match).
- `gateLimits.test.ts`: reads the steps from `browser-steps.mjs` (import, not a source regex); adds cases that every step has a tier, that the quick tier holds `smoke`, `planets-phone` and the four `hello-*` steps (decision 1, mechanised), that `quickTotal` is above every quick step's limit, and that `selectSteps` rejects an unknown tier or step.
- `docs/BROWSER_CHECKS.md`: "Running it" names both tiers and `--step`/`--list`; "What it runs" splits the smoke bullet and adds `synthetic-journey`; the time table gains its row (the test checks every step has one).
- Browser runs (one browser job at a time; nothing else running): `npm run check:browser -- --tier quick` once and `npm run check:browser -- --step synthetic-journey` once, both green; evidence folders, step times and totals recorded. `--list` output for both tiers recorded.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tools/validate/run-browser.mjs` (whole)
- `packages/astraeus-site/tools/validate/runner.mjs` (whole)
- `packages/astraeus-site/tools/validate/browser-smoke.mjs` (`discoverViews` ~32–50, `load` ~342, the main block ~383–400)
- `packages/astraeus-site/src/entryChoice.ts` (`chooseShower`)
- `packages/astraeus-site/tests/gateLimits.test.ts` (whole)
- `tools/gate-limits.json`
- `docs/BROWSER_CHECKS.md` under `Running it`, `What it runs` and `Time limits (O-060 T-283)`
- `docs/agents/browser-policy.md` (read only)

## Design References

None beyond `docs/BROWSER_CHECKS.md`.

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-10, CODE-01.

## Implementation Plan

1. Move `STEPS` to `browser-steps.mjs` with tiers and `selectSteps`; add `.d.mts` like the other tools.
2. Argument parsing in `run-browser.mjs`; tier-aware total in `runner.mjs`.
3. The two env filters in `discoverViews` and the default-shower de-duplication.
4. Update `gate-limits.json`, `gateLimits.test.ts`, `BROWSER_CHECKS.md`.
5. Focused tests; then the two browser runs; set the provisional limits from them.
6. Gates.

## Boundaries

No change to what any check asserts, to `driver.mjs`, to the journeys or examples, or to `browser-policy.md`, `build.md` and `verification.md` (draft 12). No step leaves the full tier. Do not touch `public-build-assets`/`public-addresses` beyond tagging them quick (draft 08).

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts packages/astraeus-site/tests/browserAssertions.test.ts packages/astraeus-site/tests/browserExitPath.test.ts packages/astraeus-site/tests/browserDriverGuard.test.ts`; `node packages/astraeus-site/tools/validate/run-browser.mjs --list --tier quick`. Browser: the two runs above, sequenced after any other browser job (one at a time). Handoff: `quality_gates`.

## Technical Evidence

Done When -> evidence:
- browser-steps.mjs STEPS/selectSteps, flags --tier/--step/--list, exit 2 on unknown: gateLimits.test.ts new cases (green); `run-browser.mjs --list --tier quick` printed smoke, smoke-public-showers, planets-phone, hello-scene, hello-react, hello-planets, hello-sky, public-build-assets, public-addresses (all quick); `--list` (full) adds synthetic-journey (after smoke), meteor-shower, views, look-out, catalogue (full); `--tier x` exits 2 naming it.
- Tiers: same list/tests. synthetic-journey step and smoke skip filter: browser runs below.
- browser-smoke filters and de-duplication: default shower derived from JSON `order` (perseids; showers-perseids left out); quick smoke ran green, smoke-public-showers desktop only.
- runSet tier/folders/total: quick run summary starts `tier: quick`, folder browser-quick-*, total vs quickTotal; --step run folder browser-steps-*, "no limit".
- gate-limits.json: quickTotal 200; synthetic-journey 110; smoke 65 (46 x 1.4); smoke-public-showers 12 (5 x 1.4 -> 7, set 12 for small-step headroom); total unchanged 320.
- docs/BROWSER_CHECKS.md: Running it, What it runs, table row (docs test green).
- Browser runs (flock, one each): `check:browser -- --tier quick` green, docs/evidence/browser-quick-20261121T205040Z, total 142 s (limit 200): smoke 46, smoke-public-showers 5, planets-phone 12, hello-scene 17, hello-react 4, hello-planets 10, hello-sky 21 (WARNING over its 15 s limit, unchanged), public-build-assets 2, public-addresses 0. `-- --step synthetic-journey` green, docs/evidence/browser-steps-20261121T205441Z, 79 s (total 80 s).
- Gates: focused 4 test files green after updating browserExitPath.test.ts's one assertion (the pinned `runSet("browser", STEPS)` line). Full gates: build ok; test 5110 passed, 1 failed (not in my files, a rnd/seed test); lint prettier warnings and typecheck errors only in other builders' files (packagePacks.test.ts/check-packs.mjs, driver.mjs, astraeus tests).
Extra file edited outside planned_writes: packages/astraeus-site/tests/browserExitPath.test.ts (assertion on run-browser.mjs's last line updated for the new call).


## Drift Notes

None expected.

Coordinator (orchestrate-g024-20261121): its files pass lint (prettier) and its focused tests; quick tier 142 s green and journey step 79 s green (evidence cited). The remaining lint/typecheck/test failures were in other builders' in-flight files and are rechecked at the Full Check. The one `browserExitPath` assertion change is accepted (it pinned the old last line). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
