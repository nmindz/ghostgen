> [!CAUTION]
> **Every commit MUST follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
> No exceptions. No excuses. Non-compliant commits will break automated releases.**
> Format: `type(scope): description` — see [Commit Convention](#commit-convention) below.

# CLAUDE.md

## Repository Overview

Ghostgen — a native macOS GUI for configuring the Ghostty terminal emulator. Built with Tauri v2 + React + TypeScript + TailwindCSS.

**Repo**: `git@github.com:nmindz/ghostgen.git`

## Build/Test Commands

```bash
# Install dependencies
npm install

# Frontend build (TypeScript check + Vite)
npm run build

# Rust check
cd src-tauri && cargo check

# Full app build (debug)
npx tauri build --debug

# Full app build (release) + install
make install

# Dev server with hot reload
make dev
```

## Commit Convention

This repository uses **[Conventional Commits](https://conventionalcommits.org)** enforced by `semantic-release`.
Every commit message must follow the format:

```
type(scope): description
```

`scope` is optional. `description` must be lowercase and imperative.

### Types and version impact

| Type       | Version bump | Example                                         |
| ---------- | ------------ | ----------------------------------------------- |
| `feat`     | **minor**    | `feat(theme): add theme studio page`            |
| `fix`      | **patch**    | `fix(save): handle empty config on first save`  |
| `chore`    | none         | `chore: update dependencies`                    |
| `docs`     | none         | `docs: update README`                           |
| `style`    | none         | `style: reformat sidebar component`             |
| `refactor` | none         | `refactor(store): simplify dirty tracking`      |
| `test`     | none         | `test: add config parsing tests`                |
| `ci`       | none         | `ci: pin node version to 20`                    |

### Breaking changes → major version bump

Add `BREAKING CHANGE:` in the commit **footer** (any type triggers a major bump):

```
feat(config): restructure config store API

BREAKING CHANGE: the `load()` method now requires a parsed config object instead of raw text.
```

### Valid commit message examples

```
feat(backup): add backup and restore functionality
fix(import): handle malformed config files gracefully
chore: remove unused Ghost icon import
docs: document theme studio workflow
ci: add semantic-release workflow
```

### Ownership of CHANGELOG.md and version tags

- **Do NOT manually edit `CHANGELOG.md`** — it is owned and rewritten by `semantic-release`.
- **Do NOT manually create version tags** — tags (`v1.2.3`) are created automatically by
  `semantic-release` when a release-triggering commit is merged to `main`.
- The release workflow runs on `workflow_dispatch` (manual trigger).
  If no release-worthy commits are detected, semantic-release exits without creating a release.

## Critical Rules

- **DO NOT** commit secrets or credentials
- **DO NOT** commit and push without user review
- **DO NOT** manually edit `CHANGELOG.md` or create version tags
- Keep changes focused and minimal
- One logical change per commit
- Delete unused content. No dead code/text.
