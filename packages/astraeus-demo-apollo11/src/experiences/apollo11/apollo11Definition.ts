import { APOLLO11_LABEL, buildApollo11Scene } from "./apollo11Scene";

/** Apollo 11 as the plug-in contract the app is given: the scene's `toDefinition()` with the page heading the site shows. */
export const apollo11Definition = { ...buildApollo11Scene().toDefinition(), label: APOLLO11_LABEL };
