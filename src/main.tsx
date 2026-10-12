import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { apollo11Definition } from "./experiences/apollo11/apollo11Definition";
import { syntheticBareDefinition, syntheticDefinition } from "./synthetic/syntheticDefinition";
import { syntheticBeltDefinition, syntheticRingDefinition } from "./synthetic/syntheticRingDefinition";
import { buildShowerDefinition, showerEntryName } from "./experiences/showers/showerDefinition";
import { parseShowerSettings } from "./experiences/showers/showerSettings";
import "./app/style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Astraeus entry element #app is missing");
// The entry chooses the experience: Apollo by default, a made-up one with ?experience=synthetic (synthetic-bare, without Earth and Moon; synthetic-ring, a made-up debris ring; synthetic-belt, a made-up Sun-centred belt with a declared camera reach).
const DEFINITIONS = { synthetic: syntheticDefinition, "synthetic-bare": syntheticBareDefinition, "synthetic-ring": syntheticRingDefinition, "synthetic-belt": syntheticBeltDefinition };
// Every data/showers/<name>.json is a shower, mounted as ?experience=shower-<name>; a new file needs no change here. Only the requested one is built.
const SHOWER_FILES = import.meta.glob<unknown>("../data/showers/*.json", { eager: true, import: "default" });
const showerSettingsByName = new Map(Object.entries(SHOWER_FILES).map(([path, json]) => [`shower-${showerEntryName(path)}`, json]));
const requested = new URLSearchParams(window.location.search).get("experience") ?? "";
const showerSettings = showerSettingsByName.get(requested);
const definition = showerSettings !== undefined
  ? buildShowerDefinition(parseShowerSettings(showerSettings))
  : Object.hasOwn(DEFINITIONS, requested) ? DEFINITIONS[requested as keyof typeof DEFINITIONS] : apollo11Definition;
createRoot(app).render(<StrictMode><App definition={definition} /></StrictMode>);
