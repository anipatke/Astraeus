// The public addresses of the launch demos (O-024 T-093, moved here from T-082): the one list the home page, the browser checks and the
// tests read. The portfolio embeds these (O-020 Decision 5); old addresses (earth-moon, shower-perseids, shower-geminids) are not redirected.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const DEMO_ADDRESSES = ["app.html", "app.html?experience=showers", "app.html?experience=jupiter-io"];
/** Addresses that no page may link any more. */
export const RETIRED_ADDRESSES = ["experience=earth-moon", "experience=shower-perseids", "experience=shower-geminids"];

/** Every page of a built folder (dist) that links a retired address, as "<file>: <address>". Empty when no link dangles. */
export function danglingLinks(directory) {
  const found = [];
  for (const name of readdirSync(directory).filter((file) => file.endsWith(".html"))) {
    const text = readFileSync(join(directory, name), "utf8");
    for (const address of RETIRED_ADDRESSES) if (text.includes(address)) found.push(`${name}: ${address}`);
  }
  return found;
}

if (process.argv[1]?.endsWith("public-addresses.mjs")) {
  const problems = danglingLinks(process.argv[2] ?? "dist");
  if (problems.length > 0) { console.error(`dangling links:\n${problems.join("\n")}`); process.exit(1); }
  console.log(`ok: ${DEMO_ADDRESSES.join(", ")} listed; no built page links a retired address`);
}
