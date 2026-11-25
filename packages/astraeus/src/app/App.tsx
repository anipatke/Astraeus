import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import type { GlowLook } from "./bodyDraw";
import { viewUpFromSearch, viewUpVector, type ViewUp } from "./viewUp";
import { activeEventZones, applyPacing, startPaceEase, type PaceView } from "../presentation/pacing";
import { frameTime } from "./sceneFrame";
import { openClock } from "./openClock";
import { createProvenance } from "../core/provenance";
import type { ViewerControl, ViewerPort, ViewerState } from "./viewerPort";
import { pickerSwitch } from "./listSwitch";
import { useShelf } from "./useShelf";
import { createSolarSystemScale, type ScalePolicy } from "../presentation/scalePolicy";
import type { CameraRequest } from "./CameraController";
import type { DebugReadout } from "./debugReadout";
import type { ClockSnapshot } from "../core/clock";
import {
  bodySetsOf,
  cameraReachOf,
  catalogueOf,
  compositionOf,
  experienceWithGroups,
  groupsOf,
  mountedBodiesOf,
  pageTitleOf,
  scaleChoiceIdsOf,
  sceneCenterOf,
  sunCentredOf,
  trackedBodiesOf,
  visualOverridesOf,
  type ExperienceDefinition,
} from "./experienceDefinition";
import { AstraeusShell, initialObjectId } from "../shell/AstraeusShell";
import { createSelection, type Selection } from "../shell/selection/selection";
import type { ViewChoice } from "../shell/DisplaySwitches";
import type { PanelCause } from "../shell/useStoryPanels";
import type { ExperienceCameraRequest, ExperienceConfig } from "../shell/experience";
import { SCALE_CHOICES, scaleChoicesFor, scalePolicyFor, startScaleFor, type ScaleId } from "../shell/scaleModel";
import {
  scaleFromSearch,
  showFromSearch,
  timeFromSearch,
  viewFromAngles,
  viewFromSearch,
  type CameraView,
} from "./viewLink";
import { createOrbitCameraState } from "./CameraController";
import { START_CAMERA_DISTANCE } from "./sceneFraming";
import { addressSearch } from "./address";
import { PanelLoadBoundary } from "./PanelLoadBoundary";
import { bootFadeSeconds } from "../shell/bootLoader";
import { DeveloperDrawer } from "./developerPanels";
import { DEFAULT_ILLUMINATE_ALL } from "./lighting";
import { DEFAULT_TIMELINE_GLOW, type TimelineGlowLook } from "../shell/timelineGlow";
import { DEFAULT_PHONE_LAYOUT, type PhoneLayoutSettings } from "../shell/phoneLayout";
import type { StoryMarkerSpec } from "./StoryMarkers";
import { featureMarkerSpecs, featureMinBodyPxOf } from "./FeatureMarkers";
import { AstraeusScene, type SceneControls } from "./AstraeusScene";
import { HOVER_BRIGHTNESS_DEFAULT } from "./scenePicking";
import { createSceneResolver } from "./sceneLayout";
import { loadStarCatalogue } from "../assets/sky";
import { withSkyObject, type StarStatus } from "./skyModel";
import { resolveOrbitLook, type OrbitLook } from "../assets/orbitLook";
import { DEFAULT_BODY_SET_LOOK, type BodySetLook } from "./bodySet";
import { displaySwitchItems, hostReachable, orbitStart, skyLineStart, type SwitchBindings } from "./displaySwitches";
import { TRACE_FADE_SECONDS, type SkyTraceAfter } from "../presentation/skyTrace";
import { aimAtFigure, DEFAULT_SKY_LINES, prefersReducedMotion, skyColoursOf, skyFadeInSecondsOf } from "./skyFigures";
import { labelStyleOf } from "./labelStyle";
import { timeLookOf } from "./timeLook";
import { interfaceLookOf } from "../shell/look/interfaceLook";
import { experienceInView, hiddenByView, hiddenWithShownSpans, viewById } from "./viewHiding";
import { cameraIdsOf } from "../presentation/storyPanels";
import type { RingLook } from "../assets/rings";
import { baseGlowOf, glowLookOf, markerSettingsOf } from "./bodyDraw";
import { resolveLook } from "./look";
import {
  applyLook,
  desktopPicturesOf,
  lookReadOf,
  presentationOf,
  skySettingsOf,
  type LivePresentation,
} from "./liveLook";
import type { LookInput } from "../api/look";
import { DEFAULT_POINT_SIZE_PX, type GroupDotLook } from "./PointsView";

/** The labels switched off at the start: objects that set `showLabel: false`, then `?labels=<id>:on|off,...` over them. */
export function hiddenLabelsFrom(
  search: string,
  objects: readonly { readonly id: string; readonly showLabel?: boolean }[],
): Set<string> {
  const hidden = new Set(objects.filter((object) => object.showLabel === false).map((object) => object.id));
  for (const part of (new URLSearchParams(search).get("labels") ?? "").split(",")) {
    const [id, state] = part.split(":");
    if (id === undefined || id === "" || (state !== "on" && state !== "off")) continue;
    if (state === "off") hidden.add(id);
    else hidden.delete(id);
  }
  return hidden;
}

/** `?loop=on` or `?loop=off` overrides the experience's own looping setting. */
export function loopFromSearch(search: string, fallback: boolean): boolean {
  const value = new URLSearchParams(search).get("loop");
  return value === "on" ? true : value === "off" ? false : fallback;
}

/** The scene view showing at the start: `?show=<id>` when it names one of the scene's views, else the scene's own `start` (an unknown id is not an error). */
const NO_CARD_PROVENANCE = createProvenance({
  sourceType: "illustrative",
  sources: ["Supplied by the caller"],
  accuracy: "As supplied; the engine makes no claim.",
  notes: "",
});

/** The sky figures as the host link reads them: each drawn figure with its card words (`experience.skyFigures`). */
function skyFigureReads(
  layers: readonly { readonly id: string; readonly label: string; readonly kind: "figure" | "boundary" }[],
  cards: ExperienceConfig["skyFigures"],
): NonNullable<ViewerControl["skyFigures"]> {
  return layers.map(({ id, label, kind }) => {
    const card = cards?.find((candidate) => candidate.id === id); // a hand-written definition may draw a figure with no card: it then reads as listed, with the default provenance
    return Object.freeze({
      id,
      label,
      kind,
      listed: card?.listed ?? true,
      provenance: card?.provenance ?? NO_CARD_PROVENANCE,
      ...(card?.description === undefined ? {} : { description: card.description }),
      ...(card?.facts === undefined ? {} : { facts: card.facts }),
    });
  });
}

/** Whether two clock snapshots show the same time, playing state and rate (so a poll can keep the old one and skip a render). */
function sameClock(a: ClockSnapshot, b: ClockSnapshot): boolean {
  return a.timeUtcMs === b.timeUtcMs && a.playing === b.playing && a.rate === b.rate;
}

