import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Eye, Undo2, Trash2, Plus, ChevronUp, ChevronDown, Settings } from "lucide-react";
import Page from "@/components/views/Page";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConfigStore } from "@/stores/config";
import { useToastStore } from "@/stores/toasts";

interface BackupEntry {
  filename: string;
  timestamp: string;
  label: string | null;
  size_bytes: number;
  has_themes: boolean;
}

interface RestoreResult {
  config_restored: boolean;
  themes_restored: number;
  themes_skipped: number;
  themes_renamed: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(timestamp: string): string {
  const [date, time] = timestamp.split("_");
  if (!date || !time) return timestamp;
  return `${date} ${time.replace(/-/g, ":")}`;
}

type ThemeMode = "replace" | "merge";

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [label, setLabel] = useState("");
  const [includeThemes, setIncludeThemes] = useState(false);
  const [creating, setCreating] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<BackupEntry | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Backup location
  const [backupLocation, setBackupLocation] = useState("default");
  const [customPath, setCustomPath] = useState("");
  const [locationPaths, setLocationPaths] = useState<[string, string][]>([]);

  // Restore state
  const [restoreTarget, setRestoreTarget] = useState<BackupEntry | null>(null);
  const [restoreThemes, setRestoreThemes] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("merge");
  const [showThemeModeDialog, setShowThemeModeDialog] = useState(false);

  const addToast = useToastStore((s) => s.add);

  const effectiveLocation = backupLocation === "custom" ? customPath : backupLocation;

  const fetchBackups = useCallback(async () => {
    try {
      const list = await invoke<BackupEntry[]>("list_backups", { location: effectiveLocation });
      setBackups(list);
    } catch (err) {
      addToast(`Failed to load backups: ${err}`, "error");
    }
  }, [addToast, effectiveLocation]);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  useEffect(() => {
    invoke<[string, string][]>("get_backup_locations").then(setLocationPaths).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const entry = await invoke<BackupEntry>("create_backup", {
        label: label.trim() || null,
        includeThemes,
        location: effectiveLocation,
      });
      setBackups((prev) => [entry, ...prev]);
      setLabel("");
      addToast(
        includeThemes ? "Backup created (with themes)" : "Backup created",
        "success"
      );
    } catch (err) {
      addToast(`Failed to create backup: ${err}`, "error");
    } finally {
      setCreating(false);
    }
  };

  const handlePreview = async (backup: BackupEntry) => {
    try {
      const content = await invoke<string>("read_backup", {
        filename: backup.filename,
        location: effectiveLocation,
      });
      setPreviewContent(content);
      setPreviewFilename(backup.filename);
    } catch (err) {
      addToast(`Failed to read backup: ${err}`, "error");
    }
  };

  const initiateRestore = (backup: BackupEntry) => {
    setRestoreTarget(backup);
    setRestoreThemes(false);
    if (backup.has_themes) {
      setShowThemeModeDialog(true);
    } else {
      doRestore(backup, false, "merge");
    }
  };

  const confirmThemeModeAndRestore = () => {
    if (!restoreTarget) return;
    setShowThemeModeDialog(false);
    doRestore(restoreTarget, restoreThemes, themeMode);
  };

