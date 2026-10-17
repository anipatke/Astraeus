# Spike 03 Extension — Reusable Metric Visuals

Owner brief, 2026-10-09. Extends `docs/ASTRAEUS_SPIKE_03_BRIEF.md`; planned as T-022 in O-005.

Introduce a small, reusable library of **Metric Visuals** to reduce text-heavy UI and improve Astraeus's scientific storytelling.

## Objective

Common astronomical measurements should have a consistent, recognisable visual treatment across experiences.

**The number is primary. The visual provides context.**

These are compact scientific readouts, not elaborate dashboards or decorative gauges.

## Initial metric types

| Metric | Default treatment |
|---|---|
| Speed | Numeric value + compact radial arc |
| Distance | Numeric value + proportional bar or reference markers |
| Relative distance | Numeric value + simple relationship between two objects |
| Altitude | Numeric value + body/horizon indicator |
| Progress | Percentage or value + journey progress line |
| Phase | Illumination percentage + phase glyph |
| Uncertainty | Numeric range or ± value + subtle range band |
| Coordinates | Numeric coordinates + coordinate-system-specific glyph |

Coordinates must support different reference systems where appropriate, including latitude/longitude, right ascension/declination and XYZ. Clearly identify the reference body, frame and units.

Do not introduce a generic direction indicator. Direction in 3D space requires a reference frame or target. Specific angular relationships can be introduced later.

## Design principles

1. **Numbers first.** Values and units must always be immediately readable.
2. **Simple visuals.** Minimal shapes, restrained colour, no unnecessary animation.
3. **Meaningful context.** Bars and gauges require a meaningful reference or range. Never invent a maximum just to fill a dial.
4. **Consistent grammar.** The same metric type should look recognisably similar across experiences.
5. **Optional by design.** Experiences select which metrics to display. No metric is mandatory.
6. **Scientifically honest.** Preserve units, coordinate frames, reference bodies and uncertainty.
7. **Compact and responsive.** Indicators should work in small panels, overlays and mobile layouts without competing with the 3D canvas.

## Architecture

- Metric Visuals belong in the reusable Astraeus presentation/UI layer.
- They consume values from existing scientific state or experience-provided data.
- They must not modify scientific state or duplicate scientific calculations.
- Experiences configure metric type, value, units and relevant reference information.
- Avoid Apollo-specific logic or a general-purpose charting framework.
- Allow a simple numeric-only fallback when a meaningful visual representation is unavailable.

## Implementation approach

1. Review the existing Spike 03 UI and identify text-heavy measurements that would benefit.
2. Build 3–4 representative indicators first, using Apollo as the test experience.
3. Establish a consistent visual style, sizing and configuration pattern.
4. Validate that each indicator improves comprehension rather than adding decoration.
5. Extend to the remaining metric types only where there is a demonstrated need.
6. Document the reusable components and configuration contract.

## Success criteria

- Numeric measurements are immediately understandable.
- Visuals add meaning without requiring explanatory text.
- The interface feels less text-heavy.
- Indicators remain optional and configurable.
- The same components can be reused in Perseids and future Astraeus experiences without modification.

**Keep this within Spike 03's existing scope.** Do not redesign the UI shell or create a separate visualisation framework. The goal is a small, polished vocabulary of reusable scientific indicators.
