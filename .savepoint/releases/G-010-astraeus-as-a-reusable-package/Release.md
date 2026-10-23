---
id: G-010
title: Astraeus as a reusable package
status: done
---

## Outcome

A developer can use the Astraeus engine without the owner's site: the repository is split into an engine package and separate demo and site packages, and the engine is installable from npm with a small, stable public API.

## Why

Owner, 2026-10-20, on how Astraeus is distributed ("anyone can pull it down from GH i guess, demos and all"): chose to make "one repository, split inside" the next Objective and npm publishing after it, in a new Goal ("New goal: reusable package"). The Idea names developers as Astraeus's user.

## Success Conditions

Every member Objective is done.

## Boundaries

Packaging, mounting and the public API only; what the demos show and the public site's content stay as the owner accepted them. Publishing a release to npm is the owner's action; the Goal makes it possible and documented.
