import { ChevronUp, ChevronDown } from "lucide-react";
import { useConfigStore } from "@/stores/config";
import { useToastStore } from "@/stores/toasts";

interface ThemeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ name: string; value: string } | string>;
}

export default function ThemeDropdown({ value, onChange, options }: ThemeDropdownProps) {
  const setColorScheme = useConfigStore((s) => s.setColorScheme);
  const addToast = useToastStore((s) => s.add);

  const handleChange = async (v: string) => {
    onChange(v);
    const success = await setColorScheme(v);
    if (success && v) {
      addToast(`Loaded theme: ${v}`, "success");
    } else if (!success) {
      addToast("Failed to load theme", "error");
    }
  };

  const displayName = (() => {
    const match = options.find((opt) =>
      typeof opt === "string" ? opt === value : opt.value === value
    );
    if (!match) return value || "Custom";
    return typeof match === "string" ? match : match.name;
  })();

  return (
    <div className="dropdown-wrapper">
      <select
        className="dropdown-native"
        value={value}
        onChange={(e) => void handleChange(e.target.value)}
      >
        {options.map((opt) => {
          const optValue = typeof opt === "string" ? opt : opt.value;
          const optName = typeof opt === "string" ? opt : opt.name;
          return (
            <option key={optValue} value={optValue}>
              {optName || "(empty)"}
            </option>
          );
        })}
      </select>
      <span className="dropdown-label">{displayName}</span>
      <span className="dropdown-chevrons">
        <ChevronUp size={10} strokeWidth={2.5} />
        <ChevronDown size={10} strokeWidth={2.5} />
      </span>
    </div>
  );
}
