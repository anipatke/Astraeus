// Only the part of the driver that unit tests import; browser scripts are plain .mjs and are not type-checked.
export function assertScaleInUse(page: unknown, scaleId: string): Promise<void>;
/** The switch read (I-184): either form, buttons or the compact select. */
export interface SwitchRead {
  readonly name: string | null;
  readonly param: string | null;
  readonly compact: boolean;
  readonly options: readonly { readonly value: string; readonly label: string; readonly active: boolean }[];
}
export function readSwitchGroup(group: Element): SwitchRead;
export function switchShowsActive(value: string): boolean;
export function experienceSwitchState(page: unknown): Promise<SwitchRead | null>;
export function chooseSwitchOption(page: unknown, value: string): Promise<void>;
export function developerOpen(page: unknown): Promise<boolean>;
export function toggleDeveloper(page: unknown, options?: { readonly expand?: boolean }): Promise<void>;
export const FREE_POINT_PROBES: readonly (readonly [number, number])[];
export function freeCanvasPoint(page: unknown): Promise<{ x: number; y: number } | null>;
export function withSwitchesRestored<T>(page: unknown, act: () => Promise<T>): Promise<T>;
export function displaySwitchOn(page: unknown, id: string): Promise<boolean>;
export function toggleDisplaySwitch(page: unknown, id: string): Promise<void>;
export function displaySwitchPlaces(page: unknown): Promise<{ topBar: string[]; panel: string[] }>;
export function switchPanelFit(page: unknown): Promise<{ insideWindow: boolean; overlaps: string[] }>;
export function waitUntil<T>(
  page: unknown,
  read: () => Promise<T> | T,
  done: (value: T) => boolean,
  options?: { readonly timeout?: number; readonly what?: string },
): Promise<T>;
/** Waits for a camera reading satisfying `done` whose pose has stopped changing (I-192); throws naming `what` on timeout. */
export function waitForSettledCamera(
  page: unknown,
  done?: (reading: { sky: boolean; [key: string]: unknown }) => boolean,
  options?: { timeout?: number; polls?: number; what?: string },
): Promise<Record<string, unknown>>;
