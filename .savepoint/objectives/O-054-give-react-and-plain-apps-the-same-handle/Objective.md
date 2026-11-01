---
id: O-054
title: Give React and plain apps the same handle
status: planned
depends_on: [O-053]
release: G-016
priority: high
---

# O-054: Give React and plain apps the same handle

## Outcome

A React host gets the same handle a `mount` host gets (reads, setters, signals), start-up and shut-down follow the Design lifecycle contract on both paths, and hosts gain the controls a non-probe app needs: play/pause and `playing`, the selected object and a selection signal, and a camera-change signal (API-02; review F2, F8, F10; I-130).

## Why

G-016 chunk 2. I-130 and C-136 O1, O2, O5: React apps can do less than `mount` hosts; `ready` can resolve unusable or never settle; a throwing listener stops the others; StrictMode can fire `onReady` early.

## Success Conditions

Detailed when this Objective is planned. Named outcomes: one handle type for both paths (given to React through `ref` and `onReady(handle)`, props kept as shortcuts); `ready` always settles, with a code for "not mounted"; isolated listeners; a mounted `Scene` frozen; `hello-react` restores the camera after an encounter; one shared lifecycle suite runs against both paths; the O-053 allowlist entries for these breaks removed.

## Architectural Considerations

Follows the `ViewerLink` attach/publish pattern; ARCH-02 (controls consume State, never change it).

## Boundaries

**In scope:** F2, F8, F10 and I-130.

**Out of scope:** renames (O-057); headless loading (O-056); page isolation (O-055).
