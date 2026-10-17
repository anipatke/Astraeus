# Body packages

One directory per body, imported from Planetary Explorer (the owner's own project, read only) by `tools/import/planetary-explorer.mjs`. The packages are data, never engine code. Every package records the donor commit it was read from. `catalogue.json` lists all bodies, feature counts, the source of each map and any donor oddities the importer noticed (reported, never fixed).

The owner verified the tagged locations visually over months, so they are carried over exactly: latitude and longitude are never rounded, converted, re-derived or corrected, and `tests/bodyPackages.test.ts` proves bit-for-bit equality with the donor.

## Files in `data/bodies/<body>/`

| File | Holds |
|---|---|
| `features.json` | `features`: every donor feature object exactly as held (id, name, featureType, category, latitude, longitude, description, tags, details, and the ring-plane fields ringRadius, ringAngle, moonRadius where the donor has them). Ring-plane features have no latitude or longitude. |
| `categories.json` | `categories`: the donor's category definitions (key, label, colour, isFilterable, alwaysVisible) from the entity config. |
| `overview.json` | `overview`: the donor's body overview (discovery, diameterKm, facts, sources). |
| `map.json` | `textures` (donor path, pixel size, bytes, SHA-256, the donor README entry, per variant); `source` (who recorded the map source, licence, credit); `coordinates` (the convention below). Map images are not copied. |

Each file starts with `format`, `kind`, `body`, `name`, `parent` and `donor.commit`.

## Coordinate convention (`map.json` `coordinates`)

Features are placed by the donor's `latLonToXYZ(lat, lon, radius)` on a Three.js `SphereGeometry`: phi = (phiOffsetDeg - latitude) from +Y, with phiOffsetDeg 90; theta = longitude + thetaOffsetDeg, with thetaOffsetDeg 90; position = (r sin phi sin theta, r cos phi, r sin phi cos theta).

- Stored longitudes are already in the donor's own marker frame for that map. Some bodies use -180..180, others 0..360 (`longitudeRange` gives the actual min and max). Use them unchanged.
- `markerLongitudeFromSource` says how the donor derived a stored longitude from the source (IAU positive-west) value: marker = scale * source + offsetDeg. `null` where the donor states no formula. It is documentation; nothing applies it.
- `textureRecentringDeg` is a picture shift traced against the original mosaic (Ganymede and Ceres: 180). It is a property of the map picture; stored longitudes already account for it, so it is never added again.
- `donorReadmeNote` is the donor's own texture README bullet for the body, verbatim.

## Map sources

`source.recordedBy` is either the donor `public/textures/README.md` (entries copied verbatim into `textures[].donorReadme`) or `tools/import/planetary-explorer-map-sources.json`, for the eight bodies whose donor texture has no README source (Earth, Moon, Jupiter, Uranus, Neptune, Pluto, Charon, Ceres). Those records cite the Astraeus document that traced them. The importer refuses a body with neither. `donorFileShippable: false` (Ceres) means the donor file itself must not be shipped.

## Running

`node tools/import/planetary-explorer.mjs [--dry-run] [--donor <dir>] [--out <dir>]`. It needs Node with built-in type stripping (22.18 or later, or 24) to read the donor's `src/entities/*.ts`. Running it twice on an unchanged donor writes identical files.
