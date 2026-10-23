export interface MiniMember { iau: number; catalog: number; date1904Serial: number; dayFraction: number; a: number; e: number; i: number; w: number; node: number; solarLongitude: number; q?: number; vg?: number; vgSigma?: number; pairs?: number }
export function writeMiniWorkbook(members: MiniMember[], options?: { date1904?: boolean; header?: string[] }): string;
