// The planet places rule (O-033, I-048): which entries of a body package are surface places a planet's view draws as markers.
// One source for the builder (planetDefinition.ts) and the assets page generator (tools/site/assets-sections.mjs).

/** True for a package entry with a surface position and no ring-plane fields: rings, ring gaps and inner or small moons carry `ringRadius` / `moonRadius` and sit at 0/0, so they are not places. */
export function isSurfacePlace(feature) {
  return feature.latitude !== undefined && feature.longitude !== undefined && feature.ringRadius === undefined && feature.moonRadius === undefined;
}

/**
 * The longitude a place is drawn at, from the longitude its body package stores and the convention the package's map record declares (T-131, I-057).
 * A map record that says its source longitudes are positive-west and that the stored values are used as they are (marker scale 1, offset 0) holds west
 * longitudes, which the picture (360 W at its left edge, 0 W at its right) needs as 180 - west. Every other record is shown as stored.
 * @param {number} stored
 * @param {{ sourceLongitude?: string | null, markerLongitudeFromSource?: { scale: number, offsetDeg: number } | null } | undefined} coordinates the map record's `coordinates`
 */
export function shownLongitude(stored, coordinates) {
  const marker = coordinates?.markerLongitudeFromSource;
  const storedAsWest = /positive-west/.test(coordinates?.sourceLongitude ?? "") && marker?.scale === 1 && marker.offsetDeg === 0;
  return storedAsWest ? 180 - stored : stored;
}
