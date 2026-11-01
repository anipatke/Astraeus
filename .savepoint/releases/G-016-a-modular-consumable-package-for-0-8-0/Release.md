---
id: G-016
title: A modular, consumable package for 0.8.0
status: planned
---

## Outcome

The `astraeus` packages follow written, mechanically checked API rules (Guardrails API-01 to API-07, Design "Public API shape"): one front door, the same abilities from `mount` and React, a viewer that behaves as a good guest on any page (several per page), numbers without a viewer, looks as public settings, standalone event zones, consistent names, units and shapes as a clean break with one migration table for app makers, a scene builder split by concern, and our own planets demo and site built on the public front door. 0.8.0 ships after every member Objective is done; there is no hurry for the outside apps (owner: "lets do this right, no hurry on the app").

## Why

Owner, 2026-11-01, after O-052: "we've done a lot of tinkering off the learning off Voyager, I want to make sure we are building this in a modular consumable way", then "review of whole package first … all changes will go into 0.8.0 and principles need to go into design.md or savepoint docs". An independent whole-package review ([api review](../../../docs/architecture/api-review-2026-11-01.md)) found the core sound but three gaps (two viewers cannot share a page; React and `mount` drifted apart; nobody owned the API's grammar) and fifteen findings. The owner settled D1–D10 one by one and chose a new Goal (session api-review-20261101), then brought the planets demo and site move and the `Scene` split into 0.8.0 ("yes, in 0.8.0", "yes, early") and replaced D2's aliases with a clean break ("we only have two apps built from this, so we can afford to break and re-work them now").

## Success Conditions

Every member Objective is done, in this order: O-053, O-058, O-054, O-055, O-056, O-059, O-057.

## Boundaries

**In scope:** the eight published packages, their public API, docs, tests, examples and checks; the in-repo demos and site, moved onto the public API; I-130, I-131, I-132.

**Out of scope:** changes inside the Voyagers or showers apps (they migrate from the CHANGELOG table after 0.8.0 is out); new demos; publishing (the owner's GitHub release).
