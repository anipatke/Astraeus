# O-059 public forms

Every engine internal the planets demo and the site use, and where each one goes. T-266 to T-272 build from this note. Owner Decisions in the Objective are settled and not reopened here.

Destinations, in plain words:

- **Public, new**: a new public feature, named here.
- **Public, already**: the public API can already do it; the demo or site just switches to it.
- **Moved**: the code goes into the demo or the site. Data moves are in section 4.
- **Engine test**: the test goes to `packages/astraeus/tests/` and must pass `check:engine-alone`.
- **Deleted**: nothing needs it once the rest lands.

## 1. What was measured

Counted with the same rule as `deepImportCounts` in `packageBoundaries.test.ts` (2026-11-06, branch `o059-front-door`):

| Package | src | tests | tools | Total | `DEEP_IMPORT_COUNTS` |
|---|---|---|---|---|---|
| `astraeus-demo-planets` | 65 | 58 | 0 | 123 | 123 |
| `astraeus-site` | 17 | 75 | 0 | 92 | 92 |

The totals match the recorded counts. The task brief's rough split (56 and 15) was slightly low. Appendix A maps all 215 to a row.

Other facts checked:

- `alternates` and `developerSections`: **no definition in any package sets them.** The readers are `App.tsx` and `DeveloperSettings.tsx`; `tests/developerSettingsDom.test.ts` passes `alternates` as a prop; Showers and Apollo tests only assert they are undefined. `before.developerSections` in Apollo's `rebuildComparison.test.ts` comes from a fixture JSON of the old hand-written definition, not from a set field.
- Places data (`packages/astraeus/data/bodies/`) **does not ship** in the published engine. `dist/data` holds `ephemerides`, `moons`, `orbits` and `rings` only, because `tsc` copies only the JSON that source imports, and no source imports `data/bodies`. The only readers are the demo, the importer and tests.
- Moon lists (`data/moons/`) do ship, but nothing public reaches them: only `assets/*MoonCatalogue` and `core/bodies/{jupiterData,outerPlanetData}` read them, and only the demo and tests read those.
- Scene centre: every definition's `sceneCenter` equals its first body, except `synthetic-bare`, which has no bodies.

## 2. The four new features

All types are declared in `src/api/` (the `apiOutsideTypes` allowlist cannot grow) and no public type exposes `BodySetLayer`, `BalancePoint`, `MoonFamilyList` or `BodyFeatureSet`. New error codes, each with a doc comment: `bad-body-set`, `bad-moon-panel`, `bad-places`, `bad-picker`.

### 2.1 Moon dots: `Scene.addBodySet` (T-267)

General: many small bodies about one centre, each selectable, drawn as one batch. The word "moon" stays out of the call because nothing about it needs a moon.

```ts
scene.addBodySet(input: BodySetInput): this   // a repeated id throws duplicate-id
readonly scene.bodySets: readonly SceneBodySetRead[]

interface BodySetInput {
  /** The set's id; not shared with any body, path or group. */
  readonly id: string;
  /** The body the members circle; the scene's centre (its first body) when absent. Must be in the scene. */
  readonly center?: BodyRef | BodyId;
  /** 1 to 16 families, in order. */
  readonly families: readonly BodySetFamilyInput[];
  readonly members: readonly BodySetMemberInput[];
  /** Bodies added with addBody that belong to a family: their orbit lines take its colour, and one with no `orbit` of its own gets its line in this batch. */
  readonly bodies?: readonly BodySetBodyInput[];
  /** Where the positions come from, shown for the set. */
  readonly provenance: Provenance;
  /** Gravity of the centre, sizing each orbit line to one lap. Default: the centre's moon system, else its catalogue record; neither is bad-body-set. */
  readonly centerGmKm3S2?: number;
  /** A member or body the centre circles with: orbit lines are drawn about the balance point. Default: the centre's moon system's own, else none. */
  readonly balancePoint?: BodySetBalanceInput;
  /** How far before the window's start to load positions, so an orbit line can reach back. Default 0. Passed to the moon loader as `history.maxMs` for every moon of the centre the scene holds. */
  readonly orbitHistoryMs?: number;
}
interface BodySetFamilyInput {
  readonly id: string;
  readonly label: string;
  /** Orbit colour as a CSS hex colour; default: the palette in family order (DEFAULT_FAMILY_PALETTE). */
  readonly color?: string;
  /** Orbit brightness multiplier; default 1 (the Developer drawer's family gain). */
  readonly brightness?: number;
}
interface BodySetMemberInput {
  readonly id: string;
  readonly family: string;
  /** Required with `elements`; a listed moon defaults to its own. */
  readonly label?: string;
  readonly radiusKm?: number;
  /** Absent: `id` must be a listed moon of the centre and positions come through `data`. Present: a made-up member on two-body motion. All members of a set are one kind or the other; a mix is bad-body-set. */
  readonly elements?: BodySetElementsInput;
  /** Info card, same meaning as on addBody. */
  readonly description?: string;
  readonly facts?: readonly CardFactInput[];
  /** Default: the set's. */
  readonly provenance?: Provenance;
  readonly knownLimitations?: readonly string[];
  /** Whether the Object menu offers it; default false, so a long list does not bury the menu. */
  readonly listed?: boolean;
}
interface BodySetElementsInput {
  readonly semiMajorAxisKm: number;
  readonly eccentricity: number;
  readonly inclinationDeg: number;
  readonly raanDeg: number;
  readonly argumentOfPeriapsisDeg: number;
  readonly trueAnomalyDeg: number;
  /** The moment the elements hold; the scene's opening time when absent. */
  readonly time?: TimeInput;
  /** Default "EQJ". */
  readonly plane?: "ecliptic-j2000" | "EQJ";
}
interface BodySetBodyInput { readonly id: BodyRef | BodyId; readonly family: string }
interface BodySetBalanceInput { readonly body: BodyRef | BodyId; readonly gmKm3S2: number }
interface SceneBodySetRead { readonly id: string; readonly center: BodyId; readonly count: number; readonly families: readonly string[] }
```

