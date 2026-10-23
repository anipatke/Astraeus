---
id: O-036
title: Publish the engine to npm
status: planned
depends_on: [O-035]
release: G-010
---

# O-036: Publish the engine to npm

## Outcome

A developer runs `npm install astraeus` and builds a small scene in a few lines through a documented public API close to the Idea's sketch, mounted into any web page:

```ts
const scene = new Scene()
scene.addBody(earth); scene.addTrajectory(apollo11)
scene.setTime("1969-07-20T20:17:40Z"); scene.setScale(readableScale); scene.camera.follow("apollo11")
mount(document.getElementById("sky"), scene)
```

## Why

Owner, 2026-10-20: "and 3 too" (publish the engine to npm after the split). The Idea's Success Criterion 2: a developer builds a scene through a small API without copying application code or understanding internals.

## Success Conditions

1. **Small API.** `Scene`, `addBody`, `addTrajectory`, `setTime`, `setScale`, `camera.follow` and `mount(element, scene)` work in any web page without the developer writing React; they are a thin layer over today's engine (ExperienceDefinition, providers, presentation) and the demos keep working unchanged.
2. **Two packages.** `astraeus` is small: code, the planets' positions and a few pictures. `astraeus-data` is optional and adds every moon's positions and the full pictures. A standing fast check packs both (`npm pack --dry-run` or equivalent) and fails on unexpected contents or a size above the limits the research step sets.
3. **Install-ready.** The engine ships compiled JavaScript with type declarations; its public `exports` name only the public API (plus entries the demos need, marked internal and outside the promise).
4. **Example.** A tiny app outside the demos installs the packed packages and draws a scene; `npm run check:browser` proves it draws (scene readouts through the driver, no screenshots) once at the Full Objective Check, and the owner looks at it on a preview.
5. **Written down.** The public API, the 0.1 preview promise (anything not listed is internal; breaking changes before 1.0 noted in a changelog), a CHANGELOG and a step-by-step release procedure. The owner runs the publish.

## Confirmed Decisions (owner, 2026-10-23)

1. **API style:** "Idea's style, plus a mount call (Recommended)": the Idea's imperative calls plus `mount`, no React knowledge required; not a React-only component.
2. **Data:** "Small engine + optional data package (Recommended)": `astraeus` small; `astraeus-data` optional with every moon's positions (about 38 MB committed) and the full pictures (the engine's textures are about 44 MB). Planet and moon data stay engine-side, never in a demo (owner, 2026-10-18).
3. **Distribution:** owner asked "Is NPM the best distro approach for this? How are other similar models distributed"; answered from comparable libraries (three.js, CesiumJS, Aladin Lite, astronomy-engine, satellite.js publish on npm and are mirrored free by jsDelivr/unpkg; Stellarium Web, Celestia, OpenSpace are applications shared as source). npm stands.
4. **Stability:** "0.1 preview, promise written (Recommended)": publish as 0.1.0; the public API is written down, anything else internal; breaking changes allowed before 1.0, each in the changelog.
5. **Plan:** "Yes, write these steps (Recommended)": research, public API, build and packages, example and guides with the owner's look. Browser check once, at the Full Objective Check.

## Architectural Considerations

The API wraps the existing core, providers and presentation layers; it must not leak experience names (ARCH-01) or let presentation change State (ARCH-02). The engine stays free of demo and site code (ARCH-04; `npm run check:engine-alone`). Provenance and licences travel with the data that needs them (PROV-01, PROV-02): each package carries the notices for what it ships. How the compiled build carries pictures and data files, and how the engine finds `astraeus-data` when it is installed, is unknown today; step 1 decides it.

## Boundaries

**In scope:** package metadata, the public API layer and its tests, the compiled build, the `astraeus-data` package, the pack check, an example app, API docs, the stability promise, CHANGELOG and release procedure.

**Out of scope:** the act of publishing (the owner's); publishing the demo or site packages; a CDN or script-tag build beyond a mention in the docs; changing what the demos show; React-only or second-style APIs.
