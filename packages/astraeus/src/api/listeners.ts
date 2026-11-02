/** Reports a host listener's throw to the page: `reportError` (a window `error` event) when the page has it, else rethrown on a timer so it still surfaces and nothing else is stopped. */
function reportToPage(error: unknown): void {
  const report = (globalThis as { reportError?: (error: unknown) => void }).reportError;
  if (typeof report === "function") report.call(globalThis, error);
  else setTimeout(() => { throw error; }, 0);
}

/**
 * Calls every listener with `value`, over a copy of the set (a listener that stops itself or adds one during the call changes the next call, not this one).
 * A listener that throws is reported to the page after its turn and never stops the listeners after it.
 */
export function callListeners<T>(listeners: ReadonlySet<(value: T) => void>, value: T): void {
  const failures: unknown[] = [];
  for (const listener of [...listeners]) {
    try { listener(value); } catch (error) { failures.push(error); }
  }
  for (const error of failures) reportToPage(error);
}
