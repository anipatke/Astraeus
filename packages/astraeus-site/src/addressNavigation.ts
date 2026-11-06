// Opening an address inside the running page: a switch pushes it into history, back and forward (popstate) reuse it without pushing.
// A plain module (no React, no experience names): the entry gives it the page's own pieces, so the push-versus-no-push rule can be tested alone.

export interface NavigationParts {
  /** Where the address is pushed (the page's history). */
  readonly push: (address: string) => void;
  /** Shows the loading cover. */
  readonly showCover: () => void;
  /** Builds and mounts the experience for the address now in the location (the cover is hidden by the new scene's first frame); it mounts nothing when `isCurrent()` is false, a newer request having begun. */
  readonly rebuild: (isCurrent: () => boolean) => Promise<void>;
  /** The rebuild failed. */
  readonly fail: (error: unknown) => void;
}

export interface AddressNavigation {
  /** A switch: push the address, then rebuild. */
  readonly open: (address: string) => void;
  /** Back or forward: the location already changed, so rebuild without pushing. */
  readonly popped: () => void;
}

export function createAddressNavigation(parts: NavigationParts): AddressNavigation {
  // Only the newest request mounts; one begun and overtaken by another is dropped.
  let latest = 0;
  const run = (): void => {
    const mine = ++latest;
    parts.showCover();
    parts.rebuild(() => mine === latest).catch((error: unknown) => { if (mine === latest) parts.fail(error); });
  };
  return {
    open: (address) => { parts.push(address); run(); },
    popped: run,
  };
}

/** The address a choice leads to: the current one with the parameter set, and the camera view and time dropped (each version opens on its own) unless `keep` names the time; a kept time is `timeUtcMs` (the clock now) when given. Lifted as it was from the engine's `SwitchControl` (O-059 T-272). */
export function switchAddress(href: string, param: string, value: string, keep: readonly string[] = [], timeUtcMs?: number): string {
  const url = new URL(href);
  url.searchParams.set(param, value);
  // The clock's time at the press (whole seconds, as the view link writes it) replaces whatever `t` the address was opened with.
  if (keep.includes("t") && timeUtcMs !== undefined) url.searchParams.set("t", new Date(Math.round(timeUtcMs / 1000) * 1000).toISOString());
  for (const own of ["view", "t"]) if (!keep.includes(own)) url.searchParams.delete(own);
  return url.toString();
}
