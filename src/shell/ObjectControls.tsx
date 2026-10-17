import type { ExperienceCameraPreset, ExperienceConfig } from "./experience";
import { findCameraPreset, isObjectAvailable, listedObjects, relatedObjects } from "./objectModel";
import { FocusIcon, FollowIcon, InfoIcon, OrbitIcon, OverviewIcon } from "./topBarIcons";

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

  const related = selected === undefined ? [] : relatedObjects(experience, selected.id);

  const presetIcon = (preset: ExperienceCameraPreset) =>
    preset.request.kind === "overview" ? <OverviewIcon /> : preset.request.kind === "follow" ? <FollowIcon /> : <FocusIcon />;

  const renderPreset = (preset: ExperienceCameraPreset | undefined) => preset && (
    <button
      key={preset.id}
      type="button"
      className="top-bar-button"
      aria-label={preset.label}
      title={preset.label}
      aria-pressed={activePresetId === preset.id}
      data-camera-preset={preset.id}
      onClick={() => onCameraPreset(preset)}
      disabled={preset.request.kind !== "overview" && !selectedAvailable}
    >
      {presetIcon(preset)}
    </button>
  );

  return (
    <section className="object-controls" aria-label="Object and camera controls">
      <select
        className="object-picker"
        aria-label="Select object"
        value={selectedObjectId}
        onChange={(event) => onSelectObject(event.target.value)}
      >
        {listedObjects(experience, selectedObjectId).map((object) => {
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
      <button
        type="button"
        className="top-bar-button object-info-toggle"
        aria-label={selected === undefined ? "Information" : `Information about ${selected.label}`}
        title={selected === undefined ? "Information" : `Information about ${selected.label}`}
        aria-expanded={infoOpen}
        aria-controls="info-panel"
        disabled={!selectedAvailable}
        onClick={onToggleInfo}
      >
        <InfoIcon />
      </button>
      <div className="object-camera-actions">
        {renderPreset(focus)}
        {renderPreset(follow)}
        {renderPreset(overview)}
        {related.map((object) => (
          <button
            key={object.id}
            type="button"
            className="top-bar-button object-related"
            aria-label={object.label}
            title={object.label}
            data-related-object={object.id}
            disabled={!isObjectAvailable(object, timeUtcMs)}
            onClick={() => onSelectObject(object.id)}
          >
            <OrbitIcon />
          </button>
        ))}
      </div>
    </section>
  );
}
