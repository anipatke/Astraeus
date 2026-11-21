// The engine's own version, read from its package.json at build: the one source of truth (no hand-written copy). Job: hold that one string and the built-with link
// the About panel ends with. It must not hold any other package field.
import enginePackage from "../../package.json" with { type: "json" };

/** The engine's version, as `package.json` says it. */
export const ENGINE_VERSION: string = enginePackage.version;

/** Where "Built with Astraeus" points. */
export const BUILT_WITH_URL = "https://astraeus.anipatke.com/";
