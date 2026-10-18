---
id: T-104
title: Record the reuse rights and the body packages in the provenance notes
objective: O-018
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o018-o019-rescope-20261018}
check_waiver:
    task: T-104
    reason: "Owner waived the optional Task Check and closed this Task ('Waive close'); the Full Objective Check covers it."
    actor:
        role: owner
        session: 009b0116-b8b7-4912-9273-91d589baf044
    recorded_at: "2026-10-18T10:24:07Z"
---

# Record the reuse rights and the body packages in the provenance notes

## Outcome

`docs/DONOR_PROVENANCE.md` states that Planetary Explorer is the owner's own work and may be reused and published in Astraeus, and describes the body packages T-077 wrote, so O-018 Success Conditions 1 and 5 are met.

## User Check

Open `docs/DONOR_PROVENANCE.md`: the "licence unresolved; local use only" note is gone, the owner's 2026-10-17 statement is there, and a "Body packages" section says where the data came from.

## Done When

1. The "Code licence unresolved; any adapted donor code stays local-use only" sentence is replaced by the owner's decision (O-018 Owner Decision 3, 2026-10-17, "thats right"): Planetary Explorer is the owner's own work; its data, maps and code may be reused and published in Astraeus. Third-party map and fact sources keep their own credits (PROV-02); no texture decision changes.
2. A "Body packages (O-018, T-077)" section: packages under `data/bodies/` are data copied from Planetary Explorer at commit 84f8d3e by `tools/import/planetary-explorer.mjs`; map images are not copied; eight map sources (earth, moon, jupiter, uranus, neptune, pluto, charon, ceres) come from Astraeus's own trace records in `tools/import/planetary-explorer-map-sources.json`, not the donor README; Ceres's donor colour file must not be shipped.
3. Gates: `npx tsc --noEmit`, `npx vitest run`, `npm run build` (documentation only; record that no code changed).

## Context Files

`docs/DONOR_PROVENANCE.md`, `.savepoint/objectives/O-018-bring-planetary-explorers-mapped-moons-into-astraeus/Objective.md`, `.savepoint/objectives/O-018-bring-planetary-explorers-mapped-moons-into-astraeus/tasks/T-077-import-every-planetary-explorer-body-into-reusable-packages-with-its-verified-locations-exactly-preserved.md`, `tools/import/planetary-explorer-map-sources.json`.

## Design References

Design asset licences (PROV-02); Codebase Map row for `data/bodies/`.

## Guardrails

PROV-01, PROV-02.

## Implementation Plan

1. Replace the licence note with the owner's decision.
2. Add the body-packages section from T-077's drift note.
3. Run the gates.

## Boundaries

Documentation only. No code, data, Design or other doc changes.

## Technical Verification

Configured gates; evaluated under `agent-skills/references/check-method.md` within the O-018 Full Objective Check.

## Technical Evidence

Executor session 009b0116-b8b7-4912-9273-91d589baf044, main checkout `o018-o019`, 2026-10-18. Extra reads: none outside the Context Files.

Per criterion:
1. **Met.** `docs/DONOR_PROVENANCE.md`: the Spike 03 sentence "Code licence unresolved; any adapted donor code stays local-use only" is now "Reuse rights (updated 2026-10-17)" with the owner's decision (O-018 Owner Decision 3, "thats right"), naming PROV-02 and that no texture decision changes. The same unresolved-licence claim appeared three more times (the no-LICENSE paragraph, the T-020 section, the shell-adaptation section near the end); each now points to the decision, so no "unresolved" or "local-use" line remains (`grep -c -i -E "unresolved|local-use"` → 0). Same file and same outcome as criterion 1, so within the Boundaries.
2. **Met.** New closing section "Body packages (O-018, T-077)": 24 packages plus `catalogue.json` and `README.md`, copied at donor commit `84f8d3e` by `tools/import/planetary-explorer.mjs`, locations exact, maps not copied; the eight bodies with no donor README source (earth, moon, jupiter, uranus, neptune, pluto, charon, ceres) sourced from `tools/import/planetary-explorer-map-sources.json` (nine keys: `_note` and those eight, read); Ceres's donor colour file must not be shipped (`donorFileShippable: false`).
3. **Met.** `npx tsc --noEmit` exit 0; `npx vitest run` 74 files, 1103 passed, 1 skipped; `npm run build` exit 0. Documentation only: no code, data or Design changed.

Files changed: `docs/DONOR_PROVENANCE.md`, this Task, O-018 status (planned → in_progress), router (O-018/T-104). Limitations: none known.

## Drift Notes

None expected.
