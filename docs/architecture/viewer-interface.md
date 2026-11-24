# Viewer interface reset (G-023)

Decision note for O-079 (T-328), also binding O-080 and O-081. The build Tasks implement this note; where it and an Objective's draft shapes differ, this note wins. Status: **confirmed by the owner 2026-11-21 and built in O-079** (T-330, T-329, T-326, T-331, T-325, T-332, T-327). Where the build deliberately differs, the section says so under "As built"; Design.md "Viewer interface" describes the result.

## Summary for the owner

Today the viewer's controls grew one feature at a time, each placing and colouring itself. We rebuild them on four shared rules: one map of screen places, one set of colours and sizes, one rule for what fits in the bar, and one rule for which panel shows where. A story app gets a title that opens an About panel (with its credits, links and "Built with Astraeus"). It can also take ready-made story parts off a shelf (filter chips, explainer text, a colour key, and later a readout tile and a chart) or a blank panel it fills itself, so it needs no bars of its own. Nothing needs setting up for the basic viewer.

```
DESKTOP                                         PHONE
+-----------------------------------------------+   +---------------------------+
| Title | Tab|Tab | Story btns ... engine | ... |   | i | Tab|Tab | Gaps |  ☰  |  <- one row
+-----------------------------------------------+   +---------------------------+
| LEFT PLACE          |               | RIGHT    |   |  menu drawer (drops down  |
| About, card, moons, |    scene      | story    |   |  from ☰ when opened)      |
| story-part panel    |               | panel    |   |                           |
| (tile above it,     |               |          |   |          scene            |
|  O-081)             |               |          |   |                           |
|                     |               |          |   | SHEET: About, card, story |
|                     |               |          |   | panel, part panel, moons  |
+-----------------------------------------------+   | (tile strip, O-081)       |
| ▶  date   ======timeline=========  speed  Ev  |   +---------------------------+
+-----------------------------------------------+   | ▶ date  ====timeline===== |
                                                    +---------------------------+
```

What changes from today, on purpose:

- **Phone:** the object-name pill is gone. One row holds the title (or an "i" when tight), the story's tabs, as many story buttons as fit and a menu button. The menu holds the object list, camera, scale, display switches, moons, developer tools and any story buttons that did not fit.
- **Desktop:** one bar across the top with the title on the left. The developer cog joins the bar. When the bar is too narrow, the least-used controls move into a "⋯" menu.
- **Title place:** with an About, it shows the app's title and opens About. Without one, it shows the selected object's name and opens its card.
- **Look:** the accent turns from orange (#fc6323) to amber (#e8b06a). Buttons become pills and tabs become segmented. The bar and all panels share one dark see-through background. Text sizes collapse to six steps.
- **Touch sizes** follow the kind of pointer (finger or mouse), not the window width. A mouse at 768 px gets the normal 36 px buttons.
- **Size rules follow the viewer's own size, not the window's,** so a small embedded viewer lays itself out as a phone.
- **Moons on a phone** open as a sheet above the timeline instead of inside the menu drawer. Opening the menu no longer closes an open card or story panel.
- **Escape** closes one thing at a time, the topmost first. Today one press can close both phone drawers and the story panel.
- **Only one small pop-up** (scale menu, scale help, Display, events list, marker list, ⋯ menu) is open at a time.
- **Desktop left place:** About, a card, the moons list and a story-part panel share it, so opening one closes the other. Today only moons and the card did this.
- **Developer drawer on a phone** opens in the sheet place above the timeline.

Everything else (selection, camera, story timing, playback holds, signals to the host) is kept as it is.

## 1. Inventory and verdicts

Verdict: **keep** means the logic stays and only placement and styling move to the new rules. **Rebuild** means the code is replaced. D = desktop, P = phone.

| Part | Code today | Where today | Verdict |
|---|---|---|---|
| Shell root | `shell/AstraeusShell.tsx:547-548` sets `data-phone`, `data-embedded`, phone and label vars | fills mount | Rebuild as areas grid; selection and camera logic (`AstraeusShell.tsx:338-507`) moved unchanged to `shell/selection/` |
| Top bar | `shell/TopBar.tsx:40-67`, `TopBar.css:5-15` | D: pill top-left, `max-width: calc(100vw - 168px)` (`style.css:41`); P: grid inside the drawer (`phone.css:63-90`) | Rebuild: bar from items + fit rule |
| Picker switch | `shell/SwitchControl.tsx:13-31` | D: first in bar; P: drawer grid (`phone.css:82`) | Keep logic, merged with views into one `Tabs` part |
| View buttons | `shell/DisplaySwitches.tsx:23-34` | as picker; `place: "panel"` → switch panel rows (`DisplaySwitches.tsx:82-84`) | Keep in `Tabs`; `panel` place kept (rows in Display pop-up) |
| Object picker | `shell/ObjectControls.tsx:65-88` | D: bar; P: drawer first row (`phone.css:77`) | Keep; engine item |
| Info button | `ObjectControls.tsx:89-102` | D: bar; P: drawer | Keep; engine item |
| Camera presets | `ObjectControls.tsx:45-61,103-107` | D: bar icons (text hidden, `TopBar.css:23`); P: icon over word (`phone.css:80-81`) | Keep; engine items |
| Related objects | `ObjectControls.tsx:108-122` | as presets | Keep; engine items |
| Scale toggle/menu | `shell/ScaleControl.tsx:17-138`; outside-press listener `:63-68` | D: bar, menu below; P: drawer (`phone.css:83-86`) | Keep; menu becomes a pop-up through the panel rule |
| Scale explanation | `ScaleControl.tsx:141-177`; own listener `:147-152` | pop-up beside scale | Keep; pop-up through the panel rule |
| Display switches + switch panel | `DisplaySwitches.tsx:45-91`; own outside/Escape `:67-74` | D: bar + pop-up (`TopBar.css:79-93`); P: drawer (`phone.css:88`) | Keep buttons; panel becomes a pop-up through the panel rule |
| Developer cog | `TopBar.tsx:71-86`; `TopBar.css:26-31`; `phone.css:29` | own corner top-right | Rebuild as lowest-priority bar item |
| Developer drawer | `AstraeusShell.tsx:68-79`; `style.css:112-135`; steps left of story panel `style.css:359-361`; P `phone.css:166-173` | D right under bar; P below pill | Keep content (`app/DeveloperSettings.tsx`, `app/developerPanels.tsx:10-20`); placement rebuilt |
| Controls pill + drawer | `shell/ControlsDrawer.tsx:19-51`; `phone.css:17-28,39-90` | P only | Rebuild as menu button + menu drawer (D: ⋯ drop-down) |
| Drawer pair rule | `shell/useDrawers.ts:15-33` | P | Replaced by the panel rule |
| Object/event/window/place card | `shell/InfoPanel.tsx:20-60`; `style.css:47-60`; P `phone.css:144-163` | D in `.shell-top` column under bar; P sheet, opaque `#0e0e13`, z 8 | Keep content; placed by the panel rule |
| Story panel and steps | `shell/StoryPanelView.tsx:37-67`; `style.css:216-236`; P `phone.css:144-162`; timing `shell/useStoryPanels.ts:22-97` | D right, `top: 56px`; P sheet z 4 under card | Keep content and timing; placement and Escape (`StoryPanelView.tsx:42-46`) by the panel rule |
| Moons toggle + sheet | `AstraeusShell.tsx:82-94,511-516`; `style.css:370-405`; P inside drawer `AstraeusShell.tsx:550` | D button + sheet in left column; P in drawer | Rebuild placement: bar/menu item + panel in left place or sheet |
| Moon family list | `shell/MoonFamilyPanel.tsx:19-93` | inside the above | Keep |
| Timeline bar | `shell/TimelineBar.tsx:82-290`; `TimelineBar.css:2-142`; P `phone.css:93-139` | bottom, one line D, two lines ≤900 px (`TimelineBar.css:108-119`) | Keep logic (T-331); restyled; drawer, events list (`TimelineBar.tsx:252`) and marker group list (`:169-195`) through the panel rule |
| Timeline drawer | `TimelineBar.tsx:258-288`; `phone.css:110-139` | P | Keep content; placed by the panel rule |
| Timeline space measure | `AstraeusShell.tsx:35-47` (`--timeline-space`) | sheets sit above it | Rebuild: the areas grid places sheets above the timeline row, so nothing is measured |
| Panel load boundary | `app/PanelLoadBoundary.tsx:7-18` (class `developer-loading` also used for moons) | in place of the failed panel | Keep; renamed generic `load-error` part, look tokens |
| Developer loading | `app/App.tsx:790` (`role="status"`) | developer area | Keep |
| Loading cover | host's (`shell/bootLoader.ts:1-2`; Design "Good guest" (5)) | host page | Not an interface part; unchanged |
| Labels, story and place markers | `style.css:85-106,279-345`; `app/style.css:137-150` | scene overlay | Keep; tokens only |
| Marker occlusion | `app/FeatureMarkers.ts:59-63,224-240` (a list of 12 class names) | measures panels | Rebuild selector: every area carries `data-area`, and the layer measures `[data-area]`, so a new panel is counted without editing the list. As built: not done in O-079; the class list stays (`.controls-pill` removed) |
| Embedded detection | `shell/embedded.ts:7-14`; `embedded.css:7-36` | slim bars when framed | Keep detection; CSS becomes token overrides |
| Phone detection | `shell/phoneLayout.ts:6,57-68` (window media query) | | Rebuild: decided from the viewer's own size (§2) |
| Provenance, sources, metrics, folds | `ProvenanceBadge.tsx`, `Sources.tsx`, `MetricVisual.tsx`, `Collapsible.tsx` | inside cards and panels | Keep; tokens only |

## 2. Screen areas

Areas are one CSS grid laid over the canvas (`pointer-events: none` except on occupants), defined once in `shell/areas/`. Every element the interface draws sits in one area and carries `data-area="<name>"`.

| Area | Wide | Phone |
|---|---|---|
| `bar` | top row, full width, inset `--astraeus-space-4` | top row, one line |
| `menu` | ⋯ drop-down anchored under the bar's right end | drawer dropping from the bar |
| `left` | column under the bar, left; width `--astraeus-panel-width` | (none) |
| `right` | column under the bar, right; story panel | (none) |
| `developer` | right, under the bar; sits left of `right` when that is occupied | uses `sheet` (taller cap) |
| `tile` (O-081) | top of `left`, persistent | one-line strip above the timeline; tap expands it into `sheet` |
| `sheet` | (none) | above the tile strip and the timeline; height cap `sheetMaxPercent` |
| `timeline` | bottom row | bottom row, two lines; its drawer opens upward inside the area |
| `popover` | anchored to its button | anchored to its button |

**What changes on a phone (the one description).** `shell/areas/screen.ts` decides four root attributes from one `ResizeObserver` on the viewer root plus two media reads:

- `data-layout="phone"` (as built: `data-phone="true"`, kept because tests, the site driver and `useZoomThrough` read it) when the **viewer's** width ≤ 700 px, or its height ≤ 500 px with a coarse pointer (today's `PHONE_QUERY`, `phoneLayout.ts:6`, measured on the viewer instead of the window).
- `data-pointer="coarse|fine"` sets the control height (44/36).
- `data-embedded`: framed, from `embedded.ts`.
- `data-motion="reduced"` sets `--astraeus-motion: 0ms`.

