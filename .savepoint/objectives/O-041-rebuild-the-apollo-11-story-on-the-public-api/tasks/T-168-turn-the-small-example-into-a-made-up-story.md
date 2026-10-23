---
id: T-168
title: Turn the small example into a made-up story
objective: O-041
status: done
depends_on: [{task: T-167, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o041-planning-20261024}
check_waiver:
  task: T-168
  reason: 'Owner said "go ahead" on the O-041 plan, under the standing rule of no per-step checks and one Full Objective Check at the end.'
  actor: {role: owner, session: o041-run-20261024}
  recorded_at: '2026-10-23T21:26:55Z'
---

# Turn the small example into a made-up story

## Outcome

`examples/hello-scene`, built from the packed `astraeus` tarball, shows a tiny made-up story using every new O-041 call: a made-up path with anchors, a description, known limits and readout bars, two events, one story panel, a set timeline and an opening view.

## User Check

None required (optional: the owner may look at the built example).

## Done When

- `examples/hello-scene/src/main.js` uses every call added by the two API Tasks (anchors, notes, readouts, events, panels, timeline settings, true-scale-only or a stated reason not to, `lookAt`).
- `npm run check:pack` and `npm run build:example` pass.
- The `hello-scene` browser step reads the panel, the events and the anchor count through `packages/astraeus-site/tools/validate/driver.mjs` (no direct selectors, no screenshots); `docs/BROWSER_CHECKS.md` maps the change. The step is not run per Task; it runs once in the Full Objective Check, unless the runner itself changes.
- `packages/astraeus/README.md` and `packages/astraeus/CHANGELOG.md` describe the new calls.
- Hand-off gates green.

## Context Files

`examples/hello-scene/src/main.js`, `examples/hello-scene/index.html`, `examples/hello-scene/package.json`, `tools/build-example.mjs`, `tools/check-packs.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `packages/astraeus/src/api/index.ts`.

## Design References

Design Codebase Map (`examples/hello-scene`), Current Technical State O-036 (packed example).

## Guardrails

ARCH-03, TEST-01, STYLE-05.

## Implementation Plan

1. Read the public calls from `src/api/index.ts` (not internals).
2. Grow `main.js` into the made-up story; build from the tarball.
3. Extend the browser step via `driver.mjs`; update the map.
4. README and CHANGELOG.

## Boundaries

No new example app (Decision 5); no real data.

## Technical Verification

`check:pack`, `build:example`, hand-off gates. Browser step at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Gates (branch o041-apollo-public-api):
- `npm run lint`: pass. `npm run typecheck`: pass. `npm run build`: pass (existing chunk-size warning only).
- `npm test`: first run failed 1 of 1634 (`packages/astraeus-site/tests/publishWorkflow.test.ts`, the old 22-line cap on the example); test updated to an 80-line story cap plus every new call present. Final run: 122 files passed, 1633 passed, 1 skipped.
- `npm run check:pack`: pass (12.4 s). `npm run build:example`: pass (both examples).
- hello-scene browser step alone, once (the Task changed that script): `HELLO_STORY=1 ASTRAEUS_URL=http://localhost:5496/ node check-hello-scene.mjs` against `vite preview` of the built example: PASS desktop and phone, no errors. Evidence `docs/evidence/browser-20261023T212529Z-hello-scene/` (summary.txt, results.json). `npm run check:browser` not run.

Per criterion:
1. `main.js` uses anchors (3), description (body and path), knownLimitations, readouts (range with marker, speed, distance, altitude), addEvents with provenance (2), addStoryPanels (1, at an event), setTimeline (span, rates, rate), setScale(trueScale, {only:true}), camera.lookAt, path provenance. `stateOf` is not in the Task's list and is unused. Met; the updated publishWorkflow test asserts it.
2. check:pack and build:example pass. Met.
3. Browser step reads anchors (3 labels), events (2 rows), panel (marker, opens, badge, source) and the Focus preset through `driver.mjs` only; no screenshots; `docs/BROWSER_CHECKS.md` updated. Met.
4. README (call rows, example note) and CHANGELOG (Unreleased entry) describe the calls. Met.
5. Hand-off gates green. Met.

Extra reads (outside Context Files): check-hello-scene.mjs (script to extend), run-browser.mjs and runner.mjs (step env), src/api/scene.ts and story.ts (signatures behind the public entry), tests/publicApiStory.test.ts and publicApiPaths.test.ts (panel shape), examples/hello-react/src/main.jsx (shares the script), packages/astraeus-site/tests/publishWorkflow.test.ts (failed on the line cap).

Files changed: examples/hello-scene/src/main.js; packages/astraeus/README.md; packages/astraeus/CHANGELOG.md; packages/astraeus-site/tools/validate/check-hello-scene.mjs; packages/astraeus-site/tools/validate/run-browser.mjs; packages/astraeus-site/tests/publishWorkflow.test.ts; docs/BROWSER_CHECKS.md; docs/evidence/browser-20261023T212529Z-hello-scene/ (new); this Task file.

Limitations: hello-react unchanged (still follows; the shared script branches on HELLO_STORY). Panel auto-open during playback not asserted (opened from its marker). Looks not judged.

## Drift Notes

- `lookAt` replaces `follow` in hello-scene, so the shared script branches on `HELLO_STORY=1` (set only on the hello-scene step); hello-react is untouched.
- `publishWorkflow.test.ts` held the old "about twenty lines" rule; it now caps the story at 80 lines and requires every story call. README keeps its short 20-line snippet and links to the example.
