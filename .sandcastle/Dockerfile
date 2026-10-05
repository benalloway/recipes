# Sandcastle agent sandbox for the recipes repo.
# Build once on the owner machine: docker build -t sandcastle:recipes .sandcastle/
# Rebuild when Node/gh/opencode versions need to move. Never push this image anywhere.
FROM node:24-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends git curl gnupg ca-certificates \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y --no-install-recommends gh \
  && rm -rf /var/lib/apt/lists/*

# OpenCode CLI (the agent binary Sandcastle drives inside the sandbox).
RUN npm i -g opencode-ai

# The agent runs as root inside the container by default; repo files are
# bind-mounted from a git worktree, so host ownership is preserved on write.
WORKDIR /repo
