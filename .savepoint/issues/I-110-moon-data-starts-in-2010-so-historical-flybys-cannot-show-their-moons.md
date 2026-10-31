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
