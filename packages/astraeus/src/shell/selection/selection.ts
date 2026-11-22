// One viewer's selected object and the rules for who may change it (host asks wait for the shell; the shell's older choice never undoes one).
// It must not touch placement, panels, the camera or React: it is plain state a host component reads through `useSyncExternalStore`.

/** Who moved the selection: the visitor, or a move of time or the view (named by whatever last moved them). */
export type SelectionOrigin = "visitor" | "move";

export interface SelectionAsk {
  readonly quiet: boolean;
}

export interface SelectionSnapshot {
  readonly id: string;
  readonly ask?: SelectionAsk;
}

export interface Selection {
  snapshot(): SelectionSnapshot;
  subscribe(listener: () => void): () => void;
  id(): string;
  choose(id: string, origin: SelectionOrigin): void;
  ask(id: string, quiet: boolean): void;
  takeAsk(): SelectionAsk | undefined;
  hostCleared(): boolean;
  onMove(listener: (id: string, origin: SelectionOrigin) => void): () => void;
}

const freeze = (id: string, ask?: SelectionAsk): SelectionSnapshot => Object.freeze(ask ? { id, ask } : { id });

export function createSelection(start: string): Selection {
  let id = start;
  let ask: SelectionAsk | undefined;
  let cleared = false;
  let snap = freeze(id);
  const subscribers = new Set<() => void>();
  const movers = new Set<(id: string, origin: SelectionOrigin) => void>();
  const write = () => {
    snap = freeze(id, ask);
    for (const listener of [...subscribers]) listener();
  };
  const add = <T>(set: Set<T>, listener: T) => {
    set.add(listener);
    return () => void set.delete(listener);
  };
  return {
    snapshot: () => snap,
    subscribe: (listener) => add(subscribers, listener),
    id: () => id,
    choose(next, origin) {
      if (ask || next === id) return;
      id = next;
      if (next !== "") cleared = false;
      write();
      for (const listener of [...movers]) listener(next, origin);
    },
    ask(next, quiet) {
      id = next;
      ask = Object.freeze({ quiet });
      cleared = next === "";
      write();
    },
    takeAsk() {
      const taken = ask;
      if (taken) {
        ask = undefined;
        snap = freeze(id);
      }
      return taken;
    },
    hostCleared: () => cleared,
    onMove: (listener) => add(movers, listener),
  };
}
