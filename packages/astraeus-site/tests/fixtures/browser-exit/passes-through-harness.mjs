// Test fixture for tests/browserExitPath.test.ts: the control, the same step without the throw.
import { checkScript } from "../../../tools/validate/harness.mjs";

await checkScript({ name: "planted-pass", viewports: [{ width: 320, height: 240 }] }, async (page) => {
  await page.setContent("<p>blank</p>");
  return "ok";
});
