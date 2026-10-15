// Parallel Planner with Review — four-phase orchestration loop
//
// Runs both:
//   1. Locally WITHOUT Docker (default: `noSandbox()` + git worktrees per issue)
//   2. In GitHub Actions (`.github/workflows/sandcastle.yml`, ephemeral runner VM + git worktrees)
//   3. Optionally in Docker or Podman (`SANDCASTLE_SANDBOX=docker` or `podman`)
//
// Phases:
//   Phase 0 (Pre-check):        Fast `gh issue list` check — exits immediately if no
//                               open `Sandcastle`-labeled issues exist.
//   Phase 1 (Plan):             The planning agent analyzes open issues, builds a
//                               dependency graph, and outputs a <plan> JSON
//                               listing unblocked issues with branch names.
//   Phase 2 (Execute + Review): For each issue, a git worktree sandbox is created via
//                               createSandbox(). The implementer runs first
//                               (up to 100 iterations). If it produces commits, a
//                               reviewer runs in the same worktree on the same
//                               branch (1 iteration). All issue pipelines run
//                               concurrently via Promise.allSettled().
//   Phase 3 (Merge):            A single agent merges all completed branches
//                               into the current branch, verifies `check` + `build`,
//                               and closes completed issues.
//
// Usage:
//   npm run sandcastle                  # local Docker-free (git worktrees)
//   npm run sandcastle:gh               # trigger + watch on GitHub Actions
//   SANDCASTLE_SANDBOX=docker npm run sandcastle

import { execFileSync } from "node:child_process";
import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import { noSandbox } from "@ai-hero/sandcastle/sandboxes/no-sandbox";
import { podman } from "@ai-hero/sandcastle/sandboxes/podman";
import { z } from "zod";

const planSchema = z.object({
  issues: z.array(
    z.object({ id: z.string(), title: z.string(), branch: z.string() }),
  ),
});

// ---------------------------------------------------------------------------
// Configuration (override via environment variables or .sandcastle/.env)
// ---------------------------------------------------------------------------

type SandboxMode = "local" | "no-sandbox" | "docker" | "podman";

const SANDBOX_MODE = (
  process.env.SANDCASTLE_SANDBOX?.toLowerCase() ?? "local"
) as SandboxMode;

const MODEL =
  process.env.SANDCASTLE_MODEL || "opencode/muse-spark-1.3-contributor-free";

const MAX_ITERATIONS = Number.parseInt(
  process.env.SANDCASTLE_MAX_ITERATIONS || "10",
  10,
);

function createSandboxProvider(): sandcastle.SandboxProvider {
  const forwardedEnv: Record<string, string> = {};
  if (process.env.OPENCODE_API_KEY) {
    forwardedEnv.OPENCODE_API_KEY = process.env.OPENCODE_API_KEY;
  }
  if (process.env.GH_TOKEN) {
    forwardedEnv.GH_TOKEN = process.env.GH_TOKEN;
  } else if (process.env.GITHUB_TOKEN) {
    forwardedEnv.GH_TOKEN = process.env.GITHUB_TOKEN;
  }

  switch (SANDBOX_MODE) {
    case "docker":
      return docker({ env: forwardedEnv });
    case "podman":
      return podman({ env: forwardedEnv });
    case "local":
    case "no-sandbox":
    default:
      return noSandbox({ env: forwardedEnv });
  }
}

/**
 * Wraps `sandcastle.opencode()` so that:
 * 1. OpenCode v1.18+ receives `--auto` (its native non-interactive permission
 *    auto-approval flag) instead of `--dangerously-skip-permissions`.
 * 2. `OPENCODE_PERMISSION` is set to allow all tool calls in unattended runs.
 */
function createAgent(model = MODEL): sandcastle.AgentProvider {
  const base = sandcastle.opencode(model, {
    env: {
      OPENCODE_PERMISSION: JSON.stringify({ "*": "allow" }),
    },
  });

  return {
    ...base,
    buildPrintCommand(options) {
      const cmd = base.buildPrintCommand(options);
      return {
        ...cmd,
        command: cmd.command.replace(
          "--dangerously-skip-permissions",
          "--auto",
        ),
      };
    },
  };
}

/**
 * Fast pre-check so we don't spin up an LLM call when the Sandcastle backlog is empty.
 */
