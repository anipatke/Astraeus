// The engine's public API (0.1 preview): everything not exported here is internal.
export { Scene, SceneCamera, type AddBodyOptions, type DataSource, type MoonPositions, type FollowView, type TimeInput, type TrajectoryInput, type TrajectorySampleInput } from "./scene";
export { mount, type MountOptions, type MountedScene } from "./mount";
export { SceneError, type SceneErrorCode } from "./errors";
export { sun, mercury, venus, earth, moon, mars, jupiter, saturn, uranus, neptune, pluto, io, europa, ganymede, callisto, mimas, enceladus, tethys, dione, rhea, titan, iapetus, triton, charon, phobos, deimos, type BodyRef } from "./bodies";
export { trueScale, readableScale, type ScalePolicy } from "../core/scalePolicy";
export type { State } from "../core/state";
export type { Pictures } from "../assets/pictures";
export type { AssetLicence, TextureRef } from "../assets/licence";
