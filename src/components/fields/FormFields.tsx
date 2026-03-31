import { useState } from 'react';
import { maskMoney, parseMoney, formatMoneyInput, formatPctInput, parsePct } from '@/utils/financial';

interface MoneyFieldProps {
  label: string;
  value: number;
  prefix?: string;
  onChange: (v: number) => void;
}

export function MoneyField({ label, value, prefix = 'R$', onChange }: MoneyFieldProps) {
  const [display, setDisplay] = useState(formatMoneyInput(value));

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskMoney(e.target.value);
    setDisplay(masked);
    onChange(parseMoney(masked));
  };

  const handleFocus = () => {
    if (value) setDisplay(formatMoneyInput(value));
  };

  return (
    <div className="mb-2">
      <label className="field-label">{label}</label>
      <div className="relative flex items-center">
        <span className="absolute left-[10px] text-[11px] pointer-events-none font-mono font-medium" style={{ color: 'hsl(var(--text-muted))' }}>{prefix}</span>
        <input
          type="text"
          inputMode="numeric"
          className="money-input"
          placeholder="0,00"
          value={display}
          onInput={handleInput}
          onFocus={handleFocus}
        />
      </div>
    </div>
  );
}

interface PctFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

export function PctField({ label, value, onChange }: PctFieldProps) {
  const [display, setDisplay] = useState(formatPctInput(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay(e.target.value);
    onChange(parsePct(e.target.value));
  };

  return (
    <div className="mb-2">
      <label className="field-label">{label}</label>
      <div className="relative flex items-center">
        <input
          type="text"
          className="pct-input"
          value={display}
          onChange={handleChange}
        />
        <span className="absolute right-[10px] text-[11px] pointer-events-none font-medium" style={{ color: 'hsl(var(--text-muted))' }}>%</span>
      </div>
    </div>
  );
}

interface PlainFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}

export function PlainField({ label, value, placeholder, onChange }: PlainFieldProps) {
  return (
    <div className="mb-2">
      <label className="field-label">{label}</label>
      <input className="plain-input" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="mb-2">
      <label className="field-label">{label}</label>
      <select className="field-select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
