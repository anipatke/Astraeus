---
id: T-331
title: Rebuild the timeline on the new layout
objective: O-079
status: done
depends_on: [{task: T-326, requires: clear}]
check_waiver: {task: T-331, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Rebuild the timeline on the new layout

## Outcome

The timeline (play, speed, scrubber, events, windows, story markers, date, and its phone drawer) sits in its named area, is styled only from the look settings and opens its cards and panels through the panel rule, as the decision note sets; its old placement and styles are gone.

## User Check

On desktop and phone, play, pause, change speed, scrub, open an event card and a story panel from the timeline, and open the phone timeline drawer: each works as before (or as the note's behaviour changes say), and nothing overlaps the bar or sheets.

## Done When

The timeline matches the note's verdict (keep or rebuild) and area; its stylesheet reads only from the look settings and passes the drift check; it opens cards and story panels through the panel rule (no direct open calls left); the timeline drawer is placed by the panel rule; existing timeline tests pass or are migrated as the note lists, each change named; the phone journey passes under the browser policy. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/Design.md` under `Host-page behaviour`
- `packages/astraeus/src/shell/TimelineBar.tsx`
- `packages/astraeus/src/shell/TimelineBar.css`
- `packages/astraeus/src/shell/timelineModel.ts`
- `packages/astraeus/src/shell/timelineGlow.ts`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/src/shell/useDrawers.ts`
- `packages/astraeus-site/tools/validate/journey-planets-phone.mjs`
- `docs/agents/browser-policy.md`

## Design References

The decision note; Design "Host-page behaviour" (timeline space, phone sheets).

## Guardrails

ARCH-01, ARCH-02, API-03, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-07, CODE-01.

## Implementation Plan

1. Move the timeline into its area; remove its own placement rules.
2. Route its card and panel opens and its phone drawer through the panel rule.
3. Restyle from the look settings; pass the drift check.
4. Migrate tests as the note lists; run the phone journey (one browser job at a time).

## Boundaries

No new timeline features, no About, no version bump. Return REPLAN REQUIRED if the timeline cannot follow the note without a product change.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone` and the phone journey under the browser policy. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads: none beyond Context Files (plus the Drift Notes of T-330, T-329, T-326, as the coordinator directed; note sections 1, 2, 5, 6, 8, 9).

Verdict kept: timeline is **keep** (logic) with placement and styles moved. The part was already in `Area name="timeline"`, on look tokens (drift check green) and through the panel rule (drawer: `panels.set("timeline")`/`chooseInDrawer`; events list and marker groups: `usePopupPlace`; info cards: `showInfo` -> `panels.open("card")`; story panel: `story.open` is the timing hook that mirrors into the rule, T-329 note 2). This Task removed the remaining own-placement: `.timeline-bar` is `position: relative` in the area (no absolute `right/bottom/left`, no z-index); the grid's last row is `auto` (phone: `"bar" "sheet" "timeline"`, sheet row `minmax(0,1fr)`); `useTimelineSpace` and every `--timeline-space` use are gone; phone sheet and Developer caps use `100%` of the sheet row instead of window arithmetic; the two-line rule is `@container astraeus-timeline (max-width: 900px)`; the timeline area is `container: astraeus-timeline / inline-size`; the `data-timeline-hidden` `--timeline-space: 0px` rule is removed (empty auto row); embedded and phone timeline margins moved to `margin-bottom`.

Gates: `npm run lint` 0, `npm run typecheck` 0, `npm run build` 0, `npm run check:engine-alone` pass, `npm test` 4271 passed, 2 failed (known `packagePacks.test.ts` pack-size, owner "Wait for cleanup"; engine unpacked **9.56 MB** > 9.5 MB; limit unchanged). Look baseline rewritten with `node tools/look-lock.mjs`; diff reviewed: 5 entries (timeline-bar in 4 contexts: absolute+right/bottom/left+z-index -> relative+margin-bottom; developer-tools phone max-height). No test setup or input changed; no assertion changed.

| Done When | Outcome |
|---|---|
| Matches note verdict (keep/rebuild) and area | Keep; in `timeline` area, placed by the grid row, container on the area |
| Stylesheet reads only from look settings, drift check green | `lookDrift.test.ts` passes; no new literals |
| Cards and story panels through the panel rule, no direct open calls | Card via `showInfo` -> `panels.open`; story via `story.open` mirrored (T-329 note 2); popups via `usePopupPlace`; no direct DOM/open calls |
| Timeline drawer placed by the panel rule | `panels.state.timeline`, area layer `drawer` (unchanged from T-329) |
| Existing tests pass or migrated, each named | All pass; only the computed-look baseline regenerated (note section 8) |
| Phone journey under browser policy | Not run by the builder; coordinator runs it later |

## Drift Notes

For T-327 (Design reconciliation); T-327 accounts for each as reflected in Design.md or non-architectural.
1. **No measured timeline space**: `--timeline-space` and `useTimelineSpace` removed; the grid's last row is `auto`. The "Timeline space measure" row of the note's section 1 is done. Design "Host-page behaviour" (timeline space) needs updating.
2. **Phone grid** is `"bar" "sheet" "timeline"` (the blank `.` row is gone); sheet, story and Developer caps are `100%` of the sheet row (`min(--sheet-max, 100%)`), not window arithmetic. The `--timeline-drawer-max`, `--sheet-max` and `--controls-drawer-max` still come from `phoneLayoutStyle` in `dvh` (T-330 note 6): a pinned test in `phoneLayout.test.ts` holds them, so moving to `cqh` is deferred to T-327 or the cleanup.
3. **Container breakpoint**: rule 6 is on the timeline area (`astraeus-timeline`, inline-size). The area is the viewer's width minus 24 px of grid padding, so the two-line switch now happens at a viewer width of 924 px (was 900). Non-architectural; adjust the number if the owner minds.
4. **Embedded phone-sized frame**: the timeline's side margin is now the grid's phone padding (8 px + safe), not 4 px; embedded wide frames keep padding from `.astraeus-areas` (margin 0).
5. **Layer hack leftovers**: `--astraeus-layer-sheet` is unused in CSS; collapse the three T-330 extra layers in T-327.
6. **Not changed**: `FEATURE_OCCLUDER_SELECTOR` still lists `.timeline-bar` and `.timeline-drawer` (the `[data-area]` selector is a separate item, T-326 note 9); `data-phone` kept (T-330 note 2); `data-timeline-hidden` kept (tests read it).

Coordinator: the container breakpoint is 876px (not 900px) so the two-line switch stays at a 900px viewer, as before (the area is 24px narrower than the viewer); look tests rerun green. The dvh-to-cqh move in phoneLayoutStyle is handed to the cleanup Task T-332 (it needs an assertion change, which goes to the owner first). Coordinator marked done (owner: "orchestrate 79"); npm test 4271 passed, 2 failed (known pack-size; 9.56 MB).
