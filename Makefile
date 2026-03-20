# ============================================================================
# ghostgen — Native GUI for Ghostty terminal configuration
# ============================================================================

APP_NAME     := Ghostgen
BUNDLE_DIR   := src-tauri/target/release/bundle/macos
INSTALL_DIR  := /Applications

.DEFAULT_GOAL := build

# ============================================================================
# Build
# ============================================================================

.PHONY: build
build: ## Build debug (frontend + Tauri)
	npx tauri build --debug

.PHONY: release
release: ## Build optimized release
	npx tauri build

.PHONY: frontend
frontend: ## Build frontend only
	npm run build

.PHONY: install
install: release ## Build release and install to /Applications
	@rm -rf '$(INSTALL_DIR)/$(APP_NAME).app'
	cp -R '$(BUNDLE_DIR)/$(APP_NAME).app' '$(INSTALL_DIR)/$(APP_NAME).app'
	@echo 'Installed $(APP_NAME) to $(INSTALL_DIR)'

.PHONY: uninstall
uninstall: ## Remove from /Applications
	rm -rf '$(INSTALL_DIR)/$(APP_NAME).app'
	@echo 'Removed $(APP_NAME) from $(INSTALL_DIR)'

.PHONY: reinstall
reinstall: uninstall install ## Uninstall then install fresh

# ============================================================================
# Development
# ============================================================================

.PHONY: dev
dev: ## Start dev server with hot reload
	npx tauri dev

.PHONY: deps
deps: ## Install npm dependencies
	npm install

# ============================================================================
# Quality
# ============================================================================

.PHONY: check
check: ## TypeScript type check
	npx tsc --noEmit

.PHONY: clippy
clippy: ## Run clippy on Rust code
	cd src-tauri && cargo clippy -- -D warnings

.PHONY: fmt
fmt: ## Format Rust code
	cd src-tauri && cargo fmt

.PHONY: lint
lint: check clippy ## Run all linting

# ============================================================================
# Clean
# ============================================================================

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf dist
	cd src-tauri && cargo clean

.PHONY: clean-deps
clean-deps: clean ## Remove build artifacts and node_modules
	rm -rf node_modules

# ============================================================================
# Help
# ============================================================================

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*##"}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
