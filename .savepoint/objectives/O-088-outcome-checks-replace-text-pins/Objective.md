---
id: O-088
title: Outcome checks replace text pins
status: planned
depends_on: [O-086]
release: G-024
priority: medium
rank: 7
---

# O-088: Outcome checks replace text pins

## Outcome

Tests that freeze source text are replaced by tests that check outcomes, then retired, and the browser driver loses its unreachable code.

## Why

AH-33 (all three): `browserAssertions.test.ts` freezes browser-assertion source text at one commit (a renamed variable fails it; an early return can pass), blocking deletion of about 225 unreachable driver exports; `scenePin.json` is one 837 KB self-generated snapshot; the computed-look baseline keys by element index; the migration and allowlist-growth tests guard history. Owner decision 4: retire only after replacement.

## Success Conditions

- Outcome negative controls in place first: a failing browser step exits non-zero, a console error fails, zero drawn dots fail.
- Then the assertion-text baseline, its list and fixture are retired; unreachable driver exports deleted with one clean browser run.
- The scene pin replaced by focused contract cases (no verbatim message text); the computed-look baseline narrowed to what the owner's look rules need, or retired; the 0.7 migration and empty-allowlist checks retired or reduced.
- Review checklist note: scenario coverage is checked in review when browser assertions change.

## Architectural Considerations

TEST guardrails; ARCH-06 allowlist rules if any guard is reduced.

## Boundaries

**In scope:**
- The named pins and baselines, driver dead code, replacement controls.

**Out of scope:**
- Science reference tests and API surface lock (kept).
