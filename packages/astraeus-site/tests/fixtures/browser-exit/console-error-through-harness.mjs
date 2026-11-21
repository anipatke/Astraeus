// Test fixture for tests/browserExitPath.test.ts: a browser step that opens one blank page through the real harness and logs a console error, throwing nothing.
import { checkScript } from "../../../tools/validate/harness.mjs";

await checkScript({ name: "planted-console-error", viewports: [{ width: 320, height: 240 }] }, async (page) => {
  await page.setContent("<p>blank</p>");
  await page.evaluate(() => console.error("planted console error"));
  return "ok";
});
