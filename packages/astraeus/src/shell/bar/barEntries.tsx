// The bar's items for this scene and state, each with what draws it. Job: turn the shell's state into the one ordered list (`barItems.ts` model) with the existing
// controls as the item renderers. It places and sizes nothing (the fit rule does), and it never draws a control outside the list.
import type { ReactNode } from "react";
import { DisplaySwitches, ViewButtons, viewChoiceInPanel, type DisplaySwitchItem, type ViewChoice } from "../DisplaySwitches";
import { DeveloperToggle } from "../DeveloperToggle";
import { objectControlParts } from "../ObjectControls";
import { ScaleControl } from "../ScaleControl";
import { SwitchControl, type ExperienceSwitch } from "../SwitchControl";
import type { ScaleChoice, ScaleId } from "../scaleModel";
import { SCALE_CHOICES } from "../scaleModel";
import { buildBarItems, engineItem, ENGINE_PRIORITY, switchItem, titleItem, type BarForm, type BarItem, type Ghost } from "./barItems";
import { TitlePlace, type BarEntry, type TitleAction } from "./Bar";

type ObjectInput = Parameters<typeof objectControlParts>[0];

export interface BarEntriesInput extends ObjectInput {
  /** A phone shows the title place whatever the scene holds (the About title, or the selected object's name); a wide bar shows it only when the scene has an About. */
  readonly phone: boolean;
  readonly selectedLabel: string;
  /** The scene's About title and its shorter title; absent: no About (the title place shows `selectedLabel`). */
  readonly about?: { readonly title: string; readonly shortTitle?: string | undefined } | undefined;
  /** What a press on the title place does: the About panel's, or (no About) the card's. */
  readonly titleAction: TitleAction;
  readonly scaleId: ScaleId;
  readonly onScaleChange: (id: ScaleId) => void;
  readonly scaleChoices?: readonly ScaleChoice[] | undefined;
  readonly switcher?: ExperienceSwitch | undefined;
  readonly displaySwitches?: readonly DisplaySwitchItem[] | undefined;
  readonly viewChoice?: ViewChoice | undefined;
  /** The moons button as the shell draws it (null: no moons list) and the planet's name for measuring it. */
  readonly moonsToggle: ReactNode;
  readonly moonsLabel: string | undefined;
  /** The cog's drawer, mode and setter; drawn only when the host gave the drawer's content. */
  readonly developerPresent: boolean;
  readonly developerDrawerId: string;
  readonly developerMode: boolean;
  readonly onDeveloperModeChange: (enabled: boolean) => void;
}

const iconGhost: Ghost = { shape: "icon" };
const entry = (item: BarItem, render: (form: BarForm) => ReactNode): BarEntry => ({ ...item, render });
const withForm = (form: BarForm): "full" | "short" | "compact" => (form === "short" || form === "compact" ? form : "full");

/** The title place, then the host's picker and the views as switches. */
function leadEntries(input: BarEntriesInput): readonly BarEntry[] {
  const entries: BarEntry[] = [];
  if (input.about !== undefined || input.phone) {
    const { title, shortTitle } = input.about ?? { title: input.selectedLabel, shortTitle: undefined };
    const action = input.titleAction;
    entries.push(entry(titleItem("title", title, shortTitle), (form) => <TitlePlace key="title" full={title} shown={form === "i" ? "i" : form === "short" && shortTitle !== undefined ? shortTitle : title} action={action} />));
  }
  const { switcher, viewChoice: views } = input;
  if (switcher !== undefined && switcher.options.length > 1) entries.push(entry(switchItem("picker-switch", switcher.options), (form) => <SwitchControl key="picker-switch" choice={switcher} form={withForm(form)} />));
  if (views !== undefined && views.place === "top-bar" && views.options.length > 1) entries.push(entry(switchItem("views", views.options), (form) => <ViewButtons key="views" choice={views} form={withForm(form)} />));
  return entries;
}

/** The engine controls in row order: object picker, Info, camera buttons, related objects, scale, display switches. */
function controlEntries(input: BarEntriesInput): readonly BarEntry[] {
  const entries = objectControlParts(input).map((part) => entry(engineItem(part.id, part.priority, part.ghosts), () => part.node));
  const choices = input.scaleChoices ?? SCALE_CHOICES;
  if (choices.length > 1) {
    const current = choices.find((choice) => choice.id === input.scaleId) ?? choices[0];
    entries.push(entry(engineItem("scale", ENGINE_PRIORITY.scale, [{ shape: "scale", text: current?.label ?? "" }, iconGhost]), () => <ScaleControl key="scale" scaleId={input.scaleId} onScaleChange={input.onScaleChange} choices={input.scaleChoices} />));
  }
  const switches = input.displaySwitches ?? [];
  const barSwitches = switches.filter((item) => item.place === "top-bar").length;
  const panelHolds = switches.some((item) => item.place === "panel") || viewChoiceInPanel(input.viewChoice);
  if (barSwitches > 0 || panelHolds) {
    const ghosts: Ghost[] = Array.from({ length: barSwitches + (panelHolds ? 1 : 0) }, () => iconGhost);
    entries.push(entry(engineItem("display", ENGINE_PRIORITY.display, ghosts), () => <DisplaySwitches key="display" switches={switches} {...(input.viewChoice === undefined ? {} : { viewChoice: input.viewChoice })} />));
  }
  return entries;
}

/** The moons button and the Developer cog: the lowest-priority engine items. */
function trailingEntries(input: BarEntriesInput): readonly BarEntry[] {
  const entries: BarEntry[] = [];
  if (input.moonsToggle !== null) entries.push(entry(engineItem("moons", ENGINE_PRIORITY.moons, [{ shape: "text", text: `${input.moonsLabel ?? ""} moons` }]), () => input.moonsToggle));
  if (input.developerPresent) {
    const props = { drawerId: input.developerDrawerId, developerMode: input.developerMode, onDeveloperModeChange: input.onDeveloperModeChange };
    entries.push(entry(engineItem("developer", ENGINE_PRIORITY.developer, [iconGhost]), () => <DeveloperToggle key="developer" {...props} />));
  }
  return entries;
}

/** The ordered bar entries: title, the host's picker, the views, then the engine controls by their row order, then the menu button. */
export function barEntries(input: BarEntriesInput): readonly BarEntry[] {
  const parts = [...leadEntries(input), ...controlEntries(input), ...trailingEntries(input)];
  const items = buildBarItems({
    title: parts.find((part) => part.kind === "title"),
    switches: parts.filter((part) => part.kind === "switch"),
    story: parts.filter((part) => part.kind === "story"),
    engine: parts.filter((part) => part.kind === "engine"),
  });
  const byId = new Map(parts.map((part) => [part.id, part]));
  return items.map((item) => byId.get(item.id) ?? { ...item, render: () => null });
}
