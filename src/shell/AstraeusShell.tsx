import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ClockSnapshot } from "../core/clock";
import type { TimelineEvent } from "../core/events";
import type { TimelineWindow } from "../core/timeWindow";
import { StoryPanelView } from "./StoryPanelView";
import { useStoryPanels, type StoryPanelSettings } from "./useStoryPanels";
import { TimelineBar } from "./TimelineBar";
import type { TimelineGlowLook } from "./timelineGlow";
import type { ExperienceCameraPreset, ExperienceConfig } from "./experience";
import { InfoPanel } from "./InfoPanel";
import { infoView } from "./infoModel";
import type { Metric } from "./metrics";
import { ControlsDrawer } from "./ControlsDrawer";
import { DEFAULT_PHONE_LAYOUT, phoneLayoutStyle, usePhone, type PhoneLayoutSettings } from "./phoneLayout";
import type { ExperienceSwitch } from "./SwitchControl";
import { DeveloperToggle, TopBar } from "./TopBar";
import type { ScaleChoice, ScaleId } from "./scaleModel";
import { availableObjectById, findCameraPreset, firstAvailableObject, isObjectAvailable } from "./objectModel";
import "./controls.css";
import "./style.css";
import "./phone.css";

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

interface Props {
  readonly experience: ExperienceConfig;
  readonly snapshot: ClockSnapshot;
  readonly developerMode: boolean;
  readonly onDeveloperModeChange: (enabled: boolean) => void;
  readonly onTogglePlayback: () => void;
  readonly onRateChange: (rate: number) => void;
  readonly onSeek: (timeUtcMs: number) => void;
  readonly onCameraRequest: (request: ExperienceCameraPreset["request"]) => void;
  readonly onSelectionChange: (objectId: string) => void;
  readonly scaleId: ScaleId;
  readonly onScaleChange: (id: ScaleId) => void;
  readonly scaleChoices?: readonly ScaleChoice[];
  /** A choice between versions of the experience (top bar and phone drawer); absent: none. */
  readonly switcher?: ExperienceSwitch;
  /** Live measurements for an object's info panel, from the app's own State; empty when it has none. */
  readonly metricsFor?: (objectId: string, timeUtcMs: number) => readonly Metric[];
  readonly developerTools?: ReactNode;
  /** The live story-panel settings (auto-open, pause length); absent: the experience's own defaults. */
  readonly storyPanelSettings?: StoryPanelSettings;
  /** The live look of the timeline's activity glow; absent: the defaults. */
  readonly timelineGlow?: TimelineGlowLook;
  /** The phone layout's live numbers (drawer heights, animation, swipe distance); absent: the defaults. */
  readonly phoneLayout?: PhoneLayoutSettings;
  /** Starts or holds playback; the shell uses it to pause while a panel opens by itself. */
  readonly onSetPlaying?: (playing: boolean) => void;
  /** Asks the shell to open a panel (a scene marker was pressed); a new `serial` asks again. */
  readonly panelRequest?: { readonly id: string; readonly serial: number } | null;
  /** Called when the open panel changes, so the app can mark its scene marker. */
  readonly onOpenPanelChange?: (panelId: string | null) => void;
  readonly children: ReactNode;
}

