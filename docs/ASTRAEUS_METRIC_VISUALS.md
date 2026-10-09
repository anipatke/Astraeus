# Astraeus Metric Visuals

Reusable, numbers-first measurement readouts for Astraeus experiences (T-022, O-005). Brief: `docs/ASTRAEUS_SPIKE_03_METRIC_VISUALS_BRIEF.md`.

**The number is primary. The visual provides context.** A visual is drawn only against a real reference. Without one, the readout falls back to the number and unit alone.

## Components

| File | Job |
|---|---|
| `src/shell/metrics.ts` | The configuration contract (`Metric` and its variants) and pure helpers that map values onto shapes (`speedGauge`, `distanceScale`, `progressScale`, `relationGlyph`, `altitudeGlyph`, `uncertaintyBand`, `phaseVisual`, `litDiscPath`). `metricReadings` gives the headline numbers and `metricNotes` the caption lines; both the screen and the text alternative (`describeMetric`) use them, so the wording has one source. |
| `src/shell/MetricVisual.tsx` | `<MetricVisual metric={…} />`: label, then the value and unit, then the small visual, then the context line and the reference caption. |
| `src/shell/style.css` (`.metric*`) | Shared sizing, type scale and palette. The value is monospace cream, the gauge fill is the accent orange, reference marks are lavender and the lit phase area is pale cream. |

The shell holds no mission names (checked by the `src/shell` naming test in `tests/timeline.test.ts`). The components never read or change scientific State; the experience passes values in.

## Configuration contract

Every metric has an `id`, a `label`, an optional `context` (frame, centre or basis shown under the value) and an optional `unavailable` text shown when the value is `null`.

| `kind` | Value fields | Visual, and when it is drawn | Numeric-only when |
|---|---|---|---|
| `speed` | `value`, `unit`, `digits` | Radial arc over `range: { min, max, basis, digits? }`. A value outside the range pins the arc and the text says "outside that range". | No `range`, `max ≤ min` or `value` is `null` |
| `distance` | `value`, `unit`, `digits`, `origin?` | Proportional bar from `origin` to the largest of the value and the `markers: [{ label, value }]`, with a labelled tick per marker. | No markers or `value` is `null` |
| `relative-distance` | `value`, `unit`, `digits`, `from`, `to` | Target disc with the object's dot at the true gap in target radii, up to 6 radii; farther gaps are drawn broken. The caption gives the gap in radii. | No `targetRadius` or `value` is `null` |
| `altitude` | `value`, `unit`, `digits`, `body`, `datum` | Curved horizon of the body with the object above it at its height in body radii (one radius shown, broken beyond). Negative values sit at the horizon and the caption says "below". | No `bodyRadius` or `value` is `null` |
| `progress` | `value`, `total`, `unit`, `digits`, `startLabel?`, `endLabel?` | Journey line from 0 to `total` with milestone `markers`. The headline is the percentage; the caption gives value of total. | `total ≤ 0` or `value` is `null` |
| `uncertainty` | `value` (± half-width), `unit`, `digits` | Band centred on the value, as wide as the half-width relative to `scale: { max, basis }`, the largest half-width in the same data. | No `scale` or `value` is `null` |
| `phase` | `fraction` (0–1) | Phase glyph when `litLimb: "left" \| "right"` is given; otherwise a 0–100% band. | `fraction` is `null` |
| `coordinates` | `system` (`xyz`, `radec` or `latlon`), `components` (label, value, unit, digits each), `frame`, `origin`, `planViews?` | With `planViews` (XYZ only), a radar-style round top view (x–y, origin at the centre, reference dots) plus a slim z tick on the same scale; the rim is the largest planar distance or \|z\| among the object and references. Otherwise a static symbol per system (axes, celestial sphere, globe), which labels the system and shows no direction. One reading row per component; the caption names the system, frame and origin. | `components` is `null` |

Rules for the reference fields:

