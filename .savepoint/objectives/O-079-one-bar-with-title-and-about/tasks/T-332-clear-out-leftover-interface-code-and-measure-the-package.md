---
id: T-332
title: Clear out leftover interface code and measure the package
objective: O-079
status: done
depends_on: [{task: T-325, requires: clear}]
check_waiver: {task: T-332, reason: 'Owner said "orchestrate 79": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o079-20261121}, recorded_at: '2026-11-21T02:14:11Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-o079-20261121}
---

# Clear out leftover interface code and measure the package

## Outcome

After the reset's build Tasks, nothing of the old interface is left: no CSS rule for a class the interface no longer renders, no unused look token, no dead export, helper or test helper, no leftover old stylesheet; a test keeps it that way; and the engine package's packed and unpacked size is measured before and after, so the owner can decide the size limit on the real number.

## User Check

None visible: the demos look and behave the same. The owner reads the before and after size and decides the limit (owner: "Let's assess the limit post cleanup").

## Done When

Every CSS class selector in the interface stylesheets matches a class the interface renders (or is on a reasoned allowlist, expected empty), checked by a new test that fails on an unused class; every `--astraeus-*` token is used; old stylesheets are merged into the area and part layout of `docs/architecture/viewer-interface.md` §9 (the drift check and computed-look baseline stay green, baseline changes named); dead exports, helpers and test helpers removed (each named); no existing test's setup or inputs changed; behaviour unchanged; engine packed and unpacked size recorded before and after (`npm run check:pack`), with the largest contributors listed. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md` under `9. Module structure and contributor guide`
- `docs/architecture/viewer-interface.md` under `3. Look`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/Objective.md`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-330-set-up-the-screen-areas-and-one-shared-look.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-329-place-every-panel-by-one-rule.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-326-put-the-phone-s-controls-in-one-bar-row.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-331-rebuild-the-timeline-on-the-new-layout.md` under `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-325-give-the-bar-a-title-that-opens-about.md` under `Drift Notes`
- `packages/astraeus/src/shell/style.css`
- `packages/astraeus/src/shell/controls.css`
- `packages/astraeus/src/shell/TimelineBar.css`
- `packages/astraeus/src/shell/phone.css`
- `packages/astraeus/src/shell/embedded.css`
- `packages/astraeus/src/app/style.css`
- `packages/astraeus/src/shell/look/look.css`
- `packages/astraeus/tests/lookDrift.test.ts`
- `packages/astraeus/tests/viewerStyles.test.ts`
- `tools/check-packs.mjs`

## Design References

The decision note §3 and §9; Design "Good guest" (styles under `.astraeus-shell`).

## Guardrails

ARCH-01, API-01, API-03, TEST-01, TEST-03, STYLE-05, STYLE-07, CODE-01.

## Implementation Plan

1. Measure the engine pack (packed, unpacked, largest files) before any change.
2. List every class the interface renders (from the components) and every class selector in the stylesheets; remove rules for classes no longer rendered.
3. Remove unused tokens; merge leftover old stylesheets into the §9 layout.
4. Find and remove dead exports, helpers and test helpers (none used outside tests that only test them).
5. Add the unused-class test (the selector list against rendered classes), with a planted case proving it trips.
6. Run the gates; measure the pack again; list the largest contributors.

## Boundaries

No behaviour change, no new features, no change to the size limit (the owner decides after this Task). Return REPLAN REQUIRED if removing something would change behaviour.

## Technical Verification

Focused tests while iterating; handoff runs the configured gates plus `check:engine-alone` and `check:pack`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session `t332-builder-20261121`, finished 2026-11-21T02:55Z. Node v24.16.0, npm 12.2.1. Not committed (the coordinator commits).

### Sizes (engine package `astraeus`, `npm pack --dry-run --json` on `packages/astraeus/dist` after `npm run check:pack`)

| | Before | After | Change | Limit |
|---|---|---|---|---|
| Packed | 7,338,701 B (7.34 MB) | 7,338,261 B (7.34 MB) | -440 B | 8.0 MB |
| Unpacked | 9,581,005 B (9.58 MB) | 9,576,647 B (9.58 MB) | -4,358 B | 9.5 MB: still 76,647 B over |
| Files | 620 | 620 | 0 | none |
| Stylesheets (9) | 87,542 B | 83,795 B | -3,747 B | |
| API page gzip | 46,408 B | 46,408 B | 0 | 46,000: 408 B over |

