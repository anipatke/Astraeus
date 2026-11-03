
const P = "/tmp/claude-1000/-home-user-code-Astraeus/7d0c4483-c4ed-4937-a995-e725ceffa34a/scratchpad/o056check/probes";
export default ({
  root: "/home/user/code/Astraeus",
  define: { __PUBLIC_BUILD__: "false" },
  server: { fs: { allow: ["/home/user/code/Astraeus", P] } },
  test: {
    environment: "node",
    projects: [
      { root: "/home/user/code/Astraeus", define: { __PUBLIC_BUILD__: "false" }, test: { name: "warm", include: [`${P}/warm*.test.ts`], setupFiles: ["/home/user/code/Astraeus/packages/astraeus/vitest.setup.ts"] } },
      { root: "/home/user/code/Astraeus", define: { __PUBLIC_BUILD__: "false" }, test: { name: "cold", include: [`${P}/cold*.test.ts`] } },
    ],
  },
});
