---
id: T-325
title: Give the bar a title that opens About
objective: O-079
status: done
depends_on: [{task: T-331, requires: clear}]
check_waiver: {task: T-325, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T00:35:01Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g023-20261121}
---

# Give the bar a title that opens About

## Outcome

A scene can carry its title and About content (`scene.setAbout`, `handle.about`, `handle.setAbout`, shaped as the decision note's interface sets), the title is the bar's title item (desktop and the phone row, shrinking to "i" by the bar rule), and it opens an About panel placed by the panel rule (desktop under the title; phone the sheet above the timeline) ending with "Built with Astraeus" and the engine version.

## User Check

On desktop, a scene with an About shows its title at the bar's left; clicking it opens About with the status, credits and links and the built-with mark with the version; clicking again or Escape closes it. On a phone the title (or "i") opens About as a sheet above the timeline, and the object info sheet and About close each other as the note's close table says. A host calling `setAbout` with a new status sees it change in the open panel. A scene without an About shows the selected object's name in the title place.

## Done When

The O-079 Success Conditions for `setAbout`, `handle.about`/`setAbout`, the title item and the About panel hold, through the bar rule and the panel rule (no placement code of its own), with named tests on both embedding paths (one lifecycle suite), a synthetic scene (ARCH-03), a two-viewer test (API-03) and the `bad-about` cases. README, CHANGELOG (proposed 0.9.5), doc comments, `npm run api:errors` and `npm run api:lock` updated. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`
- `.savepoint/Design.md` under `Good guest`
- `.savepoint/Design.md` under `One handle, one lifecycle`
- `packages/astraeus/src/api/scene.ts`
- `packages/astraeus/src/api/pickerInput.ts`
- `packages/astraeus/src/api/viewerHandle.ts`
- `packages/astraeus/src/api/errors.ts`
- `packages/astraeus/src/api/index.ts`
- `packages/astraeus/src/shell/TopBar.tsx`
- `packages/astraeus/src/shell/TopBar.css`
- `packages/astraeus/src/shell/InfoPanel.tsx`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/src/shell/viewerKeys.ts`
- `packages/astraeus/package.json`
- `packages/astraeus/README.md` under `Looks, controls and views`
- `packages/astraeus/README.md` under `Looks, picker, scale and switches`
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

Design "Public API shape (G-016, owner 2026-11-01)", "Good guest", "Host-page behaviour", "One handle, one lifecycle", "Host calls land in order", "Scene and host-link split".

## Guardrails

ARCH-01, ARCH-03, API-01, API-02, API-03, API-04, API-05, API-07, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Add `AboutInput` (and its credit and link types) in its own `src/api/` input file with a checker that throws `bad-about` naming the field; add the `bad-about` code with its doc comment.
2. `Scene.setAbout` (replace) and `scene.about` read; pass the About through the scene's plans and `assembleScene` into the definition.
3. Host link and handle: `about` read and `setAbout` replace, landing in call order, `not-mounted` outside the lifecycle; the same on the `AstraeusScene` ref through `viewerHandleOf`.
4. Engine version: read `version` from the engine's own `package.json` (JSON default import, which the build supports) in one module; no hand-written copy.
5. Shell: the About title becomes the bar's title item (the bar rule places it and shrinks it to "i"); an `AboutPanel` placed by the panel rule (a component with ids via `useId`, styles under `.astraeus-shell`), listing status, credits (Source link when a url is given), links, then the built-with link and version; Escape closes it through the viewer-scoped key rule.
6. Tests: input checks (each field), scene read, handle on both paths, call order, panel render with and without status/credits/links, version equals `package.json`, two viewers, synthetic scene.
7. README rows and a short example; CHANGELOG entry; `npm run api:errors`; `npm run api:lock`.

## Boundaries

No new placement or fit code (use the bar and panel rules; return REPLAN REQUIRED if they cannot express About), no site demo changes, no story buttons or tile, no version bump.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone` and `check:pack`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

**Extra reads (logged; outside Context Files).** `docs/architecture/viewer-interface.md` sections 4, 5, 6, 7, 9 (the Task's design source); Objective O-079 `## Decisions`; Drift Notes of T-326, T-329, T-331 (named by the coordinator); `packages/astraeus/src/app/{App.tsx (attach, picker, Shell props), viewerPort.ts, experienceDefinition.ts}`, `src/api/{assembleScene.ts, viewerLink.ts, viewerPicker.ts, viewerLooks.ts, viewerViews.ts, planPicker.ts, listeners.ts, plainObject.ts, mount.ts, AstraeusScene.tsx}` (the picker is the closest precedent for a link part with a watcher); `src/shell/bar/{Bar.tsx, barItems.ts, barEntries.tsx, fitBar.ts (head)}`, `src/shell/panels/{panelRule.ts, usePanels.ts}`, `src/shell/areas/{Area.tsx, areas.css (grep)}`, `src/shell/style.css` and `phone.css` (info-panel rules, so the panel reuses them); tests `lifecycle`, `twoViewers`, `sceneInputCopies`, `barDom`, `panelRule`, `domSetup` (the tables a new handle member must join); `tools/api-rules.mjs` (head) and `load-budget.mjs` (api page limit line).

**Built.**
- `src/api/aboutInput.ts` (`AboutInput`; `checkedAbout`, throws `bad-about` naming the field, returns a frozen copy), `planAbout.ts` (`Scene` plan), `viewerAbout.ts` (the link's live About with a watcher, like the picker), `errors.ts` (`bad-about` with its doc comment), `scene.ts` (`setAbout`, `about`), `assembleScene.ts` and `experienceDefinition.ts` (definition field `about`), `viewerPort.ts` (`ViewerControl.about`, `aboutNow`, `watchAbout`), `viewerLink.ts` and `viewerHandle.ts` (`about`, `setAbout` on the one handle both paths use), `index.ts` (exports `AboutInput`), `App.tsx` (`useAbout`: the live About else the scene's; `attach` hands the scene's About).
- `src/app/engineVersion.ts`: `ENGINE_VERSION` from `package.json` (JSON import), `BUILT_WITH_URL`. The one source of the version.
- Shell: `panelRule.ts` gains the occupant `about` in the left place (close table rows: replaces card and moons and is replaced by them; covers story; Escape as detail; phone detail sheet also replaces the developer sheet), `AboutPanel.tsx` (reuses the `info-panel` look, ends with the built-with link and version), `useTitlePlace.ts`, `Bar.tsx` (`TitlePlace` is now a button with `aria-expanded` and `aria-controls` only while the panel is drawn), `barEntries.tsx` (title item from the About: full, `shortTitle`, "i"; shown on a wide bar too when an About exists), `AstraeusShell.tsx`, `TopBar.css`, `style.css` (token-only styles). No placement or fit code of its own.
- Docs: README rows (`scene.setAbout`, `scene.about`, `handle.about`/`setAbout`, `mount` return list, regenerated error table), CHANGELOG line under `## 0.9.5 (proposed)`, `api-surface.lock.json` regenerated.

**Tests added.** `tests/about.test.ts` (21 cases: each `bad-about` field alone, scene read, frozen copy, replace, definition entry, version equals `package.json`, the link's About part, wide and phone shell cases incl. the "i" form by the fit rule, no-About phone title opening the card, panel rule About rows on wide and phone); `lifecycle.test.ts` (two cases run on both paths: handle read and setAbout, live panel change, call order, `bad-about`, rebuild, unmount, not-mounted; plus the About-less scene); `twoViewers.test.ts` (API-03 case on all three pairings). Table additions (not setup changes): `lifecycle.test.ts` `READS` gains `about` and `CALLS` gains `setAbout`; `twoViewers.test.ts` `SETTERS` gains `setAbout` (the type forced it); `sceneInputCopies.test.ts` gains a `setAbout` row and `about: scene.about` in its observed reads (so a kept caller object would be seen); `domSetup.ts` gains an optional `about` option.

**Gates (final run).** `npm run lint` 0 problems; `npm run typecheck` 0; `npm run build` ok; `npm run check:engine-alone` pass (206 files, 3202 tests); `npm test` 4305 passed, 3 failed: the 2 known `packagePacks.test.ts` pack-size failures (engine unpacked 9.58 MB, was 9.56 MB; limit untouched) and one new red, `apiReference.test.ts` "api/index.html raw and gzip limits" (gzip 46,408 B against the 46,000 B cap; before this Task the page measured 45,995 B, so the cap had 5 B of room). I shortened my own doc comments and dropped a separate read type (reads return `AboutInput`); the page still needs the cap raised to about 46,500 (owner decision, see the Objective's earlier raises). `npm run look:lock` rewrote `tests/fixtures/computed-look.baseline.json` (6 lines): the phone's title place is now a button (transparent, pill radius, pointer, line-height 1.2).

**Done When.**

| Criterion | Outcome |
|---|---|
| `scene.setAbout` / `scene.about` as the note's interface | `about.test.ts` "Scene.setAbout" (read, frozen, replace, definition entry) |
| `handle.about` / `handle.setAbout` on both embedding paths, one lifecycle suite | `lifecycle.test.ts` about case under `describe.each([mountDriver, reactDriver])`; `READS` and `CALLS` tables; `twoViewers` `SETTERS` |
| `bad-about` naming the field, with its doc comment and README row | `about.test.ts` checks title, shortTitle, status, credits, links and each entry's text and url; doc comment in `errors.ts`; `npm run api:errors` regenerated the table |
| Host calls land in call order, `not-mounted` outside the lifecycle | `lifecycle.test.ts` (two `setAbout` in one tick, last wins; unmount; before ready via `CALLS`) |
| Title is the bar's title item (wide and phone), "i" when tight by the fit rule | `about.test.ts` wide title and phone title cases; fit case at width 70 reads "i" with the full name in the screen-reader span |
| About panel placed only by the panel rule, Escape closes it, card and About share the left place | `about.test.ts` (`data-area="left"`, no inline style, Escape, card replaces About and back) and the panel-rule About rows on wide and phone |
| Panel ends with the built-with link and the engine version from `package.json` | `about.test.ts` (last child, href `https://astraeus.anipatke.com/`, version equals `package.json`); `engineVersion.ts` is the only reader |
| With no About, the title place shows the object's name and opens its card | `about.test.ts` phone case (`aria-expanded`, `aria-controls` the card) |
| Synthetic scene (ARCH-03) | the shell tests run on the made-up experience; the API tests on `Scene().addBody(earth)` |
| Two-viewer test (API-03) | `twoViewers.test.ts`: A's title, panel, `setAbout` and Escape leave B alone, on all pairings |
| README, CHANGELOG, doc comments, `api:errors`, `api:lock` | done; see Built |
| Verification policy | gates run above; waiver recorded in frontmatter; Full Objective Check pending |

**Limitations.** No browser run (policy). The API page gzip cap is red (above). The wide bar shows no title for a scene without an About (kept from T-326: the name would repeat the picker); the note section 6 change 3 says the title place shows the selected object's name with no About, which this builder applied to the phone only. `shortTitle` has no effect unless the row is tight; the "short" step was exercised only through the fit rule's own tests plus the "i" case here.

## Drift Notes

For T-327 (Design reconciliation); T-327 accounts for each as reflected in Design.md or non-architectural.
1. **New modules**: `api/aboutInput.ts`, `api/planAbout.ts`, `api/viewerAbout.ts`, `app/engineVersion.ts`, `shell/AboutPanel.tsx`, `shell/useTitlePlace.ts`. The note's section 9 lists parts by folder (`parts/about`); the About panel is a flat file in `shell/` like the card and moons parts are today.
2. **Definition and link**: `ExperienceDefinition.about`, `ViewerControl.about`, `ViewerPort.aboutNow/watchAbout`. The live About is held by the link (`ViewerAbout`), seeded from the scene on attach and reset on detach, as the picker is; App reads it with `useSyncExternalStore` and falls back to the definition's.
3. **Public type**: one export, `AboutInput`; reads (`scene.about`, `handle.about`) return it as a frozen copy. The note names `AboutRead`; dropped because the API page's gzip cap (46,000 B) had 5 B of room.
4. **Panel rule**: occupant `about` in `left` (`PanelState.left` gains `"about"`); no new close-table row beyond "any left occupant replaces the other".
5. **Title place**: now a button on both bars (wide only with an About). With an About it toggles the About panel; with none (phone) it toggles the object card. `aria-controls` is set only while the panel is drawn (the `viewerIds` rule).
6. **Panel look**: the About panel reuses the `info-panel` classes (a second class `about-panel` for its few rules in `style.css`), so the phone sheet rules and the occluder list apply unchanged.
7. **Version**: `ENGINE_VERSION` is a JSON import of the whole `package.json` (bundlers keep only `version` after tree-shaking JSON where they can; the engine ships source).
8. **Not done (outside this Task)**: a scene's `Scene.check`-time validation of About is the setter's (it throws at the call, like `setPicker`); no site demo change.

Coordinator: accepted the table additions (lifecycle READS/CALLS, twoViewers SETTERS, sceneInputCopies row, domSetup option) as additions, not setup changes. Accepted the wide bar showing no title without an About (the object picker already names the object; the phone title place shows it, note §6 change 3); recorded for T-327 reconciliation. API page cap red: owner "Review with the package size". Coordinator marked done (owner: "orchestrate 79"); npm test 4305 passed, 3 failed (2 known pack-size, 9.58 MB; 1 known API page cap).