/** Canvas-first layout shared by astronomy experiences. Scene and diagnostics stay app-owned. */
export function AstraeusShell({
  experience,
  snapshot,
  developerMode,
  onDeveloperModeChange,
  onTogglePlayback,
  onRateChange,
  onSeek,
  onCameraRequest,
  onSelectionChange,
  scaleId,
  onScaleChange,
  scaleChoices,
  switcher,
  metricsFor,
  developerTools,
  storyPanelSettings,
  timelineGlow,
  phoneLayout = DEFAULT_PHONE_LAYOUT,
  onSetPlaying,
  panelRequest,
  onOpenPanelChange,
  children,
}: Props) {
  const [selectedObjectId, setSelectedObjectId] = useState(() =>
    firstAvailableObject(experience, snapshot.timeUtcMs)?.id ?? experience.objects[0]?.id ?? "",
  );
  const phone = usePhone();
  const root = useRef<HTMLElement | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  /** The two drawers share the screen, so opening one closes the other. */
  const openControls = (open: boolean) => { setControlsOpen(open); if (open) setTimelineOpen(false); };
  const openTimeline = (open: boolean) => { setTimelineOpen(open); if (open) setControlsOpen(false); };
  useEffect(() => {
    if (!phone || (!controlsOpen && !timelineOpen)) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setControlsOpen(false); setTimelineOpen(false); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phone, controlsOpen, timelineOpen]);
  useTimelineSpace(root, phone);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  /** The object panel follows the selected object; an event panel names its event. */
  const [info, setInfo] = useState<{ readonly kind: "object" } | { readonly kind: "event"; readonly id: string } | { readonly kind: "window"; readonly id: string } | null>(null);

  const storySet = experience.storyPanels;
  const storyPanels = storySet?.panels ?? [];
  const story = useStoryPanels(
    storyPanels,
    storyPanelSettings ?? { autoOpen: storySet?.autoOpen ?? false, pauseSeconds: storySet?.pauseSeconds ?? 0 },
    snapshot,
    onSetPlaying,
  );
  const openPanelId = story.openPanel?.id ?? null;
  useEffect(() => { onOpenPanelChange?.(openPanelId); }, [onOpenPanelChange, openPanelId]);
  const requestedSerial = panelRequest?.serial;
  useEffect(() => {
    if (panelRequest !== null && panelRequest !== undefined) story.open(panelRequest.id);
    // Only a new request opens a panel; the open function is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedSerial]);
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

  const activatePreset = (preset: ExperienceCameraPreset) => {
    if (preset.request.kind !== "overview") {
      const target = availableObjectById(experience, preset.request.target, snapshot.timeUtcMs);
      if (target === undefined) return;
      setSelectedObjectId(target.id);
      onSelectionChange(target.id);
    }
    setActivePresetId(preset.id);
    onCameraRequest(preset.request);
  };

  const seekToEvent = (event: TimelineEvent) => {
    seek(event.timeUtcMs);
    if (info?.kind === "event") setInfo({ kind: "event", id: event.id });
  };

  const seekToWindow = (window: TimelineWindow, timeUtcMs: number) => {
    seek(timeUtcMs);
    if (info?.kind === "window") setInfo({ kind: "window", id: window.id });
  };

  const view = info === null
    ? null
    : infoView(experience, info.kind === "object" ? { kind: "object", id: selectedObjectId } : info, snapshot.timeUtcMs);
  const metrics = view?.target.kind === "object" && metricsFor !== undefined ? metricsFor(view.target.id, snapshot.timeUtcMs) : [];

  const selectedLabel = experience.objects.find((object) => object.id === selectedObjectId)?.label ?? "Controls";
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
    />
  );

  return (
    <main className="astraeus-shell" ref={root} data-phone={phone} style={phoneLayoutStyle(phoneLayout)}>
      <div className="shell-canvas">{children}</div>
      {phone && <ControlsDrawer label={selectedLabel} open={controlsOpen} onOpenChange={openControls} swipeThresholdPx={phoneLayout.swipeThresholdPx}>{topBar}</ControlsDrawer>}
      <div className="shell-top">
        {!phone && topBar}
        {view !== null && <InfoPanel view={view} metrics={metrics} onClose={() => setInfo(null)} />}
      </div>
      {story.openPanel !== null && (
        <StoryPanelView panel={story.openPanel} holding={story.holding} onClose={story.close} onContinue={story.continuePlayback} />
      )}
      <DeveloperToggle developerMode={developerMode} onDeveloperModeChange={onDeveloperModeChange} />
      <aside className="developer-tools" id="developer-tools" aria-label="Developer diagnostics" hidden={!developerMode}>
        {developerMode ? developerTools : null}
      </aside>
      <TimelineBar
        experience={experience}
        snapshot={snapshot}
        onTogglePlayback={onTogglePlayback}
        onRateChange={onRateChange}
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
