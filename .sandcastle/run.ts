/**
 * Local Sandcastle runner: `npm run agent:local -- <issue-number> [--review]`
 *
 * Runs an OpenCode agent in a Docker-backed git worktree on an explicit issue
 * branch based off origin/main, then the HOST pushes the branch and opens the
 * PR (the sandbox never sees GH_TOKEN or Cloudflare credentials).
 *
 * Setup (owner machine, once):
 *   1. cp .sandcastle/.env.example .sandcastle/.env  (fill OPENCODE_API_KEY)
 *   2. docker build -t sandcastle:recipes .sandcastle/
 */
import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { run, opencode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

const sh = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, { encoding: "utf8" }).trim();

const issueNumber = process.argv[2];
if (!issueNumber || !/^\d+$/.test(issueNumber)) {
  console.error("usage: npm run agent:local -- <issue-number> [--review]");
  process.exit(1);
}
const reviewOnly = process.argv.includes("--review");

// The host checkout must be clean enough to mint a branch: refuse on main,
// refuse with uncommitted changes (they would not travel to the worktree).
const hostBranch = sh("git", ["branch", "--show-current"]);
if (hostBranch === "main") {
  console.error("refusing: run from a non-main checkout (worktree branches from origin/main)");
  process.exit(1);
}
if (sh("git", ["status", "--porcelain"]) !== "") {
  console.error("refusing: host checkout has uncommitted changes");
  process.exit(1);
}

// Never stack cloud work: refuse while a cloud implement/review run for this
// issue is in flight — a running cloud run will NOT abort (cancel-in-progress: false).
const active = JSON.parse(
  sh("gh", ["run", "list", "--limit", "50", "--json", "name,status,headBranch"]),
).filter(
  (r: { name: string; status: string }) =>
    (r.name === "opencode-implement" || r.name === "opencode-review") &&
    (r.status === "in_progress" || r.status === "queued" || r.status === "waiting"),
);
if (active.length > 0) {
  console.error(`refusing: cloud workflow runs in flight: ${JSON.stringify(active)}`);
  process.exit(1);
}

const meta = JSON.parse(
  sh("gh", ["issue", "view", issueNumber, "--json", "title,labels,state"]),
);
if (meta.state !== "OPEN") {
  console.error(`refusing: issue #${issueNumber} is ${meta.state}`);
  process.exit(1);
}
const labels: string[] = meta.labels.map((l: { name: string }) => l.name);
for (const lethal of ["ready-for-human", "blocked-external", "wayfinder:map"]) {
  if (labels.includes(lethal)) {
    console.error(`refusing: issue carries ${lethal}`);
    process.exit(1);
  }
}
// wayfinder decision tickets resolve on the tracker, never in a worktree.
if (labels.some((l) => l.startsWith("wayfinder:"))) {
  console.error("refusing: wayfinder tickets resolve via tracker comments, not worktrees");
  process.exit(1);
}

const slug = String(meta.title)
  .toLowerCase()
  .replace(/^[a-z0-9]+\([^)]*\):\s*/, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 50);
const mMilestone = /^m(\d)/i.exec(String(meta.title));
const branch = mMilestone ? `feat/m${mMilestone[1]}-${slug}` : `fix/${slug}`;

sh("git", ["fetch", "origin", "main"]);
try {
  sh("git", ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]);
  console.log(`reusing existing branch ${branch}`);
} catch {
  sh("git", ["branch", branch, "origin/main"]);
  console.log(`created ${branch} off origin/main`);
}

const promptFile = path.join(
  import.meta.dirname,
  reviewOnly ? "review-prompt.md" : "implement-prompt.md",
);

const result = await run({
  name: `local-#${issueNumber}`,
  agent: opencode("opencode/muse-spark-1.3-contributor-free", {
    variant: "max",
    env: { OPENCODE_API_KEY: process.env.OPENCODE_API_KEY ?? "" },
  }),
  sandbox: docker({ imageName: "sandcastle:recipes" }),
  branchStrategy: { type: "branch", branch },
  promptFile,
  promptArgs: {
    ISSUE_NUMBER: issueNumber,
    ISSUE_TITLE: String(meta.title),
    BRANCH: branch,
  },
  maxIterations: 5,
});

console.log(`commits: ${result.commits.length}, signal: ${result.completionSignal}`);
console.log(`Next (host): git push -u origin ${branch} && gh pr create --base main  (then hand to owner for merge)`);
