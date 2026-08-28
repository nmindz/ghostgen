# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read [AGENTS.md](AGENTS.md)

All guidance for this repository lives in **[AGENTS.md](AGENTS.md)** — build and lint commands,
architecture, code conventions, the commit convention, and the critical rules. Read it before
making changes.

This file exists only so that Claude Code finds its way there. Do not duplicate guidance here;
update `AGENTS.md` instead.

> [!CAUTION]
> Every commit MUST follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
> `semantic-release` parses commit messages, so a non-compliant message breaks automated releases.
> Format: `type(scope): description`. See [AGENTS.md](AGENTS.md#commit-convention).
