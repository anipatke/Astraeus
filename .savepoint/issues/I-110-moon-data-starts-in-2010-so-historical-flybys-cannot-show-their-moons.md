---
id: I-110
title: 'Moon data starts in 2010, so historical flybys cannot show their moons'
type: defect
status: open
source:
  kind: report
  actor: {role: owner, session: probe-feedback-20261031}
  at: '2026-10-31T12:00:00Z'
severity: high
history:
  - at: '2026-10-31T12:00:00Z'
    actor: {role: planner, session: probe-feedback-20261031}
    kind: observed
    note: 'Reported from the interplanetary probe downstream app (astraeus@0.4.0 from npm, public API only), pasted by the owner.'
  - at: '2026-10-31T03:55:00Z'
    actor: {role: checker, session: o047-check-20261031}
    kind: rechecked
    note: 'C-126 NEEDS WORK. Data back to 1950, per-body spans, README years and the moon out-of-span error are proven. Still failing: a scene with a planet orbit line or camera.fitOrbit whose timeline starts before 1950 (e.g. sun + saturn {orbit: true}, timeline 1945-01-01 to 1946-01-01) throws TimeScaleOutOfRangeError instead of SceneError out-of-span, because the sun paths (#earlySunPaths at toDefinition, #sunPath in prepare) and the fit read run before #checkPlanetSpan (api/scene.ts). Repair: check the planet span first in both places; test orbit and fitOrbit before 1950; make the dataSpans.test.ts planet case test a pre-1950 date (now vacuous).'
    check: C-126
  - at: '2026-10-31T15:00:00Z'
    actor: {role: executor, session: o047-repair-20261031}
    kind: repair_attempted
    note: 'Out-of-scope repair after C-126, not verified. All planet-series reads in setup (fit distance, early Sun paths, clump groups at toDefinition; sun paths, groups, fit settle in prepare) go through one choke point, Scene.#planetRead, which checks the span first and converts any TimeScaleOutOfRangeError to the named out-of-span when the window is outside the series. dataSpans.test.ts planet case replaced: windows before 1950, straddling 1950 and after 2045, each plain, with orbit:true and with fitOrbit (the 6 orbit/fitOrbit cells fail on the old code), plus an in-span window that still resolves. Gates lint, typecheck, build, test pass; no browser run.'
  - at: '2026-10-31T04:10:00Z'
    actor: {role: checker, session: o047-recheck-20261031}
    kind: rechecked
    note: 'C-127 NEEDS WORK. Repair proven for the named error: planet with orbit line, fitOrbit or both, before 1950, straddling 1950 and after 2045, series loaded or not, all give out-of-span naming the planet and 1950-01-01 to 2045-01-01; exact 1950-2045 edges resolve. Regression: with the planet series loaded, a plain planet (no orbit, no fit) outside the series now throws synchronously from toDefinition() (Scene.#planetRead checks the span up front at api/scene.ts:689/691/699), so mount() throws instead of ready rejecting (CHANGELOG: fails once, as ready rejecting at mount), and npm run check:node-consumer fails 1 of 4 at consumer.test.mjs:44 (deterministic, twice). Repair: keep the span check out of toDefinition so prepare/ready carries the error (or change contract, docs and gate together); add a test that asserts the surface; run check:node-consumer before hand-off.'
    check: C-127
  - at: '2026-10-31T16:00:00Z'
    actor: {role: executor, session: o047-repair2-20261031}
    kind: repair_attempted
    note: 'Out-of-scope repair after C-127, not verified. Owner decision: report it when the viewer loads. toDefinition setup reads (fit, early Sun paths, clump groups) now go through Scene.#deferredRead, which keeps the #planetRead choke point but records an out-of-span failure and returns an empty fallback; prepare rejects with the recorded error first, so the named out-of-span (planet, years) always arrives through prepare/ready, never thrown from toDefinition or mount. dataSpans.test.ts now asserts toDefinition does not throw and prepare rejects (twice) for plain, orbit and fitOrbit, before 1950, straddling and after 2045, series not loaded then loaded. Proof Needed and neighbours re-run: lint, typecheck, build, npm test, check:node-consumer 4/4 pass; no browser run.'
---

# I-110: Moon data starts in 2010, so historical flybys cannot show their moons

## Summary

Every moon package covers only 2010-01-01 to 2030-01-01, so a mission before 2010 (Voyager 1 at Jupiter, March 1979; at Saturn, November 1980) cannot place the moons it passed. The README does not state each package's years, and a scene whose time falls outside a package's span gives no clear error.

## Evidence

- Confirmed: `data/*-moons/index.json` `span` is `{fromUtc: 2010-01-01, toUtc: 2030-01-01}` in astraeus-data-jupiter, -saturn, -mars, -uranus, -neptune and -pluto (0.4.0 tree, 2026-10-31).
- Related: the bundled planet series starts 1969-01-01 (I-103), so a span reaching back to 1957 would also need the planets extended.
- Reporter's fix: extend the moon packages back to at least 1957, for the main moons at least; or let an app supply its own moon positions (a catalogued moon placed from sampled states about its planet, keeping its picture, size and enlargement). State each span in the README; clear error outside it.

## Proof Needed

- A scene at 1979-03-05 shows Io, Europa, Ganymede and Callisto, and one at 1980-11-12 shows Titan, Mimas, Enceladus, Tethys, Dione and Rhea, placed within each package's stated accuracy (or from app-supplied states, keeping the catalogued look).
- The README package table states each package's span; a scene time outside a loaded span fails once with a named error saying which package and span.