Builds, in a new `api/planBodySets.ts`, exactly the `BodySetLayer` of today's `planetMoonLayer`:

- `members`, `families`, `bodyFamilies` (all of `bodies`), `extraOrbits` (those of `bodies` without an `orbit` option), `centreGmKm3S2`, `balancePoint`.
- Listed members use `createEphemerisGroup` over the centre's moon system. Group ids stay `<id>` and `<id>-orbits` (today `<settings.id>-small-moons` and `-mapped-moon-orbits`; the demo passes `<planet>-small-moons`). The extra-orbit group's provenance keeps today's words ("As each moon's own record.") as a planner constant.
- Elements members use a new `core/` group with the `EphemerisGroup` shape, on the two-body adapter, the way `createOrbitGroup` serves a centre that is not the Sun.
- Each member becomes an `ExperienceObject` placed after the bodies and paths, with `listed: false` by default. Members get no camera preset (`focusPresetFor` supplies Focus, as today).
- `installData` must add members to the bodies it loads. A dot is not in `plan.catalogue`, so read its parent through `listedMoon(id)`, and pass `history`. `checkData` and `missingData` count members; `Scene.check` and `Scene.load` work.
- `stateOf` and `provenanceOf` accept member ids.
- Story panels may name members (`story.panels` ids include them). `setViews` cannot name a set or a member, so a set is in every view; a view naming one throws `bad-view`.

### 2.2 Moon family panel: `Scene.setMoonPanel` (T-268)

```ts
scene.setMoonPanel(input: MoonPanelInput): this   // replaces the whole panel
readonly scene.moonPanel: SceneMoonPanelRead | undefined

interface MoonPanelInput {
  /** The name in the panel's heading ("<label>'s moons"). */
  readonly label: string;
  readonly families: readonly MoonPanelFamilyInput[];
  /** A family id listed first, with pictures; the others fold. */
  readonly featuredFamily?: string;
  /** Where the list comes from, such as "JPL Horizons". */
  readonly listSource?: string;
  /** When the list was taken. */
  readonly listDate?: TimeInput;
}
interface MoonPanelFamilyInput {
  readonly id: string;
  readonly label: string;
  /** One plain line. */
  readonly description: string;
  readonly moons: readonly MoonPanelMoonInput[];
}
interface MoonPanelMoonInput {
  /** A body or body-set member of the scene; checked when the scene is built. Its label comes from there. */
  readonly id: string;
  /** False for a provisional designation, folded under "+N unnamed". Default true. */
  readonly named?: boolean;
}
interface SceneMoonPanelRead { readonly count: number; /** "115 moons in the JPL Horizons list of 18 October 2026". */ readonly summary: string }
```

- `listDate` is typed `TimeInput` because the lint's `TIME_LIKE` catches `...Date`. The planner stores it as `YYYY-MM-DD`, which `moonListDateText` already reads.
- **Pictures** come from the viewer's data, with no URL in the input: in `assembleScene`, a moon that is a body in the scene gets `pictures[visual.picture ?? id]?.url`. A dot gets none. This is today's `mappedIds.has(moon.id)` rule.
- `scene.moonPanel.summary` is how the demo gets the "Known moons" fact without copying `moonListSummary`: call `setMoonPanel` first, then `addBody(centre, { facts })`.

### 2.3 Tagged surface places: `Scene.addPlaces` (T-268)

```ts
scene.addPlaces(body: BodyRef | BodyId, input: PlacesInput): this   // a second call for one body throws duplicate-id
readonly scene.places: readonly ScenePlacesRead[]

interface PlacesInput {
  readonly categories: readonly PlaceCategoryInput[];
  readonly places: readonly PlaceInput[];
  /** Shown with every place's information (PROV-01). */
  readonly provenance: Provenance;
  readonly knownLimitations?: readonly string[];
}
interface PlaceCategoryInput { readonly key: string; readonly label: string; readonly color: string }
interface PlaceInput {
  /** Unique within the body. */
  readonly id: string;
  readonly name: string;
  /** Shown as the place's kind, such as "Crater". */
  readonly kind: string;
  /** One of `categories`; an unknown one draws white, as today. */
  readonly category: string;
  readonly latitudeDeg: number;
  /** East-positive as the marker draws it; a caller with west longitudes converts first. */
  readonly longitudeDeg: number;
  readonly description: string;
  readonly details?: readonly CardFactInput[];
}
interface ScenePlacesRead { readonly body: BodyId; readonly count: number }
```

