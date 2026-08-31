import {
  ACTIVITY_FACTOR,
  GOAL_DIRECTION,
  KCAL_PER_KG,
  MIN_KCAL,
  baseAmount,
  type Ingredient,
  type Macros,
  type Profile,
  type Recipe,
} from '../types';

export const EMPTY_MACROS: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

/**
 * Podstawowa przemiana materii wg wzoru Mifflina-St Jeora — obecnie
 * najczęściej rekomendowany wzór dla osób bez pomiaru składu ciała.
 */
export function bmr(profile: Profile): number {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return profile.sex === 'm' ? base + 5 : base - 161;
}

/** Całkowite dzienne zapotrzebowanie energetyczne (BMR × współczynnik aktywności). */
export function tdee(profile: Profile): number {
  return bmr(profile) * ACTIVITY_FACTOR[profile.activity];
}

/** Dzienna korekta kalorii wynikająca z celu i zakładanego tempa (kcal/dzień). */
export function dailyAdjustment(profile: Profile): number {
  const direction = GOAL_DIRECTION[profile.goal];
  if (direction === 0) return 0;
  return (direction * profile.paceKgPerWeek * KCAL_PER_KG) / 7;
}

export interface KcalTarget {
  bmr: number;
  tdee: number;
  adjustment: number;
  /** Wartość po korekcie, przed zastosowaniem dolnego limitu. */
  raw: number;
  /** Ostateczny cel — to jest liczba, do której planujemy posiłki. */
  kcal: number;
  /** `true`, gdy wynik został podniesiony do bezpiecznego minimum. */
  clamped: boolean;
  manual: boolean;
}

/** Wylicza dzienny cel kaloryczny z profilu (albo zwraca wartość wpisaną ręcznie). */
export function kcalTarget(profile: Profile): KcalTarget {
  const b = bmr(profile);
  const t = tdee(profile);
  const adjustment = dailyAdjustment(profile);
  const raw = t + adjustment;
  const floor = MIN_KCAL[profile.sex];

  if (!profile.autoKcal) {
    return {
      bmr: b,
      tdee: t,
      adjustment,
      raw,
      kcal: Math.round(profile.manualKcal),
      clamped: false,
      manual: true,
    };
  }

  const clamped = raw < floor;
  return {
    bmr: b,
    tdee: t,
    adjustment,
    raw,
    kcal: Math.round(clamped ? floor : raw),
    clamped,
    manual: false,
  };
}

/** Rozbija dzienną pulę kalorii na gramy makroskładników. */
export function macroTargets(kcal: number, profile: Profile): Macros {
  return {
    kcal,
    protein: (kcal * profile.proteinPct) / 100 / 4,
    fat: (kcal * profile.fatPct) / 100 / 9,
    carbs: (kcal * profile.carbsPct) / 100 / 4,
  };
}

/**
 * Domyślny rozkład makro dobrany do celu. Białko trzymamy wysoko przy
 * redukcji (sytość + ochrona mięśni), tłuszcz nie schodzi poniżej ~25%.
 */
export function suggestedMacroSplit(goal: Profile['goal']): {
  proteinPct: number;
  fatPct: number;
  carbsPct: number;
} {
  switch (goal) {
    case 'redukcja':
      return { proteinPct: 32, fatPct: 28, carbsPct: 40 };
    case 'masa':
      return { proteinPct: 25, fatPct: 25, carbsPct: 50 };
    default:
      return { proteinPct: 28, fatPct: 30, carbsPct: 42 };
  }
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    fat: a.fat + b.fat,
    carbs: a.carbs + b.carbs,
  };
}

export function scaleMacros(m: Macros, factor: number): Macros {
  return {
    kcal: m.kcal * factor,
    protein: m.protein * factor,
    fat: m.fat * factor,
    carbs: m.carbs * factor,
  };
}

/** Wartości odżywcze danej ilości składnika. */
export function ingredientMacros(ingredient: Ingredient, amount: number): Macros {
  const factor = amount / baseAmount(ingredient.unit);
  return {
    kcal: ingredient.kcal * factor,
    protein: ingredient.protein * factor,
    fat: ingredient.fat * factor,
    carbs: ingredient.carbs * factor,
  };
}

/** Wartości odżywcze jednej porcji przepisu. */
export function recipeMacros(recipe: Recipe, ingredients: Map<string, Ingredient>): Macros {
  let total = EMPTY_MACROS;
  for (const item of recipe.ingredients) {
    const ingredient = ingredients.get(item.ingredientId);
    if (!ingredient) continue;
    total = addMacros(total, ingredientMacros(ingredient, item.amount));
  }
  return total;
}

/** Procentowy udział makroskładnika w energii posiłku. */
export function macroEnergyShare(m: Macros): { protein: number; fat: number; carbs: number } {
  const fromMacros = m.protein * 4 + m.fat * 9 + m.carbs * 4;
  if (fromMacros <= 0) return { protein: 0, fat: 0, carbs: 0 };
  return {
    protein: (m.protein * 4 * 100) / fromMacros,
    fat: (m.fat * 9 * 100) / fromMacros,
    carbs: (m.carbs * 4 * 100) / fromMacros,
  };
}
