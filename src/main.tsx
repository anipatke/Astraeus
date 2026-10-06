import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./app/style.css";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Astraeus entry element #app is missing");
createRoot(app).render(<StrictMode><App /></StrictMode>);
