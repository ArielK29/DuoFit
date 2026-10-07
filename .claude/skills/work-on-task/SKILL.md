---
name: work-on-task
description: "Use when the owner says \"בוא נעבוד על משימה\", \"המשימה הבאה\", \"let's work on a task\", \"next task\" or similar. Runs the full DuoFit task workflow: find the right GitHub issue, check what can run in parallel, plan, execute with sub-agents, test and review, then close the issue and update the board."
metadata:
  author: duofit
  version: "1.0.0"
---

# Work on a task (DuoFit)

One entry point that chains the other skills. Follow the six steps in order. Reply to the owner in **Hebrew**, short and simple (the owner is a non-technical founder with limited use of their hands: keep questions to a minimum, decide sensible defaults, and say what you decided).

Repo: `ArielK29/DuoFit`, app in `duofit/`. Board: https://github.com/users/ArielK29/projects/2 (project id `PVT_kwHOBcqzts4Bkmsv`). Issue titles carry the priority order ("1 · ...", "2 · ..."): lower number = do first.

## 1. Find the relevant issue
- `gh issue list --state open --json number,title,labels,body` and read the board Status of each (Todo / In Progress / Done).
- Pick the issue by the **current state**, not just the number: an issue already In Progress comes first; otherwise the lowest order number that is not blocked by another open issue ("Depends on"). Read the issue body fully, plus `CLAUDE.md` and the memory notes that touch it.
- If two issues are equally valid, choose one, say why in one sentence, and continue (do not ask unless the choice changes cost, security or data).
- Move the issue to **In Progress** on the board (GraphQL `updateProjectV2ItemFieldValue`) and create the branch `feature/<short-name>` from an up-to-date `main`.

## 2. Check what can run in parallel
- List the other open issues and mark which ones touch different areas (different folders, no shared migration, no dependency). Only those may run in parallel.
- Parallel work uses separate branches (a git worktree per branch, skill `superpowers:using-git-worktrees`) and separate sub-agents (skill `superpowers:dispatching-parallel-agents`). Never run two tasks that edit the same files or the same database tables.
- Tell the owner in 2-3 lines what could be parallel and what you chose to do now.

## 3. Write the plan
- If the requirements are unclear or there are real design choices: `superpowers:brainstorming` first.
- Write an expert-level step plan with `superpowers:writing-plans`: files to change, order, tests, risks, and what is explicitly out of scope. Save it under `docs/superpowers/plans/` (date + name).
- For anything that touches the database, auth, storage or policies: read the `supabase` and `supabase-postgres-best-practices` skills first and follow the "Database, Permissions & RLS" rules in `CLAUDE.md`.

## 4. Execute with sub-agents
- Use `superpowers:subagent-driven-development` (or `superpowers:executing-plans` for small tasks). Give each sub-agent a self-contained prompt with file paths and acceptance checks.
- Follow the project rules: RTL/Hebrew UI, design tokens (no hard-coded colors), 48px touch targets, no invented people outside the demo flag, never put keys in the repo or type API keys for the owner, never add `EXPO_PUBLIC_DEMO_DATA` to a real build.
- Commit in small steps in English with the `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` trailer.

## 5. Tests and review
- Write or extend tests with `superpowers:test-driven-development` where logic exists (database changes: extend `supabase/tests/rls_smoke_test.sql` and run it).
- Run, and read the output of: `npx tsc --noEmit`, `npx expo lint`, and the Snyk scans required by `CLAUDE.md` (code scan after app-code changes, dependency scan after package changes). For database work also run the Supabase security advisors (must be 0 findings).
- Review with `superpowers:requesting-code-review` (or the `ncode-saas-toolkit:code-reviewer` agent for security-sensitive changes). Fix what it finds.
- Check the result for real (browser preview at 375px, or the live site) before claiming it works: `superpowers:verification-before-completion`. Say clearly what was **not** verified (for example on-device behavior).

## 6. Close the task
- Open a PR with a clear body (what changed, how it was verified, what is not verified) ending with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. **Merge only when the owner says "תמזג".**
- Update the issue: tick the finished checklist items, add what is left, and close it only if everything in it is done. Update the board Status (Done / In Progress).
- Update `סיכום-פיתוח-DuoFit.md` and the memory notes when a stage finishes.
- Delete the merged branch, return to `main`, and tell the owner in a few lines: what was done, what is open, and the next task by priority order.
