---
id: O-024
title: Launch with three demos — Apollo, Showers and Jupiter
status: done
depends_on: [O-020]
release: G-005
exception: {requirements: [design-reconciliation], reason: 'Owner accepted the two-sentence Design.md fix for I-042 without a further independent re-check ("no mark it checked, it was two lines, we arent doing the whole thing over again"). Recorded by the agent on direct instruction; not a technical CLEAR.', owner: owner-chat-20261019, recorded_at: '2026-10-19T11:10:00Z', check: C-082}
---

# O-024: Launch with three demos — Apollo, Showers and Jupiter

## Outcome

The site offers three demos. The Perseids and the Geminids become one Showers demo with a switch between them; the Earth–Moon demo is removed; the home page shelf, page titles and links show the three.

## Why

Owner, 2026-10-18 (G-005 Launch Definition of Done): "we combine the Perseids and Geminis into a single demo and the user can switch between them. This will be the showers demo ... Drop earth and moon, it's covered by Apollo."

## Confirmed Decisions (owner, 2026-10-18)

1. One Showers demo with a switch between the Perseids and the Geminids; each shower keeps its data, story panels, settings and checks.
2. Earth–Moon is removed, with its three stories (text stays in history).
3. **Start date** (owner, 2026-10-18): the Showers demo starts on **21 September 2019** ("Date my daughter was born") and runs a year, so the Geminids' peak (December 2019) and the Perseids' peak (August 2020) both fall inside it.
4. Old addresses (`?experience=shower-perseids`, `shower-geminids`, `earth-moon`) are not redirected; the owner updates the portfolio at launch.

## Success Conditions

1. One address opens the Showers demo; the switch (in the top bar, shared control styles) changes shower without a page reload where practical, loading only the chosen shower's data; the chosen shower is in the view link.
2. Earth–Moon's experience, story file and checks are removed; nothing else breaks (engine parts it used stay).
3. Home page shelf, catalogue links and page titles show three demos; the picture baseline and contact sheet cover the three.
4. Browser checks through the shared driver cover the switch both ways, desktop and phone; full run passes; owner look.

## Design Confirmation

The outcome, decisions and success conditions above come from the owner's launch definition and answers on 2026-10-18; the owner then said "please proceed and I will review when back". Tasks: T-091 (combine and switch), T-092 (21 September 2019 year), T-093 (remove Earth–Moon, three demos on the home page, addresses, baseline).

## Notes for planning

- Each shower's peak, activity window and story panel times move into the new year from published values (IMO/AMS peak times for 2019 and 2020; Phaethon's and Swift–Tuttle's positions from JPL for those dates); the panel tests that pin times are updated.
- The meteor orbits were measured by the Global Meteor Network in 2025; shown in 2019–2020 they stay what they already are, a measured shape with illustrative positions, and the details say the measurement year.

## Boundaries

**In scope:** the Showers switch, removing Earth–Moon, shelf and links.

**Out of scope:** redirects for old addresses; new shower data; Jupiter (O-025).
