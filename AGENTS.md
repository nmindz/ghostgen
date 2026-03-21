# AGENTS.md

Guidance for coding agents working in this repository.

## Project snapshot

- **App**: Ghostgen (Tauri v2 + React + TypeScript)
- **Frontend**: Vite, React 18, TypeScript, Tailwind v4, Zustand
- **Backend**: Rust commands exposed via `#[tauri::command]`
- **Primary task runner**: `Makefile` (preferred entrypoint)

## AI rules discovery

Checked for additional AI instruction files:

- `.cursor/rules/*` → **none found**
- `.cursorrules` → **none found**
- `.github/copilot-instructions.md` → **none found**

## Build / lint / test commands

Use these exact repository commands.

### Development

- `make deps` — install npm dependencies
- `make dev` — run Tauri dev mode (hot reload)

### Build / release / install

- `make build` — debug build (frontend + Tauri)
- `make frontend` — build frontend only (`npm run build`)
- `make release` — optimized release build
- `make install` — build release and copy `Ghostgen.app` to `/Applications`
- `make uninstall` — remove app from `/Applications`
- `make reinstall` — uninstall then install

### Lint / quality

- `make check` — TypeScript type check (`tsc --noEmit`)
- `make clippy` — Rust lint (`cargo clippy -- -D warnings`)
- `make fmt` — format Rust (`cargo fmt`)
- `make lint` — runs `check` + `clippy`

### Clean

- `make clean` — remove frontend/build artifacts + `cargo clean`
- `make clean-deps` — `make clean` + remove `node_modules`

### Test commands

Current repo state:

- No frontend test runner configured (no Vitest/Jest/Playwright config found).
- No Rust test files found under `src-tauri/tests` or `#[cfg(test)]` modules in inspected files.

**Single-test command:** currently **not available** (no test infrastructure/files to target).

## Code style guidelines (from current code)

### Imports

- TypeScript uses **ES modules** with `"` quotes and semicolons.
- Prefer alias imports from `@/` for `src/*` paths (configured in `tsconfig.json` + `vite.config.ts`).
- Use relative imports for same-folder components (example: `./Group`).
- Use type-only imports where appropriate (`import type { HexColor } ...`).

### Formatting

- **TypeScript/TSX**: 2-space indentation, semicolons, double quotes.
- Keep JSX readable with small inline handlers; extract helper functions when logic grows.
- **Rust**: format with `cargo fmt`; keep clippy clean with warnings denied (`-D warnings`).

### Types

- TypeScript is `strict` (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).
- Avoid `any`; use `unknown` and narrow explicitly.
- Use explicit interfaces/types for component/store contracts (`ThemeColors`, store interfaces).
- In Zustand stores, keep state updates immutable (copy objects/arrays before mutation).

### Naming conventions

- React components: **PascalCase** (`ThemeStudio`, `SettingsPage`).
- TS variables/functions/hooks: **camelCase** (`parseConfig`, `setColorScheme`).
- Rust functions/modules: **snake_case** (`read_ghostty_config`, `list_custom_themes`).
- Tauri command names should remain stable; frontend `invoke()` relies on exact names.

### Error handling

- Frontend:
  - Wrap async Tauri calls in `try/catch`.
  - Show user-facing failures via toast messages.
  - Use `console.error` for non-fatal diagnostics.
  - Re-throw when caller must handle failure (example: store `save`).
- Rust:
  - Return `Result<_, String>` from commands.
  - Convert IO errors with `map_err(|e| format!(...))`.
  - Validate user-supplied names/paths (path traversal checks in themes/backup commands).
  - Ensure parent directories exist before writes/copies.

## Agent workflow tips

- Prefer `make` targets over ad-hoc commands.
- For frontend/backend changes together, run at least: `make check` and `make clippy`.
- Do not introduce new tooling (ESLint/Prettier/test frameworks) unless explicitly requested.
