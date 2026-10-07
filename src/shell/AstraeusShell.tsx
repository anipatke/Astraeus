import { useEffect, useState, type ReactNode } from "react";
import type { ClockSnapshot } from "../core/clock";
import { TimelineBar } from "./TimelineBar";
import type { ExperienceCameraPreset, ExperienceConfig } from "./experience";
import { ObjectControls } from "./ObjectControls";
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
  readonly developerTools?: ReactNode;
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
  developerTools,
  children,
}: Props) {
  const [selectedObjectId, setSelectedObjectId] = useState(() =>
    firstAvailableObject(experience, snapshot.timeUtcMs)?.id ?? experience.objects[0]?.id ?? "",
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

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

  return (
    <main className="astraeus-shell">
      <div className="shell-canvas">{children}</div>
      <ObjectControls
        experience={experience}
        timeUtcMs={snapshot.timeUtcMs}
        selectedObjectId={selectedObjectId}
        activePresetId={activePresetId}
        onSelectObject={selectObject}
        onCameraPreset={activatePreset}
      />
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
        onSeek={onSeek}
      />
    </main>
  );
}
