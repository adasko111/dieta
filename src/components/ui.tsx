import { useEffect, type ReactNode } from 'react';
import { formatGrams, formatNumber } from '../lib/format';
import type { Macros } from '../types';

export function Chip({
  active,
  onClick,
  children,
  danger = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={danger ? 'chip chip-danger' : 'chip'}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Option({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}) {
  return (
    <button type="button" className="option" aria-pressed={active} onClick={onClick}>
      <span className="option-radio" aria-hidden="true" />
      <span>
        <span className="option-title">{title}</span>
        {description ? (
          <>
            <br />
            <span className="option-desc">{description}</span>
          </>
        ) : null}
      </span>
    </button>
  );
}

export function Bar({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? value / max : 0;
  const width = Math.min(100, Math.max(0, ratio * 100));
  return (
    <div className={ratio > 1.05 ? 'bar over' : 'bar'}>
      <span style={{ width: `${width}%` }} />
    </div>
  );
}

export function MacroSummary({ macros, target }: { macros: Macros; target?: Macros }) {
  const cells: { label: string; value: string; goal?: string }[] = [
    {
      label: 'kcal',
      value: formatNumber(macros.kcal, 0),
      goal: target ? formatNumber(target.kcal, 0) : undefined,
    },
    {
      label: 'Białko',
      value: formatGrams(macros.protein),
      goal: target ? formatGrams(target.protein) : undefined,
    },
    {
      label: 'Tłuszcz',
      value: formatGrams(macros.fat),
      goal: target ? formatGrams(target.fat) : undefined,
    },
    {
      label: 'Węgle',
      value: formatGrams(macros.carbs),
      goal: target ? formatGrams(target.carbs) : undefined,
    },
  ];

  return (
    <div className="macro-grid">
      {cells.map((cell) => (
        <div className="macro-cell" key={cell.label}>
          <div className="label">{cell.label}</div>
          <div className="value">{cell.value}</div>
          {cell.goal ? <div className="tiny muted">z {cell.goal}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="modal-head">
          <h2 style={{ flex: 1, minWidth: 0 }}>{title}</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Zamknij">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <span className="icon" aria-hidden="true">
        {icon}
      </span>
      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      {hint ? <div className="small">{hint}</div> : null}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={`f-${label}`}>
        {label}
        {suffix ? <span className="muted"> ({suffix})</span> : null}
      </label>
      <input
        id={`f-${label}`}
        type="number"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          onChange(Number.isFinite(parsed) ? parsed : 0);
        }}
      />
      {hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}
