// The field readers the plain-data settings parsers (showers, planets) share, bound to each parser's own failure (STYLE-07).
import { fieldReaders, type FieldFailure, type Raw } from "../core/fieldReaders";

export function settingsFields(fail: FieldFailure) {
  const readers = fieldReaders(fail);

  function positive(parent: Raw, key: string, path: string): number {
    const value = readers.finite(parent, key, path);
    if (!(value > 0)) fail(`${path}.${key}`, `must be above zero, got ${value}`);
    return value;
  }

  return { ...readers, positive };
}
