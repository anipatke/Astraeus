import { useEffect, useState, type ReactNode } from "react";
import type { ClockSnapshot } from "../core/clock";
import type { TimelineEvent } from "../core/events";
import type { TimelineWindow } from "../core/timeWindow";
import { StoryPanelView } from "./StoryPanelView";
import { useStoryPanels, type StoryPanelSettings } from "./useStoryPanels";
import { TimelineBar } from "./TimelineBar";
import type { ExperienceCameraPreset, ExperienceConfig } from "./experience";
import { InfoPanel } from "./InfoPanel";
import { infoView } from "./infoModel";
import type { Metric } from "./metrics";
import { ObjectControls } from "./ObjectControls";
import { ScaleControl } from "./ScaleControl";
import type { ScaleChoice, ScaleId } from "./scaleModel";
import { availableObjectById, findCameraPreset, firstAvailableObject, isObjectAvailable } from "./objectModel";
import "./style.css";

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
  /** Live measurements for an object's info panel, from the app's own State; empty when it has none. */
  readonly metricsFor?: (objectId: string, timeUtcMs: number) => readonly Metric[];
  readonly developerTools?: ReactNode;
  /** The live story-panel settings (auto-open, pause length); absent: the experience's own defaults. */
  readonly storyPanelSettings?: StoryPanelSettings;
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
  metricsFor,
  developerTools,
  storyPanelSettings,
  onSetPlaying,
  panelRequest,
  onOpenPanelChange,
  children,
}: Props) {
  const [selectedObjectId, setSelectedObjectId] = useState(() =>
    firstAvailableObject(experience, snapshot.timeUtcMs)?.id ?? experience.objects[0]?.id ?? "",
  );
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

  return (
    <main className="astraeus-shell">
      <div className="shell-canvas">{children}</div>
      <div className="shell-top">
        <div className="shell-toolbar">
          <ObjectControls
            experience={experience}
            timeUtcMs={snapshot.timeUtcMs}
            selectedObjectId={selectedObjectId}
            activePresetId={activePresetId}
            onSelectObject={selectObject}
            onCameraPreset={activatePreset}
            infoOpen={info?.kind === "object"}
            onToggleInfo={() => setInfo(info?.kind === "object" ? null : { kind: "object" })}
          />
          <ScaleControl scaleId={scaleId} onScaleChange={onScaleChange} choices={scaleChoices} />
        </div>
        {view !== null && <InfoPanel view={view} metrics={metrics} onClose={() => setInfo(null)} />}
      </div>
      {story.openPanel !== null && (
        <StoryPanelView panel={story.openPanel} holding={story.holding} onClose={story.close} onContinue={story.continuePlayback} />
      )}
      <button
        className="developer-mode-toggle"
        type="button"
        aria-pressed={developerMode}
        aria-expanded={developerMode}
        aria-controls="developer-tools"
        onClick={() => onDeveloperModeChange(!developerMode)}
      >
        Developer mode
      </button>
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
      />
    </main>
  );
}
