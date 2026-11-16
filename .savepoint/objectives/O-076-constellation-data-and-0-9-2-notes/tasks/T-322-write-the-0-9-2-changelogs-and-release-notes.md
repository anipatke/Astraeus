---
id: T-322
objective: O-076
title: Write the 0.9.2 changelogs and release notes
status: in_progress
stage: audit
depends_on: [{task: T-321, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-322, reason: 'Owner said "orchestrate o76" (orchestrate O-076) under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-o076-20261116}, recorded_at: '2026-11-16T09:29:54Z'}
planned_by: {role: planner, session: plan-o076-20261116}
---

# Write the 0.9.2 changelogs and release notes

## Outcome

Every package changed in G-020 has a complete, accurate 0.9.2 changelog entry, and `docs/release-notes-0.9.2.md` tells an app developer in plain words what 0.9.2 adds and fixes, ready for the owner's release step.

## User Check

The owner reads `docs/release-notes-0.9.2.md` and says whether it is ready.

## Done When

- For each package with G-020 changes (at least `astraeus`, `astraeus-data`, `astraeus-data-constellations`; find others with `git diff v0.9.1..HEAD --stat -- packages`, i.e. since the 0.9.1 release tag): the `Unreleased` section is complete and accurate against the diff and the G-020 Objectives' Success Conditions (O-073 to O-076), with nothing claimed that the code does not do. The heading stays `Unreleased` (the owner's release step dates it), unless the 0.9.1 notes show the heading was set before release, in which case follow that pattern and say so.
- `docs/release-notes-0.9.2.md` follows `docs/release-notes-0.9.1.md`'s shape: per package, additions and fixes in plain words with the API names, "additions and fixes only, no breaking change", the data packages' peer range `>=0.9.0 <0.10.0` (unchanged), and a short upgrade note. Every claim maps to a CHANGELOG line.
- No version bump, no tag, no publish, no `gh release`.
- Configured gates pass (the docs tests, if any, cover changelog shape).

## Context Files

- `docs/release-notes-0.9.1.md`
- `.savepoint/releases/G-020-sky-view-fixes-for-0-9-2/Release.md`
- `.savepoint/objectives/O-073-sky-view-engine-bugs/Objective.md` (Success Conditions)
- `.savepoint/objectives/O-074-time-as-the-visitor-reads-it/Objective.md` (Success Conditions)
- `.savepoint/objectives/O-075-panels-controls-and-reads/Objective.md` (Success Conditions, Design Decisions)
- `.savepoint/objectives/O-076-constellation-data-and-0-9-2-notes/Objective.md`
- `packages/astraeus/CHANGELOG.md` (the `Unreleased` section and the 0.9.1 section above-the-fold only)
- `packages/astraeus-data/CHANGELOG.md` (top only)
- `packages/astraeus-data-constellations/CHANGELOG.md` (top only)
- `docs/RELEASING.md` (the release-notes and changelog steps only)

## Design References

Objective O-076 Boundaries. Guardrail API-07.

## Guardrails

API-07.

## Implementation Plan

1. List the G-020 changes per package from the diff since 0.9.1 and the four Objectives.
2. Reconcile each `Unreleased` section with that list (add missing, correct wrong, drop unproven).
3. Write the release notes from the changelogs.

## Boundaries

No code change, no version bump, tag, publish or GitHub release.

## Technical Verification

Configured gates at handoff. Evaluated later under `agent-skills/references/check-method.md`; owner reads the notes.

## Technical Evidence

Reconciled (builder, 2026-11-16):
- astraeus: every `Unreleased` line checked against the O-073..O-075 Success Conditions, `api-surface.lock.json` (names/types: ScenePanelPlaybackRead, SceneSwitchRead, ScenePacingRead, TimeLook, LookRead time/sheetMaxPercent, setFocusChoices, setOverview, closeAfterSeconds, playing) and source (planCamera, story, planTimeline, sceneReads, SkyFiguresView, lookValues). No claim found unproven. Only correction: removed a stray blank line splitting the entry list. Heading stays `Unreleased` (0.9.1 notes were dated at release).
- astraeus-data: one Unreleased entry (`astraeus-data/milky-way`, `milkyWaySource`) matches package.json exports and src/milkyWay.ts; no change.
- astraeus-data-constellations: no CHANGELOG of its own (RELEASING.md names only astraeus and astraeus-data); its entries live in `packages/astraeus/CHANGELOG.md` and the notes say so. No other package changed in `packages` besides site tests/tools.
- Created `docs/release-notes-0.9.2.md` in the 0.9.1 shape, one bullet per changelog line. Not yet included (owner's release step): first-download size from `npm run measure:example`, and the dated headings.
- Gates: lint, typecheck, build pass; test 265 files, 4047 passed, 2 skipped.
- Files: packages/astraeus/CHANGELOG.md (whitespace only), docs/release-notes-0.9.2.md (new), this Task.

## Drift Notes

None expected.
