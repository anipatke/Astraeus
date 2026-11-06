---
id: O-057
title: Make names and shapes consistent for 0.8.0
status: in_progress
depends_on: [O-059]
release: G-016
priority: high
---

# O-057: Make names and shapes consistent for 0.8.0

## Outcome

Names, units, spans, time inputs and frame fields follow API-04; story panels are typed, checked at the call and take `Provenance`; `addStoryPanels` appends; internals stop leaking through `Scene` (`toDefinition` removed, `SceneCamera` type-only, `RateSource` resolved); Swift-Tuttle moves to the showers demo; groups must state their `plane`; old names are removed outright, no aliases (owner, 2026-11-01: "we only have two apps built from this, so we can afford to break and re-work them now", replacing D2's aliases); one CHANGELOG migration table covers every change in 0.8.0, with notes for the Voyagers and showers apps (`toDefinition`, `swift-tuttle`, every rename) (review F4, F5, F7, F12; owner D2 revised, D3, D5, D10).

## Why

G-016's breaking chunk, last so every replacement exists first (after O-059 so the planets demo and site's new public features are renamed with everything else). After it, 0.8.0 can be released.

## Success Conditions

- **Clean-break renames.** `MoonPositions.center`; pacing spans `{ start, end, rate }` with `rampSeconds` and `near.withinSeconds`; `camera.focus` replaces `camera.lookAt`; a view lists one `objects` list instead of `paths` and `bodies`; `labelReachEarthRadii` and `camera.reachEarthRadii`; `handle.timeUtcMs`, `ViewerChange.timeUtcMs` and `EventZoneChange.timeUtcMs`; `ElementsBodyRecord.plane`. No alias code exists for any of them.
- **Story panels.** Typed `StoryPanelInput`, no `unknown`; shape errors throw at `addStoryPanels`, while links to events, anchors and objects are checked at `check` and `mount`, as event objects are; `at.time` takes `TimeInput`; each panel takes `provenance` in place of `badge` and `sources`; `addStoryPanels(list)` appends and a repeated id throws `duplicate-id`; `setStoryPanelPlayback({ pauseSeconds, autoOpen })` replaces that setting. Every Apollo and showers panel carries an honest accuracy and notes.
- **Internals stop leaking.** `toDefinition` and `missingData` are gone from `Scene`; `SceneCamera` is a type-only export; `RateSource` is dropped from the root (nothing public returns it). The node and React consumer checks use only public calls.
- **Swift-Tuttle.** The engine catalogue holds the Sun, planets, dwarf planets and moons only, a test says so, and the showers demo adds the comet through `addBodyFromElements` with positions proved against the old built-in ones.
- **Groups state their `plane`.** A group without one throws `bad-group`.
- **Old names fail clearly.** A plain JavaScript caller who passes an old input name gets a `SceneError` naming its replacement, from one table.
- **Checks.** Every `removedBy: O-057` entry is gone from the `apiTypeLint` and `apiOutsideTypes` allowlists; the planets demo and site stay at 0 deep imports, and no deep-import count rises.
- **Docs.** One CHANGELOG migration table covers every change in 0.8.0, with notes for the Voyagers and showers apps; the README and API reference are regenerated.
- **Same look.** One fresh `npm run check:browser` passes, and the owner approves the demos and site on `localhost:5490`, panel badges included.

## Owner Decisions (2026-11-07)

- API-04 spans bind inputs only: what a caller gives is `{ start, end }`, and what the engine reports stays flat unit-named numbers such as `windowStartUtcMs` (owner "Rule covers inputs only"; settles the tension noted at T-260).
- The reported time becomes `timeUtcMs` (owner "Rename to timeUtcMs").
- A panel's `provenance` fully replaces `badge` and `sources`; every panel gains accuracy and notes, and the badge may also read Ephemeris or Reconstructed (owner "Replace badge and sources").
- The two panel settings move to their own `setStoryPanelPlayback` call (owner "Separate set call").
- The planets demo's whole-definition compare against `fixtures/planet-views-before.json` is retired, because it needs internals and its job of proving the O-059 rebuild is done; a smaller test keeps what public reads can see, and info card rows, camera presets and label ranking lose nine-planet test cover (owner "Retire it, keep public parts", 2026-11-07, during T-274).
- Design confirmed by the owner, 2026-11-07, session o057-planning-20261107.

## Architectural Considerations

ARCH-01 catalogue rule (Sun, planets, dwarf planets, moons only); no alias code: an old name fails with a `SceneError` naming its replacement only where the type system cannot catch it (plain JavaScript callers). That covers input fields, which would otherwise be ignored silently; a removed method already fails loudly, and a renamed read is covered by the migration table. `Scene` keeps its assembly internal through a helper that is not exported from the root, so engine tests keep their reach without a public method. A type declared in `core/` and named at the root is public, not a leak (ARCH-04 keeps it in `core/`), so `apiOutsideTypes` narrows to types the root reaches but does not name.

## Boundaries

**In scope:** F4, F5, F7, F12, D2, D3, D5, D10.

**Out of scope:** publishing; changes inside the Voyagers and showers apps (their migration follows the table, after 0.8.0 is out).
