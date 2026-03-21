import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Sidebar from "@/components/layout/Sidebar";
import SettingsPage from "@/components/settings/SettingsPage";
import FontPlayground from "@/components/views/FontPlayground";
import ImportExportPage from "@/components/views/ImportExportPage";
import BackupsPage from "@/components/views/BackupsPage";
import ThemeStudio from "@/components/views/ThemeStudio";
import ToastStack from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConfigStore } from "@/stores/config";
import { useToastStore } from "@/stores/toasts";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function App() {
  const hydrate = useConfigStore((s) => s.hydrate);
  const addToast = useToastStore((s) => s.add);
  useAppTheme();
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  // Hydrate config from disk on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "s") {
        e.preventDefault();
        const store = useConfigStore.getState();
        if (store.isDirty && !store.saving) {
          try {
            await store.save();
            addToast("Config saved to disk", "success");
          } catch (err) {
            addToast(`Failed to save: ${err}`, "error");
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [addToast]);

  // Close guard: confirm before closing with unsaved changes
  useEffect(() => {
    const appWindow = getCurrentWindow();
    const unlisten = appWindow.onCloseRequested((event) => {
      if (useConfigStore.getState().isDirty) {
        event.preventDefault();
        setShowCloseDialog(true);
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  const handleForceClose = () => {
    setShowCloseDialog(false);
    getCurrentWindow().destroy();
  };

  return (
    <div className="app-window">
      <Sidebar />
      <div id="content-view">
        <Routes>
          <Route path="/" element={<Navigate to="/settings/application" replace />} />
          <Route path="/settings/:category" element={<SettingsPage />} />
          <Route path="/font-playground" element={<FontPlayground />} />
          <Route path="/import-export" element={<ImportExportPage />} />
          <Route path="/backups" element={<BackupsPage />} />
          <Route path="/theme-studio" element={<ThemeStudio />} />
        </Routes>
      </div>
      <ToastStack />
      {showCloseDialog && (
        <ConfirmDialog
          title="Unsaved Changes"
          message="You have unsaved changes. Discard and quit?"
          confirmLabel="Discard & Quit"
          cancelLabel="Go Back"
          danger
          onConfirm={handleForceClose}
          onCancel={() => setShowCloseDialog(false)}
        />
      )}
    </div>
  );
}
