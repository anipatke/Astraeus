---
id: T-321
objective: O-076
title: Offer the Milky Way picture on its own
status: planned
depends_on: [{task: T-320, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-321, reason: 'Owner said "orchestrate o76" (orchestrate O-076) under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: plan-o076-20261116}, recorded_at: '2026-11-16T09:29:54Z'}
planned_by: {role: planner, session: plan-o076-20261116}
---

# Offer the Milky Way picture on its own

## Outcome

A sky-only app imports `milkyWaySource` from `astraeus-data/milky-way` and its build copies the Milky Way picture alone, not the moon and Venus maps (Zodiac review F-06); `astraeus-data`'s main export is unchanged.

## User Check

None required; proven by a packed build. The owner may open the hello-sky example as today.

## Done When

- The Milky Way picture and its licence record live in their own module (for example `src/milkyWay.ts`), imported by `src/pictures.ts` so `PICTURES["milky-way"]` and `dataSource` are byte-for-byte the same values as 0.9.1.
- New subpath `astraeus-data/milky-way` in both `exports` and `x-publish.exports` (types and import), exporting `milkyWaySource: DataSource` (`name: "astraeus-data/milky-way"` or similar, `provides: []`, `pictures: { "milky-way": ... }`) and the picture record. Passing it in `mount(..., { data: [milkyWaySource] })` gives the sky its Milky Way exactly as `dataSource` does.
- Proof on a packed build: `examples/hello-sky` installs `astraeus-data` (add it to `EXTRA_PACKAGES` in `tools/build-example.mjs`), imports `milkyWaySource` and passes it to `mount`; a check (in the existing example/pack tooling or a test over hello-sky's built output) fails if any `.jpg` other than the Milky Way is emitted. `measure:example hello-sky` stays within its limit (pictures are not counted; report the number).
- Node consumer: `check:node-consumer` (or a test) imports `astraeus-data/milky-way` under Node without error, as the main export does; `check:pack` file lists accept the new file.
- README section for the subpath; CHANGELOG `Unreleased`; configured gates pass. Peer stays `>=0.9.0 <0.10.0`.

## Context Files

- `packages/astraeus-data/src/pictures.ts`
- `packages/astraeus-data/src/index.ts`
- `packages/astraeus-data/package.json`
- `packages/astraeus-data/README.md` (headings via grep; read the one about using the package)
- `packages/astraeus-data/CHANGELOG.md` (top only)
- `tools/build-example.mjs`
- `tools/check-packs.mjs` (the file-list rules only)
- `tools/check-node-consumer.mjs`
- `examples/hello-sky/src/main.js`
- `examples/hello-sky/package.json`
- `.savepoint/objectives/O-076-constellation-data-and-0-9-2-notes/Objective.md`

## Design References

Design `Public API shape (G-016, owner 2026-11-01)`; `Current Technical State` (package exports and Node twins). Objective O-076 `Design Decisions` D3.

## Guardrails

PROV-02, API-01, API-07, TEST-01..03.

## Implementation Plan

1. Move the Milky Way record into its own module; re-import it in `pictures.ts`.
2. Add the subpath entry file and both `exports` maps; make sure the build (`tools/build-packages.mjs`) emits it with types.
3. Wire hello-sky to it and add the emitted-pictures check; run `check:pack`, `check:node-consumer`, `measure:example hello-sky`.
4. README, CHANGELOG.

## Boundaries

No new package, no change to `dataSource`, `PICTURES` or any picture file, no engine change, no browser run (the browser gate at the Full Check covers hello-sky).

## Technical Verification

Focused tests while iterating; configured gates at handoff plus `npm run check:pack`, `npm run check:node-consumer` and `npm run measure:example hello-sky`. Evaluated later under `agent-skills/references/check-method.md`. Hello-sky now draws the Milky Way; the Full Check's one browser run covers it.

## Technical Evidence

Pending execution.

## Drift Notes

Record the new subpath and the hello-sky change for Design reconciliation before the Full Objective Check.
