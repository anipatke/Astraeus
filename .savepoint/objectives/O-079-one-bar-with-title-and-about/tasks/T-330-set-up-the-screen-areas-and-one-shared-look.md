---
id: T-330
title: Set up the screen areas and one shared look
objective: O-079
status: done
depends_on: [{task: T-328, requires: clear}]
check_waiver: {task: T-330, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Set up the screen areas and one shared look

## Outcome

The new interface's foundation exists as the decision note sets it: the named screen areas for desktop and phone, one set of look settings under the viewer's root class (public where the note says, with defaults), a check that fails on any colour or size typed outside the look, and the module layout and contributor guide that the following Tasks build into.

## User Check

None visible yet beyond the look: the demos look as the note's look settings say (colours, spacing, text), with every part still in place.

## Done When

The areas and look modules match the note; the existing stylesheets read only from the look settings (each hand-typed colour and size replaced or dropped as the note maps it); the drift check is a named test that fails on a typed colour or size outside the look module and passes; the screen-size rules the note replaces are folded into the one area description (each named in evidence); public look settings, if any, follow API-06 (defaults, ranges, address mapping test) and are documented in README; the module layout and contributor guide pointer are in place; existing behaviour unchanged apart from the note's look changes; two viewers keep separate looks (API-03). Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/Design.md` under `Good guest`
- `.savepoint/Design.md` under `Headless use and looks as settings`
- `packages/astraeus/src/shell/style.css`
- `packages/astraeus/src/shell/controls.css`
- `packages/astraeus/src/shell/TopBar.css`
- `packages/astraeus/src/shell/TimelineBar.css`
- `packages/astraeus/src/shell/phone.css`
- `packages/astraeus/src/shell/embedded.css`
- `packages/astraeus/src/shell/phoneLayout.ts`
- `packages/astraeus/src/app/style.css`
- `packages/astraeus/src/app/look.ts`
- `packages/astraeus/src/api/look.ts`
- `packages/astraeus/tests/viewerStyles.test.ts`
- `packages/astraeus/tests/computedLook.test.ts`
- `packages/astraeus/README.md` under `Looks, controls and views`

## Design References

The decision note; Design "Good guest" (styles under `.astraeus-shell`), "Headless use and looks as settings" (one look table, precedence).

## Guardrails

ARCH-01, API-03, API-06, TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-09.

## Implementation Plan

1. Create the look module and the areas module in the layout the note sets.
2. Replace typed colours and sizes in each stylesheet with look settings, file by file; drop what the note drops.
3. Fold the screen-size rules into the area description.
4. Add the drift check test with its allowlist as the note defines (expected empty).
5. Make public look settings public as the note says (API-06 mapping, README).
6. Update the computed-look baseline only where the note changes the look, naming each change.

## Boundaries

No bar, panel or timeline restructuring (later Tasks), no About, no version bump.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (path, section, reason): `docs/architecture/viewer-interface.md` sections 8, 9, 10 (named by the owner's brief); `packages/astraeus/src/shell/{AstraeusShell.tsx,embedded.ts}`, `src/app/{App.tsx,AstraeusScene.tsx,liveLook.ts}`, `src/api/lookInput.ts`, `tests/{domSetup.ts,look.test.ts,domEmbedded.test.ts,domPhone.test.ts,domStorySteps.test.ts,phoneLayout.test.ts,helpers/viewerPresentation.ts}` and `README.md` headings "Looks, picker, scale and switches", "Page address", "What it holds" (to wire the public look, the screen hook and to update text-pinned assertions); `tools/check-packs.mjs` (limit that failed).

**What was built.** `shell/look/look.css` (every raw value, as `--astraeus-*`), `shell/look/interfaceLook.ts` (public settings to inline custom properties), `shell/areas/screen.ts` (one description of the screen: `data-phone`, `data-pointer`, `data-embedded`, `data-motion` from a ResizeObserver on the viewer root plus two media reads), `shell/areas/areas.css` (grid, the one sheet allowed an `@media`; none needed), `shell/areas/Area.tsx`; all seven stylesheets (`style`, `controls`, `TopBar`, `TimelineBar`, `phone`, `embedded`, `app/style`) now read only tokens; `tests/lookDrift.test.ts`; public `LookInput.interface` (API-06) with README; contributor pointer in README ("Interface modules") and module header comments.

**Gates (all run at handoff, root of the checkout).** `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm run check:engine-alone` pass (200 files, 3092 tests); `npm test` 4196 pass, **2 fail**: `packagePacks.test.ts` "every package builds..." and its sibling, both for the same reason, `astraeus: unpacked 9.51 MB is over 9.5 MB` (`tools/check-packs.mjs`). Cause: tokenised CSS is longer than the literals it replaces (source CSS 71,532 to 88,901 bytes, plus the new modules and README), so the engine's unpacked pack grew about 30 KB and crossed the 9.5 MB line (it was about 9.48 MB). I did not touch the limit (a gate definition); it needs an owner decision (raise `unpacked` to 9.6 MB in `tools/check-packs.mjs`, or accept trimming elsewhere). `apiReference.test.ts` (api page 46,000 byte limit) was 170 bytes over on the first try and passes after shortening the `InterfaceLook` doc comments.

**Done When, criterion by criterion**

| Criterion | Outcome |
|---|---|
| Areas and look modules match the note | `shell/areas/{screen.ts,areas.css,Area.tsx}` and `shell/look/{look.css,interfaceLook.ts}` in the section 9 layout. `selection/`, `bar/`, `panels/`, `parts/` belong to later Tasks. Deviations are in Drift Notes. |
| Existing stylesheets read only from the look settings | All seven sheets converted: every colour mapped as section 3 maps it, every px/em/ch/vw/vh length to a space, radius, text, size or width token, `--ui-*`, `--control-*`, `--perf-*`, `--drawer-*`, `--panel-bg` removed. `lookDrift.test.ts` finds zero offenders in them (the same scan finds 340 in the old `style.css`, so the check bites). |
| Drift check is a named test that fails on a typed colour or size outside look and passes | `packages/astraeus/tests/lookDrift.test.ts`: scans every `.css` under `src/shell`, `src/shelf`, `app/style.css` and the `style={{}}` objects in `.tsx` there; flags hex/rgb()/hsl()/named colours, lengths other than 0 and 1px, any `z-index` that is not `var(--astraeus-layer-*)`, and `@media` outside `areas.css`; 6 sample tests prove each rule trips; no allowlist. |
| Screen-size rules folded into the one area description | Each of the note's eleven, by number: 1 `PHONE_QUERY` moved to `areas/screen.ts` (viewer size first, window query only while the viewer has no size); 2 `controls.css` 701-900 dropped (control height is `data-pointer`/`data-phone` in `look.css`); 3 `TopBar.css` 701-900 dropped; 4 `style.css` 701-900 `.shell-top` dropped; 5 `style.css` ">= 701 developer steps left" now `:not([data-phone="true"])`, no media; 6 `TimelineBar.css` <= 900 two lines now `@container astraeus-viewer (max-width: 900px)` on the viewer root (the timeline area does not exist yet); 7 and 8 `embedded.css` pointer rules now `[data-pointer="coarse"]` / `[data-pointer="fine"]`; 9 and 10 `app/style.css` 680 and 700 merged into one `@container astraeus-developer (max-width: 700px)` on `.developer-tools` (the 680 rules were overridden or no-ops there); 11 the seven reduced-motion rules all gone, replaced by `--astraeus-motion: 0ms` (`data-motion="reduced"`, and forced inline when reduced). `screen.test.ts` covers the rule. |
| Public look settings follow API-06 | `LookInput.interface` (`panel,text,muted,accent,border,data,fontFamily,textSizePx 11-18,radiusPx 0-20,motionMs 0-800`) with defaults equal to `look.css` (checked by `interfaceLook.test.ts`), checked by `bad-look`, no address parameter; mapping test rows added to the `look.test.ts` table (`param: null`, address cannot reach them); `LookRead.interface`; README updated (setLook row, look read, custom properties for host content); `api-surface.lock.json` regenerated; Developer drawer "Drawer animation" slider is now `interface.motionMs` (same value, like `sheetMaxPercent`). |
| Module layout and contributor guide pointer in place | README "Interface modules" and the `src/shell/` row; header comments in `look.css`, `areas.css`, `screen.ts`, `Area.tsx`, `interfaceLook.ts`; the guide itself is note section 9. |
| Existing behaviour unchanged apart from the note's look changes | The full existing suite passes except the pack-size line. Look changes, all from the note: accent `#fc6323` to `#e8b06a`; panel one alpha (.88) in place of .84-.97; borders from the border token; buttons and summaries pill; text and space on the token scales (dropped sizes 10/16/20 text, 7/9/14 radius); shadows two tokens; blur one token. Two viewers keep separate looks (see next row). |
| Two viewers keep separate looks (API-03) | `interfaceLook.test.ts` "two viewers keep separate looks": two shells with different looks carry only their own custom properties; nothing on `documentElement`. |

**Tests changed (assertions only; no existing test's setup or inputs changed).**
- `computedLook.test.ts`: sheet list gains `shell/look/look.css` and `shell/areas/areas.css` (new files the lock must load). Baseline rewritten with `npm run look:lock`. The diff was reviewed by aggregating every changed property old to new (116 distinct changes, all from the list above): colours (`#fc6323` to `#e8b06a`; `#45413d` and `.22` borders to the border token; panel alphas .84/.92/.94/.97 to .88; `#15151b` to panel; `#a99e94` and the `color-mix` fills read as unparsed or inherited by happy-dom), font sizes (13/12/14/16 px to `calc(base * n / 14)` token text, because happy-dom keeps `calc` unresolved), radii (6/7/8/9/10 to `calc(12px / 2)` or pill, 14 to 12), gaps and paddings rounded to the space scale (3/5/7/9/10 px to 4/6/8/8/12), `min-height` 34 to 36 and 44 to 36 on a fine-pointer test page (the phone test page is a fine pointer, so only `data-phone` keeps it 44 where the old rule did: see Drift Notes), box shadows to the two shadow tokens, 150/190/220 widths to the size scale, and `line-height` 1.4 on the root.
- `viewerStyles.test.ts`: sheet list gains the two new files; the root-properties test reads `--astraeus-accent/-panel/-good/-text-size` (values: accent `#e8b06a`, panel `rgba(13, 13, 13, .88)`).
- `domEmbedded.test.ts` (5 assertions), `domPhone.test.ts` (2), `domStorySteps.test.ts` (1), `phoneLayout.test.ts` (1): the text they pin moved from literals (`36px`, `44px`, `--control-height`, `--drawer-ms`, `outline: 2px`, a reduced-motion `@media` block) to the tokens (`--astraeus-control-height`, `--astraeus-hit`, `--astraeus-motion`, `data-motion="reduced"`).
- `look.test.ts`: rows appended for the ten `interface.*` looks. `helpers/viewerPresentation.ts` (`FAKE_LOOK` gains the required `interface` field) and `domSetup.ts` (`mountShell` accepts `interfaceLook`): additive.

## Drift Notes

For T-327 (Design reconciliation); T-327 accounts for each as reflected in Design.md or non-architectural.
1. **Extra tokens beyond the note's table**: `--astraeus-size-1..17` (ordinal width/height/offset scale: 20, 24, 28, 32, 36, 56, 72, 96, 128, 160, 190, 220, 260, 320, 480, 640, 860), `--astraeus-hit` (44), `--astraeus-control-text`, `--astraeus-mono`, `--astraeus-subtle`, `--astraeus-arrow` (the select arrow's data URI, which holds a literal colour and may live only in `look.css`), and layers `-panel` (4), `-bar` (5), `-sheet` (8) added to the note's seven so stacking order is unchanged. Collapse the three layers when T-329 lands the panel rule. All internal (not public).
2. **`data-phone` kept** (`"true"`/`"false"`), not renamed `data-layout="phone"`: tests, the site driver (`driver.mjs:1585`) and `useZoomThrough` read it. Rename belongs with T-326/T-331 once those read sites move.
3. **Screen fallback**: `readScreen` uses the window phone query until the viewer has a measurable size (first paint, happy-dom). Existing `pretendScreen` tests rely on it.
4. **Phone layout keeps 44 px controls** through `[data-phone="true"]` as well as `data-pointer="coarse"` (the note says pointer sets 44/36; a narrow fine-pointer viewer would otherwise drop to 36 and the phone test page would change). A phone-sized frame keeps 44 as the note says.
5. **Embedded**: the note's "space steps one smaller, text one step smaller" token overrides were not applied; `embedded.css` keeps its explicit layout offsets (converted to tokens) and only control height 30 and control text size are tokens in `look.css`. Applying scaled space tokens on top of the explicit offsets would shrink twice. Retire `embedded.css` layout rules with T-326/T-331.
6. **Drift check scope**: lengths allowed are 0, 1px, `%`, `fr`, unitless, and the viewer units `cqw`/`cqh` (the old `vw`/`vh`/`dvh` became these, so sizes follow the viewer); `@container` condition breakpoints (900 and 700 px) are not scanned. `phoneLayoutStyle` (a `.ts`) still emits `dvh` for the three drawer caps; the test pins them, move to `cqh` with T-329/T-331.
7. **Container rules**: the viewer root is `container: astraeus-viewer / size` (set in `areas.css`); `.developer-tools` is `astraeus-developer / inline-size`. Rule 6 uses the viewer, not the timeline area (not built yet): move it onto the timeline area in T-331.
8. `areas.css` holds the grid and phone map for the nine areas, but nothing renders `Area` or `.astraeus-areas` yet; T-329/T-326 occupy it. `useTimelineSpace` still measures with `window.innerHeight` (viewer-size follow-up for T-331).
9. **`PHONE_QUERY`** is re-exported from `phoneLayout.ts` (defined in `areas/screen.ts`) so `phoneLayout.test.ts` keeps its import; `usePhone` is removed. `PhoneLayoutSettings.animationMs` still exists as the Developer slider's field and is fed from `interface.motionMs`; the note's full removal waits on the later cleanup.
10. Button radius is pill for `button` and `summary.ui-button`; selects and text inputs use `--astraeus-radius-s`, list rows `.ui-row` the same (the note only says "button radius becomes pill").
11. No CHANGELOG entry: 0.9.4 is released and there is no open section; add the `interface` look and the 0.9.5 note at release.

Coordinator marked done (owner: "orchestrate 79"; pack-size red accepted by owner as "Wait for cleanup", recorded in O-079 Decisions). CHANGELOG 0.9.5 (proposed) section opened by the coordinator with this Task's entry.
