import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Eye, Undo2, Trash2, Plus } from "lucide-react";
import Page from "@/components/views/Page";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConfigStore } from "@/stores/config";
import { useToastStore } from "@/stores/toasts";

interface BackupEntry {
  filename: string;
  timestamp: string;
  label: string | null;
  size_bytes: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(timestamp: string): string {
  // timestamp format: YYYY-MM-DD_HH-MM-SS
  const [date, time] = timestamp.split("_");
  if (!date || !time) return timestamp;
  const timeParts = time.replace(/-/g, ":");
  return `${date} ${timeParts}`;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState("");
  const [confirmRestore, setConfirmRestore] = useState<BackupEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BackupEntry | null>(null);
  const addToast = useToastStore((s) => s.add);

  const fetchBackups = useCallback(async () => {
    try {
      const list = await invoke<BackupEntry[]>("list_backups");
      setBackups(list);
    } catch (err) {
      addToast(`Failed to load backups: ${err}`, "error");
    }
  }, [addToast]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const entry = await invoke<BackupEntry>("create_backup", {
        label: label.trim() || null,
      });
      setBackups((prev) => [entry, ...prev]);
      setLabel("");
      addToast("Backup created", "success");
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
      });
      setPreviewContent(content);
      setPreviewFilename(backup.filename);
    } catch (err) {
      addToast(`Failed to read backup: ${err}`, "error");
    }
  };

  const handleRestore = async () => {
    if (!confirmRestore) return;
    try {
      await invoke("restore_backup", { filename: confirmRestore.filename });
      await useConfigStore.getState().hydrate();
      addToast(
        `Config restored from ${formatDate(confirmRestore.timestamp)}. Ghostty will use the restored config on reload.`,
        "success"
      );
    } catch (err) {
      addToast(`Failed to restore backup: ${err}`, "error");
    } finally {
      setConfirmRestore(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await invoke("delete_backup", { filename: confirmDelete.filename });
      setBackups((prev) =>
        prev.filter((b) => b.filename !== confirmDelete.filename)
      );
      addToast("Backup deleted", "success");
    } catch (err) {
      addToast(`Failed to delete backup: ${err}`, "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <Page title="Backups">
      <div className="backups-header">
        <input
          type="text"
          className="text-input"
          placeholder="Optional label..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
        <button
          className="dialog-btn dialog-btn-confirm"
          onClick={handleCreate}
          disabled={creating}
        >
          <Plus size={14} />
          {creating ? "Creating..." : "Create Backup"}
        </button>
      </div>

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
                <span className="backup-date">
                  {formatDate(backup.timestamp)}
                </span>
                <span className="backup-label">
                  {backup.label || "Unlabeled"}
                </span>
              </div>
              <span className="backup-size">
                {formatSize(backup.size_bytes)}
              </span>
              <div className="backup-actions">
                <button
                  className="backup-action-btn"
                  title="Preview"
                  onClick={() => handlePreview(backup)}
                >
                  <Eye size={14} />
                </button>
                <button
                  className="backup-action-btn"
                  title="Restore"
                  onClick={() => setConfirmRestore(backup)}
                >
                  <Undo2 size={14} />
                </button>
                <button
                  className="backup-action-btn"
                  title="Delete"
                  onClick={() => setConfirmDelete(backup)}
                >
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
          <div
            className="dialog-box"
            style={{ maxWidth: 600, width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="dialog-title">Preview: {previewFilename}</h3>
            <pre className="backup-preview-content">{previewContent || "(empty config)"}</pre>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-cancel"
                onClick={() => setPreviewContent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation */}
      {confirmRestore && (
        <ConfirmDialog
          title="Restore Backup"
          message={`Restore backup from ${formatDate(confirmRestore.timestamp)}? This will overwrite your current Ghostty config.`}
          confirmLabel="Restore"
          cancelLabel="Cancel"
          danger
          onConfirm={handleRestore}
          onCancel={() => setConfirmRestore(null)}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Backup"
          message={`Delete backup from ${formatDate(confirmDelete.timestamp)}? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </Page>
  );
}
