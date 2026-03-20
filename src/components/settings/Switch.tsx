interface SwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function Switch({ value, onChange }: SwitchProps) {
  return (
    <button
      className={`switch ${value ? "checked" : ""}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <div className="switch-handle" />
    </button>
  );
}
