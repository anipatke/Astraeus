---
id: I-077
title: The compiled engine does not build with webpack 5, as the README says it does
type: defect
status: in_progress
source:
  kind: check
  check: C-107
  actor: {role: checker, session: o036-full-check-20261023}
  at: '2026-10-23T08:14:48Z'
tasks: [T-161, T-162]
checks: [C-107]
severity: medium
history:
  - at: '2026-10-23T08:14:48Z'
    actor: {role: checker, session: o036-full-check-20261023}
    kind: observed
    note: Found by the O-036 Full Objective Check (C-107) against Success Conditions 3 and 5.
    check: C-107
  - at: '2026-10-23T08:30:56Z'
    actor: {role: executor, session: o036-repair-20261023}
    kind: repair_attempted
    note: "Owner decision 2026-10-23: \"Fix all three, short recheck (Recommended)\". Repair in tools/build-packages.mjs: relative imports and exports in the compiled .js and .d.ts now carry .js (or /index.js), and JSON named imports (`import { rotation as x } from \"x.json\"`, 13 in the engine) become a default import plus a destructuring, because webpack 5 (a second, hidden break found while proving this) allows only the default export of JSON in an ES module. Data packages' loadIndex now uses `loaded.default ?? loaded` because Parcel returns the JSON itself. Guard: check-packs.mjs extensionlessImports() fails any compiled relative import without an extension (npm run check:pack and a new case in packagePacks.test.ts that plants one). Proof: scratch app outside the repo (scratchpad/app) with the PACKED astraeus, astraeus-data and astraeus-data-saturn tarballs, README data example (Saturn and Titan): `webpack --mode production` (5.112.1) compiles successfully (before: 9, then 13 errors); `vite build` (8.3.5) passes; `parcel build` (2.16.4) passes once the app sets `\"@parcel/resolver-default\": {\"packageExports\": true}` (without it Parcel cannot read the package exports). Each build served and opened in headless Chromium through tools/validate/driver.mjs: Titan drawn as a sphere in view (radius 19.5 px), Saturn moves over a mid-window seek, 4 chunk .bin files fetched, 0 console errors (no screenshots). README now names exactly these three with versions and the Parcel setting; docs/NPM_PACKAGING.md updated. Not run: esbuild, Rollup alone, webpack 4. Gates: lint, typecheck, build, npm test, check:engine-alone, check:pack, build:example pass. Left in_progress for the recheck."
---

# I-077: The compiled engine does not build with webpack 5, as the README says it does

## Summary

The npm front page (`packages/astraeus/README.md:13`) tells users "You need a bundler (Vite, webpack 5 or Parcel)". The decision note (`docs/NPM_PACKAGING.md:17`) and `tools/build-packages.mjs:4` say the same. Only Vite was ever tried. The compiled files keep extensionless relative imports (`export { Scene } from "./scene"`; `build-packages.mjs:8` says so). The packages are `"type": "module"`, so webpack 5 treats those imports as fully specified and refuses them. Success Condition 3 ("install-ready") and Success Condition 5 ("written down") both rest on this claim.

## Evidence

- Scratch app (outside the repository): `npm install webpack@5 webpack-cli@5` plus the packed `astraeus`, `astraeus-data` and `astraeus-data-saturn` tarballs (built by `npm run check:pack` at HEAD 4dd1f8a6). The entry is the README's data example (Saturn and Titan). `npx webpack --mode production` exits 1 with 9 errors, starting with `ERROR in ./node_modules/astraeus/src/api/index.js 2:0-45 ... BREAKING CHANGE: The request './scene' failed to resolve only because it was resolved as fully specified`.
- The same app built and ran under Vite 8.3.5, both `vite build` and the `vite` dev server, so the defect is specific to webpack. Parcel was not tried.
- No test or check builds the packed packages with anything except Vite (`tools/build-example.mjs`).

## Proof Needed

Pick one of these:

- The compiled output uses fully specified relative imports (`./scene.js`), and a scratch webpack 5 build of the packed tarballs succeeds. Record the build, and keep a fast check that no compiled relative import lacks an extension.
- Or the README, the decision note and the build-script comment name only the bundlers that were proven (Vite), and state the webpack setting a user needs (`resolve.fullySpecified: false`).
