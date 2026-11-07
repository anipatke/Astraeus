// Test fixture for tests/browserExitPath.test.ts: a browser step that opens one blank page through the real harness and then throws, as a failed assertion does.
import { checkScript } from "../../../tools/validate/harness.mjs";

await checkScript({ name: "planted-throw", viewports: [{ width: 320, height: 240 }] }, async (page) => {
  await page.setContent("<p>blank</p>");
  throw new Error("planted assertion failure");
});