With phone layout, `left`, `right` and `developer` map onto `sheet`, the bar keeps engine items in the menu, and a pick opens no card (kept, `phoneLayout.ts:9-11`). That is the whole phone difference.

**As built.** Until the viewer root has a measurable size (first paint, test pages) `readScreen` falls back to the window phone query. The phone grid is `"bar" "sheet" "timeline"`, with a `tile` row above the timeline only while the showing view has a readout tile (O-081; wide, the tile gets its own row above `left`, both under `:has` in `areas.css`); parts render once by their wide area name and the phone map moves them onto the sheet, so no `sheet` element is drawn yet. The last row is `auto` (no `--timeline-space`). The root is the `astraeus-viewer` size container, the timeline area `astraeus-timeline` (inline-size), the Developer drawer `astraeus-developer`; rule 6 is `@container astraeus-timeline (max-width: 876px)`, because the area is 24 px narrower than the viewer, so the switch stays at a 900 px viewer. The phone drawer, sheet and menu height limits (`phoneLayoutStyle`) are `cqh` of the viewer. A phone-sized viewer keeps 44 px controls through `data-phone` as well as a coarse pointer.

Rules it replaces (each removed in T-330/T-326/T-329/T-331):

1. `phoneLayout.ts:6` (window phone query)
2. `controls.css:28` (701–900 px 44 px targets)
3. `TopBar.css:72` (701–900 toolbar width)
4. `style.css:208` (701–900 `.shell-top`)
5. `style.css:359` (≥701 developer steps left)
6. `TimelineBar.css:108` (≤900 timeline two lines; becomes a container query on the timeline area)
7. `embedded.css:8` (coarse pointer)
8. `embedded.css:25` (fine pointer)
9. `app/style.css:151` (≤680 HUD)
10. `app/style.css:168` (≤700 HUD; 9 and 10 become one container query on the developer area)
11. Reduced-motion rules (seven of them): `controls.css:89`, `style.css:212`, `style.css:366`, `style.css:405`, `TimelineBar.css:121`, `phone.css:177`, `app/style.css:56`. All become `--astraeus-motion: 0ms`.

`@media` is allowed only in `shell/areas/areas.css` (the drift check enforces it). A part may wrap its own content with `@container` against its area.

**Embedded viewers.** A framed viewer (`data-embedded`, wide layout, fine pointer) overrides tokens only: control height 30, space steps one smaller, text one step smaller (today `embedded.css:7-31`). As built: control height 30 and control text are tokens in `look.css`; the space steps were not scaled, because `shell/parts/embedded.css` keeps a framed wide bar's padding and gap overrides (as tokens) and scaling both would shrink twice. A phone-sized frame keeps 44 px targets (`embedded.css:33-36`). A viewer mounted into any page element takes its layout from its own size, so two viewers on a page may differ (API-03).

## 3. Look

All raw values live in `shell/look/look.css` as custom properties on `.astraeus-shell`, and nowhere else.

