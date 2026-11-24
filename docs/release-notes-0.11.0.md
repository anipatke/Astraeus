# Astraeus 0.11.0

## astraeus 0.11.0 (2026-11-24)

Fixes from the asteroid-belt app's stress test of 0.10.0: group names tap, the phone sheet gets out of the way, panel buttons switch off and on, a viewer without WebGL says so, shelf input is checked evenly, long text and chart labels never clip or overprint, and screen readers hear what changed. A minor bump because the stricter input checks are breaking (below, each with its migration); the `astraeus-data*` packages' `astraeus` peer moves to `>=0.11.0 <0.12.0`.

First download of the packed example (`npm run measure:example`): 1,833,863 bytes raw, 525,880 bytes gzip (code and styles loaded on first open), against 1,832,457 raw and 525,504 gzip at 0.10.1 (+1,406 raw, +376 gzip).

- Added: `ActionsControl.setEnabled(actionId, enabled)` switches one actions button off and on for a viewer (every button starts on). An off button is greyed and disabled; pressing it neither turns the camera nor reaches `onAction`. An unknown action id or a non-boolean `enabled` throws `SceneError` `bad-part` naming the field.
- Fixed: on a phone, pressing a panel button that turns the camera (an `actions` button with a `camera`) now closes the open panel sheet first, so the visitor sees the move. A button with no camera leaves the sheet open, and a wide screen is unchanged. Hosts can drop their own sheet-closing timers.
- Fixed: a tap or click on a point group's shown name now selects the group, exactly as choosing it from the object list does (on a wide screen its card opens, on a phone it selects as a list choice does). Only the name answers, not the dots; a drag that starts on a name still orbits or pans; body names behave as before.
- Fixed: a viewer on a browser or device with no WebGL 2 no longer comes up empty and silent. `mount`'s `ready` rejects with the new `SceneError` code `no-webgl`, an `AstraeusScene` host's `onError` (else the console) hears it, and a short message stays in the viewer's place. `unmount` removes it.
- Fixed: shelf parts refuse blank text, uneven chart bins, marks outside the bins, fractional colour-key counts and an empty key with `bad-part`, in the factories and in `setParagraphs`, `setBins`, `setEntries` and the readout tile's setters alike.
- Fixed: a long word, title, label or note with no spaces now wraps inside its panel (shelf panels, About, cards, the readout tile and story panels) instead of widening the panel and cutting every line off on the right.
- Fixed: `chart` mark labels no longer print over each other: a label that would overlap drops to a further row above the bars, and the chart grows a row taller for each; a chart whose labels fit draws as before.
- Fixed: an `explainer`'s paragraphs are a polite live region: a screen reader hears what `setParagraphs` changes while the explainer is shown; its first draw stays quiet.
- Fixed: a `chart`'s screen-reader summary names the marks it draws ("marks: 5:2 at 2.82, …").
- Fixed: the `readoutTile`'s screen-reader text reads the value as shown and names the line's marks, and a screen reader hears value changes politely, at most once every 2 seconds.

### Breaking changes (each with its migration)

- New code `no-webgl`, and a viewer without WebGL now rejects `ready` (it resolved and drew nothing). A `switch` over `SceneErrorCode` needs the case; catch `ready` or pass `onError`, and drop any watcher for an emptied element.

- Blank (spaces-only) shelf text is refused with `bad-part`: labels, titles, paragraphs, notes, ids and values. Pass real text, or leave an optional field out.
- `chart` and `setBins` refuse bins that overlap or run backwards. Sort bins by `low` and merge overlaps first.
- `chart` refuses a mark outside the bins' range. Drop the mark or widen the bins.
- `colourKey` and `setEntries` refuse a fractional count. Round it (`Math.round`), or put the exact figure in the `note`.
- `colourKey` and `setEntries` refuse an empty list. Leave the key out of the panel until it has a row.

Full details: `packages/astraeus/CHANGELOG.md`.

## astraeus-data 0.11.0

No changes to the pictures, data or package code. Released with `astraeus` 0.11.0 to keep the version numbers together; every `astraeus-data*` package's `astraeus` peer moves to `>=0.11.0 <0.12.0`.
