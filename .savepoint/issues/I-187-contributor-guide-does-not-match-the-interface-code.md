---
id: I-187
title: The contributor guide tells a newcomer to add bar items and panels where the code does not hold them, and part modules lack headers
type: drift
status: open
source:
  kind: check
  check: C-191
  actor: {role: checker, session: check-o079-20261121}
  at: '2026-11-21T04:14:23Z'
tasks: [T-332, T-327]
checks: [C-191]
severity: low
history:
  - at: '2026-11-21T04:14:23Z'
    actor: {role: checker, session: check-o079-20261121}
    kind: observed
    note: 'C-191: note section 9 and README "Interface modules" say to add a bar item in barItems.ts and its component in parts/, and a panel as an occupant row (wide area, phone area, layer) in panelRule.ts; the code holds neither. Several part modules have no header saying what they do and must not do.'
    check: C-191
---

# I-187: The contributor guide tells a newcomer to add bar items and panels where the code does not hold them, and part modules lack headers

## Summary

O-079's owner condition "Clean, modular, easy to pick up" asks for small modules each with a short header saying what it does and must not do, and a contributor guide (note section 9, pointer from the README) explaining how to add a bar item or a panel. The guide's two how-tos do not match the code, and the part modules mostly have no such header.

## Evidence

- `docs/architecture/viewer-interface.md:402` "Add a bar item: add its entry in `barItems.ts` (kind, priority, labels, view scope) and its component in `parts/`." Code: `src/shell/bar/barItems.ts` holds only the model, `ENGINE_PRIORITY` and constructors (no per-item entries, no view scope); the list is built in `src/shell/bar/barEntries.tsx` (`leadEntries`, `controlEntries`, `trailingEntries`); `src/shell/parts/` holds only stylesheets, the components are flat files in `src/shell/` (the note's own tree, line 386, says so).
- `viewer-interface.md:404` "Add a panel: add an occupant row to `panelRule.ts` (wide area, phone area, layer)." Code: `panelRule.ts` has an `Occupant` union, a `PanelState` field and `openOccupant`/`closeOccupant`/`topmost` cases; the area is chosen by which `<Area name>` `AstraeusShell.tsx` renders it in, and layers live in `areas/areas.css`.
- `packages/astraeus/README.md` "Interface modules": "`barItems.ts` is the item list (kind, priority, forms: add an item there)".
- No module header (first lines are imports): `src/shell/AboutPanel.tsx`, `DeveloperToggle.tsx`, `ControlsDrawer.tsx`, `AstraeusShell.tsx`, `TimelineBar.tsx`, `StoryPanelView.tsx`, `ObjectControls.tsx`, `DisplaySwitches.tsx`, `ScaleControl.tsx`, `MoonFamilyPanel.tsx`, `InfoPanel.tsx`. Some carry a component doc comment that covers the job (AboutPanel, InfoPanel, ControlsDrawer); the rule modules (`bar/`, `panels/`, `areas/`, `look/`, `useTitlePlace.ts`) do have headers.

## Proof Needed

- Note section 9 and README "Interface modules" name the files a contributor actually edits to add a bar item (barEntries.tsx plus barItems.ts constructors, the component in `src/shell/`) and a panel (panelRule.ts occupant, state and cases; the `Area` it renders in; its close-table test rows), checked against the code.
- Each interface part module starts with a short header saying its one job and what it must not do (place, layer, raw values, opening other parts).
