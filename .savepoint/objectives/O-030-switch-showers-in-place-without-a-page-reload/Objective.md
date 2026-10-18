---
id: O-030
title: Switch showers in place without a page reload
status: planned
depends_on: [O-024]
release: G-007
---

# O-030: Switch showers in place without a page reload

## Outcome

The Showers switch changes shower inside the running page: the scene, timeline, stories and settings swap over with the loading animation (O-024 T-094) covering the moment, and no reload.

## Why

Owner, 2026-10-18 ("Yes add the rest"). T-091 switches by reloading the page (its allowed fallback); the owner noticed "a slight pause and screen goes blank between".

## Success Conditions

1. Switching keeps the page; the chosen shower's data loads, the other's is released; state resets to the new shower's start view and time.
2. The address and view link update as today; back and forward buttons move between showers.
3. Generic `switcher` in the shell (no shower names, ARCH-01); memory does not grow over many switches (measured).
4. Browser checks through the shared driver; full run passes; owner look.

## Boundaries

The switch's behaviour only.
