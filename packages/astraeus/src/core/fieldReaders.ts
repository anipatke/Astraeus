/** A plain object read from JSON-like data. */
export type Raw = Readonly<Record<string, unknown>>;

/** Throws the caller's own error type for the field at `path`; the readers below never return after it. */
export type FieldFailure = (path: string, problem: string) => never;

const ISO_UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/**
 * The field readers every plain-data parser needs (an object, non-empty text, a finite number, an ISO-8601 UTC time), bound to the
 * parser's own failure so its errors keep their type and wording. Each error names the field by its dotted path.
 */
export function fieldReaders(fail: FieldFailure) {
  function record(value: unknown, path: string): Raw {
    if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path, "is required and must be an object");
    return value as Raw;
  }

  function text(parent: Raw, key: string, path: string): string {
    const value = parent[key];
    if (typeof value !== "string" || value.trim().length === 0) fail(`${path}.${key}`, "is required and must be non-empty text");
    return value;
  }

  function finite(parent: Raw, key: string, path: string): number {
    const value = parent[key];
    if (typeof value !== "number" || !Number.isFinite(value)) fail(`${path}.${key}`, "is required and must be a finite number");
    return value;
  }

  function instant(parent: Raw, key: string, path: string): string {
    const value = text(parent, key, path);
    if (!ISO_UTC_INSTANT.test(value) || !Number.isFinite(Date.parse(value))) {
      fail(`${path}.${key}`, `must be an ISO-8601 UTC time like 2030-01-01T00:00:00Z, got "${value}"`);
    }
    return value;
  }

  return { record, text, finite, instant };
}
