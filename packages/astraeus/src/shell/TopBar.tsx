import type { ExperienceCameraPreset, ExperienceConfig } from "./experience";
import { ObjectControls } from "./ObjectControls";
import { ScaleControl } from "./ScaleControl";
import { DisplaySwitches, ViewButtons, viewChoiceInPanel, type DisplaySwitchItem, type ViewChoice } from "./DisplaySwitches";
import { SwitchControl, type ExperienceSwitch } from "./SwitchControl";
import type { ScaleChoice, ScaleId } from "./scaleModel";
import { CogIcon } from "./topBarIcons";
import "./TopBar.css";

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
  readonly scaleId: ScaleId;
  readonly onScaleChange: (id: ScaleId) => void;
  readonly scaleChoices?: readonly ScaleChoice[];
  /** A choice between versions of the experience, shown first in the bar; absent: none. */
  readonly switcher?: ExperienceSwitch;
  /** Display switches a story placed in the bar or its panel; absent or empty: none, the bar as it was. */
  readonly displaySwitches?: readonly DisplaySwitchItem[];
  /** The views the scene names, in the bar or its switch panel; absent: none. */
  readonly viewChoice?: ViewChoice;
}

interface DeveloperProps {
  /** The id of the drawer this cog opens, made once per viewer by the shell. */
  readonly drawerId: string;
  readonly developerMode: boolean;
  readonly onDeveloperModeChange: (enabled: boolean) => void;
}

/** The single compact bar: body picker, Info, camera buttons and Scale in one row. */
export function TopBar({ scaleId, onScaleChange, scaleChoices, switcher, displaySwitches = [], viewChoice, ...objectControls }: Props) {
  return (
    <div className="shell-toolbar">
      <div className="top-bar">
        {switcher !== undefined && switcher.options.length > 1 && (
          <>
            <SwitchControl choice={switcher} />
            <span className="top-bar-divider" aria-hidden="true" />
          </>
        )}
        {viewChoice !== undefined && viewChoice.place === "top-bar" && viewChoice.options.length > 1 && (
          <>
            <ViewButtons choice={viewChoice} />
            <span className="top-bar-divider" aria-hidden="true" />
          </>
        )}
        <ObjectControls {...objectControls} />
        <span className="top-bar-divider" aria-hidden="true" />
        <ScaleControl scaleId={scaleId} onScaleChange={onScaleChange} choices={scaleChoices} />
        {(displaySwitches.length > 0 || viewChoiceInPanel(viewChoice)) && (
          <>
            <span className="top-bar-divider" aria-hidden="true" />
            <DisplaySwitches switches={displaySwitches} viewChoice={viewChoice} />
          </>
        )}
      </div>
    </div>
  );
}

/** Developer mode stays public, as a cog on its own at the top right of the shell. */
export function DeveloperToggle({ developerMode, onDeveloperModeChange, drawerId }: DeveloperProps) {
  return (
    <button
      className="developer-mode-toggle ui-icon ui-pill"
      type="button"
      aria-label="Developer mode"
      title="Developer mode"
      aria-pressed={developerMode}
      aria-expanded={developerMode}
      aria-controls={drawerId}
      onClick={() => onDeveloperModeChange(!developerMode)}
    >
      <CogIcon />
    </button>
  );
}
