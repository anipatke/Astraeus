# Astraeus Metric Visuals

Reusable, numbers-first measurement readouts for Astraeus experiences (T-022, O-005). Brief: `docs/ASTRAEUS_SPIKE_03_METRIC_VISUALS_BRIEF.md`.

**The number is primary. The visual provides context.** A visual is drawn only against a real reference. Without one, the readout falls back to the number and unit alone.

## Components

| File | Job |
|---|---|
| `src/shell/metrics.ts` | The configuration contract (`Metric` and its variants) and pure helpers that map values onto shapes (`speedGauge`, `distanceScale`, `phaseVisual`, `litDiscPath`), plus the text alternative (`describeMetric`). |
| `src/shell/MetricVisual.tsx` | `<MetricVisual metric={…} />`: label, then the value and unit, then the small visual, then the frame/context line and the reference caption. |
| `src/shell/style.css` (`.metric*`) | Shared sizing, type scale and palette. The value is monospace cream, the gauge fill is the accent orange, reference marks are lavender and the lit phase area is pale cream. |

The shell holds no mission names (checked by the `src/shell` naming test in `tests/timeline.test.ts`). The components never read or change scientific State; the experience passes values in.

## Configuration contract

Every metric has an `id`, a `label`, an optional `context` (frame, centre or basis shown under the value) and an optional `unavailable` text shown when the value is `null`.

| `kind` | Value fields | Visual, and when it is drawn | Numeric-only when |
|---|---|---|---|
| `speed` | `value`, `unit`, `digits` | Radial arc over `range: { min, max, basis, digits? }`. A value outside the range pins the arc and the text says "outside that range". | No `range`, `max ≤ min` or `value` is `null` |
| `distance` | `value`, `unit`, `digits`, `origin?` | Proportional bar from `origin` to the largest of the value and the `markers: [{ label, value }]`, with a labelled tick per marker. | No markers or `value` is `null` |
| `phase` | `fraction` (0–1) | Phase glyph when `litLimb: "left" \| "right"` is given; otherwise a 0–100% band. | `fraction` is `null` |

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

## Reuse outside Apollo

`tests/metricVisuals.test.ts` › `metric visuals reuse outside Apollo` renders a meteor-shower fixture through the same components without modification. It covers entry speed against the bound-meteoroid speed limits, height against the Kármán line, the Moon with a known lit limb (glyph), and a numeric-only comet distance.

## Deferred types

Built only when an experience shows the need:

| Type | Need that would justify it |
|---|---|
| Relative distance | A story comparing two objects' separation where a bar from one origin misleads (for example spacecraft–Moon during lunar orbit). |
| Altitude | A body-relative height with a defined surface reference (needs body radius and a surface model, which the core lacks for spacecraft). |
| Progress | A journey whose progress is not already shown by the timeline bar. |
| Uncertainty | Per-value uncertainty in State or data. Today Apollo publishes residuals per segment, not per value (see I-003). |
| Coordinates | A viewer-facing need for latitude/longitude, RA/Dec or XYZ beyond the developer readouts; each needs its frame, reference body and units. |
| Phase glyph for the Moon from Earth | A lit-limb side for a stated observer, which the core does not provide. |
