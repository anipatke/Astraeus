---
id: I-078
title: A moon-positions package is inlined into a consumer's entry bundle, so users download every chunk up front
type: defect
status: open
source:
  kind: check
  check: C-107
  actor: {role: checker, session: o036-full-check-20261023}
  at: '2026-10-23T08:14:48Z'
tasks: [T-161]
checks: [C-107]
severity: medium
history:
  - at: '2026-10-23T08:14:48Z'
    actor: {role: checker, session: o036-full-check-20261023}
    kind: observed
    note: Found by the O-036 Full Objective Check (C-107) against Success Condition 2, Confirmed Decision 7 (build per docs/NPM_PACKAGING.md) and the README promise.
    check: C-107
---

# I-078: A moon-positions package is inlined into a consumer's entry bundle, so users download every chunk up front

## Summary

Each `astraeus-data-<planet>` package lists its chunks in a generated `src/chunks.js`, one `new URL("../data/<set>/<moon>/<year>.bin", import.meta.url)` per file. The engine is designed to fetch only the chunks the scene's window needs. However, Vite's default `build.assetsInlineLimit` (4 kB) turns every small chunk into a base64 `data:` URL inside the consumer's entry script. Saturn has 292 moons, and most of their chunks are under 4 kB. The README (`packages/astraeus/README.md:56`) says "so you only download what you use", and the decision note (row 2) describes chunks being copied as separate files. Neither holds for a default Vite app.

## Evidence

- Scratch Vite 8.3.5 app with the packed `astraeus`, `astraeus-data` and `astraeus-data-saturn` tarballs. `main.js` holds `new Scene().addBody(saturn).addBody(titan)` and `mount(..., { data: [pictures, saturnMoons] })`. After `vite build`, the entry `dist/assets/index-*.js` is 14.9 MB (9.6 MB gzip) and contains 5,321 `data:application/octet-stream;base64` strings. Only 528 `.bin` files are emitted as separate files.
- At run time the page fetched only 2 `.bin` files (Titan's window), but the other 5,321 chunks had already arrived inside the entry script, before anything drew.
- The scene itself works: Titan is drawn with its map, Saturn moves relative to it across a 4-day seek, and there are no errors. So this is about load cost, not correctness.
- The site is not affected (the public build file list and load budget are unchanged).
- The T-159 spike's Mars-only build reported "61 chunk files". Mars chunks are larger than 4 kB, which hid the effect.

## Proof Needed

A default Vite build of a consumer app that imports one positions package (Saturn, the worst case) has an entry script with no inlined chunks, or only a small, stated amount, and fetches chunks per window. For example, `chunks.js` could use a form the bundler never inlines, or the packages could document a required setting and the example could prove it. Record the entry size before and after. The README sentence matches what a user gets.