  const doRestore = async (backup: BackupEntry, withThemes: boolean, mode: ThemeMode) => {
    try {
      const result = await invoke<RestoreResult>("restore_backup", {
        filename: backup.filename,
        restoreThemes: withThemes,
        themeMode: mode,
        location: effectiveLocation,
      });
      await useConfigStore.getState().hydrate();

      const parts: string[] = ["Config restored."];
      if (withThemes) {
        if (result.themes_restored > 0) parts.push(`${result.themes_restored} themes added.`);
        if (result.themes_skipped > 0) parts.push(`${result.themes_skipped} identical skipped.`);
        if (result.themes_renamed > 0) parts.push(`${result.themes_renamed} renamed (conflict).`);
      }
      addToast(parts.join(" "), "success");
    } catch (err) {
      addToast(`Failed to restore: ${err}`, "error");
    } finally {
      setRestoreTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await invoke("delete_backup", {
        filename: confirmDelete.filename,
        location: effectiveLocation,
      });
      setBackups((prev) => prev.filter((b) => b.filename !== confirmDelete.filename));
      addToast("Backup deleted", "success");
    } catch (err) {
      addToast(`Failed to delete: ${err}`, "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleBrowseCustomPath = async () => {
    const path = await openDialog({ directory: true, title: "Choose backup directory" });
    if (path) {
      setCustomPath(path as string);
      setBackupLocation("custom");
    }
  };

  const locationLabel = (loc: string) => {
    const found = locationPaths.find(([k]) => k === loc);
    return found ? found[1] : loc;
  };

  return (
    <Page title="Backups">
      {/* Settings toggle */}
      <div className="backups-settings-toggle">
        <button className="kb-icon-btn" onClick={() => setShowSettings((v) => !v)} title="Backup settings">
          <Settings size={16} />
        </button>
        <span style={{ fontSize: 11, color: "var(--font-color-muted)" }}>
          {backupLocation === "custom" ? customPath : locationLabel(backupLocation)}
        </span>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="backups-settings-panel">
          <div className="backups-setting-row">
            <span className="backups-setting-label">Backup location</span>
            <div className="dropdown-wrapper">
              <select
                className="dropdown-native"
                value={backupLocation}
                onChange={(e) => setBackupLocation(e.target.value)}
              >
                <option value="default">Default (~/.config/ghostty/backups)</option>
                <option value="xdg">XDG (~/Library/Application Support/ghostgen/backups)</option>
                <option value="custom">Custom path...</option>
              </select>
              <span className="dropdown-label">
                {backupLocation === "default" ? "Default" : backupLocation === "xdg" ? "XDG" : "Custom"}
              </span>
              <span className="dropdown-chevrons">
                <ChevronUp size={10} strokeWidth={2.5} />
                <ChevronDown size={10} strokeWidth={2.5} />
              </span>
            </div>
          </div>
          {backupLocation === "custom" && (
            <div className="backups-setting-row">
              <span className="backups-setting-label">Path</span>
              <input
                type="text"
                className="text-input"
                style={{ flex: 1 }}
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="/path/to/backups"
              />
              <button className="dialog-btn dialog-btn-cancel" onClick={handleBrowseCustomPath}>
                Browse
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create backup */}
      <div className="backups-header">
        <input
          type="text"
          className="text-input"
          placeholder="Optional label..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
        />
        <label className="backups-checkbox">
          <input
            type="checkbox"
            checked={includeThemes}
            onChange={(e) => setIncludeThemes(e.target.checked)}
          />
          <span>Include themes</span>
        </label>
        <button
          className="dialog-btn dialog-btn-confirm"
          onClick={handleCreate}
          disabled={creating}
        >
          <Plus size={14} />
          {creating ? "Creating..." : "Create Backup"}
        </button>
      </div>

      {/* Backup list */}
      {backups.length === 0 ? (
        <div className="backups-empty">
          <p>No backups yet</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>
            Create a snapshot of your Ghostty config before making changes.
          </p>
          <button
            className="dialog-btn dialog-btn-confirm"
            style={{ marginTop: 16 }}
            onClick={handleCreate}
            disabled={creating}
          >
            Create Your First Backup
          </button>
        </div>
      ) : (
        <div className="backups-list">
          {backups.map((backup) => (
            <div key={backup.filename} className="backup-row">
              <div className="backup-info">
                <span className="backup-date">{formatDate(backup.timestamp)}</span>
                <span className="backup-label">
                  {backup.label || "Unlabeled"}
                  {backup.has_themes && " (with themes)"}
                </span>
              </div>
              <span className="backup-size">{formatSize(backup.size_bytes)}</span>
              <div className="backup-actions">
                <button className="backup-action-btn" title="Preview" onClick={() => handlePreview(backup)}>
                  <Eye size={14} />
                </button>
                <button className="backup-action-btn" title="Restore" onClick={() => initiateRestore(backup)}>
                  <Undo2 size={14} />
                </button>
                <button className="backup-action-btn" title="Delete" onClick={() => setConfirmDelete(backup)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewContent !== null && (
        <div className="dialog-overlay" onClick={() => setPreviewContent(null)}>
          <div className="dialog-box" style={{ maxWidth: 600, width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Preview: {previewFilename}</h3>
            <pre className="backup-preview-content">{previewContent || "(empty config)"}</pre>
            <div className="dialog-actions">
              <button className="dialog-btn dialog-btn-cancel" onClick={() => setPreviewContent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Restore with theme options */}
      {showThemeModeDialog && restoreTarget && (
        <div className="dialog-overlay" onClick={() => setShowThemeModeDialog(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Restore Backup</h3>
            <p className="dialog-message">
              Restore config from {formatDate(restoreTarget.timestamp)}?
              This will overwrite your current Ghostty config.
            </p>

            {restoreTarget.has_themes && (
              <div className="restore-theme-options">
                <label className="backups-checkbox">
                  <input
                    type="checkbox"
                    checked={restoreThemes}
                    onChange={(e) => setRestoreThemes(e.target.checked)}
                  />
                  <span>Restore custom themes</span>
                </label>

                {restoreThemes && (
                  <div className="restore-theme-mode">
                    <label className="backups-radio">
                      <input
                        type="radio"
                        name="theme-mode"
                        checked={themeMode === "merge"}
                        onChange={() => setThemeMode("merge")}
                      />
                      <div>
                        <span>Merge</span>
                        <span className="backups-radio-desc">
                          Keep existing themes. Identical files are skipped, conflicts are renamed.
                        </span>
                      </div>
                    </label>
                    <label className="backups-radio">
                      <input
                        type="radio"
                        name="theme-mode"
                        checked={themeMode === "replace"}
                        onChange={() => setThemeMode("replace")}
                      />
                      <div>
                        <span>Replace</span>
                        <span className="backups-radio-desc">
                          Delete all existing custom themes and restore only from backup.
                        </span>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}

            <div className="dialog-actions">
              <button className="dialog-btn dialog-btn-cancel" onClick={() => setShowThemeModeDialog(false)}>Cancel</button>
              <button className="dialog-btn dialog-btn-danger" onClick={confirmThemeModeAndRestore}>Restore</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Backup"
          message={`Delete backup from ${formatDate(confirmDelete.timestamp)}? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Page>
  );
}
