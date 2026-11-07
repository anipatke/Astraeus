// 109P/Swift-Tuttle as the Showers demo adds it (data/showers/perseids.json `parentElements`), built through the engine's generic elements path: the one place the comet's tests get it from.
import perseids from "../../data/showers/perseids.json";
import { buildElementsBody, parseElementsBodyRecord, APPROXIMATE_LIMIT_FRACTION } from "astraeus/core/elementsBody";
import { catalogue } from "astraeus/assets/catalogue";

export const SWIFT_TUTTLE_RECORD = parseElementsBodyRecord((perseids as { parentElements: unknown }).parentElements, "parentElements");
const centre = { id: "sun", gmKm3S2: catalogue.get("sun").definition.gmKm3S2! };
export const SWIFT_TUTTLE_BODY = buildElementsBody(SWIFT_TUTTLE_RECORD, centre);
export const SWIFT_TUTTLE = SWIFT_TUTTLE_BODY.definition;
export const SWIFT_TUTTLE_ELEMENTS = SWIFT_TUTTLE_RECORD.elements;
export const SWIFT_TUTTLE_EPOCH_UTC_MS = SWIFT_TUTTLE_BODY.epochUtcMs;
export const SWIFT_TUTTLE_SAMPLING = SWIFT_TUTTLE_BODY.sampling;
export const SWIFT_TUTTLE_PERIOD_MS = SWIFT_TUTTLE_SAMPLING.periodMs;
export const SWIFT_TUTTLE_APPROXIMATE_LIMIT_FRACTION = APPROXIMATE_LIMIT_FRACTION;
export const createSwiftTuttleTrajectory = () => SWIFT_TUTTLE_BODY.create();

/** The figures the record's accuracy statement quotes (tests/swiftTuttle.test.ts asserts them against the Horizons fixture). */
export const SWIFT_TUTTLE_MAX_ERROR_KM = 10_686_093;
export const SWIFT_TUTTLE_MAX_ERROR_FRACTION = 0.00857;
