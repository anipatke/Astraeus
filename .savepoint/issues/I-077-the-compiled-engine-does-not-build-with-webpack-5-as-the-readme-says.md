---
id: I-077
title: The compiled engine does not build with webpack 5, as the README says it does
type: defect
status: open
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
