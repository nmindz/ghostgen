# AGENTS.md

Guidance for coding agents working in this repository. `CLAUDE.md` redirects here — this is the
single source of truth.

## Project snapshot

Ghostgen is a native macOS GUI for configuring the [Ghostty](https://ghostty.org) terminal. It
reads and writes `~/.config/ghostty/config` directly; there is no server, no database, and no
sync service.

- **Shell**: Tauri v2 (Rust), macOS 12+, bundle id `io.hyvmind.ghostgen`
- **Frontend**: Vite + React 18 + TypeScript (strict) + Tailwind v4 + Zustand, `HashRouter`
- **Backend**: 16 `#[tauri::command]` functions across 4 modules
- **Task runner**: `Makefile` — prefer it over ad-hoc commands
- **License**: GPL-3.0-or-later

## Commands

| Command | What it does |
| --- | --- |
| `make deps` | `npm install` |
| `make dev` | Tauri dev mode with hot reload (Vite on port 1420, strict) |
| `make check` | `tsc --noEmit` |
| `make clippy` | `cargo clippy -- -D warnings` |
| `make lint` | `check` + `clippy` |
| `make fmt` | `cargo fmt` |
| `make frontend` | Frontend build only (`tsc && vite build`) |
| `make build` | Debug app build |
| `make release` | Optimized app build |
| `make install` | Release build, then copy `Ghostgen.app` to `/Applications` |
| `make clean` | Remove `dist/` and run `cargo clean` |

After touching both sides, run at least `make lint`.

### Tests

There is no test infrastructure — no Vitest/Jest/Playwright config, no `src-tauri/tests`, no
`#[cfg(test)]` modules. **There is no single-test command.** Do not add a test framework unless
asked; if asked, propose the choice before installing anything.

## Architecture

### The settings schema is the source of truth

`src/data/settings.ts` exports `Panel[]` — a three-level tree of `Panel > Group > SettingItem`
covering 300+ Ghostty options. Everything else derives from it:

- `src/stores/config.ts` builds the `defaults` map by walking the tree once at module load.
- `SettingsPage` looks the panel up by the `:category` route param and renders each
  `SettingItem` by its `type` (`switch`, `number`, `dropdown`, `text`, `color`, `palette`,
  `keybinds`, `theme`).

**Adding a Ghostty option means adding one `SettingItem`** — no store change, no new component,
no route. Adding a *new* `SettingType`, by contrast, requires a branch in `SettingsPage` and a
matching input component under `src/components/settings/`.

### The camelCase ⇄ kebab-case boundary

Ghostty's config file uses kebab-case (`clipboard-paste-protection`); the store uses camelCase
keys. `parseConfig` converts inbound, `keyToConfigKey` converts outbound. **A `SettingItem.id`
must be the exact camelCase form of the Ghostty key**, or the setting will silently never load
or save.

### Writes are diffs, not dumps

`save()` writes `stringify()` of `diff()` — only values that differ from the schema defaults
reach disk, so an untouched Ghostty config stays untouched. Four cases are special:

- `keybind` — array; diff emits only entries not present in defaults, one `keybind = …` line each.
- `palette` — 256-entry array; diff emits `palette = <index>=<hex>` per changed index only.
- Theme-owned colors — when `config.theme` is non-empty, `background`, `foreground`,
  `selectionBackground`, `selectionForeground`, `cursorColor`, `cursorText` and `palette` are
  **suppressed entirely**, because the theme file owns them.
- `custom:` prefix — stripped from `theme` on write (see below).

### Dirty tracking

The store keeps `diskConfig` as a snapshot of the last successful load/save and compares it to
`config` via `configsEqual` (shallow, array-aware). `isDirty` drives `SaveButton`, the ⌘S
handler, and the `onCloseRequested` guard in `App.tsx` that blocks quitting with unsaved work.
Any new mutation path must go through `set`/`setMany`/`load` so this stays correct.

### Three theme sources, one store field

`config.theme` can mean three different things, resolved in `hydrate()`:

1. **Built-in Ghostty theme** — the name is fetched at runtime from the iTerm2-Color-Schemes
   repo on GitHub via `fetchColorScheme` (in `settings.ts`). This is a **live network
   dependency**; `tauri.conf.json` sets `csp: null` to permit it.
2. **Custom theme** — a file in `~/.config/ghostty/themes/`, read through the Rust `themes`
   commands. Stored as `custom:<name>` so the UI can tell the two apart; the prefix is stripped
   on write.
3. **No theme** — individual colour settings are used directly.

On hydrate the resolved theme's colours are merged in **as a base layer**: explicit config
values always win. Failures are swallowed (`catch {}`) and fall through to defaults, so a
missing theme file or an offline machine still yields a usable app.

### The app chrome is themed by the terminal theme

`src/hooks/useAppTheme.ts` derives ~35 CSS custom properties from `config.background`,
`config.foreground` and `config.palette`, then writes them onto `document.documentElement`.
`isDark(background)` picks light or dark behaviour, and `--overlay-rgb` flips between white and
black so the same `rgba(var(--overlay-rgb), …)` rules work in both.

**`src/app.css` must reference these variables and never hardcode a colour** — a literal hex or
`rgba(255,255,255,…)` will look wrong the moment someone loads a light theme.

### Rust backend

Four modules under `src-tauri/src/commands/`, all registered in `lib.rs`:

| Module | Responsibility |
| --- | --- |
| `config` | Read/write `~/.config/ghostty/config`; generic `read_file`/`write_file` for import/export |
| `themes` | CRUD over `~/.config/ghostty/themes/` |
| `backup` | Gzipped tar archives of config (+ optional themes) |
| `fonts` | System font family enumeration via `font-kit` |

Every command returns `Result<_, String>`. Paths derive from `dirs::home_dir()`. `validate_name`
and `validate_filename` reject `..`, `/` and `\` — keep those checks on any new path-taking
command.

### Backups

`create_backup` writes `<timestamp>[_<label>].tar.gz` containing the config file and, optionally,
the `themes/` directory. Three destinations: `default` (`~/.config/ghostty/backups`), `xdg`
(`~/.config/ghostgen/backups`), or an arbitrary absolute path.

`restore_backup` reads the whole archive into memory first, then applies it. Theme conflicts
resolve by SHA-256: identical content is **skipped**, differing content is written alongside as
`<name>_<backup-label>` (**renamed**) — nothing is silently overwritten unless `theme_mode` is
`"replace"`. `RestoreResult` reports the four counts so the UI can explain what happened.

Files that do not end in `.tar.gz` are treated as legacy plain-config backups and still restore.

## Conventions

### TypeScript

- Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- 2-space indent, double quotes, semicolons.
- Import `src/*` through the `@/` alias (declared in both `tsconfig.json` and `vite.config.ts`);
  use relative paths only within the same folder.
- Avoid `any` — prefer `unknown` and narrow. Use `import type` for type-only imports.
- Zustand updates are immutable: copy objects and arrays before mutating.
- Components are PascalCase; variables, functions and hooks are camelCase.

### Rust

- `cargo fmt` for formatting; clippy must be clean with `-D warnings`.
- snake_case functions and modules.
- Convert IO errors with `map_err(|e| format!(…))`; create parent directories before writing.
- **Tauri command names are API.** The frontend calls them by string through `invoke()` — a
  rename silently breaks the app at runtime, not at build time.

### Commit convention

Every commit must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) —
`semantic-release` parses them, so a non-compliant message breaks automated releases.

```
type(scope): description
```

Scope is optional; the description is lowercase and imperative.

| Type | Version bump |
| --- | --- |
| `feat` | minor |
| `fix` | patch |
| `chore`, `docs`, `style`, `refactor`, `test`, `ci` | none |

A `BREAKING CHANGE:` footer triggers a major bump regardless of type.

## Critical rules

- **Never** edit `CHANGELOG.md` or create version tags by hand — `semantic-release` owns both.
  The release workflow runs on `workflow_dispatch`.
- **Never** commit build output or local tooling state. `_prds/`, `.claude/`, `dist/` and
  `src-tauri/target` are gitignored; `src-tauri/target` is commonly a symlink, so the ignore rule
  deliberately has no trailing slash.
- Do not commit and push without user review.
- Do not add tooling (ESLint, Prettier, test frameworks) unless explicitly asked.
- One logical change per commit. Delete unused content — no dead code or dead text.
