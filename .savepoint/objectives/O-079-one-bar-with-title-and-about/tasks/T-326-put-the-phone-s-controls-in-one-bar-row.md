---
id: T-326
title: Put the phone's controls in one bar row
objective: O-079
status: done
depends_on: [{task: T-329, requires: clear}]
check_waiver: {task: T-326, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Put the phone's controls in one bar row

## Outcome

In the bar area, styled only from the look settings, the desktop bar and the phone row are both drawn from one ordered list of bar items and one pure fit rule (from the decision note); on a phone the object-name pill is gone and one row shows the title place, the switch as tabs and a menu button whose drawer holds what the rule puts in the menu.

## User Check

At 375×667 and 390×844 a scene with a two-option picker shows one row: title place (the selected object's name until About lands), tabs, menu. Narrowing the screen turns the title place into "i". The menu opens the drawer with the object picker, scale, switches and Info. On desktop at 1280×720 the bar looks as before apart from the order the note sets.

## Done When

The bar item model and fit rule match the note and are a pure, unit-tested decision (the note's worked widths as named cases, plus no switch, views placed in the panel, developer tools on and off); `TopBar` and the phone row render only from the decision (no control placed outside it); optional `shortLabel` on picker options and views, checked under `bad-picker` and `bad-view`, used on the phone row; the existing pill tests, computed-look baseline and browser-driver helpers are migrated as the note lists; two viewers (API-03); README and CHANGELOG lines (the pill is replaced: no backwards compatibility, owner decision 2026-11-21); `npm run api:lock`. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-330-set-up-the-screen-areas-and-one-shared-look.md` under `Technical Evidence`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/Design.md` under `Views of one scene`
- `packages/astraeus/src/shell/TopBar.tsx`
- `packages/astraeus/src/shell/TopBar.css`
- `packages/astraeus/src/shell/ObjectControls.tsx`
- `packages/astraeus/src/shell/ScaleControl.tsx`
- `packages/astraeus/src/shell/DisplaySwitches.tsx`
- `packages/astraeus/src/shell/SwitchControl.tsx`
- `packages/astraeus/src/shell/ControlsDrawer.tsx`
- `packages/astraeus/src/shell/phoneLayout.ts`
- `packages/astraeus/src/shell/phone.css`
- `packages/astraeus/src/shell/embedded.css`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/src/api/pickerInput.ts`
- `packages/astraeus/src/api/views.ts`
- `packages/astraeus/tests/domPhone.test.ts`
- `packages/astraeus/tests/domEmbedded.test.ts`
- `packages/astraeus/tests/twoViewers.test.ts`
- `packages/astraeus/tests/computedLook.test.ts`
- `packages/astraeus-site/tools/validate/driver.mjs`
- `packages/astraeus-site/tools/validate/journey-planets-phone.mjs`
- `docs/agents/browser-policy.md`

## Design References

The decision note; Design "Views of one scene", "Good guest" (ids, styles, scoped keys), "Host-page behaviour".

## Guardrails

ARCH-01, ARCH-03, API-01, API-03, API-04, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-07, CODE-01.

## Implementation Plan

1. Write the bar item list and the pure fit decision from the note, with its named cases.
2. Add `shortLabel` to picker options and views (checks, carry to the shell).
3. Render the desktop bar from the decision; keep existing controls as the item renderers.
4. Replace the pill with the phone row (title place, tabs, menu) rendered from the decision; the drawer keeps its tap, swipe and `PhoneLayoutSettings` and holds the menu items; measurement resize-aware through `ResizeObserver`.
5. Apply the note's embedded-viewer finding.
6. Migrate the tests, baseline and driver helpers the note lists; run the phone journey (one browser job at a time).
7. README, CHANGELOG, `npm run api:lock`.

## Boundaries

Uses the panel rule from T-329 for the menu drawer, ⋯ and pop-ups; no About content (T-325), no story buttons (O-080), no version bump.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone`, `check:pack` and the phone browser journey under the browser policy. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (path, section, reason): `docs/architecture/viewer-interface.md` sections 2, 4, 6, 7, 8, 9 (named by the coordinator's brief); the Technical Evidence and Drift Notes of T-330 and T-329; `packages/astraeus/src/shell/{areas/*,panels/{panelRule,usePanels}.ts*,look/look.css (token names),useDrawerSwipe.ts,topBarIcons.tsx,scaleModel.ts}`, `src/api/{planPicker.ts}`, `src/app/{App.tsx (viewChoice),views.ts,listSwitch.ts,FeatureMarkers.ts (occluder list)}`, `tests/{domSetup.ts,picker.test.ts,sceneViews.test.ts,cameraChoices.test.ts,displaySwitches.test.ts,viewsDom.test.ts}` (to see which parts tests mount alone and which structure they assert), `packages/astraeus/README.md` rows for `setPicker`, `setViews`, "Interface modules"; `CHANGELOG.md` top section.

**What was built.**
- `shell/bar/barItems.ts`: the item model (kinds title, switch, story, engine, menu; forms full, short, i, compact; `ENGINE_PRIORITY` picker 1, Info 1, scale 2, camera 3, display 4, moons 4, related 5, developer 6; story priority is its order). The story-button kind and `storyItem` exist so O-080 only adds items.
- `shell/bar/fitBar.ts`: the pure fit rule (note section 4 steps 1-7, one action per pass, the first step that applies; a width of 0 means "not measured yet" and moves nothing).
- `shell/bar/useBarFit.ts`: measures the row's content width and gap and every item's width per form from a hidden measuring row (`BarMeasure` in `Bar.tsx`: plain spans, no control, no id), re-measured by a `ResizeObserver` on the row and on every ghost, and on any change of items or layout.
- `shell/bar/Bar.tsx` (the one row, the title place, the menu button with tap and swipe-down), `BarMenu.tsx` (what the rule put in the menu; "This story" first), `barEntries.tsx` (state to items; the existing controls are the item renderers), `shell/DeveloperToggle.tsx` (the cog, moved out of the deleted `TopBar.tsx`).
- `ControlsDrawer` is now only the menu panel (the pill is gone): a drawer dropping from under the bar on a phone, a drop-down at the bar's right end on a wide screen, opened by the bar's menu button through the panel rule (`menu` occupant, Escape, choose-in-drawer) and placed by `areas.css` in the grid row under the bar. `ObjectControls.tsx` gained `objectControlParts` (picker, Info, each camera button and related object as separate parts); `ObjectControls` still draws them together for a part drawn alone. `SwitchControl` and `ViewButtons` take a `form` (full, short, compact drop-down).
- `shortLabel` on `PickerOptionInput` and `ViewInput` (checked under `bad-picker` and `bad-view`, carried through `ResolvedView`, `ViewChoice`, `ExperienceSwitch`, used on the row).
- Styles: `TopBar.css`, `phone.css`, `areas.css`, `embedded.css`, `style.css` use tokens only (`lookDrift.test.ts` green). Removed: `.controls-pill` and its rules, the cog's absolute positions, `.shell-top`, `.top-bar-divider`, the cog column the drawer reserved.
- README (`setPicker`, `setViews` rows, "Interface modules" bar paragraph, `src/shell/` row), `CHANGELOG.md` 0.9.5 (proposed) two lines, `npm run api:lock` (two optional `shortLabel` fields), `npm run api:errors` (no change). Site driver `driver.mjs`: `HOOK.menu`, `openMenu`/`closeMenu`, `isPhoneLayout` reads `data-phone`, `reveal` opens the menu on a wide screen too, `barTitleName`, `switchInBarRow`, `tapMenu`, `swipeMenuDown`, moon panel opened by its button wherever it sits; `journey-look-out.mjs` calls `closeMenu`; `journey-planets-phone.mjs` asserts the switch is on the one row. Not run (no browser runs in this brief).

**New tests.** `fitBar.test.ts` (16 cases: the note's phone 360, 390, 430 and Belt-view-at-360 cases, wide 1280 with and without developer tools, wide 768 with and without developer tools, "Title shrinks first", no switch, views placed in the panel, a new engine item moving in priority order, not measured, very narrow); `barDom.test.ts` (8 cases through the real shell with stubbed widths: no pill, the row holds title, tabs and menu button, drawer by tap and swipe, wide bar with the cog in the row, the cog and switch behind the dots when narrow, full, short and "i" forms, the measuring row holds no control); `shortLabels.test.ts` (8 cases: both fields carried; empty, number and null refused under `bad-picker` and `bad-view`). Two viewers (API-03): the shell keeps all bar state per viewer (the panel rule's `menu` state, `useBarFit` refs, ids from `useId`); the existing `twoViewers.test.ts` phone-drawer case exercises it once its pill selector is migrated (see Blocked).

**Gates (root of the checkout).** `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm run check:pack` astraeus packed 7.33 MB, **unpacked 9.56 MB** (limit 9.5; was 9.53 MB before this Task: the bar modules and tests add about 30 KB, the removed pill and TopBar code does not cover them); `npm test` 4210 pass, **59 fail**: 2 are the known `packagePacks.test.ts` pack-size reds, **57 are in existing tests that click `button.controls-pill`** (see Blocked); `npm run check:engine-alone` fails only on those same 57. `apiReference.test.ts` page limit (46,000) was exceeded by 72 bytes by my two doc comments; shortened to `/** Label for a narrow bar. */` (passes).

**Owner decision and migration.** Owner: "Approve the migration (Recommended)". Applied exactly the listed changes: `button.controls-pill` to `button.bar-menu-button` in `computedLook` (`:73`, and `:not(...)` at `:75`), `displaySwitches`, `domEmbedded`, `domPhone`, `escapeScope`, `hostPageDom`, `panelPlacementDom` (5), `twoViewers`, `viewerIds` (`:35`, `:124`); assertion changes (change 1 pill replaced, change 3 title place): `domPhone` two cases read `[data-bar-title]`, `viewsDom` "shows the choice in the phone drawer too" reads the view tabs in the row (`.top-bar [data-view-choice]`, 3 `data-view-id`); `viewerStyles.test.ts` `HOST_PARTS` pruned of `controls-pill`, `shell-top`, `top-bar-divider`. No other setup or input changed.

**Baseline.** `npm run look:lock`; diff reviewed property by property (no element added or removed from the key sets apart from the DOM below; 18 changed row groups): the toolbar and `.top-bar` are 100% wide flex rows (were content-sized, `calc(100cqw - 160px)` max); new `.bar-spacer` (flex, margin `calc(6px * -1)`), `.bar-title` (inline-flex, 17px/600, padding 6px, control height), `.bar-sr`, the hidden measuring row `.bar-measure` and ghosts (nowrap, control height, padding 12px / 28px); new `.bar-menu-button` (icon button 44 phone, 36 wide, 30 embedded); removed: the pill (absolute, `calc(8px + safe-top)`, 44px, max-width `calc(100% - 72px ...)`), the cog's absolute top/right positions, `.shell-top`, `.top-bar-divider` (1px by 24px, 4px margins); the controls drawer now has 12px padding (bottom 28px), a 1px border and sits in the menu area (was `top:0` full width with the cog column reserved), grid row padding 12px (was 8px) on the phone areas; the object picker in the drawer is 100% wide (was `calc(100% - 56px)`); embedded phone and wide pill/cog offsets gone. No colour changed.

**Outside press (note section 6 change 9).** `panelRule.ts`: with no pop-up open, `outsidePress` closes a wide screen's menu (a phone's drawer stays); with a pop-up open it closes only the pop-up first (existing case unchanged). `usePanels.ts` treats a press on the menu button or inside the drop-down (also a control nested in it) as inside (`MENU_HOST`, `data-popup-host="menu"` on both). New cases: 3 in `panelRule.test.ts` (wide closes, phone stays, pop-up first then menu) and 1 in `barDom.test.ts`. Existing `panelRule.test.ts` cases unchanged.

**Gates after migration (root).** `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 4271 pass, 2 fail (only the known `packagePacks.test.ts` pack-size reds); `npm run check:engine-alone` pass (3167 tests); `npm run check:pack` astraeus unpacked **9.56 MB** (limit 9.5).

**Done When, criterion by criterion**

| Criterion | Outcome |
|---|---|
| Bar item model and fit rule match the note; pure, unit-tested decision with the worked widths as named cases plus no switch, views in the panel, developer tools on and off | `barItems.ts`, `fitBar.ts`, `fitBar.test.ts` (16 cases). Deviation: the note's wide worked totals use inconsistent gap counts (1186 and 698 imply the scale and help as two gap-separated items moved together); the test models scale + help as one item of 146 and asserts the note's placements (1280 all on the row, 768 as stated), not its totals (1180, 1222 with developer tools, 692). |
| `TopBar` and the phone row render only from the decision; no control placed outside it | `TopBar.tsx` deleted; `Bar.tsx` draws the row and `BarMenu.tsx` the menu from `fitBar`'s placements; `barDom.test.ts` "draws every control from the one list" asserts no button or select in the bar area outside the row. The cog is a bar item. |
| Optional `shortLabel` on picker options and views, checked under `bad-picker` and `bad-view`, used on the phone row | `shortLabels.test.ts` (8); the row uses it (`barDom.test.ts` full to short at 300 px). |
| Pill tests, computed-look baseline, browser-driver helpers migrated as the note lists | Done: tests and `HOST_PARTS` migrated, baseline rewritten and reviewed (above), driver and two journeys migrated (browser not run). |
| Two viewers (API-03) | State is per viewer (panel rule, hook refs, `useId`); covered by the migrated `twoViewers.test.ts` phone-drawer case, and `panelPlacementDom.test.ts` two-viewer case unchanged. |
| README and CHANGELOG lines | README (`setPicker`, `setViews`, `src/shell/`, "Interface modules"); CHANGELOG 0.9.5 (proposed), a Changed and an Added line. |
| `npm run api:lock` | Run; lock gains the two optional `shortLabel` fields only. |
| On a phone the object-name pill is gone, one row holds title place (selected name), tabs, menu button | `barDom.test.ts` "has no name pill; one row holds the title place..."; appearance on `localhost:5490` is the owner's. |
| Narrowing turns the title place into "i" | `barDom.test.ts` full, short and "i" forms (stubbed widths); `fitBar.test.ts` phone cases. |
| Menu opens the drawer with picker, scale, switches and Info | `barDom.test.ts` "opens the drawer from the menu button by a tap or a swipe down" (picker, Info, scale, cog in the drawer). |
| Wide bar as before apart from the note's order | `barDom.test.ts` wide bar: controls and cog in the row, no title place, no menu button while all fits. The cog is now in the row (was absolute top right), the moons button is a row item (was under the bar), the dividers are gone. |
| Styles only from look tokens | `lookDrift.test.ts` green. |
| Apply `docs/agents/verification.md` | Gates above; no browser run (this brief). |

## Drift Notes

For T-327 (Design reconciliation); T-327 accounts for each as reflected in Design.md or non-architectural.
1. **Modules**: `shell/bar/{barItems.ts, fitBar.ts, useBarFit.ts, Bar.tsx, BarMenu.tsx, barEntries.tsx}` (the note lists the first five; `barEntries.tsx` is the state-to-items builder, so `barItems.ts` stays plain data). `shell/DeveloperToggle.tsx` holds the cog.
2. **Title place on a phone only** until T-325: a wide bar shows no title (the object's name would repeat the picker). The title is not a control; it shows "i" or the name and keeps the full name for a screen reader. T-325 makes it the About title and a button.
3. **Measuring** is a hidden row of ghost spans (shape and text per item per form), not the real controls (they hold state and pop-ups); the ghost styles copy the control classes and tokens, so widths are close, not exact. Measured width of the row is `getBoundingClientRect` minus padding and border (a stub-friendly read).
4. **Compact switch** is a native `<select>` (the list in the browser's pop-up), not a custom pop-up through the panel rule.
5. **Outside press** closes the wide ⋯ drop-down (rule in `panelRule.ts`, host check `MENU_HOST` in `usePanels.ts`); a phone drawer stays open on an outside press.
6. **Menu in the grid**: the `menu` area is the grid row under the bar (`grid-row: 2`), the drawer positioned inside it, so it drops from just under the bar without measuring the bar. The cog column reservation and `--safe-*` padding now live on `.astraeus-areas` (phone).
7. **Priorities**: related objects 5 is its own item per object; camera presets are separate items of priority 3 (the note's 768 case moves Overview, Follow, Focus one by one); display switches are one item.
8. **`data-phone` kept**, as in T-330 note 2; the site driver reads it.
9. **Occluder list**: `FEATURE_OCCLUDER_SELECTOR` lost `.controls-pill`; `[data-area]` occluders (note section 8) are not done here.
10. **Embedded**: `embedded.css` lost the pill, cog, divider and `.shell-top` rules; a framed wide bar keeps its padding and gap overrides as tokens. Token-only embedded overrides (control height 30, steps one smaller) remain T-330 note 5.
11. **Wide worked totals** of the note are inconsistent by one gap (see Done When row 1); worth fixing in the note when T-327 reconciles it.
12. **Pack size**: engine unpacked 9.56 MB (limit 9.5, owner "Wait for cleanup").

Coordinator marked done (owner: "orchestrate 79"); gates: npm test 4271 passed, 2 failed (known pack-size, owner "Wait for cleanup"; engine unpacked 9.56 MB).
