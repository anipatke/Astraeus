// Test fixture for tests/browserExitPath.test.ts: a step that exits 0 but prints a line the runner counts as an error (runner.mjs ERROR_LINE).
console.log("console error: planted line");
process.exit(0);
