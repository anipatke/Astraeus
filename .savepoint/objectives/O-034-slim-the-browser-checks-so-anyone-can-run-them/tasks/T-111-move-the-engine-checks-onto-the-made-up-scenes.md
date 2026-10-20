---
id: T-111
title: Move the engine checks onto the made-up scenes
objective: O-034
status: done
depends_on: [{task: T-110, requires: clear}]
owner_validation: {required: false}
check_waiver:
  task: T-111
  reason: Owner skips per-Task checks for O-034; one Full Objective Check at the end.
  actor: {role: owner, session: o034-run-20261020}
  recorded_at: '2026-10-20T08:49:54Z'
planned_by: {role: planner, session: o034-planning-20261020}
planned_writes: [src/synthetic/syntheticDefinition.ts, src/main.tsx, tools/validate/driver.mjs, tools/validate/run-engine.mjs, tools/validate/browser-engine-controls.mjs, tools/validate/browser-engine-shell.mjs, tools/validate/browser-tap-focus.mjs, tests/synthetic.test.ts]
---

# Move the engine checks onto the made-up scenes

## Outcome

Every generic engine and shell behaviour now checked inside a demo is asserted on the made-up scenes instead, in as few scripts as reads clearly, and the engine set runs in under 300 s with no demo opened.

## User Check

Run `npm run check:engine`: no step loads `?experience=` apollo, showers or jupiter-io (the summary names each scene used), it passes with zero console errors, and the total is under 300 s.

## Done When

1. These scenarios move from demo-hosted scripts to made-up scenes: controls (`browser-controls`), phone layout and sheets (`browser-phone`), anchor labels (`browser-anchor-labels`), tap, drag, pinch and hover (`browser-tap-focus`), scale menu (`browser-scale-menu`), view links (`browser-view-link`, generic part), orbit motion (`browser-orbit-motion`), embedded mode (`browser-embedded`), and the generic parts of `browser-spike03` and `browser-sky`. A scenario that only makes sense with a demo's data stays for the demo step, named in the evidence.
2. The made-up scenes gain only what those checks need (for example a second named, tappable body; a story panel; a feature or a sky setting), with made-up names, never a mission or dataset (ARCH-01). They stay out of the public build (T-068); a unit test covers each addition's definition (ARCH-03).
3. Merged scripts go through the driver only; new driver functions as needed; the guard test passes.
4. The engine list in the runner holds the moved scripts; old demo-hosted copies are deleted or reduced to their demo-only scenarios for the next step.
5. Each moved scenario is listed in the Task evidence (old script and case, new script and case) for the map.
6. Gates: typecheck, build, test; `npm run check:engine` passes once at handoff, total recorded.

## Context Files

`src/synthetic/syntheticDefinition.ts`, `src/synthetic/syntheticRingDefinition.ts`, `src/main.tsx`, `tools/validate/driver.mjs`, `tools/validate/browser-controls.mjs`, `tools/validate/browser-phone.mjs`, `tools/validate/browser-anchor-labels.mjs`, `tools/validate/browser-tap-focus.mjs`, `tools/validate/browser-scale-menu.mjs`, `tools/validate/browser-view-link.mjs`, `tools/validate/browser-orbit-motion.mjs`, `tools/validate/browser-embedded.mjs`, `tools/validate/browser-spike03.mjs`, `tools/validate/browser-sky.mjs`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-synthetic.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

Design: Experience plug-in boundary; Components/Codebase Map rows for `src/synthetic/` and `tools/validate/`. O-034 Confirmed Decision 2.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, TEST-01, TEST-03; STYLE rules.

## Implementation Plan

1. Inventory each listed script's scenarios: generic or demo-only.
2. Add the made-up objects the generic ones need, with unit tests.
3. Rewrite the generic scenarios onto the made-up scenes, merging scripts; new driver functions.
4. Update the engine list; trim or delete the old scripts.
5. Gates and one `check:engine` run.

## Boundaries

No app or engine behaviour change (a defect becomes an Issue); no demo data in the made-up scenes; no screenshots. Time box: report back if the run cannot get under 300 s without dropping a scenario.

## Technical Verification

Configured gates and one `check:engine` run; evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Owner waiver: per-Task Check waived for O-034 (check_waiver in frontmatter); the Full Objective Check covers this Task.

Made-up scene additions (src/synthetic/syntheticDefinition.ts, ARCH-01: invented names, no mission or dataset; dev server only, left out of the public build as before): twelve labelled anchors ("mark-1".."mark-12", every 40 minutes) on the survey marker, and two story panels ("marker-loop" tied to the marker, "marker-late" untied) parsed with `parseStoryPanels`. Unit test (ARCH-03): tests/syntheticStoryAnchors.test.ts (5 cases).

