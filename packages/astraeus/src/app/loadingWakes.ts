import { DefaultLoadingManager } from "three";

type Callbacks = Pick<typeof DefaultLoadingManager, "onStart" | "onProgress" | "onLoad" | "onError">;

const wakes = new Set<() => void>();
let saved: Callbacks | null = null;
let installed: Callbacks | null = null;

function install(): void {
  const manager = DefaultLoadingManager;
  const before: Callbacks = {
    onStart: manager.onStart,
    onProgress: manager.onProgress,
    onLoad: manager.onLoad,
    onError: manager.onError,
  };
  const fire = () => wakes.forEach((wake) => wake());
  const mine: Callbacks = {
    onStart: (...args) => (fire(), before.onStart?.(...args)),
    onProgress: (...args) => (fire(), before.onProgress?.(...args)),
    onLoad: () => (fire(), before.onLoad?.()),
    onError: (url) => (fire(), before.onError?.(url)),
  };
  Object.assign(manager, mine);
  saved = before;
  installed = mine;
}

function uninstall(): void {
  const manager = DefaultLoadingManager;
  for (const key of ["onStart", "onProgress", "onLoad", "onError"] as const) {
    // A callback the page set meanwhile is left alone.
    if (manager[key] === installed![key]) Object.assign(manager, { [key]: saved![key] });
  }
  saved = installed = null;
}

/**
 * Adds a function called on every load event of three's page-wide loading manager (start, progress, load, error) and returns its remover.
 * One reference-counted wrapper serves every viewer, so unmount order never matters; the page's own callbacks hear every event and are
 * put back, unless the page replaced them, once the last wake goes.
 */
export function addLoadingWake(wake: () => void): () => void {
  if (wakes.size === 0) install();
  wakes.add(wake);
  return () => {
    if (!wakes.delete(wake) || wakes.size > 0) return;
    uninstall();
  };
}