The cleanup alone does not bring the pack under its limit: earlier Tasks had already removed most old rules, so only 16 dead classes were left, all in `src/app/style.css` (13,457 -> 9,757 B). The CHANGELOG line of this Task added 678 B back.

Unpacked size by kind (after): pictures 6,323,414 B (10 files, 66.0%); compiled JS 1,460,126 B (290 files, 15.2%, of which the six `.node.js` copies are 114,545 B); data JSON 783,966 B (19 files, 8.2%); declarations `.d.ts` 687,533 B (284 files, 7.2%); README, CHANGELOG, LICENSE, NOTICE, licences 236,570 B (7 files, 2.5%); CSS 83,795 B (9 files, 0.9%); `package.json` 1,243 B. Source maps: none are packed (forbidden by the pack check).

Top 15 files (after): earth-bmng-july-4k.jpg 1,559,348; venus-2k-balanced.jpg 1,090,552; mercury-2k.jpg 872,555; sun-2k.jpg 822,427; moon-lroc-2k.jpg 565,978; jupiter-2k.jpg 498,976; mars-2k.jpg 429,761; data/ephemerides/planets/planets.json 351,329; src/assets/stars/hyg-v42-naked-eye.json 338,278; neptune-2k.jpg 241,580; saturn-2k.jpg 164,486; CHANGELOG.md 119,455; README.md 109,918; uranus-2k.jpg 77,751; src/app/App.node.js 58,965 (then src/app/App.js 58,960). Stylesheets: shell/style.css 26,734; TimelineBar.css 14,852; phone.css 10,072; app/style.css 9,757; TopBar.css 5,442; controls.css 5,130; look/look.css 4,633; areas/areas.css 4,352; embedded.css 2,823.

API page (measured with `collectExports` and `renderApiPage` of `packages/astraeus-site/tools/site/api-reference.mjs`): 158 exports, 215,757 B raw, 46,408 B gzip. It was 45,167 B when the cap was set (O-077 T-323). Removing this Objective's additions from the rendered page one group at a time: About (`AboutInput`, `about`/`setAbout` on `Scene`, `ViewerHandle`, `MountedScene`, `AstraeusSceneProps`) 394 B gzip; interface look (`InterfaceLook`, `LookInput.interface`, `LookRead.interface`) 391 B; `shortLabel` members 38 B; together 830 B. The other roughly 410 B of the 1,241 B growth is not attributed here (the `bad-about` error-code text and doc-comment edits are the likely part; not measured against the old commit). Largest entries by gzip cost: `Scene` 6,101; `MountedScene` 3,821; `ViewerHandle` 3,789; `SceneCamera` 1,704; `SceneErrorCode` 1,226. `MountedScene` repeats all 37 members of `ViewerHandle` (39 against 37).

### Options for the owner (not decided here; neither limit was changed)

Pack, unpacked limit 9.5 MB (76,647 B to find):
1. **One place loads the stylesheets.** Plain Node cannot load CSS, so the build writes a `.node.js` twin of every file that imports a stylesheet and of every file that imports one of those: `App`, `AstraeusShell`, `TimelineBar`, `AstraeusScene`, `mount`, `index`, 114,545 B. Loading all sheets from the two entry files (`api/mount.ts`, `api/AstraeusScene.tsx`) leaves three small twins (about 10 KB): about -104 KB, unpacked about 9.472 MB (about 28 KB of room). Cost: the stylesheet load order changes (the look lock covers two orders and would need a new baseline review), and the site and demos that import `App` directly must load the styles themselves. A separate Task.
2. **Pack only the recent changelog.** `CHANGELOG.md` is 119,455 B (17 versions); the newest three sections are about 7 KB. Packing those with a link to the full file: about -112 KB, unpacked about 9.465 MB. Cost: the npm page loses the history; a build step and a pack-check rule.
3. **Minify CSS at build.** Rough measure (comments and white space out): 83,795 -> about 65,810 B, -18 KB. Not enough alone; a host reading the shipped CSS finds it harder to read.
4. **Raise the limit** (for example 9.7 MB). The growth is real interface code (tokenised CSS 71,532 -> 83,795 B, About, the bar and panel rules). Packed size has room (7.34 of 8.0 MB). Cost: the limit drifts; O-080 and O-081 add more.
5. Re-encode a picture (the Earth picture alone is 1.56 MB): a look change, outside this Objective.
Options 1 and 2 each clear the limit alone; together about 9.36 MB.

