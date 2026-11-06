/** One option of the picker (`Scene.setPicker`). */
export interface PickerOptionInput {
  /** What the host hears when a visitor presses the option; unique among the options. */
  readonly value: string;
  /** The words on the button. */
  readonly label: string;
}

/** A choice an app offers in the viewer's top bar and phone drawer (`Scene.setPicker`). The viewer only reports a press; it never navigates, reads or writes the page address, or keeps a time. */
export interface PickerInput {
  /** Names the choice; the buttons carry it as `data-switch-param`. It has no other meaning to the viewer. */
  readonly id: string;
  /** The accessible name of the group of buttons. */
  readonly label: string;
  /** The buttons, in order. Fewer than two: no control is drawn. */
  readonly options: readonly PickerOptionInput[];
  /** The option pressed when the viewer opens; one of the options' values. */
  readonly value: string;
}

/** What a host is told when a visitor presses an option other than the pressed one (`ViewerHandle.onPick`, the `onPick` prop of `AstraeusScene`). */
export interface PickChange {
  /** The `id` of the picker. */
  readonly picker: string;
  /** The `value` of the option pressed. The pressed option does not move until the host calls `setPick` (or mounts a new scene). */
  readonly value: string;
}
