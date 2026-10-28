---
id: I-093
title: The README and packaging notes still say the package cannot load in plain Node
type: defect
status: open
source:
  kind: check
  check: C-118
  actor: {role: checker, session: o044-full-check-20261028}
  at: '2026-10-28T10:58:00Z'
tasks: [T-182, T-184]
checks: [C-118]
severity: low
history:
  - at: '2026-10-28T10:58:00Z'
    actor: {role: checker, session: o044-full-check-20261028}
    kind: observed
    note: 'Found in the O-044 Full Objective Check: three pre-existing sentences became false when T-182 added the `node` export condition, and T-184 did not update them.'
    check: C-118
---

# I-093: The README and packaging notes still say the package cannot load in plain Node

## Summary

O-044 (T-182) made `astraeus` load in plain Node and in Vitest's Node environment through a `node` export condition and CSS-free `*.node.js` twins; T-184 documented this in a new README section. Three older sentences that say the opposite were left in place, so the published README now contradicts itself in its Install section:

- `packages/astraeus/README.md:19`: "The package is plain ES modules that reference their pictures with `new URL(..., import.meta.url)`; loading it straight in Node or from a bare `<script type="module">` will not work." The new section at README "Loading in your build and in tests" says Node and Vitest's Node environment import it with no inline setting.
- `docs/NPM_PACKAGING.md:79`: "The compiled output needs a bundler: it imports CSS, pictures and JSON, so plain Node or bare browser module loading fails." T-182's Design References name `docs/NPM_PACKAGING.md` "only if the build output changes shape"; the export map and file set did change (a `node` condition and seven `.node.js` twins).
- `tools/build-packages.mjs:12` (header step 5): "Plain Node and bare browser modules still cannot load the code: a package like `astraeus` imports CSS and pictures." The same file's step 4b and `writeNodeCopy` now provide the Node copy.

Violated requirement: O-044 Success Condition "Documentation" and T-184 Boundaries ("no claims beyond what the code does at this commit"); T-182 Design References (`docs/NPM_PACKAGING.md` when the build output changes shape).

## Evidence

- Smallest scenario (C-118, 2026-10-28T10:53Z): pack `packages/astraeus/dist` (built at HEAD `938cbfc0`), unpack into a scratch `node_modules/astraeus`, link the peers, then run in plain Node (no bundler, no Vitest): `import { Scene, earth, sun, mount, AstraeusScene } from "astraeus"; new Scene().addBody(sun).addBody(earth).toDefinition();` Expected per README line 19: fails. Actual: loads; prints `plain node ok function function true` (resolved to `src/api/index.node.js`).
- `npm run check:node-consumer` passes at HEAD (Vitest Node environment, no inline setting).
- No test or doc check covers the README's Node statements; T-184 evidence lists the new section only.

## Proof Needed

- README line 19 (or its replacement) no longer says Node loading fails; it agrees with "Loading in your build and in tests" (Node imports the package for scene definitions and tests; drawing still needs a browser and a bundler).
- `docs/NPM_PACKAGING.md` packaging notes describe the `node` condition and the generated `.node.js` twins, or state why the bundler line still holds for the default `import` condition only.
- `tools/build-packages.mjs` header step 5 no longer says plain Node cannot load the code.
- `grep -n -i "straight in Node\|plain Node" packages/astraeus/README.md docs/NPM_PACKAGING.md tools/build-packages.mjs` shows no remaining contradiction; hand-off gates stay green.
