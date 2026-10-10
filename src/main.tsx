import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { apollo11Definition } from "./mission/apollo11Definition";
import { syntheticBareDefinition, syntheticDefinition } from "./synthetic/syntheticDefinition";
import { syntheticRingDefinition } from "./synthetic/syntheticRingDefinition";
import "./app/style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Astraeus entry element #app is missing");
// The entry chooses the experience: Apollo by default, a made-up one with ?experience=synthetic (synthetic-bare, without Earth and Moon; synthetic-ring, a made-up debris ring).
const DEFINITIONS = { synthetic: syntheticDefinition, "synthetic-bare": syntheticBareDefinition, "synthetic-ring": syntheticRingDefinition };
const requested = new URLSearchParams(window.location.search).get("experience") ?? "";
const definition = Object.hasOwn(DEFINITIONS, requested) ? DEFINITIONS[requested as keyof typeof DEFINITIONS] : apollo11Definition;
createRoot(app).render(<StrictMode><App definition={definition} /></StrictMode>);
