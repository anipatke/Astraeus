---
id: I-076
title: The package boundary test misses import.meta.glob, including a code glob
type: verification
status: resolved
source:
  kind: check
  check: C-104
  actor: {role: checker, session: o035-full-check-20261023}
  at: '2026-10-23T06:26:06Z'
tasks: [T-156]
checks: [C-104, C-105, C-106]
guardrail_ids: [ARCH-03]
severity: low
resolution:
  disposition: verified
  check: C-106
  actor: {role: checker, session: o035-full-recheck2-20261023}
  at: '2026-10-23T06:48:37Z'
history:
  - at: '2026-10-23T06:26:06Z'
    actor: {role: checker, session: o035-full-check-20261023}
    kind: observed
    note: Found by the O-035 Full Objective Check (C-104) against Success Condition 2 and the T-156 Done When "no relative path crosses a package folder".
    check: C-104
  - at: '2026-10-23T06:31:10Z'
    actor: {role: executor, session: i076-repair-20261023}
    kind: repair_attempted
    note: "Owner decision 2026-10-23, \"Fix it, short recheck (Recommended)\". The planets package now exports its systems map (packages/astraeus-demo-planets/src/experiences/planets/planetSystems.ts, __PUBLIC_BUILD__ split kept); main.tsx imports it by package name, so the code glob into the demo's src/ is gone. Vite globs cannot take a package name, so the planets systems' relative globs into packages/astraeus/data/ stay and are allowed by name. packageBoundaries.test.ts now reads import.meta.glob patterns (string and array forms) and fails a glob into another package's code; named rules DATA-OF-ENGINE (any package, engine declared data/*), DATA-OF-DEMO (site only, demo declared data/*) and TEST-READS-ENGINE-TEXT (a tests/ file globbing engine src/ with ?raw; found needed for three existing test files). Proved with made-up offenders in the temp-folder test (code, array, demo-to-demo, site-to-demo-code, engine-to-demo, ?raw outside tests/, non-raw in tests/). Test header and the Design O-035 sentence corrected. Also tools/check-engine-alone.mjs skips git-ignored files (the 2.5 GB Horizons cache). Gates: lint, typecheck, build, npm test (116 files, 1530 pass, 1 skip), check:engine-alone (65 files, 647 pass, 1 skip), public build with load-budget and public-build-assets ok: 99 files, 26,012,269 B (C-104: 99, 26,012,296 B; same file list, -27 B), Jupiter-only holds. No browser run. Awaiting a recheck."
  - at: '2026-10-23T06:37:43Z'
    actor: {role: checker, session: o035-full-recheck-20261023}
    kind: rechecked
    note: "C-105 (NEEDS WORK, low). The original reproduction is closed: main.tsx no longer globs the planets demo's src/, and a planted copy of that glob now fails the test. Still open: globOffences checks only a glob whose fixed prefix lies inside a package folder, so a wildcard at the package-name level (../../*/src/**, ../../astraeus-demo-*/src/**) or a root-absolute pattern (/packages/...) is never checked. Two live cases pass unseen: packages/astraeus-demo-showers/tests/swiftTuttle.test.ts:165 and elementsBody.test.ts:242 glob ../../*/src/**/*.{ts,tsx} with ?raw (every package's source, demos and site included), which no named rule allows. The test header and Design sentence therefore still claim more than the test checks. Also tighten the ?raw detection to the call's own options (a later ?raw mention lets an eager code glob through) and the tests/ path match. Remaining Proof Needed: planted wildcard-package and root-absolute offenders fail, the two showers globs are named-rule allowed or narrowed, header and Design match; or the owner accepts these shapes by name."
    check: C-105
  - at: '2026-10-23T06:41:10Z'
    actor: {role: executor, session: i076-repair2-20261023}
    kind: repair_attempted
    note: "Second round after C-105, owner 2026-10-23: \"One more fix, then stop (Recommended)\". globOffences now matches each glob against every package its path can match (wildcard, partial name, brace list in the package-name segment; a ** above a package; /packages/... and other /-rooted patterns resolved), and any other package matched is a crossing. TEST-READS-ENGINE-TEXT is tighter: query ?raw must be in that glob call's own options (call arguments parsed, comments ignored) and the file must be in the package's top-level tests/ folder. The two live cases (showers tests swiftTuttle.test.ts:165 and elementsBody.test.ts:242) were narrowed from ../../*/src/** to ../../astraeus/src/**: swiftTuttle proves the comet name appears in engine src only in the body folders plus catalogue.ts (unchanged; the other packages' src never held it), elementsBody proves the asteroid name is in no src file (now engine src only, demo and site src are no longer scanned by it). Made-up offenders added for package-name wildcard, partial name, brace list, ** above a package, /packages root start and root wildcard, wildcard with ?raw, ?raw only in a later comment, and src/x/tests/ path; all fail. Header and Design sentence updated to match. check-engine-alone: exact ignored paths (pathspec packages/astraeus/) and a clear exit 1 if git cannot run. Gates: lint, typecheck, build, npm test (116 files, 1530 pass, 1 skip), check:engine-alone (65 files, 647 pass, 1 skip) pass. No browser run."
  - at: '2026-10-23T06:48:37Z'
    actor: {role: checker, session: o035-full-recheck2-20261023}
    kind: rechecked
    check: C-106
    note: "C-106 CLEAR. Proof Needed met with independent planted offenders: every C-105 shape (package-name wildcard, partial name, root-start, ?raw only in a later comment or string, src/x/tests/, wildcard with ?raw) now fails; the two showers globs are narrowed to engine src and allowed by TEST-READS-ENGINE-TEXT; header and Design match the checked rule. Residue recorded as observations, not blocking: a brace list holding a / and Vite's base option still pass unseen (no use in the repository), and elementsBody no longer scans the showers demo's own src. Fresh lint, typecheck, build, test:full (rerun after load timeouts), engine-alone, public build with load budget and public-build-assets (99 files, 26,012,269 B, Jupiter-only) pass; health does not block. Verified."
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
