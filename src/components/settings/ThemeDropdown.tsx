import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useConfigStore } from "@/stores/config";
import { useToastStore } from "@/stores/toasts";

interface ThemeEntry {
  name: string;
  filename: string;
}

const CUSTOM_PREFIX = "custom:";

interface ThemeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ name: string; value: string } | string>;
}

export default function ThemeDropdown({ value, onChange, options }: ThemeDropdownProps) {
  const setColorScheme = useConfigStore((s) => s.setColorScheme);
  const loadCustomTheme = useConfigStore((s) => s.loadCustomTheme);
  const addToast = useToastStore((s) => s.add);
  const [customThemes, setCustomThemes] = useState<ThemeEntry[]>([]);

  useEffect(() => {
    invoke<ThemeEntry[]>("list_custom_themes")
      .then(setCustomThemes)
      .catch(() => {});
  }, []);

  const handleChange = async (v: string) => {
    if (v.startsWith(CUSTOM_PREFIX)) {
      const themeName = v.slice(CUSTOM_PREFIX.length);
      onChange(v);
      const success = await loadCustomTheme(themeName);
      if (success) {
        addToast(`Loaded custom theme: ${themeName}`, "success");
      } else {
        addToast("Failed to load custom theme", "error");
      }
    } else {
      onChange(v);
      const success = await setColorScheme(v);
      if (success && v) {
        addToast(`Loaded theme: ${v}`, "success");
      } else if (!success) {
        addToast("Failed to load theme", "error");
      }
    }
  };

  const displayName = (() => {
    if (value.startsWith(CUSTOM_PREFIX)) {
      return value.slice(CUSTOM_PREFIX.length);
    }
    const match = options.find((opt) =>
      typeof opt === "string" ? opt === value : opt.value === value
    );
    if (!match) return value || "Custom";
    return typeof match === "string" ? match : match.name;
  })();

  // Separate the "Custom" (empty value) option from built-in themes
  const builtinOptions = options.filter((opt) => {
    const v = typeof opt === "string" ? opt : opt.value;
    return v !== "";
  });

  return (
    <div className="dropdown-wrapper">
      <select
        className="dropdown-native"
        value={value}
        onChange={(e) => void handleChange(e.target.value)}
      >
        <option value="">Custom (no theme)</option>

        {customThemes.length > 0 && (
          <optgroup label="Custom Themes">
            {customThemes.map((t) => (
              <option key={`custom-${t.name}`} value={`${CUSTOM_PREFIX}${t.name}`}>
                {t.name}
              </option>
            ))}
          </optgroup>
        )}

        {builtinOptions.length > 0 && (
          <optgroup label="Built-in">
            {builtinOptions.map((opt) => {
              const optValue = typeof opt === "string" ? opt : opt.value;
              const optName = typeof opt === "string" ? opt : opt.name;
              return (
                <option key={optValue} value={optValue}>
                  {optName}
                </option>
              );
            })}
          </optgroup>
        )}
      </select>
      <span className="dropdown-label">{displayName}</span>
      <span className="dropdown-chevrons">
        <ChevronUp size={10} strokeWidth={2.5} />
        <ChevronDown size={10} strokeWidth={2.5} />
      </span>
    </div>
  );
}
