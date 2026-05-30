#!/usr/bin/env bash
set -euo pipefail

while true; do
  devin -p --permission-mode bypass -- "
Read AGENTS.md, .agent/ralph/plan/todo.md, and .agent/ralph/plan/log.md.
Pick exactly one unchecked task from .agent/ralph/plan/todo.md.
Implement it.
Run relevant checks from package.json.
Update .agent/ralph/plan/todo.md and .agent/ralph/plan/log.md.
If all tasks are complete, say DONE and make no changes.
"

  if [[ -z "$(git status --porcelain)" ]]; then
    echo "No changes. Stopping."
    break
  fi

  git status --short
  git add .
  git commit -m "agent: progress one ralph loop step" || true

  if ! grep -q '\[ \]' .agent/ralph/plan/todo.md; then
    echo "All tasks complete."
    break
  fi
done
