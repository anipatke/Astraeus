---
id: I-189
title: A host setOpen undone right after the panel is drawn is heard by the host as two visitor changes
type: defect
status: open
source:
  kind: check
  check: C-193
  actor: {role: checker, session: check-o080-20261121}
  at: '2026-11-21T06:47:10Z'
tasks: [T-333, T-336]
checks: [C-193]
severity: low
history:
  - at: '2026-11-21T06:47:10Z'
    actor: {role: checker, session: check-o080-20261121}
    kind: observed
    note: 'C-193: deterministic checker probe (mount path, happy-dom, 3 of 3 runs): setOpen(true), then setOpen(false) from a MutationObserver callback when [data-shelf-panel] appears; onOpen heard [{gaps, open:true}, {gaps, open:false}]. This is the case T-336 Limitations names as still unsilenced.'
    check: C-193
---

# I-189: A host setOpen undone right after the panel is drawn is heard by the host as two visitor changes

## Summary

O-080 "One shelf contract": setters are silent and `on*` hears visitor actions only. `packages/astraeus/src/app/useShelf.ts` silences a host call only while `hostWants` is set, and a second host call computes `hostWants` against `reported`, which still holds the state before the first call's report. When the first call's panel is drawn but its report effect has not run yet, a host call that undoes it clears `hostWants`; the pending report is then treated as a visitor's open, then the close as a visitor's close.

## Evidence

- `useShelf.ts` `setOpen`: `hostWants.current = open.current === reported.current ? undefined : open.current;` with `reported.current` still `null` after `setOpen(true)` until the shell's report effect runs (`useShelfPanels.tsx`, report `useEffect`).
- Probe (scratch test, removed after): mount a scene with one `panel`; `onOpen` listener; a `MutationObserver` calls `setOpen(false)` as soon as `[data-shelf-panel="gaps"]` appears; `setOpen(true)`. Expected: nothing heard, reads closed. Actual (3 of 3): heard `[{part:"gaps",open:true},{part:"gaps",open:false}]`; final read `false`. A host that watches its custom block's element come into the page (a common way to start drawing) and reacts with a host call can hit this.
- T-336 Limitations: "One host case is still not silenced (rare)"; no test covers it.

## Proof Needed

- A deterministic case on both embedding paths (one lifecycle suite): host `setOpen(true)` then `setOpen(false)` between the panel's draw and its report (for example from a `MutationObserver`), and the reverse order from an open panel; the host hears nothing and `open` reads the host's last word throughout. The case fails against the current `useShelf.ts`.
