import { createRoot } from "react-dom/client";
import { useState } from "react";
import { ScaleControl } from "../../../src/shell/ScaleControl";
import { scaleChoicesFor } from "../../../src/shell/scaleModel";
import "../../../src/shell/style.css";
import "../../../src/shell/TopBar.css";
const choices = scaleChoicesFor(["true-scale", "readable-scale", "solar-system"]);
function App() { const [s, set] = useState("true-scale"); return <div className="top-bar"><ScaleControl scaleId={s} onScaleChange={set} choices={choices} /></div>; }
createRoot(document.getElementById("root")!).render(<App />);
