import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const COMMON_FEATURES: Array<{ value: string; desc: string }> = [
  { value: "calt", desc: "Contextual alternates (programming ligatures)" },
  { value: "-calt", desc: "Disable contextual alternates" },
  { value: "liga", desc: "Standard ligatures" },
  { value: "-liga", desc: "Disable standard ligatures" },
  { value: "dlig", desc: "Discretionary ligatures" },
  { value: "-dlig", desc: "Disable discretionary ligatures" },
  { value: "clig", desc: "Contextual ligatures" },
  { value: "-clig", desc: "Disable contextual ligatures" },
  { value: "kern", desc: "Kerning" },
  { value: "-kern", desc: "Disable kerning" },
  { value: "ss01", desc: "Stylistic set 1" },
  { value: "ss02", desc: "Stylistic set 2" },
  { value: "ss03", desc: "Stylistic set 3" },
  { value: "ss04", desc: "Stylistic set 4" },
  { value: "ss05", desc: "Stylistic set 5" },
  { value: "ss06", desc: "Stylistic set 6" },
  { value: "ss07", desc: "Stylistic set 7" },
  { value: "ss08", desc: "Stylistic set 8" },
  { value: "cv01", desc: "Character variant 1" },
  { value: "cv02", desc: "Character variant 2" },
  { value: "zero", desc: "Slashed zero" },
  { value: "onum", desc: "Oldstyle numerals" },
  { value: "tnum", desc: "Tabular numerals" },
];

interface FontFeatureInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function FontFeatureInput({ value, onChange, placeholder }: FontFeatureInputProps) {
  const [useCustom, setUseCustom] = useState(() => {
    if (!value) return false;
    return !COMMON_FEATURES.some((f) => f.value === value);
  });

  const current = COMMON_FEATURES.find((f) => f.value === value);
  const displayLabel = current ? current.value : value || placeholder || "None";
  const displayTitle = current ? `${current.value} — ${current.desc}` : "";

  if (useCustom) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="text"
          className="text-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "e.g. -calt"}
          style={{ width: 180 }}
        />
        <label className="backups-checkbox">
          <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} />
          <span>Custom</span>
        </label>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div className="dropdown-wrapper" title={displayTitle}>
        <select
          className="dropdown-native"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">None</option>
          <optgroup label="Ligatures">
            {COMMON_FEATURES.filter((f) => ["calt","-calt","liga","-liga","dlig","-dlig","clig","-clig"].includes(f.value)).map((f) => (
              <option key={f.value} value={f.value}>{f.value}</option>
            ))}
          </optgroup>
          <optgroup label="Spacing">
            {COMMON_FEATURES.filter((f) => ["kern","-kern"].includes(f.value)).map((f) => (
              <option key={f.value} value={f.value}>{f.value}</option>
            ))}
          </optgroup>
          <optgroup label="Stylistic Sets">
            {COMMON_FEATURES.filter((f) => f.value.startsWith("ss")).map((f) => (
              <option key={f.value} value={f.value}>{f.value}</option>
            ))}
          </optgroup>
          <optgroup label="Other">
            {COMMON_FEATURES.filter((f) => ["cv01","cv02","zero","onum","tnum"].includes(f.value)).map((f) => (
              <option key={f.value} value={f.value}>{f.value}</option>
            ))}
          </optgroup>
        </select>
        <span className="dropdown-label">{displayLabel}</span>
        <span className="dropdown-chevrons">
          <ChevronUp size={10} strokeWidth={2.5} />
          <ChevronDown size={10} strokeWidth={2.5} />
        </span>
      </div>
      <label className="backups-checkbox">
        <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} />
        <span>Custom</span>
      </label>
    </div>
  );
}