Criteria:
1. Met except as listed. Moved onto made-up scenes: controls, phone, anchor-labels, tap-focus, view-link, orbit-motion, embedded, sky, the generic part of shell and spike03; scale-menu needed no move (harness page, no demo) and joined the engine list. Demo-only scenarios left for T-112 are listed below.
2. Met. See additions above; no second tappable body was needed (earth, moon and the marker already are).
3. Met. All new/changed scripts use the driver only; one driver edit: `openCurrentEventInfo` takes `.first()` (the made-up scene shows an event row and a window row as current). `npm test` includes tests/browserDriverGuard.test.ts: passes.
4. Met. run-engine.mjs holds shell, synthetic, synthetic-ring, synthetic-listed, orbit-look, controls, phone, layout, embedded, anchor-labels, tap-focus, view-link, orbit-motion, scale-menu, sky, public-build-assets, public-addresses. browser-spike03.mjs deleted (git rm); browser-shell.mjs Apollo version kept as browser-apollo-shell.mjs for the Apollo set; run-demo.mjs apollo = lite, apollo-shell, spike02, home-curve-fits; jupiter = jupiter-io, moon-panel, jupiter-tap (new); showers unchanged. The "Apollo stays the default" tails in synthetic, synthetic-ring and synthetic-listed now compare against another made-up scene instead of opening Apollo. No engine script opens `?experience=` apollo, showers or jupiter-io, nor the bare default address (Apollo). The runner summary does not print the scene per step (User Check asks for it): not done, left for T-113 or a one-line runner change.
5. Met: the map below.
6. Gates: `npm run typecheck` clean; `npm run build` ok; `npm test` 79 files, 1143 passed, 1 skipped. `npm run check:engine` (cold, no env): all 17 steps exit 0, 0 error lines, TOTAL 398 s (servers and public build included), evidence docs/evidence/engine-20261020T091216Z. NOT under the 300 s target. Step times: shell 12, synthetic 21, ring 45, listed 31, orbit-look 34, controls 10, phone 47, layout 24, embedded 12, anchor-labels 16, tap-focus 44, view-link 23, orbit-motion 13, scale-menu 1, sky 61 (already cut from two sizes to one), public gates 1. Candidates to reach 300 s without dropping a scenario: tap-focus on one scene instead of two (about 20 s), phone/ring/listed phone-size repeats (ring and listed run desktop and phone; phone owns phone layout), orbit-look (34 s, unchanged this step), sky tail (high-DPI run).

Scenario map (old script and case -> new script and case):
- browser-controls: apollo11, jupiter-io, shower-perseids at 1440x900 and 390x844 -> browser-controls, "made-up scene" at both sizes (start, drawers, information panel, Sources open, story panel). The information panel now picks the marker first (catalogue bodies carry no Sources).
- browser-phone: apollo11 + jupiter-io, portrait/landscape (layout, top drawer, timeline drawer, scene drag, information sheet, story panel, developer groups, settings), reduced motion -> browser-phone, "made-up scene" same cases; information sheet picks the marker.
- browser-anchor-labels: desktop and phone, 40 Apollo anchors -> same script on ?experience=synthetic, 12 anchors, follow-marker; the UTC seek became `seekToFraction(0.5)` (the made-up scene has no UTC field in the developer panel).
- browser-tap-focus: apollo, showers, jupiter-io at laptop and phone (drag, pinch, empty space, hover, body tap, name-tag tap) -> same script on synthetic and synthetic-ring; thresholds lowered from four/two pairs to two/one. The Jupiter small-moon (body-set dot) case -> browser-jupiter-tap.mjs (demo-only, in the jupiter set).
- browser-scale-menu: unchanged, now in the engine list.
- browser-view-link: perseids and default -> synthetic; the start view is read before the drag instead of the hard-coded 216/14.32; clipboard-refused and malformed-link cases on synthetic.
- browser-orbit-motion: jupiter-io and synthetic -> synthetic only (the Jupiter run is the same arc code; no Jupiter-specific assertion existed).
- browser-embedded: apollo11, showers, geminids, jupiter-io framed/alone at laptop and phone -> "made-up scene" (with the Events list case).
- browser-spike03 -> browser-layout.mjs: viewport fit at laptop/tablet/mobile, touch targets, mobile info sheet clears the timeline, developer panel receives taps (four sizes, information open or not), keyboard focus ring. Its Apollo cases (camera presets and mission readouts unchanged across cameras, event provenance, "no scale control", Columbia/Eagle seeks, screenshot-less capture stubs) -> camera and event cases in browser-shell (generic), the rest stay Apollo-only in browser-apollo-shell.
- browser-shell -> browser-shell (made-up scene: events list/context/next, marker availability, focus/follow/overview and name tags not overlapping, marker information and provenance sections, event information, both scales with names, tooltip, explanation, drag and zoom, developer panel opens, metrics fit a phone, advanced readouts). Not carried over to the made-up scene (no equivalent there): Apollo's 30 events and Unavailable-at-start, earth/moon provenance statuses (the made-up catalogue bodies have no provenance badge), "Observed" event badge, mission readout stability, UTC field, anchor-labels toggle visibility (developer groups; covered by browser-anchor-labels).
- browser-sky: apollo + perseids (sampled: apollo desktop and mobile) -> synthetic desktop only (stars, Milky Way switch, probe fixed under centre changes, drag turns sky, Sky panel citations, fps, high-DPI).
- browser-synthetic / -ring / -listed: tails that opened Apollo (default experience, glow even, fps) -> another made-up scene (synthetic-ring for the no-rate glow; synthetic for "no groups, own marker").

