import { useMemo, useState } from 'react';
import { formatKcal, formatMinutes, formatNumber } from '../lib/format';
import { roundPortions } from '../lib/planner';
import { checkRecipe } from '../lib/preferences';
import { useStore } from '../state/store';
import { MEAL_LABEL_ACC, type MealType } from '../types';
import { EmptyState, Modal } from './ui';

export function RecipePicker({
  meal,
  targetKcal,
  onPick,
  onClose,
}: {
  meal: MealType;
  targetKcal: number;
  onPick: (recipeId: string, portions: number) => void;
  onClose: () => void;
}) {
  const { state, derived } = useStore();
  const [query, setQuery] = useState('');
  const [onlyMatching, setOnlyMatching] = useState(true);
  const [fitPortions, setFitPortions] = useState(true);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return derived.recipes
      .filter((recipe) => recipe.mealTypes.includes(meal))
      .filter((recipe) => !needle || recipe.name.toLowerCase().includes(needle) || recipe.tags.some((tag) => tag.includes(needle)))
      .map((recipe) => ({
        recipe,
        check: checkRecipe(recipe, state.preferences, derived.ingredients),
        kcal: derived.recipeMacrosOf(recipe.id).kcal,
      }))
      .filter((row) => !onlyMatching || row.check.ok)
      .sort((a, b) => a.recipe.name.localeCompare(b.recipe.name, 'pl'));
  }, [derived, meal, onlyMatching, query, state.preferences]);

  const suggestedPortions = (kcal: number) =>
    fitPortions && kcal > 0 && targetKcal > 0 ? roundPortions(targetKcal / kcal) : 1;

  return (
    <Modal title={`Dodaj ${MEAL_LABEL_ACC[meal]}`} onClose={onClose}>
      <div className="stack">
        <input
          type="search"
          placeholder="Szukaj przepisu…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />

        <div className="row small">
          <label className="row-tight">
            <input
              type="checkbox"
              checked={onlyMatching}
              onChange={(event) => setOnlyMatching(event.target.checked)}
              style={{ width: 'auto' }}
            />
            Tylko pasujące do moich preferencji
          </label>
          <label className="row-tight">
            <input
              type="checkbox"
              checked={fitPortions}
              onChange={(event) => setFitPortions(event.target.checked)}
              style={{ width: 'auto' }}
            />
            Dopasuj porcję do {formatNumber(targetKcal, 0)} kcal
          </label>
        </div>

        {results.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Brak przepisów"
            hint="Zmień frazę albo odznacz filtr preferencji."
          />
        ) : (
          <div className="stack" style={{ gap: '0.4rem' }}>
            {results.map(({ recipe, check, kcal }) => {
              const portions = suggestedPortions(kcal);
              return (
                <button
                  key={recipe.id}
                  type="button"
                  className="entry"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onPick(recipe.id, portions)}
                >
                  <span className="entry-main">
                    <span style={{ fontWeight: 550, display: 'block' }}>{recipe.name}</span>
                    <span className="recipe-meta">
                      <span>{formatKcal(kcal)} / porcja</span>
                      <span>⏱ {formatMinutes(recipe.prepMinutes)}</span>
                      {fitPortions && portions !== 1 ? (
                        <span>→ {formatNumber(portions, 2)} porcji</span>
                      ) : null}
                      {!check.ok ? <span style={{ color: 'var(--warn)' }}>{check.reason}</span> : null}
                    </span>
                  </span>
                  <span className="btn btn-sm">Dodaj</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
