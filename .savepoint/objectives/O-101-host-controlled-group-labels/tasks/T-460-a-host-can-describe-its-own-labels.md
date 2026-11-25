---
id: T-460
title: A host can describe its own labels
objective: O-101
status: done
depends_on: []
check_waiver: {task: T-460, reason: 'Owner said "orchestrate the rest of the goal" (G-027, 2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g027-20261124}, recorded_at: '2026-11-24T10:13:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o101-20261124}
lane: api
planned_reads: [packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/skyFigureInput.ts, packages/astraeus/src/api/planSkyFigures.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/planParts.ts, packages/astraeus/src/api/planStory.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/group.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/api/labelInput.ts, packages/astraeus/src/api/planLabels.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/tests/labelInput.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
---

# A host can describe its own labels

## Outcome

A host adds labels of its own with `scene.addLabels(labels)`: each has an id, its text, an optional colour and `labelPriority`, an `anchor` (a fixed point, or the dots of one or more groups) and an optional `selects` (groups, or a panel), plus a card's `description`, `provenance` and `knownLimitations` when it selects several groups. Bad input throws the new `SceneError` code `bad-label` naming the field (G-027 Decision 3), and the checked labels reach the scene's internal definition for T-461. This Task draws nothing.

## User Check

None (input and checks only; the owner sees the labels in later Tasks).

## Done When

- **Public shape** (new `src/api/labelInput.ts`, exported from `src/api/index.ts`; API-04 names: `plane`, `center`, `positionKm`):
  ```ts
  export interface LabelInput {
    readonly id: string;                 // not shared with any body, path, group, body-set member, sky figure, panel or other label
    readonly label: string;              // the text; not blank
    readonly color?: string;             // CSS hex ("#rgb" or "#rrggbb"); the look's label colour when absent
    readonly labelPriority?: number;     // finite; default 80, a group's
    readonly anchor: LabelAnchorInput;
    readonly selects?: LabelSelectsInput; // absent: text only, a tap passes through to the scene
    readonly description?: string;       // only with selects.groups of two or more: the card's text
    readonly provenance?: Provenance;    // the same rule: the card's source
    readonly knownLimitations?: readonly string[]; // the same rule
  }
  export type LabelAnchorInput =
    | { readonly positionKm: readonly [number, number, number]; readonly plane: "ecliptic-j2000" | "EQJ"; readonly center?: BodyId } // center: the scene's centre when absent (ARCH-06)
    | { readonly groups: readonly string[] };
  export type LabelSelectsInput = { readonly groups: readonly string[] } | { readonly panel: string };
  ```
  The builder may rename a type only to match an existing public pattern, recording why. Doc comments state each rule above, the cover rule ("a group named in any label's `anchor.groups` draws no name of its own while that label is in the scene; the Labels switch shows and hides the label instead"), and that `selects.groups` with one id selects that group exactly as the Object list does, with several ids selects them together under the label's id with the card given here, and `selects.panel` opens that story or shelf panel.
- **`Scene.addLabels(labels: readonly LabelInput[]): this`** in `src/api/scene.ts`, beside `addSkyFigures`, with a doc comment and an `@example` of two labels on made-up groups. A repeated id (in the call or the scene) throws `duplicate-id`; a malformed label throws `bad-label` and adds none of the call (as `addSkyFigures`).
- **Errors** (`src/api/errors.ts`): new code `bad-label` with the doc comment "A label (`addLabels`) is malformed, or names a group, panel or centre the scene does not hold."; `npm run api:errors` rewrites the README table. Every message names the label and the field: `addLabels("<id>"): <field> ...` where `<field>` is one of `id`, `label`, `color`, `labelPriority`, `anchor`, `anchor.positionKm`, `anchor.plane`, `anchor.center`, `anchor.groups[<i>]`, `selects`, `selects.groups[<i>]`, `selects.panel`, `description`, `provenance`, `knownLimitations`.
- **Checks at the call:** id a non-empty string; label a non-blank string; colour by the group's `HEX`; priority finite; `anchor` exactly one form (both forms, or neither, throws naming `anchor`); `positionKm` three finite numbers; `plane` one of the two; `groups` a non-empty list of distinct non-empty strings; `selects` exactly one form with the same list rules; the card fields only when `selects.groups` has two or more ids; provenance through the existing provenance check.
- **Checks at build** (`src/api/planLabels.ts`, called from `assembleScene.ts`, the stage where groups are checked): every `anchor.groups` and `selects.groups` id names a group of the scene (not a body or a body set); `selects.panel` names a story panel or a shelf panel part of the scene; `anchor.center` is a body in the scene; the label id is clear of every other id in the scene (`duplicate-id`).
- **To the definition:** the checked labels, with each `center` resolved, are a new optional field of the internal `ExperienceDefinition` (`app/experienceDefinition.ts`), absent when the scene has none. Nothing reads it yet.
- **Unit test**, new `packages/astraeus/tests/labelInput.test.ts` (TEST-01, ARCH-03, made-up groups and panels only), one table with a row per field and fault above (the code and the field named in the message, API-05: assert the code and the field name, never the whole message), plus a row per good form (fixed point with and without `center`; one group; several groups with a card; a panel; text only) that builds and lands in the definition. Existing tests unchanged; if one turns red, stop and report.
- **API lock and docs:** `npm run api:lock` (run it last, after any other O-101 builder's lock change in the tree); `packages/astraeus-site/tests/apiSurface.test.ts`, `apiRules.test.ts` and the README error sync pass. README `### Sky, camera, looks and views` table: one row, "`scene.addLabels(labels)` | Labels the host places: on a point, or on the dots of one or more groups, each selecting a group, several groups or a panel when tapped. | [`LabelInput`](https://astraeus.anipatke.com/api/#labelinput)".
- **CHANGELOG** (`## 0.12.0 (unreleased)`): one bullet, "Added: `scene.addLabels` places the host's own labels, on a point or on the dots of one or more groups; a tap selects a group, several groups together (with the host's card) or opens a panel. Labels join the one overlap and priority rule." Under `### Breaking changes in 0.12.0`, replace the "None yet: ..." line with: "- `SceneErrorCode` has a new code, `bad-label` (bad input to `addLabels`). Migration: a `switch` over `SceneErrorCode` needs the case; code that does not switch on codes needs nothing." `packages/astraeus-site/tests/releaseBreaks.test.ts` passes.
- **Size:** `npm run check:pack`; report the engine figure (expected +400 to +700 B gzip). If it passes 527,000 B gzip, report it and do not change the cap (T-461 owns that).
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/api/scene.ts` (`addSkyFigures`, `addGroup` and the class fields they use)
- `packages/astraeus/src/api/skyFigureInput.ts`
- `packages/astraeus/src/api/planSkyFigures.ts`
- `packages/astraeus/src/api/assembleScene.ts`
- `packages/astraeus/src/api/errors.ts`
- `packages/astraeus/src/api/group.ts` (`HEX` and `planGroup` only)
- `packages/astraeus/src/api/planParts.ts` and `planStory.ts` (where panel ids are known; read only the id lists)
- `packages/astraeus/src/app/experienceDefinition.ts` (the `ExperienceDefinition` type only)
- `packages/astraeus/README.md` (`### Sky, camera, looks and views` and `## Errors` only)
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (the public Scene API); G-027 Release.md finding 2 and Decisions 1 to 3.

## Guardrails

API-01, API-04, API-05, ARCH-01, ARCH-03, ARCH-06, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-02, CODE-01.

## Implementation Plan

1. Write the table test; see `addLabels` missing.
2. Types and call checks in `labelInput.ts`; `addLabels` on `Scene`.
3. Build checks and the definition field in `planLabels.ts` and `assembleScene.ts`.
4. `bad-label`, `api:errors`, `api:lock`, README row, CHANGELOG with the breaking entry, `check:pack`.

## Boundaries

No drawing, placing, picking or selection (T-461, T-462); no `scene.labels` read; no change to groups' own input (`showLabel` is T-458).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/labelInput.test.ts packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/releaseBreaks.test.ts`. Handoff: the configured gates and `npm run check:pack`. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Done When -> evidence:

| Done When | Evidence |
|---|---|
| Public shape (`labelInput.ts`, exported) | `LabelInput`, `LabelAnchorInput`, `LabelSelectsInput` in `src/api/labelInput.ts`, exported from `src/api/index.ts`; `npm run typecheck` clean; apiSurface test passes |
| `Scene.addLabels` | `scene.ts` (doc comment and `@example`); labelInput.test.ts "repeated id" case (duplicate-id, adds none, bad-label atomic) |
| `bad-label` code and README table | `errors.ts`; `npm run api:errors` wrote the README table; apiRules test passes |
| Checks at the call | labelInput.test.ts, 20 fault rows (code `bad-label` and field named) |
| Checks at build | labelInput.test.ts, 6 rows (unknown group, body as group, unknown panel, centre not in scene, id of a panel or group) |
| To the definition | `ExperienceDefinition.labels` (`ExperienceLabel`); good-form rows (point with and without centre, one group, several with card, story panel, shelf panel, text only) and the "absent when none" row |
| Unit test | `packages/astraeus/tests/labelInput.test.ts`, 35 tests pass |
| API lock and docs | `npm run api:lock` run last; apiSurface, apiRules, releaseBreaks pass; README row added |
| CHANGELOG | Added line and `bad-label` breaking entry in 0.12.0; releaseBreaks passes |
| Size | `npm run check:pack` FAILS with all O-101 builders' work in the tree: engine 1,841,453 B raw (limit 1,838,000), 527,963 B gzip (limit 527,000). Not changed here. |
| Gates | typecheck clean; eslint + prettier clean on changed files; `npx vitest run` labelInput, publicApiGroup, skyFigures, apiSurface, apiRules, releaseBreaks, apiReference, apiImports, packageBoundaries: all pass except apiReference page-size test (below) |

Commands: focused vitest files above; `npm run typecheck`; eslint and prettier on changed files; `npm run api:errors`; `npm run api:lock`; `npm run check:pack`.

Files changed: src/api/labelInput.ts (new), src/api/planLabels.ts (new), src/api/scene.ts, src/api/assembleScene.ts, src/api/errors.ts, src/api/index.ts, src/app/experienceDefinition.ts, tests/labelInput.test.ts (new), api-surface.lock.json, README.md, CHANGELOG.md (all under packages/astraeus).

Coordinator follow-up: `addLabels` already copied its input (`frozenCopy` in `LabelPlan.add`); added an `addLabels` row to the walk table in `tests/sceneInputCopies.test.ts` (new row only). Focused: sceneInputCopies + labelInput 181 passed; full `npm test` 355 files, 5700 passed, 2 skipped; typecheck and eslint clean; lock unchanged. (Earlier apiReference failure did not recur in the full run.)

Limitations: `tests/apiReference.test.ts` "api/index.html" gzip limit (46,000 B, owner-set in `load-budget.mjs`) fails at 46,657 B with the new documented types; limit not changed (owner decision). Pack check over cap: see table. Labels draw nothing yet. Panel ids for `selects.panel` are story panels, steps and shelf parts of kind `panel`; a fixed point's omitted centre resolves to the scene's first body.

## Drift Notes

Expected for Design.md (Interfaces and Data Flow): `addLabels` and `bad-label`. Reconciled before the Full Objective Check.

Marked done by the coordinator under the owner's "orchestrate O-101" (2026-11-25) after the wave gate: `npm run typecheck`, `npm run lint`, `npm test` 355 files 5700 passed 2 skipped, `npm run build` ok. `npm run check:pack` is over the engine caps with the whole wave (1,841,453 raw / 527,963 gzip); the owner approved raising both caps by the measured amount (G-027 answer 5, O-101 item 2), done in T-461 after its own measurement.
