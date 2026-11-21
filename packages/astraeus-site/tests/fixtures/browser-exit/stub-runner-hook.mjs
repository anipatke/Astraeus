// Test fixture for tests/browserExitPath.test.ts: `node --import <this file> run-browser.mjs` sends run-browser.mjs's "./runner.mjs" import to stub-runner.mjs.
import { register } from "node:module";

const stub = new URL("./stub-runner.mjs", import.meta.url).href;
const hooks = `export async function resolve(specifier, context, next) {
  if (specifier === "./runner.mjs" && /run-browser\\.mjs$/.test(context.parentURL ?? "")) return { url: ${JSON.stringify(stub)}, shortCircuit: true };
  return next(specifier, context);
}`;
register(`data:text/javascript,${encodeURIComponent(hooks)}`);
