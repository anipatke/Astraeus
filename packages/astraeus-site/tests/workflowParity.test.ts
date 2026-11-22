import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { STEPS } from "../tools/validate/browser-steps.mjs";

// O-091 T-416: the push/PR workflow, the release workflow, `quality_gates` and docs/RELEASING.md stay in step. Each rule takes parsed objects and returns its problems.
const root = join(import.meta.dirname, "..", "..", "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

type Step = { name?: string; run?: string; uses?: string; if?: unknown; "continue-on-error"?: unknown };
type Job = {
  if?: unknown;
  "continue-on-error"?: unknown;
  permissions?: Record<string, string>;
  steps: Step[];
  strategy?: { matrix?: { node?: number[] } };
};
type Workflow = {
  on: Record<string, Record<string, unknown> | null>;
  permissions?: Record<string, string>;
  jobs: Record<string, Job>;
};
type Context = { ci: Workflow; publish: Workflow; gates: string[]; engineNode: string; releasing: string };

const ci = (): Workflow => parse(read(".github/workflows/ci.yml"));
const publish = (): Workflow => parse(read(".github/workflows/publish.yml"));
const gates = (): string[] => {
  const config = parse(read(".savepoint/config.yml")).quality_gates as Record<string, unknown>;
  return ["lint", "typecheck", "build", "test"].map((key) => String(config[key]));
};
const real = (): Context => ({
  ci: ci(),
  publish: publish(),
  gates: gates(),
  engineNode: JSON.parse(read("package.json")).engines.node,
  releasing: read("docs/RELEASING.md"),
});

const runs = (job: Job) => job.steps.map((step) => step.run?.trim() ?? "");
const publishIndex = (job: Job) => runs(job).findIndex((run) => run.includes("tools/publish-packages.mjs"));
/** The npm script a command runs: `npm run X ...` or `npm test ...`; undefined for anything else. */
const scriptOf = (command: string) => /^npm (?:run (\S+)|(test))/.exec(command)?.slice(1).find(Boolean);
const releaseJob = (context: Context) => context.publish.jobs.publish;
const beforePublish = (context: Context) => runs(releaseJob(context)).slice(0, publishIndex(releaseJob(context)));
const browserSteps = STEPS.filter((step) => "example" in step).map((step) => step.name);
const releaseScripts = [
  "check:engine-alone",
  "check:pack",
  "check:node-consumer",
  "check:react-consumer",
  "check:three-newest",
];

const rules: Record<string, (context: Context) => string[]> = {
  "ci triggers": ({ ci: workflow }) => {
    const problems: string[] = [];
    if (!("push" in workflow.on)) problems.push("ci.yml has no push trigger");
    if (!("pull_request" in workflow.on)) problems.push("ci.yml has no pull_request trigger");
    for (const key of ["paths", "paths-ignore", "branches", "branches-ignore", "tags", "tags-ignore"])
      if (workflow.on.push && key in workflow.on.push) problems.push(`ci.yml push is filtered by ${key}`);
    return problems;
  },
  "ci node versions": ({ ci: workflow, engineNode }) => {
    const matrix = workflow.jobs.gates.strategy?.matrix?.node ?? [];
    const floor = Number(/\d+/.exec(engineNode)?.[0]);
    const problems: string[] = [];
    if (JSON.stringify(matrix) !== JSON.stringify([22, 24]))
      problems.push(`ci.yml node matrix is ${JSON.stringify(matrix)}, not [22,24]`);
    if (!matrix.includes(floor)) problems.push(`ci.yml node matrix lacks the engines floor ${floor}`);
    return problems;
  },
  "ci gates equal quality_gates": ({ ci: workflow, gates: expected }) => {
    const all = runs(workflow.jobs.gates);
    const after = all.slice(all.indexOf("npm ci") + 1);
    return JSON.stringify(after) === JSON.stringify(expected)
      ? []
      : [`ci.yml gate steps ${JSON.stringify(after)} differ from quality_gates ${JSON.stringify(expected)}`];
  },
  "release covers ci": (context) => {
    const before = beforePublish(context).map(scriptOf);
    return context.gates
      .map(scriptOf)
      .filter((script) => !before.includes(script))
      .map((script) => `publish.yml does not run ${script} before publishing`);
  },
  "release checks before publishing": (context) => {
    const before = beforePublish(context);
    const problems = releaseScripts
      .filter((script) => !before.some((run) => scriptOf(run) === script))
      .map((script) => `publish.yml does not run ${script} before publishing`);
    const browser = before.find((run) => scriptOf(run) === "check:browser");
    const listed = browser === undefined ? [] : [...browser.matchAll(/--step (\S+)/g)].map((match) => match[1]);
    if (JSON.stringify(listed) !== JSON.stringify(browserSteps))
      problems.push(
        `publish.yml browser steps ${JSON.stringify(listed)} differ from the example steps ${JSON.stringify(browserSteps)}`,
      );
    return problems;
  },
  // The real workflows use no `if` or `continue-on-error` on any step or job, so none is allowed: either would let a gate be skipped or its failure ignored.
  "no step or job is skippable": ({ ci: first, publish: second }) => {
    const problems: string[] = [];
    for (const [name, workflow] of [
      ["ci.yml", first],
      ["publish.yml", second],
    ] as const)
      for (const [id, job] of Object.entries(workflow.jobs)) {
        for (const key of ["if", "continue-on-error"] as const)
          if (key in job) problems.push(`${name} job ${id} has ${key}`);
        for (const step of job.steps)
          for (const key of ["if", "continue-on-error"] as const)
            if (key in step) problems.push(`${name} job ${id} step ${step.name ?? step.run ?? step.uses} has ${key}`);
      }
    return problems;
  },
  "ci never publishes": ({ ci: workflow }) =>
    Object.entries(workflow.jobs).flatMap(([id, job]) =>
      runs(job)
        .filter(
          (run) => run.includes("npm publish") || (run.includes("publish-packages.mjs") && !run.includes("--dry-run")),
        )
        .map(() => `ci.yml job ${id} runs npm publish`),
    ),
  "publish step is guarded": ({ publish: workflow }) => {
    const all = Object.values(workflow.jobs).flatMap(runs);
    const step = all.find((run) => run.includes("tools/publish-packages.mjs"));
    const problems: string[] = [];
    if (step === undefined || !step.includes("--dry-run")) problems.push("the publish step has no --dry-run branch");
    if (all.some((run) => run.includes("npm publish"))) problems.push("a workflow runs npm publish");
    return problems;
  },
  permissions: ({ ci: first, publish: second }) => {
    const problems: string[] = [];
    for (const [name, workflow] of [
      ["ci.yml", first],
      ["publish.yml", second],
    ] as const)
      if (JSON.stringify(workflow.permissions) !== JSON.stringify({ contents: "read" }))
        problems.push(`${name} workflow-level permissions are not {contents: read}`);
    for (const [name, workflow] of [
      ["ci.yml", first],
      ["publish.yml", second],
    ] as const)
      for (const [id, job] of Object.entries(workflow.jobs))
        if (job.permissions?.["id-token"] !== undefined && !(name === "publish.yml" && id === "publish"))
          problems.push(`${name} job ${id} has id-token`);
    if (second.jobs.publish.permissions?.["id-token"] !== "write")
      problems.push("publish.yml publish job lacks id-token: write");
    return problems;
  },
  "action references": ({ ci: first, publish: second }) => {
    const shas = new Map<string, Set<string>>();
    const problems: string[] = [];
    for (const workflow of [first, second])
      for (const job of Object.values(workflow.jobs))
        for (const step of job.steps) {
          if (step.uses === undefined) continue;
          const found = /^([^@]+)@([0-9a-f]{40})$/.exec(step.uses);
          if (found === null) problems.push(`${step.uses} is not owner/repo@<40 hex>`);
          else shas.set(found[1], (shas.get(found[1]) ?? new Set()).add(found[2]));
        }
    for (const [action, set] of shas) if (set.size > 1) problems.push(`${action} uses different SHAs across workflows`);
    return problems;
  },
  "release docs name what runs": ({ releasing }) => {
    const start = releasing.indexOf("## What is checked where");
    const table = start < 0 ? "" : releasing.slice(start);
    const problems = releaseScripts
      .filter((script) => !table.includes(`npm run ${script}`))
      .map((script) => `RELEASING.md table lacks npm run ${script}`);
    if (!table.includes(".github/workflows/ci.yml")) problems.push("RELEASING.md table does not name ci.yml");
    return problems;
  },
};

const without = (workflow: Workflow, drop: (step: Step) => boolean, job: string): Workflow => {
  const copy: Workflow = structuredClone(workflow);
  copy.jobs[job].steps = copy.jobs[job].steps.filter((step) => !drop(step));
  return copy;
};

type Plant = [string, string, (context: Context) => Context, string];
const plants: Plant[] = [
  ["ci triggers", "drop pull_request", (c) => ({ ...c, ci: { ...c.ci, on: { push: c.ci.on.push } } }), "pull_request"],
  [
    "ci node versions",
    "matrix [24]",
    (c) => ({
      ...c,
      ci: { ...structuredClone(c.ci), jobs: { gates: { ...c.ci.jobs.gates, strategy: { matrix: { node: [24] } } } } },
    }),
    "node matrix",
  ],
  [
    "ci gates equal quality_gates",
    "remove the lint step",
    (c) => ({ ...c, ci: without(c.ci, (s) => s.run === "npm run lint", "gates") }),
    "differ",
  ],
  [
    "ci gates equal quality_gates",
    "reorder build and test",
    (c) => ({ ...c, gates: [c.gates[0], c.gates[1], c.gates[3], c.gates[2]] }),
    "differ",
  ],
  [
    "release covers ci",
    "remove npm test",
    (c) => ({ ...c, publish: without(c.publish, (s) => s.run?.startsWith("npm test") === true, "publish") }),
    "test before",
  ],
  [
    "release checks before publishing",
    "node consumer after publish",
    (c) => {
      const copy = structuredClone(c.publish);
      const steps = copy.jobs.publish.steps;
      const index = steps.findIndex((s) => s.run === "npm run check:node-consumer");
      const [moved] = steps.splice(index, 1);
      steps.push(moved);
      return { ...c, publish: copy };
    },
    "check:node-consumer",
  ],
  [
    "release checks before publishing",
    "drop --step hello-sky",
    (c) => {
      const copy = structuredClone(c.publish);
      for (const step of copy.jobs.publish.steps) step.run = step.run?.replace(" --step hello-sky", "");
      return { ...c, publish: copy };
    },
    "browser steps",
  ],
  [
    "publish step is guarded",
    "remove --dry-run",
    (c) => {
      const copy = structuredClone(c.publish);
      for (const step of copy.jobs.publish.steps) step.run = step.run?.replace("--dry-run", "");
      return { ...c, publish: copy };
    },
    "--dry-run",
  ],
  ...(["paths-ignore", "branches-ignore"] as const).map((key): Plant => [
    "ci triggers",
    `push ${key}`,
    (c) => ({ ...c, ci: { ...c.ci, on: { ...c.ci.on, push: { [key]: ["docs/**"] } } } }),
    key,
  ]),
  ...(["ci", "publish"] as const).flatMap((file) =>
    (["if", "continue-on-error"] as const).flatMap((key) =>
      (["step", "job"] as const).map((level): Plant => [
        "no step or job is skippable",
        `${file}.yml ${level} ${key}`,
        (c) => {
          const copy = structuredClone(c[file]);
          const job = copy.jobs[file === "ci" ? "gates" : "publish"];
          const target =
            level === "job"
              ? job
              : (job.steps.find(
                  (s) =>
                    s.run === (file === "ci" ? "npm run lint" : "npm run check:browser") ||
                    s.run?.startsWith("npm run check:browser"),
                ) ?? job.steps[0]);
          target[key] = key === "if" ? false : true;
          return { ...c, [file]: copy };
        },
        key,
      ]),
    ),
  ),
  [
    "ci never publishes",
    "npm publish in a ci job",
    (c) => {
      const copy = structuredClone(c.ci);
      copy.jobs.release = { steps: [{ run: "npm publish" }] };
      return { ...c, ci: copy };
    },
    "npm publish",
  ],
  [
    "ci never publishes",
    "publish-packages without --dry-run in a ci job",
    (c) => {
      const copy = structuredClone(c.ci);
      copy.jobs.gates.steps.push({ run: "node tools/publish-packages.mjs --tag latest" });
      return { ...c, ci: copy };
    },
    "npm publish",
  ],
  [
    "permissions",
    "workflow-level id-token",
    (c) => ({ ...c, ci: { ...c.ci, permissions: { contents: "read", "id-token": "write" } } }),
    "workflow-level",
  ],
  [
    "action references",
    "actions/checkout@v7",
    (c) => {
      const copy = structuredClone(c.ci);
      copy.jobs.gates.steps[0].uses = "actions/checkout@v7";
      return { ...c, ci: copy };
    },
    "actions/checkout@v7",
  ],
  [
    "release docs name what runs",
    "table without the Node consumer",
    (c) => ({ ...c, releasing: c.releasing.replaceAll("npm run check:node-consumer", "") }),
    "check:node-consumer",
  ],
];

describe("workflows, gates and release docs stay in step", () => {
  it("every rule passes on the real files", () => {
    const context = real();
    for (const [name, rule] of Object.entries(rules)) expect(rule(context), name).toEqual([]);
  });

  it.each(plants)("%s: a planted defect (%s) is named", (name, _plant, plant, expected) => {
    const problems = rules[name](plant(real()));
    expect(problems.length, name).toBeGreaterThan(0);
    expect(problems.join("\n")).toContain(expected);
  });

  it("every rule has a plant", () => {
    expect(new Set(plants.map(([name]) => name))).toEqual(new Set(Object.keys(rules)));
  });
});
