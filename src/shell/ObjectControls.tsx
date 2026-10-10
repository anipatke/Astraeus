import type { ExperienceCameraPreset, ExperienceConfig } from "./experience";
import { findCameraPreset, isObjectAvailable } from "./objectModel";

interface Props {
  readonly experience: ExperienceConfig;
  readonly timeUtcMs: number;
  readonly selectedObjectId: string;
  readonly activePresetId: string | null;
  readonly onSelectObject: (id: string) => void;
  readonly onCameraPreset: (preset: ExperienceCameraPreset) => void;
  readonly infoOpen: boolean;
  readonly onToggleInfo: () => void;
}

export function ObjectControls({
  experience,
  timeUtcMs,
  selectedObjectId,
  activePresetId,
  onSelectObject,
  onCameraPreset,
  infoOpen,
  onToggleInfo,
}: Props) {
  const selected = experience.objects.find((object) => object.id === selectedObjectId);
  const selectedAvailable = selected !== undefined && isObjectAvailable(selected, timeUtcMs);
  const overview = findCameraPreset(experience, "overview");
  const focus = selected === undefined ? undefined : findCameraPreset(experience, "focus", selected.id);
  const follow = selected === undefined ? undefined : findCameraPreset(experience, "follow", selected.id);
  const cameraPresets = [overview, focus, follow].filter((preset): preset is ExperienceCameraPreset => preset !== undefined);
  const selectedPreset = cameraPresets.find((preset) => preset.id === activePresetId) ?? overview;

  const renderPreset = (preset: ExperienceCameraPreset | undefined) => preset && (
    <button
      key={preset.id}
      type="button"
      aria-pressed={activePresetId === preset.id}
      data-camera-preset={preset.id}
      onClick={() => onCameraPreset(preset)}
      disabled={preset.request.kind !== "overview" && !selectedAvailable}
    >
      {preset.label}
    </button>
  );

  return (
    <section className="object-controls" aria-label="Object and camera controls">
      <label className="object-picker">
        <span>Object</span>
        <select
          aria-label="Select object"
          value={selectedObjectId}
          onChange={(event) => onSelectObject(event.target.value)}
        >
          {experience.objects.map((object) => {
            const available = isObjectAvailable(object, timeUtcMs);
            return (
              <option
                key={object.id}
                value={object.id}
                disabled={!available}
                data-available={available}
                data-available-from={object.availability?.startUtcMs}
                data-available-to={object.availability?.endUtcMs}
              >
                {object.label}{available ? "" : " (Unavailable)"}
              </option>
            );
          })}
        </select>
      </label>
      <button
        type="button"
        className="object-info-toggle"
        aria-label={selected === undefined ? "Information" : `Information about ${selected.label}`}
        aria-expanded={infoOpen}
        aria-controls="info-panel"
        disabled={!selectedAvailable}
        onClick={onToggleInfo}
      >
        Info
      </button>
      <div className="object-camera-actions">
        {renderPreset(overview)}
        {renderPreset(focus)}
        {renderPreset(follow)}
      </div>
      <select
        className="object-camera-picker"
        aria-label="Camera mode"
        value={selectedPreset?.id ?? ""}
        onChange={(event) => {
          const preset = cameraPresets.find((candidate) => candidate.id === event.target.value);
          if (preset !== undefined) onCameraPreset(preset);
        }}
      >
        {cameraPresets.map((preset) => (
          <option
            key={preset.id}
            value={preset.id}
            disabled={preset.request.kind !== "overview" && !selectedAvailable}
          >
            {preset.label}
          </option>
        ))}
      </select>
    </section>
  );
}
