/** Reads the bytes at a bundled address: a `file:` address with Node's own module (found at run time, so a browser bundle never resolves it; Node's `fetch` does not serve `file:`), anything else by `fetch`. One reader for every bundled file the engine loads (moon fit chunks, the star list). */
async function readFileUrl(url: string): Promise<Uint8Array> {
  const nodeFs = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } }).process?.getBuiltinModule?.("node:fs/promises") as { readFile(path: URL): Promise<Uint8Array> } | undefined;
  if (nodeFs === undefined) throw new Error(`${url}: this runtime cannot read a file: address`);
  return new Uint8Array(await nodeFs.readFile(new URL(url)));
}

export const fetchBytesOf = async (url: string): Promise<Uint8Array> => {
  if (url.startsWith("file:")) return readFileUrl(url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
};
