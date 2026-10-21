// typescript-eslint cannot load TypeScript 7 (the root `typescript`, used by tsc).
// Preloaded by `npm run lint`, this points require("typescript") at the side-by-side
// TypeScript 6 API package (`typescript6` in package.json). T-127.
const Module = require("node:module");
const ts6 = require.resolve("typescript6");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolve.call(this, request === "typescript" ? ts6 : request, ...rest);
};
