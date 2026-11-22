// One default wait for every test (I-204): Vitest's `vi.waitFor` and `vi.waitUntil` give up after 1 s unless a call names a timeout, and under a loaded parallel
// run (16 workers, the owner working too) a DOM change can take longer, so tests failed with no defect (I-203 viewerIds, then twoViewers' shelf panel).
// A call that names its own timeout keeps it; one that does not gets WAIT_DEFAULT_MS, still far under the 30 s test timeout in vitest.config.ts.
import { vi } from "vitest";

export const WAIT_DEFAULT_MS = 10_000;

type WaitOptions = number | { timeout?: number; interval?: number } | undefined;
const withDefault = (options: WaitOptions) =>
  typeof options === "number" ? options : { ...options, timeout: options?.timeout ?? WAIT_DEFAULT_MS };

const waitFor = vi.waitFor.bind(vi);
const waitUntil = vi.waitUntil.bind(vi);
vi.waitFor = ((callback, options?: WaitOptions) => waitFor(callback, withDefault(options))) as typeof vi.waitFor;
vi.waitUntil = ((callback, options?: WaitOptions) => waitUntil(callback, withDefault(options))) as typeof vi.waitUntil;
