import { useMemo, useState } from 'react';
import { formatKcal, formatNumber, formatPortions } from '../lib/format';
import { activeMeals, dayKcal, generateWeek, scaleDayToTarget, snackCount } from '../lib/planner';
import { useStore } from '../state/store';
import {
  DAY_NAMES,
  DAY_SHORT,
  MEAL_LABEL,
  MEAL_LABEL_ACC,
  MEAL_ORDER,
  type DayIndex,
  type MealType,
} from '../types';
import { RecipeDetail } from './RecipeDetail';
import { RecipePicker } from './RecipePicker';
import { Bar, EmptyState, MacroSummary } from './ui';

const DAY_INDEXES: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];

export function PlanView() {
  const { state, dispatch, derived } = useStore();
  const [selectedDay, setSelectedDay] = useState<DayIndex>(0);
  const [picker, setPicker] = useState<MealType | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const target = derived.target.kcal;
  const day = state.plan[selectedDay];

  const kcalByDay = useMemo(
    () => state.plan.map((entryDay) => dayKcal(entryDay, derived.recipeKcal)),
    [state.plan, derived.recipeKcal],
  );

  const dayMacros = useMemo(() => {
    const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
    if (!day) return totals;
    for (const meal of MEAL_ORDER) {
      for (const entry of day[meal]) {
        const macros = derived.recipeMacrosOf(entry.recipeId);
        totals.kcal += macros.kcal * entry.portions;
        totals.protein += macros.protein * entry.portions;
        totals.fat += macros.fat * entry.portions;
        totals.carbs += macros.carbs * entry.portions;
      }
    }
    return totals;
  }, [day, derived]);

  const meals = activeMeals(state.profile.mealsPerDay);
  const snacks = snackCount(state.profile.mealsPerDay);
  const isWeekEmpty = kcalByDay.every((value) => value === 0);

  const slotTarget = (meal: MealType): number => {
    const share = state.profile.mealShare[meal] ?? 0;
    const slots = meal === 'przekaska' ? Math.max(1, snacks) : 1;
    return (target * share) / 100 / slots;
  };

  const generate = (days: DayIndex[]) => {
    dispatch({
      type: 'setPlan',
      plan: generateWeek({
        recipes: derived.recipes,
        ingredients: derived.ingredients,
        profile: state.profile,
        preferences: state.preferences,
        dailyKcal: target,
        days,
        base: state.plan,
      }),
    });
  };

  const fitDay = () => {
    if (!day) return;
    const scaled = scaleDayToTarget(day, target, derived.recipeKcal);
    const plan = state.plan.map((current, index) => (index === selectedDay ? scaled : current));
    dispatch({ type: 'setPlan', plan });
  };

  return (
    <div>
      <div className="view-head">
        <div>
          <h1>Plan tygodnia</h1>
          <p>
            Cel: <strong>{formatKcal(target)}</strong> dziennie, {state.profile.mealsPerDay} posiłki.
            Zmień porcje, a kalorie przeliczą się same.
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={() => generate(DAY_INDEXES)}>
            {isWeekEmpty ? 'Wygeneruj plan' : 'Przelosuj tydzień'}
          </button>
        </div>
      </div>

      <div className="day-tabs" role="tablist" aria-label="Dni tygodnia">
        {DAY_INDEXES.map((index) => (
          <button
            key={index}
            type="button"
            role="tab"
            className="day-tab"
            aria-current={index === selectedDay}
            onClick={() => setSelectedDay(index)}
          >
            <span className="d">{DAY_SHORT[index]}</span>
            <span className="k">{kcalByDay[index] ? formatNumber(kcalByDay[index], 0) : '–'}</span>
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: '0.85rem' }}>
        <div className="row" style={{ marginBottom: '0.6rem' }}>
          <h2 style={{ flex: 1 }}>{DAY_NAMES[selectedDay]}</h2>
          <button type="button" className="btn btn-sm" onClick={() => generate([selectedDay])}>
            Przelosuj dzień
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={fitDay}
            disabled={kcalByDay[selectedDay] === 0}
            title="Przeskaluj porcje tak, by trafić w cel kaloryczny"
          >
            Dopasuj do celu
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => dispatch({ type: 'clearDay', day: selectedDay })}
            disabled={kcalByDay[selectedDay] === 0}
          >
            Wyczyść
          </button>
        </div>

        <div className="stack" style={{ gap: '0.4rem', marginBottom: '0.9rem' }}>
          <div className="row small">
            <strong>{formatNumber(dayMacros.kcal, 0)}</strong>
            <span className="muted">z {formatNumber(target, 0)} kcal</span>
            <span className="spacer" />
            <span className={dayMacros.kcal > target * 1.05 ? '' : 'muted'}>
              {dayMacros.kcal > target
                ? `+${formatNumber(dayMacros.kcal - target, 0)}`
                : formatNumber(dayMacros.kcal - target, 0)}{' '}
              kcal
            </span>
          </div>
          <Bar value={dayMacros.kcal} max={target} />
        </div>

        <MacroSummary macros={dayMacros} target={derived.macros} />

        <div style={{ marginTop: '1rem' }}>
          {meals.map((meal) => {
            const entries = day?.[meal] ?? [];
            const slots = meal === 'przekaska' ? snacks : 1;
            const mealKcal = entries.reduce(
              (sum, entry) => sum + derived.recipeMacrosOf(entry.recipeId).kcal * entry.portions,
              0,
            );

            return (
              <div className="meal-block" key={meal}>
                <div className="meal-head">
                  <h3>{MEAL_LABEL[meal]}</h3>
                  <span className="tiny muted">
                    {formatNumber(mealKcal, 0)} / {formatNumber(slotTarget(meal) * slots, 0)} kcal
                  </span>
                </div>

                {entries.map((entry) => {
                  const recipe = derived.recipeMap.get(entry.recipeId);
                  const kcal = derived.recipeMacrosOf(entry.recipeId).kcal * entry.portions;
                  return (
                    <div className="entry" key={entry.id}>
                      <div className="entry-main">
                        <button
                          type="button"
                          className="entry-name"
                          onClick={() => setDetailId(entry.recipeId)}
                        >
                          {recipe?.name ?? 'Usunięty przepis'}
                        </button>
                        <div className="tiny muted">
                          {formatPortions(entry.portions)} · {formatNumber(kcal, 0)} kcal
                        </div>
                      </div>
                      <input
                        className="portion-input"
                        type="number"
                        min={0.25}
                        step={0.25}
                        value={entry.portions}
                        aria-label={`Porcje: ${recipe?.name ?? ''}`}
                        onChange={(event) =>
                          dispatch({
                            type: 'setPortions',
                            day: selectedDay,
                            meal,
                            entryId: entry.id,
                            portions: Math.max(0.25, Number(event.target.value) || 0.25),
                          })
                        }
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        aria-label="Usuń z planu"
                        onClick={() =>
                          dispatch({ type: 'removeEntry', day: selectedDay, meal, entryId: entry.id })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}

                {entries.length < slots || meal !== 'przekaska' ? (
                  <button
                    type="button"
                    className="empty-slot"
                    style={{ marginTop: entries.length > 0 ? '0.4rem' : 0 }}
                    onClick={() => setPicker(meal)}
                  >
                    + Dodaj {MEAL_LABEL_ACC[meal]}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {isWeekEmpty ? (
        <div className="card" style={{ marginTop: '0.85rem' }}>
          <EmptyState
            icon="🍽"
            title="Plan jest jeszcze pusty"
            hint="Kliknij „Wygeneruj plan”, a dobiorę przepisy pasujące do Twoich preferencji i celu kalorycznego."
          />
        </div>
      ) : null}

      {picker ? (
        <RecipePicker
          meal={picker}
          targetKcal={slotTarget(picker)}
          onClose={() => setPicker(null)}
          onPick={(recipeId, portions) => {
            dispatch({ type: 'addEntry', day: selectedDay, meal: picker, recipeId, portions });
            setPicker(null);
          }}
        />
      ) : null}

      {detailId ? <RecipeDetail recipeId={detailId} onClose={() => setDetailId(null)} /> : null}
    </div>
  );
}
