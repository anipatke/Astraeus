---
id: O-036
title: Publish the engine to npm
status: planned
depends_on: [O-035]
release: G-010
---

# O-036: Publish the engine to npm

## Outcome

A developer installs the Astraeus engine into their own app with one command and builds a small scene through a documented, stable public API, close to the Idea's sketch (`Scene`, `addBody`, `addTrajectory`, `setTime`, `setScale`, `camera.follow`).

## Why

Owner, 2026-10-20: "and 3 too" (publish the engine to npm after the split). The Idea's Success Criterion 2: a developer builds a scene through a small API without copying application code or understanding internals.

## Success Conditions

To be detailed when planned. Starting points:
1. The engine package is publishable (name, version, exports, types, licence, readme), with a dry-run pack that contains only the engine.
2. A tiny example app outside the repository's demos installs it and draws a scene.
3. The public API and its stability promise are written down; what stays internal is named.

## Architectural Considerations

The API wraps the existing core, providers and presentation layers; it must not leak experience names (ARCH-01) or let presentation change State (ARCH-02).

## Boundaries

**In scope:** package metadata, public API surface, docs, an example, a release procedure.

**Out of scope:** the act of publishing (the owner's), demo packages on npm unless the owner asks.
