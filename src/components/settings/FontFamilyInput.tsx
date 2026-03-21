import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronUp, ChevronDown } from "lucide-react";

let cachedFonts: string[] | null = null;
let fontPromise: Promise<string[]> | null = null;

function loadSystemFonts(): Promise<string[]> {
  if (cachedFonts) return Promise.resolve(cachedFonts);
  if (!fontPromise) {
    fontPromise = invoke<string[]>("list_system_fonts")
      .then((fonts) => { cachedFonts = fonts; return fonts; })
      .catch(() => { cachedFonts = []; return []; });
  }
  return fontPromise;
}

interface FontFamilyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function FontFamilyInput({ value, onChange, placeholder }: FontFamilyInputProps) {
  const [systemFonts, setSystemFonts] = useState<string[]>(cachedFonts || []);
  const [loaded, setLoaded] = useState(!!cachedFonts);
  const [useCustom, setUseCustom] = useState(false);

  useEffect(() => {
    loadSystemFonts().then((fonts) => {
      setSystemFonts(fonts);
      setLoaded(true);
      if (value && fonts.length > 0 && !fonts.includes(value)) {
        setUseCustom(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded || systemFonts.length === 0 || useCustom) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="text"
          className="text-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Font family name"}
          style={{ width: 180 }}
        />
        {loaded && systemFonts.length > 0 && (
          <label className="backups-checkbox">
            <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} />
            <span>Custom</span>
          </label>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div className="dropdown-wrapper">
        <select
          className="dropdown-native"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder || "Select font…"}</option>
          {value && !systemFonts.includes(value) && (
            <option value={value}>{value}</option>
          )}
          {systemFonts.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <span className="dropdown-label">{value || placeholder || "Select font…"}</span>
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
