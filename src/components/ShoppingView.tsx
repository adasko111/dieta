import { useMemo, useState } from 'react';
import { formatAmount, formatNumber } from '../lib/format';
import { countChecked, countItems } from '../lib/shopping';
import { useStore } from '../state/store';
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  DAY_SHORT,
  type Category,
  type DayIndex,
  type ExtraItem,
  type Unit,
} from '../types';
import { Bar, EmptyState, Modal } from './ui';

const DAY_INDEXES: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];
const UNITS: Unit[] = ['g', 'ml', 'szt', 'łyżka', 'łyżeczka', 'ząbek', 'garść', 'pęczek'];

export function ShoppingView() {
  const { state, dispatch, derived } = useStore();
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  const sections = derived.shopping;
  const total = countItems(sections);
  const done = countChecked(sections, state.checked);

  const allKeys = useMemo(
    () => sections.flatMap((section) => section.items.map((item) => item.key)),
    [sections],
  );

  const toggleDay = (day: DayIndex) => {
    const next = state.shoppingDays.includes(day)
      ? state.shoppingDays.filter((item) => item !== day)
      : [...state.shoppingDays, day].sort((a, b) => a - b);
    dispatch({ type: 'setShoppingDays', days: next });
  };

  const asText = () => {
    const lines: string[] = ['Lista zakupów', ''];
    for (const section of sections) {
      lines.push(`— ${CATEGORY_LABEL[section.category]} —`);
      for (const item of section.items) {
        const mark = state.checked[item.key] ? '[x]' : '[ ]';
        lines.push(`${mark} ${item.name}: ${formatAmount(item.amount, item.unit)}`);
      }
      lines.push('');
    }
    return lines.join('\n').trim();
  };

  /**
   * `navigator.clipboard` istnieje tylko w bezpiecznym kontekście (HTTPS albo
   * localhost). Przy własnym serwerze po HTTP na adresie w sieci lokalnej go
   * nie ma, więc schodzimy do starego execCommand, a w ostateczności
   * pokazujemy tekst do ręcznego skopiowania.
   */
  const copy = async () => {
    const text = asText();

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {
        // Odmowa uprawnień — próbujemy dalej.
      }
    }

    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();

    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(area);

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setFallbackText(text);
    }
  };

  return (
    <div>
      <div className="view-head">
        <div>
          <h1>Lista zakupów</h1>
          <p>Zliczona automatycznie z zaznaczonych dni planu. Odhaczaj w sklepie — zapisuje się samo.</p>
        </div>
        <div className="row no-print">
          <button type="button" className="btn" onClick={copy}>
            {copied ? '✓ Skopiowano' : 'Kopiuj'}
          </button>
          <button type="button" className="btn" onClick={() => window.print()}>
            Drukuj
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            + Dopisz
          </button>
        </div>
      </div>

      <div className="card no-print">
        <div className="small" style={{ marginBottom: '0.5rem', fontWeight: 550 }}>
          Dni objęte listą
        </div>
        <div className="chips" style={{ marginBottom: '0.6rem' }}>
          {DAY_INDEXES.map((day) => (
            <button
              key={day}
              type="button"
              className="chip"
              aria-pressed={state.shoppingDays.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {DAY_SHORT[day]}
            </button>
          ))}
        </div>
        <div className="row small">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => dispatch({ type: 'setShoppingDays', days: DAY_INDEXES })}
          >
            Cały tydzień
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => dispatch({ type: 'setShoppingDays', days: [0, 1, 2] })}
          >
            Pn–Śr
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => dispatch({ type: 'setShoppingDays', days: [3, 4, 5, 6] })}
          >
            Cz–Nd
          </button>
        </div>
      </div>

      {total > 0 ? (
        <div className="card">
          <div className="progress-line" style={{ marginBottom: '0.5rem' }}>
            <strong>
              {done} z {total}
            </strong>
            <span className="muted small">pozycji w koszyku</span>
            <span className="spacer" />
            <button
              type="button"
              className="btn btn-sm no-print"
              onClick={() => dispatch({ type: 'setChecked', keys: allKeys, value: false })}
              disabled={done === 0}
            >
              Odznacz wszystko
            </button>
          </div>
          <Bar value={done} max={total} />
        </div>
      ) : null}

      {total === 0 ? (
        <div className="card">
          <EmptyState
            icon="🛒"
            title="Nic do kupienia"
            hint="Ułóż plan posiłków albo zaznacz inne dni — lista policzy się sama."
          />
        </div>
      ) : null}

      {sections.map((section) => (
        <div className="shop-section" key={section.category}>
          <h3>{CATEGORY_LABEL[section.category]}</h3>
          {section.items.map((item) => {
            const isChecked = Boolean(state.checked[item.key]);
            const approx =
              item.approxGrams && item.unit !== 'g' && item.unit !== 'ml'
                ? ` (~${formatNumber(item.amount * item.approxGrams, 0)} g)`
                : '';
            const usedIn =
              item.usedIn.length > 2
                ? `${item.usedIn.slice(0, 2).join(', ')} i ${item.usedIn.length - 2} inne`
                : item.usedIn.join(', ');

            return (
              <div
                key={item.key}
                className={isChecked ? 'shop-item checked' : 'shop-item'}
                role="checkbox"
                tabIndex={0}
                aria-checked={isChecked}
                onClick={() => dispatch({ type: 'toggleChecked', key: item.key })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    dispatch({ type: 'toggleChecked', key: item.key });
                  }
                }}
              >
                <span className="checkbox" aria-hidden="true">
                  ✓
                </span>
                <span className="shop-body">
                  <span className="shop-name">{item.name}</span>
                  <span className="shop-amount">
                    {' '}
                    — {formatAmount(item.amount, item.unit)}
                    {approx}
                  </span>
                  {usedIn ? <div className="tiny muted">{usedIn}</div> : null}
                  {item.manual ? <div className="tiny muted">dopisane ręcznie</div> : null}
                </span>
                {item.manual ? (
                  <button
                    type="button"
                    className="btn-icon no-print"
                    aria-label="Usuń pozycję"
                    onClick={(event) => {
                      event.stopPropagation();
                      dispatch({ type: 'removeExtra', id: item.key.replace('extra:', '') });
                    }}
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}

      {adding ? <AddExtra onClose={() => setAdding(false)} /> : null}

      {fallbackText !== null ? (
        <Modal
          title="Skopiuj listę"
          onClose={() => setFallbackText(null)}
          footer={
            <button type="button" className="btn btn-primary" onClick={() => setFallbackText(null)}>
              Zamknij
            </button>
          }
        >
          <div className="stack">
            <p className="small muted">
              Przeglądarka nie dała dostępu do schowka (zdarza się przy połączeniu bez HTTPS).
              Zaznacz tekst i skopiuj ręcznie.
            </p>
            <textarea readOnly rows={14} value={fallbackText} onFocus={(e) => e.target.select()} />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function AddExtra({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<Unit>('szt');
  const [category, setCategory] = useState<Category>('inne');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const item: ExtraItem = {
      id: `x${Date.now().toString(36)}`,
      name: trimmed,
      amount,
      unit,
      category,
    };
    dispatch({ type: 'addExtra', item });
    onClose();
  };

  return (
    <Modal
      title="Dopisz do listy"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Anuluj
          </button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={!name.trim()}>
            Dodaj
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="field">
          <label htmlFor="extra-name">Co kupić</label>
          <input
            id="extra-name"
            type="text"
            value={name}
            autoFocus
            placeholder="np. papier do pieczenia"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
          />
        </div>
        <div className="grid-3">
          <div className="field">
            <label htmlFor="extra-amount">Ilość</label>
            <input
              id="extra-amount"
              type="number"
              min={0}
              step={0.5}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value) || 0)}
            />
          </div>
          <div className="field">
            <label htmlFor="extra-unit">Jednostka</label>
            <select id="extra-unit" value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
              {UNITS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="extra-category">Dział</label>
            <select
              id="extra-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              {CATEGORY_ORDER.map((option) => (
                <option key={option} value={option}>
                  {CATEGORY_LABEL[option]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
