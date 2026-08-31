import { useState } from 'react';
import { formatAmount, formatKcal, formatMinutes, formatNumber, round } from '../lib/format';
import { ingredientMacros } from '../lib/nutrition';
import { useStore } from '../state/store';
import { MEAL_LABEL } from '../types';
import { MacroSummary, Modal } from './ui';

export function RecipeDetail({
  recipeId,
  initialPortions = 1,
  onClose,
  onEdit,
}: {
  recipeId: string;
  initialPortions?: number;
  onClose: () => void;
  onEdit?: (recipeId: string) => void;
}) {
  const { state, dispatch, derived } = useStore();
  const [portions, setPortions] = useState(initialPortions);

  const recipe = derived.recipeMap.get(recipeId);
  if (!recipe) return null;

  const perPortion = derived.recipeMacrosOf(recipeId);
  const total = {
    kcal: perPortion.kcal * portions,
    protein: perPortion.protein * portions,
    fat: perPortion.fat * portions,
    carbs: perPortion.carbs * portions,
  };

  const liked = state.preferences.likedRecipeIds.includes(recipeId);
  const disliked = state.preferences.dislikedRecipeIds.includes(recipeId);

  return (
    <Modal
      title={recipe.name}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn"
            aria-pressed={disliked}
            onClick={() => dispatch({ type: 'toggleDisliked', recipeId })}
          >
            {disliked ? '✓ Nie dla mnie' : 'Nie dla mnie'}
          </button>
          <button
            type="button"
            className="btn"
            aria-pressed={liked}
            onClick={() => dispatch({ type: 'toggleLiked', recipeId })}
          >
            {liked ? '★ Ulubione' : '☆ Ulubione'}
          </button>
          {onEdit ? (
            <button type="button" className="btn" onClick={() => onEdit(recipeId)}>
              Edytuj
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Zamknij
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="recipe-meta">
          <span>⏱ {formatMinutes(recipe.prepMinutes)}</span>
          <span>🔥 {formatKcal(perPortion.kcal)} / porcja</span>
          <span>{recipe.mealTypes.map((meal) => MEAL_LABEL[meal]).join(', ')}</span>
        </div>

        {recipe.tags.length > 0 ? (
          <div className="chips">
            {recipe.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="card">
          <div className="row" style={{ marginBottom: '0.6rem' }}>
            <strong style={{ flex: 1 }}>Składniki</strong>
            <label className="small muted" htmlFor="detail-portions">
              Porcje
            </label>
            <input
              id="detail-portions"
              className="portion-input"
              type="number"
              min={0.25}
              step={0.25}
              value={portions}
              onChange={(event) => setPortions(Math.max(0.25, Number(event.target.value) || 1))}
            />
          </div>

          <ul className="ing-list">
            {recipe.ingredients.map((item) => {
              const ingredient = derived.ingredients.get(item.ingredientId);
              if (!ingredient) {
                return (
                  <li key={item.ingredientId}>
                    <span className="muted">Nieznany składnik ({item.ingredientId})</span>
                  </li>
                );
              }
              const amount = item.amount * portions;
              const macros = ingredientMacros(ingredient, amount);
              return (
                <li key={item.ingredientId}>
                  <span>{ingredient.name}</span>
                  <span className="nowrap">
                    <strong>{formatAmount(round(amount, 2), ingredient.unit)}</strong>{' '}
                    <span className="tiny muted">{formatNumber(macros.kcal, 0)} kcal</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>Wartości odżywcze ({formatNumber(portions, 2)} × porcja)</h3>
          <MacroSummary macros={total} />
        </div>

        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>Przygotowanie</h3>
          <ol className="steps-list">
            {recipe.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  );
}
