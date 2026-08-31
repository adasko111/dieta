import { useMemo, useState } from 'react';
import { formatKcal, formatMinutes } from '../lib/format';
import { checkRecipe } from '../lib/preferences';
import { useStore } from '../state/store';
import { MEAL_LABEL, MEAL_ORDER, type MealType } from '../types';
import { RecipeDetail } from './RecipeDetail';
import { RecipeEditor } from './RecipeEditor';
import { EmptyState } from './ui';

export function RecipesView() {
  const { state, derived } = useStore();
  const [query, setQuery] = useState('');
  const [meal, setMeal] = useState<MealType | 'wszystkie'>('wszystkie');
  const [onlyMatching, setOnlyMatching] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null | undefined>(undefined);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return derived.recipes
      .map((recipe) => ({
        recipe,
        check: checkRecipe(recipe, state.preferences, derived.ingredients),
        kcal: derived.recipeMacrosOf(recipe.id).kcal,
      }))
      .filter(({ recipe }) => meal === 'wszystkie' || recipe.mealTypes.includes(meal))
      .filter(
        ({ recipe }) =>
          !needle ||
          recipe.name.toLowerCase().includes(needle) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(needle)),
      )
      .sort((a, b) => a.recipe.name.localeCompare(b.recipe.name, 'pl'));
  }, [derived, meal, query, state.preferences]);

  const visible = onlyMatching ? rows.filter((row) => row.check.ok) : rows;
  const hiddenCount = rows.length - visible.length;

  return (
    <div>
      <div className="view-head">
        <div>
          <h1>Przepisy</h1>
          <p>
            {derived.recipes.length} przepisów. Oznacz ulubione gwiazdką — częściej trafią do
            wygenerowanego planu.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing(null)}>
          + Nowy przepis
        </button>
      </div>

      <div className="card">
        <div className="stack" style={{ gap: '0.6rem' }}>
          <input
            type="search"
            placeholder="Szukaj po nazwie lub tagu…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="chips">
            <button
              type="button"
              className="chip"
              aria-pressed={meal === 'wszystkie'}
              onClick={() => setMeal('wszystkie')}
            >
              Wszystkie
            </button>
            {MEAL_ORDER.map((option) => (
              <button
                key={option}
                type="button"
                className="chip"
                aria-pressed={meal === option}
                onClick={() => setMeal(option)}
              >
                {MEAL_LABEL[option]}
              </button>
            ))}
          </div>
          <label className="row-tight small">
            <input
              type="checkbox"
              checked={onlyMatching}
              onChange={(event) => setOnlyMatching(event.target.checked)}
              style={{ width: 'auto' }}
            />
            Tylko pasujące do moich preferencji
            {hiddenCount > 0 && onlyMatching ? (
              <span className="muted"> (ukryto {hiddenCount})</span>
            ) : null}
          </label>
        </div>
      </div>

      <div style={{ marginTop: '0.85rem' }}>
        {visible.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="📖"
              title="Nic nie pasuje"
              hint="Poluzuj filtry albo odznacz kilka wykluczonych składników w profilu."
            />
          </div>
        ) : (
          <div className="recipe-grid">
            {visible.map(({ recipe, check, kcal }) => {
              const liked = state.preferences.likedRecipeIds.includes(recipe.id);
              return (
                <button
                  key={recipe.id}
                  type="button"
                  className="recipe-card"
                  onClick={() => setDetailId(recipe.id)}
                >
                  <div className="row-tight" style={{ alignItems: 'flex-start' }}>
                    <h3 style={{ flex: 1 }}>{recipe.name}</h3>
                    {liked ? <span aria-label="ulubione">★</span> : null}
                  </div>
                  <div className="recipe-meta">
                    <span>{formatKcal(kcal)}</span>
                    <span>⏱ {formatMinutes(recipe.prepMinutes)}</span>
                    {recipe.custom ? <span className="tag">własny</span> : null}
                  </div>
                  {!check.ok ? (
                    <div className="tiny" style={{ color: 'var(--warn)' }}>
                      {check.reason}
                    </div>
                  ) : null}
                  <div className="chips">
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {detailId ? (
        <RecipeDetail
          recipeId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={(id) => {
            setDetailId(null);
            setEditing(id);
          }}
        />
      ) : null}

      {editing !== undefined ? (
        <RecipeEditor recipeId={editing} onClose={() => setEditing(undefined)} />
      ) : null}
    </div>
  );
}
