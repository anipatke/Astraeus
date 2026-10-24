---
id: O-043
title: Raise coverage honestly and lighten a consumer's bundle
status: in_progress
depends_on: [O-042]
release: G-011
---

# O-043: Raise coverage honestly and lighten a consumer's bundle

## Outcome

The public API is thoroughly tested and coverage reads 80% or more on code that matters to a developer, with an honest, recorded decision on whether the data-import tools count. An app that imports `astraeus` downloads less code than with 0.1, measured before and after on the packed example; parts a developer does not use (site screens, developer panels) are left out of their app.

## Why

G-011 (owner, 2026-10-23): grow the public API to cover the story layer so the package is worth installing. Coverage is 73.7% (official check, 2026-10-23), most of the gap in import tools and 3D drawing hooks; most of a consumer's download is three.js and React, which stay, so the win is what the engine leaves out.

## Success Conditions

Settled with the owner, 2026-10-24 (planning session o043-planning-20261024):

- **Coverage scope (owner: "Leave them out, test the 3D code").** The data-import tools (`packages/astraeus/tools/import/`, run on the maintainer's machine against JPL; not in the npm package) leave the coverage count, with the reason recorded in Design. Measured before the change (coverage-final.json, 2026-10-24 12:01): overall 75.0% of statements; import tools 8.6% (135 of 1,563); without them about 84.9%; `src/app/` (3D drawing) 73.9% (2,998 of 4,058).
- **Coverage target.** After the change, `npm run test:full` reports 80% or more of statements overall **and** `packages/astraeus/src/app/` reaches 80% or more through real tests of behaviour, not by further exclusions.
- **Developer panels (owner: "Load them only when switched on").** The developer settings and debug readouts load as a separate piece only when switched on; an app that never opens them does not download them; the site behaves as today.
- **Bundle measure (owner: "Code on first open, any real drop").** The measure is the JavaScript and CSS the packed `examples/hello-scene` loads on first open (raw and gzip), taken by one repeatable command before and after. Baseline (2026-10-24 build): one JS file of 1,558,533 B (449,266 B gzip) plus 44,750 B CSS. Success is a real drop, recorded; there is no fixed percentage. three.js and React stay. Larger savings than the panels and small safe items are brought to the owner first.

## Architectural Considerations

Additions go through the public API in `packages/astraeus/src/api/` as a thin layer over the existing engine (O-036 decision); anything not exported there stays internal. ARCH-01 to ARCH-05 and PROV-01, PROV-02 apply; a new public capability is proven on a made-up configuration (ARCH-03) and in the packed example, not only by a demo. Each new public call is added to the API reference page set up in O-040.

## Boundaries

**In scope:**
- Tests, the coverage scope decision, before-and-after bundle measurements on the example, making unused engine parts drop out

**Out of scope:**
- Changing a scientific source (the orb Earth data) without the owner's choice; replacing three.js or React
