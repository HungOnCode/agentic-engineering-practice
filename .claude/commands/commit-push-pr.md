---
description: Commit staged changes, push the current branch, and open a pull request
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(gh pr create:*)
---

Commit all staged changes, push them to the current branch, and open a pull request.

1. Run `git status` to show what will be committed.
2. Run `git diff --staged` to review the staged changes.
3. Write a commit message in Conventional Commits format (e.g. `feat: ...`, `fix: ...`, `refactor: ...`) based on what was staged.
4. Run `git commit` with that message.
5. Run `git push origin <current-branch>`, getting the branch name from `git branch --show-current`.
6. Run `gh pr create --fill` to open a pull request, using the commit message as the PR title and body.

If nothing is staged, stop and say so instead of committing.