function hasOpenSandcastleIssues(): boolean {
  try {
    const out = execFileSync(
      "gh",
      [
        "issue",
        "list",
        "--state",
        "open",
        "--label",
        "Sandcastle",
        "--limit",
        "1",
        "--json",
        "number",
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).trim();
    const parsed = JSON.parse(out) as Array<{ number: number }>;
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return true;
  }
}

const isContainerSandbox =
  SANDBOX_MODE === "docker" || SANDBOX_MODE === "podman";

const worktreeHooks: sandcastle.SandboxHooks = {
  sandbox: {
    onSandboxReady: [
      {
        command: isContainerSandbox
          ? "npm install --prefer-offline --no-audit --no-fund"
          : "[ -d node_modules ] || npm install --prefer-offline --no-audit --no-fund",
      },
    ],
  },
};

const headHooks: sandcastle.SandboxHooks = isContainerSandbox
  ? worktreeHooks
  : {};

const copyToWorktree = ["node_modules"];

console.log(
  `Sandcastle starting (sandbox=${SANDBOX_MODE}, model=${MODEL}, maxIterations=${MAX_ITERATIONS})`,
);

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
  if (!hasOpenSandcastleIssues()) {
    console.log("No open issues labeled 'Sandcastle'. Exiting cleanly.");
    break;
  }

  console.log(`\n=== Iteration ${iteration}/${MAX_ITERATIONS} ===\n`);

  // -------------------------------------------------------------------------
  // Phase 1: Plan
  // -------------------------------------------------------------------------
  const plan = await sandcastle.run({
    hooks: headHooks,
    sandbox: createSandboxProvider(),
    name: "planner",
    maxIterations: 1,
    agent: createAgent(),
    promptFile: "./.sandcastle/plan-prompt.md",
    output: sandcastle.Output.object({ tag: "plan", schema: planSchema }),
  });

  const issues = plan.output.issues;

  if (issues.length === 0) {
    console.log("No unblocked issues to work on. Exiting.");
    break;
  }

  console.log(
    `Planning complete. ${issues.length} issue(s) to work in parallel:`,
  );
  for (const issue of issues) {
    console.log(`  #${issue.id}: ${issue.title} → ${issue.branch}`);
  }

  // -------------------------------------------------------------------------
  // Phase 2: Execute + Review (isolated git worktree per issue)
  // -------------------------------------------------------------------------
  const settled = await Promise.allSettled(
    issues.map(async (issue) => {
      const sandbox = await sandcastle.createSandbox({
        branch: issue.branch,
        sandbox: createSandboxProvider(),
        hooks: worktreeHooks,
        copyToWorktree,
      });

      try {
        const implement = await sandbox.run({
          name: `implementer-${issue.id}`,
          maxIterations: 100,
          agent: createAgent(),
          promptFile: "./.sandcastle/implement-prompt.md",
          promptArgs: {
            TASK_ID: issue.id,
            ISSUE_TITLE: issue.title,
            BRANCH: issue.branch,
          },
        });

        if (implement.commits.length > 0) {
          const review = await sandbox.run({
            name: `reviewer-${issue.id}`,
            maxIterations: 1,
            agent: createAgent(),
            promptFile: "./.sandcastle/review-prompt.md",
            promptArgs: {
              BRANCH: issue.branch,
            },
          });

          return {
            ...review,
            commits: [...implement.commits, ...review.commits],
          };
        }

        return implement;
      } finally {
        await sandbox.close();
      }
    }),
  );

  for (const [i, outcome] of settled.entries()) {
    if (outcome.status === "rejected") {
      console.error(
        `  ✗ #${issues[i]!.id} (${issues[i]!.branch}) failed: ${outcome.reason}`,
      );
    }
  }

  const completedIssues = settled
    .map((outcome, i) => ({ outcome, issue: issues[i]! }))
    .filter(
      (entry) =>
        entry.outcome.status === "fulfilled" &&
        entry.outcome.value.commits.length > 0,
    )
    .map((entry) => entry.issue);

  const completedBranches = completedIssues.map((i) => i.branch);

  console.log(
    `\nExecution complete. ${completedBranches.length} branch(es) with commits:`,
  );
  for (const branch of completedBranches) {
    console.log(`  ${branch}`);
  }

  if (completedBranches.length === 0) {
    console.log("No commits produced. Stopping loop.");
    break;
  }

  // -------------------------------------------------------------------------
  // Phase 3: Merge
  // -------------------------------------------------------------------------
  await sandcastle.run({
    hooks: headHooks,
    sandbox: createSandboxProvider(),
    name: "merger",
    maxIterations: 1,
    agent: createAgent(),
    promptFile: "./.sandcastle/merge-prompt.md",
    promptArgs: {
      BRANCHES: completedBranches.map((b) => `- ${b}`).join("\n"),
      ISSUES: completedIssues.map((i) => `- ${i.id}: ${i.title}`).join("\n"),
    },
  });

  console.log("\nBranches merged.");
}

console.log("\nAll done.");
