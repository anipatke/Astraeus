---
id: O-040
title: Drop the scene into a React app and start the API reference
status: in_progress
depends_on: [O-036]
release: G-011
---

# O-040: Drop the scene into a React app and start the API reference

## Outcome

A React developer writes one component (for example `<AstraeusScene scene={scene} />`) instead of calling `mount`, with the same behaviour. A developer API reference page lists every public call and option, generated from the public types so it grows with each later Objective.

## Why

G-011 (owner, 2026-10-23): grow the public API to cover the story layer so the package is worth installing. Done first because `mount` already renders React inside, so the component is small, and most Three.js developers use React; the reference grows with the API rather than being written at the end.

## Success Conditions

1. **React 19.** The engine, demos and site run on React 19 and the matching React Three Fiber; `react`, `react-dom`, `@react-three/fiber` and `three` are peer dependencies of the published `astraeus`, so a host app's own React is used (no second copy). The demos look and behave as before on the preview (owner's look).
2. **Plain component.** `import { AstraeusScene } from "astraeus"`; `<AstraeusScene scene={scene} data={[...]} />` draws the same full viewer `mount` draws, cleans up on unmount, and reports readiness and load failure; `mount` is unchanged for callers who write no React.
3. **React example.** A small React 19 app outside the workspaces installs the packed tarballs and draws a scene with the component; `npm run check:browser` gains a step that proves it draws (scene readouts through the driver, no screenshots), run once at the Full Objective Check.
4. **Reference page.** The public site serves an API reference at `/api`, generated from the public types and their doc comments, listing every export of `astraeus`'s `.` entry with short examples; the README and npm page link to it. A fast check fails when a public export has no doc comment, so the page grows with each later Objective.

## Confirmed Decisions (owner, 2026-10-23)

1. **React version:** "Move to React 19 first (Recommended)": the React 19 move is the first step, and the engine stops shipping its own React.
2. **Reference home:** "On the public site (Recommended)", at `/api`, linked from the README and npm page.
3. **Component scope:** "Full viewer, same as mount (Recommended)"; a scene-only option waits until the Apollo rebuild (O-041) gives developers events to wire their own controls to.
4. **Plan:** "Yes, write these steps (Recommended)": React 19 move with the owner's look on the preview; component and React example; reference page with the undocumented-export check. Browser check once, at the Full Objective Check.

Facts found while planning: React 18.3.1 and React Three Fiber 8.18 are installed; the current Fiber (9.8) needs React 19 (`>=19 <19.4`). TypeDoc 0.28 accepts TypeScript up to 6.0, so it runs through the existing TypeScript 6 shim route or another generator the step chooses.

## Architectural Considerations

Additions go through the public API in `packages/astraeus/src/api/` as a thin layer over the existing engine (O-036 decision); anything not exported there stays internal. ARCH-01 to ARCH-05 and PROV-01, PROV-02 apply; a new public capability is proven on a made-up configuration (ARCH-03) and in the packed example, not only by a demo. Each new public call is added to the API reference page set up in O-040.

## Boundaries

**In scope:**
- A plain React component alongside `mount`, its tests and a React example built from the packed package; the reference page, how it is generated and kept in step, a link from the README

**Out of scope:**
- A scene-only (no menus) option; replacing `mount`; wrappers for other frameworks; tutorials beyond short examples
