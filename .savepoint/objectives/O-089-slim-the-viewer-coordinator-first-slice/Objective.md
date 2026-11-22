---
id: O-089
title: Slim the viewer coordinator, first slice
status: done
depends_on: [O-087]
release: G-024
priority: medium
rank: 8
lanes: [{key: drawer, title: Developer drawer}, {key: selection-store, title: Selection store}, {key: selection, title: Shared selection}, {key: integration, title: Pattern and Design}, {key: owner-look, title: Owner look}]
---

# O-089: Slim the viewer coordinator, first slice

## Outcome

The 617-line `App` loses its developer drawer and one coherent behaviour (selection, story playback or camera fallback, chosen in the design interview) moves out of `App` and the shell into a per-viewer plain module that the shell presents, removing that behaviour's mirrored state and serial request props. The pattern is documented so later features move one slice each.

## Why

AH-18 (all three): `App` holds about 42 state hooks with settings kept twice, the shell takes 46 props including five serial request objects ordered by effect position; each host feature touches 5+ places. AH-19: four forwarding layers per host capability. Owner decision 3: one slice at a time.

## Success Conditions

- Developer drawer in its own component; `App` shorter by that amount.
- The chosen behaviour has one owner outside React state, read through `useSyncExternalStore`; its serial request prop and mirror are gone.
- `lifecycle`, `twoViewers`, `hostCallOrder`, phone and shell DOM tests green on both mounts; the quick browser tier green (full tier if camera or layout is touched, decision 1).
- The slice pattern written in `docs/architecture/viewer-interface.md`.

## Architectural Considerations

API-02 handle parity; public API unchanged.

## Boundaries

**In scope:**
- The drawer extraction and one behaviour.

**Out of scope:**
- A full store rewrite; collapsing the forwarding layers beyond what the slice needs; a chrome-less viewer.

## Decisions

- Owner 2026-11-21 (G-024 decision 7): "work through this list of objectives one by one. Orchestrate each objective to completion"; owner 2026-11-22 "carry on orchestrating G-024". Step checks waived on T-418..T-421; T-422 is the owner look on localhost:5490 before the Full Check (park unmerged if the owner is away).
- Slice: **Selection** plus the developer drawer (G-024 decisions 3 and 7). Planner (orchestrate-g024-20261121) defaults taken: (1) the five shell-mounting test files (`domSetup.ts` and four direct mounts) change only the props handed to `AstraeusShell`, no assertion/fixture changes, diff lines recorded per file; (2) the scene-pick serial prop stays for the camera-fallback slice; (3) full browser tier once, in T-421 (policy: the diff touches `src/shell/`); (4) a reopened drawer shows live readings at once; (5) `firstOpenGraph.test.ts` import target moves to `./DeveloperDrawer`; (6) the 10 Hz playing re-render stays out of scope, noted as a later slice.
- Engine size: raw cap 1,838,000 B; last measured 1,836,426 B (C-208). T-418 must lower the first-open raw total; T-420 may add at most 500 B over T-418's figure (O-092 still needs ~900 B). Over budget: park with measured options.
- The `selectedObjectId` getter on `SceneControls` must be an own enumerable property (O-087's `controlsChanged` walks controls with `for…in`), pinned by a T-420 test row.
- Waves: T-418 and T-419 side by side; then T-420; then T-421 and T-422.
- Owner look 2026-11-22 on localhost:5490 (T-422): all steps pass ("check steps look good otherwise"); "focus on saturn after overview does nothing" reproduced on main before O-089 -> I-200 (backlog, owner "Log it for later"). Two loading hangs were the preview server, not the code -> I-201, repaired on this branch (`npm run preview:owner`), verified by C-210.
- O-089 set done by the orchestrating session after Full Check C-210 CLEAR (I-201 verified) (G-024 decision 7, "Orchestrate each objective to completion"; "CLEAR: fast-forward merge to main and push"). Owner 2026-11-22, after "i seem to be spending 90% of my time waiting for tests": the I-199 measure-and-prune work goes next, before O-092 and O-090 ("Do it next").
