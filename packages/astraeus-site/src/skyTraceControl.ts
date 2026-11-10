// O-065 T-298: a small control the SITE draws beside the viewer (outside the engine) to trace one sky figure with Stay or Fade after it, and a Hide button. It is only a host over the public handle:
// `handle.skyFigures` lists the figures, `handle.traceSkyFigure(id, { durationSeconds, after })` draws one and `handle.clearSkyTrace(id)` removes its trace. The status line is the site's own wall-time account of the call, not the engine's.
import type { MountedScene } from "astraeus";

const AFTERS = ["stay", "fade"] as const;
type After = (typeof AFTERS)[number];
/** How long a trace runs on the site's control (seconds); a fade then takes about one more second inside the engine. */
export const SITE_TRACE_SECONDS = 2;
/** The seconds a trace runs: `SITE_TRACE_SECONDS`, or the page address's `skyTraceSeconds` (0.1 to 60, the engine's range) so the browser check can run the trace quickly (I-165). */
function traceSeconds(): number {
  const asked = Number(new URLSearchParams(window.location.search).get("skyTraceSeconds"));
  return Number.isFinite(asked) && asked >= 0.1 && asked <= 60 ? asked : SITE_TRACE_SECONDS;
}
const FADE_ALLOWANCE_MS = 1_200;

const END_TEXT: Readonly<Record<After, string>> = { stay: "stays", fade: "faded" };

/** Adds the trace control to the page body (the viewer owns `host`: it clears it when it renders) and returns what removes it. */
export function addSkyTraceControl(_host: HTMLElement, handle: MountedScene): () => void {
  const root = document.createElement("div");
  root.className = "site-sky-trace";
  root.dataset.siteSkyTrace = "";
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "Trace a sky figure");
  Object.assign(root.style, { position: "fixed", right: "8px", top: "36%", zIndex: "7", display: "flex", flexDirection: "column", gap: "4px", padding: "6px", font: "12px system-ui, sans-serif", color: "#e8eefc", background: "rgba(10,14,24,0.78)", border: "1px solid rgba(143,180,255,0.35)", borderRadius: "8px", alignItems: "flex-end" });
  // On a wide screen at the right foot above the timeline (the story panel hangs from the top right and the card from the top left); on a phone on the right, under the cog while a story panel is open (the panel rises from the foot), so a story panel never covers it. Closed it is one small button, so on a phone it never covers the switch panel or the timeline; open it holds the figure choice and the three buttons.
  const phoneRule = document.createElement("style");
  phoneRule.textContent = "@media (min-width: 701px) { [data-site-sky-trace] { top: auto !important; bottom: 84px !important; } } @media (max-width: 700px) { body:has(.story-panel) [data-site-sky-trace] { top: 60px !important; } }";
  root.append(phoneRule);
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.dataset.traceToggle = "";
  toggle.textContent = "Trace";
  toggle.setAttribute("aria-expanded", "false");
  Object.assign(toggle.style, { minHeight: "44px", minWidth: "56px", font: "inherit", cursor: "pointer" });
  const body = document.createElement("div");
  body.hidden = true;
  Object.assign(body.style, { display: "none", flexDirection: "column", gap: "4px", width: "180px" });
  toggle.addEventListener("click", () => { body.hidden = !body.hidden; body.style.display = body.hidden ? "none" : "flex"; toggle.setAttribute("aria-expanded", String(!body.hidden)); });
  const title = document.createElement("span");
  title.textContent = "Trace a figure, then:";
  const pick = document.createElement("select");
  pick.setAttribute("aria-label", "Figure to trace");
  Object.assign(pick.style, { minHeight: "44px", font: "inherit" });
  const status = document.createElement("span");
  status.dataset.traceStatus = "idle";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Ready";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const fill = () => {
    if (pick.options.length > 0) return;
    for (const figure of handle.skyFigures ?? []) if (figure.kind === "figure") pick.add(new Option(figure.label, figure.id));
  };
  const trace = (after: After) => {
    fill();
    if (pick.value === "") return;
    clearTimeout(timer);
    const seconds = traceSeconds();
    handle.traceSkyFigure(pick.value, { durationSeconds: seconds, after });
    status.dataset.traceStatus = "tracing";
    status.textContent = "Tracing";
    timer = setTimeout(() => { status.dataset.traceStatus = after; status.textContent = `Trace ${END_TEXT[after]}`; }, seconds * 1000 + (after === "fade" ? FADE_ALLOWANCE_MS : 200));
  };
  const hide = () => {
    fill();
    if (pick.value === "") return;
    clearTimeout(timer);
    handle.clearSkyTrace(pick.value);
    status.dataset.traceStatus = "hiding";
    status.textContent = "Hiding";
    timer = setTimeout(() => { status.dataset.traceStatus = "hidden"; status.textContent = "Trace hidden"; }, FADE_ALLOWANCE_MS);
  };
  const row = document.createElement("div");
  Object.assign(row.style, { display: "flex", gap: "4px" });
  body.append(title, pick, row);
  root.append(body, toggle);
  for (const after of AFTERS) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.traceAfter = after;
    button.textContent = after[0]!.toUpperCase() + after.slice(1);
    button.setAttribute("aria-label", `Trace, then ${after}`);
    Object.assign(button.style, { minHeight: "44px", flex: "1", font: "inherit", cursor: "pointer" });
    button.addEventListener("click", () => trace(after));
    row.append(button);
  }
  const hideButton = document.createElement("button");
  hideButton.type = "button";
  hideButton.dataset.traceAfter = "hide";
  hideButton.textContent = "Hide";
  hideButton.setAttribute("aria-label", "Hide the trace");
  Object.assign(hideButton.style, { minHeight: "44px", flex: "1", font: "inherit", cursor: "pointer" });
  hideButton.addEventListener("click", hide);
  row.append(hideButton);
  body.append(status);
  document.body.append(root);
  // The figures list is readable once the viewer is ready.
  void handle.ready.then(fill, () => undefined);
  return () => { clearTimeout(timer); root.remove(); };
}
