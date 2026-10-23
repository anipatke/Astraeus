---
id: G-007
title: Astraeus post-launch clean-up
status: planned
---

## Outcome

After the first public launch (G-005), the site and engine are leaner and steadier: smaller downloads, quicker checks and fewer known rough edges, with nothing visitors see getting worse.

## Why

Owner, 2026-10-18, on packing the shower meteor orbits more compactly: "Add it to a clean up goal". Small improvements found while building the launch are collected here so they do not hold up the launch.

## Success Conditions

Every member Objective is done.

## Boundaries

Clean-up only: no new demos or features (the zodiac demo is G-006; other planets' moons are O-018 and O-019). Every change keeps the looks and accuracy the owner accepted.

## Workflow Review

2026-10-23, after O-026 was retired (owner, "Retire O-026 (Recommended)": measured on the shipped files, binary orbits would save about 20% over the wire, Perseids about 820 to 650 KB brotli, Geminids about 1.5 to 1.2 MB, not the half the Objective assumed; git history keeps O-026). No change, because the Goal's replans and NEEDS WORK Checks (the O-030 switch leak, C-102's cover finding) were caught by the planned stop rules and the Full Check as intended; the one slip, an executor writing a `check_waiver` in the Task body where the runtime does not read it, was caught by `savepoint resume` at once.