Demo-only scenarios left for T-112: Apollo: everything in browser-apollo-shell (provenance wording, 30 events, mission metrics, scale absence), browser-lite, browser-spike02, browser-home-curve-fits; the Apollo story panels' own behaviour is in no script (browser-story-panels is showers). Showers: browser-showers (perseids, geminids light), browser-public-showers, browser-story-panels. Jupiter: browser-jupiter-io, browser-moon-panel, browser-jupiter-tap. Coverage dropped without a demo equivalent: phone/controls/embedded checks no longer run on Jupiter-Io's moons-only list or the Showers panels (the generic shell is the same code); T-113 to say so in the map.

Files read: those in Context Files plus T-110's record, src/shell/storyPanels.ts and src/app/mission.ts (story panel and anchor shapes), src/app/experienceDefinition.ts head, tests/syntheticRing.test.ts head, run-demo.mjs/runner.mjs, grep of scripts for Apollo uses (extra reads, to design the made-up additions). Files changed: src/synthetic/syntheticDefinition.ts, tests/syntheticStoryAnchors.test.ts (new), tools/validate/{driver,run-engine,run-demo,browser-shell,browser-apollo-shell (renamed old shell),browser-layout (new),browser-jupiter-tap (new),browser-controls,browser-phone,browser-anchor-labels,browser-tap-focus,browser-view-link,browser-orbit-motion,browser-embedded,browser-sky,browser-synthetic,browser-synthetic-ring,browser-synthetic-listed}.mjs; browser-spike03.mjs deleted. src/main.tsx unchanged (no new entry needed).
Limitations: browser-jupiter-tap.mjs and browser-apollo-shell.mjs were only syntax-checked/unchanged, not run; the first Apollo-free run is the only evidence for sky desktop alone; docs/BROWSER_CHECKS.md and AGENTS.md still describe the old scripts (T-113). No defects found in app behaviour. Issues/Tasks/Checks: none created.

## Drift Notes

Design delta for T-113: Codebase Map `src/synthetic/` gains story panels and labelled anchors on the survey marker (tests/syntheticStoryAnchors.test.ts); `tools/validate/` gains browser-layout.mjs and browser-jupiter-tap.mjs, loses browser-spike03.mjs, and browser-shell.mjs is now the made-up-scene version (the Apollo one is browser-apollo-shell.mjs). The engine set is in run-engine.mjs; BROWSER_CHECKS.md's tier text, scenario map and AGENTS.md line 172 are stale. check:engine measured 398 s against the 300 s aim.

Update after owner decision 2026-10-20 ("Hit 5 min: move sky to on-request too"):
- browser-sky.mjs moved to tools/validate/on-request/browser-sky.mjs (git mv, imports fixed); out of the engine list: on request by owner decision 2026-10-20. Its cases are unchanged (made-up scene, desktop).
- Repeats dropped (for the map): browser-tap-focus on synthetic-ring (both sizes; the marker scene keeps laptop and phone); browser-synthetic-ring phone-size pass (1390x844 run; phone layout owned by browser-phone); browser-synthetic-listed phone-size pass (same).
- Runner summary now prints `scene=` per step (steps carry a `scene` field in run-engine.mjs).
- Re-run: `npm run check:engine` 16 steps all exit 0, 0 error lines, TOTAL 275 s (under 300), evidence docs/evidence/engine-20261020T092052Z. Slowest: orbit-look 34, phone 44, shell 15, ring 23, layout 23, tap-focus 23, view-link 22, synthetic 21.
- Gates re-run: typecheck clean, build ok, npm test 79 files, 1143 passed, 1 skipped.
Correction to the criterion 4 engine list above: sky is no longer in it.

Owner closed this Task on 2026-10-20T09:25:52Z through the coordinator (structured question: "Yes, mark them done", owner authorised marking each O-034 step done once its build and tests pass). No Task Check by owner waiver; the O-034 Full Objective Check covers it.
