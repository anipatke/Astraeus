export function isSurfacePlace(feature: { readonly latitude?: number; readonly longitude?: number; readonly ringRadius?: unknown; readonly moonRadius?: unknown }): boolean;
export function shownLongitude(stored: number, coordinates: { readonly sourceLongitude?: string | null; readonly markerLongitudeFromSource?: { readonly scale: number; readonly offsetDeg: number } | null } | undefined): number;
