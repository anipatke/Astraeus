// Part: the object picker, Info and camera buttons as separate bar items, each with its priority and measuring ghost.
// Must not: set a position, layer, raw colour or raw size (areas/ places it, look.css holds the values), or open or close another part; it does not decide what fits in the row (fitBar does).
import type { ExperienceCameraPreset, ExperienceConfig } from "./experience";
import { findCameraPreset, focusPresetFor, isObjectAvailable, listedFigures, listedObjects, relatedObjects, skyFigureById } from "./objectModel";
import { ButtonText, FocusIcon, LookOutIcon, FollowIcon, InfoIcon, OrbitIcon, OverviewIcon } from "./topBarIcons";
import { ENGINE_PRIORITY, type Ghost } from "./bar/barItems";
import type { ReactNode } from "react";

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

/** One control of the object group, with what the bar's fit rule needs: its id, priority, and the ghost that measures it. */
export interface ObjectPart {
  readonly id: string;
  readonly group: "picker" | "info" | "camera";
  readonly priority: number;
  readonly ghosts: readonly Ghost[];
  readonly node: ReactNode;
}

/** The object picker, Info and the camera buttons as separate parts, in row order (the bar places each by its priority; `ObjectControls` draws them together). */
export function objectControlParts({
  experience,
  timeUtcMs,
  selectedObjectId,
  activePresetId,
  onSelectObject,
  onCameraPreset,
  infoOpen,
  onToggleInfo,
  infoPanelId,
}: Props): readonly ObjectPart[] {
  const selected = experience.objects.find((object) => object.id === selectedObjectId);
  const selectedFigure = skyFigureById(experience, selectedObjectId);
  const selectedAvailable = selected !== undefined && isObjectAvailable(selected, timeUtcMs);
  const infoLabel = selected?.label ?? selectedFigure?.label;
  const overview = findCameraPreset(experience, "overview");
  const focus = selected === undefined ? undefined : experience.focusListed === true ? findCameraPreset(experience, "focus", selected.id) : focusPresetFor(experience, selected);
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

  const pickerLabel = selected?.label ?? selectedFigure?.label ?? "";
  const parts: ObjectPart[] = [];
  parts.push({
    id: "picker", group: "picker", priority: ENGINE_PRIORITY.picker, ghosts: [{ shape: "select", text: pickerLabel }],
    node: (
      <select
        key="picker"
        className="object-picker"
        data-closes-drawer=""
        aria-label="Select object"
        value={selectedObjectId}
        onChange={(event) => onSelectObject(event.target.value)}
      >
        {listedObjects(experience, selectedObjectId, timeUtcMs).map((object) => {
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
    ),
  });
  parts.push({
    id: "info", group: "info", priority: ENGINE_PRIORITY.info, ghosts: [{ shape: "icon" }],
    node: (
      <button
        key="info"
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
    ),
  });
  for (const preset of [focus, follow, lookOut, overview]) {
    if (preset !== undefined) parts.push({ id: `camera:${preset.id}`, group: "camera", priority: ENGINE_PRIORITY.camera, ghosts: [{ shape: "icon" }], node: renderPreset(preset) });
  }
  for (const object of related) {
    parts.push({
      id: `related:${object.id}`, group: "camera", priority: ENGINE_PRIORITY.related, ghosts: [{ shape: "icon" }],
      node: (
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
      ),
    });
  }
  return parts;
}

/** The object and camera controls drawn together in one section (the grouping the bar and menu no longer use; kept for a part drawn alone). */
export function ObjectControls(props: Props) {
  const parts = objectControlParts(props);
  return (
    <section className="object-controls" aria-label="Object and camera controls">
      {parts.filter((part) => part.group !== "camera").map((part) => part.node)}
      <div className="object-camera-actions">{parts.filter((part) => part.group === "camera").map((part) => part.node)}</div>
    </section>
  );
}