function startViewId(definition: ExperienceDefinition, search: string): string {
  const asked = showFromSearch(search);
  const known = asked !== undefined && definition.views?.views.some((view) => view.id === asked) === true;
  return known ? asked : (definition.views?.start ?? "");
}

/** The ids the Labels switch turns off and on: every object's name and every host label (`Scene.addLabels`). */
export function labelIdsOf(
  experience: Pick<ExperienceConfig, "objects">,
  definition: Pick<ExperienceDefinition, "labels">,
): string[] {
  return [...experience.objects.map(({ id }) => id), ...(definition.labels ?? []).map(({ id }) => id)];
}

/** The labels switch's starting state, if the story gave one. */
function labelStart(definition: ExperienceDefinition): boolean | undefined {
  return definition.displaySwitches?.labels?.on;
}

/** The orbit lines a story starts off: the ring and arc, and the moon orbits. */
function startOrbitControls(definition: ExperienceDefinition): Pick<SceneControls, "orbitLook" | "bodySetLook"> {
  const start = orbitStart(definition.displaySwitches?.orbitLines);
  return start === undefined
    ? {}
    : { orbitLook: start.look, bodySetLook: { ...DEFAULT_BODY_SET_LOOK, orbitsOn: false } };
}

function copyOfGlow(look: GlowLook | undefined): GlowLook | null {
  return look === undefined ? null : { ...look };
}

function orbitPathsOf(runtime: Runtime) {
  return runtime.composition?.paths ?? [];
}

/** The up direction at the start: `?up=` in the address, else the experience's own, else the equatorial pole. */
function startViewUp(definition: ExperienceDefinition, search: string): ViewUp {
  return viewUpFromSearch(search, definition.viewUp ?? "equatorial");
}

function storyStartOf(storySet: ExperienceDefinition["experience"]["storyPanels"]) {
  return { autoOpen: storySet?.autoOpen ?? false, pauseSeconds: storySet?.pauseSeconds ?? 0 };
}

/** The story-panel settings in force: the two the Developer drawer changes live, and the close span the scene set. */
function liveStorySettings(
  storySet: ExperienceDefinition["experience"]["storyPanels"],
  autoOpen: boolean,
  pauseSeconds: number,
) {
  return {
    autoOpen,
    pauseSeconds,
    ...(storySet?.closeAfterSeconds === undefined ? {} : { closeAfterSeconds: storySet.closeAfterSeconds }),
  };
}

/** Everything one mounted experience shares: clock, resolver, catalogue and the settings read from its definition and the address. */
function buildRuntime(definition: ExperienceDefinition, search: string) {
  const adapter = createOrbAstronomyAdapter();
  // The looks in force: the scene's, with the address over them; the one source every look reader below uses.
  const look = resolveLook(definition.look, search);
  // A copied view link carries the time it was copied at.
  const clock = openClock(
    definition,
    timeFromSearch(search),
    shownEventsOf(definition, startViewId(definition, search)),
  );
  // One resolver per mount: every position in the scene comes from it, whatever the scene centre.
  const resolver = createSceneResolver(adapter, catalogueOf(definition));
  return {
    clock,
    adapter,
    resolver,
    catalogue: catalogueOf(definition),
    bodies: mountedBodiesOf(definition),
    composition: compositionOf(definition),
    overrides: visualOverridesOf(definition),
    desktopTextures: desktopPicturesOf(definition, look),
    ...(definition.pictures === undefined ? {} : { pictures: definition.pictures }),
    sceneCenter: sceneCenterOf(definition),
    trackedBodies: trackedBodiesOf(definition),
    groups: groupsOf(definition),
    bodySets: bodySetsOf(definition),
    skyFigures: definition.skyFigures ?? [],
    ...sunCentredOf(definition),
    cameraReach: cameraReachOf(definition),
    look,
    sky: skySettingsOf(definition, look),
    loopWindow: definition.experience.window,
    ...(definition.experience.hideTimeline === true ? {} : { stopAtWindow: true }),
    ...(definition.pacing === undefined ? {} : { pacing: definition.pacing }),
    ...(definition.eventZones === undefined ? {} : { eventZones: definition.eventZones }),
    up: viewUpVector(startViewUp(definition, search)),
  };
}

type Runtime = ReturnType<typeof buildRuntime>;

/** The event ids the view shows, which choose the pacing zones that apply; undefined for a scene without views (every zone applies). */
function shownEventsOf(
  definition: Pick<ExperienceDefinition, "views">,
  viewId: string,
): ReadonlySet<string> | undefined {
  return viewById(definition.views, viewId)?.events;
}

/** Whether the experience has anything the Display controls (markers, labels, timeline, phone layout) act on. */
function showsDisplayControls(
  definition: ExperienceDefinition,
  runtime: Runtime,
  skyVisible: boolean,
  orbitPathCount: number,
  storyMarkerCount: number,
): boolean {
  return (
    orbitPathCount > 0 ||
    runtime.trackedBodies.length > 0 ||
    skyVisible ||
    storyMarkerCount > 0 ||
    (definition.experience.storyPanels?.panels.length ?? 0) > 0 ||
    runtime.bodies.some((id) => runtime.catalogue.get(id).visual.kind === "sphere")
  );
}

/**
 * The camera as the scene opens it (the start view, else its default framing): what a host reads before the scene's first frame writes `viewReadout`.
 * Undefined for a look-out toward an id: its direction is known only once the first frame resolves it, and a guess would be a false reading.
 */
function openingCamera(definition: ExperienceDefinition, runtime: Runtime, search: string): CameraView | undefined {
  const start = viewFromSearch(search) ?? definition.startView;
  if (start !== undefined) return "kind" in start ? undefined : start;
  const opening = createOrbitCameraState(START_CAMERA_DISTANCE, runtime.sceneCenter);
  return viewFromAngles(opening.focus, opening.azimuth, opening.elevation, opening.distance);
}

