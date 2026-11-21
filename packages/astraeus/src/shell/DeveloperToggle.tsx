import { ButtonText, CogIcon } from "./topBarIcons";

interface DeveloperProps {
  /** The id of the drawer this cog opens, made once per viewer by the shell. */
  readonly drawerId: string;
  readonly developerMode: boolean;
  readonly onDeveloperModeChange: (enabled: boolean) => void;
}

/** Developer mode stays public, as a cog in the bar (the last item to leave the row; a phone keeps it in the menu). */
export function DeveloperToggle({ developerMode, onDeveloperModeChange, drawerId }: DeveloperProps) {
  return (
    <button
      className="developer-mode-toggle top-bar-button ui-icon ui-pill"
      type="button"
      aria-label="Developer mode"
      title="Developer mode"
      aria-pressed={developerMode}
      aria-expanded={developerMode}
      aria-controls={drawerId}
      data-closes-drawer=""
      onClick={() => onDeveloperModeChange(!developerMode)}
    >
      <CogIcon />
      <ButtonText>Developer</ButtonText>
    </button>
  );
}