| Token | Default | Source |
|---|---|---|
| `--astraeus-panel` | `rgba(13, 13, 13, .88)` | board; `TopBar.css:12` |
| `--astraeus-text` | `#f0e6da` | board; `style.css:17` |
| `--astraeus-muted` | `#c7bdb3` | `style.css:18` |
| `--astraeus-accent` | `#e8b06a` | board (was `#fc6323`, `style.css:22`) |
| `--astraeus-border` | `rgba(240, 230, 218, .18)` | `style.css:20` |
| `--astraeus-data` | `#b1a1df` | `style.css:23` |
| `--astraeus-good` / `-warn` / `-bad` | `#6fcf8f` / `#f0b84a` / `#ff6b5e` | `style.css:24-26` |
| `--astraeus-scene` | `#000` | `style.css:10` |
| `--astraeus-font` | system-ui stack | `style.css:16` |
| `--astraeus-text-size` | `14px`; scale `-xs` 11, `-s` 12, `-m` 13, `-l` 17, `-xl` 22 (calc from base) | font sizes in use: 10–22 px |
| `--astraeus-space-1..6` | 2, 4, 6, 8, 12, 16 px | gaps and paddings in use |
| `--astraeus-radius` | `12px`; `-s` = half, `-l` = 1.5×, `-pill` 999px | radii in use |
| `--astraeus-control-height` | 36 / 44 coarse / 30 embedded | `controls.css:13`, `:27` |
| `--astraeus-panel-width` | `360px` | `style.css:52`, `:225`, `:377` |
| `--astraeus-shadow` / `-s` | `0 12px 32px rgba(0,0,0,.42)` / `0 8px 24px rgba(0,0,0,.24)` | `style.css:59`, `TopBar.css:13` |
| `--astraeus-blur` | `12px` | `style.css:234` |
| `--astraeus-motion` | `240ms`; `--astraeus-ease` `cubic-bezier(.32,.72,0,1)` | `phoneLayout.ts:28`, `phone.css:12` |
| `--astraeus-layer-*` | scene 0, labels 1, markers 2, areas 3, popover 6, drawer 7, top 9 | 10 z-index values scattered |

As built, `look.css` also holds internal tokens the table does not list: the ordinal size scale `--astraeus-size-1..17`, `--astraeus-hit` (44), `--astraeus-control-text`, `--astraeus-mono`, `--astraeus-subtle`, `--astraeus-arrow` (the select arrow, which holds a literal colour), layers `-panel` (4) and `-bar` (5) (the right and left places), and the bar's own 8 px blur beside `--astraeus-blur`. Buttons are pills; selects, text inputs and list rows use `--astraeus-radius-s`.

**Colour mapping** (every literal in the 7 sheets, 60 distinct values counted by `grep` over `shell/*.css` and `app/style.css`):

- `#f0e6da` → text. `#c7bdb3` → muted. `#a99e94` → `color-mix(text 60%)`.
- `rgba(240,230,218, .18/.22/.16/.12)` → border. `.08/.35/.45/.6` → `color-mix(text N%)`.
- `#fc6323` and `rgba(252,99,35,…)` → accent, or `color-mix(accent N%)`.
- `#b1a1df` and `rgba(177,161,223,.35)` → data.
- `rgba(13,13,13, .6–.97)`, `#0d0d0d`, `rgba(15,15,15,.9)`, `#0e0e13`, `#15151b`, `#181716`, `#222` → panel. Opaque variants are dropped; blur carries legibility.
- `#45413d`, `#888078`, `#2b2927`, `#34302c`, `#2a2724`, `#66584a`, `#90745d` → border or `color-mix(text 20–45%)`. This covers scrollbars (`style.css:202-206`) and metric tracks (`style.css:172-176`).
- `#e9d6a8` (metric light, `style.css:174-182`) → `color-mix(accent 60%, text)`.
- `#000`, `rgba(0,0,0,…)` → shadow tokens, or the scene token for text halos (`app/style.css:147`).
- `#fff` (place marker fallback, `style.css:312-330`) → text. `rgba(0,0,0,.8)` tooltip → panel.
- `#6fcf8f`, `#77c58b`, `rgba(119,197,139,.5)`, `#b9d7bd`, `#a4c639` (observed badge, `style.css:274`) → good.
- `#f0b84a` → warn. `#ff6b5e`, `#ff8174` (`app/style.css:90`) → bad.
- `rgba(255,255,255,.03/.035)` → `color-mix(text 4%)`.

**Sizes:** every px length maps to the nearest space, radius, text or width token. `1px` borders and `0` stay literal. Dropped sizes: 10, 16 and 20 px text, and 7, 9 and 14 px radius. `--control-*` (`controls.css:12-25`) and `--ui-*` (`style.css:16-26`) are removed. Button radius becomes pill (board).

**Public (API-06):** see §10. **Drift check:** see §9.

## 4. Bar

**Items.** One ordered list, built by `shell/bar/barItems.ts` from the scene and state:

| Kind | Items (order) | Labels | May live |
|---|---|---|---|
| `title` | About title, else the selected object's name | full, `shortTitle`, `"i"` | row only |
| `switch` | picker (`setPicker`), then views (`setViews` with `place: "top-bar"`) | full, `shortLabel`; or compact drop-down | row only |
| `story` (O-080) | shelf panel buttons, in `addParts` order, hidden outside their views | full, `shortLabel` | row, or menu under "This story" |
| `engine` | priority high→low: object picker 1, Info 1, scale + help 2, camera presets 3, display switches and Display 4, moons 4, related objects 5, developer cog 6 | icon + name | wide: row or menu; phone: menu only |
| `menu` | ☰ (phone) / ⋯ (wide) | | row, shown only when the menu holds something |

**Fit rule** (`shell/bar/fitBar.ts`, pure). Input: available width `W`, gap `g`, and the items with their measured widths per form. A hidden measuring row renders every form once and a `ResizeObserver` re-measures it on font or label change. Output: each item's place (`row` or `menu`) and form. Start with every row item at full form. While the total is greater than `W`, take the next step:

1. Switch tabs and story buttons take their short labels.
2. Engine items move to the menu, lowest priority first, one at a time. The menu button appears with the first one.
3. Title → `shortTitle`.
4. Title → "i".
5. Story buttons move to the menu from the end of the story's order, one at a time.
6. Switch → compact drop-down (current option + chevron, list in a pop-up).
7. Give back: if the title was shortened, try its longer forms again, longest first.

Total = sum of row widths + `g` × (row items − 1).

**As built.** The title is a bar item on both bars only with an About; without one a wide bar shows no title (the object picker already names the object) and the phone title place shows the selected object's name and opens its card. Step 6's compact switch is a native `<select>`. `barEntries.tsx` builds the items from state so `barItems.ts` stays plain data; related objects are one item per object and camera presets one item each (priority 3). The measuring row is ghost spans styled like the controls, so widths are close, not exact. An outside press closes the wide ⋯ drop-down; a phone menu drawer stays open.

