---
id: T-458
title: Groups can start without a name label
objective: O-101
status: planned
depends_on: []
check_waiver: {task: T-458, reason: 'Owner said "orchestrate the rest of the goal" (G-027, 2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g027-20261124}, recorded_at: '2026-11-24T10:13:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o101-20261124}
lane: groups
planned_reads: [packages/astraeus/src/api/group.ts, packages/astraeus/src/api/planGroups.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/displaySwitches.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/tests/displaySwitches.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/api/group.ts, packages/astraeus/tests/groupShowLabel.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/CHANGELOG.md]
---

# Groups can start without a name label

## Outcome

`addGroup` takes `showLabel?: boolean` with exactly a body's meaning (G-027 Decision 1, "Same as bodies"): `false` starts the group's name hidden; the Labels switch, the Developer display toggles and `?labels=<id>:on` can show it again. The group stays in the Object list, keeps its camera menu items and stays selectable. Default `true`: nothing changes for a scene that does not set it.

## User Check

None beyond the Objective's (the owner sees it in the made-up group-labels scene, whose groups set `showLabel: false`).

## Done When

- **Input.** `GroupInput.showLabel?: boolean` in `src/api/group.ts`, with a doc comment that says the same as `AddBodyOptions.showLabel` and adds: "a group that a host label (`addLabels`) is anchored on draws no name of its own while that label is in the scene" (the rule itself lands with the host labels; the comment may say it now). The group's internal object carries `showLabel` only when the host gave it (as `planBodies.ts` does for bodies), so the existing start rule (`hiddenLabelsFrom` in `app/App.tsx`) and the Labels switch need no change.
- **Check.** A non-boolean `showLabel` throws `bad-group` at `addGroup`, naming the field: `addGroup("<id>"): showLabel must be true or false`.
- **Unit test**, new `packages/astraeus/tests/groupShowLabel.test.ts` (TEST-01, ARCH-03, made-up groups only), one table across the input kinds: absent, `true`, `false`, and `"yes"`. For `false`: the built definition's group object has `showLabel: false`; `hiddenLabelsFrom` starts it hidden; `?labels=<id>:on` and the Labels switch on (`displaySwitches` `setLabels`) show it; the group is still a listed object and a camera target (`focus-<id>`). For absent and `true`: unchanged from today. For `"yes"`: `bad-group` naming `showLabel`.
- **Existing tests unchanged**; every test passes unedited. If one turns red, stop and report.
- **API lock:** `npm run api:lock` (GroupInput gains a field); `packages/astraeus-site/tests/apiSurface.test.ts` passes. Run it last, after any other O-101 builder's lock change in the tree, so the lock holds both.
- **README:** no new row (the `addGroup` row stands); the generated API reference picks up the doc comment.
- **CHANGELOG** (`packages/astraeus/CHANGELOG.md`, one bullet in the `## 0.12.0 (unreleased)` list above `### Breaking changes in 0.12.0`): "Added: `addGroup` takes `showLabel`, as `addBody` does: `false` starts the group's name hidden, and the Labels switch can show it." Not a breaking change (a new optional field; `releaseBreaks.test.ts` flags none).
- **Size:** `npm run check:pack`; report the engine figure (expected under +100 B gzip).
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/api/group.ts`
- `packages/astraeus/src/api/planGroups.ts`
- `packages/astraeus/src/api/scene.ts` (`AddBodyOptions.showLabel` doc comment and `addGroup` only)
- `packages/astraeus/src/app/App.tsx` (`hiddenLabelsFrom` only)
- `packages/astraeus/src/app/displaySwitches.ts` (`setLabels`, `labelsOn`)
- `packages/astraeus/tests/displaySwitches.test.ts` (setup at the top, as a model)
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (the public Scene API); G-027 Release.md Decision 1.

## Guardrails

API-01, API-04, API-05, ARCH-03, TEST-01, TEST-03, STYLE-01, STYLE-02, CODE-01.

## Implementation Plan

1. Write the table test; see `false` ignored and `"yes"` accepted today.
2. Add the field, its check and its doc comment; pass it to the group's object.
3. API lock, CHANGELOG, `check:pack`.

## Boundaries

No change to bodies' labels, the start rule, the Labels switch or the label layout; no "never shown" meaning (the host-label cover rule gives that, in T-461).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/groupShowLabel.test.ts packages/astraeus/tests/publicApiGroup.test.ts packages/astraeus/tests/displaySwitches.test.ts packages/astraeus-site/tests/apiSurface.test.ts`. Handoff: the configured gates and `npm run check:pack`. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None yet.
