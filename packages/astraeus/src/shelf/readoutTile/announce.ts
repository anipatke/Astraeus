// The readout tile's spoken value. Job: word what a screen reader hears when the shown value changes, and space those announcements out.
// One label-and-value utterance takes about 1.5 to 2 s at a screen reader's default rate, so announcements are at least 2 s apart and the last one is always the latest value.

/** The least time between two announcements, in ms. */
export const ANNOUNCE_MS = 2000;

/** What is said for the shown value: the tile's label and the value as the app words it. */
export const announcedText = (label: string, value: string): string => `${label}: ${value}`;

/** What `announceAfter` gives: `push` the text now shown, `cancel` any pending announcement. */
export interface Announcer {
  push(text: string): void;
  cancel(): void;
}

/**
 * A trailing throttle. `first` is the text already drawn (never announced). The first change starts a window of `ms`; later changes only replace the pending text;
 * when the window ends `say` hears the latest text, unless it equals the last one said (or `first`).
 */
export function announceAfter(ms: number, first: string, say: (text: string) => void): Announcer {
  let last = first;
  let pending = first;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    push: (text) => {
      pending = text;
      if (timer !== undefined || text === last) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (pending === last) return;
        last = pending;
        say(last);
      }, ms);
    },
    cancel: () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}