**Worked cases** use Belt's Jupiter view (title "The asteroid belt" / "Asteroid belt"; tabs "Asteroid belt" | "Jupiter's influence" / "Belt" | "Jupiter"; buttons "Kirkwood gaps" / "Gaps", "How empty is it?" / "How empty?"). Widths are estimated from 7 px per character at 13 px (wide) and 7.4 px at 14 px (phone), plus padding. The build measures real widths.

- Phone: `W` = viewport − 24, `g` = 6, 44 px controls. Widths: title 150/122/44; tabs 289/134 (compact 96); Gaps 122/56; How empty 144/100; ☰ 44. Engine items are always in the menu.
  - After step 1: 150+134+56+100+44+24 = 508. Step 3: 480. Step 4: 402.
  - **360** (`W` 336): step 5 moves How empty → 44+134+56+44+18 = 296 ✓. Give back: short title would make 374 > 336, so no. Row: `[i][Belt|Jupiter][Gaps][☰]`. Menu: This story › How empty is it?, then the engine controls.
  - **390** (`W` 366): same as 360 (374 > 366). `[i][Belt|Jupiter][Gaps][☰]`.
  - **430** (`W` 406): step 4 gives 402 ✓. `[i][Belt|Jupiter][Gaps][How empty?][☰]`.
  - 360, Belt view (Gaps hidden): step 4 gives 340 > 336, step 5 moves How empty → 234. Give back: short title 312 ✓. `[Asteroid belt][Belt|Jupiter][☰]`.
- Wide: `W` = viewport − 36, `g` = 6, 36 px (fine pointer). Widths: title 145/117/36; tabs 276/129; Gaps 117/54; How empty 138/96; picker 160; Info, Focus, Follow, Overview 36 each; scale 104 + help 36; ⋯ 36.
  - **1280** (`W` 1244): full = 145+276+117+138+444+60 = 1180 ✓ (11 row items, 10 gaps). Everything on the row, no menu. With developer tools: 1222 ✓.
  - **768** (`W` 732): full 1180. Step 1 → 928. Step 2 moves Overview (menu appears, net 0), Follow → 886, Focus → 844, scale + help → 692 ✓. Row: `[The asteroid belt][Belt|Jupiter][Gaps][How empty?] … [picker][Info][⋯]`. ⋯ holds Focus, Follow, Overview, Scale.
  - A coarse-pointer tablet at 768 uses 44 px widths in the same function.

**Wide overflow:** ⋯ opens the `menu` area as a drop-down under the bar's right end. It holds the same `BarMenu` content the phone drawer shows: "This story" buttons first, then engine items with their names. The bar's left group (title, switch, story) and right group (engine, menu) are split by flexible space.

## 5. Panels

**Place model** (`shell/panels/panelRule.ts`, pure reducer `(state, action, layout) → state`):

| Occupant | Wide area | Phone area | Layer |
|---|---|---|---|
| About | `left` | `sheet` detail | |
| Object/event/window/place card | `left` | `sheet` detail | |
| Moons list | `left` | `sheet` detail | |
| Shelf panel (O-080) | `left` | `sheet` detail | |
| Tile expanded (O-081) | (tile always shown) | `sheet` detail | |
| Story panel or step | `right` | `sheet` story | under detail |
| Developer drawer | `developer` | `sheet` detail (tall cap) | |
| Menu | `menu` drop-down | `menu` drawer | drawer |
| Timeline drawer | (none) | inside `timeline` | drawer |
| Scale menu, scale help, Display, events list, marker group list | `popover` | `popover` | popover |

**Close rules** (each row is a named unit test in T-329):

