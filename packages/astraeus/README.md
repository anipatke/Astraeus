# astraeus (the engine)

The part of Astraeus that has no story of its own. Inside this repository it is used as TypeScript source (the demos and the site build it). For npm it is compiled by `npm run build:packages` into `dist/`, which is the folder that gets packed (`npm run check:pack` builds and checks it; nothing is published from here). Its code imports no other package in this repository; the moon pictures, the 8k Venus map, the Milky Way and the moon positions live in `astraeus-data` and `astraeus-data-<planet>`, which a customer hands to `mount(..., { data })`.

## What it holds

| Folder | Purpose |
|---|---|
| `src/core/` | Scientific core: clock, frames, bodies, providers and curve-fit state. No Three.js or React. |
| `src/assets/` | Body catalogue, compositions, visuals, rings and sky. |
| `src/app/` | The scene and app adapter (floating origin, camera, paths, labels, `App`). |
| `src/shell/` | The generic UI: shell, top bar, timeline, drawers, info panel, story panels. |
| `src/experiences/` | Shared helpers a demo builds on (settings reader, metrics, switch chooser). |
| `src/synthetic/` | Made-up experiences that prove the plug-in contract. |
| `data/`, `licenses/` | Core data (bodies, ephemerides, orbits) and the notices for the libraries it uses. |
| `tests/` | The engine's tests, plus helpers its demos' tests reuse. |

## How a demo plugs in

A demo is a package that depends on `astraeus`, builds an `ExperienceDefinition` (type in `src/app/experienceDefinition.ts`) from its own data, and is listed by the site. It imports the engine only through the package entries in `package.json` `exports` (for example `astraeus/app/experienceDefinition`), never by a relative path into this folder.

A complete small example with no real data is `src/synthetic/syntheticDefinition.ts`: a made-up object on a tilted loop with marks, events and story panels. Read it first; the site lists it as the `synthetic` experience (`packages/astraeus-site/src/main.tsx`).

The source `exports` list is broad (one pattern per folder) for the demos and the site; the published package exports only `.` (the public API) and `./style.css`, written into `dist/package.json` from the `x-publish` block of this manifest.

## Check it alone

From the repository root, `npm run check:engine-alone` copies this package and the shared config into a scratch folder with no demo or site, then type-checks, lints and tests it there. A file or import that reaches outside the package fails the run.
