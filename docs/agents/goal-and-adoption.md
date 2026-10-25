# Goal repair, migration and adoption

## Required Goal Context

Every Savepoint project must have a live Goal selected by the router, and
every live Objective must name exactly one Goal in its `release:` field.
`savepoint init` creates and selects G-001, titled after the project.
`savepoint migrate` keeps the V1 router's live Goal. When that selection is
missing or unresolvable, it selects a uniquely identifiable existing live
Goal for the converted active work when possible. If selected work belongs
only to a historical Goal, migration creates a live continuation with a G-###
identity and moves that active Objective into it. Converted V1 Releases keep
their R-### identities. An unresolved release lifecycle decision stays in
the preview and blocks Apply.

If the router Goal is missing, blank, or `none`, Next says `Choose a Goal`; use
`g` to select a live Goal. Unknown or archived router selections are reported
as selection diagnostics; use `g` to select a live Goal. If there are no live
Goals, `savepoint doctor` says to create one. An Objective missing `release:` remains
loadable, but resume and the board flag it and doctor names the Objective and
the exact `release:` field using an `R-###` or `G-###` Goal ID. Unknown or
malformed Objective references remain errors. The board shows only the selected
Goal's Objectives and Tasks; it never falls back to a project-wide view.

Existing Goals keep their stable `R-###` identities, paths, and references.
New Goals use stable `G-###` identities under `.savepoint/releases/`
(`Release.md`); Objective and router `release:` fields remain the persisted
compatibility boundary.
Goals group Objectives; a Goal is complete when every member Objective is
complete. Goals do not own Tasks, and do not publish, deploy, tag, or generate
changelogs.

## Existing Codebase Adoption

Design is reconstructed from the code through targeted reads needed by the current Objective or Task: no whole-repository scan, automatic analysis pass, or call to a model service. What exists goes to `.savepoint/Design.md`: structure to Components/Codebase Map, verified behaviour to Current Technical State. Unread areas are recorded as unknown. What the code is for goes to `.savepoint/Idea.md`: owner intent is recorded in `.savepoint/Idea.md` through `savepoint-idea`, never inferred from source.

Adoption preserves user-authored files. `savepoint init` may add or refresh the Savepoint-managed block in an existing agent guide, preserving every byte outside that block; other Savepoint files are added under `.savepoint/`. Concept, Health-Check, and a procedures file are optional. Their absence is normal, not a finding. A Goal is required: `savepoint init` supplies G-001; migration keeps or selects an existing live Goal, or creates a continuation for historical work. Follow Required Goal Context for `Choose a Goal` and `savepoint doctor` repair guidance.
