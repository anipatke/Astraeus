---
id: T-437
objective: O-090
title: Package guide and API page that agree
status: done
depends_on: [{task: T-436, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-437, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, packages/astraeus/README.md, packages/astraeus/package.json, packages/astraeus-site/tools/site/api-reference.mjs, tools/api-rules.mjs, packages/astraeus-site/tests/apiRules.test.ts, packages/astraeus/src/api/index.ts]
planned_writes: [packages/astraeus/README.md, packages/astraeus-site/tools/site/api-reference.mjs]
---

# Package guide and API page that agree

## Outcome

Owner plan step 3, engine README and generated API reference. The engine README keeps install, the first scene, React and headless use, lifecycle and errors, optional data packages and links; "Bodies and paths" and "Looks, controls and views" are reviewed first; unique guidance moves to the API doc comments or a linked guide before anything is cut; the module tour ("Working on the engine in the repository" onward) becomes one contributor link that works from npm (absolute GitHub URL). The generated API reference drops the hard-coded "0.2 preview" lead and reads the version from the engine's package.json at generation; symbol and error coverage stay. The README error table and API tables that `apiRules.test.ts` checks stay valid.

## User Check

A package user builds a first scene from the packed README and finds an advanced option through one link.

## Done When

| Item | Evidence |
|---|---|
| API page lead has no hard-coded version; the version comes from the manifest; a new test case proves the lead names the manifest version and contains no "preview" | vitest |
| `apiRules.test.ts` green (error table, API-07 tables) | vitest |
| Every engine-README cut has a home or a recorded reason | table |
| Links in the engine README work from npm (no repo-relative links outside the package) | command |
| Packed README inspected (`npm pack --dry-run -w astraeus` lists it); quick-start code matches current exports (snippet typechecked or the covering example test cited) | evidence |
| Before/after word count | wc -w |

## Context Files

T-434 Technical Evidence; `docs/README.md`; `packages/astraeus/README.md` (whole: this Task rewrites it); `packages/astraeus/package.json`; `packages/astraeus-site/tools/site/api-reference.mjs` around the `lead:` line and its callers; `tools/api-rules.mjs` (README sections); `packages/astraeus-site/tests/apiRules.test.ts`; the site test covering api-reference.mjs (find by grep, log it).

## Design References

Design `Decisions` → `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap). API-07.

## Implementation Plan

1. Fix the API lead: read the version from packages/astraeus/package.json; add a test case.
2. Review the two named README sections; move unique guidance; then trim reference-style sections that repeat the generated API page, linking to it.
3. Replace the module tour with one absolute contributor link.
4. Run `npm run api:errors` and confirm the generated table is unchanged; run the tests.

## Boundaries

No public API change; doc comments change only to receive moved guidance. Existing test setup unchanged. Data packages' READMEs untouched unless the T-434 list names them.

## Technical Verification

typecheck; eslint and prettier on changed files; `npx vitest run packages/astraeus-site/tests/apiRules.test.ts` plus the api-reference test file; `npm run api:errors` leaves no diff.

## Technical Evidence

### Reads

Context Files: T-434 Technical Evidence (Tables C and M); `docs/README.md`; `packages/astraeus/README.md` (whole); `packages/astraeus/package.json`; `api-reference.mjs` (lead and callers: `buildApiPage`, `buildApiPages`, `vite.config.ts` via grep); `tools/api-rules.mjs` 370-425 (`readmeApiBreaks`); `apiRules.test.ts` 370-411; the site test covering api-reference.mjs, found by grep: `packages/astraeus-site/tests/apiReference.test.ts`.

Extra reads (logged; each to check whether README guidance already lives in a doc comment before cutting it, or to find a home): `packages/astraeus/src/api/scene.ts` (AddBodyOptions, TrajectoryBase/TrajectoryInput, addBody/addTrajectory/addPlaces docs, getter docs), `look.ts` (InterfaceLook), `story.ts` (PacingInput, StoryPanelPlaybackInput), `aboutInput.ts`, `viewerHandle.ts` 1-95, `viewerLink.ts` (EventZoneChange, grep), `planCamera.ts` 214-252, `mount.ts` 18-20, 78-90, `time.ts` header, `providerPathTimes.ts` 1-12, `api-reference.d.mts`; `packages/astraeus/tests/pictureList.test.ts` (M3); `docs/architecture/viewer-interface.md` headings and section 9; `.savepoint/Design.md` `Components/Codebase Map` (rows `packages/astraeus/`, `packages/astraeus-data/`, grep); `docs/agents/build.md` (grep `engine-alone`); `packages/astraeus-site/tools/validate/load-budget.mjs` line 138 (api page limit); `tools/build-packages.mjs` (grep dist/argv). A token-coverage script (scratchpad, not committed) listed every backticked name and number in each README section absent from the engine's doc comments, to find unique guidance.

### Done When -> evidence

| Item | Evidence | Result |
|---|---|---|
| API lead has no hard-coded version; version from the manifest; a test proves it names the manifest version and contains no "preview" | `api-reference.mjs`: `ENGINE_MANIFEST`, `engineVersion()`, `renderApiPage(items, version = engineVersion())`, lead "This is version ${version}; before 1.0 ..."; new case `apiReference.test.ts` "names the engine version from its manifest in the lead, with no hard-coded preview label (O-090 T-437)" reads `packages/astraeus/package.json` and also renders with `"7.8.9"`. Red first: with HEAD's `api-reference.mjs` the case fails (1 failed, 6 passed); with the change 7/7 pass | Met |
| `apiRules.test.ts` green (error table, API-07 tables) | `npx vitest run packages/astraeus-site/tests/apiRules.test.ts ...` pass; `mount(` row, `<AstraeusScene scene` row and `\| \`handle.ready\` \|` row kept verbatim (the negative test's replace strings still match); every `handle.x` in a first cell is a MountedScene member | Met |
| Every engine-README cut has a home or a recorded reason | Cut table below (23 rows) | Met |
| Links work from npm (no repo-relative links outside the package) | `grep -o '](...)' README.md`: 37 absolute `https://` links plus 2 `./CHANGELOG.md` (packed: `files` and dist); the 27 distinct API anchors (`/api/#name`) all exist in the generated page (node check: missing `[]`); repo paths (`examples/*`, contributor guide) are absolute GitHub URLs | Met |
| Packed README inspected; quick-start matches current exports | `node tools/build-packages.mjs astraeus` then `npm pack --dry-run` in `packages/astraeus/dist`: lists `README.md` 39.3kB, `CHANGELOG.md`, 675 files, astraeus 0.9.5; `cmp dist/README.md README.md` identical. The four import-bearing js/jsx blocks (first scene, probe, React, data package) were typechecked as .ts/.tsx against the workspace `astraeus` with the root tsconfig in a temporary folder (removed after): 0 errors. (`npm pack --dry-run -w astraeus` on the source workspace fails with npm `ERR_OUT_OF_RANGE data is too long`: the source package has no top-level `files`; the published pack is `dist/`.) | Met (pack via dist) |
| Before/after word count | `wc -w`: 18,907 before (HEAD copy) -> 5,898 after | Met |

### Cut table (engine README)

| Cut (old section) | New home or reason |
|---|---|
| Install, first scene, React, Page address, Errors, Loading, data packages, Internal, Licence | Kept. Repo paths (`examples/hello-scene`, `hello-planets`, `hello-react`) became absolute GitHub links |
| Probe: `lineFixedTo` list form; dev-site `?experience=synthetic-probe` / `synthetic-journey` pointers | List form: `TrajectoryBase.lineFixedTo` doc (already). Dev-site pointers dropped: repo-only site, dead from npm |
| Your own controls: look ranges, `ScaleId` values, Milky Way slider note | `LookInput`, `ScaleId` docs (already); slider note dropped (example's own detail) |
| `addBody` row | `AddBodyOptions` (already) + moved into `addBody` doc: listed moons by id, giant-planet rings (NSSDC); into `AddBodyOptions.orbit`: Sun-orbit rule (own positions, osculating ellipse for Uranus/Neptune). M3 sentences kept verbatim in the README row |
| `addTrajectory` row | `TrajectoryBase` fields (already) + moved into `TrajectoryInput` doc: provider `stateAt` contract and `State` shape, 128-moment line refinement (4,096 max), bend seen against another body; into `plane`: obliquity 84381.406 vs Horizons 84381.448, ~30 km at 1 au; into `anchors`: labels follow the `labels` switch. Time rules: `TimeInput`/`toUtcMs` docs (already) |
| `addBodyFromElements`, `addBodySet`, `addGroup` rows | `ElementsBodyRecord`/method doc, `BodySetInput`, `GroupInput` docs (already; token check found only field names) |
| `addPlaces` row | `PlacesInput` (already) + moved into `addPlaces` doc: the 24 place lists in `astraeus-data/bodies/<body>/` |
| Time, events and story rows | `TimelineInput`, `EventInput`, `StoryPanelInput`, `ActivityInput` (already); moved into `StoryPanelPlaybackInput.closeAfterSeconds`: the close rule (armed before its moment, never on the opening tick, seek/rewind/pause never close). The `setTimeline` milliseconds warning: runtime `console.warn` names the fix itself |
| `addSkyFigures` row | `addSkyFigures` doc, `SkyFigureInput` (already) |
| Camera rows | `SceneCamera` docs (already; `fitOrbit` "10 percent to spare" = old 1.1) + moved into `setReach`: Sun-centred scene widens to fit a path about the Sun |
| Looks, controls and views rows | `MoonPanelInput`, `PickerInput`, `SwitchesInput`, `ViewInput`, `BodyReadoutKind`, shelf page (already); moved into `AboutInput`: title opens the panel, "Built with Astraeus" + version, phone title place; into `InterfaceLook`: the `--astraeus-*` custom properties a custom block inherits |
| Numbers without a viewer, What a scene holds (14 read rows) | Short README table kept; detail in `Scene.stateOf/load/check/provenanceOf` docs and `Scene*Read` types |
| Handle tables (clock, looks/picker/scale/switches, sky traces, panels/selection/views, camera) | `ViewerHandle` member docs and `viewerLink.ts` types (already); README keeps one compact table, the order rule, the not-mounted/listener rules and the prototype note |
| `setGroupLook` timing "25 calls on 126,000 dots under 0.3 ms" and its example | Dropped: undated measurement (docs/README.md: a quoted time names its run); the call is in `ViewerHandle.setGroupLook` |
| Paced playback table and rules | `PacingInput` (already) + moved: log-space ease, no frame skips a zone, views rule, Auto choice, unmatched `type` refused; README keeps the example |
| Selection, camera-change, event-zone paragraphs | `ViewerHandle.setSelected/onSelect/onCameraChange/onEventZone`, `EventZoneChange.via` (already) + moved into `onEventZone`: one zone per event, its widest rule, reported once; README keeps both composition examples |
| "Inside someone else's page" isolation sentence | Kept, corrected: `unmount` restores the element's inline isolation, position and overflow (`mount.ts:86-88`); the old text said it did not |
| Story-panel note paragraph (old line 381) | `StoryPanelInput`, `StoryPanelPlaybackInput.pauseSeconds`, `SceneCamera.setReach` docs (already) |
| Page address: "the demo site does", site switchers paragraph | Dropped: site behaviour, not the package; look-out `view` format (old camera row) added to the table |
| Errors lead sentence listing four codes | Dropped: repeats the generated table |
| "First download: 1,716,429 bytes ... at this commit" | Dropped: undated measurement; `npm run measure:example` is repo-only |
| `astraeus-data` "about 39 MB" (C28) | Corrected to about 35.5 MB packed (Design map); 39 MB is the limit in `tools/check-packs.mjs` |
| Working on the engine, What it holds (C26), Interface modules, How a demo plugs in, Check it alone (C27) | One absolute link to `docs/architecture/viewer-interface.md` section 9 (module layout, look/areas/bar/panels rules, add a bar item or panel, lookDrift). Folders incl. `src/api/`, `src/shelf/`, `tests/synthetic/`, `x-publish` and exports-only imports: Design `Components/Codebase Map` row `packages/astraeus/`. Engine-alone check: `docs/agents/build.md`. Release: `docs/RELEASING.md` |

Also fixed: the handle example used an undefined `time` (`new Date(time)`); now `timeUtcMs`.

### Commands

- `npx vitest run packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/apiReference.test.ts packages/astraeus/tests/pictureList.test.ts` -> 3 files, 29 tests passed.
- `npm run api:errors` -> rewrote the table; the block between the markers is byte-identical to HEAD (diff empty).
- `npm run typecheck` -> exit 0.
- eslint (`use-typescript6.cjs`) on the nine changed .ts/.mjs/.d.mts files -> exit 0; `npx prettier --check` on the same -> all formatted (Markdown is prettier-ignored).
- API page size: HEAD docs 202,449 B raw / 44,250 B gzip; after the moves 205,122 / 45,186, within `load-budget.mjs` api/index.html 230,000 / 46,000 (`apiReference.test.ts` I-142 case passes). A first, wordier version of the moved docs reached 46,578 gzip and failed that case; the moves were tightened rather than asking for a raise.
- `node tools/build-packages.mjs astraeus`; `npm pack --dry-run` in `packages/astraeus/dist` (above). `savepoint resume` loads.

### Files changed

`packages/astraeus/README.md`; `packages/astraeus-site/tools/site/api-reference.mjs`; outside `planned_writes`: `packages/astraeus-site/tools/site/api-reference.d.mts` (types for the new exports and parameter), `packages/astraeus-site/tests/apiReference.test.ts` (the new case the Done When asks for), and doc comments only (Boundaries: "doc comments change only to receive moved guidance") in `packages/astraeus/src/api/scene.ts`, `look.ts`, `story.ts`, `aboutInput.ts`, `viewerHandle.ts`, `planCamera.ts`. No public signature changed (`api-surface.lock.json` stores no doc text).

### Limitations

- Uniqueness was checked by a token script plus reading the doc comments of each cut call, not sentence by sentence against all 18.9k words; a nuance only the old README stated may remain uncovered (old text is in git at HEAD `a2584e0f`). Moved guidance was shortened to fit the API page's gzip limit, so it is terser than the README wording.
- The `--astraeus-*` property list in `InterfaceLook` is written as suffixes (`panel`, `text-size`, ...) to save page bytes.
- `npm pack --dry-run -w astraeus` (the literal Done When command) cannot run on the source workspace (npm ERR_OUT_OF_RANGE); evidence is from the built `dist/`, which is what `check:pack` and publish use.
- Full `npm test`, lint across the repo and browser checks not run (builder rule 7).

## Drift Notes

- None architectural. The API reference lead now reads the engine version from `packages/astraeus/package.json` at generation (`engineVersion`, `ENGINE_MANIFEST` in `api-reference.mjs`); Design `Components/Codebase Map` already names the generator, no change needed.
- `docs/README.md` rows that name engine README sections ("What `astraeus-data` adds", "Errors", "Install", the API tables) still match: those sections and headings are kept.

## Coordinator (gates)

2026-11-22, coordinator (orchestrate-g024-20261122): Full gate after this code-touching Task: `npm run lint` exit 0, `npm run build` exit 0, `npm test` 337 files / 5487 passed, 2 skipped. Extra files beyond planned_writes accepted: api-reference.d.mts and apiReference.test.ts (the Done When's new case) and doc-comment-only edits in six packages/astraeus/src/api files (moved guidance, Boundaries clause; no signature change). API page 45,186 B gzip under its 46,000 limit. Marked done under the standing rule (owner, O-038: "I mark them as they pass") and the owner's "carry on orchestrating G-024".