API page, gzip cap 46,000 (408 B to find):
1. **Draw `MountedScene` as `ViewerHandle` plus its own two members** in the generator: up to about -3,800 B gzip (page about 42.6 KB), room for O-080 and O-081. Cost: a reader follows a link for the shared members; a change to `api-reference.mjs`.
2. **Raise the cap** (for example 47,000), as on 2026-11-20. Cost: O-080 and O-081 add handle members and will meet it again.
3. **Split the page** (types on a second page): the largest change; cross-page links.
4. Trim doc comments: fragile; T-325 already dropped a type (`AboutRead`) for 5 B of room.

### What was removed or changed (each named)

- `src/app/style.css`, rules for 16 classes nothing renders (searched `packages/*/src`, `packages/*/tests`, `packages/astraeus-site/tools`, `examples`, `tools`: no `className`, `class=` or selector use): `.hud .row`, `.hud .readout`, `.hud .controls` (3 rules), `.hud .rate-help`, `.hud .scale-help` (its only source mention is the pop-up id `usePopup("scale-help")`), `.hud .error`, `.hud .mission-summary` (6 rules), `.hud .mission-empty`, `.hud .spacecraft-grid`, `.spacecraft-card`, `.spacecraft-card-header` (2), `.telemetry-state` (2), `.spacecraft-metrics`, `.scale-controls` (2), `.hud-section-clock` (4 selectors, one shared with `.developer-heading`, which stays), `.dev-group-cards` (4 rules, one in the `@container`). 32 lines out, 2 rewritten.
- `src/shell/look/look.css`: `--astraeus-layer-sheet` removed (no reader). `--astraeus-layer-panel` and `--astraeus-layer-bar` are each read once by `areas.css` (right and left places), so they stay; values unchanged.
- `--astraeus-blur` had no reader, while six `backdrop-filter: blur(var(--astraeus-space-5))` used the 12 px space step for the same 12 px. Those six now read `var(--astraeus-blur)` (`style.css` x4, `phone.css`, `TimelineBar.css`): same computed 12 px, and the token of note section 3 is used. `TopBar.css` blurs 8 px (`--astraeus-space-4`) and is left as it is.
- Dead exports: `journeyProgressMetric` (`src/app/metricReadouts.ts`, with its now unused `HOUR_MS`, `TimelineEvent` and `ProgressMetric` imports) and `MissionConfig` (`src/app/mission.ts`): no reference in any package, test, tool or example (`docs/architecture/reconciliation-history.md` line 148 already names them as leftovers).
- **Bar stylesheet not loaded (defect found, fixed).** `shell/TopBar.css` holds the bar's rules (`.top-bar`, `.bar-title`, `.bar-ghost*`, the scale and switch pop-ups) but nothing imported it: T-326 deleted `TopBar.tsx`, which held `import "./TopBar.css"`, and `Bar.tsx` did not take the import over. Tests inject the sheets by path, so they did not see it; a real page drew the bar without its sheet. `AstraeusShell.tsx` now imports it with the other shell sheets, before `controls.css` (the order `computedLook.test.ts` assumes). Importing it from `Bar.tsx` instead added two more `.node.js` twins (+7.6 KB), so the shell import was chosen. Regression: `interfaceLeftovers.test.ts` "has no interface stylesheet that no source file imports".
- `FEATURE_OCCLUDER_SELECTOR`: checked every entry (`.info-panel`, `.moons-sheet`, `.moons-toggle`, `.timeline-bar`, `.shell-toolbar`, `.story-panel`, `.controls-drawer`, `.drawer-handle`, `.developer-tools`, `.developer-mode-toggle`, `.timeline-drawer`); each is rendered, so none was removed.
- Owner-approved extra (owner: "Follow the viewer (Recommended)"): `phoneLayoutStyle` emits `cqh` (the viewer's own height) for `--timeline-drawer-max`, `--controls-drawer-max` and `--sheet-max`; the stylesheet fallbacks were already `cqh`. `phoneLayout.test.ts` lines 20 to 22: expected values `40dvh`, `50dvh`, `70dvh` became `40cqh`, `50cqh`, `70cqh`; nothing else in that test changed.
- Computed-look baseline (`tests/fixtures/computed-look.baseline.json`, `npm run look:lock`): two style rows changed, both from the approved `cqh` move and none from a removed rule: `.controls-drawer` `max-height` `60dvh` -> `60cqh`, and `.timeline-drawer-body` `max-height` `calc(55dvh - 128px)` -> `calc(55cqh - 128px)` (the phone and embedded-phone scenarios).
- New test `packages/astraeus/tests/interfaceLeftovers.test.ts` (15 cases). `CHANGELOG.md`: one line under 0.9.5 (proposed).

### Kept, listed as candidates (not proven dead, or blocked)

- **Merging the old sheets into the section 9 folders was not done.** `TopBar.css`, `TimelineBar.css`, `controls.css`, `style.css`, `phone.css` and `embedded.css` are read by path in the setup of existing tests (`viewerStyles.test.ts` `SHEETS`, `computedLook.test.ts` `REST`, `domPhone.test.ts`, `domEmbedded.test.ts`, `infoCards.test.ts`, `domStorySteps.test.ts`, `experienceDefinitionContract.test.ts`); moving or merging a file changes those inputs, which this Task may not do. Needs the owner's approval of a path-list migration.
- `storyItem` (`shell/bar/barItems.ts`): used only by `fitBar.test.ts`; it is the O-080 story-button item, and removing it would change an existing test.
- `bodyFeatureSet` (`shell/bodyFeatures.ts`), `eventPositionPercent` (`shell/timelineModel.ts`), `resolverTrajectory` (`app/bodyMetrics.ts`), `COMPOSITION_PATH_STYLE` (`app/PathView.ts`), `keplerOperationOrder` (`app/keplerShader.ts`), `SKY_PROBE_DIRECTION` (`app/SkyView.ts`), `jumpToEvent` (`app/mission.ts`): each used only by existing tests; not interface code, left.
- The unused optional `className` of a Developer group in `App.tsx` (line 680; no group sets it now that `dev-group-cards` is gone).
- `[data-area="tile"]`, `[data-area="sheet"]`, `[data-area="popover"]` in `areas.css` and the matching `AREA_NAMES`: for O-080 and O-081, nothing occupies them yet.
- `TrackedBody.positionDiscrepancies` and the discrepancy metric builders (reconciliation-history line 148): still referenced by code and tests.
- `PHONE_QUERY` re-export in `phoneLayout.ts` (`phoneLayout.test.ts` imports it) and `PhoneLayoutSettings.animationMs` (the Developer slider's field).
- Exports used only inside their own file (for example `StoryBadge`, `menuItem`, `TimelineExpanded`, `AREA_NAMES`): the `export` word is unneeded but harmless; left.

### Done When (first pass; superseded by "Done When (final)" below)

| Criterion | Outcome | Evidence |
|---|---|---|
| Every class selector in the interface stylesheets matches a rendered class, checked by a new test that fails on an unused class; allowlist empty | Met | `interfaceLeftovers.test.ts`: "has no class selector the interface never renders" (it named the 16 classes before the removal); "keeps the allowlist empty, or every entry reasoned and still needed" (`ALLOWED` is `{}`); planted cases "a class no source renders is named, with its file", "a comment, a selector string, a longer word and a string that sets no class do not render a class", "a run-time class counts only with a family, and only for the family's values" |
| Every `--astraeus-*` token is used | Met | "has no look token that nothing reads" (it named `--astraeus-blur` and `--astraeus-layer-sheet` first); planted case "a token nothing reads is named; a read token and a host token are not". The 19 tokens documented for host content (note section 10) count as used |
| Old stylesheets merged into the section 9 area and part layout | Not met | Blocked: the files are inputs of existing tests (see candidates). Dead rules inside them: none found. Decision needed |
| Drift check and computed-look baseline stay green, baseline changes named | Met | `lookDrift.test.ts`, `computedLook.test.ts` and `interfaceLeftovers.test.ts` together: 41 passed, 1 skipped, after `npm run look:lock`; the two changed rows are named above (both from the approved `cqh` move) |
| Dead exports, helpers and test helpers removed, each named | Met in part | Removed: `journeyProgressMetric`, `MissionConfig`. Test-only helpers are kept because removing them changes existing tests (named in candidates) |
| No existing test's setup or inputs changed | Met, with two named exceptions | Only `phoneLayout.test.ts` lines 20 to 22 (approved) and the regenerated look baseline (two rows, the same approved change). `git diff --stat -- packages/*/tests` shows those two files and the new test |
| Behaviour unchanged | Met, with two named changes | The approved `cqh` move; and the bar stylesheet is loaded again (a real page now gets the look the tests already locked). Removed rules matched nothing: baseline unchanged by them |
| Packed and unpacked size recorded before and after, largest contributors listed | Met | Sizes table and lists above |
| `docs/agents/verification.md` applied | Met | Gates below, run fresh after the last source change |

### Commands run (final run, 2026-11-21T02:52Z to 02:55Z, after the last change)

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm run build`: exit 0.
- `npm test`: 4320 passed, 3 failed, 2 skipped (278 files). The 3 failures are the known reds: `packagePacks.test.ts` "every package builds, packs only allowed files and stays under its limits" and "fails the pack check when a data package's astraeus peer floor is not the engine's minor…" (engine unpacked 9.58 MB over 9.5 MB), and `apiReference.test.ts` "keeps the generated page within the api/index.html raw and gzip limits of load-budget.mjs (I-142)" (46,408 > 46,000). Before this Task: 4305 passed, 3 failed (the same three); +15 are the new test's cases.
- `npm run check:engine-alone`: pass in 27.8 s.
- `npm run check:pack`: FAIL, 1 problem: `astraeus: unpacked 9.58 MB is over 9.5 MB` (known red); every other package within its limits.
- `npm run look:lock` once (baseline regenerated, diff reviewed).
- Focused while iterating: `npx vitest run` on `interfaceLeftovers`, `computedLook`, `lookDrift`, `viewerStyles`, `phoneLayout`, `domPhone`, `domEmbedded`.
- No browser run (as instructed).

### Files read beyond the Context Files (logged extra reads)

- `agent-skills/savepoint-task/SKILL.md`, `docs/agents/verification.md`, `docs/agents/build.md`, `.savepoint/router.md` (skill Read section).
- `packages/astraeus/src/shell/TopBar.css` (whole; a leftover sheet the brief names), `shell/bar/Bar.tsx` lines 1 to 16 and `shell/AstraeusShell.tsx` lines 37 to 46 (where the sheets are imported), `shell/phoneLayout.ts` and `tests/phoneLayout.test.ts` (the approved extra).
- `packages/astraeus/tests/computedLook.test.ts` lines 1 to 80 and grep of every test that reads a `.css` by path (to know which sheets are test inputs).
- `tools/build-packages.mjs` lines 30 to 75 and 165 to 200 (how CSS and the `.node.js` twins reach the pack; for the options).
- `packages/astraeus-site/tools/validate/load-budget.mjs` (the API page cap line), `packages/astraeus-site/tests/apiReference.test.ts` lines 1 to 30 (how the page is measured).
- `docs/architecture/reconciliation-history.md` line 148 (whether the two dead exports were already decided).
- `packages/astraeus/CHANGELOG.md` top section only; `src/app/metricReadouts.ts` and `src/app/mission.ts` around the two removed exports; `src/app/FeatureMarkers.ts` line 63; grep results across `packages`, `examples`, `tools` for each removed name.

### Files changed

`packages/astraeus/src/app/style.css`, `src/app/metricReadouts.ts`, `src/app/mission.ts`, `src/shell/AstraeusShell.tsx`, `src/shell/look/look.css`, `src/shell/style.css`, `src/shell/phone.css`, `src/shell/TimelineBar.css`, `src/shell/phoneLayout.ts`, `tests/phoneLayout.test.ts`, `tests/fixtures/computed-look.baseline.json`, `tests/interfaceLeftovers.test.ts` (new), `CHANGELOG.md`, and this Task file.

### Limitations

- The unused-class test reads the source, not a drawn page: a class counts when a string sets it (`className`, `classList`, a `CARRIERS` line). It cannot see a class that is set in source but only under a condition that never holds, or a rule whose combination of rendered classes never occurs (for example `.a .b` where both exist but never nest). Attribute selectors were checked once by script (every `[data-*]` name and value in the sheets is set in source), not by the test.
- The bar-stylesheet fix was not viewed in a browser (no browser runs); the owner sees it on localhost:5490. With the sheet missing the bar had no panel background or layout of its own, so the preview should look as the look lock describes, not as it did since T-326.
- The `cqh` limits were not viewed in a browser. `cqh` needs a size container: the viewer root is one (`areas.css`, `container: astraeus-viewer / size`).
- Option savings are estimates from file sizes, not built and measured.
- STYLE and CODE-01: no function over the lint limit (lint exit 0).

### Second pass: the owner's three decisions (2026-11-21, relayed by the coordinator; finished 03:17Z)

The sections above record the first pass; where this section differs, this section is the current state.

Owner quotes: "Load styles from one place (Recommended)"; "Stop listing entries twice (Recommended)"; "Approve, do it together (Recommended)".

Final sizes (all gates green, both former reds included):

| | Start of Task | After first pass | Final | Limit |
|---|---|---|---|---|
| Packed | 7,338,701 B | 7,338,261 B | 7,323,820 B (7.32 MB) | 8.0 MB |
| Unpacked | 9,581,005 B | 9,576,647 B | 9,473,196 B (9.47 MB), 26,804 B under | 9.5 MB |
| Files | 620 | 620 | 617 | none |
| `.node.js` copies | 6 files, 114,545 B | 6 files | 3 files, 10,061 B (`index`, `mount`, `AstraeusScene`) | |
| API page gzip (raw) | 46,408 B (215,757) | 46,408 B | 42,577 B (196,055), 3,423 B under | 46,000 |

Final by kind: pictures 6,323,414; compiled JS 1,355,440 (287 files); data JSON 783,966; declarations 687,334; README, CHANGELOG, licences 236,971; CSS 84,828 (9 files); `package.json` 1,243.

1. **Styles from one place.** `src/app/style.css` (the published `astraeus/style.css`) now starts with eight `@import` lines that load the interface sheets in cascade order (look, areas, timeline, bar, controls, parts, phone, embedded: the look lock's "site" order), and it is the only stylesheet any source file imports: the two entry files `api/mount.ts` and `api/AstraeusScene.tsx` import it as before. The CSS imports in `AstraeusShell.tsx` (seven) and `TimelineBar.tsx` (one) are gone, so the build writes no `.node.js` copy of `App`, `AstraeusShell` or `TimelineBar`.
   - **Why `@import` and not imports in the entry files** (a deviation from the coordinator's wording): `apiImports.test.ts` allows `src/api` to import only `app/style.css` among stylesheets (its `ALLOWED` table), and that table is test setup this Task may not change. With `@import` the entry files are unchanged and the front door stylesheet becomes the whole look. If the owner prefers JS imports in the entry files, that needs eight `ALLOWED` entries approved.
   - **A guard rule**: an empty `.astraeus-shell {}` follows the imports. happy-dom drops the first rule after an `@import` when a test injects the sheet's text (probed: `@import "x.css"; .a{top:1px} .b{top:2px}` gives `.a` nothing, `.b` 2px); without the guard the look lock lost `.canvas-host` (`position`, `inset`). A browser and a bundler read the empty rule as nothing.
   - Computed-look baseline: no change in this pass (`computedLook.test.ts` passes against the baseline of the first pass, both orders).
   - The site and the demos import only `from "astraeus"` (checked `packages/astraeus-site/src`, `packages/astraeus-demo-*/src`; `examples/hello-sky` imports `astraeus/style.css`), so they get the styles through the front door. Built site stylesheet `dist/assets/app-*.css` (65,538 B) holds the bar and timeline rules and no `@import`. `npm run check:node-consumer`: pass.
   - `interfaceLeftovers.test.ts` (now 18 cases). New: "loads the stylesheets in one place: only the entry files import one, and only the one stylesheet"; planted "a stylesheet imported by a component, or a second sheet imported by an entry file, is named" and "a sheet the one stylesheet does not load is named, and the one stylesheet when nothing imports it". One case of the first pass had to be rewritten, not only added to: "has no interface stylesheet that no source file imports" became "has no interface stylesheet that the one stylesheet does not load" (under the new design no source file imports those sheets, so the old wording could not hold).
2. **API page.** `packages/astraeus-site/tools/site/api-reference.mjs`: an interface that extends another on the page lists only its own members under "Has every member of `Base`, and its own:" with a link (`ownMembers`; a member counts as inherited only when its name, type and text are the same in the base). It applies to three entries: `MountedScene` (from `ViewerHandle`; shows `ready` and `unmount`), and the two that extend `CenteredPosition` and `ScalePolicy`. `apiReference.test.ts` unchanged and passing.
3. **Stylesheets moved** (whole files, `git mv`, staged as renames): `shell/TopBar.css` -> `shell/bar/bar.css`; `shell/TimelineBar.css` -> `shell/parts/timeline/timeline.css`; `shell/controls.css` -> `shell/parts/controls.css`; `shell/style.css` -> `shell/parts/parts.css`; `shell/phone.css` -> `shell/parts/phone.css`; `shell/embedded.css` -> `shell/parts/embedded.css`. Path lists updated, paths only: `viewerStyles.test.ts` `SHEETS`; `computedLook.test.ts` `REST`; `domPhone.test.ts` line 190; `domEmbedded.test.ts` (`css("parts/phone.css")`, `css("parts/controls.css")` x2); `infoCards.test.ts` and `domStorySteps.test.ts` (`["parts/parts", "parts/phone"]`); `experienceDefinitionContract.test.ts` (the list entry, and the same path added to the glob list, which only reached `shell/*.css`).
   - **Not split per part**: `parts.css` still holds the card, metric, story, marker and moons rules together, and `phone.css` and `embedded.css` are per-layout sheets across parts. Splitting them into `parts/<part>/` files is a cascade-order job with its own look review; left as a candidate.

Gates, final fresh run (2026-11-21T03:12Z to 03:17Z; `npm test` and `check:pack` rerun after the last CHANGELOG edit): `npm run lint` exit 0; `npm run typecheck` exit 0; `npm run build` exit 0; `npm test` 4326 passed, 0 failed, 2 skipped (278 files); `npm run check:engine-alone` pass in 23.3 s; `npm run check:pack` pass (engine 7.32 MB packed, 9.47 MB unpacked, 617 files); `npm run check:node-consumer` pass. No browser run. `check:react-consumer` and `build:example` not run (network).

Extra reads in this pass: `packages/astraeus-site/tools/site/api-reference.mjs` (member collection and rendering) and its `.d.mts`; `packages/astraeus/src/api/mount.ts` lines 1 to 45; `packages/astraeus/tests/apiImports.test.ts` lines 20 to 62; `packages/astraeus/tests/experienceDefinitionContract.test.ts` lines 20 to 60; `packages/astraeus/package.json` exports.

Files changed in this pass: the six moved sheets; `src/app/style.css`; `src/shell/AstraeusShell.tsx`, `src/shell/TimelineBar.tsx`, `src/shell/bar/Bar.tsx` (comment); the seven tests' path lists; `tests/interfaceLeftovers.test.ts`; `packages/astraeus-site/tools/site/api-reference.mjs`; `CHANGELOG.md`.

Limitations added: the `@import` front door relies on the host's bundler resolving CSS `@import` (Vite does: checked in the built site; webpack's css-loader and a plain `<link>` do by default, not run here). Not viewed in a browser. The room under the pack limit is 26.8 KB, which O-080 and O-081 can use up.

### Done When (final)

| Criterion | Outcome | Evidence |
|---|---|---|
| Every class selector matches a rendered class, checked by a new test that fails on an unused class; allowlist empty | Met | `interfaceLeftovers.test.ts`: "has no class selector the interface never renders", "keeps the allowlist empty, or every entry reasoned and still needed", and the planted cases |
| Every `--astraeus-*` token is used | Met | "has no look token that nothing reads" and its planted case |
| Old stylesheets merged into the section 9 area and part layout | Met for location, not split per part | Six sheets moved into `shell/bar/` and `shell/parts/` (owner: "Approve, do it together (Recommended)"); the per-part split is a named candidate |
| Drift check and computed-look baseline stay green, baseline changes named | Met | `lookDrift.test.ts` and `computedLook.test.ts` pass; baseline changes: the two `cqh` rows of the first pass, none in the second |
| Dead exports, helpers and test helpers removed, each named | Met in part | Removed `journeyProgressMetric`, `MissionConfig`; test-only helpers kept (they are used by existing tests), named under candidates |
| No existing test's setup or inputs changed | Met, with the approved exceptions | `phoneLayout.test.ts` three expected values; the look baseline's two rows; the stylesheet paths in seven tests (owner-approved) |
| Behaviour unchanged | Met, with named changes | `cqh` limits (approved); the bar sheet loads again; one stylesheet order for every host (the "site" order; the look lock passes in both orders) |
| Packed and unpacked size recorded before and after, largest contributors listed | Met | Tables above |
| `docs/agents/verification.md` applied | Met | Gates above, all passing |

## Drift Notes

For T-327 (Design reconciliation); T-327 accounts for each as reflected in Design.md or non-architectural.
1. **Stylesheet layout**: the six old sheets are now `shell/bar/bar.css`, `shell/parts/{controls,parts,phone,embedded}.css` and `shell/parts/timeline/timeline.css` (moved whole). The note's one-folder-per-part split (`parts/card`, `parts/story`, `parts/moons` …) is not done: `parts.css`, `phone.css` and `embedded.css` each cover several parts. Note section 9's tree should show `parts/` as it is, or the split be planned.
2. **Layers**: `--astraeus-layer-sheet` is gone. The note's seven layers plus `-panel` (4) and `-bar` (5) remain, both read by `areas.css` (right place 4, left place 5); T-330 note 1's "collapse the three layers" is done for the unused one only.
3. **`--astraeus-blur`** is now the one blur value of panels, sheets and the timeline (12 px); the bar blurs 8 px with `--astraeus-space-4` (a second blur value the note does not list).
4. **Phone height limits**: `--timeline-drawer-max`, `--controls-drawer-max` and `--sheet-max` are `cqh` of the `astraeus-viewer` container (owner: "Follow the viewer (Recommended)"); T-330 note 6, T-329 note 9 and T-331 note 2 are closed by this. Design "Host-page behaviour" should say the limits follow the viewer's height.
5. **Leftover check**: `tests/interfaceLeftovers.test.ts` joins the drift check in note section 9: no class selector without a renderer, no unread look token, no sheet the one stylesheet does not load, no stylesheet import outside the entry files; run-time class families (`metric-*`, `tone-*`) and class carriers (`createLabelElement(`, `GHOST_CLASS`) are listed in the test. Worth a line in the contributor guide ("add a class in the component before its rule").
6. **One place loads the styles** (owner: "Load styles from one place (Recommended)"): `app/style.css` (published as `astraeus/style.css`) `@import`s every interface sheet in cascade order and is the only stylesheet a source file imports (the two entry files). No component imports CSS; the build writes `.node.js` copies of `index`, `mount` and `AstraeusScene` only. The contributor guide should say: a new sheet is added as an `@import` line in `app/style.css`, never as an import in a component (`interfaceLeftovers.test.ts` fails otherwise). Design "Good guest" and the README can state that `astraeus/style.css` is the whole look. The empty guard rule after the imports exists for happy-dom.
7. **API page**: an interface that extends another listed interface is drawn as a link to its base plus its own members (`api-reference.mjs`, `ownMembers`).
8. Non-architectural: 16 dead Developer-panel classes removed from `app/style.css`; `journeyProgressMetric` and `MissionConfig` removed (reconciliation-history line 148 can drop them).

Coordinator: accepted the CSS `@import` route (standard CSS, resolved by bundlers and by browsers for a plain stylesheet link, relative to the published file; the Full Check's packed-example and React-consumer runs exercise it) and the commented empty guard rule. Coordinator marked done (owner: "orchestrate 79"); all gates green, engine unpacked 9,473,196 B, API page 42,577 B gzip.
