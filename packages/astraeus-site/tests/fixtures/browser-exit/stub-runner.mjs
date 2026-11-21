// Test fixture for tests/browserExitPath.test.ts: stands in for tools/validate/runner.mjs under run-browser.mjs. runSet takes any arguments and resolves to the number in STUB_RUNSET_RESULT.
export async function runSet() {
  return Number(process.env.STUB_RUNSET_RESULT);
}
