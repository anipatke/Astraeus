# Astraeus 0.12.1

## astraeus 0.12.1 (2026-11-27)

A fix from the asteroid-belt app on 0.12.0: labels on moving point groups glide with their dots. A patch: no public name, type or default changed; the `astraeus-data*` packages' `astraeus` peer stays `>=0.12.0 <0.13.0`.

First download of the packed example (`npm run measure:example`): 1,845,723 bytes raw, 529,235 bytes gzip (code and styles loaded on first open), against 1,845,916 raw and 529,465 gzip at 0.12.0 (-193 raw, -230 gzip).

- Fixed: a label on point groups (a group's own name, or `scene.addLabels` with `anchor: { groups }`) glides with its dots instead of hopping between them. It used to sit on the single dot nearest the dots' mean direction, chosen again as they moved, so a moving swarm handed it from dot to dot several times a second. It now stands at the dots' mean direction from their centre, at their mean distance, blended between fills as the dots are; a ring keeps its held direction and is named on the ring. No extra per-dot work per frame. Behaviour change: the label is no longer on a real member; no API change, nothing to migrate.

### Breaking changes

None: no public name, type or default changed.

Full details: `packages/astraeus/CHANGELOG.md`.

## astraeus-data 0.12.1

No changes to the pictures, data or package code. Released with `astraeus` 0.12.1 to keep the version numbers together; every `astraeus-data*` package's `astraeus` peer stays `>=0.12.0 <0.13.0`.
