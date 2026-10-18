---
id: T-090
title: Tidy the developer panel into clear collapsible groups
objective: O-020
status: in_progress
stage: audit
depends_on: [{task: T-081, requires: clear}, {task: T-086, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Tidy the developer panel into clear collapsible groups

## Outcome

The developer panel (the cog) is short and easy to scan: its controls are reviewed, sorted into a few clearly named groups, and each group folds open and closed, so a visitor sees the headings first and opens only what interests them.

## User Check

Open the cog on a laptop and a phone: a short list of group headings, each opening with one tap; every control is still there and still works.

## Done When

1. Owner, 2026-10-18: "the developer panel is getting big and messy, suggest as part of finalising this objective we also review what in it, organise / group into collapsible sections".
2. Review: an inventory of every control and readout in the panel today (experience sections, Scene instrumentation, Display settings groups View, Story panels, Timeline glow, Orbit lines, Sky, Sun glow, Labels, Data, Phone layout, and any from T-081/T-086), recorded in the Task evidence with a proposed grouping, a plain heading per group and anything to merge, rename or drop; the owner approves the grouping before the build (a drop needs the owner's yes; the owner keeps the panel public as a demo of "the ins and outs", O-020 decision).
3. Each group is a collapsible section, closed by default except one sensible default (for example the experience's own controls); open/closed state is remembered per viewer in browser storage where available and works without it; keyboard and screen-reader accessible (button with `aria-expanded`), 44 px headings on phones.
4. One shared collapsible part for the groups (STYLE-07; reuse T-081's collapsible if it fits); the panel's controls take the shared control styles from T-081.
5. Accessible names of controls unchanged (O-020 Decision 9); browser checks open a group through the shared driver (T-083) before using its controls, so the scripts change only in the driver; driver guard passes; full run passes.
6. Owner validation: the owner opens the panel on laptop and phone.

## Context Files

`src/app/App.tsx`, `src/app/SettingControls.tsx`, `src/app/DebugOverlay.tsx`, the experience `developerSections` definitions, T-081's collapsible part, `tools/validate/driver.mjs`, `.savepoint/objectives/O-020-make-the-phone-view-immersive/Objective.md`.

## Design References

Design.md shell and developer panel; O-020 decisions on the public cog.

## Guardrails

ARCH-01, ARCH-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Inventory and proposed grouping; owner approves.
2. Collapsible groups; driver opens groups; full run; owner look.

## Boundaries

The developer panel's organisation and look; no setting's behaviour changes.

## Technical Verification

Configured gates, lite, full run. Evaluated under `agent-skills/references/check-method.md`.

## Owner Decision — 2026-10-18

Proposed grouping sent to the owner (eight collapsible groups, first open: This demo; Camera and view; Timeline and stories (timeline glow + story panels); Orbit lines (toggles, then a nested "Fine-tune" fold for segments, widths, fade curve, zoom boosts); Sky and Sun (Sky + Sun glow); Labels; Phone layout; Under the hood (Scene instrumentation + Data); nothing dropped). Owner: "think we make them collapsible section" — grouping approved as proposed; Done When 2's owner approval is met.

## Evidence — 2026-10-18 (lane o020-t090)

### Build summary

One shared folding part, `src/shell/Collapsible.tsx` (STYLE-07): the heading is a real `<h3>`/`<h4>` holding a `<button aria-expanded aria-controls>` that takes the shared control styles (`ui-row`, so 44 px on phones through `--control-height`); the body is a labelled group (named by the heading button, so "Orbit lines" and "Labels" keep the group names the driver and screen readers already used) and is not drawn while closed. Open or closed is remembered per viewer in `localStorage` under `astraeus.fold.<id>`, every read and write in try/catch, falling back to the default (first present group open, rest closed). `src/app/App.tsx` now builds an ordered list of groups and renders them all through `Collapsible`; the old "Display settings" section and the `View` setting group are gone. Inner experience sections and Scene instrumentation / Frame rate headings moved from h3 to h4 under the new group h3 (heading order); ids unchanged.

Final layout (a group with nothing for the current experience is not shown; the first shown one opens by default):

1. This demo (`demo`) — the experience's `developerSections`, before-scene then after-scene (Apollo 11: Time and playback, Spacecraft telemetry, Mission context). Only shown when the experience has sections.
2. Camera and view (`camera`)
3. Timeline and stories (`timeline`)
4. Orbit lines (`orbit-lines`) with nested Fine-tune (`orbit-fine-tune`)
5. Sky and Sun (`sky-sun`)
6. Labels (`labels`)
7. Phone layout (`phone-layout`)
8. Under the hood (`under-the-hood`)

### Inventory — every control and readout, old place to new place

Accessible names, test ids and behaviour are unchanged for all of them.

| Control or readout | Old place | New place |
|---|---|---|
| Experience sections (Apollo 11: "Time and playback" with UTC field, Seek (UTC), speed/mission-event controls, Jump to event, journey progress; "Spacecraft telemetry"; "Mission context") | top-level sections around the scene block | 1 This demo |
| Up direction (ecliptic / equatorial) | Display settings > View | 2 Camera and view |
| Marker threshold (px) slider | View | 2 Camera and view |
| Copy view link, view values readout, View link field (group "Camera view") | View | 2 Camera and view |
| Loop playback | View | 2 Camera and view |
| Glow colour, Played colour, Quiet brightness, Steady brightness, Curve, Played floor, Thickness, Halo blur, Reset glow | Timeline glow | 3 Timeline and stories (sub-group "Timeline glow") |
| Open panels automatically, Pause when a panel opens | Story panels (only with story panels) | 3 Timeline and stories (sub-group "Story panels") |
| Orbit ring, Fade ring ends, Trailing arc, Brighten when zoomed out | Orbit lines | 4 Orbit lines (visible) |
| Ring opacity, End fade, Arc length, Arc opacity | Orbit lines | 4 Orbit lines (visible) |
| Fade curve, Arc segments, Arc width, Arc max width, Zoom boost (ring), Zoom boost (arc) | Orbit lines | 4 Orbit lines > Fine-tune |
| Reset orbit lines | Orbit lines | 4 Orbit lines (visible, below Fine-tune) |
| Milky Way picture, Star brightness, Milky Way brightness | Sky | 5 Sky and Sun (sub-group "Sky") |
| Sun glow size, brightness, reach | Sun glow | 5 Sky and Sun (sub-group "Sun glow") |
| Anchor labels, per-object label toggles | Labels | 6 Labels |
| Drawer animation, Top drawer height, Timeline drawer height, Sheet height, Swipe distance, Reset phone layout | Phone layout | 7 Phone layout |
| Scene instrumentation (metric visuals, Advanced coordinates and vectors) | top-level section | 8 Under the hood |
| Frame rate (graph, readouts) — not in the owner's list; diagnostics, so grouped here | top-level section | 8 Under the hood |
| Data alternates (e.g. All orbits / Reliable only / Orbits from ...) | Data | 8 Under the hood (sub-group "Data") |

Nothing dropped, merged or renamed apart from the group headings.

### Decisions to note

- The Frame rate section was not named in the approved grouping; it sits in Under the hood with Scene instrumentation (both are diagnostics). One-line move if the owner prefers it elsewhere.
- Folded bodies are not drawn while closed (cheaper: the Scene instrumentation metrics refresh every frame).
- Existing show conditions are unchanged: Camera and view, Timeline and stories and Phone layout appear under the old "Display settings" condition; Orbit lines, Sky and Sun, Labels and Data under theirs.

### Browser checks (driver)

`tools/validate/driver.mjs` now expands every fold (nested included) whenever it opens the developer drawer (`openDeveloper`, `toggleDeveloper`), so no script changed to reach a control. New driver functions: `expandDeveloperGroups`, `developerGroups`, `developerGroupOpen`, `toggleDeveloperGroup`; `toggleDeveloper(page, {expand:false})` opens the drawer leaving the folds as a first-time viewer finds them. `browser-phone.mjs` gained `checkDeveloperGroups` (Apollo 11, portrait and landscape): group count, only the first open, every heading at least 44 px, one press opens, remembered across a reload, one press closes. Driver guard passes.

### Gates

- `npx tsc --noEmit` clean; `npx vitest run` 64 files passed (1012 tests, one earlier run had a single time-sensitive test fail under machine load, rerun clean); `npm run build` ok; driver guard ok (`tests/browserDriverGuard.test.ts` passes); new `tests/collapsible.test.ts` (storage fallbacks, remembered state, markup with `aria-expanded`, closed body not drawn).
- Standalone `browser-phone.mjs` on dev port 5590: pass, including the new developer-groups check (portrait and landscape).
- Full run (`bash tools/validate/run-full.sh`, ports 5591/5592, zero console errors, every step exit=0 and error-lines=0): **docs/evidence/o020-t090-full-20261018T005955Z/summary.txt** (24/24).
  - Earlier attempts, kept: `o020-t090-full-20261018T003006Z` (spike02 failed: the expanded panel covered the info sheet's Close button; fixed in the driver's `closeInfoStrict`, which presses it from inside the page only when the click is intercepted) and `o020-t090-full-20261018T004634Z` (lite: one load failed with "socket hang up" from the dev server's own request, unrelated, passed on rerun).
  - Contact sheet at docs/evidence/o020-t090-full-20261018T005955Z/contact-sheet.png. The picture diff against the O-017 baseline is large (earlier O-020 work changed the public build), so it is not a T-090 signal; the owner's look on the sheet is the judgement.

### Drift Notes

- Frame rate placement (Under the hood) is an unlisted-in-grouping call; see Decisions.
- `docs/BROWSER_CHECKS.md` not changed: no scenario removed or moved; the driver expands groups so existing scripts are unchanged except the new check in `browser-phone.mjs`.
- Design.md shell/developer panel description not updated in this lane (non-architectural presentation; for the integration Task to account for).
