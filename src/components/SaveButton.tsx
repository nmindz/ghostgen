import { useState, useRef, useEffect } from "react";
import { Save, ChevronDown, Archive } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useConfigStore } from "@/stores/config";
import { useToastStore } from "@/stores/toasts";

export default function SaveButton() {
  const isDirty = useConfigStore((s) => s.isDirty);
  const saving = useConfigStore((s) => s.saving);
  const save = useConfigStore((s) => s.save);
  const addToast = useToastStore((s) => s.add);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleSave = async () => {
    try {
      await save();
      addToast("Config saved to disk", "success");
    } catch (err) {
      addToast(`Failed to save: ${err}`, "error");
    }
  };

  const handleBackupAndSave = async () => {
    setMenuOpen(false);
    try {
      await invoke("create_backup", { label: "pre-save" });
      await save();
      addToast("Backup created and config saved", "success");
    } catch (err) {
      addToast(`Failed: ${err}`, "error");
    }
  };

  return (
    <div className="save-button-group" ref={menuRef}>
      <button
        className={`save-button ${isDirty ? "dirty" : ""}`}
        disabled={!isDirty || saving}
        onClick={handleSave}
        title={isDirty ? "Save changes (⌘S)" : "No unsaved changes"}
      >
        <Save size={14} />
        <span>{saving ? "Saving…" : "Save"}</span>
      </button>
      <button
        className={`save-dropdown-toggle ${isDirty ? "dirty" : ""}`}
        disabled={!isDirty || saving}
        onClick={() => setMenuOpen((v) => !v)}
        title="More save options"
      >
        <ChevronDown size={12} />
      </button>
      {menuOpen && (
        <div className="save-dropdown-menu">
          <button className="save-dropdown-item" onClick={handleBackupAndSave}>
            <Archive size={13} />
            <span>Backup & Save</span>
          </button>
        </div>
      )}
    </div>
  );
}
