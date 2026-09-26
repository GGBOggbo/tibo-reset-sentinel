#!/usr/bin/env bash
set -euo pipefail

git add data/events.json data/health.json
if git diff --cached --quiet; then
  echo "No data changes to commit"
  exit 0
fi

export GIT_AUTHOR_NAME="sentinel-bot"
export GIT_AUTHOR_EMAIL="actions@users.noreply.github.com"
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"
git commit -m "chore(data): refresh reset records and poll health [skip ci]"
# Rebase only after saving this run's data; dirty worktrees cannot be rebased.
git pull --rebase origin main
git push origin HEAD:main
