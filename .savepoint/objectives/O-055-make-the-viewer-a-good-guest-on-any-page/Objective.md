---
id: O-055
title: Make the viewer a good guest on any page
status: planned
depends_on: [O-054]
release: G-016
priority: high
---

# O-055: Make the viewer a good guest on any page

## Outcome

Several viewers work on one page and a viewer rebuilt with a new scene loads what it needs (no missing moons); the viewer no longer styles the host page's `html`, `body` or `#app`, scopes every style under its root class and uses no fixed ids; the Developer drawer is hidden unless a host asks (API-03; review F1, F3; owner D8, D9).

## Why

G-016 chunk 3. The review proved moon data loads once per page (F1), and `style.css` restyles the host page while generic classes and fixed ids clash with a host or a second viewer (F3).

## Success Conditions

Detailed when this Objective is planned. Named outcomes: incremental moon-chunk loading with a load-twice test; a two-viewers-on-one-page test; scoped CSS and generated ids; `developerTools` option (site passes it on); migration notes for the page-style and drawer changes; the O-053 isolation allowlists emptied.

## Architectural Considerations

Page-wide module state (moon chunks, pictures, planet series) becomes per-load or per-viewer without changing State (ARCH-02).

## Boundaries

**In scope:** F1, F3, D8, D9.

**Out of scope:** renames (O-057); settings API (O-056).
