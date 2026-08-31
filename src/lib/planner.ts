import {
  MEAL_ORDER,
  type DayPlan,
  type Ingredient,
  type MealType,
  type PlanEntry,
  type Macros,
  type Preferences,
  type Profile,
  type Recipe,
  type WeekPlan,
} from '../types';
import { EMPTY_MACROS, recipeMacros } from './nutrition';
import { isRecipeAllowed, recipeWeight } from './preferences';

export const MIN_PORTIONS = 0.5;
export const MAX_PORTIONS = 3;
/** Porcje skaczą co ćwiartkę — drobniejsze podziały nie mają sensu w kuchni. */
export const PORTION_STEP = 0.25;

export function roundPortions(value: number): number {
  const stepped = Math.round(value / PORTION_STEP) * PORTION_STEP;
  const clamped = Math.min(MAX_PORTIONS, Math.max(MIN_PORTIONS, stepped));
  // Bez tego wychodzą liczby w stylu 1.7500000000000002.
  return Math.round(clamped * 100) / 100;
}

/** Ile przekąsek dziennie wynika z wybranej liczby posiłków. */
export function snackCount(mealsPerDay: number): number {
  return Math.max(0, Math.min(2, Math.round(mealsPerDay) - 3));
}

/** Które sloty są aktywne przy danej liczbie posiłków. */
export function activeMeals(mealsPerDay: number): MealType[] {
  const meals: MealType[] = ['sniadanie', 'obiad', 'kolacja'];
  if (snackCount(mealsPerDay) > 0) meals.push('przekaska');
  return meals;
}

/** Domyślny podział kalorii między posiłki. */
export function defaultMealShare(mealsPerDay: number): Record<MealType, number> {
  switch (snackCount(mealsPerDay)) {
    case 0:
      return { sniadanie: 30, obiad: 40, kolacja: 30, przekaska: 0 };
    case 1:
      return { sniadanie: 25, obiad: 35, kolacja: 25, przekaska: 15 };
    default:
      return { sniadanie: 25, obiad: 30, kolacja: 25, przekaska: 20 };
  }
}

export function emptyDay(): DayPlan {
  return { sniadanie: [], obiad: [], kolacja: [], przekaska: [] };
}

export function emptyWeek(): WeekPlan {
  return Array.from({ length: 7 }, emptyDay);
}

let entryCounter = 0;

export function createEntry(recipeId: string, portions: number): PlanEntry {
  entryCounter += 1;
  return {
    id: `e${Date.now().toString(36)}-${entryCounter.toString(36)}`,
    recipeId,
    portions,
  };
}

/**
 * Delikatna premia dla przepisów o gęstości białka zbliżonej do celu. Bez niej
 * plan trafia w kalorie, ale przy redukcji potrafi mocno nie dowozić białka —
 * losowanie samo z siebie ciągnie w stronę dań węglowodanowych.
 */
export function proteinFit(macros: Macros, targetProteinPerKcal: number): number {
  if (macros.kcal <= 0 || targetProteinPerKcal <= 0) return 1;
  const ratio = macros.protein / macros.kcal / targetProteinPerKcal;
  // Premia rośnie do 1,5× celu i tam się zatrzymuje — inaczej plan składałby
  // się z samego twarogu i piersi z kurczaka.
  return 0.5 + Math.min(1.5, ratio);
}

/** Losowanie ważone — im wyższa waga, tym większa szansa na wybór. */
function weightedPick<T>(items: T[], weightOf: (item: T) => number, rng: () => number): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)] ?? null;

  let threshold = rng() * total;
  for (const item of items) {
    threshold -= Math.max(0, weightOf(item));
    if (threshold <= 0) return item;
  }
  return items[items.length - 1] ?? null;
}

export interface GenerateOptions {
  recipes: Recipe[];
  ingredients: Map<string, Ingredient>;
  profile: Profile;
  preferences: Preferences;
  /** Dzienny cel kaloryczny. */
  dailyKcal: number;
  /** Czy dobierać wielkość porcji tak, by trafić w cel kaloryczny. */
  autoPortions?: boolean;
  /** Dni, które mają zostać wygenerowane (domyślnie wszystkie). */
  days?: number[];
  /** Plan bazowy — dni spoza `days` zostają nietknięte. */
  base?: WeekPlan;
  /** Ile ostatnich losowań blokuje powtórzenie przepisu. */
  cooldown?: number;
  rng?: () => number;
}

