import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save as saveDialog, open as openDialog } from "@tauri-apps/plugin-dialog";
import { Palette as PaletteIcon, Download, Upload, Save, Trash2, FolderOpen, Check } from "lucide-react";
import Page from "@/components/views/Page";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useConfigStore } from "@/stores/config";
import { useToastStore } from "@/stores/toasts";
import { parseConfig } from "@/utils/parse";
import type { HexColor } from "@/utils/colors";

interface ThemeColors {
  palette: HexColor[];
  background: HexColor;
  foreground: HexColor;
  cursorColor: HexColor;
  cursorText: HexColor;
  selectionBackground: HexColor;
  selectionForeground: HexColor;
}

interface ThemeEntry {
  name: string;
  filename: string;
}

const DEFAULT_COLORS: ThemeColors = {
  palette: [
    "#1d1f21", "#cc6666", "#b5bd68", "#f0c674", "#81a2be", "#b294bb", "#8abeb7", "#c5c8c6",
    "#666666", "#d54e53", "#b9ca4a", "#e7c547", "#7aa6da", "#c397d8", "#70c0b1", "#eaeaea",
  ],
  background: "#282c34",
  foreground: "#ffffff",
  cursorColor: "#ffffff",
  cursorText: "#000000",
  selectionBackground: "#3e4451",
  selectionForeground: "#ffffff",
};

const PALETTE_LABELS = [
  "Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White",
  "Bright Black", "Bright Red", "Bright Green", "Bright Yellow", "Bright Blue", "Bright Magenta", "Bright Cyan", "Bright White",
];

function serializeTheme(colors: ThemeColors): string {
  const lines: string[] = [];
  for (let i = 0; i < 16; i++) {
    lines.push(`palette = ${i}=${colors.palette[i]}`);
  }
  lines.push(`background = ${colors.background}`);
  lines.push(`foreground = ${colors.foreground}`);
  lines.push(`cursor-color = ${colors.cursorColor}`);
  lines.push(`cursor-text = ${colors.cursorText}`);
  lines.push(`selection-background = ${colors.selectionBackground}`);
  lines.push(`selection-foreground = ${colors.selectionForeground}`);
  return lines.join("\n") + "\n";
}

function parseThemeColors(text: string): ThemeColors {
  const parsed = parseConfig(text);
  const colors = { ...DEFAULT_COLORS };
  if (parsed.background) colors.background = parsed.background as HexColor;
  if (parsed.foreground) colors.foreground = parsed.foreground as HexColor;
  if (parsed.cursorColor) colors.cursorColor = parsed.cursorColor as HexColor;
  if (parsed.cursorText) colors.cursorText = parsed.cursorText as HexColor;
  if (parsed.selectionBackground) colors.selectionBackground = parsed.selectionBackground as HexColor;
  if (parsed.selectionForeground) colors.selectionForeground = parsed.selectionForeground as HexColor;
  if (parsed.palette) {
    const incoming = parsed.palette as (HexColor | null)[];
    const pal = [...colors.palette];
    for (let i = 0; i < 16 && i < incoming.length; i++) {
      if (incoming[i]) pal[i] = incoming[i]!;
    }
    colors.palette = pal;
  }
  return colors;
}

function ColorSwatch({ color, onChange, label }: { color: HexColor; onChange: (c: HexColor) => void; label: string }) {
  return (
    <div className="ts-swatch-wrap" title={label}>
      <input
        type="color"
        className="ts-swatch-input"
        value={color || "#000000"}
        onChange={(e) => onChange(e.target.value as HexColor)}
      />
      <span className="ts-swatch-label">{label}</span>
    </div>
  );
}

