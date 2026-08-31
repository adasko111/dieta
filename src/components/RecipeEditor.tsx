import { useMemo, useState } from 'react';
import { formatKcal } from '../lib/format';
import { recipeMacros } from '../lib/nutrition';
import { useStore } from '../state/store';
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  MEAL_LABEL,
  MEAL_ORDER,
  type MealType,
  type Recipe,
  type RecipeIngredient,
} from '../types';
import { Chip, MacroSummary, Modal, NumberField } from './ui';

function blankRecipe(): Recipe {
  return {
    id: `r${Date.now().toString(36)}`,
    name: '',
    mealTypes: ['obiad'],
    prepMinutes: 20,
    ingredients: [],
    steps: [],
    tags: [],
    custom: true,
  };
}

export function RecipeEditor({
  recipeId,
  onClose,
}: {
  recipeId: string | null;
  onClose: () => void;
}) {
  const { state, dispatch, derived } = useStore();

  const [draft, setDraft] = useState<Recipe>(() => {
    if (!recipeId) return blankRecipe();
    const existing = derived.recipeMap.get(recipeId);
    return existing ? { ...existing, custom: true } : blankRecipe();
  });
  const [stepsText, setStepsText] = useState(() => draft.steps.join('\n'));
  const [tagsText, setTagsText] = useState(() => draft.tags.join(', '));

  const isOverride = Boolean(recipeId) && !state.customRecipes.some((item) => item.id === recipeId);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: derived.ingredientList
        .filter((item) => item.category === category)
        .sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    })).filter((group) => group.items.length > 0);
  }, [derived.ingredientList]);

  const preview = useMemo(
    () => recipeMacros({ ...draft, steps: [], tags: [] }, derived.ingredients),
    [draft, derived.ingredients],
  );

  const patch = (value: Partial<Recipe>) => setDraft((current) => ({ ...current, ...value }));

  const setIngredient = (index: number, value: Partial<RecipeIngredient>) => {
    patch({
      ingredients: draft.ingredients.map((item, position) =>
        position === index ? { ...item, ...value } : item,
      ),
    });
  };

  const save = () => {
    const name = draft.name.trim();
    if (!name) return;

    dispatch({
      type: 'saveRecipe',
      recipe: {
        ...draft,
        name,
        custom: true,
        steps: stepsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        tags: tagsText
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
        ingredients: draft.ingredients.filter((item) => item.ingredientId && item.amount > 0),
      },
    });
    onClose();
  };

  const remove = () => {
    if (recipeId) dispatch({ type: 'deleteRecipe', id: recipeId });
    onClose();
  };

  return (
    <Modal
      title={recipeId ? 'Edytuj przepis' : 'Nowy przepis'}
      onClose={onClose}
      footer={
        <>
          {recipeId ? (
            <button type="button" className="btn btn-danger" onClick={remove}>
              Usuń
            </button>
          ) : null}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Anuluj
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={save}
            disabled={!draft.name.trim() || draft.ingredients.length === 0}
          >
            Zapisz
          </button>
        </>
      }
    >
      <div className="stack">
        {isOverride ? (
          <div className="notice">
            Zapisanie zmian nadpisze bazowy przepis Twoją wersją. Oryginał wróci po usunięciu kopii.
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="recipe-name">Nazwa</label>
          <input
            id="recipe-name"
            type="text"
            value={draft.name}
            autoFocus
            placeholder="np. Kurczak z warzywami"
            onChange={(event) => patch({ name: event.target.value })}
          />
        </div>

        <div className="field">
          <label>Kiedy jadam to danie</label>
          <div className="chips">
            {MEAL_ORDER.map((meal: MealType) => (
              <Chip
                key={meal}
                active={draft.mealTypes.includes(meal)}
                onClick={() =>
                  patch({
                    mealTypes: draft.mealTypes.includes(meal)
                      ? draft.mealTypes.filter((item) => item !== meal)
                      : [...draft.mealTypes, meal],
                  })
                }
              >
                {MEAL_LABEL[meal]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <NumberField
            label="Czas przygotowania"
            suffix="min"
            value={draft.prepMinutes}
            min={1}
            max={300}
            onChange={(prepMinutes) => patch({ prepMinutes })}
          />
          <div className="field">
            <label htmlFor="recipe-tags">Tagi</label>
            <input
              id="recipe-tags"
              type="text"
              value={tagsText}
              placeholder="szybkie, meal prep"
              onChange={(event) => setTagsText(event.target.value)}
            />
            <span className="hint">Po przecinku.</span>
          </div>
        </div>

        <div className="field">
          <label>Składniki na jedną porcję</label>
          <div className="stack" style={{ gap: '0.4rem' }}>
            {draft.ingredients.map((item, index) => {
              const ingredient = derived.ingredients.get(item.ingredientId);
              return (
                <div className="row-tight" key={index}>
                  <select
                    value={item.ingredientId}
                    aria-label="Składnik"
                    onChange={(event) => setIngredient(index, { ingredientId: event.target.value })}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <option value="">— wybierz —</option>
                    {grouped.map((group) => (
                      <optgroup key={group.category} label={CATEGORY_LABEL[group.category]}>
                        {group.items.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step={ingredient && (ingredient.unit === 'g' || ingredient.unit === 'ml') ? 5 : 0.25}
                    value={item.amount}
                    aria-label="Ilość"
                    style={{ width: '5.5rem' }}
                    onChange={(event) =>
                      setIngredient(index, { amount: Number(event.target.value) || 0 })
                    }
                  />
                  <span className="small muted" style={{ width: '3.5rem' }}>
                    {ingredient?.unit ?? ''}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label="Usuń składnik"
                    onClick={() =>
                      patch({
                        ingredients: draft.ingredients.filter((_, position) => position !== index),
                      })
                    }
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              className="empty-slot"
              onClick={() =>
                patch({ ingredients: [...draft.ingredients, { ingredientId: '', amount: 100 }] })
              }
            >
              + Dodaj składnik
            </button>
          </div>
        </div>

        <div className="card">
          <div className="small muted" style={{ marginBottom: '0.4rem' }}>
            Jedna porcja: <strong>{formatKcal(preview.kcal)}</strong>
          </div>
          <MacroSummary macros={preview} />
        </div>

        <div className="field">
          <label htmlFor="recipe-steps">Przygotowanie</label>
          <textarea
            id="recipe-steps"
            value={stepsText}
            rows={6}
            placeholder={'Każdy krok w osobnej linii.'}
            onChange={(event) => setStepsText(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
