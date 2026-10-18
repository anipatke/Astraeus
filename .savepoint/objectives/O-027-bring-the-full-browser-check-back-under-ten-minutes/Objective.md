---
id: O-027
title: Bring the full browser check back under ten minutes
status: planned
depends_on: []
release: G-007
---

# O-027: Bring the full browser check back under ten minutes

## Outcome

`tools/validate/run-full.sh` takes under ten minutes again on this machine, with every scenario it covers today still asserted somewhere.

## Why

Owner, 2026-10-18 ("Yes add the rest" to the clean-up list). The trimmed full run took about 9-10 minutes (O-017 T-071); after O-020 and O-024 it takes about 12-13 (latest runs 789-802 s), led by the Perseids showers step (about 5.5 minutes).

## Success Conditions

1. Measured before and after on an idle machine; under 600 s after.
2. The Perseids step trimmed or split (slower camera scenarios moved to `tools/validate/on-request/` or merged), each moved scenario mapped in `docs/BROWSER_CHECKS.md` (TEST-03).
3. Every step still exits 0 with zero console errors.

## Boundaries

Browser check scripts and the runner only; no app behaviour changes.
