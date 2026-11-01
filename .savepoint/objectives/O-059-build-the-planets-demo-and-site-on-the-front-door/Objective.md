---
id: O-059
title: Build the planets demo and site on the front door
status: planned
depends_on: [O-056]
release: G-016
priority: high
---

# O-059: Build the planets demo and site on the front door

## Outcome

The planets demo and the site use only the public API (`import … from "astraeus"` and `astraeus/style.css`): every capability they reached through the internal `ExperienceDefinition` (sky, body sets, desktop textures, scene centre, label, developer sections, the demo switcher and data alternates) is either a public, general feature or moved out of the engine into the site; the per-package deep-import counts from O-053 reach zero for every demo and the site; the internal definition stops being a second way in (review F13; owner D6 brought into 0.8.0; I-131).

## Why

Owner, 2026-11-01: "Yes, in 0.8.0" and "lets do this right, no hurry on the app". 0.8.0 promises one front door (API-01); our richest demo and our own site are the proof that a new app can build what we build. Ordered after O-056 (looks become public settings, which several of these capabilities need) and before O-057 so new public features are named right before the renaming pass.

## Success Conditions

Detailed when this Objective is planned (likely a research step first to list each internal capability the demo and site use and its public form). Named outcomes: each capability public and general (no planet, mission or demo names in engine rules, ARCH-01, ARCH-06) or moved into the site; the demo switcher and alternates live in the site, not the engine's `App`; deep-import counts zero; the site's public build and every demo look the same, shown by one browser check and an owner look on localhost:5490.

## Architectural Considerations

New public features follow the Guardrails Public API rules from the start (one word one unit, settings with defaults, signals not behaviour). Story and demo data stay in the demo packages (ARCH-01; owner's "story data, not engine"). `App` stays internal; the site mounts like any host.

## Boundaries

**In scope:** `packages/astraeus-demo-planets/`, `packages/astraeus-site/`, the public features they need, the deep-import allowlists.

**Out of scope:** renames of existing names (O-057); new demos; the Apollo and showers demos beyond keeping their zero count.
