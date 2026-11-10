# Astraeus 0.8.1

## astraeus 0.8.1 (2026-11-10)

First download of the packed example (`npm run measure:example`): 1,720,047 bytes raw, 493,478 bytes gzip (code and styles loaded on first open), against 1,716,429 raw and 492,249 gzip at 0.8.0. The planet data is a lazy chunk and not part of that total.

A patch on 0.8.0: host calls that behave the way their docs say, and planets from JPL Horizons. Nothing that existed changed shape: no call, type or error code was renamed or removed, and no migration is needed. The eight packages move together to 0.8.1; `astraeus-data*` still peers on `astraeus` `>=0.8.0 <0.9.0`.

### What changed for app makers

- **Host-call order.** One written rule (README, "Host calls"): after `ready` every call takes effect or throws, in call order, last call wins. A `setCamera` made before the first frame is applied after the opening view, and one made inside an `onChange` report of a view switch is applied after the view's own camera rule. Before, both were lost.
- **`always: true` on a view's camera.** A view's `camera` framing `{ follow: id }` or `{ focus: id }` accepts `always: true`, which applies it on every switch to that view, also when the camera follows an object both views show. Without it a view behaves as before.
- **`setSelected(id | undefined)`** on the viewer handle (`mount` and `AstraeusScene`) selects an object the showing view shows, or clears the selection. `onSelect` hears it with `cause: "host"`. An unknown or hidden id throws the new error code `bad-selection`.
- **Host `setTime` and story panels.** A host `setTime` counts as a seek, as a visitor's slider seek does: a jump across a panel's time while playing no longer opens the panel.
- **Planets from JPL Horizons.** Every planet's position now comes from Horizons (DE441 with each planet's satellite ephemeris), not VSOP87A. A planet with a moon system adds its own offset from its barycentre when its moon package is loaded, so it sits on Horizons' planet centre. Measured across 1972 to 2044, within 0.6 km with the package; without it a planet sits at its barycentre (up to 304 km from its centre, Saturn). Planets move by these amounts from 0.8.0, so a scene that pinned planet positions sees them change. `planets.json` shrinks from 432,063 to 348,839 bytes.
- **README.** An event has one zone, as wide as its widest pacing rule ("Event zones").

Voyager closest approaches, error against Horizons' planet centre (with the moon package):

| Planet | Date (UTC) | 0.8.0 | 0.8.1 |
|---|---|---:|---:|
| Jupiter (Voyager 1) | 1979-03-05 | 755 km | 0.24 km |
| Jupiter (Voyager 2) | 1979-07-09 | 629 km | 0.22 km |
| Saturn (Voyager 1) | 1980-11-12 | 1,629 km | 0.31 km |
| Saturn (Voyager 2) | 1981-08-26 | 1,790 km | 0.11 km |
| Uranus (Voyager 2) | 1986-01-24 | 6,314 km | 0.20 km |
| Neptune (Voyager 2) | 1989-08-25 | 13,338 km | 0.27 km |

Over 1950 to 2044 Neptune's worst error was 43,747 km; from 1972 with its package it is within 0.6 km.

### Upgrading

Install every `astraeus-data*` package at 0.8.1 with `astraeus` 0.8.1. No code change is needed. Only a scene or test that pinned planet positions needs new numbers.