export default function ThemeStudio() {
  const config = useConfigStore((s) => s.config);
  const setMany = useConfigStore((s) => s.setMany);
  const configSet = useConfigStore((s) => s.set);
  const addToast = useToastStore((s) => s.add);

  const [colors, setColors] = useState<ThemeColors>({ ...DEFAULT_COLORS });
  const [themes, setThemes] = useState<ThemeEntry[]>([]);
  const [themeName, setThemeName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchThemes = useCallback(async () => {
    try {
      const list = await invoke<ThemeEntry[]>("list_custom_themes");
      setThemes(list);
    } catch {
      // themes dir may not exist yet
    }
  }, []);

  useEffect(() => { fetchThemes(); }, [fetchThemes]);

  const loadFromConfig = () => {
    const pal = (config.palette as HexColor[]).slice(0, 16);
    setColors({
      palette: pal.length === 16 ? pal : [...pal, ...DEFAULT_COLORS.palette.slice(pal.length)],
      background: (config.background as HexColor) || DEFAULT_COLORS.background,
      foreground: (config.foreground as HexColor) || DEFAULT_COLORS.foreground,
      cursorColor: (config.cursorColor as HexColor) || DEFAULT_COLORS.cursorColor,
      cursorText: (config.cursorText as HexColor) || DEFAULT_COLORS.cursorText,
      selectionBackground: (config.selectionBackground as HexColor) || DEFAULT_COLORS.selectionBackground,
      selectionForeground: (config.selectionForeground as HexColor) || DEFAULT_COLORS.selectionForeground,
    });
    addToast("Loaded colors from config", "info");
  };

  const applyToConfig = () => {
    const fullPalette = [...(config.palette as HexColor[])];
    for (let i = 0; i < 16; i++) {
      fullPalette[i] = colors.palette[i];
    }
    setMany({
      background: colors.background,
      foreground: colors.foreground,
      cursorColor: colors.cursorColor,
      cursorText: colors.cursorText,
      selectionBackground: colors.selectionBackground,
      selectionForeground: colors.selectionForeground,
    });
    configSet("palette", fullPalette);
    addToast("Colors applied to config. Save to persist.", "success");
  };

  const handleSaveTheme = async () => {
    const name = themeName.trim();
    if (!name) { addToast("Enter a theme name", "error"); return; }
    try {
      const content = serializeTheme(colors);
      await invoke("save_theme", { name, content });
      addToast(`Theme "${name}" saved`, "success");
      setShowSaveInput(false);
      setThemeName("");
      fetchThemes();
    } catch (err) {
      addToast(`Failed to save theme: ${err}`, "error");
    }
  };

  const handleImport = async () => {
    try {
      const path = await openDialog({ title: "Import Theme", filters: [{ name: "Theme files", extensions: ["*"] }] });
      if (!path) return;
      const content = await invoke<string>("read_file", { path });
      const parsed = parseThemeColors(content);
      setColors(parsed);
      addToast("Theme loaded into editor", "success");
    } catch (err) {
      addToast(`Failed to import: ${err}`, "error");
    }
  };

  const handleExport = async () => {
    try {
      const path = await saveDialog({ title: "Export Theme", defaultPath: themeName.trim() || "my-theme" });
      if (!path) return;
      const content = serializeTheme(colors);
      await invoke("write_file", { path, content });
      addToast("Theme exported", "success");
    } catch (err) {
      addToast(`Failed to export: ${err}`, "error");
    }
  };

  const handleLoadTheme = async (name: string) => {
    try {
      const content = await invoke<string>("read_theme", { name });
      const parsed = parseThemeColors(content);
      setColors(parsed);
      setThemeName(name);
      addToast(`Loaded theme "${name}"`, "success");
    } catch (err) {
      addToast(`Failed to load theme: ${err}`, "error");
    }
  };

  const handleDeleteTheme = async () => {
    if (!deleteTarget) return;
    try {
      await invoke("delete_theme", { name: deleteTarget });
      addToast(`Deleted theme "${deleteTarget}"`, "success");
      setDeleteTarget(null);
      fetchThemes();
    } catch (err) {
      addToast(`Failed to delete: ${err}`, "error");
    }
  };

  const setPaletteColor = (i: number, c: HexColor) => {
    setColors((prev) => {
      const pal = [...prev.palette];
      pal[i] = c;
      return { ...prev, palette: pal };
    });
  };

  return (
    <Page title="Theme Studio">
      {/* Action bar */}
      <div className="ts-actions">
        <button className="ts-action-btn" onClick={loadFromConfig} title="Load current config colors">
          <FolderOpen size={14} /> Load from Config
        </button>
        <button className="ts-action-btn ts-action-primary" onClick={applyToConfig} title="Apply to config">
          <Check size={14} /> Apply to Config
        </button>
        <div style={{ flex: 1 }} />
        <button className="ts-action-btn" onClick={handleImport}><Upload size={14} /> Import</button>
        <button className="ts-action-btn" onClick={handleExport}><Download size={14} /> Export</button>
        {showSaveInput ? (
          <div className="ts-save-inline">
            <input
              className="text-input"
              style={{ width: 140 }}
              placeholder="Theme name"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveTheme()}
              autoFocus
            />
            <button className="ts-action-btn ts-action-primary" onClick={handleSaveTheme}><Save size={14} /> Save</button>
            <button className="ts-action-btn" onClick={() => setShowSaveInput(false)}>Cancel</button>
          </div>
        ) : (
          <button className="ts-action-btn ts-action-primary" onClick={() => setShowSaveInput(true)}>
            <Save size={14} /> Save as Theme
          </button>
        )}
      </div>

      <div className="ts-layout">
        {/* Controls */}
        <div className="ts-controls">
          <div className="ts-section">
            <h3 className="ts-section-title">Base Colors</h3>
            <div className="ts-color-grid ts-color-grid-2">
              <ColorSwatch color={colors.background} onChange={(c) => setColors((p) => ({ ...p, background: c }))} label="Background" />
              <ColorSwatch color={colors.foreground} onChange={(c) => setColors((p) => ({ ...p, foreground: c }))} label="Foreground" />
              <ColorSwatch color={colors.selectionBackground} onChange={(c) => setColors((p) => ({ ...p, selectionBackground: c }))} label="Selection BG" />
              <ColorSwatch color={colors.selectionForeground} onChange={(c) => setColors((p) => ({ ...p, selectionForeground: c }))} label="Selection FG" />
            </div>
          </div>

          <div className="ts-section">
            <h3 className="ts-section-title">Cursor</h3>
            <div className="ts-color-grid ts-color-grid-2">
              <ColorSwatch color={colors.cursorColor} onChange={(c) => setColors((p) => ({ ...p, cursorColor: c }))} label="Cursor" />
              <ColorSwatch color={colors.cursorText} onChange={(c) => setColors((p) => ({ ...p, cursorText: c }))} label="Cursor Text" />
            </div>
          </div>

          <div className="ts-section">
            <h3 className="ts-section-title">Palette</h3>
            <div className="ts-color-grid ts-color-grid-8">
              {colors.palette.map((c, i) => (
                <ColorSwatch key={i} color={c} onChange={(v) => setPaletteColor(i, v)} label={PALETTE_LABELS[i]} />
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="ts-preview-wrap">
          <div
            className="ts-preview"
            style={{ backgroundColor: colors.background, color: colors.foreground }}
          >
            <div>
              <span style={{ color: colors.palette[2] }}>ghostty</span>
              <span style={{ color: colors.foreground }}>@</span>
              <span style={{ color: colors.palette[4] }}>macos</span>
              <span style={{ color: colors.foreground }}>:~$ </span>
              <span style={{ color: colors.palette[6] }}>eza -la --color=always --icons</span>
            </div>
            <div>
              <span style={{ color: colors.palette[4] }}>drwx------</span>
              {"    - "}
              <span>ghostty</span>
              {" 22 Aug 13:42 "}
              <span style={{ color: colors.palette[3] }}></span>
              {" .cache"}
            </div>
            <div style={{ backgroundColor: colors.selectionBackground, color: colors.selectionForeground }}>
              <span style={{ color: colors.palette[4] }}>drwx------</span>
              {"    - "}
              <span>ghostty</span>
              {" 22 Aug 13:42 "}
              <span style={{ color: colors.palette[3] }}></span>
              {" .config"}
            </div>
            <div>
              <span style={{ color: colors.palette[4] }}>.rw-r--r--</span>
              {"   0 "}
              <span>ghostty</span>
              {"  7 May 11:11 "}
              <span style={{ color: colors.palette[1] }}></span>
              {" .hushlogin"}
            </div>
            <div>
              <span style={{ color: colors.palette[4] }}>.rw-------</span>
              {" 2.5k "}
              <span>ghostty</span>
              {"  2 Mar 02:49 "}
              <span style={{ color: colors.palette[5] }}></span>
              {" .viminfo"}
            </div>
            <div>
              <span style={{ color: colors.palette[6] }}>lrwxrwxrwx</span>
              {"    - "}
              <span>ghostty</span>
              {"  9 Feb 20:32 "}
              <span style={{ color: colors.palette[6] }}>{" etc -> /etc"}</span>
            </div>
            <div>&nbsp;</div>
            <div>
              <span style={{ color: colors.palette[2] }}>ghostty</span>
              <span style={{ color: colors.foreground }}>@</span>
              <span style={{ color: colors.palette[4] }}>macos</span>
              <span>:~$ </span>
              <span style={{ color: colors.foreground }}>echo "</span>
              <span style={{ color: colors.palette[1] }}>r</span>
              <span style={{ color: colors.palette[3] }}>a</span>
              <span style={{ color: colors.palette[2] }}>i</span>
              <span style={{ color: colors.palette[4] }}>n</span>
              <span style={{ color: colors.palette[5] }}>b</span>
              <span style={{ color: colors.palette[6] }}>o</span>
              <span style={{ color: colors.palette[9] }}>w</span>
              <span style={{ color: colors.foreground }}>"</span>
            </div>
            <div>&nbsp;</div>
            <div style={{ display: "flex", gap: 4 }}>
              {colors.palette.map((c, i) => (
                <span key={i} style={{ display: "inline-block", width: 16, height: 16, borderRadius: 3, backgroundColor: c }} title={PALETTE_LABELS[i]} />
              ))}
            </div>
            <div>&nbsp;</div>
            <div>
              <span style={{ backgroundColor: colors.cursorColor, color: colors.cursorText }}>█</span>
              <span style={{ color: colors.palette[8] }}> cursor preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom themes list */}
      {themes.length > 0 && (
        <div className="ts-themes-section">
          <h3 className="ts-section-title">
            <PaletteIcon size={14} /> Custom Themes ({themes.length})
          </h3>
          <div className="ts-themes-list">
            {themes.map((t) => (
              <div key={t.filename} className="ts-theme-row">
                <span className="ts-theme-name">{t.name}</span>
                <div className="ts-theme-actions">
                  <button className="backup-action-btn" onClick={() => handleLoadTheme(t.name)} title="Load into editor">
                    <FolderOpen size={14} />
                  </button>
                  <button className="backup-action-btn" onClick={() => setDeleteTarget(t.name)} title="Delete theme">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Theme"
          message={`Delete "${deleteTarget}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeleteTheme}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Page>
  );
}