| When this opens | It closes | It covers (kept open) |
|---|---|---|
| Any occupant of `left` | the other `left` occupant | — |
| Story panel/step | the other story panel (newest wins, `useStoryPanels.ts:20`) | — |
| Phone detail sheet | the other detail sheet | the story sheet |
| Developer (wide) | — | — (shifts left of `right`) |
| Menu (phone) | timeline drawer, pop-ups | — |
| Timeline drawer | menu, pop-ups | — |
| Any pop-up | the other pop-up | — |
| Item chosen inside the menu | the menu (today's `data-closes-drawer`, `ControlsDrawer.tsx:43-44`) | — |
| Shelf camera turn (O-095) | on a phone, the open `left` occupant (shelf panel or tile sheet); on a wide screen nothing. The shell wraps the shelf runtime's `moveCamera` and dispatches `cameraTurned` before the host's move, so no shelf part imports the shell | the story sheet |
| View switch | a card whose object the view drops (`AstraeusShell.tsx:355`); a story panel the view does not show (cause `move`, `useStoryPanels.ts:96`); a shelf panel not in the view | — |
| Escape | the topmost only: pop-up > drawer > detail/`left` > story/`right` | — |
| Outside press | open pop-ups | — |

Story timing (auto-open, hold, `closeAfterSeconds`) stays in `useStoryPanels.ts` and reaches the rule as open/close actions with their cause, so host signals are unchanged.

**As built.** `shell/panels/` also holds `PopupContext.tsx`, through which parts report pop-up intents without prop drilling; a part drawn alone (tests) uses the same rule with `scope: "standalone"`. The story panel's open state (`useStoryPanels`) and the Developer mode (host-owned) are mirrored into the rule, which is authoritative for `left`, `menu`, `timeline` and `popup`; Escape on the story calls `story.close()`. The Developer drawer has no Escape, as before. About is the `left` occupant `about`. A view switch dropping a story panel is still derived in `useStoryPanels` (cause `move`); the rule's `viewSwitch` action is used for the card.

**Rules it replaces:**

- `AstraeusShell.tsx:291-294` (menu closes card and story when moons exist; removed)
- `AstraeusShell.tsx:511-516` (moons vs card)
- `useDrawers.ts:18-25` (drawer pair) and `:26-31` (Escape)
- `ControlsDrawer.tsx:43-44`
- `TimelineBar.tsx:265` (drawer `data-closes-drawer`)
- `InfoPanel.tsx:34-38` and `StoryPanelView.tsx:42-46` (Escape)
- `ScaleControl.tsx:63-68`, `:91`, `:147-152`, `:165` (outside press and Escape)
- `DisplaySwitches.tsx:67-74`
- The z-index stacking hacks `TimelineBar.css:16-20` and `phone.css:102,161-162`
- `style.css:359-361` (developer steps left)

## 6. Behaviour changes

The list in the summary is the complete list. Mapped to the code:

1. Pill and drawer replaced (`ControlsDrawer.tsx`, `phone.css:17-90`).
2. Full-width bar with the cog in it (`TopBar.css:5-31`).
3. Title place (new).
4. Look (§3).
5. Target size by pointer (`controls.css:27-30`).
6. Layout from the viewer's size (`phoneLayout.ts:6,57-68`).
7. Moons sheet on phone; menu no longer closes panels (`AstraeusShell.tsx:291-294,550`).
8. Escape topmost only (§5).
9. One pop-up at a time.
10. Shared `left` place.
11. Phone developer drawer in the sheet place (`phone.css:166-173`).

## 7. Public interface (O-079, O-080, O-081)

Verb grammar is unchanged: `add*` appends (`duplicate-id`), `set*` replaces, `on*` returns a stop function, reads are properties, and keyed reads are methods (precedent: `ViewerHandle.groupLook(id)`, `api/viewerHandle.ts:71`).

**O-079.**

```ts
interface AboutInput { title: string; shortTitle?: string; status?: string;
  credits?: readonly { text: string; url?: string }[]; links?: readonly { text: string; url: string }[] }
scene.setAbout(about: AboutInput): this;   scene.about: AboutInput | undefined   // a frozen copy
handle.about: AboutInput | undefined;      handle.setAbout(about: AboutInput): void   // replaces the whole About
PickerOptionInput.shortLabel?: string      // bad-picker
ViewInput.shortLabel?: string              // bad-view
LookInput.interface?: InterfaceLookInput;  LookRead.interface   // bad-look; §10
```

- `title` and `shortTitle` are non-empty strings. `status` is a string. `url` is http(s).
- A bad shape throws the new code `bad-about`, naming the field.
- The About panel ends with "Built with Astraeus" linking to `https://astraeus.anipatke.com/`, with the version read from the engine's `package.json` at build.
- `handle.setAbout` throws `not-mounted` outside the lifecycle, and holds in host call order.
- As built: there is no separate `AboutRead` type (reads return `AboutInput`, frozen), to keep the API reference page under its size cap.

**O-080 and O-081: shelf parts.**

```ts
import { panel, explainer, actions, filterChips, colourKey, customBlock } from "astraeus";   // O-080
import { chart, readoutTile } from "astraeus";                                                // O-081
const chips = filterChips({ id: "gap", choices: [{ value: "3:1", label: "3:1" }], multiple: false });
scene.addParts([panel({ id: "gaps", button: { label: "Kirkwood gaps", shortLabel: "Gaps" }, title: "The Kirkwood gaps",
  blocks: [explainer({ id: "intro", paragraphs: [...] }), chips, colourKey({ id: "key", entries: [...] })] })]);
handle.part(chips).onSelect(({ values, cause }) => ...);   handle.part(chips).setSelected(["3:1"]);
```

- `scene.addParts(parts)` appends. Part and block ids are unique across the scene (`duplicate-id`).
- A factory checks shape at the call and throws the new code `bad-part`. Build-time checks of parts (an action's camera naming a missing object) also throw `bad-part`. As built, a view naming an unknown id in `panels` stays `bad-view`, since story panel ids and part ids share that one list.
- `handle.part(x)` takes the object a factory returned and gives a typed control for this viewer (as built, one generic signature `part<P extends AnyPart>(part: P): ControlFor<P>`). A part not in this viewer's scene throws `bad-part`. Outside the lifecycle it throws `not-mounted`.
- Controls (all hear only visitor actions; setters are silent):
  - `PanelControl`: `open`, `setOpen`, `onOpen`.
  - `FilterChipsControl`: `selected`, `setSelected`, `setChoices`, `onSelect`. Chips move themselves on a press and report it.
  - `ExplainerControl`: `setParagraphs`.
  - `ActionsControl`: `onAction`, `setEnabled(actionId, enabled)` (O-095; a disabled button carries `disabled`, neither moves the camera nor reports; unknown id or non-boolean throws `bad-part`).
  - `ColourKeyControl`: `setEntries`.
  - `CustomBlockControl`: `element`.
  - `ChartControl`: `setBins`, `setHighlight`.
  - `ReadoutTileControl`: `setValue(value, scaleValue?)`, `setScaleValue`, `setFacts`.
- As built (O-081): `scene.addParts` takes `(PanelPart | TilePart)[]`; a readout tile is a top-level part, never a block. At most one tile shows in a view (`bad-part` at build naming both); a tile no view lists shows in every view. Ranges use `{ low, high }` and a point is `value` (owner, API-04: `from`/`to`/`at` read as times).
- View scoping reuses the view rule: a part id listed in some `ViewInput.panels` shows only in those views (Design "Views of one scene"). No new field.
- React parity (API-02): parts are scene data and controls are on the shared `ViewerHandle`, so `mount` and `AstraeusScene` match. One lifecycle suite covers both.

**Host content mechanism.** The three options:

- **(a) Content as data.** The engine draws and styles it. It is safe and checkable, works in `scene.check`, and needs no page lookups. It is limited to what the shelf offers.
- **(b) Element handover.** The engine creates an empty element inside the panel and hands it out (`handle.part(block).element`). The host fills it with DOM or a React portal. The engine still never looks up page elements ("Good guest" (5)). The element lives from `ready` until `unmount`, hidden when its panel closes, so host state survives. The host's styles must sit under its own class inside the element.
- **(c) A React node prop.** Rejected: plain hosts could not use it (API-02).

**Chosen:** (a) for every shelf block, and (b) only for `customBlock`, the one escape hatch. A "custom panel" is a `panel` whose only block is a `customBlock`. This keeps API-01 (no internal types), API-03 (the element is per viewer) and API-04 (typed controls, no `unknown`).

## 8. Build order and migration

**Order (correction).** Run T-330 (areas, look, drift check, module layout) → **T-329 (panel rule)** → **T-326 (bar and fit rule)** → T-331 (timeline) → T-325 (About) → T-327 (demos and Design). The bar's menu drawer, ⋯ drop-down, Info button and pop-ups are panel-rule occupants, so building the bar before the rule would mean wiring it to `useDrawers` and then rewiring it. The split itself is right. Only T-326 and T-329 swap in `depends_on`.

**Tests and helpers that change, by name:**

- `packages/astraeus/tests/computedLook.test.ts` and `tests/fixtures/computed-look.baseline.json`. The baseline is rewritten with `node tools/look-lock.mjs` in T-330, T-329, T-326 and T-331, each with its diff reviewed. The pill press at `:73` becomes the menu button.
- `tests/viewerStyles.test.ts` pins `--ui-*` (now `--astraeus-*`) and the `HOST_PARTS` list (`:172`, `:199`).
- `tests/phoneLayout.test.ts`: `PHONE_QUERY` and `phoneLayoutStyle` become tests of `areas/screen.ts`, and `animationMs` becomes `--astraeus-motion`.
- The pill becomes the menu button (one `openMenu` test helper) in:
  - `domPhone.test.ts:19`
  - `displaySwitches.test.ts:157`
  - `domEmbedded.test.ts:42`
  - `hostPageDom.test.ts:94`
  - `viewerIds.test.ts:35,124`
  - `twoViewers.test.ts:434`
- `escapeScope.test.ts`: the topmost-only Escape change.
- `domMoonPanel.test.ts`: moons sheet on phone.
- `pointerAndFeatureLayerDom.test.ts`: occluders become `[data-area]`.
- Placement only (behaviour asserted unchanged):
  - `domShell.test.ts`
  - `switchControl.test.ts`
  - `viewsDom.test.ts`
  - `domStory.test.ts`
  - `domStorySteps.test.ts`
  - `storyPanelClose.test.ts`
  - `infoCards.test.ts`
  - `developerToolsOption.test.ts`
- Kept test hooks: `data-camera-preset`, `data-switch-param`, `data-view-id`, `data-panel-id`, `data-info-kind`, `data-display-switch`, `data-scale-*`, `data-moon*`. Kept this way, most suites change only how they open the menu.
- Site browser driver `packages/astraeus-site/tools/validate/driver.mjs`:
  - `HOOK.controlsPill` (`:23`) becomes `HOOK.menu`.
  - `openControlsDrawer` and `closeControlsDrawer` (`:58-66`) become `openMenu` and `closeMenu`.
  - `reveal` (`:80-85`) changes with them.
  - `controlStyles` (named at `controls.css:4-5`) compares by the new classes.
- Site tests: `driverNoIds.test.ts`, `browserDriverGuard.test.ts`, `domDemoStories.test.ts`.
- Journeys: `journey-planets-phone.mjs`, `journey-views.mjs`, `journey-meteor-shower.mjs`, `journey-look-out.mjs`, `browser-smoke.mjs`.
- API: `api-surface.lock.json` (`npm run api:lock`), the README error table (`npm run api:errors`, adds `bad-about`, then `bad-part` in O-080), the `apiSettings` public map (`interface`), and the `apiRules.test.ts` README tables.

## 9. Module structure and contributor guide

```
app/style.css          the one stylesheet entry (published as astraeus/style.css): @imports every sheet below, in cascade order
app/DeveloperDrawer.tsx the Developer drawer (header, eight folds, the readings only it shows): one component, loaded
                       on demand through app/developerPanels.tsx (O-089)
shell/
  AstraeusShell.tsx    composition: state → areas, bar, panels (camera-preset logic still here; the selection is
                       the viewer's store, handed in as one prop)
  selection/           selection.ts: one viewer's selected object and who may change it, plain state the shell
                       reads with useSyncExternalStore (O-089)
  look/                look.css (every raw value), interfaceLook.ts (public settings → CSS vars)
  areas/               screen.ts (layout attributes), areas.css (grid, the only @media), Area.tsx
  bar/                 barItems.ts (plain data), barEntries.tsx (state → items), fitBar.ts (pure),
                       useBarFit.ts (measures), Bar.tsx, BarMenu.tsx, bar.css
  panels/              panelRule.ts (pure), usePanels.ts (applies; one Escape and outside-press listener),
                       PopupContext.tsx (parts report pop-up intents)
  parts/               controls.css, parts.css, phone.css, embedded.css (each covers several parts),
                       timeline/timeline.css
  *.tsx                the part components, still flat files: AboutPanel, InfoPanel, StoryPanelView,
                       MoonFamilyPanel, TimelineBar, ObjectControls, ScaleControl, DisplaySwitches,
                       SwitchControl, ControlsDrawer, DeveloperToggle; useTitlePlace.ts (the title place)
shelf/                 part.ts (registry, checks, public descriptor types), useCell.ts, and one folder
                       per part (O-080/81): factory.ts, View.tsx, part.css (when it has rules; loaded by app/style.css)
```

As built, the one-folder-per-part split of `parts/` (components and sheets) was not done in O-079 and is still not; the `selection/` folder planned then was built in O-089. The tree above is the code. A later split moves a part's component and rules together.

Each module starts with a header comment saying its one job and what it must not do:

- `look`: holds values and nothing else.
- `areas`: positions and layers. Knows no part.
- `fitBar` and `panelRule`: pure. No React, no DOM, no timers.
- A part draws its content and reports intents (`open`, `close`, `choose`). It never sets `position`, `z-index` or a raw colour or size, and never opens or closes another part.
- `selection`: never touches placement, panels, the camera or React.

**Add a bar item** (checked against the code, I-187):

1. Write its component as a flat file in `src/shell/` (for example `src/shell/MyControl.tsx`) with the part header (its one job; it never sets a place, layer or raw value, and never opens another part). Its sheet rules go in the matching `parts/` stylesheet.
2. Add its entry in `src/shell/bar/barEntries.tsx`, in the function for its group: `leadEntries` (title place, picker switch, views), `controlEntries` (engine controls) or `trailingEntries` (moons, Developer cog). Make the item with a constructor from `src/shell/bar/barItems.ts`: `titleItem`, `switchItem`, `storyItem` or `engineItem(id, priority, ghosts)`; an engine item takes its priority from `ENGINE_PRIORITY` (add a key there for a new kind) and ghosts that measure each form. Pair it with the function that draws the component for a form (`entry(item, (form) => …)`). A view scope is a condition in that function (add the entry only when the scene offers it), not a field.
3. The fit rule (`fitBar.ts`) needs no change. Add a case to `tests/fitBar.test.ts` for its priority, and to `tests/barDom.test.ts` when it changes what the row or menu shows.

**Add a panel** (checked against the code, I-187):

1. In `src/shell/panels/panelRule.ts`: add its name to the `Occupant` union, its open state to `PanelState` (and `NO_PANELS`), and its cases to `openOccupant` (what opening it closes, wide and phone), `closeOccupant` and, if Escape should close it, `topmost`. The rule holds no area or layer.
2. Choose its place by rendering it inside the `<Area name="…">` it belongs in, in `src/shell/AstraeusShell.tsx` (`LeftArea` for the left place, or the `right`, `developer`, `menu` or `timeline` area). The place's position and layer come from `areas/areas.css` (on a phone, left, right and developer all map onto the one sheet place); a panel never sets them.
3. Open and close it through the shell's `panels` (`panels.open("…")`, `panels.close("…")`, from `usePanels`); the part itself only reports `onClose`.
4. Add its rows of the close table as cases in `tests/panelRule.test.ts` (both layouts), and a placement case in `tests/panelPlacementDom.test.ts` when it adds a place.

**Add styles:** add the class in the component before its rule. A new stylesheet is one `@import` line in `app/style.css`, never an import in a component. `tests/interfaceLeftovers.test.ts` fails on a class selector no component renders, a look token nothing reads, a sheet `app/style.css` does not load and a stylesheet import outside the two entry files (`api/mount.ts`, `api/AstraeusScene.tsx`); run-time class families and class carriers are listed in the test.

**Drift check** (`packages/astraeus/tests/lookDrift.test.ts`, T-330) scans every `.css` under `src/shell`, `src/shelf` and `src/app/style.css`, and `style={…}` objects in `.tsx` under those folders. Outside `shell/look/look.css` it fails on:

- hex, `rgb()`, `hsl()` and named colours (except `transparent`, `currentColor`, `inherit`);
- lengths other than `0` and `1px` (as built, `cqw`/`cqh` viewer units are also allowed, and `@container` breakpoints are not scanned);
- `z-index` other than `var(--astraeus-layer-*)`;
- `@media` outside `areas.css`.

It allows `var(--astraeus-*)`, `calc()` and `color-mix(in srgb, var(--astraeus-*) N%, …)` of tokens, `%`, `fr` and unitless numbers. Data-driven colours (group or place colours set at run time) are not literals and pass. There is no allowlist for stylesheets. Since I-186 it also scans the non-test TypeScript under `src/shell`: a typed colour in a string fails outside `shell/look/`, and a default inside it must equal a `look.css` token (its `KNOWN` list names one place-marker fallback left for an owner decision). A header check (`tests/interfaceHeaders.test.ts`) fails on an interface module without its header.


### Move one behaviour out of the coordinator (the slice pattern, O-089)

`App` and `AstraeusShell` still coordinate most behaviour between them. O-089 moved one behaviour, the selection, out of both; later Objectives move one slice each the same way. Checked against the code (the I-187 style); read `src/shell/selection/selection.ts`, `tests/selectionStore.test.ts` and `tests/selectionOwner.test.ts` (all under `packages/astraeus/`) as the worked example.

1. **A plain per-viewer module.** Write `src/shell/<behaviour>/<behaviour>.ts` with the two-line header (its one job; what it must not touch) and add the folder to the list in `tests/interfaceHeaders.test.ts`. It exports a factory (`createSelection(start)`) that returns the store: `snapshot()` (a frozen object, the same object until something changes), `subscribe(listener)`, plain reads (`id()`) and the writes each caller is allowed (`choose`, `ask`). No React, no module-level state: everything lives inside the factory, so two viewers on one page never share it.
2. **`App` creates it per scene** (`useMemo(() => createSelection(...), [runtime])`, its opening value read once) and hands it to the shell as one prop (`selection={selection}`), replacing the value, the change callback and the request props it took before (the shell went from 46 props to 44). If the shell's module re-exports the factory (`AstraeusShell.tsx` re-exports `createSelection`), whoever renders the shell needs no deep import (the ARCH-03 deep-import count in `packages/astraeus-site/tests/packageBoundaries.test.ts` may only go down).
3. **The shell reads it with `useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)`.** The third argument, the server snapshot, is needed because tests render the shell with `renderToStaticMarkup`. Each of the shell's own paths (menu choice, pick, preset, marker, view-switch drop) calls the module (`selection.choose(id, "visitor" | "move")`) instead of a local `useState` and a callback pair.
4. **Host calls write the module at once and leave an ask.** `App.hostSetSelected` calls `selection.ask(id, false)` (a story panel's select calls `ask(id, true)`, quiet): the value changes at once, so the host reads it back in order, and the ask waits. The shell takes the ask after its own rules, in one effect (the view-switch effect ends with `applyAskedCard(selection.takeAsk(), …)`, so the host's call is the last word over the fallback and the view rule), never through a serial prop. While an ask waits, the shell's older `choose` is ignored. `takeAsk` does not notify; the effect lists the ask object so an ask for the id already selected is still taken.
5. **The scene reads it through a getter on `SceneControls`**, never a written copy: `get selectedObjectId() { return selection.id(); }` in the controls object literal (`initialSceneControls`, `App.tsx`), typed `readonly`. Being written in the literal, it is an own enumerable property, which `controlsChanged`'s `for…in` walk needs; `selectionOwner.test.ts` pins that and that a paused scene sees a change.
6. **The host publish hangs off the module's move listener**: one `selection.onMove` in `App` publishes to the host only while attached. Asks are not moves, so a story panel's select reports nothing to `onSelect` (as before the move).
7. **Tests.** A node table for the module alone (`selectionStore.test.ts`: every write, notify against move, snapshot identity, two stores independent). A both-paths table (`mount` and `AstraeusScene`) of every path that changes the behaviour, written first and green on the base before any code moves, then unchanged (`selectionOwner.test.ts`, 14 paths). The existing lifecycle, two-viewer and host-order suites (`lifecycle.test.ts`, `twoViewers.test.ts`, `hostCallOrder.test.ts`) stay unchanged; tests that mount the shell directly change only the props they hand it.
8. **Engine size.** Measure the first-open total (`npm run measure:example`) before and after, against the limit in `packages/astraeus-site/tools/validate/engine-budget.mjs`. Pay for growth by moving on-demand code out of the first-open chunk where you can: O-089 moved the whole Developer drawer into one on-demand `DeveloperDrawer` chunk (first open 9,723 B raw smaller), and the selection move itself cost nothing (−275 B).

Next candidates, one slice each: story playback; the camera fallback, with the scene-pick serial prop `pickRequest` it still uses; then the settings `App` mirrors into the shell. Also open: `App` and the shell re-render ten times a second while playing (the clock interval in `App`); moving playback is the slice that can end that. Left over from O-089: `initialObjectIdOf` (`app/experienceDefinition.ts`) has no caller in `src` (only tests: `experiencesContract`, `publicApiSunPaths`, `publicApiOpeningSelection`), a removal candidate.

## 10. Shared look

- **Public** (`LookInput.interface`, every field optional, defaults as in §3):
  - `panel`, `text`, `muted`, `accent`, `border`, `data`: CSS colour text, checked like `SkyLinesLook` (`api/look.ts:11`).
  - `fontFamily`: non-empty.
  - `textSizePx`: 11–18, default 14.
  - `radiusPx`: 0–20, default 12.
  - `motionMs`: 0–800, default 240. It replaces `PhoneLayoutSettings.animationMs`, and reduced motion forces 0.
  - There is no page address parameter (like `labels` and `time`), so the API-06 mapping test holds unchanged. `sheetMaxPercent` stays where it is.
- **Documented for host content:** the custom properties `--astraeus-panel, -text, -muted, -accent, -border, -data, -font, -text-size, -text-s, -text-l, -space-1..6, -radius, -radius-pill, -motion` under `.astraeus-shell`. Content in a `customBlock` element, a shelf block and the tile inherits them, so `color: var(--astraeus-accent)` matches the viewer.
- **Internal:** layers, shadows, control height, panel width and every basic interface part. Parts are offered later only when a real app needs one (Design D1).

## 11. Story-component shelf

| Part | Built in | Data | Hears | Placement |
|---|---|---|---|---|
| `panel` | O-080 | `button {label, shortLabel?}`, `title`, `blocks[]` | `onOpen` | bar `story` item; `left` / phone sheet |
| `explainer` | O-080 | `heading?`, `paragraphs[]`, `notes?` | — | block |
| `actions` | O-080 | `[{id, label, camera?}]`; `camera` moves it, as story panels do (`api/story.ts:99-100`) | `onAction`; `setEnabled` (O-095) | block |
| `filterChips` | O-080 | `choices [{value, label, color?}]`, `multiple`, `selected` | `onSelect` | block |
| `colourKey` | O-080 | `entries [{label, color, count?, note?}]` (at least one; `count` a whole number of 0 or more) | — | block |
| `customBlock` | O-080 | none | `element` | block |
| `chart` | O-081 | `bins [{low, high, count, color?}]`, `axisLabel`, `marks? [{value, label}]`, `highlight? {low, high}` (within the bins); bins left to right without overlap; each mark's value within the bins' range | — | block |
| `readoutTile` | O-081 | `label`, `value` (text), `scale? {low, high, value, stretch?: "linear" \| "log", marks? [{value, label}]}`, `facts? [{label, value}]` (at most 4) | — | `tile` area (wide top of `left`; phone strip, tap opens the sheet) |

**One contract.** Every part:

- is a factory exported from `astraeus`, checked at the call (`bad-part`), returning an immutable descriptor that is shareable between scenes; shelf text (labels, titles, paragraphs, notes, ids, values) must not be blank, and the value is kept as given (O-096);
- is added with `scene.addParts`;
- is updated and heard only through `handle.part(descriptor)` (§7);
- gets its button from the bar rule and its place from the panel rule, with no placement code of its own;
- takes its look from the shared look only (the drift check covers `src/shelf`);
- is view-scoped through `ViewInput.panels`;
- is proven on a synthetic scene (ARCH-03);
- names no app (ARCH-01).

**Pick by import.** Each part lives in its own `src/shelf/<part>/` module tree. The descriptor carries its own view component (an internal field, not in the public type), so the shell renders `descriptor.view` and never imports a shelf module itself. An unused factory is therefore unreachable and dropped by tree shaking. `sideEffects` stays `["**/*.css"]` (`packages/astraeus/package.json:47-49`). A part's CSS is not imported by its view: only the two entry files may import a stylesheet (`tests/interfaceLeftovers.test.ts`, because the Node copy of the entry files cannot load CSS), so each `shelf/<part>/part.css` is one `@import` line in `app/style.css` and ships to every app (about 4.2 KB raw for the four parts that have rules; Vite itself would have dropped unused part CSS).

The proof is `npm run check:shelf-split` (`tools/check-shelf-split.mjs`). It packs the engine, builds a page in `examples/hello-scene` that imports only `filterChips` and fails if any other part's marker class appears in the emitted JS, or if an imported part's marker is missing; it prints the CSS bytes. `--import filterChips,explainer --allow filterChips` must fail (the check's own proof).

**As built (O-080).**

- The internal descriptor shape is in `app/shelfContract.ts` (not in `src/shelf/`), so the shell, `api/` and the definition read it without importing a shelf module: a descriptor carries `view`, and a block also `data`, `initial` and `control` (its control's setters live with the part, so `api/viewerParts.ts` imports no part). A block's changing content is a per-viewer `ShelfCell` (made in `app/useShelf.ts` per viewer and per rebuild) that the view and the control share; `ShelfRuntime` gives a view its `cell`, `report` and `moveCamera`.
- `scene.addParts` takes `PanelPart[]`; the content parts are blocks (`BlockPart<K>`, `CustomBlockPart` is one) and go in a panel's `blocks`, never added alone.
- A shelf panel is the panel rule's `left` occupant `shelf:<id>` (`ShelfOccupant`); it replaces About, a card, the moons or another shelf panel, and on a phone it is the sheet. A view switch closes a shelf panel the view does not show (`viewSwitch` `dropsShelf`), silently: the host hears the switch through `onChange`. A host `setOpen(true)` for a panel the showing view does not show leaves it closed, without an error.
- Events: `onOpen` `{ part, open }` hears a visitor's button, Close, Escape, and another `left` occupant taking the place; `onSelect` `{ part, values, cause: "visitor" }`; `onAction` `{ part, action }`, after the action's camera has turned (a camera toward an object the clock time does not show is refused, as a story panel's is).
- A `customBlock` element is made per viewer by `app/useShelf.ts` and handed to the link at attach; `handle.part(block).element` is undefined before `ready` and after `unmount`, and a rebuild makes a new one.

**Worked example: Belt** (`/home/user/code/belt`, read only):

- **Title and footer.** The title, `shortTitle`, status sentence and credits (`data/site.json`, `src/site/page.ts:62-63,88-91`) → `setAbout`. The companion link goes into `links`. The footer and the "Built with" mark are dropped, because the engine adds the mark.
- **Phone "i" pop-up.** The status pop-up (`page.ts:48-61`) → the About title "i".
- **Mode switch.** The belt/jupiter mode picker → `setPicker` with `shortLabel`. The remount on pick stays Belt's (`page.ts:143-150`).
- **Kirkwood gaps** (`src/site/influencePanel.ts:86-160`, `data/influence.json`):
  - `panel({ button: { label: "Kirkwood gaps", shortLabel: "Gaps" } })`, added only in the Jupiter scene.
  - Blocks: `explainer` (intro), `chart` (histogram bins, highlight the chosen gap; a `customBlock` until O-081), `filterChips` (gaps, single, deselectable), `explainer` (lit line via `setParagraphs`), `colourKey` (four regions and the Trojans with counts), `explainer` (notes, caveat, source).
  - A chip press → the host calls `setGroupLook` as today (`page.ts:72-77`).
- **How empty is it?** (`src/site/emptinessPanel.ts:48-90`, `data/emptiness.json`):
  - `panel({ button: { label: "How empty is it?", shortLabel: "How empty?" } })`.
  - Blocks: `explainer` (spacing sentences, from the host's stats), `explainer` (pixel sentence, updated from `onCameraChange`), `actions([{ id: "ceres", label: "Fly to Ceres", camera: ceresView }])`, `explainer` (note).
- **Removed from Belt:** the one-panel-at-a-time wiring (`page.ts:83-87`) and the `--timeline-clear` measuring (`page.ts:109-124`).

**Worked example: Meteor Showers** (`/home/user/code/showers`, read only):

- Title, credits and "Built with" (`src/site/page.ts:61-74`) → `setAbout`. The document-title watcher there is already unneeded (Design "Host-page behaviour").
- The shower choice → `setPicker`. With many options, the fit rule's compact drop-down gives the list view.
- The year ring (`src/site/showerPicker.ts:138-300`) → a `panel` with one `customBlock`, the app's own SVG.
- The failure note → About `status`.
- Story panels are unchanged.

**Public catalogue page.** `packages/astraeus-site/components.html`, linked from the site navigation beside Assets as "Parts" (`index.html:207`). Plain words first (owner, 2026-11-21): the intro says who the page is for, and each entry opens with:

- a plain name, one plain sentence on what it is for, and a "For example:" line about a space story, with the story jobs as small plain tags, all from `packages/astraeus-site/data/shelf-catalogue.json` (`name`, `purpose`, `example`, `jobLabels`);
- the Run button and a live example on a synthetic scene: `src/catalogue/examples/<part>.ts`, run on demand one viewer at a time, shown as text through a `?raw` import, so the shown code is the run code;
- a closed "For developers" fold holding the code name, the first sentence of the factory's doc comment (one source with the README), the import line and the `addParts` line, and the whole example.

A section "Already in every viewer" lists the basic parts in plain words, from the same JSON, with their calls in a "For developers" fold. `packages/astraeus-site/tests/shelfCatalogue.test.ts` fails when a root export whose doc comment carries `@shelf` has no entry or example, or when an entry names no such export. O-080 creates the page with its parts. O-081 adds its two. An example's first `addParts` entry may be any `@shelf` part (a tile stands alone), and an example may export `live(viewer)`, which the page calls after `ready` to drive synthetic motion (the tile's value follows the clock; the chart moves its highlight). The entry grid is 1fr/2fr so a demo box at a 1280 px window stays wider than the 700 px phone rule (the viewer's own width decides its layout). The parts' types are on their own API page, `api/shelf.html` (every export declared under `src/shelf/`), linked from the catalogue and listed by name on the main API page (O-080 T-336).

## Open choices for the owner

1. **Fit order.** The title shrinks to "i" before any story button moves to the menu (steps 4 then 5). The other way keeps the title longer and shows fewer buttons. Recommended: as written (decision 6's wording).
2. **Chips.** Chips move themselves on a press and report it (as above), or wait for the host as the picker does. Recommended: move themselves.
3. **Layout from viewer size** (§2) rather than window size. Recommended: yes ("Good guest", two viewers).