/** The scene's live controls at mount: the address overrides the experience's own start values. */
function initialSceneControls(
  definition: ExperienceDefinition,
  runtime: Runtime,
  experience: ReturnType<typeof experienceWithGroups>,
  startScale: ScaleId,
  glowBase: ReturnType<typeof baseGlowOf>,
  storyMarkers: readonly StoryMarkerSpec[],
  suppliedPolicies: readonly ScalePolicy[],
  search: string,
  selection: Selection,
): SceneControls {
  // A look-out toward an id is aimed as a `setCamera` one is: a sky figure becomes its label point here, an object is turned toward on the first frame.
  const opening = definition.startView;
  const startView =
    viewFromSearch(search) ??
    (opening !== undefined && "kind" in opening ? aimAtFigure(opening, runtime.skyFigures) : opening);
  return {
    policy: scalePolicyFor(startScale, suppliedPolicies),
    cameraRequest: null,
    showAnchorLabels: labelStart(definition) === true && runtime.trackedBodies.length > 0,
    loop: loopFromSearch(search, definition.loop === true),
    ...(definition.pacing === undefined
      ? {}
      : {
          paceAuto: true,
          pace: { shown: shownEventsOf(definition, startViewId(definition, search)) } satisfies PaceView,
        }),
    up: viewUpVector(startViewUp(definition, search)),
    showMilkyWay: runtime.sky.milkyWay,
    skyLines: skyLineStart(definition.displaySwitches, DEFAULT_SKY_LINES),
    skyColours: skyColoursOf(runtime.look),
    skyTraces: [],
    skyFadeInSeconds: skyFadeInSecondsOf(runtime.look),
    labelStyle: labelStyleOf(runtime.look),
    timeLook: timeLookOf(runtime.look),
    sheetMaxPercent: runtime.look.sheetMaxPercent ?? DEFAULT_PHONE_LAYOUT.sheetMaxPercent,
    interfaceLook: interfaceLookOf(runtime.look),
    skyVisible: runtime.sky.visible,
    bodyMarker: markerSettingsOf(runtime.look),
    ...(glowBase === null ? {} : { glowLook: glowLookOf(runtime.look, glowBase) }),
    starBrightness: runtime.sky.starBrightness,
    milkyWayBrightness: runtime.sky.milkyWayBrightness,
    illuminateAll: DEFAULT_ILLUMINATE_ALL,
    hiddenLabels: hiddenLabelsFrom(
      search,
      labelStart(definition) === undefined
        ? experience.objects
        : labelIdsOf(experience, definition).map((id) => ({ id, showLabel: labelStart(definition) })),
    ),
    ...startOrbitControls(definition),
    labelObjects: experience.objects,
    ...(definition.labels === undefined ? {} : { hostLabels: definition.labels }),
    viewHidden: hiddenByView(definition.views, viewById(definition.views, startViewId(definition, search)), experience),
    loadFadeSeconds: bootFadeSeconds(runtime.look),
    desktopPictures: runtime.desktopTextures,
    storyMarkers,
    featureMarkers: featureMarkerSpecs(definition.experience.bodyFeatures),
    featureMinBodyPx: featureMinBodyPxOf(runtime.look),
    get selectedObjectId() {
      return selection.id(); // read through: the viewer's one selection, never a copy (an own enumerable property, which the draw rule's `for...in` finds)
    },
    frameStats: null,
    groupFills: [],
    ...(startView === undefined ? {} : { startView }),
  };
}

/** The Developer drawer when the host asked for developer tools, else nothing (the shell then draws no toggle and no drawer). */
const drawerWhen = (asked: boolean | undefined, drawer: ReactNode): ReactNode => (asked === true ? drawer : undefined);

/** The About the viewer shows: the host's live one once attached (its `setAbout`), else the scene's own. */
function useAbout(definition: ExperienceDefinition, host: ViewerPort | undefined) {
  const watch = useCallback((watcher: () => void) => host?.watchAbout(watcher) ?? (() => undefined), [host]);
  return useSyncExternalStore(watch, () => host?.aboutNow()) ?? definition.about;
}

/**
 * `writeTitle`: whether the page heading is set to the experience's name (default true); `mount` and `AstraeusScene` pass false so a host page keeps its own title.
 * `developerTools`: whether the viewer shows the Developer toggle and drawer (default false; the drawer's code is fetched only when a visitor opens it, so off never fetches it; the demo site passes true).
 * `address`: whether the viewer reads the page address (`view`, `t`, `scale`, `up`, `show`, `stars`, `milkyway`, `labels` and the other parameters in the README) and offers a copy-link button that writes it (default false: a host page's address is its own; the demo site passes true).
 * `host`: the link a host page reads and sets the one clock through (time, speed) and hears its changes from; every change goes through the same handlers as the timeline's own controls.
 */