1. **Never invent a maximum.** `range` and `markers` must come from State or published data, and `basis` says which. A gauge with nothing honest to span stays numeric-only.
2. **Same centre and frame.** A marker must be measured from the same centre and in the same frame as the value. Apollo's `referenceInSameFrame` returns no marker otherwise.
3. **No guessed sides.** Which limb of the Moon looks lit depends on the observer. Without `litLimb` the phase readout uses the band, never a glyph.
4. **Text carries everything.** Each visual is an `svg role="img"` whose label (`describeMetric`) states the value, unit, context and references, so nothing depends on colour, shape or hover.

## Apollo configuration

Built in `src/app/metricReadouts.ts` from existing State:

| Readout | Metric | Reference |
|---|---|---|
| Spacecraft range | `distance` from Earth centre · EQJ | The Moon's current distance from the same centre and frame ("Moon now") |
| Spacecraft speed | `speed`, inertial relative to Earth centre · EQJ | 0 to the vehicle's peak speed at NASA source anchors (Columbia 11.0 km/s at entry interface; Eagle 2.7 km/s). Anchors, not reconstructed samples: the accepted post-TLI join spike (I-008, about 73.5 km/s) would otherwise set the top of the gauge. At that moment the arc pins and says the value is outside the range. |
| Earth–Moon distance | `distance`, numeric-only | No meaningful reference (perigee and apogee are not in the data) |
| Rendered separation | `distance` in scene units, numeric-only | Diagnostic of the render mapping, not a physical scale |
| Lunar illumination | `phase`, band | The core gives the geometric fraction seen from Earth's centre but not the lit side, so no glyph |
| Spacecraft distance to Moon | `relative-distance`, centre to centre · EQJ | Moon radius (`MOON.radiusKm`). Only when the Moon state shares the spacecraft's centre and frame. |
| Spacecraft altitude | `altitude` above the mean radius of whichever of Earth and the Moon is nearer to the surface | `EARTH.radiusKm` or `MOON.radiusKm`. Mean radius, not terrain: Eagle on the surface reads within a few km of zero, not exactly zero, because the local surface is not the mean radius (see also I-004's landing-site offset). |
| Spacecraft position discrepancy | `uncertainty` | The reconstruction's own per-segment figure from the generated data: a coast's largest smoothing correction or a burn's modelled cutoff miss against the NASA anchor. Segments without a published figure (parking orbit, powered descent, surface hold, ascent) read "not published" and say why. The band compares with the vehicle's largest published figure. These are disclosed discrepancies, not statistical uncertainty. |
| Spacecraft position | `coordinates`, XYZ in EQJ from Earth centre, radar view | The State vector; the Moon as a reference dot and tick when it shares the centre and frame |
| Moon position | `coordinates`, XYZ in EQJ from Earth centre, radar view | Replaces the "Moon position" row in the advanced readouts |
| Journey | `progress` from the first to the last event (lift-off → splashdown) in hours | Every timeline event as a milestone |

## Reuse outside Apollo

`tests/metricVisuals.test.ts` › `metric visuals reuse outside Apollo` renders a meteor-shower fixture through the same components without modification. It covers entry speed against the bound-meteoroid speed limits, height against the Kármán line, the Moon with a known lit limb (glyph), a numeric-only comet distance, the radiant in right ascension and declination, and the shower's activity window as progress.

## Deferred

| Item | Need that would justify it |
|---|---|
| Phase glyph for the Moon from Earth | A lit-limb side for a stated observer, which the core does not provide. |
| RA/Dec or latitude/longitude for Apollo objects | Frame conversions the core does not provide; the contract and glyphs already support both systems. |
| Statistical uncertainty | Per-value uncertainty in State or data. Apollo publishes per-segment discrepancies, shown as such (see I-003). |

## Why a radar view for direction

The brief rules out a generic 3D direction indicator. An oblique arrow on drawn axes was tried and rejected: on a flat glyph, "up" and "toward the viewer" look alike. Instrument panels instead split 3D into flat readings against fixed references, such as plan and elevation views, radar PPI plus height, or two angles. Two full-size top and side views were also tried and judged too large. The radar view keeps the plan view and reduces the side view to the one number that matters, height above or below the x–y plane.
