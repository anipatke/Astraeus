import { lazy } from "react";

/**
 * The Developer drawer, loaded on demand: `./DeveloperDrawer` (with `./DeveloperSettings`, the debug readout and the frame-rate graph it draws) is fetched only when the
 * Developer switch is on and the drawer is first drawn. Draw it inside a `Suspense`.
 */
export const DeveloperDrawer = lazy(() => import("./DeveloperDrawer"));
