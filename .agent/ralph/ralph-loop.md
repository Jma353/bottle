# Ralph Loop

Use `.agent/ralph/plan/todo.md` as the product and implementation roadmap for your task.

For each loop iteration:

1. Read `AGENTS.md`, `.agent/ralph/plan/todo.md`, and `.agent/ralph/plan/log.md`.
2. Pick exactly one unchecked task from `.agent/ralph/plan/todo.md`.
3. Implement the smallest coherent change that completes that task.
4. Add or update focused tests for the behavior changed.
5. Run relevant checks. Prefer the full project checks when practical:
   - `pnpm fmt`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
6. Update `.agent/ralph/plan/todo.md` by checking off only the completed task.
7. Append a dated entry to `.agent/ralph/plan/log.md` with:
   - task completed
   - files changed
   - checks run and results
   - any follow-up notes

If every task in `.agent/ralph/plan/todo.md` is complete, say `DONE` and make no changes.
