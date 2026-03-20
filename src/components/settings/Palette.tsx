import { useState } from "react";
import type { HexColor } from "@/utils/colors";
import { isDark } from "@/utils/colors";

interface PaletteProps {
  value: HexColor[];
  onChange: (value: HexColor[]) => void;
}

export default function PaletteGrid({ value, onChange }: PaletteProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const cols = 8;

  const handleChange = (index: number, color: HexColor) => {
    const next = [...value];
    next[index] = color;
    onChange(next);
  };

  return (
    <div className="palette-grid-wrapper">
      <div className="palette-grid">
        {value.map((color, i) => (
          <button
            key={i}
            className="palette-cell"
            style={{
              backgroundColor: color,
              color: isDark(color) ? "#fff" : "#000",
              gridColumn: (i % cols) + 1,
            }}
            onClick={() => setEditing(editing === i ? null : i)}
            title={`${i + 1}: ${color}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {editing !== null && (
        <div className="palette-editor">
          <span className="palette-editor-label">Color {editing + 1}:</span>
          <input
            type="color"
            value={value[editing]}
            onChange={(e) => handleChange(editing, e.target.value)}
          />
          <input
            type="text"
            className="color-hex-input"
            value={value[editing]}
            onChange={(e) => {
              if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))
                handleChange(editing, e.target.value);
            }}
          />
        </div>
      )}
    </div>
  );
}
