import type { ExperienceCameraPreset, ExperienceConfig } from "./experience";
import { findCameraPreset, focusPresetFor, isObjectAvailable, listedFigures, listedObjects, relatedObjects, skyFigureById } from "./objectModel";
import { ButtonText, FocusIcon, LookOutIcon, FollowIcon, InfoIcon, OrbitIcon, OverviewIcon } from "./topBarIcons";

interface Props {
  readonly experience: ExperienceConfig;
  readonly timeUtcMs: number;
  readonly selectedObjectId: string;
  readonly activePresetId: string | null;
  readonly onSelectObject: (id: string) => void;
  readonly onCameraPreset: (preset: ExperienceCameraPreset) => void;
  readonly infoOpen: boolean;
  readonly onToggleInfo: () => void;
  /** The id of the information panel the Info button opens, made once per viewer by the shell. */
  readonly infoPanelId: string;
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
  infoPanelId,
}: Props) {
  const selected = experience.objects.find((object) => object.id === selectedObjectId);
  const selectedFigure = skyFigureById(experience, selectedObjectId);
  const selectedAvailable = selected !== undefined && isObjectAvailable(selected, timeUtcMs);
  const infoLabel = selected?.label ?? selectedFigure?.label;
  const overview = findCameraPreset(experience, "overview");
  const focus = selected === undefined ? undefined : focusPresetFor(experience, selected);
  const follow = selected === undefined ? undefined : findCameraPreset(experience, "follow", selected.id);
  const lookOut = selected === undefined ? undefined : findCameraPreset(experience, "lookOut", selected.id);

  const related = selected === undefined ? [] : relatedObjects(experience, selected.id);

  const presetIcon = (preset: ExperienceCameraPreset) =>
    preset.request.kind === "overview" ? <OverviewIcon /> : preset.request.kind === "follow" ? <FollowIcon /> : preset.request.kind === "lookOut" ? <LookOutIcon /> : <FocusIcon />;

  const presetText = (preset: ExperienceCameraPreset) => (preset.request.kind === "overview" ? "Overview" : preset.request.kind === "follow" ? "Follow" : preset.request.kind === "lookOut" ? "Look out" : "Focus");

  const renderPreset = (preset: ExperienceCameraPreset | undefined) => preset && (
    <button
      key={preset.id}
      type="button"
      className="top-bar-button ui-icon"
      data-closes-drawer=""
      aria-label={preset.label}
      title={preset.label}
      aria-pressed={activePresetId === preset.id}
      data-camera-preset={preset.id}
      onClick={() => onCameraPreset(preset)}
      disabled={preset.request.kind !== "overview" && !selectedAvailable}
    >
      {presetIcon(preset)}
      <ButtonText>{presetText(preset)}</ButtonText>
    </button>
  );

  return (
    <section className="object-controls" aria-label="Object and camera controls">
      <select
        className="object-picker"
        data-closes-drawer=""
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
        {listedFigures(experience, selectedObjectId).map((figure) => <option key={figure.id} value={figure.id} data-sky-figure="">{figure.label}</option>)}
      </select>
      <button
        type="button"
        className="top-bar-button ui-icon object-info-toggle"
        data-closes-drawer=""
        aria-label={infoLabel === undefined ? "Information" : `Information about ${infoLabel}`}
        title={infoLabel === undefined ? "Information" : `Information about ${infoLabel}`}
        aria-expanded={infoOpen}
        aria-controls={infoPanelId}
        disabled={!selectedAvailable && selectedFigure === undefined}
        onClick={onToggleInfo}
      >
        <InfoIcon />
        <ButtonText>Info</ButtonText>
      </button>
      <div className="object-camera-actions">
        {renderPreset(focus)}
        {renderPreset(follow)}
        {renderPreset(lookOut)}
        {renderPreset(overview)}
        {related.map((object) => (
          <button
            key={object.id}
            type="button"
            className="top-bar-button ui-icon object-related"
            aria-label={object.label}
            title={object.label}
            data-related-object={object.id}
            disabled={!isObjectAvailable(object, timeUtcMs)}
            onClick={() => onSelectObject(object.id)}
          >
            <OrbitIcon />
            <ButtonText>{object.label}</ButtonText>
          </button>
        ))}
      </div>
    </section>
  );
}
