// The planet places rule (O-033, I-048): which entries of a body package are surface places a planet's view draws as markers.
// One source for the builder (planetDefinition.ts) and the assets page generator (tools/site/assets-sections.mjs).

/** True for a package entry with a surface position and no ring-plane fields: rings, ring gaps and inner or small moons carry `ringRadius` / `moonRadius` and sit at 0/0, so they are not places. */
export function isSurfacePlace(feature) {
  return feature.latitude !== undefined && feature.longitude !== undefined && feature.ringRadius === undefined && feature.moonRadius === undefined;
}
