// T-419: one selection owner per viewer. Node only; one table across every kind of write.
import { describe, expect, it } from "vitest";
import { createSelection } from "../src/shell/selection/selection";

type Step = readonly ["choose", string, "visitor" | "move"] | readonly ["ask", string, boolean] | readonly ["takeAsk"];
interface Case {
  readonly name: string;
  readonly start: string;
  readonly steps: readonly Step[];
  readonly id: string;
  readonly notified: number;
  readonly moves: readonly (readonly [string, string])[];
  readonly hostCleared: boolean;
  readonly waiting: boolean;
}

const CASES: readonly Case[] = [
  {
    name: "visitor choose",
    start: "a",
    steps: [["choose", "b", "visitor"]],
    id: "b",
    notified: 1,
    moves: [["b", "visitor"]],
    hostCleared: false,
    waiting: false,
  },
  {
    name: "move choose",
    start: "a",
    steps: [["choose", "b", "move"]],
    id: "b",
    notified: 1,
    moves: [["b", "move"]],
    hostCleared: false,
    waiting: false,
  },
  {
    name: "choose the same id",
    start: "a",
    steps: [["choose", "a", "visitor"]],
    id: "a",
    notified: 0,
    moves: [],
    hostCleared: false,
    waiting: false,
  },
  {
    name: "ask with an id",
    start: "a",
    steps: [["ask", "b", false]],
    id: "b",
    notified: 1,
    moves: [],
    hostCleared: false,
    waiting: true,
  },
  {
    name: "ask the same id still notifies",
    start: "a",
    steps: [["ask", "a", false]],
    id: "a",
    notified: 1,
    moves: [],
    hostCleared: false,
    waiting: true,
  },
  {
    name: "quiet ask",
    start: "a",
    steps: [["ask", "b", true]],
    id: "b",
    notified: 1,
    moves: [],
    hostCleared: false,
    waiting: true,
  },
  {
    name: "ask with empty id",
    start: "a",
    steps: [["ask", "", false]],
    id: "",
    notified: 1,
    moves: [],
    hostCleared: true,
    waiting: true,
  },
  {
    name: "choose between ask and takeAsk changes nothing",
    start: "a",
    steps: [
      ["ask", "b", false],
      ["choose", "c", "visitor"],
    ],
    id: "b",
    notified: 1,
    moves: [],
    hostCleared: false,
    waiting: true,
  },
  {
    name: "choose applies after takeAsk",
    start: "a",
    steps: [["ask", "b", false], ["takeAsk"], ["choose", "c", "visitor"]],
    id: "c",
    notified: 2,
    moves: [["c", "visitor"]],
    hostCleared: false,
    waiting: false,
  },
  {
    name: "takeAsk with nothing waiting",
    start: "a",
    steps: [["takeAsk"]],
    id: "a",
    notified: 0,
    moves: [],
    hostCleared: false,
    waiting: false,
  },
  {
    name: "host clear, choose empty keeps the flag",
    start: "a",
    steps: [["ask", "", false], ["takeAsk"], ["choose", "", "visitor"]],
    id: "",
    notified: 1,
    moves: [],
    hostCleared: true,
    waiting: false,
  },
  {
    name: "host clear, then an id clears the flag",
    start: "a",
    steps: [["ask", "", false], ["takeAsk"], ["choose", "b", "visitor"]],
    id: "b",
    notified: 2,
    moves: [["b", "visitor"]],
    hostCleared: false,
    waiting: false,
  },
];

describe("selection store (T-419)", () => {
  it.each(CASES)("$name", (c) => {
    const store = createSelection(c.start);
    let notified = 0;
    const moves: (readonly [string, string])[] = [];
    store.subscribe(() => notified++);
    store.onMove((id, origin) => moves.push([id, origin]));
    const before = store.snapshot();
    for (const step of c.steps) {
      if (step[0] === "choose") store.choose(step[1], step[2]);
      else if (step[0] === "ask") store.ask(step[1], step[2]);
      else store.takeAsk();
    }
    expect(store.id()).toBe(c.id);
    expect(store.snapshot().id).toBe(c.id);
    expect(notified).toBe(c.notified);
    expect(moves).toEqual(c.moves);
    expect(store.hostCleared()).toBe(c.hostCleared);
    expect(store.snapshot().ask !== undefined).toBe(c.waiting);
    expect(Object.isFrozen(store.snapshot())).toBe(true);
    if (c.steps.length === 0 || notified === 0) expect(store.snapshot()).toBe(before);
    else expect(store.snapshot()).not.toBe(before);
  });

  it("takeAsk returns the ask once", () => {
    const store = createSelection("");
    store.ask("x", true);
    expect(store.snapshot().ask).toEqual({ quiet: true });
    expect(store.takeAsk()).toEqual({ quiet: true });
    expect(store.takeAsk()).toBeUndefined();
  });

  it("the snapshot keeps its identity between writes", () => {
    const store = createSelection("a");
    const first = store.snapshot();
    expect(store.snapshot()).toBe(first);
    store.choose("b", "visitor");
    const second = store.snapshot();
    expect(second).not.toBe(first);
    expect(store.snapshot()).toBe(second);
  });

  it("two stores never see each other's writes", () => {
    const one = createSelection("a");
    const two = createSelection("a");
    let heard = 0;
    two.subscribe(() => heard++);
    two.onMove(() => heard++);
    one.choose("b", "visitor");
    one.ask("c", false);
    expect(two.id()).toBe("a");
    expect(heard).toBe(0);
  });

  it("a stopped listener hears nothing", () => {
    const store = createSelection("a");
    let heard = 0;
    const stop = store.subscribe(() => heard++);
    const stopMove = store.onMove(() => heard++);
    stop();
    stopMove();
    store.choose("b", "visitor");
    expect(heard).toBe(0);
  });
});
