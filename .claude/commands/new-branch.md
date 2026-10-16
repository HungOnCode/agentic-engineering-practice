---
description: Create and switch to a new branch from a short description
argument-hint: <short description>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git switch:*)
---

Create a new git branch for: $ARGUMENTS

1. Run `git status`. If there are uncommitted changes, mention that they will come along to the new branch.
2. Pick a prefix: `fix/` for bug fixes, `docs/` for documentation, otherwise `feat/`.
3. Turn the description into a short kebab-case name, e.g. `feat/add-tag-filtering`.
4. Run `git switch -c <name>`.
5. Confirm with `git branch --show-current` and report the branch name.

If no description is given, ask for one instead of guessing.
