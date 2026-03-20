import { ChevronUp, ChevronDown } from "lucide-react";

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ name: string; value: string } | string>;
  placeholder?: string;
}

export default function Dropdown({ value, onChange, options, placeholder }: DropdownProps) {
  const displayName = (() => {
    const match = options.find((opt) =>
      typeof opt === "string" ? opt === value : opt.value === value
    );
    if (!match) return placeholder || value || "(empty)";
    return typeof match === "string" ? match : match.name;
  })();

  return (
    <div className="dropdown-wrapper">
      <select
        className="dropdown-native"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
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
