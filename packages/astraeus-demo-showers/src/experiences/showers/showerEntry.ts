/** The key an entry finds a settings file under: its file name without folder or extension. */
export function showerEntryName(path: string): string {
  const file = path.slice(path.lastIndexOf("/") + 1);
  return file.endsWith(".json") ? file.slice(0, -".json".length) : file;
}
