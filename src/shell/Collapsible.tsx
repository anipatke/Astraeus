import { useEffect, useId, useState, type ReactNode } from "react";

const STORAGE_PREFIX = "astraeus.fold.";

/** Whether a fold was left open, from a storage that may be missing or throw; `fallback` when nothing usable is stored. */
export function readStoredOpen(storage: Pick<Storage, "getItem"> | undefined, id: string, fallback: boolean): boolean {
  try {
    const value = storage?.getItem(STORAGE_PREFIX + id);
    return value === "1" ? true : value === "0" ? false : fallback;
  } catch {
    return fallback;
  }
}

/** Remembers a fold's state; silently does nothing where storage is unavailable. */
export function writeStoredOpen(storage: Pick<Storage, "setItem"> | undefined, id: string, open: boolean): void {
  try {
    storage?.setItem(STORAGE_PREFIX + id, open ? "1" : "0");
  } catch { /* the fold still works, it just is not remembered */ }
}

function browserStorage(): Storage | undefined {
  try { return typeof window === "undefined" ? undefined : window.localStorage; } catch { return undefined; }
}

/**
 * The one folding section (STYLE-07): a heading that is a real button with `aria-expanded`, over a body that is not drawn while closed.
 * The body is named by its heading, so it is a labelled group for assistive technology. Open or closed is remembered per viewer in
 * browser storage under `id`, and works without it. `level` is the heading level; `nested` draws a lighter fold inside another.
 */
export function Collapsible({ id, title, defaultOpen = false, level = 3, nested = false, className = "", remember = true, onOpenChange, children }: {
  readonly id: string;
  readonly title: string;
  readonly defaultOpen?: boolean;
  readonly level?: 3 | 4;
  readonly nested?: boolean;
  readonly className?: string;
  /** False: the fold always starts as `defaultOpen` and is not remembered (a list whose folds drive something else). */
  readonly remember?: boolean;
  /** Called when the viewer opens or closes the fold (not on first draw). */
  readonly onOpenChange?: (open: boolean) => void;
  readonly children: ReactNode;
}) {
  const uid = useId();
  const [open, setOpen] = useState(() => (remember ? readStoredOpen(browserStorage(), id, defaultOpen) : defaultOpen));
  useEffect(() => { if (remember) writeStoredOpen(browserStorage(), id, open); }, [id, open, remember]);
  const Heading = level === 3 ? "h3" : "h4";
  const buttonId = `${uid}-toggle`;
  const bodyId = `${uid}-body`;
  return (
    <section className={`collapsible${nested ? " collapsible-nested" : ""}${className === "" ? "" : ` ${className}`}`} data-fold={id}>
      <Heading className="collapsible-heading">
        <button type="button" id={buttonId} className="ui-row collapsible-toggle" data-fold-toggle={id} aria-expanded={open} aria-controls={bodyId} onClick={() => { setOpen(!open); onOpenChange?.(!open); }}>
          <span>{title}</span>
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><path d="M2 4l4 4 4-4" /></svg>
        </button>
      </Heading>
      <div id={bodyId} className="collapsible-body" role="group" aria-labelledby={buttonId} hidden={!open}>
        {open ? children : null}
      </div>
    </section>
  );
}
