---
id: I-076
title: The package boundary test misses import.meta.glob, including a code glob
type: verification
status: open
source:
  kind: check
  check: C-104
  actor: {role: checker, session: o035-full-check-20261023}
  at: '2026-10-23T06:26:06Z'
tasks: [T-156]
checks: [C-104]
guardrail_ids: [ARCH-03]
severity: low
history:
  - at: '2026-10-23T06:26:06Z'
    actor: {role: checker, session: o035-full-check-20261023}
    kind: observed
    note: Found by the O-035 Full Objective Check (C-104) against Success Condition 2 and the T-156 Done When "no relative path crosses a package folder".
    check: C-104
---

# I-076: The package boundary test misses import.meta.glob, including a code glob

## Summary

O-035 Success Condition 2 says a fast test fails any import that reaches inside another package. `packages/astraeus-site/tests/packageBoundaries.test.ts` does not read `import.meta.glob` patterns, and its header (lines 6-9) and the O-035 entry in Design say the unchecked globs are "data paths, never code". That is not true: the site loads the planets demo's code through a relative glob into that package's `src/`, bypassing the demo's declared `exports`. The planets demo also imports the engine's body JSON by relative glob (`../../../../../astraeus/data/bodies/...`), although `astraeus/data/*` is a declared entry. T-156 recorded these as "known limits carried to the Full Objective Check"; the owner's exception there ("Accept broad doorways") covers the export patterns, not the globs.

## Evidence

- `packages/astraeus-site/src/main.tsx:43-45`: `import.meta.glob("../../astraeus-demo-planets/src/experiences/planets/systems/*.ts")` (and the Jupiter-only form for the public build). These are lazy code modules. The boundary test's specifier regex matches none of them; probe: the regex applied to `main.tsx` returns 0 specifiers containing `demo-planets/src`.
- `packages/astraeus-site/src/main.tsx:34,41-42,50-52`: data globs into three demo packages.
- `packages/astraeus-demo-planets/src/experiences/planets/systems/{jupiter,saturn,uranus,neptune,pluto,mars}.ts`: JSON and `?url` globs into `packages/astraeus/data/`.
- Consequence: if a demo moves or renames a file, the glob silently matches nothing. The build still passes, and Planets fails only at run time (`PLANET_SYSTEMS[...]!()` on undefined). The boundary guard, which is meant to catch this, stays green.
- Engine isolation is not affected: `npm run check:engine-alone` passed, and a planted engine glob into a demo matched nothing there (C-104 probe).

## Proof Needed

Pick one of these:

- The boundary test reads `import.meta.glob` patterns as well. It fails a glob that crosses into another package's code (`src/`), and either fails or explicitly allows (named in the test) data globs into a declared `data/*` entry. Prove it with made-up offenders in the temp-folder test. Then remove or route the site's code glob into the planets demo, for example through a systems map that the planets demo exports. Finally, correct the test header and the Design O-035 sentence.
- Or the owner accepts the remaining glob reaches by name. In that case the test header and Design must still stop calling them "data only".
