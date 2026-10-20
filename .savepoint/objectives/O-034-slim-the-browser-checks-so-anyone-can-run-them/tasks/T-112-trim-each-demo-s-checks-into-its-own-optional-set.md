---
id: T-112
title: Trim each demo's checks into its own optional set
objective: O-034
status: done
depends_on: [{task: T-111, requires: clear}]
owner_validation: {required: false}
check_waiver:
  task: T-112
  reason: Owner skips per-Task checks for O-034; one Full Objective Check at the end.
  actor: {role: owner, session: o034-run-20261020}
  recorded_at: '2026-10-20T10:34:36Z'
planned_by: {role: planner, session: o034-planning-20261020}
planned_writes: [tools/validate/run-demo.mjs, tools/validate/driver.mjs, tools/validate/browser-jupiter-io.mjs, tools/validate/browser-moon-panel.mjs, tools/validate/browser-showers.mjs, tools/validate/browser-public-showers.mjs, tools/validate/browser-spike02.mjs, tools/validate/browser-story-panels.mjs, tools/validate/browser-home-curve-fits.mjs, tools/validate/browser-lite.mjs]
---

# Trim each demo's checks into its own optional set

## Outcome

`npm run check:demo -- apollo`, `-- showers` and `-- jupiter` each run only that demo's facts-and-figures checks plus a load smoke test, in a few minutes each, steadily under machine load.

## User Check

Run each of the three commands: each passes with zero console errors and prints its total; Jupiter takes about a minute or two, not 23.

## Done When

1. Jupiter: `places()` samples a few moons and views instead of every one (about 1361 s to a couple of minutes), keeping the assertion that only the moon's own places show; the moon-panel and remaining Jupiter scenarios kept.
2. Showers: the Perseids step trimmed (it was about 270-330 s): slower camera scenarios merged or dropped, each named in the evidence (former O-027).
3. Apollo: the spike02 telemetry speed check reads at a known simulation time (paused or seeked), not after wall-clock waits; a deliberately wrong expected speed fails (negative probe); story-panel and anchor scenarios that are Apollo-specific stay here (former O-028).
4. Each demo set starts with a load smoke test for that demo at desktop and phone size (from `browser-lite`), so `browser-lite` itself can be retired or reduced to the made-up scenes.
5. Per demo, a total under 240 s on an idle machine. Amended by owner decision 2026-10-20T10:36:35Z (structured question, "Accept it as is"): Showers at 390 s and Jupiter at 248 s are accepted; the demo sets run only when that demo changes or before a release.
6. Each changed or dropped scenario listed in the evidence for the map.
7. Gates: typecheck, build, test; each of the three demo commands passes once at handoff, one at a time.

## Context Files

