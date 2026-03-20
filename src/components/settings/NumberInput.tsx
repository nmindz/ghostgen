import { Minus, Plus } from "lucide-react";

interface NumberInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  range?: boolean;
  placeholder?: string;
}

export default function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  size = 4,
  range,
  placeholder,
}: NumberInputProps) {
  const current = value ?? 0;

  const decrement = () => {
    const next = current - step;
    if (min !== undefined && next < min) return;
    onChange(Number(next.toFixed(10)));
  };

  const increment = () => {
    const next = current + step;
    if (max !== undefined && next > max) return;
    onChange(Number(next.toFixed(10)));
  };

  return (
    <div className="number-input">
      {range && (
        <input
          type="range"
          className="number-range"
          value={current}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )}
      <div className="number-stepper">
        <button className="stepper-btn" onClick={decrement}>
          <Minus size={12} />
        </button>
        <input
          type="text"
          className="number-field"
          value={value ?? ""}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          placeholder={placeholder}
          style={{ width: `${size + 1}ch` }}
        />
        <button className="stepper-btn" onClick={increment}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
