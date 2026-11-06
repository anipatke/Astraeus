import { definitionOf } from "astraeus/tests/definitionOf";
import { APOLLO11_LABEL, buildApollo11Scene } from "../src/experiences/apollo11/apollo11Scene";

/** Apollo 11 as the plug-in contract the app is given: what the engine builds from the scene (`definitionOf`) with the page heading the site shows. Only the tests read it. */
export const apollo11Definition = { ...definitionOf(buildApollo11Scene()), label: APOLLO11_LABEL };
