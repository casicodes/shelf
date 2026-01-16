# Git Commit & Push (Solo Workflow)

## Goal

Create clear, intentional commits and push directly to main with minimal friction. Designed for solo projects where speed matters, but commit history should still make sense.

## 1. Check status (default)

Confirm what files have changed and what will be committed.

```bash
git status
```

This answers:

- What changed?
- What's staged vs unstaged?
- Am I about to commit the right files?

If changes are large, unexpected, or span multiple areas, use `git diff` or `git diff --cached` to review details.

## 2. Optional: Issue key

If you're tracking work (GitHub / Linear / Jira), include an issue key (e.g. #123, PROJ-456).

If not, skip it — commits should still be readable on their own.

## 3. Stage changes

For side projects, prefer momentum over micro-management.

```bash
git add -A
```

## 4. Create commit

Write a short, focused, imperative commit message.

### Format

```
<type>(<scope>): <Short summary>
```

With issue key:

```
<issue-key>: <type>(<scope>): <Short summary>
```

### Examples

```bash
git commit -m "fix(auth): Handle expired token refresh"
git commit -m "add(bookmarks): Support image previews"
git commit -m "#123: update(ui): Improve list spacing"
```

### Rules

- ≤ 72 characters
- Imperative mood: add, fix, update, remove
- Capitalize the first letter of the summary
- No trailing period
- Describe intent, not noise (`fix bug` ❌ → `fix(sync): Prevent duplicate saves` ✅)

## 5. Push to main

```bash
git push origin main
```

## 6. If push is rejected

Keep history linear.

```bash
git pull --rebase
git push origin main
```

If a force push is required:

```bash
git push --force-with-lease origin main
```

(Only when you clearly understand why.)

## Commit Types (recommended)

- `add` – New feature or capability
- `fix` – Bug fix
- `update` – Improvement without breaking behavior
- `refactor` – Internal change, no behavior change
- `chore` – Tooling, config, cleanup

## Notes

- Work directly on main
- Prefer rebase over merge
- Small, intentional commits beat perfect granularity

## Philosophy

Commits are for future you. Clear intent beats process.