/**
 * Układa plan tygodnia: dla każdego slotu losuje przepis pasujący do
 * preferencji i dobiera liczbę porcji tak, by trafić w kaloryczność slotu.
 */
export function generateWeek(options: GenerateOptions): WeekPlan {
  const {
    recipes,
    ingredients,
    profile,
    preferences,
    dailyKcal,
    autoPortions = true,
    days = [0, 1, 2, 3, 4, 5, 6],
    base,
    cooldown = 4,
    rng = Math.random,
  } = options;

  const week: WeekPlan = base ? base.map((day) => ({ ...day })) : emptyWeek();
  const targetDays = new Set(days);

  const allowed = recipes.filter((recipe) => isRecipeAllowed(recipe, preferences, ingredients));
  const macrosPerPortion = new Map<string, Macros>();
  for (const recipe of allowed) {
    macrosPerPortion.set(recipe.id, recipeMacros(recipe, ingredients));
  }

  // Ile gramów białka na kilokalorię wynika z ustawionego rozkładu makro.
  const targetProteinPerKcal = profile.proteinPct / 100 / 4;

  const byMeal = new Map<MealType, Recipe[]>();
  for (const meal of MEAL_ORDER) {
    byMeal.set(
      meal,
      allowed.filter((recipe) => recipe.mealTypes.includes(meal)),
    );
  }

  const recent: string[] = [];
  const pick = (meal: MealType): Recipe | null => {
    const pool = byMeal.get(meal) ?? [];
    if (pool.length === 0) return null;

    const blocked = new Set(recent.slice(-cooldown));
    const fresh = pool.filter((recipe) => !blocked.has(recipe.id));
    const candidates = fresh.length > 0 ? fresh : pool;

    const chosen = weightedPick(
      candidates,
      (recipe) =>
        recipeWeight(recipe, preferences) *
        proteinFit(macrosPerPortion.get(recipe.id) ?? EMPTY_MACROS, targetProteinPerKcal),
      rng,
    );
    if (chosen) recent.push(chosen.id);
    return chosen;
  };

  const meals = activeMeals(profile.mealsPerDay);
  const snacks = snackCount(profile.mealsPerDay);

  for (const dayIndex of targetDays) {
    const day = emptyDay();

    for (const meal of meals) {
      const slotCount = meal === 'przekaska' ? snacks : 1;
      if (slotCount === 0) continue;

      const shareKcal = (dailyKcal * (profile.mealShare[meal] ?? 0)) / 100 / slotCount;

      for (let slot = 0; slot < slotCount; slot += 1) {
        const recipe = pick(meal);
        if (!recipe) continue;

        const perPortion = macrosPerPortion.get(recipe.id)?.kcal ?? 0;
        const portions =
          autoPortions && perPortion > 0 ? roundPortions(shareKcal / perPortion) : 1;

        day[meal].push(createEntry(recipe.id, portions));
      }
    }

    week[dayIndex] = day;
  }

  return week;
}

/**
 * Przeskalowuje wszystkie porcje dnia tak, by suma kalorii trafiła w cel.
 * Zwraca nowy plan dnia — oryginał zostaje nietknięty.
 */
export function scaleDayToTarget(
  day: DayPlan,
  targetKcal: number,
  recipeKcal: (recipeId: string) => number,
): DayPlan {
  const current = dayKcal(day, recipeKcal);
  if (current <= 0 || targetKcal <= 0) return day;

  const factor = targetKcal / current;
  const scaled = emptyDay();
  for (const meal of MEAL_ORDER) {
    scaled[meal] = day[meal].map((entry) => ({
      ...entry,
      portions: roundPortions(entry.portions * factor),
    }));
  }
  return scaled;
}

export function dayKcal(day: DayPlan, recipeKcal: (recipeId: string) => number): number {
  let total = 0;
  for (const meal of MEAL_ORDER) {
    for (const entry of day[meal]) {
      total += recipeKcal(entry.recipeId) * entry.portions;
    }
  }
  return total;
}