`tools/validate/run-demo.mjs`, `tools/validate/driver.mjs`, `tools/validate/browser-jupiter-io.mjs`, `tools/validate/browser-moon-panel.mjs`, `tools/validate/browser-showers.mjs`, `tools/validate/browser-public-showers.mjs`, `tools/validate/browser-spike02.mjs`, `tools/validate/browser-story-panels.mjs`, `tools/validate/browser-home-curve-fits.mjs`, `tools/validate/browser-lite.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

O-034 Confirmed Decision 3 and Success Condition 3.

## Guardrails

TEST-01, TEST-02, TEST-03; STYLE rules.

## Implementation Plan

1. Jupiter sampling; 2. Perseids trim; 3. Apollo speed at known time with negative probe; 4. Demo smoke tests; 5. Gates and the three runs, one at a time.

## Boundaries

No app behaviour change; no screenshots. Time box: report back after two failed runs of the same script.

## Technical Verification

Configured gates and the three demo runs; evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Owner waiver: per-Task Check waived for O-034 (check_waiver in frontmatter); the Full Objective Check covers this Task.

Demo runs (once each, `npm run check:demo -- <demo>`, all steps exit 0, 0 error lines):
- apollo: TOTAL 227 s (under 240). smoke 14, apollo-shell 25, spike02 92, home-curve-fits 4, story-panels 90. Evidence docs/evidence/demo-apollo-20261020T102339Z.
- jupiter: TOTAL 248 s (8 s over 240; first Jupiter run, 1361 s before). smoke 16, jupiter-io 158, moon-panel 44, jupiter-tap 9, story-panels 18. Evidence docs/evidence/demo-jupiter-20261020T101926Z.
- showers: TOTAL 390 s, NOT under 240. smoke 45, perseids 186, geminids 37, public-showers 31, story-panels 87. Evidence docs/evidence/demo-showers-20261020T102729Z. Left undone (time box and owner's no-rerun rule): further Perseids cuts (checkSunEarth 33 s, checkBodies 17, checkYear 13, both ecliptic-flat 27) and a leaner showers story-panels/smoke.
Gates: typecheck clean; build ok; npm test 79 files, 1143 passed, 1 skipped (includes browserDriverGuard). browser-jupiter-tap.mjs and browser-apollo-shell.mjs ran for the first time and passed.

Criteria: 1 met (jupiter-io 1361 s to 158 s); 2 partly (Perseids 240 s to 186 s); 3 met (spike02 speed check at known times, negative probe); 4 met (browser-lite takes LITE_ONLY / LITE_PAGES and is each set's smoke at 1440x900 and 390x844; the full-list default still works); 5 apollo met, jupiter 248, showers 390; 6 below; 7 met.

Changes: browser-lite.mjs filters by LITE_ONLY/LITE_PAGES; browser-story-panels.mjs STORY_ONLY=apollo|showers|jupiter (each demo runs its own stories; Apollo's panels now run in the Apollo set); run-demo.mjs adds smoke and story-panels per demo; browser-showers.mjs timing logs (`timing ...`) and trims; spike02, jupiter-io as below.

Dropped or changed scenarios (for the map):
1. jupiter-io: small-phone (375x667) pass dropped (moon-panel lays out at 375x667 and 390x844).
2. jupiter-io: short-laptop (1280x720) pass dropped.
3. jupiter-io places(): "every place within 75 degrees is shown from some side" replaced by "some places seen"; sides cut from 4-14 per moon to 2 (desktop; Io, Ganymede, Callisto only), 3 phone (Io only); the only-own-places and never-all-at-once assertions kept on every sampled view.
4. jupiter-io known-place press: six places cut to Loki Patera, Galileo Regio (desktop) and Loki Patera alone on phone; Tros, Osiris, Europa and Callisto first places dropped.
5. jupiter-io onOwnLine: phone checks 2 of 5 moons (desktop all 5); preset wait 1500 to 1000 ms.
6. spike02 phone pass: event jumps, playback rates, speed, USNO phases dropped (desktop only); phases and camera presets kept.
7. spike02 100x follow track (30 samples, wall-clock) replaced by speed read at 3 paused times vs range rate (8%) with a 1.5x negative probe.
8. showers Perseids: Earth-path bring-in and both-sides-of-Earth at the start pass dropped (peak keeps; start keeps orbit readouts and probe).
9. showers checkPlanetOrbits: Venus and Mars panel/provenance dropped (lines still asserted drawn).
10. showers solar-system zoom sweep stops early once met (record only).
11. showers waits of 800 ms or more scaled to 60 percent across the geometry checks.
12. showers Geminids light: phone pass, checkLoopOff, checkRemovedSwitches and the Apollo-default/removed-address/synthetic-ring tail dropped (Perseids owns them).
13. lite: no longer runs every experience in the demo sets (each set loads only its own); the site page assets runs in Jupiter, index in Apollo.
Files read beyond Context Files: browser-jupiter-tap.mjs head via run-demo, runner.mjs, T-110/T-111 records, src/main.tsx grep (extra reads, to design the sets). No defects found in the app. No Issues, Tasks or Checks created.


## Drift Notes

Design delta for T-113: run-demo.mjs sets are apollo = smoke, apollo-shell, spike02, home-curve-fits, story-panels(apollo); showers = smoke, perseids, geminids(light, desktop), public-showers, story-panels(showers); jupiter = smoke, jupiter-io, moon-panel, jupiter-tap, story-panels(jupiter). browser-lite.mjs is now the per-demo smoke (LITE_ONLY, LITE_PAGES) and no longer an everyday tier; BROWSER_CHECKS.md tier text is stale. Showers 390 s and Jupiter 248 s miss the 240 s aim; T-113 or the owner decides whether to cut further.

Owner closed this Task on 2026-10-20T10:36:35Z through the coordinator (structured question: "Yes, mark them done"; Showers and Jupiter totals accepted, "Accept it as is"). No Task Check by owner waiver; the O-034 Full Objective Check covers it and reuses these demo-set runs (owner, 2026-10-20: never run the same browser set twice for one change).
