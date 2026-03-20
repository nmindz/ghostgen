import { useState } from "react";
import { useConfigStore } from "@/stores/config";
import { useToastStore } from "@/stores/toasts";
import Page from "@/components/views/Page";
import Switch from "@/components/settings/Switch";

const SAMPLE_TEXT = `user@ghostgen ~ $ ls -la
drwxr-xr-x  user  staff  Documents/
drwxr-xr-x  user  staff  Downloads/
-rw-r--r--  user  staff  notes.txt
-rwxr-xr-x  user  staff  script.sh
lrwxr-xr-x  user  staff  config -> .config/ghostty/config

user@ghostgen ~ $ echo "Hello, World! 你好世界"
Hello, World! 你好世界

┌─────────────────┐
│  Box Drawing     │
├─────────────────┤
│  ╔═══╗  ┊  ╭──╮ │
│  ║   ║  ┊  │  │ │
│  ╚═══╝  ┊  ╰──╯ │
└─────────────────┘`;

export default function FontPlayground() {
  const config = useConfigStore((s) => s.config);
  const setMany = useConfigStore((s) => s.setMany);
  const addToast = useToastStore((s) => s.add);

  const [fontFamily, setFontFamily] = useState<string>(
    (config.fontFamily as string) || "JetBrainsMono Nerd Font"
  );
  const [fontSize, setFontSize] = useState<number>(
    (config.fontSize as number) || 13
  );
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  const background = (config.background as string) || "#282c34";
  const foreground = (config.foreground as string) || "#ffffff";

  const handleApply = () => {
    setMany({ fontFamily, fontSize });
    addToast("Font settings applied. Save to persist.", "success");
  };

  return (
    <Page title="Font Playground">
      <div className="font-playground-controls">
        <div className="font-playground-control">
          <label className="font-playground-label">Font Family</label>
          <input
            type="text"
            className="text-input"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            placeholder="JetBrainsMono Nerd Font"
            style={{ width: 220 }}
          />
        </div>
        <div className="font-playground-control">
          <label className="font-playground-label">Font Size</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="range"
              className="number-range"
              min={4}
              max={60}
              step={0.5}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: 100 }}
            />
            <span className="font-playground-size-display">{fontSize}px</span>
          </div>
        </div>
        <div className="font-playground-control">
          <label className="font-playground-label">Bold</label>
          <Switch value={bold} onChange={setBold} />
        </div>
        <div className="font-playground-control">
          <label className="font-playground-label">Italic</label>
          <Switch value={italic} onChange={setItalic} />
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button className="font-playground-apply" onClick={handleApply}>
            Apply to Config
          </button>
        </div>
      </div>
      <p className="font-playground-note">
        Changes here are preview-only. Click Apply to update your config.
      </p>
      <pre
        className="font-playground-preview"
        style={{
          fontFamily: fontFamily || "monospace",
          fontSize: `${fontSize}px`,
          fontWeight: bold ? 700 : 400,
          fontStyle: italic ? "italic" : "normal",
          backgroundColor: background,
          color: foreground,
        }}
      >
        {SAMPLE_TEXT}
      </pre>
    </Page>
  );
}
