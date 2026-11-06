// List switch: the control a host's picker (`Scene.setPicker`) draws. Pure. (Which entry of a list an experience opens, `chooseSwitch`, belongs to the site that has the list: T-270.)
import type { ExperienceSwitch } from "../shell/SwitchControl";

/** The control for a host's picker (`Scene.setPicker`) with `pressed` as the pressed option: a press calls `choose(value)` and does nothing else (no address, no navigation). */
export function pickerSwitch(picker: { readonly id: string; readonly label: string; readonly options: readonly { readonly value: string; readonly label: string }[] }, pressed: string, choose: (value: string) => void): ExperienceSwitch {
  return { label: picker.label, param: picker.id, choose, options: picker.options.map((option) => ({ label: option.label, value: option.value, active: option.value === pressed })) };
}
