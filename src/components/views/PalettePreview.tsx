import { useConfigStore } from "@/stores/config";

export default function PalettePreview() {
  const config = useConfigStore((s) => s.config);
  const bg = config.background as string;
  const fg = config.foreground as string;
  const palette = config.palette as string[];

  return (
    <div
      className="terminal-preview palette-preview"
      style={{ backgroundColor: bg, color: fg, fontFamily: "monospace" }}
    >
      <div>
        <span style={{ color: palette[2] }}>ghostty</span>
        <span style={{ color: fg }}>@</span>
        <span style={{ color: palette[4] }}>macos</span>
        <span style={{ color: fg }}>:~$ </span>
        <span style={{ color: palette[6] }}>eza -la --color=always --icons</span>
      </div>
      <div>&nbsp;</div>
      {[
        palette.slice(0, 8),
        palette.slice(8, 16),
      ].map((row, ri) => (
        <div key={ri} className="palette-preview-row">
          {row.map((color, ci) => (
            <span key={ci} className="palette-preview-dot" style={{ backgroundColor: color }}>
              {ri * 8 + ci + 1}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
