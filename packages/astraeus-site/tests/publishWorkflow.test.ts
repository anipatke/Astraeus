// O-036 T-162: the publish workflow, read as text (a real publish is never run here), and the example app's shape.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { planFor, publishArgs } from "../../../tools/publish-packages.mjs";

const root = join(__dirname, "..", "..", "..");
const workflow = readFileSync(join(root, ".github", "workflows", "publish.yml"), "utf8");
const at = (text: string) => workflow.indexOf(text);

describe("publish workflow", () => {
  it("runs on a published GitHub release, and by hand as a dry run", () => {
    expect(workflow).toMatch(/on:\s+release:\s+types: \[published\]\s+workflow_dispatch:/);
    expect(workflow).toContain('if [ "$EVENT" = "release" ]');
    expect(workflow).toMatch(/else\s+node tools\/publish-packages\.mjs --dry-run/);
  });

  it("signs in with OIDC (trusted publishing), not a stored token", () => {
    expect(workflow).toMatch(/permissions:\s+contents: read\s+id-token: write/);
    expect(workflow).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN|secrets\./);
    expect(workflow).toContain("node-version: 24");
  });

  it("runs the gates and the pack check before it publishes, in order", () => {
    const order = ["npm ci", "npm run lint", "npm run typecheck", "npm run build", "npm test", "npm run check:engine-alone", "npm run check:pack", "publish-packages.mjs --tag"].map(at);
    expect(order.every((index) => index > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("never calls npm publish itself and passes the release tag from an environment variable", () => {
    expect(workflow).not.toMatch(/npm publish/);
    expect(workflow).toContain("TAG: ${{ github.event.release.tag_name }}");
    expect(workflow).not.toMatch(/run:[^\n]*\$\{\{ github\.event\.release/);
  });
});

describe("publish plan", () => {
  it("skips a version already on npm and publishes a new one", () => {
    expect(planFor({ name: "astraeus", version: "0.1.0", published: true }).action).toBe("skip");
    expect(planFor({ name: "astraeus", version: "0.1.0", published: false }).action).toBe("publish");
  });

  it("refuses when the release tag and the package version differ", () => {
    expect(planFor({ name: "astraeus", version: "0.1.0", tag: "v0.1.1", published: false }).action).toBe("refuse");
    expect(planFor({ name: "astraeus", version: "0.1.0", tag: "v0.1.0", published: false }).action).toBe("publish");
    expect(planFor({ name: "astraeus", version: "0.1.0", tag: "0.1.0", published: false }).action).toBe("publish");
  });

  it("publishes with provenance, and a dry run sends and signs nothing", () => {
    expect(publishArgs("dist", false)).toEqual(["publish", "dist", "--access", "public", "--provenance"]);
    expect(publishArgs("dist", true)).toEqual(["publish", "dist", "--access", "public", "--dry-run"]);
  });
});

describe("example app", () => {
  const dir = join(root, "examples", "hello-scene");
  const main = readFileSync(join(dir, "src", "main.js"), "utf8");
  it("draws through the public API in about twenty lines", () => {
    expect(main.trim().split("\n").length).toBeLessThanOrEqual(22);
    expect(main).toMatch(/from "astraeus"/);
    expect(main).not.toMatch(/from "(\.|astraeus\/)/);
    for (const call of ["addBody", "addTrajectory", "setTime", "camera.follow", "mount("]) expect(main).toContain(call);
  });

  it("installs packed tarballs, not workspace links, and keeps its build output out of git", () => {
    const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    expect(JSON.stringify(manifest.devDependencies)).not.toMatch(/workspace:|file:|link:/);
    expect(manifest.dependencies).toBeUndefined();
    expect(readFileSync(join(root, "tools", "build-example.mjs"), "utf8")).toContain('"pack"');
    const ignored = readFileSync(join(dir, ".gitignore"), "utf8").split("\n");
    for (const entry of ["node_modules/", "dist/", ".packs/"]) expect(ignored).toContain(entry);
    expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).workspaces).toEqual(["packages/*"]);
  });
});