export function App({
  definition,
  writeTitle = true,
  address,
  developerTools,
  host,
}: {
  readonly definition: ExperienceDefinition;
  readonly writeTitle?: boolean;
  readonly address?: boolean;
  readonly developerTools?: boolean;
  readonly host?: ViewerPort;
}) {
  // The page heading names the experience once it is open; app.html says only "Astraeus" until then.
  useEffect(() => {
    if (writeTitle) document.title = pageTitleOf(definition);
  }, [definition, writeTitle]);
  // The address text every reader below uses: the page's when the host turned the option on, else empty. Read once per scene, as before.
  const search = useMemo(() => addressSearch(address), [definition, address]); // eslint-disable-line react-hooks/exhaustive-deps -- definition and address are the scene's reset key: read once per scene, as before
  const runtime = useMemo(() => buildRuntime(definition, search), [definition, search]);
  // The host link hears the scene's first drawn frame (`onFirstDraw`).
  const told = useCallback(() => host?.firstDraw(), [host]);
  // The host's picker: the pressed option is the host's to move (`setPick`), and a press is only reported (`onPick`).
  const watchPick = useCallback((watcher: () => void) => host?.watchPick(watcher) ?? (() => undefined), [host]);
  const hostPick = useSyncExternalStore(watchPick, () => host?.pickNow());
  const choosePick = useCallback((value: string) => host?.picked(value), [host]);
  const about = useAbout(definition, host);
  const experienceRuntime = useMemo(
    () => ({ clock: runtime.clock, resolver: runtime.resolver, catalogue: runtime.catalogue }),
    [runtime],
  );
  // The choices offered, in the experience's order; the solar-system policy enlarges only the bodies the experience names.
  const scaleChoiceIds = useMemo(() => scaleChoiceIdsOf(definition), [definition]);
  const scaleChoices = useMemo(
    () => (scaleChoiceIds === undefined ? undefined : scaleChoicesFor(scaleChoiceIds)),
    [scaleChoiceIds],
  );
  const suppliedPolicies = useMemo<readonly ScalePolicy[]>(() => {
    const exaggeration: Record<string, number> = {};
    for (const [id, override] of runtime.overrides)
      if (override.exaggeration !== undefined) exaggeration[id] = override.exaggeration;
    return [createSolarSystemScale({ exaggeration, defaultExaggeration: 1 })];
  }, [runtime]);
  const linkedScale = scaleFromSearch(search);
  const startScale: ScaleId = startScaleFor(linkedScale, scaleChoiceIds);
  const experience = useMemo(() => experienceWithGroups(definition), [definition]);
  // The shell also lists the sky, citing its sources and saying whether the stars were fetched.
  const [starStatus, setStarStatus] = useState<StarStatus>({ kind: "loading" });
  useEffect(() => {
    let cancelled = false;
    void loadStarCatalogue().then((loaded) => {
      if (!cancelled)
        setStarStatus(loaded === null ? { kind: "absent" } : { kind: "loaded", count: loaded.stars.length });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  // The current view (App state, like the display switches). The shell's lists read one experience, filtered here once; the scene hides the same ids from `controls.viewHidden`.
  const [viewId, setViewId] = useState(() => startViewId(definition, search));
  const currentView = useMemo(() => viewById(definition.views, viewId), [definition.views, viewId]);
  // A shelf action's camera goes through the same request path as a story panel's camera (set below, once `setCamera` exists).
  const shelfCamera = useRef<(request: CameraRequest) => void>(() => undefined);
  const moveShelfCamera = useCallback((request: CameraRequest) => shelfCamera.current(request), []);
  const shelf = useShelf(definition.parts, currentView, host, moveShelfCamera);
  const viewExperience = useMemo(
    () => experienceInView(experience, definition.views, currentView),
    [experience, definition.views, currentView],
  );
  // Whether the sky is drawn: the look's `skyVisible`, live (a host's `setLook` changes it).
  const [skyVisible, setSkyVisible] = useState(runtime.sky.visible);
  const shellExperience = useMemo(
    () => withSkyObject(viewExperience, skyVisible, starStatus),
    [viewExperience, skyVisible, starStatus],
  );
  const metricsFor = useMemo(() => definition.createMetrics(experienceRuntime), [definition, experienceRuntime]);
  const glowBase = useMemo(() => baseGlowOf(runtime.bodies.map((id) => runtime.catalogue.get(id))), [runtime]);
  const storySet = definition.experience.storyPanels;
  const storyMarkerSpecs = useMemo<readonly StoryMarkerSpec[]>(
    () =>
      [...(storySet?.panels ?? []), ...(storySet?.steps ?? [])].flatMap((panel) =>
        panel.objectId === undefined
          ? []
          : [
              {
                panelId: panel.id,
                objectId: panel.objectId,
                title: panel.title,
                ...("timeUtcMs" in panel ? { timeUtcMs: panel.timeUtcMs } : {}),
              },
            ],
      ),
    [storySet],
  );
  // The viewer's one selected object: the shell reads and sets it, the scene reads it every frame and the host link reads it through `read()`. It opens on the object the shell opens on.
  const selection = useMemo(
    () => createSelection(initialObjectId(shellExperience, runtime.clock.snapshot().timeUtcMs)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the opening id is read once per scene: a later experience change must not restart the selection
    [runtime],
  );
  const controls = useRef<SceneControls>(
    initialSceneControls(
      definition,
      runtime,
      experience,
      startScale,
      glowBase,
      storyMarkerSpecs,
      suppliedPolicies,
      search,
      selection,
    ),
  );
  const readout = useRef<DebugReadout | null>(null);
  const [clockSnapshot, setClockSnapshot] = useState(() => runtime.clock.snapshot());
  const [scale, setScale] = useState<ScaleId>(startScale);
  const [developerMode, setDeveloperMode] = useState(false);
  const [timelineGlow, setTimelineGlow] = useState<TimelineGlowLook>(DEFAULT_TIMELINE_GLOW);
  const [phoneLayoutOwn, setPhoneLayout] = useState<PhoneLayoutSettings>(DEFAULT_PHONE_LAYOUT);
  // The sheet cap is a look: the live controls hold it, so `setLook`, the handle's `look` and the Developer slider are one value (STYLE-07).
  const [sheetShown, setSheetShown] = useState(controls.current.sheetMaxPercent);
  const [interfaceShown, setInterfaceShown] = useState(controls.current.interfaceLook);
  const phoneLayout: PhoneLayoutSettings = {
    ...phoneLayoutOwn,
    sheetMaxPercent: sheetShown,
    animationMs: interfaceShown.motionMs,
  };
  const [anchorLabels, setAnchorLabels] = useState(controls.current.showAnchorLabels);
  const [skyLinesShown, setSkyLinesShown] = useState(controls.current.skyLines);
  const [skyColoursShown, setSkyColoursShown] = useState(controls.current.skyColours);
  const [labelStyleShown, setLabelStyleShown] = useState(controls.current.labelStyle);
  const [timeLookShown, setTimeLookShown] = useState(controls.current.timeLook);
  const [glowShown, setGlowShown] = useState<GlowLook | null>(copyOfGlow(controls.current.glowLook));
  const orbitPaths = orbitPathsOf(runtime);
  const orbitDefault = useMemo(() => resolveOrbitLook(orbitPaths[0]?.look), [orbitPaths]);
  const [orbitShown, setOrbitShown] = useState<OrbitLook>({ ...orbitDefault, ...controls.current.orbitLook });
  const setOrbit = (change: Partial<OrbitLook>) => {
    controls.current.orbitLook = { ...controls.current.orbitLook, ...change };
    setOrbitShown({ ...orbitDefault, ...controls.current.orbitLook });
  };
  const resetOrbit = () => {
    delete controls.current.orbitLook;
    setOrbitShown(orbitDefault);
  };
  const bodySets = runtime.bodySets;
  const [setLook, setSetLook] = useState<BodySetLook>(controls.current.bodySetLook ?? DEFAULT_BODY_SET_LOOK);
  const changeSetLook = (change: Partial<BodySetLook>) => {
    const next = { ...(controls.current.bodySetLook ?? DEFAULT_BODY_SET_LOOK), ...change };
    controls.current.bodySetLook = next;
    setSetLook(next);
  };
  const highlightFamily = (family: string | null) => changeSetLook({ highlightFamily: family });
  const ringSystems = useMemo(
    () =>
      runtime.bodies.flatMap((id) => {
        const rings = runtime.overrides.get(id)?.rings ?? runtime.catalogue.get(id).visual.rings;
        return rings === undefined ? [] : [rings];
      }),
    [runtime],
  );
  const [ringLook, setRingLook] = useState<RingLook>({});
  const changeRing = (band: string, change: { color?: string; opacity?: number }) => {
    const next = { ...ringLook, [band]: { ...ringLook[band], ...change } };
    controls.current.ringLook = next;
    setRingLook(next);
  };
  const labelToggles = useMemo(
    () => experience.objects.filter((object) => object.showLabel !== undefined),
    [experience],
  );
  const [hiddenLabels, setHiddenLabels] = useState<ReadonlySet<string>>(() => new Set(controls.current.hiddenLabels));
  const [loopOn, setLoopOn] = useState(controls.current.loop === true);
  const [upChoice, setUpChoice] = useState<ViewUp>(startViewUp(definition, search));
  const [illuminateAll, setIlluminateAll] = useState(controls.current.illuminateAll);
  const [milkyWayOn, setMilkyWayOn] = useState(runtime.sky.milkyWay);
  const [hoverBrightness, setHoverBrightness] = useState(HOVER_BRIGHTNESS_DEFAULT);
  const [starBrightness, setStarBrightness] = useState(runtime.sky.starBrightness);
  const [milkyWayBrightness, setMilkyWayBrightness] = useState(runtime.sky.milkyWayBrightness);
  const [loadFade, setLoadFade] = useState(() => bootFadeSeconds(runtime.look));
  const [markerPx, setMarkerPx] = useState(() => controls.current.bodyMarker.minSpherePx);
  const [storyAutoOpen, setStoryAutoOpen] = useState(storyStartOf(storySet).autoOpen);
  const [storyPauseSeconds, setStoryPauseSeconds] = useState(storyStartOf(storySet).pauseSeconds);
  const [panelRequest, setPanelRequest] = useState<{
    readonly id: string;
    readonly serial: number;
    readonly host?: boolean;
  } | null>(null);
  const [pickRequest, setPickRequest] = useState<{
    readonly id: string;
    readonly serial: number;
    readonly keepSky?: boolean;
  } | null>(null);
  const [featureRequest, setFeatureRequest] = useState<{ readonly key: string; readonly serial: number } | null>(null);
  const [viewLink, setViewLink] = useState<{ readonly url: string; readonly copied: boolean } | null>(null);
  /** The ids the camera's last request named (a preset, a host `setCamera`, a story panel's camera): the one rule below holds the camera when one of them stops being shown. */
  const cameraNamed = useRef<readonly string[]>([]);
  const noteCameraIds = (request: CameraRequest) => {
    const { bodies, toward } = cameraIdsOf(request);
    cameraNamed.current = toward === undefined ? bodies : [...bodies, toward];
  };
  const updateCameraRequest = useCallback(
    (request: ExperienceCameraRequest) => {
      noteCameraIds(request as CameraRequest);
      controls.current.cameraRequest = aimAtFigure(request as CameraRequest, runtime.skyFigures);
    },
    [runtime],
  );
  const turnToFigure = useCallback(
    (id: string) => {
      const now = controls.current.viewReadout;
      if (now !== undefined && "lookOut" in now)
        updateCameraRequest({ kind: "lookOut", body: now.lookOut, direction: id });
    },
    [updateCameraRequest],
  );
  const holdCamera = useCallback(() => {
    cameraNamed.current = [];
    controls.current.cameraRequest = { kind: "hold" };
  }, []);
  /** O-071 (I-175): whatever named the camera's target, once that object is not shown at `timeUtcMs` the camera keeps its pose and stops following (`shownAt`, via `hiddenWithShownSpans`). */
  const holdCameraOffShown = useCallback(
    (timeUtcMs: number) => {
      if (cameraNamed.current.length === 0) return;
      const out = hiddenWithShownSpans(undefined, experience.objects, timeUtcMs)?.objects;
      if (out !== undefined && cameraNamed.current.some((id) => out.has(id))) holdCamera();
    },
    [experience, holdCamera],
  );
  const requestPanel = useCallback(
    (id: string) => setPanelRequest((previous) => ({ id, serial: (previous?.serial ?? 0) + 1 })),
    [],
  );
  const requestPick = useCallback(
    (id: string, options?: { readonly keepSky?: boolean }) =>
      setPickRequest((previous) => ({
        id,
        serial: (previous?.serial ?? 0) + 1,
        ...(options?.keepSky === true ? { keepSky: true } : {}),
      })),
    [],
  );
  const requestFeature = useCallback(
    (key: string) => setFeatureRequest((previous) => ({ key, serial: (previous?.serial ?? 0) + 1 })),
    [],
  );
  const markOpenFeature = useCallback((key: string | null) => {
    controls.current.openFeatureKey = key;
  }, []);
  const setPlaying = useCallback(
    (playing: boolean) => {
      if (playing) runtime.clock.play();
      else runtime.clock.pause();
      setClockSnapshot(runtime.clock.snapshot());
    },
    [runtime],
  );
  controls.current.onStoryMarker = requestPanel;
  controls.current.onFeatureMarker = requestFeature;
  controls.current.onPickObject = requestPick;
  // A tap on a host label that selects a panel: a shelf part opens as the host's `setOpen` does, any other id is a story panel (as a story marker's press).
  controls.current.onLabelPanel = (id) => {
    if (definition.parts?.some((part) => part.id === id) === true) shelf.control?.setOpen(id, true);
    else requestPanel(id);
  };
  const updateScale = useCallback(
    (id: ScaleId) => {
      controls.current.policy = scalePolicyFor(id, suppliedPolicies);
      setScale(id);
    },
    [suppliedPolicies],
  );

  // The view showing is read from a ref set at the switch, so a publish right after a switch already names the new view.
  const viewRef = useRef(viewId);
  const chooseView = useCallback(
    (id: string) => {
      viewRef.current = id;
      controls.current.hostCameraRequest = null; // a host camera call counts from this switch on
      controls.current.viewHidden = hiddenByView(definition.views, viewById(definition.views, id), experience);
      // The showing view's events choose the pacing zones; a paced rate that changes with them eases in rather than jumping.
      if (controls.current.pace !== undefined) {
        controls.current.pace.shown = shownEventsOf(definition, id);
        if (controls.current.paceAuto === true)
          startPaceEase(controls.current.pace, runtime.clock.rate, performance.now());
      }
      setViewId(id);
    },
    [definition, experience, runtime],
  );
  const viewIds = useMemo(() => definition.views?.views.map((view) => view.id) ?? [], [definition]);
  // The presentation a host reads and sets (looks, switches, scale), rebuilt every render over the live controls; the stable callbacks below call through it.
  const live = useRef<LivePresentation | null>(null);
  const stateNow = useCallback((): ViewerState => {
    const snapshot = runtime.clock.snapshot();
    return {
      ...snapshot,
      scale: controls.current.policy.id,
      look: lookReadOf(controls.current),
      switches: live.current?.switches() ?? {},
      ...(runtime.pacing === undefined ? {} : { auto: controls.current.paceAuto === true }),
      ...(runtime.eventZones === undefined
        ? {}
        : {
            zones: activeEventZones(runtime.eventZones, shownEventsOf(definition, viewRef.current), snapshot.timeUtcMs),
          }),
      ...(definition.views === undefined ? {} : { view: viewRef.current }),
      ...(selection.id() === "" ? {} : { selected: selection.id() }),
      ...(controls.current.openStoryPanelId == null ? {} : { panel: controls.current.openStoryPanelId }),
    };
  }, [runtime, definition, selection]);
  // A selection that changes is told to the host at once (the shell calls this for a menu choice, a pick and a view switch that drops the object); the opening selection and any before the host is attached wait for the attach reading.
  const hostAttached = useRef(false);
  // The presentation (scale, looks, switches) last told to the host, to find what a visitor changed.
  const shownKey = useRef<string | null>(null);
  const hostSetSelected = useCallback((id: string | undefined) => selection.ask(id ?? "", false), [selection]);
  const hostSetPanel = useCallback((id: string | undefined) => {
    controls.current.openStoryPanelId = id ?? null; // `read()` shows it at once
    setPanelRequest((previous) => ({ id: id ?? "", serial: (previous?.serial ?? 0) + 1, host: true }));
  }, []);
  const panelIds = useCallback((): readonly string[] => {
    const set = definition.experience.storyPanels;
    const hidden = controls.current.viewHidden?.panels;
    return [...(set?.panels ?? []), ...(set?.steps ?? [])]
      .map(({ id }) => id)
      .filter((id) => hidden === undefined || !hidden.has(id));
  }, [definition]);
  // `origin` "move": time or the view moved and the selection followed (a drop or a view rule's framing target); the link names whatever last moved them (a host call, the visitor or playback).
  useEffect(
    () =>
      selection.onMove((_id, origin) => {
        if (hostAttached.current) host?.publishSelection(stateNow(), origin === "move");
      }),
    [selection, host, stateNow],
  );
  useEffect(() => {
    const id = window.setInterval(() => {
      // The readout wraps, stops and paces with the scene, so the shown time never rests past the end while looping and a host's playback reports follow the slow-downs.
      frameTime(runtime, controls.current);
      // An unchanged clock keeps the same snapshot, so a paused viewer does not re-render ten times a second.
      setClockSnapshot((prev) => {
        const next = runtime.clock.snapshot();
        return sameClock(prev, next) ? prev : next;
      });
      host?.publish(stateNow(), "playback");
    }, 100);
    return () => window.clearInterval(id);
  }, [runtime, host, stateNow]);
  // The host reaches the one clock through the same seek and rate handlers a visitor's timeline uses.
  const seekTo = useCallback(
    (timeUtcMs: number) => {
      runtime.clock.seek(timeUtcMs);
      if (controls.current.pace !== undefined) delete controls.current.pace.last; // the paced step starts again from the new time
      // A seek lands on the paced rate for the new time at once, not through a view-switch ease.
      if (controls.current.pace !== undefined) {
        delete controls.current.pace.ease;
        if (controls.current.paceAuto === true && runtime.pacing !== undefined)
          applyPacing(runtime.clock, runtime.pacing, controls.current.pace);
      }
      setClockSnapshot(runtime.clock.snapshot());
    },
    [runtime],
  );
  // A host's time jump is a seek for story panels, as a visitor's is: the shell's note re-bases the crossing check first.
  const storySeekNote = useRef<((timeUtcMs: number) => void) | null>(null);
  const hostSeekTo = useCallback(
    (timeUtcMs: number) => {
      storySeekNote.current?.(timeUtcMs);
      seekTo(timeUtcMs);
    },
    [seekTo],
  );
  // A speed picked by the visitor or the host takes over from pacing; "auto" gives the rate back to it.
  const [paceAuto, setPaceAuto] = useState(controls.current.paceAuto === true);
  const changeRate = useCallback(
    (rate: number | "auto") => {
      if (rate === "auto") {
        if (controls.current.pace !== undefined) delete controls.current.pace.ease;
        if (runtime.pacing !== undefined) applyPacing(runtime.clock, runtime.pacing, controls.current.pace);
      } else runtime.clock.setRate(rate);
      controls.current.paceAuto = rate === "auto";
      setPaceAuto(rate === "auto");
      setClockSnapshot(runtime.clock.snapshot());
    },
    [runtime],
  );
  // The same play handler the visitor's button reaches, so a host and a visitor share one clock.
  const hostSetPlaying = setPlaying;
  // The objects a host may point the camera at: those the showing view shows and that are shown at the clock time (read live, so a view switch or a time move is already counted).
  const cameraTargets = useCallback((): readonly string[] => {
    const hidden = hiddenWithShownSpans(
      controls.current.viewHidden,
      experience.objects,
      runtime.clock.snapshot().timeUtcMs,
    )?.objects;
    return experience.objects.map(({ id }) => id).filter((id) => hidden === undefined || !hidden.has(id));
  }, [experience, runtime]);
  const opening = useMemo(() => openingCamera(definition, runtime, search), []); // eslint-disable-line react-hooks/exhaustive-deps -- opening is read once at mount, on purpose: later scene or address changes must not move the camera
  const readCamera = useCallback((): CameraView | undefined => {
    const view = controls.current.viewReadout ?? opening;
    return view === undefined ? undefined : { ...view };
  }, [opening]);
  // A host camera call is the last word: it is also kept in `hostCameraRequest`, so the opening view (first frame) and a view's own camera rule (shell) yield to it.
  const setCamera = useCallback(
    (request: CameraRequest) => {
      noteCameraIds(request);
      controls.current.cameraRequest = controls.current.hostCameraRequest = aimAtFigure(request, runtime.skyFigures);
    },
    [runtime],
  );
  const hostCameraSet = useCallback(() => controls.current.hostCameraRequest != null, []);
  const hostScales = useMemo(() => scaleChoiceIds ?? SCALE_CHOICES.map((choice) => choice.id), [scaleChoiceIds]);
  const hostSetLook = useCallback((look: LookInput) => live.current?.setLook(look), []);
  const hostSetScale = useCallback((id: ScaleId) => live.current?.setScale(id), []);
  const hostClearSkyTrace = useCallback((id: string, seconds: number) => {
    controls.current.skyTraces.push({ id, seconds, reduced: prefersReducedMotion() });
  }, []);
  const hostTraceSkyFigure = useCallback((id: string, seconds: number, after: SkyTraceAfter) => {
    controls.current.skyTraces.push({ id, seconds, after, reduced: prefersReducedMotion() });
  }, []);
  const hostSetSwitch = useCallback((id: string, on: boolean) => live.current?.setSwitch(id, on), []);
  // The host's group looks belong to this scene's groups: a viewer rebuilt with a new scene starts from that scene's own colours and sizes.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runtime is the reset key: a new scene starts a fresh map
  const groupLooks = useMemo(() => new Map<string, GroupDotLook>(), [runtime]);
  const groupIds = useMemo(() => runtime.groups.map((layer) => layer.object.id), [runtime]);
  const hostGroupLook = useCallback(
    (id: string): GroupDotLook | undefined => {
      const layer = runtime.groups.find((candidate) => candidate.object.id === id);
      return layer === undefined
        ? undefined
        : (groupLooks.get(id) ?? { color: layer.color, dotSizePx: layer.pointSizePx ?? DEFAULT_POINT_SIZE_PX });
    },
    [runtime, groupLooks],
  );
  const hostSetGroupLook = useCallback(
    (id: string, look: GroupDotLook) => {
      groupLooks.set(id, { color: look.color, dotSizePx: look.dotSizePx });
    },
    [groupLooks],
  );
  /** The figure the open story panel traced when it opened; it is cleared (default fade) when the panel is left. */
  const panelTrace = useRef<string | null>(null);
  /** The panel whose actions were last applied (a host `setPanel` shows its panel at once, so `openStoryPanelId` cannot say whether the shell has opened it yet). */
  const actedPanel = useRef<string | null>(null);
  /** Whether the objects a story panel's camera names are shown at the clock time; a request toward one outside its `shownDuring` span is refused as `setCamera` refuses it. */
  const shownAtClock = useCallback(
    (request: CameraRequest): boolean => {
      const out = hiddenWithShownSpans(undefined, experience.objects, runtime.clock.snapshot().timeUtcMs)?.objects;
      const { bodies, toward } = cameraIdsOf(request);
      return out === undefined || ![...bodies, ...(toward === undefined ? [] : [toward])].some((id) => out.has(id));
    },
    [experience, runtime],
  );
  shelfCamera.current = (request) => {
    if (shownAtClock(request)) setCamera(request);
  };
  /** The shell's open panel changed (a visitor, a host call already shown, playback crossing a panel, or a view switch dropping it); a change is told to the host, the opening panel is read at attach. */
  const markOpenPanel = useCallback(
    (id: string | null, cause: PanelCause) => {
      const changed = (controls.current.openStoryPanelId ?? null) !== id;
      controls.current.openStoryPanelId = id;
      if (changed && hostAttached.current) host?.publishPanel(stateNow(), cause);
      if (actedPanel.current === id) return;
      actedPanel.current = id;
      // Leaving a panel clears the trace it started; what a host or visitor did since is left as it is.
      if (panelTrace.current !== null) hostClearSkyTrace(panelTrace.current, TRACE_FADE_SECONDS);
      panelTrace.current = null;
      const set = definition.experience.storyPanels;
      const panel =
        id === null
          ? undefined
          : [...(set?.panels ?? []), ...(set?.steps ?? [])].find((candidate) => candidate.id === id);
      if (panel === undefined) return;
      // The panel's actions go through the host calls, in this order: camera, select, trace.
      if (panel.camera !== undefined && shownAtClock(panel.camera as CameraRequest))
        setCamera(panel.camera as CameraRequest);
      if (panel.select === true && panel.objectId !== undefined) selection.ask(panel.objectId, true);
      if (panel.trace !== undefined && panel.objectId !== undefined) {
        hostTraceSkyFigure(panel.objectId, panel.trace.seconds, panel.trace.after);
        panelTrace.current = panel.objectId;
      }
    },
    [host, stateNow, definition, setCamera, shownAtClock, selection, hostTraceSkyFigure, hostClearSkyTrace],
  );
  useEffect(() => {
    if (host === undefined) return undefined;
    hostAttached.current = true;
    shownKey.current = null; // the presentation is read afresh after each attach
    controls.current.groupLooks = groupLooks;
    host.attach({
      about: definition.about,
      ...(shelf.control === undefined ? {} : { parts: shelf.control }),
      ...(definition.picker === undefined
        ? {}
        : {
            picker: {
              id: definition.picker.id,
              values: definition.picker.options.map((option) => option.value),
              start: definition.picker.value,
            },
          }),
      window: runtime.loopWindow,
      skyFigures: skyFigureReads(runtime.skyFigures, experience.skyFigures),
      events: experience.events,
      rates: definition.experience.rates,
      paced: runtime.pacing !== undefined,
      read: stateNow,
      seek: hostSeekTo,
      setRate: changeRate,
      playable: definition.experience.hideTimeline !== true,
      setPlaying: hostSetPlaying,
      views: viewIds,
      setView: chooseView,
      cameraTargets,
      readCamera,
      setCamera,
      setSelected: hostSetSelected,
      panels: panelIds,
      setPanel: hostSetPanel,
      scales: hostScales,
      setScale: hostSetScale,
      setLook: hostSetLook,
      setSwitch: hostSetSwitch,
      traceSkyFigure: hostTraceSkyFigure,
      clearSkyTrace: hostClearSkyTrace,
      groups: groupIds,
      groupLook: hostGroupLook,
      setGroupLook: hostSetGroupLook,
    });
    return () => {
      hostAttached.current = false;
      host.detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stateNow is read through host.read; adding it would re-attach the host whenever it changes
  }, [
    host,
    runtime,
    definition,
    hostSeekTo,
    changeRate,
    viewIds,
    chooseView,
    cameraTargets,
    readCamera,
    setCamera,
    hostSetSelected,
    panelIds,
    hostSetPanel,
    experience,
    hostSetPlaying,
    hostScales,
    hostSetScale,
    hostSetLook,
    hostSetSwitch,
    hostTraceSkyFigure,
    hostClearSkyTrace,
    groupLooks,
    groupIds,
    hostGroupLook,
    hostSetGroupLook,
    shelf.control,
  ]);

  const viewChoice: ViewChoice | undefined =
    definition.views === undefined
      ? undefined
      : {
          place: definition.views.place,
          options: definition.views.views.map((view) => ({
            id: view.id,
            label: view.label,
            ...(view.shortLabel === undefined ? {} : { shortLabel: view.shortLabel }),
            active: view.id === currentView?.id,
          })),
          onSelect: (id) => {
            chooseView(id);
            host?.publish(stateNow(), "visitor");
          },
        };
  const bindingsNow = (): SwitchBindings => ({
    settings: definition.displaySwitches,
    orbit: { present: orbitPaths.length > 0, look: { ...orbitDefault, ...controls.current.orbitLook }, set: setOrbit },
    moons: {
      present: bodySets.length > 0,
      look: controls.current.bodySetLook ?? DEFAULT_BODY_SET_LOOK,
      set: changeSetLook,
    },
    skyLines: {
      figures: runtime.skyFigures.some(({ kind }) => kind === "figure"),
      boundaries: runtime.skyFigures.some(({ kind }) => kind === "boundary"),
      on: controls.current.skyLines,
      set: (key, on) => {
        controls.current.skyLines = { ...controls.current.skyLines, [key]: on };
        setSkyLinesShown(controls.current.skyLines);
      },
    },
    sky: {
      present: controls.current.skyVisible !== false,
      on: controls.current.showMilkyWay,
      set: (on) => {
        controls.current.showMilkyWay = on;
        setMilkyWayOn(on);
      },
    },
    labels: {
      objectIds: labelIdsOf(experience, definition),
      hidden: controls.current.hiddenLabels ?? hiddenLabels,
      setHidden: (hidden) => {
        controls.current.hiddenLabels = new Set(hidden);
        setHiddenLabels(new Set(hidden));
      },
      anchorsPresent: runtime.trackedBodies.length > 0,
      anchors: controls.current.showAnchorLabels,
      setAnchors: (on) => {
        controls.current.showAnchorLabels = on;
        setAnchorLabels(on);
      },
    },
  });
  const displaySwitches = displaySwitchItems(bindingsNow());
  live.current = presentationOf({
    setLook: (look) => {
      const read = applyLook(controls.current, definition, glowBase, look);
      setStarBrightness(read.starBrightness);
      setMilkyWayBrightness(read.milkyWayBrightness);
      setMilkyWayOn(read.milkyWay);
      setSkyVisible(read.skyVisible);
      if (read.sunGlow !== undefined) setGlowShown({ ...controls.current.glowLook! });
      setMarkerPx(read.markerSwapRadiusPx);
      setLoadFade(read.loadFadeSeconds);
      setSkyColoursShown(controls.current.skyColours);
      setLabelStyleShown(controls.current.labelStyle);
      setTimeLookShown(controls.current.timeLook);
      setSheetShown(read.sheetMaxPercent);
      setInterfaceShown(controls.current.interfaceLook);
    },
    setScale: updateScale,
    items: () => displaySwitchItems({ ...bindingsNow(), settings: hostReachable(definition.displaySwitches) }),
  });
  // A change the visitor made (the scale or a switch in the shell, a slider or button in the Developer drawer) is told to the host once the screen has it; a host call has already been told, so this finds nothing new.
  useEffect(() => {
    if (!hostAttached.current) return;
    const state = stateNow();
    const key = JSON.stringify([state.scale, state.look, state.switches]);
    const changed = shownKey.current !== null && shownKey.current !== key;
    shownKey.current = key;
    if (changed) host?.publish(state, "visitor");
  }, [
    host,
    stateNow,
    scale,
    skyVisible,
    starBrightness,
    milkyWayBrightness,
    milkyWayOn,
    glowShown,
    markerPx,
    loadFade,
    orbitShown,
    setLook,
    hiddenLabels,
    anchorLabels,
    skyLinesShown,
    skyColoursShown,
    labelStyleShown,
    timeLookShown,
    sheetShown,
    interfaceShown,
  ]);
  const hasStoryPanels = (storySet?.panels.length ?? 0) > 0;
  const showDisplay = showsDisplayControls(definition, runtime, skyVisible, orbitPaths.length, storyMarkerSpecs.length);
  const drawer = (
    <PanelLoadBoundary>
      <Suspense
        fallback={
          <p className="developer-loading" role="status">
            Loading developer tools...
          </p>
        }
      >
        <DeveloperDrawer
          controls={controls}
          readout={readout}
          runtime={runtime}
          showDisplay={showDisplay}
          camera={{
            upChoice,
            setUpChoice,
            markerPx,
            setMarkerPx,
            loadFade,
            setLoadFade,
            loopOn,
            setLoopOn,
            scale,
            offered: address === true,
            viewId: () => (definition.views === undefined ? undefined : viewRef.current),
            viewLink,
            setViewLink,
          }}
          timeline={{
            glow: timelineGlow,
            setGlow: setTimelineGlow,
            accent: interfaceShown.accent,
            story: hasStoryPanels
              ? { storyAutoOpen, setStoryAutoOpen, storyPauseSeconds, setStoryPauseSeconds }
              : undefined,
          }}
          orbit={{ present: orbitPaths.length > 0, shown: orbitShown, set: setOrbit, reset: resetOrbit }}
          moons={{ bodySets, ringSystems, setLook, changeSetLook, ringLook, changeRing, setSetLook, setRingLook }}
          sky={{
            illuminateAll,
            setIlluminateAll,
            visible: skyVisible,
            glowShown,
            setGlowShown,
            milkyWayOn,
            setMilkyWayOn,
            starBrightness,
            setStarBrightness,
            milkyWayBrightness,
            setMilkyWayBrightness,
          }}
          labels={{
            hoverBrightness,
            setHoverBrightness,
            labelToggles,
            trackedCount: runtime.trackedBodies.length,
            anchorLabels,
            setAnchorLabels,
            hiddenLabels,
            setHiddenLabels,
            labelStyle: labelStyleShown,
            setLabelStyle: setLabelStyleShown,
            skyColours: skyColoursShown,
            setSkyColours: setSkyColoursShown,
            hasSky: skyVisible,
          }}
          phone={{
            layout: phoneLayout,
            own: phoneLayoutOwn,
            setOwn: setPhoneLayout,
            setSheetShown,
            setInterfaceShown,
          }}
        />
      </Suspense>
    </PanelLoadBoundary>
  );

  return (
    <AstraeusShell
      experience={shellExperience}
      snapshot={clockSnapshot}
      paceAuto={runtime.pacing === undefined ? undefined : paceAuto}
      developerMode={developerMode}
      labelStyle={labelStyleShown}
      interfaceLook={interfaceShown}
      timeLook={timeLookShown}
      onDeveloperModeChange={setDeveloperMode}
      onTogglePlayback={() => {
        if (runtime.clock.playing) runtime.clock.pause();
        else runtime.clock.play();
        setClockSnapshot(runtime.clock.snapshot());
        host?.publish(stateNow(), "visitor");
      }}
      onRateChange={(rate) => {
        changeRate(rate);
        host?.publish(stateNow(), "visitor");
      }}
      onSeek={(timeUtcMs) => {
        seekTo(timeUtcMs);
        host?.publish(stateNow(), "visitor");
      }}
      onCameraRequest={updateCameraRequest}
      onTurnToFigure={turnToFigure}
      onCameraHold={holdCamera}
      onTimeShown={holdCameraOffShown}
      hostCameraSet={hostCameraSet}
      storySeekNote={storySeekNote}
      selection={selection}
      scaleId={scale}
      onScaleChange={updateScale}
      scaleChoices={scaleChoices}
      switcher={
        definition.picker === undefined
          ? undefined
          : pickerSwitch(definition.picker, hostPick ?? definition.picker.value, choosePick)
      }
      about={about}
      shelfParts={shelf.shown}
      shelfRuntime={shelf.runtime}
      shelfRequest={shelf.request}
      onOpenShelfChange={shelf.onOpenChange}
      displaySwitches={displaySwitches}
      viewChoice={viewChoice}
      viewCamera={currentView === undefined ? undefined : { id: currentView.id, rule: currentView.camera }}
      metricsFor={metricsFor}
      developerTools={drawerWhen(developerTools, drawer)}
      storyPanelSettings={liveStorySettings(storySet, storyAutoOpen, storyPauseSeconds)}
      timelineGlow={timelineGlow}
      phoneLayout={phoneLayout}
      highlightedFamily={setLook.highlightFamily}
      onHighlightFamily={highlightFamily}
      onSetPlaying={setPlaying}
      panelRequest={panelRequest}
      onOpenPanelChange={markOpenPanel}
      featureRequest={featureRequest}
      pickRequest={pickRequest}
      onOpenFeatureChange={markOpenFeature}
    >
      <div className="canvas-host">
        <AstraeusScene
          runtime={runtime}
          controls={controls.current}
          readout={readout}
          scaleId={scale}
          onFirstDraw={host === undefined ? undefined : told}
        />
      </div>
    </AstraeusShell>
  );
}
