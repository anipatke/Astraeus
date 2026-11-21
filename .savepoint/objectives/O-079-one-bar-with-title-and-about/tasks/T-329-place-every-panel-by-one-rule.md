---
id: T-329
title: Place every panel by one rule
objective: O-079
status: done
depends_on: [{task: T-330, requires: clear}]
check_waiver: {task: T-329, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Place every panel by one rule

## Outcome

One owner decides which panel holds which screen area and what opening one closes; every existing panel, card, sheet and drawer (object, event and window cards, story panels, moons sheet, switch panel, scale explanation, controls drawer, developer drawer, panel load boundary) sits in its area, is placed through it and styled only from the look settings, rebuilt where the note says, and today's scattered close rules and old panel styles are gone.

## User Check

On desktop and phone, open the object card, an event card, a story panel, the moons sheet, the switch panel, the scale explanation and the drawers in turn: each appears where it did (or where the decision note says it now goes), and opening one closes exactly the ones the note's close table says.

## Done When

The note's place model and close-rule table are implemented as one pure, unit-tested decision (every row of the table a named case, desktop and phone) plus one shell hook or component that applies it; every panel listed in the note uses it; every rule in the note's inventory is removed or shown to be the new rule; existing panel tests pass unchanged except where the note records a deliberate change (each such change named in evidence); two viewers keep separate state (API-03). Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/Design.md` under `Good guest`
- `.savepoint/Design.md` under `Host-page behaviour`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/src/shell/InfoPanel.tsx`
- `packages/astraeus/src/shell/StoryPanelView.tsx`
- `packages/astraeus/src/shell/useStoryPanels.ts`
- `packages/astraeus/src/shell/useDrawers.ts`
- `packages/astraeus/src/shell/DisplaySwitches.tsx`
- `packages/astraeus/src/shell/ScaleControl.tsx`
- `packages/astraeus/src/shell/phoneLayout.ts`
- `packages/astraeus/src/shell/phone.css`
- `packages/astraeus/src/shell/style.css`
- `packages/astraeus/src/shell/MoonFamilyPanel.tsx`
- `packages/astraeus/src/shell/ControlsDrawer.tsx`
- `packages/astraeus/src/app/DeveloperSettings.tsx`
- `packages/astraeus/src/app/developerPanels.tsx`
- `packages/astraeus/src/app/PanelLoadBoundary.tsx`
- `packages/astraeus/src/app/FeatureMarkers.ts`

## Design References

Design "Good guest" (scoped keys, ids, styles), "Host-page behaviour" (phone sheet and timeline space); the decision note.

## Guardrails

ARCH-01, ARCH-02, API-03, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-07, CODE-01.

## Implementation Plan

1. Write the pure place decision from the note (state of open panels plus a request → new state) with a test per close-table row.
2. Add the shell hook that holds the open-panel state and applies the decision; route each panel's open and close through it.
3. Remove each inventoried rule as its panel moves; keep behaviour, except the note's listed changes.
4. Run the existing panel, phone and story tests; update only where the note records a change, naming each.
5. Add the API-03 two-viewer case.

## Boundaries

No About (next Task), no host panels or tile (O-080, O-081), no public API change, no version bump. Return REPLAN REQUIRED if a panel cannot follow the note without a product change.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone` and the phone browser journey under the browser policy. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (path, section, reason): `docs/architecture/viewer-interface.md` sections 2, 5, 6, 8, 9 (named by the coordinator's brief); `packages/astraeus/src/shell/{TopBar.tsx (DeveloperToggle), viewerKeys.ts, areas/*, look/look.css (layers)}`, `shell/TimelineBar.css`, `shell/embedded.css`, `tests/{domSetup.ts, escapeScope.test.ts, viewerIds.test.ts, domMenuAndLink.test.ts, timelineMarkerGroups.test.ts, domShell.test.ts, domMoonPanel.test.ts}` (to see which parts tests mount alone and what they assert); `packages/astraeus/CHANGELOG.md` top section.

**What was built.**
- `shell/panels/panelRule.ts`: the pure rule `(state, action, layout) -> state`, plus `topmost` (what Escape closes) and `timelineLayerFor`. State: `left` (card or moons), `story`, `developer`, `menu`, `timeline`, `popup` (one id).
- `shell/panels/usePanels.ts`: holds the state per viewer (`useReducer`), is the viewer's one Escape listener and one outside-press listener (both viewer-scoped, API-03), and `useMirroredPanels` (the story panel's timing and the host's developer mode are mirrored into the rule; when the rule closes the developer panel the host's mode follows).
- `shell/panels/PopupContext.tsx`: how a part asks for a pop-up (`usePopup(id)`, `usePopupPlace()`); a part drawn with no shell keeps the same rule for itself (`scope: "standalone"`), inside a shell its listeners are off.
- `AstraeusShell` renders one `astraeus-areas` grid with `Area` bar, menu, left, right, developer and timeline: toolbar and moons button and the Developer cog in `bar`; the phone controls drawer in `menu`; the moons sheet and the card in `left`; the story panel in `right`; the developer drawer in `developer`; the timeline in `timeline` (layer raised while its drawer or a pop-up is open). Card, moons, drawer, timeline drawer, story and developer open and close through the rule; scale menu, scale explanation, Display panel, Events list and marker groups are pop-ups through `usePopup`.
- Removed (inventory): `useDrawers.ts` (drawer pair and its Escape), the menu-closes-card-and-story rule and the moons-vs-card effect in `AstraeusShell`, `InfoPanel` and `StoryPanelView` Escape, `MoonsSheet` Escape, `ScaleControl` outside press and both Escape handlers, `DisplaySwitches` outside press and Escape, the marker group's Escape, `ControlsDrawer` and `TimelineBar` drawer closes now `onItemChosen` (the rule's `chooseInDrawer`), z-index hacks (`TimelineBar.css` three rules, `phone.css` drawer-open, info-panel and story-panel layers), `style.css` "developer steps left" (now `areas.css`, on the right place being occupied), `shell-top` absolute positioning and the old absolute/fixed positions of the info, story, moons and developer panels.
- Styles: no raw value added; `lookDrift.test.ts` is green. `areas.css` now owns the row for the timeline (`--timeline-space`), area layers and the developer position. Baseline `computed-look.baseline.json` rewritten with `npm run look:lock`; the diff is the move of `.shell-top` from absolute to a flow child, new `astraeus-areas` grid, layer values per area (panel 4, left 5, bar 9 and so on), the info/story/developer/moons panels no longer positioned themselves, `pointer-events: auto` on area children.

**Behaviour changes implemented (all from the note section 6 / section 5).** 7 menu no longer closes the card or story panel, and on a phone the moons list is a detail sheet opened by a button in the menu (choosing it closes the menu); 8 Escape closes the topmost only; 9 one pop-up at a time (opening a pop-up closes the other; an outside press closes it); 10 shared left place (card and moons); 11 phone developer drawer is a detail sheet (opening it closes the card and the card closes it; the story sheet stays). Also (note section 5 table, "Scale menu, scale help, Display, events list, marker group list": pop-ups): the Events list and the marker group list now close on an outside press, the Events list now closes on Escape.

**Tests.** New: `tests/panelRule.test.ts` (27 cases: every row of the close table named, wide and phone, plus developer place and Escape order); `tests/panelPlacementDom.test.ts` (12 cases through the real shell: each panel in its area, the close table at screen level, changes 7, 9, 11, Escape order, and the API-03 two-viewer case). Changed (assertions only): `escapeScope.test.ts`: after one Escape the viewer keeps its drawer and story panel and loses only the switch pop-up (change 8, the constant `ALL_CLOSED` renamed `AFTER_ONE_ESCAPE` with a comment); no setup or input changed. `computed-look.baseline.json` rewritten (see above).

**Gates (root of the checkout).** `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 4232 pass, **5 fail**: 2 in `packagePacks.test.ts` (the known pack-size red, now `astraeus: unpacked 9.53 MB is over 9.5 MB`, was 9.51 MB: the new modules and tests add about 20 KB; nothing removed from the pack outweighs them) and **3 in `viewerIds.test.ts` ("mount, phone", "AstraeusScene, phone", "App, phone")**, see Blocked; `npm run check:engine-alone` fails only on those same tests. Pack size: `npm run check:pack` astraeus packed 7.32 MB, unpacked 9.53 MB (limit 9.5).

**Blocked (needs owner or coordinator).** `viewerIds.test.ts` phone cases open the developer panel, then the object card, then a story panel, and expect all three to be open at once. The note's change 11 makes the phone developer panel a detail sheet that the card replaces, so the developer panel closes when the card opens. The test's inputs cannot stay as they are under the note. The smallest repair is to move the three `.developer-mode-toggle` lines in that test after the story panel opens (same clicks, new order); I did not make it because the rule here is no change to an existing test's setup or inputs. Alternative: drop the phone developer exclusion from the rule (deviates from the note).

**Done When, criterion by criterion**

| Criterion | Outcome |
|---|---|
| Place model and close table are one pure, unit-tested decision, every row a named case, desktop and phone | `shell/panels/panelRule.ts`; `tests/panelRule.test.ts` runs each row under `describe.each(["wide","phone"])` plus the developer place cases. |
| One shell hook or component applies it | `usePanels` (+ `useMirroredPanels`, `PopupContext`) used once by `AstraeusShell`. |
| Every panel listed uses it | object/event/window cards and place card (`left`), moons sheet (`left`), story panels (`right`), developer drawer (`developer`), controls drawer (`menu`), timeline drawer (`timeline`), scale menu, scale explanation, Display switch panel, Events list and marker group (pop-ups), `PanelLoadBoundary` wraps the moon list inside the left place (unchanged component). Placement asserted in `panelPlacementDom.test.ts`. |
| Every inventoried rule removed or shown to be the new rule | See "Removed" above, one entry per inventory line; `useDrawers.ts` deleted. `ControlsDrawer` and `TimelineBar` keep their `data-closes-drawer` delegation but report `onItemChosen` to the rule. |
| Existing panel tests pass unchanged except where the note records a change, each named | `escapeScope.test.ts` (change 8) only. Not passing: `viewerIds.test.ts` phone x3 (change 11 vs the test's inputs, see Blocked) and the known pack size. |
| Two viewers keep separate state (API-03) | `panelPlacementDom.test.ts` "two viewers keep separate panel state"; `usePanels` listeners are viewer-scoped, the pop-up host check requires the host to be inside this viewer; `escapeScope.test.ts` still passes. |
| Styles only from the look tokens | `lookDrift.test.ts` green; no raw value added. |
| Apply `docs/agents/verification.md` | Gates above; the phone browser journey is not run (no browser runs in this brief); owner judges appearance on `localhost:5490`. |

## Drift Notes

For T-327 (Design reconciliation); T-327 accounts for each as reflected in Design.md or non-architectural.
1. **Panel modules**: `shell/panels/{panelRule.ts, usePanels.ts, PopupContext.tsx}`. The note names `panelRule.ts` and `usePanels.ts`; `PopupContext.tsx` is added so parts report pop-up intents without prop drilling (a context value per viewer). A part drawn alone falls back to the same rule with `scope: "standalone"` (tests mount `ScaleControl` and `TimelineBar` alone).
2. **Mirrors**: the story panel's open state stays in `useStoryPanels` (timing, causes) and the developer mode stays host-owned; both are mirrored into the rule, and the rule's Escape on story calls `story.close()`. Not one source of truth for those two; the rule is authoritative for `left`, `menu`, `timeline`, `popup`.
3. **Rendering by wide area name**: the developer, left and right areas map onto the phone sheet in `areas.css`, so parts render once by their wide area name; no `sheet` element is rendered yet (a `sheet` Area is not needed until the tile, O-081).
4. **Developer has no Escape** (it never had one), so `topmost` skips it; on a phone it is a detail sheet by the rule but is closed only by its cog or by a card or moons sheet opening.
5. **Cog in the bar area, temporarily**: `DeveloperCog` is rendered inside `Area bar` (layer top) so it stays over the phone drawer; T-326 moves it into the bar row. The phone controls drawer sits in `menu` (inset 0, layer drawer); T-326 replaces the pill and drawer.
6. **Timeline area row**: `areas.css` row three is `--timeline-space` (measured by `useTimelineSpace` from the window height, still the window; T-331 moves it to the viewer and `timeline` container). The timeline bar keeps its own absolute position inside the area.
7. **Layers**: `areas.css` gives each area its layer (bar 9, left 5, right 4, developer 6, menu 7, timeline 3, raised to 7 for its drawer and 9 for a pop-up). The three extra layers from T-330 drift note 1 (`-panel`, `-bar`, `-sheet`) are still all used (`-sheet` now unused in CSS; collapse in T-327/T-331).
8. **Events list** is a native `details` driven as a pop-up (summary click is intercepted and `open` is set from the rule); it now closes on an outside press and Escape.
9. **`phoneLayoutStyle`** still emits `dvh` caps and `--controls-drawer-max` is still set (used by the controls drawer); `--timeline-drawer-max` and `--sheet-max` unchanged.
10. **Embedded** wide viewers: `embedded.css` now sets `.astraeus-areas` padding to space-3 instead of moving `.shell-top`; `--shell-timeline-space` removed everywhere.
11. **Not done**: view switch dropping a story panel is still derived in `useStoryPanels` (cause `move`) and mirrored, not an explicit `viewSwitch` action (the rule's `viewSwitch` action is used for the card only); shelf panels (O-080) not present yet.

### Coordinator repair and close (2026-11-21T01:54:19Z)

- Owner on the `viewerIds.test.ts` phone cases: "Check in two steps (Recommended)". On a phone the test now checks the Developer pairs and every reference with the Developer drawer open, then opens the card and story panel and checks the remaining pairs and every reference. Every pair checked before is still checked; the wide cases are unchanged.
- The first step exposed a dangling reference: the timeline's "Just happened" and window buttons named the info panel's id while the panel was not drawn and carried no `aria-expanded`. Fixed at the source: `AstraeusShell` passes `infoPanelId` to the timeline only while the panel is drawn (`TimelineBar` and `TimelineExpanded` take it as optional). Regression: `viewerIds.test.ts` phone step 1 (`expectEveryReference`).
- Gates after repair: lint 0, typecheck 0, build 0; `npm test` 4235 passed, 2 failed (both the known `packagePacks.test.ts` pack-size failures, owner "Wait for cleanup"; engine unpacked 9.53 MB). Coordinator marked done (owner: "orchestrate 79").
