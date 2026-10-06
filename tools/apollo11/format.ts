import type { Vec3 } from "./vec";

const POSITION_DECIMALS = 6; // millimetres
const VELOCITY_DECIMALS = 9; // micrometres per second

function round(value: number, decimals: number): number {
  const rounded = Number(value.toFixed(decimals));
  return Object.is(rounded, -0) ? 0 : rounded;
}

export const roundPosition = (v: Vec3): [number, number, number] =>
  [round(v[0], POSITION_DECIMALS), round(v[1], POSITION_DECIMALS), round(v[2], POSITION_DECIMALS)];
export const roundVelocity = (v: Vec3): [number, number, number] =>
  [round(v[0], VELOCITY_DECIMALS), round(v[1], VELOCITY_DECIMALS), round(v[2], VELOCITY_DECIMALS)];
export const roundTo = round;

/** Pretty JSON with the named list keys written one record per line, so large files stay diffable. */
export function formatJson(value: Record<string, unknown>, listKeys: readonly string[]): string {
  const entries = Object.entries(value).map(([key, entry]) => {
    if (listKeys.includes(key) && Array.isArray(entry)) {
      const rows = entry.map((row) => `    ${JSON.stringify(row)}`).join(",\n");
      return `  ${JSON.stringify(key)}: [\n${rows}\n  ]`;
    }
    return `  ${JSON.stringify(key)}: ${JSON.stringify(entry, null, 2).replace(/\n/g, "\n  ")}`;
  });
  return `{\n${entries.join(",\n")}\n}\n`;
}
