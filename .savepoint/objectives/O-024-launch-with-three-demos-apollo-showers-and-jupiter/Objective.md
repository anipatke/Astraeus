---
id: O-024
title: Launch with three demos — Apollo, Showers and Jupiter
status: planned
depends_on: [O-020]
release: G-005
---

# O-024: Launch with three demos — Apollo, Showers and Jupiter

## Outcome

The site offers three demos. The Perseids and the Geminids become one Showers demo with a switch between them; the Earth–Moon demo is removed; the home page shelf, page titles and links show the three.

## Why

Owner, 2026-10-18 (G-005 Launch Definition of Done): "we combine the Perseids and Geminis into a single demo and the user can switch between them. This will be the showers demo ... Drop earth and moon, it's covered by Apollo."

## Confirmed Decisions (owner, 2026-10-18)

1. One Showers demo with a switch between the Perseids and the Geminids; each shower keeps its data, story panels, settings and checks.
2. Earth–Moon is removed, with its three stories (text stays in history).
3. Old addresses (`?experience=shower-perseids`, `shower-geminids`, `earth-moon`) are not redirected; the owner updates the portfolio at launch.

## Success Conditions

1. One address opens the Showers demo; the switch (in the top bar, shared control styles) changes shower without a page reload where practical, loading only the chosen shower's data; the chosen shower is in the view link.
2. Earth–Moon's experience, story file and checks are removed; nothing else breaks (engine parts it used stay).
3. Home page shelf, catalogue links and page titles show three demos; the picture baseline and contact sheet cover the three.
4. Browser checks through the shared driver cover the switch both ways, desktop and phone; full run passes; owner look.

## Boundaries

**In scope:** the Showers switch, removing Earth–Moon, shelf and links.

**Out of scope:** redirects for old addresses; new shower data; Jupiter (O-025).
