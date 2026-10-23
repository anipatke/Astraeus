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
