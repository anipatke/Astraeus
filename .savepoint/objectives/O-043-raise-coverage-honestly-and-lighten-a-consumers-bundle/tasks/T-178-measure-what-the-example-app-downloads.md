---
id: T-178
title: Measure what the example app downloads
objective: O-043
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o043-planning-20261024}
---

# Measure what the example app downloads

## Outcome

One repeatable command builds the packed `examples/hello-scene` and reports the JavaScript and CSS it loads on first open (the entry script, every script it imports statically, and its CSS; raw bytes and gzip), leaving out scripts loaded later on demand. The baseline is recorded, with a breakdown of how much of the engine's share comes from each part, and a short list of engine parts an app could leave out.

## User Check

None required; the owner reads the baseline and the list of candidate savings in the hand-off.

## Done When

- A command (for example `npm run measure:example`, a root script calling a new `tools/measure-example.mjs`) builds through `tools/build-example.mjs` and prints a fixed-format table: file, raw bytes, gzip bytes, first-open or on-demand, and the first-open totals. Its counting logic is a plain function tested on a made-up build folder (no real build in the test).
- The baseline is recorded in Technical Evidence and in `docs/evidence/o043-bundle-baseline.md` (date, commit, command, totals, breakdown).
- The breakdown splits the first-open JavaScript by source (three.js, React and react-dom, @react-three/fiber, Orb, the engine by folder: `src/app`, `src/shell`, `src/core`, `src/assets`, `src/api`), for example from a one-off source-map build; the method is written down.
- A candidate list names each engine part that a plain app does not need on first open (at least the developer panels: `DeveloperSettings.tsx`, `DebugOverlay.tsx`, `FrameRateSection.tsx`, `SettingControls.tsx` if only they use it), its size, and whether making it load on demand is small and safe or needs an owner decision.
- Hand-off gates green.

## Context Files

`tools/build-example.mjs`, `examples/hello-scene/package.json`, `examples/hello-scene/src/main.js`, `examples/hello-scene/index.html`, `package.json`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/app/App.tsx`, `tools/build-packages.mjs`.

## Design References

Design Components/Codebase Map (`src/api/`, npm packaging O-036); Interfaces and Data Flow.

## Guardrails

TEST-01, TEST-03, STYLE-02, STYLE-05, STYLE-07.

## Implementation Plan

1. Add the measuring function (read Vite's build manifest or the emitted `index.html` and follow static imports) and its test on a made-up folder.
2. Wire the command; run it on the current tree and record the baseline.
3. Produce the source breakdown and the candidate list; record the method.

## Boundaries

Measurement only: no change to the engine, the examples' code, or the build. `examples/hello-react` may be measured too but is not the success measure.

## Technical Verification

Hand-off gates from AGENTS.md (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`) plus one run of the new command. No `npm run check:browser` per Task. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Defer architecture notes to the coverage and Design step of O-043.
