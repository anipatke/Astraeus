// O-080 T-335: the catalogue page's script (components.html). Each entry's example runs on demand, one viewer at a time: pressing a Run button unmounts the viewer that is running (in whichever entry) before it mounts this
// one. The engine and the example load only on that press, so the page itself stays light. The source shown is each example's own text (`?raw`), and the import and add lines are cut from it, so the shown code is the run code.
import type { MountedScene, Scene } from "astraeus";
import { addPartsStatement, importLines } from "./sourceLines";

/** An example builds its scene; one that needs something done once the viewer is drawn (a value that follows the time) also gives `live`, which returns the function that stops it. */
interface Example { buildScene(): Scene; live?(viewer: MountedScene): () => void }

const sources = import.meta.glob<string>("./examples/*.ts", { query: "?raw", import: "default", eager: true });
const loaders = import.meta.glob<Example>("./examples/*.ts");
const nameOf = (path: string): string => /\/([^/]+)\.ts$/.exec(path)![1]!;
const byName = <T>(table: Record<string, T>): Map<string, T> => new Map(Object.entries(table).map(([path, value]) => [nameOf(path), value]));
const sourceOf = byName(sources);
const loaderOf = byName(loaders);

const IDLE_NOTE = "The example runs when you press the button; one viewer at a time.";
let running: { article: HTMLElement; viewer: MountedScene | undefined; stopLive?: () => void } | undefined;
let ticket = 0;

const part = (article: HTMLElement, hook: string): HTMLElement => article.querySelector<HTMLElement>(`[${hook}]`)!;

function setIdle(article: HTMLElement, note = IDLE_NOTE): void {
  const stage = part(article, "data-part-stage");
  stage.replaceChildren();
  const paragraph = document.createElement("p");
  paragraph.className = "idle-note";
  paragraph.textContent = note;
  stage.append(paragraph);
  article.dataset.state = "idle";
  part(article, "data-part-run").textContent = "Run the example";
}

/** Stops whichever viewer is running, whatever entry it is in. */
function stopRunning(): void {
  if (running === undefined) return;
  const { article, viewer, stopLive } = running;
  running = undefined;
  stopLive?.();
  viewer?.unmount();
  setIdle(article);
}

async function start(article: HTMLElement): Promise<void> {
  stopRunning();
  const mine = ++ticket;
  const name = article.dataset.part!;
  running = { article, viewer: undefined };
  article.dataset.state = "loading";
  part(article, "data-part-run").textContent = "Stop the example";
  const stage = part(article, "data-part-stage");
  stage.replaceChildren();
  try {
    const [{ mount }, example] = await Promise.all([import("astraeus"), loaderOf.get(name)!()]);
    if (mine !== ticket) return;
    const viewer = mount(stage, example.buildScene());
    const entry: NonNullable<typeof running> = { article, viewer };
    running = entry;
    await viewer.ready;
    if (mine !== ticket) return;
    entry.stopLive = example.live?.(viewer);
    article.dataset.state = "running";
  } catch (error) {
    if (mine !== ticket) return;
    running = undefined;
    setIdle(article, `The example did not start: ${error instanceof Error ? error.message : String(error)}`);
    article.dataset.state = "failed";
  }
}

for (const article of document.querySelectorAll<HTMLElement>("article[data-part]")) {
  const source = sourceOf.get(article.dataset.part!);
  if (source !== undefined) {
    part(article, "data-part-import").textContent = importLines(source);
    part(article, "data-part-add").textContent = addPartsStatement(source);
    part(article, "data-part-code").textContent = source;
  }
  part(article, "data-part-run").addEventListener("click", () => { if (running?.article === article) { ticket++; stopRunning(); } else void start(article); });
}
