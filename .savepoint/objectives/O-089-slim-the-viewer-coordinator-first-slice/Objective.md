---
id: O-089
title: Slim the viewer coordinator, first slice
status: planned
depends_on: [O-087]
release: G-024
priority: medium
rank: 8
---

# O-089: Slim the viewer coordinator, first slice

## Outcome

The 617-line `App` loses its developer drawer and one coherent behaviour (selection, story playback or camera fallback, chosen in the design interview) moves out of `App` and the shell into a per-viewer plain module that the shell presents, removing that behaviour's mirrored state and serial request props. The pattern is documented so later features move one slice each.

## Why

AH-18 (all three): `App` holds about 42 state hooks with settings kept twice, the shell takes 46 props including five serial request objects ordered by effect position; each host feature touches 5+ places. AH-19: four forwarding layers per host capability. Owner decision 3: one slice at a time.

## Success Conditions

- Developer drawer in its own component; `App` shorter by that amount.
- The chosen behaviour has one owner outside React state, read through `useSyncExternalStore`; its serial request prop and mirror are gone.
- `lifecycle`, `twoViewers`, `hostCallOrder`, phone and shell DOM tests green on both mounts; the quick browser tier green (full tier if camera or layout is touched, decision 1).
- The slice pattern written in `docs/architecture/viewer-interface.md`.

## Architectural Considerations

API-02 handle parity; public API unchanged.

## Boundaries

**In scope:**
- The drawer extraction and one behaviour.

**Out of scope:**
- A full store rewrite; collapsing the forwarding layers beyond what the slice needs; a chrome-less viewer.
