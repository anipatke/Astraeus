// The project's one default wait (I-204, packages/astraeus/vitest.waits.setup.ts): an unnamed timeout waits past Vitest's 1 s default; a named one is kept.
import { describe, expect, it, vi } from "vitest";

const readyAfter = (ms: number) => {
  const at = Date.now() + ms;
  return () => Date.now() >= at;
};

describe("vi.waitFor and vi.waitUntil defaults", () => {
  it("an unnamed timeout outlasts Vitest's 1 s default", async () => {
    const ready = readyAfter(1300);
    await vi.waitFor(() => expect(ready()).toBe(true));
    const again = readyAfter(1300);
    await expect(vi.waitUntil(again)).resolves.toBe(true);
  });

  it("a named timeout is kept", async () => {
    const never = () => false;
    await expect(vi.waitUntil(never, { timeout: 100 })).rejects.toThrow();
    await expect(vi.waitFor(() => expect(never()).toBe(true), 100)).rejects.toThrow();
  });
});
