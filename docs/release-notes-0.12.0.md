# Astraeus 0.12.0

## astraeus 0.12.0 (2026-11-25)

Follow-ups from the asteroid-belt app on 0.11.0: a chart can no longer take the viewer down, a long chart axis label wraps, group names sit on their dots, and hosts decide which groups are named and can place their own tappable labels. A minor bump because of the new error code `bad-label` (below, with its migration); the `astraeus-data*` packages' `astraeus` peer moves to `>=0.12.0 <0.13.0`.

First download of the packed example (`npm run measure:example`): 1,845,916 bytes raw, 529,465 bytes gzip (code and styles loaded on first open), against 1,833,863 raw and 525,880 gzip at 0.11.0 (+12,053 raw, +3,585 gzip; the owner raised the engine caps by the measured amounts).

- Fixed: a `chart` whose mark labels sit at a row boundary no longer loops and takes the viewer down ("Maximum update depth exceeded"): labels are measured once for their text and font, then placed.
- Fixed: a shelf part that fails now shows "This part could not be drawn." in its own place and is reported to the page (`reportError`); before, the whole viewer unmounted.
- Fixed: a `chart`'s long `axisLabel` now wraps inside its panel (it was one line, cut off on both sides); the chart is a few units shorter, as the label sits under it.
- Added: `addGroup` takes `showLabel`, as `addBody` does: `false` starts the group's name hidden, and the Labels switch can show it.
- Added: `scene.addLabels` places the host's own labels, on a point or on the dots of one or more groups; a tap selects a group, several groups together (with the host's card) or opens a panel. Labels join the one overlap and priority rule.
- Added: a label that selects several groups is a selection of its own: `handle.setSelected(<label id>)`, `selected` and `onSelect` take its id, the camera frames the groups' dots together and the card shows the label's text and the host's `description`, `provenance` and `knownLimitations`.
- Fixed: a point group's name now sits on its dots (the dot nearest the dots' mean direction from their centre, or on a ring where it crosses the vernal-equinox direction) and follows them, instead of at their centroid, where a ring round the Sun was named at the Sun. A story marker on a group moves with it. The camera still focuses on the centroid.
- Added: the labels `addLabels` places are drawn in the viewer: on their point or on their groups' dots, following them as time moves; a group a label is anchored on draws no name of its own (it stays listed and selectable); the Labels switch and `?labels=<labelId>:off` turn a label off and on.

### Breaking changes (with migration)

- `SceneErrorCode` has a new code, `bad-label` (bad input to `addLabels`). Migration: a `switch` over `SceneErrorCode` needs the case; code that does not switch on codes needs nothing.

Full details: `packages/astraeus/CHANGELOG.md`.

## astraeus-data 0.12.0

No changes to the pictures, data or package code. Released with `astraeus` 0.12.0 to keep the version numbers together; every `astraeus-data*` package's `astraeus` peer moves to `>=0.12.0 <0.13.0`.
