import { lazy, Suspense, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import type { ClockSnapshot } from "../core/clock";
import type { TimelineEvent } from "../core/events";
import type { TimelineWindow } from "../core/timeWindow";
import { StoryPanelView } from "./StoryPanelView";
import { useDrawers } from "./useDrawers";
import { useStoryPanels, type StoryPanelSettings } from "./useStoryPanels";
import { TimelineBar } from "./TimelineBar";
import type { TimelineGlowLook } from "./timelineGlow";
import type { ExperienceCameraPreset, ExperienceConfig } from "./experience";
import { InfoPanel } from "./InfoPanel";
import { infoView } from "./infoModel";
import type { Metric } from "./metrics";
import { PanelLoadBoundary } from "../app/PanelLoadBoundary";
import { ControlsDrawer } from "./ControlsDrawer";
import { isEmbedded } from "./embedded";
import { DEFAULT_PHONE_LAYOUT, phoneLayoutStyle, pickOpensInfo, usePhone, type PhoneLayoutSettings } from "./phoneLayout";
import type { DisplaySwitchItem } from "./DisplaySwitches";
import type { ExperienceSwitch } from "./SwitchControl";
import { DeveloperToggle, TopBar } from "./TopBar";
import type { ScaleChoice, ScaleId } from "./scaleModel";
import { availableObjectById, findCameraPreset, firstAvailableObject, focusPresetFor, isObjectAvailable } from "./objectModel";
import "./controls.css";
import "./style.css";
import "./phone.css";
import "./embedded.css";

/** Keeps `--timeline-space` at the distance from the screen's bottom to the top of the timeline bar, so a phone sheet can sit above it. */
function useTimelineSpace(root: { readonly current: HTMLElement | null }, phone: boolean): void {
  useEffect(() => {
    const shell = root.current;
    const bar = shell?.querySelector<HTMLElement>(".timeline-bar") ?? null;
    if (shell === null || bar === null || typeof ResizeObserver === "undefined") return undefined;
    const measure = () => shell.style.setProperty("--timeline-space", `${Math.ceil(window.innerHeight - bar.getBoundingClientRect().top)}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); shell.style.removeProperty("--timeline-space"); };
  }, [root, phone]);
}

/** The object selected when the shell opens: the first one available at the clock time, else the first listed. */
export function initialObjectId(experience: ExperienceConfig, timeUtcMs: number): string {
  const start = experience.cameraPresets.find((preset) => preset.id === experience.startCameraPresetId)?.request;
  if (start !== undefined && start.kind !== "overview" && experience.objects.some((object) => object.id === start.target)) return start.target;
  return firstAvailableObject(experience, timeUtcMs)?.id ?? experience.objects[0]?.id ?? "";
}

/** The story-panel settings the experience carries itself, used when the app gives none live. */
function ownStorySettings(storySet: ExperienceConfig["storyPanels"]): StoryPanelSettings {
  return { autoOpen: storySet?.autoOpen ?? false, pauseSeconds: storySet?.pauseSeconds ?? 0 };
}

/** The timeline bar, or nothing when the experience says it has no timeline. */
function ShellTimeline({ hidden, ...bar }: ComponentProps<typeof TimelineBar> & { readonly hidden: boolean }) {
  return hidden ? null : <TimelineBar {...bar} />;
}

/** The wide-screen moons toggle and the sheet it opens under the toolbar. */
function MoonsSheet({ planetLabel, open, onToggle, onClose, children }: { readonly planetLabel: string | undefined; readonly open: boolean; readonly onToggle: () => void; readonly onClose: () => void; readonly children: ReactNode }) {
  return (
    <>
      <button type="button" className="moons-toggle ui-pill" aria-expanded={open} aria-controls="moons-panel" onClick={onToggle}>
        {planetLabel} moons
      </button>
      <aside id="moons-panel" className="moons-sheet" data-open={open} aria-label="Moons by family" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
        {children}
      </aside>
    </>
  );
}

interface Props {
  readonly experience: ExperienceConfig;
  readonly snapshot: ClockSnapshot;
  readonly developerMode: boolean;
  readonly onDeveloperModeChange: (enabled: boolean) => void;
  readonly onTogglePlayback: () => void;
  readonly onRateChange: (rate: number | "auto") => void;
  /** Only for a scene with pacing: whether pacing sets the rate now (the speed menu then shows Auto). */
  readonly paceAuto?: boolean | undefined;
  readonly onSeek: (timeUtcMs: number) => void;
  readonly onCameraRequest: (request: ExperienceCameraPreset["request"]) => void;
  readonly onSelectionChange: (objectId: string) => void;
  readonly scaleId: ScaleId;
  readonly onScaleChange: (id: ScaleId) => void;
  readonly scaleChoices?: readonly ScaleChoice[];
  /** A choice between versions of the experience (top bar and phone drawer); absent: none. */
  readonly switcher?: ExperienceSwitch;
  /** Display switches a story placed in the top bar or its switch panel (also in the phone drawer); absent or empty: none. */
  readonly displaySwitches?: readonly DisplaySwitchItem[];
  /** Live measurements for an object's info panel, from the app's own State; empty when it has none. */
  readonly metricsFor?: (objectId: string, timeUtcMs: number) => readonly Metric[];
  readonly developerTools?: ReactNode;
  /** The live story-panel settings (auto-open, pause length); absent: the experience's own defaults. */
  readonly storyPanelSettings?: StoryPanelSettings;
  /** The live look of the timeline's activity glow; absent: the defaults. */
  readonly timelineGlow?: TimelineGlowLook;
  /** The phone layout's live numbers (drawer heights, animation, swipe distance); absent: the defaults. */
  readonly phoneLayout?: PhoneLayoutSettings;
  /** The family of moons lit up in the scene now (the moon panel's choice), or null; the app draws it. */
  readonly highlightedFamily?: string | null;
  readonly onHighlightFamily?: (familyId: string | null) => void;
  /** Starts or holds playback; the shell uses it to pause while a panel opens by itself. */
  readonly onSetPlaying?: (playing: boolean) => void;
  /** Asks the shell to open a panel (a scene marker was pressed); a new `serial` asks again. */
  readonly panelRequest?: { readonly id: string; readonly serial: number } | null;
  /** Called when the open panel changes, so the app can mark its scene marker. */
  readonly onOpenPanelChange?: (panelId: string | null) => void;
  /** Asks the shell to open a tagged place's information (a place marker was pressed); a new `serial` asks again. */
  readonly featureRequest?: { readonly key: string; readonly serial: number } | null;
  /** Called with the key of the place whose information is open, or null, so the app can mark its scene marker. */
  readonly onOpenFeatureChange?: (key: string | null) => void;
  /** Asks the shell to fly to an object a tap or click picked in the scene (focus only, no information); a new `serial` asks again. */
  readonly pickRequest?: { readonly id: string; readonly serial: number } | null;
  readonly children: ReactNode;
}

/** What the information panel is about: the selected object, or an event, window or place by id; null: closed. */
type InfoState = { readonly kind: "object" } | { readonly kind: "event"; readonly id: string } | { readonly kind: "window"; readonly id: string } | { readonly kind: "feature"; readonly id: string } | null;

/** The serial of a request that is asked again by sending a new one; absent request: undefined. */
function serialOf(request: { readonly serial: number } | null | undefined): number | undefined {
  return request?.serial;
}

function panelsOf(storySet: ExperienceConfig["storyPanels"]) {
  return storySet?.panels ?? [];
}

function objectLabelOr(experience: ExperienceConfig, objectId: string, fallback: string): string {
  return experience.objects.find((object) => object.id === objectId)?.label ?? fallback;
}

/** The information panel's content and, for an object, its live measurements. */
function infoContent(experience: ExperienceConfig, info: InfoState, selectedObjectId: string, timeUtcMs: number, metricsFor: Props["metricsFor"]) {
  const view = info === null
    ? null
    : infoView(experience, info.kind === "object" ? { kind: "object", id: selectedObjectId } : info, timeUtcMs);
  const metrics = view?.target.kind === "object" && metricsFor !== undefined ? metricsFor(view.target.id, timeUtcMs) : [];
  return { view, metrics };
}

/** The moon families load on demand: only an experience with `moonFamilies` draws them (I-089). */
const MoonFamilyPanel = lazy(() => import("./MoonFamilyPanel").then((module) => ({ default: module.MoonFamilyPanel })));

/** Canvas-first layout shared by astronomy experiences. Scene and diagnostics stay app-owned. */
export function AstraeusShell({
  experience,
  snapshot,
  developerMode,
  onDeveloperModeChange,
  onTogglePlayback,
  onRateChange,
  paceAuto,
  onSeek,
  onCameraRequest,
  onSelectionChange,
  scaleId,
  onScaleChange,
  scaleChoices,
  switcher,
  displaySwitches,
  metricsFor,
  developerTools,
  storyPanelSettings,
  timelineGlow,
  phoneLayout = DEFAULT_PHONE_LAYOUT,
  highlightedFamily = null,
  onHighlightFamily,
  onSetPlaying,
  panelRequest,
  onOpenPanelChange,
  featureRequest,
  onOpenFeatureChange,
  pickRequest,
  children,
}: Props) {
  const [selectedObjectId, setSelectedObjectId] = useState(() => initialObjectId(experience, snapshot.timeUtcMs));
  const phone = usePhone();
  /** Fixed for the page: a frame does not appear or vanish while the app runs. */
  const [embedded] = useState(isEmbedded);
  const root = useRef<HTMLElement | null>(null);
  // The drawer (with the moons in it) and the bottom sheets want the same screen: the drawer, being the one just asked for, takes it.
  const { controlsOpen, timelineOpen, openControls, openTimeline } = useDrawers(phone, () => {
    if (experience.moonFamilies !== undefined) { setInfo(null); story.close(); }
  });
  useTimelineSpace(root, phone);
  const [activePresetId, setActivePresetId] = useState<string | null>(experience.startCameraPresetId ?? null);
  /** The object panel follows the selected object; an event panel names its event. */
  const [info, setInfo] = useState<InfoState>(null);

  const storySet = experience.storyPanels;
  const storyPanels = panelsOf(storySet);
  const story = useStoryPanels(storyPanels, storyPanelSettings ?? ownStorySettings(storySet), snapshot, onSetPlaying);
  const openPanelId = story.openPanel?.id ?? null;
  useEffect(() => { onOpenPanelChange?.(openPanelId); }, [onOpenPanelChange, openPanelId]);
  const requestedSerial = serialOf(panelRequest);
  useEffect(() => {
    if (panelRequest !== null && panelRequest !== undefined) story.open(panelRequest.id);
    // Only a new request opens a panel; the open function is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedSerial]);
  const requestedFeatureSerial = serialOf(featureRequest);
  useEffect(() => {
    if (featureRequest !== null && featureRequest !== undefined) setInfo({ kind: "feature", id: featureRequest.key });
    // Only a new request opens a place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedFeatureSerial]);
  const openFeatureKey = info?.kind === "feature" ? info.id : null;
  useEffect(() => { onOpenFeatureChange?.(openFeatureKey); }, [onOpenFeatureChange, openFeatureKey]);
  /** Every time change a person makes goes through here, so a seek is never mistaken for playback crossing a panel. */
  const seek = (timeUtcMs: number) => {
    story.noteSeek(timeUtcMs);
    onSeek(timeUtcMs);
  };
  const openPanelFromTimeline = (panel: { readonly id: string; readonly timeUtcMs: number }) => {
    seek(panel.timeUtcMs);
    story.open(panel.id);
  };

  useEffect(() => {
    onSelectionChange(selectedObjectId);
  }, [onSelectionChange, selectedObjectId]);

  useEffect(() => {
    const selected = experience.objects.find((object) => object.id === selectedObjectId);
    if (selected === undefined || !isObjectAvailable(selected, snapshot.timeUtcMs)) {
      const fallbackId = firstAvailableObject(experience, snapshot.timeUtcMs)?.id ?? "";
      setSelectedObjectId(fallbackId);
      onSelectionChange(fallbackId);
    }

    const active = experience.cameraPresets.find((preset) => preset.id === activePresetId);
    const activeRequest = active?.request;
    if (activeRequest !== undefined && activeRequest.kind !== "overview") {
      const target = experience.objects.find((object) => object.id === activeRequest.target);
      if (target === undefined || !isObjectAvailable(target, snapshot.timeUtcMs)) {
        const overview = findCameraPreset(experience, "overview");
        if (overview !== undefined) {
          setActivePresetId(overview.id);
          onCameraRequest(overview.request);
        }
      }
    }
  }, [activePresetId, experience, onCameraRequest, onSelectionChange, selectedObjectId, snapshot.timeUtcMs]);

  const [moonsOpen, setMoonsOpen] = useState(false);
  /** A moon chosen in the moon panel: flies to it (the same focus as the object picker) and opens its information. */
  const chooseMoon = (id: string) => {
    const object = availableObjectById(experience, id, snapshot.timeUtcMs);
    if (object === undefined) return;
    activatePreset(focusPresetFor(experience, object));
    setInfo({ kind: "object" });
  };

  /** An object tapped or clicked in the scene: the picker's focus; on a wide screen it also opens the card, on a phone it does not (T-138). A tapped body-set member that is no listed object just flies there. */
  const pickObject = (id: string) => {
    const object = availableObjectById(experience, id, snapshot.timeUtcMs);
    if (object !== undefined) {
      activatePreset(focusPresetFor(experience, object));
      if (pickOpensInfo(phone)) setInfo({ kind: "object" });
    } else if (!experience.objects.some((candidate) => candidate.id === id)) onCameraRequest({ kind: "focus", target: id });
  };
  const requestedPickSerial = serialOf(pickRequest);
  useEffect(() => {
    if (pickRequest !== null && pickRequest !== undefined) pickObject(pickRequest.id);
    // Only a new request flies; the handler reads the current time and experience.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedPickSerial]);

  const selectObject = (id: string) => {
    const object = availableObjectById(experience, id, snapshot.timeUtcMs);
    if (object === undefined) return;
    setSelectedObjectId(id);
    onSelectionChange(id);
    setInfo({ kind: "object" });
    const active = experience.cameraPresets.find((preset) => preset.id === activePresetId);
    if (active?.request.kind === "focus" || active?.request.kind === "follow") {
      const next = findCameraPreset(experience, active.request.kind, id)
        ?? (active.request.kind === "follow" ? findCameraPreset(experience, "focus", id) : undefined);
      if (next !== undefined) {
        setActivePresetId(next.id);
        onCameraRequest(next.request);
      } else {
        const overview = findCameraPreset(experience, "overview");
        setActivePresetId(overview?.id ?? null);
        if (overview !== undefined) onCameraRequest(overview.request);
      }
    }
  };

  const activatePreset = (preset: ExperienceCameraPreset, atUtcMs: number = snapshot.timeUtcMs) => {
    if (preset.request.kind !== "overview") {
      const target = availableObjectById(experience, preset.request.target, atUtcMs);
      if (target === undefined) return;
      setSelectedObjectId(target.id);
      onSelectionChange(target.id);
    }
    setActivePresetId(preset.id);
    onCameraRequest(preset.request);
  };

  const seekToEvent = (event: TimelineEvent) => {
    seek(event.timeUtcMs);
    // The event's own object, framed as the picker's Focus does (and `camera.lookAt` opens): the event, never a default body, names it.
    const object = event.object === undefined ? undefined : availableObjectById(experience, event.object, event.timeUtcMs);
    if (object !== undefined) activatePreset(focusPresetFor(experience, object), event.timeUtcMs);
    if (info?.kind === "event") setInfo({ kind: "event", id: event.id });
  };

  const seekToWindow = (window: TimelineWindow, timeUtcMs: number) => {
    seek(timeUtcMs);
    if (info?.kind === "window") setInfo({ kind: "window", id: window.id });
  };

  const { view, metrics } = infoContent(experience, info, selectedObjectId, snapshot.timeUtcMs, metricsFor);

  // On a wide screen the moons sheet and the information panel share the left column under the toolbar: opening one closes the other.
  const toggleMoons = () => {
    if (!moonsOpen) setInfo(null);
    setMoonsOpen(!moonsOpen);
  };
  useEffect(() => { if (info !== null) setMoonsOpen(false); }, [info]);

  const selectedLabel = objectLabelOr(experience, selectedObjectId, "Controls");
  const topBar = (
    <TopBar
      experience={experience}
      timeUtcMs={snapshot.timeUtcMs}
      selectedObjectId={selectedObjectId}
      activePresetId={activePresetId}
      onSelectObject={selectObject}
      onCameraPreset={activatePreset}
      infoOpen={info?.kind === "object"}
      onToggleInfo={() => setInfo(info?.kind === "object" ? null : { kind: "object" })}
      scaleId={scaleId}
      onScaleChange={onScaleChange}
      scaleChoices={scaleChoices}
      switcher={switcher}
      displaySwitches={displaySwitches}
    />
  );

  const moonPanel = experience.moonFamilies === undefined ? null : (
    <PanelLoadBoundary message="The moon list could not load. Reload the page to try again.">
      <Suspense fallback={null}>
        <MoonFamilyPanel list={experience.moonFamilies} highlightedFamily={highlightedFamily} onHighlight={(id) => onHighlightFamily?.(id)} onSelectMoon={chooseMoon} />
      </Suspense>
    </PanelLoadBoundary>
  );

  return (
    <main className="astraeus-shell" ref={root} data-phone={phone} data-timeline-hidden={experience.hideTimeline === true} data-embedded={embedded} style={phoneLayoutStyle(phoneLayout)}>
      <div className="shell-canvas">{children}</div>
      {phone && <ControlsDrawer label={selectedLabel} open={controlsOpen} onOpenChange={openControls} swipeThresholdPx={phoneLayout.swipeThresholdPx}>{topBar}{moonPanel}</ControlsDrawer>}
      <div className="shell-top">
        {!phone && topBar}
        {!phone && moonPanel !== null && <MoonsSheet planetLabel={experience.moonFamilies?.planetLabel} open={moonsOpen} onToggle={toggleMoons} onClose={() => setMoonsOpen(false)}>{moonPanel}</MoonsSheet>}
        {view !== null && <InfoPanel view={view} metrics={metrics} onClose={() => setInfo(null)} />}
      </div>
      {story.openPanel !== null && (
        <StoryPanelView panel={story.openPanel} holding={story.holding} onClose={story.close} onContinue={story.continuePlayback} />
      )}
      <DeveloperToggle developerMode={developerMode} onDeveloperModeChange={onDeveloperModeChange} />
      <aside className="developer-tools" id="developer-tools" data-developer-panel="" aria-label="Developer diagnostics" hidden={!developerMode}>
        {developerMode ? developerTools : null}
      </aside>
      <ShellTimeline
        hidden={experience.hideTimeline === true}
        experience={experience}
        snapshot={snapshot}
        onTogglePlayback={onTogglePlayback}
        onRateChange={onRateChange}
        paceAuto={paceAuto}
        onSeek={seek}
        panels={storyPanels}
        openPanelId={openPanelId}
        onPanelOpen={openPanelFromTimeline}
        onEventSeek={seekToEvent}
        onEventInfo={(event) => setInfo({ kind: "event", id: event.id })}
        onWindowSeek={seekToWindow}
        onWindowInfo={(window) => setInfo({ kind: "window", id: window.id })}
        glowLook={timelineGlow}
        drawer={phone ? { open: timelineOpen, onOpenChange: openTimeline, swipeThresholdPx: phoneLayout.swipeThresholdPx } : undefined}
      />
    </main>
  );
}
