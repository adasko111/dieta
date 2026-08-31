import type { Category, DietStyle, Ingredient, Preferences, Recipe } from '../types';

/** Kategorie składników wykluczane przez dany sposób odżywiania. */
const DIET_BLOCKED_CATEGORIES: Record<DietStyle, Category[]> = {
  wszystko: [],
  bez_ryb: ['ryby'],
  wegetarianska: ['mieso', 'ryby'],
  weganska: ['mieso', 'ryby', 'nabial'],
};

/** Produkty odzwierzęce, których nie da się rozpoznać po samej kategorii. */
const NON_VEGAN_IDS = new Set(['miod']);

export function isIngredientAllowed(ingredient: Ingredient, diet: DietStyle): boolean {
  if (DIET_BLOCKED_CATEGORIES[diet].includes(ingredient.category)) return false;
  if (diet === 'weganska' && NON_VEGAN_IDS.has(ingredient.id)) return false;
  return true;
}

export interface RecipeFilterResult {
  ok: boolean;
  /** Krótkie wyjaśnienie, dlaczego przepis odpadł — pokazywane w interfejsie. */
  reason?: string;
}

/**
 * Sprawdza, czy przepis pasuje do preferencji z kreatora. Zwraca też powód
 * odrzucenia, żeby dało się pokazać „ukryte przez preferencje: 6 przepisów”.
 */
export function checkRecipe(
  recipe: Recipe,
  prefs: Preferences,
  ingredients: Map<string, Ingredient>,
): RecipeFilterResult {
  if (prefs.dislikedRecipeIds.includes(recipe.id)) {
    return { ok: false, reason: 'oznaczony jako „nie dla mnie”' };
  }

  if (prefs.maxPrepMinutes !== null && recipe.prepMinutes > prefs.maxPrepMinutes) {
    return { ok: false, reason: `czas przygotowania ponad ${prefs.maxPrepMinutes} min` };
  }

  for (const item of recipe.ingredients) {
    const ingredient = ingredients.get(item.ingredientId);
    if (!ingredient) continue;

    if (prefs.excludedIngredientIds.includes(ingredient.id)) {
      return { ok: false, reason: `zawiera: ${ingredient.name.toLowerCase()}` };
    }
    if (!isIngredientAllowed(ingredient, prefs.diet)) {
      return { ok: false, reason: `nie pasuje do diety: ${ingredient.name.toLowerCase()}` };
    }
  }

  return { ok: true };
}

export function isRecipeAllowed(
  recipe: Recipe,
  prefs: Preferences,
  ingredients: Map<string, Ingredient>,
): boolean {
  return checkRecipe(recipe, prefs, ingredients).ok;
}

/**
 * Waga przepisu przy losowaniu planu. Ulubione i pasujące do lubianych tagów
 * trafiają do planu częściej, ale nie wypierają reszty całkowicie.
 */
export function recipeWeight(recipe: Recipe, prefs: Preferences): number {
  let weight = 1;
  if (prefs.likedRecipeIds.includes(recipe.id)) weight += 3;
  const matchingTags = recipe.tags.filter((tag) => prefs.favoriteTags.includes(tag)).length;
  weight += matchingTags;
  return weight;
}

/**
 * Składniki proponowane w kreatorze jako „czego nie lubię”. Wybrane spośród
 * tych, które faktycznie dzielą ludzi, a nie tych, które są wszędzie.
 */
export const COMMON_DISLIKES: string[] = [
  'pieczarki',
  'burak',
  'awokado',
  'oliwki',
  'twarog',
  'ciecierzyca',
  'soczewica-czerwona',
  'kapusta-kiszona',
  'ogorek-kiszony',
  'baklazan',
  'cukinia',
  'dynia',
  'kasza-gryczana',
  'kasza-jaglana',
  'makrela',
  'tunczyk',
  'dorsz',
  'losos',
  'feta',
  'mleko-kokosowe',
  'szpinak',
  'brokul',
  'kalafior',
  'seler-naciowy',
];

/** Tagi proponowane w kreatorze jako „co lubię”. */
export const PREFERENCE_TAGS: { tag: string; label: string }[] = [
  { tag: 'szybkie', label: 'Szybkie dania' },
  { tag: 'meal prep', label: 'Gotowanie na zapas' },
  { tag: 'jeden garnek', label: 'Jeden garnek / patelnia' },
  { tag: 'wysokobiałkowe', label: 'Dużo białka' },
  { tag: 'low carb', label: 'Mało węglowodanów' },
  { tag: 'bez gotowania', label: 'Bez gotowania' },
  { tag: 'piekarnik', label: 'Z piekarnika' },
  { tag: 'wegetariańskie', label: 'Bezmięsne' },
  { tag: 'zupa', label: 'Zupy' },
  { tag: 'klasyka', label: 'Klasyczne polskie' },
];