Maps to `BodyFeatureSet` (`bodyLabel` is the body's label, `featureType` is `kind`). The body must be in the scene. Coordinates are stored as given, never rounded. The surface-place rule and west-longitude conversion (`surfacePlace.mjs`) stay in the demo: they are the data's quirks, and an app with clean data needs neither.

### 2.4 The picker: `Scene.setPicker` and `onPick` (T-269)

Signals, not behaviour: pressing an option only reports it. The viewer never navigates, reads or writes the address, or keeps a time.

```ts
scene.setPicker(input: PickerInput): this     // replaces the whole picker
readonly scene.picker: PickerInput | undefined

interface PickerInput {
  /** Names the choice; drawn as `data-switch-param`, so `driver.mjs` keeps working. No meaning to the viewer. */
  readonly id: string;
  /** The accessible name of the group. */
  readonly label: string;
  /** Fewer than two: no control is drawn. */
  readonly options: readonly PickerOptionInput[];
  /** The option pressed when the viewer opens. */
  readonly value: string;
}
interface PickerOptionInput { readonly value: string; readonly label: string }

// ViewerHandle, so the same on mount and AstraeusScene (API-02):
readonly pick: string | undefined;            // the pressed option; undefined until ready, after unmount, and with no picker
setPick(value: string): void;                 // moves the pressed option, no other effect, no signal; unknown value throws bad-picker
onPick(listener: (change: PickChange) => void): () => void;
interface PickChange { readonly picker: string; readonly value: string }

// AstraeusSceneProps:
readonly onPick?: (change: PickChange) => void;
```

- `onPick` fires when a visitor presses an option other than the pressed one. Pressing the pressed one does nothing, as today.
- The pressed option does **not** move by itself: the host calls `setPick`, or mounts a new scene as the site does. That is what "the host decides" means.
- Drawn by the existing `SwitchControl`, in the same two places, so the look stays.
- `switchAddress`, `openAddress`, `keep`, `currentTimeUtcMs` and `open` leave the engine in T-272, once the site is on `onPick` (section 11). Then remove `shell/SwitchControl.tsx` from `addressRule.test.ts`'s `ALLOWED`.
- Keeping the clock across a choice: the site reads `handle.time` inside `onPick`, builds the address with its ported `switchAddress`, and pushes it.

## 3. Small settings (T-266 unless named)

| New name | On | Default | Why it exists |
|---|---|---|---|
| `listed?: boolean` | `AddBodyOptions` | true | Items left out of the menu; shown when selected, as today |
| `facts?: readonly CardFactInput[]` | `AddBodyOptions` | none | Info card facts. `CardFactInput = { label: string; value: string }` |
| `sources?: readonly string[]` | `AddBodyOptions` | none | Added after the body's own provenance sources (`withCatalogueSources`) |
| `labelPriority?: number` | `AddBodyOptions` | `100 - index` | The demo's settings files give their own; the name is on the lint's unitless list |
| `orbit?: boolean \| { lapDays: number; fades?: boolean }` | `AddBodyOptions` | as today | Mars's lines (section 8). `fades` is the line's end fade; absent means the moon's own rule. The object form works on any moon, with or without a period on record |
| `setBodyReadouts(kinds: readonly BodyReadoutKind[])` | `Scene` | `["distance"]` | Planets show more rows. `BodyReadoutKind = "distance" \| "phase" \| "coordinates"`; passed to `bodyMetrics` |
| `setReach(distance, { farEarthRadii }?)` | `SceneCamera` | `distance * 2.5` | The planets' far plane is 4 to 10 times their reach |
| `setStartView(pose: CameraPose)` | `SceneCamera` | none | Opens at a pose with no camera button pressed. `lookAt` presses Focus, and that changes how selection moves the camera. Last of `follow`, `lookAt`, `setStartView` wins |
| `setFollowChoices(ids: readonly (BodyRef \| BodyId)[])` | `SceneCamera` | every body, path and group | Which objects offer Follow; the planets offer one or none today. `cameraPresetsOf` drops the other `follow-*` presets |
| `desktopPictures?: boolean` | `LookInput`, `LookRead` | false | Desktop pictures. Read when the viewer is built; a later `setLook` does not swap textures (say so in its doc comment) |
| `bodySet?: BodySetLookInput` | `LookInput`, `LookRead` | `DEFAULT_BODY_SET_LOOK` | T-267. API-06: the dot looks are Developer-drawer-only today. Live through `handle.setLook` |
| `texture?: TextureRef` | `SceneBodyRead` | absent | A body's own picture and licence, for credits; replaces the site tests' `catalogue` reads |
| `facts`, `listed` | `SceneBodyRead` | | So tests read what `addBody` set, not `toDefinition` |
| `onFirstDraw(listener): () => void` | `ViewerHandle` | | Built here, used by T-272 for the cover. Calls once when a scene's first frame is drawn. `ready` is not this: it resolves when the clock attaches. React: `onFirstDraw` prop, called again after a rebuild |

```ts
interface BodySetLookInput {
  readonly dotColor?: string;
  readonly dotSizePx?: number;
  readonly highlight?: { readonly color?: string; readonly brightness?: number };
  readonly names?: { readonly nearPx?: number; readonly count?: number };
  readonly orbits?: { readonly on?: boolean; readonly opacity?: number; readonly zoom?: { readonly opacity?: number; readonly scale?: number } };
}
```

These map to `dotColor`, `dotPx`, `highlightColor`, `highlightOrbitGain`, `labelNearPx`, `labelNearMax`, `orbitsOn`, `orbitOpacity`, `orbitZoomBoost`, `orbitZoomFarRatio`. Nested so each number's name is on the existing `unitless` list; that list is counted by `allowlistGrowth` and may not grow without the owner.

**Not new, on purpose:**

- **Scene centre** is already public: the first body added. No `sceneCenter` setting is added; the Objective's "public and general" is met as it stands. README should say so where `addBody` is described.
- **Page heading** is the host's. `mount` already leaves the title alone (`writeTitle: false`), so the site writes `document.title` itself.

## 4. Where the data lives

### Places: `packages/astraeus-data/data/bodies/` (T-268)

Move the whole folder from `packages/astraeus/data/bodies/`. This is a move, not a copy.

Reasons:

- Owner, 2026-10-18: the body packages are core reference data any experience can use, unlike a story's data. That rules out the planets demo: it is private, so no outside app could have them, and the engine's own tests (`bodyPackages`, `featureMarkers`) would then depend on a demo, which breaks `check:engine-alone`.
- API-01 rules out leaving them behind a private `astraeus/data/*` path. `packageBoundaries` already calls the data packages engine-side data, so moving there keeps them on the core side of the owner's line.
- `astraeus-data` rather than the per-planet packages, because Earth, Mercury and Venus have no per-planet package.
- A public `placesOf(body)` read from the engine was rejected: it would pull every body's places into the engine bundle or need per-body dynamic chunks, and would break the Jupiter-only public build.

How the demo reaches it, with Jupiter-only unchanged: each system module keeps its literal glob, retargeted to `../../../../../astraeus-data/data/bodies/{io,...}/{features,categories,map}.json`, and the static imports in `earth`, `mars`, `mercury` and `venus` become `astraeus-data/bodies/<body>/features.json`. Since `planetSystems.ts` still globs only `./systems/jupiter.ts` in a public build, no other body's places enter the bundle.

Package changes:

- Source `exports`: `"./bodies/*": "./data/bodies/*"` and `"./data/*": "./data/*"`. The second is what the DATA-OF-DATA-PACKAGE glob rule looks for.
- `x-publish.exports`: `"./bodies/*": "./data/bodies/*"`. Add `data` to `x-publish.files`.
- `check-packs.mjs`: allow `data/bodies/.+\.(json|md)` for this package.
- Rerun `npm run api:lock`, since the lock records every published `exports` map.
- Update NOTICE and `packageCredits` for the first publication of this data (section 10, O1).
- Retarget: `tools/import/planetary-explorer.mjs`, `tests/bodyPackages.test.ts`, `tests/featureMarkers.test.ts`, `astraeus-site/tools/site/assets-sections.mjs`, `astraeus-site/tests/assetsSections.test.ts`, and the `packagesOf` path in `planetSystemParts.ts`. `check:engine-alone` copies data packages, so the engine tests still resolve.

### Moon lists and fit errors: the per-planet data packages (T-270)

`packages/astraeus/data/moons/<planet>.json` becomes `packages/astraeus-data-<planet>/data/<planet>-moons/list.json`, and `data/moons/fit-errors/<planet>.json` becomes `.../fit-errors.json`. Jupiter has no fit-errors file and its demo keeps none.

Reasons: same as places (core data, not engine code, not private), and the moon list belongs beside the positions it describes. All six planets with a list already have a package. A static import in a per-planet system file also keeps each list in that planet's chunk.

Package changes: exports `"./moon-list.json"` and `"./moon-fit-errors.json"` in both maps; extend the `position` pattern in `check-packs.mjs`; update `tools/import/{moon-lookup,moon-fit-errors,jupiter-moon-catalogue,planet-moon-catalogues}.mjs`, `vitest.setup.ts`, `astraeus-site/tools/site/assets-sections.mjs` and the tests that read them. Then delete `assets/moonCatalogue.ts`, `assets/bodies/jupiterMoonCatalogue.ts`, and the list parts of `core/bodies/{jupiterData,outerPlanetData}.ts` and `assets/bodies/outerPlanetCatalogues.ts` (it also re-exports rings, which stay) once nothing reads them.

`core/bodies/listedMoons.ts` stays: it is the generated slim table `addBody` needs.

### How moon facts reach the demo

| Today | Tomorrow |
|---|---|
| `parseMoonCatalogue`, `moonFacts`, `moonSourceTitles`, `MoonCatalogue` types | Lifted as they are into a new demo file `planets/moonList.ts`, reading the moved JSON. Words unchanged |
| `fitErrorsM` | Imported from `astraeus-data-<planet>/moon-fit-errors.json` in the system file; `dotMoonProvenance` stays in the demo |
| `withCatalogueSources` on a dot | The demo builds the member's whole `provenance`, as today |
| `withCatalogueSources` on a mapped moon | `addBody(id, { sources: moonSourceTitles(...) })` |
| `moonListSummary` | `scene.moonPanel.summary` |
| `fitSource` (`moonFitSource(<label>)`) | New `moons.fitSource` in `data/planets/<planet>.json`, with today's exact text |
| `tidalLockNote` | Nothing: `addBody` without `knownLimitations` uses the catalogue's `orientationLimitations`, which is this note. Check per moon in T-270's comparison; where one differs, pass `knownLimitations` from settings |
| `centreGmKm3S2`, `balancePoint` | Nothing: `addBodySet` defaults |
| `ephemeris`, `load`, `provideIndex`, chunk URL maps | One `DataSource` per system: `{ name, provides, moonPositions: { centre, loadIndex, chunkUrls } }`. Globs stay in the system file; `journeyData.ts` is the pattern. `orbitHistoryMs` replaces `history` |
| `PICTURES` in the definition | `data: [dataSource from "astraeus-data", ...]` |

## 5. Every ability and its destination

Rows are referred to from Appendix A.

### Planets demo source

| Row | Ability | Destination |
|---|---|---|
| S1 | Building an `ExperienceDefinition` (types and `buildPlanetDefinition`, `jupiterIo.ts`) | **Deleted.** `buildPlanetScene(settings, system, panels): Scene` replaces it; `jupiterIoExplorer` becomes a built `Scene` for tests |
| S2 | Reading body records (`assets/catalogue`) for labels and picture keys | **Public, already**: `addBody` and `scene.bodies`. Pictures: section 2.2 |
| S3 | Compositions (`assets/compositions`): which bodies, in what order, whose loop | **Public, already**: `addBody` in order, first is centre. Each system lists `{ bodies, orbits }` |
| S4 | `catalogueItem` | **Public**: `addBody` options (description, knownLimitations, labelReach; new labelPriority, facts, sources) |
| S5 | `bodyMetrics` | **Public, new**: `setBodyReadouts(["distance", "phase", "coordinates"])` |
| S6 | `createEvents([])` | **Deleted**: no events |
| S7 | `parseStoryPanels` | **Public, already**: `addStoryPanels(panelsFile)` |
| S8 | `ExperienceConfig`, `ExperienceObject` types | **Deleted** |
| S9 | `createProvenance`, `Provenance` | **Public, already**: `Provenance` is a root type; the demo writes plain objects. The planners check them with the same rules (`bad-*`) |
| S10 | `TimeBounds` | **Moved**: a local `{ startUtcMs, endUtcMs }` type |
| S11 | Dots: `familiesWithPalette`, `BodySetLayer`, `createEphemerisGroup`, `BalancePoint`, `ChebyshevEphemeris` | **Public, new**: `addBodySet` |
| S12 | Moon systems and records (`core/bodies/*`) | **Public**: `DataSource.moonPositions`; section 4 |
| S13 | Moon lists (`assets/moonCatalogue`, `assets/bodies/*Catalogue`, `data/moons/*`) | **Moved**: data to the planet packages, parser to the demo |
| S14 | Fit errors (`data/moons/fit-errors/*`) | **Moved**: to the planet packages |
| S15 | Moon panel (`shell/moonFamilies`) | **Public, new**: `setMoonPanel`, `scene.moonPanel` |
| S16 | Places (`shell/bodyFeatures`) | **Public, new**: `addPlaces` |
| S17 | Places data (`data/bodies/*`) | **Moved**: to `astraeus-data` |
| S18 | `validateStartView`, `StartView` | **Moved**: the check to `planetSettings.ts`, the type is public `CameraPose`. **Public, new**: `camera.setStartView` |
| S19 | `settingsFields`, `Raw` | **Moved**: small local readers in `planetSettings.ts`, as `showerSettings.ts` has. Then delete `experiences/settingsFields.ts` if nothing else reads it |
| S20 | `chooseSwitch`, `SwitchEntry` (`app/listSwitch`) | **Moved** to the site in T-270: `chooseSwitch` into a new `src/listChoice.ts`, `planetChoice.ts` beside `showerSwitch.ts`, with `planetChoice.test.ts`. Only the site uses them. `showerSwitch.ts` imports `listChoice.ts` in the same step, so the site's count falls rather than rises |

### Site source

| Row | Ability | Destination |
|---|---|---|
| S21 | `App`, `ExperienceDefinition` in `main.tsx` | **Public, already**: `mount(app, scene, { data, address: true, developerTools: true })`. Unmount the old viewer before mounting the new. `App` stays internal |
| S22 | `needsPlanetSeries`, `loadPlanetSeries` | **Deleted**: `mount` does this |
| S23 | `createAddressNavigation` | **Moved** to `packages/astraeus-site/src/` with its test; the engine copy goes |
| S24 | `astraeus/app/style.css` | **Public, already**: `astraeus/style.css` |
| S25 | The nine made-up scenes | Section 6 |
| S26 | Page heading (`label`, `pageTitleOf`) | **Moved**: `document.title` in the site; each `*_LABEL` already sits with its demo |
| S27 | Loading cover (`claimCover`) | **Public, new**: `onFirstDraw`, with the site fading its own cover by `handle.look.loadFadeSeconds`. `hideBootLoader` moves into `bootCover.ts`; the engine keeps only the saved fade value. `App` loses `claimCover`. Keep I-074: a superseded mount must not hide a newer cover, which `claim()` already gives |
| S28 | In-page address changes (`onOpenAddress`, `switcher`) | **Public, new**: `setPicker`, `onPick`; **Moved**: `switchAddress` into the site |
| S29 | `window.astraeusHost` for the views check (`createViewsHost`, `ViewerLink`) | **Public, already**: the site assigns the mount handle |

### Fields of the internal definition not covered above

| Row | Ability | Destination |
|---|---|---|
| S30 | `alternates` | **Deleted**, with `UnderTheHoodSettings`'s Data group, its two tests, and the `.alternates` assertions in Showers tests |
| S31 | `developerSections`, `DeveloperSection` | **Deleted**, with `renderSection`, and the `after.developerSections` line in Apollo's `rebuildComparison.test.ts` |
| S32 | `sceneCenter` | **Public, already**: first body. Stays internal in the definition |
| S33 | `desktopTextures` | **Public, new**: `LookInput.desktopPictures` |
| S34 | Unlisted items (`listed`) | **Public, new**: `AddBodyOptions.listed`, member `listed` |
| S35 | Card facts (`facts`) | **Public, new**: `AddBodyOptions.facts`, member `facts` |

## 6. The nine made-up scenes

New home for their builders: `packages/astraeus-site/src/synthetic/`, each exporting a function returning a public `Scene`, and `DEFINITIONS` in `main.tsx` becomes a map of those. Keep the word `synthetic` in the paths, and point `checkNoSyntheticExperiences` at this folder instead of `astraeus/src/synthetic`.

`packages/astraeus/src/synthetic/` **stays** for this Objective: 28 engine test files and two Apollo tests import it, and Apollo's counts may only fall. It is no longer on any preview page. See section 10, O2.

| Scene | Decision | Public calls |
|---|---|---|
| `synthetic` | Rebuild | `addBody` earth, moon; `addTrajectory` with anchors; `addActivity` for the contact window with both provenance spans; `addEvents`; `addStoryPanels`; `setTimeline`. The window's own information shows its rate. The marker's card loses its contact-rate row, because a rate readout belongs to a group; the row stays proven by `experiencePlugIn`'s engine half on `src/synthetic` |
| `synthetic-bare` | **Dropped from the preview.** No public form: `Scene` refuses a scene with no body (`empty-scene`) on purpose. Its proof stays in `src/synthetic` and the moved engine tests | none |
| `synthetic-ring` | Rebuild | `addBody` earth, moon; `addGroup({ center: earth, plane: "EQJ", orbits })`, with the 10,000 orbits generated from the same base, spread and seed |
| `synthetic-belt` | Rebuild | Sun, Earth with `orbit`; `addGroup`; `addTrajectory` or `addBodyFromElements` for the far path; `camera.setReach(400_000)` gives today's far of 1,000,000 |
| `synthetic-listed` | Rebuild | As belt; `addGroup` with `orbits` and `clump.near` on a body from `addBodyFromElements` |
| `synthetic-eccentric` | Rebuild | Sun; Earth `enlarge: 200`; `addBodyFromElements` |
| `synthetic-probe` | Move | Already a `Scene`; drop `toDefinition` |
| `synthetic-views` | Move | Already a `Scene`; S29 for its host |
| `synthetic-journey` | Move | Already a `Scene`; `journeyData` goes to `mount`'s `data` |

Rebuilt scenes may differ in small ways from their old selves, such as where a ring's dots sit along their orbits. Only `synthetic-probe`, `-views` and `-journey` have browser checks, and those three are moved unchanged, so ARCH-03 browser proof is kept. Update `SYNTHETIC_KEYS` to drop `synthetic-bare`.

Add no new preview scene for the moon features (T-271 boundary). Their ARCH-03 proof is T-267's and T-268's made-up system in tests.

## 7. Tests

**The rule that decides most of them:** a test needing both engine internals and a demo cannot stay as it is. It cannot go to the engine (engine tests may import only the data packages), and it cannot go to Apollo or Showers (their counts may only fall). So it splits:

- The internals half goes to the engine, with the demo definition swapped for a `src/synthetic` one or a made-up fixture.
- The demo half stays and uses public reads (`scene.bodies`, `paths`, `events`, `panels`, `bodySets`, `moonPanel`, `places`), never `toDefinition` (O-057 removes it).

`astraeus/tools/import/test-io.mjs` is replaced in each package by a small local copy (`tests/helpers/testIo.mjs`). Reading an engine file by path with `node:fs`, as `assetsSections.test.ts` does, is not a deep import and stays allowed.

| Row | File | Destination | Needs in the engine |
|---|---|---|---|
| T1 | planets `demoPlanets` | Stays, public reads | |
| T2 | planets `domMoonPanel` | **Engine test**, made-up list | `astraeus-data-jupiter/moon-list.json` if real data is wanted |
| T3 | planets `jupiterMoonsScene` | Ring and catalogue parts **engine test**; set and mount checks stay on reads | `astraeus-data` resolves |
| T4 | planets `jupiterViewSnapshot` + fixture | Stays through T-270 as the before and after comparison, on reads; delete after, if it can no longer say anything reads do not | |
| T5 | planets `mapOrientation` | Map and marker frame **engine test**. Its `surfacePlace.mjs` import is a demo import, so the conversion cases stay in the demo and the engine half uses literal converted longitudes | Data from `astraeus-data` |
| T6 | planets `moonFamilyPanel` | Panel model and search: **engine test**, made-up list. Moon facts: stay, against `moonList.ts` | |
| T7 | planets `planetDefinition` | Stays, public reads | |
| T8 | planets `planetSwitchInner` | Stays; `needsPlanetSeries` and `MARS_MOON_SYSTEM` asserts become reads, or **engine test** | |
| T9 | planets `planetSystems` | Stays; `switchAddress` case moves with it to the site; ring and moon-system asserts **engine test** | |
| T10 | site `compositions` | **Engine test** for all but the `withAlias` table, which is cut to synthetic definitions; Apollo and Perseids rows go to a new site `demoScenes.test.ts` on reads | No demo imports |
| T11 | site `experienceDefinition` | **Engine test**, Apollo rows swapped for synthetic; page heading to the site with S26; `app.html` scan stays in the site | |
| T12 | site `experiencePlugIn` | **Engine test**; Apollo and shower rows to `demoScenes.test.ts` | |
| T13 | site `experiences` | **Engine test** for readouts, overrides, `catalogueItem`, selection; Apollo and Perseids sections to `demoScenes.test.ts` | |
| T14 | site `demoRules` | Stays on reads; the marker rule (`describeBody`) to an **engine test** over every catalogue body | |
| T15 | site `domDemoStories` | Generic shell checks are already in `tests/domStory.test.ts`; keep "a marker per panel" via `scene.panels` | |
| T16 | site `storyStoriesAllDemos` | Stays, `scene.panels` | |
| T17 | site `storyPanels` | Parser and view: **engine test**, made-up panels. "Demo wiring" and plain-voice checks stay, reading the panels JSON directly | |
| T18 | site `assetsPageCredits` | Stays. Licences through `SceneBodyRead.texture`; the star licence by reading the star file's header by path | |
| T19 | site `assetsSections` | Stays, same; paths retargeted | |
| T20 | site `publicBuild` | Stays; `catalogue.ids()` becomes the root's body refs plus `.texture` | |
| T21 | site `homePage` | Stays; `decodeChunk` copied into `tests/helpers/` (the page's own format) | |
| T22 | site `jupiterMoonCatalogue` | Stays, local helper, new path | |

Engine tests resolve only `astraeus`, relative engine paths and `astraeus-data*`. Nothing in the moved list may keep `astraeus-demo-*` or `../src/` of a demo.

## 8. Traps found while comparing old and new

Each of these would have been a visible change if T-270 used today's public defaults. Sections 2 and 3 already cover them; T-270's planet-by-planet comparison must assert each.

1. **Opening camera.** `camera.lookAt` sets `startCameraPresetId`, so Focus shows pressed and selecting another body moves the camera. Planets have no start preset. Use `setStartView`.
2. **Follow buttons.** `cameraPresetsOf` gives every body Follow; a planet offers it only for `moons.follow`. Use `setFollowChoices`, with an empty list when `follow` is absent.
3. **Card rows.** Public scenes pass `["distance"]`; planets show phase and coordinates too. Use `setBodyReadouts`.
4. **Far plane.** `setReach` means 2.5 times; planet files say 4, 5 or 10 times. Pass `farEarthRadii`.
5. **Mars's orbit lines.** Phobos and Deimos have no `orbitPeriodDays` on their definition (`marsMoon` passes none), so `orbit: true` throws `no-orbit`. They also use the fading default look, where the public rule closes the loop. Pass `{ lapDays: 0.3189, fades: true }` and `{ lapDays: 1.2624, fades: true }`.
6. **Label priority.** Public default is `100 - index`; settings files give their own.
7. **Object order.** Centre, mapped moons, then dots.
8. **Load budgets.** `load-budget.mjs` page sets name chunks by stem. A system chunk's name or contents may shift when imports change; update the sets rather than the limits unless the bytes really moved.

## 9. Reading the rules

- **API-01.** All types in sections 2 and 3 are in `src/api/`. Reused public types: `BodyRef`, `BodyId`, `TimeInput`, `Provenance`, `CameraPose`, `TextureRef`. `BodyId` is a plain alias of `string`, used the same way by `ReadoutInput` today, so it exposes nothing.
- **API-02.** All viewer reads and calls go through `viewerHandleOf`, and the two new signals are props on `AstraeusScene`. `Scene` methods apply to both paths by construction. The shared lifecycle suite covers `onPick`, `onFirstDraw`, `pick` and `setPick`.
- **API-03.** The picker and first-frame signal are per `ViewerLink`. `SwitchControl` keeps no module state.
- **API-04.** Numbers carry units (`radiusKm`, `latitudeDeg`, `longitudeDeg`, `semiMajorAxisKm`, `lapDays`, `orbitHistoryMs`, `farEarthRadii`, `dotSizePx`, `nearPx`) or are on the `unitless` list (`eccentricity`, `labelPriority`, `distance`, `brightness`, `opacity`, `scale`, `count`). Only `center` is used; `moonPositions.centre` is existing and is O-057's. `listDate` and `time` are `TimeInput`. No `start`/`end` pair. No input typed `unknown`; `addStoryPanels` already takes the file.
- **API-05.** New throws are `SceneError`. `MoonPanelInput.listDate` goes through `toUtcMs`.
- **API-06.** `desktopPictures` and `bodySet` make the last definition-only looks public.
- **ARCH-01, ARCH-06.** No name in this note carries a body. Defaults come from the scene (first body) or from moon-system config by lookup, not from a named body; `src/api/` stays under the body-name check. The Mars numbers in trap 5 live in the demo's `systems/mars.ts`.
- **ARCH-03.** Each new feature gets a made-up proof: `addBodySet` by `elements` members about a made-up or built-in centre, `setMoonPanel` and `addPlaces` on the same system, `setPicker` with made-up options.
- **No renames (O-057).** Existing names keep their spelling; `setReach` only gains an optional argument. `moonPositions.centre` stays.
- **Port faithfully.** Dots, panel, markers and control keep their code; only their input path changes. `moonList.ts`, `hideBootLoader`, `switchAddress`, `chooseSwitch` and `createAddressNavigation` are lifted as they are.

## 10. For the owner to look at

None of these blocks T-266. They are consequences of settled choices, listed so they are not a surprise.

- **O1. Places get published for the first time.** About 840 KB of JSON joins `astraeus-data`, which today ships only pictures. It is the owner's own Planetary Explorer work, so it may be published, but the NOTICE needs a line. If the owner would rather not publish it, the alternative is a new private data package, which outside apps could not use.
- **O2. Three made-up scenes exist twice for a while.** `synthetic-probe`, `-views` and `-journey` live in the site and as engine fixtures, because the engine cannot import the site and the site cannot import the engine's fixtures. O-057, which removes `toDefinition`, should settle the engine copies.
- **O3. Follow buttons.** `setFollowChoices` exists only to keep today's look. If the owner would like Follow on every moon, it can go.

## 11. Order across the steps

`DEEP_IMPORT_COUNTS` may only fall and every step must leave the demos working, so some moves wait.

- **T-266 to T-269** add public features only. The internal fields they mirror (`switcher`, `claimCover`, `desktopTextures`, `listed`, `facts`) keep working for the unchanged demo and site. T-266 deletes `alternates` and `developerSections`.
- **T-268** moves the places data and repoints the demo's current imports, so the demo keeps building before T-270.
- **T-270** replaces `buildPlanetDefinition` with `buildPlanetScene`. Until T-272, `main.tsx` calls `.toDefinition(data)` on that scene and adds `label` and `switcher` as it does for showers. This is an allowed stop-gap: the site leaves `toDefinition` in T-272.
- **T-271** moves the scene builders to the site the same way: `DEFINITIONS` calls `.toDefinition()` until T-272. The site's count falls here.
- **T-272** moves `main.tsx` onto `mount`, then removes `switchAddress`, `openAddress`, `claimCover` and the site's last `toDefinition`.

## Appendix A: every deep import and its row

Generated from a fresh listing; `npm test`'s `DEEP_IMPORT_COUNTS` total is the check.

Total 215: 37 files.

| File | Imports | Rows |
|---|---|---|
| `planets/src/experiences/jupiter-io/jupiterIo.ts` | 1: app/experienceDefinition (S1) | S1 |
| `planets/planetChoice.ts` | 1: app/listSwitch (S20) | S20 |
| `planets/planetDefinition.ts` | 17: assets/catalogue (S2), assets/moonCatalogue (S13), shell/moonFamilies (S15), app/bodyMetrics (S5), app/bodySet (S11), app/catalogueItem (S4), app/experienceDefinition (S1), assets/compositions (S3), core/chebyshevEphemeris (S11), core/ephemerisGroup (S11), core/events (S6), core/orbitPeriod (S11), core/provenance (S9), core/trajectory (S10), shell/bodyFeatures (S16), shell/experience (S8), shell/storyPanels (S7) | S2, S13, S15, S5, S11, S4, S1, S3, S6, S9, S10, S16, S8, S7 |
| `planets/planetSettings.ts` | 3: app/viewLink (S18), core/fieldReaders (S19), experiences/settingsFields (S19) | S18, S19 |
| `planets/systems/earth.ts` | 5: assets/compositions (S3), data/bodies/earth/features.json (S17), data/bodies/earth/categories.json (S17), data/bodies/moon/features.json (S17), data/bodies/moon/categories.json (S17) | S3, S17 |
| `planets/systems/jupiter.ts` | 4: assets/bodies/jupiterMoonCatalogue (S13), assets/compositions (S3), core/bodies/jupiter (S12), core/bodies/jupiterMoons (S12) | S13, S3, S12 |
| `planets/systems/mars.ts` | 10: assets/catalogue (S2), assets/compositions (S3), core/bodies/mars (S12), core/bodies/planetMoons (S12), core/bodies/moonSystem (S12), assets/moonCatalogue (S13), data/moons/mars.json (S13), data/bodies/mars/features.json (S17), data/bodies/mars/categories.json (S17), data/moons/fit-errors/mars.json (S14) | S2, S3, S12, S13, S17, S14 |
| `planets/systems/mercury.ts` | 4: assets/catalogue (S2), assets/compositions (S3), data/bodies/mercury/features.json (S17), data/bodies/mercury/categories.json (S17) | S2, S3, S17 |
| `planets/systems/neptune.ts` | 4: assets/bodies/outerPlanetCatalogues (S13), assets/compositions (S3), core/bodies/planetMoons (S12), data/moons/fit-errors/neptune.json (S14) | S13, S3, S12, S14 |
| `planets/systems/pluto.ts` | 4: assets/bodies/outerPlanetCatalogues (S13), assets/compositions (S3), core/bodies/planetMoons (S12), data/moons/fit-errors/pluto.json (S14) | S13, S3, S12, S14 |
| `planets/systems/saturn.ts` | 4: assets/bodies/outerPlanetCatalogues (S13), assets/compositions (S3), core/bodies/planetMoons (S12), data/moons/fit-errors/saturn.json (S14) | S13, S3, S12, S14 |
| `planets/systems/uranus.ts` | 4: assets/bodies/outerPlanetCatalogues (S13), assets/compositions (S3), core/bodies/planetMoons (S12), data/moons/fit-errors/uranus.json (S14) | S13, S3, S12, S14 |
| `planets/systems/venus.ts` | 4: assets/catalogue (S2), assets/compositions (S3), data/bodies/venus/features.json (S17), data/bodies/venus/categories.json (S17) | S2, S3, S17 |
| `planets/tests/demoPlanets.test.ts` | 5: assets/catalogue, app/experienceDefinition, assets/bodies/jupiterMoonCatalogue, shell/infoModel, tools/import/test-io.mjs | T1 |
| `planets/tests/domMoonPanel.test.ts` | 4: assets/bodies/jupiterMoonCatalogue, shell/MoonFamilyPanel, shell/moonFamilies, tests/domSetup | T2 |
| `planets/tests/jupiterMoonsScene.test.ts` | 7: app/experienceDefinition, assets/bodies/jupiterMoonCatalogue, assets/bodies/jupiterRings, assets/catalogue, assets/rings, app/RingView, core/bodies/jupiterMoons | T3 |
| `planets/tests/jupiterViewSnapshot.ts` | 1: app/experienceDefinition | T4 |
| `planets/tests/mapOrientation.test.ts` | 16: app/sceneLayout, app/FeatureMarkers, app/renderCoordinates, assets/catalogue, assets/bodies/planetSystemMaps, assets/bodies/galileanMoons, assets/visual, data/bodies/europa/map.json, data/bodies/titan/map.json, data/bodies/europa/features.json, data/bodies/titan/features.json, data/bodies/triton/map.json, core/astronomyAdapter, core/stateResolver, data/bodies/iapetus/features.json, tools/import/test-io.mjs | T5 |
| `planets/tests/moonFamilyPanel.test.ts` | 5: app/bodySet, assets/bodies/jupiterMoonCatalogue, assets/moonCatalogue, shell/infoModel, shell/moonFamilies | T6 |
| `planets/tests/planetDefinition.test.ts` | 7: assets/catalogue, assets/compositions, assets/moonCatalogue, data/bodies/europa/features.json, data/bodies/io/features.json, data/bodies/ganymede/features.json, data/bodies/callisto/features.json | T7 |
| `planets/tests/planetSwitchInner.test.ts` | 8: app/experienceDefinition, core/bodies/planetMoons, app/planetNeeds, data/bodies/earth/features.json, data/bodies/moon/features.json, data/bodies/mars/features.json, data/bodies/mercury/features.json, data/bodies/venus/features.json | T8 |
| `planets/tests/planetSystems.test.ts` | 5: tools/import/test-io.mjs, shell/SwitchControl, core/bodies/planetMoons, assets/rings, assets/catalogue | T9 |
| `site/src/main.tsx` | 16: app/App (S21), app/planetNeeds (S22), core/planetSeries (S22), app/experienceDefinition (S21), app/addressNavigation (S23), app/style.css (S24), synthetic/syntheticDefinition (S25), synthetic/syntheticDefinition (S25), synthetic/syntheticRingDefinition (S25), synthetic/syntheticRingDefinition (S25), synthetic/syntheticListedDefinition (S25), synthetic/syntheticEccentricDefinition (S25), synthetic/syntheticViewsDefinition (S25), synthetic/syntheticProbeDefinition (S25), synthetic/syntheticJourneyScene (S25), core/planetSeries (S22) | S21, S22, S23, S24, S25 |
| `site/src/showerSwitch.ts` | 1: app/listSwitch (S20) | S20 |
| `site/tests/assetsPageCredits.test.ts` | 4: assets/catalogue, assets/licence, assets/sky, assets/stars/hyg-v42-naked-eye.json | T18 |
| `site/tests/assetsSections.test.ts` | 2: assets/catalogue, tools/import/test-io.mjs | T19 |
| `site/tests/compositions.test.ts` | 21: assets/catalogue, assets/compositions, core/astronomyAdapter, core/body, core/illumination, core/provenance, core/referenceCenters, core/scalePolicy, core/stateResolver, core/state, core/trajectory, app/experienceDefinition, app/floatingOrigin, app/PointsView, app/renderCoordinates, app/sceneLayout, app/sceneFraming, app/TrackedBodyView, synthetic/syntheticDefinition, synthetic/syntheticRingDefinition, tests/scenePlacement | T10 |
| `site/tests/demoRules.test.ts` | 4: app/bodyDraw, app/experienceDefinition, assets/catalogue, core/scalePolicy | T14 |
| `site/tests/domDemoStories.test.ts` | 2: shell/experience, tests/domSetup | T15 |
| `site/tests/experienceDefinition.test.ts` | 7: tests/scenePlacement, app/sceneFraming, core/body, core/scalePolicy, app/experienceDefinition, synthetic/syntheticRingDefinition, synthetic/syntheticDefinition | T11 |
| `site/tests/experiencePlugIn.test.ts` | 10: core/astronomyAdapter, core/clock, assets/catalogue, app/sceneLayout, app/experienceDefinition, shell/AstraeusShell, synthetic/syntheticDefinition, core/timeWindow, shell/infoModel, shell/metrics | T12 |
| `site/tests/experiences.test.ts` | 17: app/bodyMetrics, app/catalogueItem, app/bodyDraw, app/experienceDefinition, app/sceneLayout, app/CameraController, assets/catalogue, assets/compositions, core/astronomyAdapter, core/scalePolicy, core/stateResolver, shell/scaleModel, synthetic/syntheticDefinition, synthetic/syntheticRingDefinition, core/illumination, core/moonTrajectory | T13 |
| `site/tests/homePage.test.ts` | 2: core/chebyshevSeries, tools/import/test-io.mjs | T21 |
| `site/tests/jupiterMoonCatalogue.test.ts` | 1: tools/import/test-io.mjs | T22 |
| `site/tests/publicBuild.test.ts` | 1: assets/catalogue | T20 |
| `site/tests/storyPanels.test.ts` | 2: shell/StoryPanelView, shell/storyPanels | T17 |
| `site/tests/storyStoriesAllDemos.test.ts` | 2: shell/experience, shell/storyPanels | T16 |
