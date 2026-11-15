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

To be settled in this Objective's design interview (setting shape, where it lives, default unchanged UTC).

## Architectural Considerations

Display only (ARCH-02): times in the API stay UTC milliseconds. One formatter shared by clock bar, slider `aria-valuetext`, bounds and event rows. A public setting with a default (API-06).

## Boundaries

**In scope:** a time-zone and precision setting for the viewer's time display.
**Out of scope:** host-supplied formatter functions unless the interview chooses one; story panel text.
