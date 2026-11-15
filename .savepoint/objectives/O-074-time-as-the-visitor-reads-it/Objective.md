---
id: O-074
title: Time as the visitor reads it
status: planned
depends_on: [O-073]
release: G-020
priority: medium
rank: 2
---

# O-074: Time as the visitor reads it

## Outcome

A host can have the viewer's clock bar, slider text and event list read in the visitor's time zone (or a named zone) and to a chosen precision such as the date only, through one public setting.

## Why

G-020, Zodiac review F-11 and F-19: every time is shown as UTC ISO text (`formatUtcTimestamp` in `src/shell/timelineModel.ts`), so an app clipped the engine's internal markup with CSS to show dates only.

## Success Conditions

- `scene.setLook` and `handle.setLook` take `time: { zone?, precision? }`; `handle.look.time` reads it back filled in (`{ zone: "UTC", precision: "second" }` by default), and a live `setLook` changes the text at once.
- `zone` is `"UTC"`, `"local"` (the visitor's own zone) or an IANA zone name (for example `"Australia/Sydney"`); `precision` is `"day"`, `"minute"` or `"second"`. An unknown zone or precision throws `bad-look`.
- With no `time` look, or `zone: "UTC"` at `precision: "second"`, every time reads exactly as in 0.9.1 (ISO UTC text such as `2026-11-15T04:37:10Z`). `"UTC"` at a coarser precision keeps the ISO shape cut short (`2026-11-15`, `2026-11-15T04:37Z`).
- `"local"` or a named zone reads in the visitor's language style through `Intl.DateTimeFormat` with the zone's short name (for example `15 Nov 2026, 3:37 pm AEDT`); `"day"` shows the date only.
- One formatter is used by the clock bar, the slider `aria-valuetext`, the start and end bound dates, the event list rows, and the event and shower window info cards (subtitle, Starts, Ends, Peak). `<time dateTime>` attributes stay machine ISO UTC.
- README (`setLook` row, `handle.look` row), CHANGELOG `Unreleased`, API surface lock updated; configured gates pass.
## Architectural Considerations

Display only (ARCH-02): times in the API stay UTC milliseconds. One formatter shared by clock bar, slider `aria-valuetext`, bounds, event rows and info cards. A public setting with a default (API-06); like `labels` (O-073), it has no page address parameter and no Developer drawer control, so the address mapping is unchanged. The look spec table (`src/app/look.ts`) and `resolveLook` own checking; `lookReadOf`/`applyLook` (`src/app/liveLook.ts`) own read-back and live change.

## Design Decisions (owner, 2026-11-15, session plan-o074-20261115)

- D1 Where: part of the looks (`setLook` / `handle.look`), not a new call. Owner: "Part of looks".
- D2 Text style: a visitor's or named zone reads in the visitor's language style (`Intl`), not a fixed number style. Owner: "Visitor's language style". Planner consequence: `"UTC"` keeps today's ISO text so the default is unchanged and a read-back look round-trips through `setLook` without changing the text.
- D3 Precision: `"day"`, `"minute"`, `"second"`. Owner: "Day, minute, second".
- D4 Places: clock bar, slider text, bounds, event list and event/window info cards; the Developer drawer and the page address stay UTC. Owner: "Bar, list and info cards".
- Not chosen: host-supplied formatter functions; story panel text.

## Boundaries

**In scope:** a time-zone and precision look for the viewer's time display; its README, CHANGELOG, lock and tests.

**Out of scope:** host-supplied formatter functions; story panel text; the Developer drawer's UTC readout; the page address `t` and any new address parameter; times inside the API.
