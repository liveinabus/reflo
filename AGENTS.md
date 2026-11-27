
## Codex working protocol


For each GitHub issue:

1. Read this file and any more-specific `AGENTS.md` files, then read the complete issue, linked context, acceptance criteria, and relevant repository files.
2. Inspect `git status` before changing anything. Preserve pre-existing user work; never stage, reset, stash, or include unrelated changes without explicit direction.
3. Confirm the GitHub remote and default branch. Fetch the latest `main`, check whether the issue already exists or is already addressed, and create a scoped feature branch from `origin/main`. If the remote, issue, or branch cannot be verified, stop before committing or pushing and report the blocker.
4. Keep changes within the issue. Ask before expanding scope or making a consequential app-design decision. Do not create extra app work while handling workflow or tooling tasks.
5. Run checks appropriate to the issue and available environment.
6. Review the final diff and `git diff --check`.
7. Commit only issue-scoped files on the feature branch, push that branch, and open a PR linked to the issue (for example, `Closes #123`). Never push directly to `main`.
8. Leave a concise handoff with the issue and PR links, branch and commit, changed files, checks performed and results, screenshots when relevant, and any remaining blocker.
