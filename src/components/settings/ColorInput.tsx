import { useState } from "react";
import type { HexColor } from "@/utils/colors";
import { isDark } from "@/utils/colors";

interface ColorInputProps {
  value: HexColor;
  onChange: (value: HexColor) => void;
}

export default function ColorInput({ value, onChange }: ColorInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const displayColor = value || "#333333";

  return (
    <div className="color-input-wrapper">
      <button
        className="color-swatch"
        style={{
          backgroundColor: displayColor,
          color: isDark(displayColor) ? "#fff" : "#000",
        }}
        onClick={() => setShowPicker(!showPicker)}
        onContextMenu={(e) => {
          e.preventDefault();
          onChange("");
        }}
      >
        {value || "..."}
      </button>
      {showPicker && (
        <div className="color-picker-popover">
          <div
            className="color-picker-backdrop"
            onClick={() => setShowPicker(false)}
          />
          <div className="color-picker-panel">
            <input
              type="color"
              value={value || "#000000"}
              onChange={(e) => onChange(e.target.value)}
            />
            <input
              type="text"
              className="color-hex-input"
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
              }}
              placeholder="#000000"
            />
          </div>
        </div>
      )}
    </div>
  );
}
