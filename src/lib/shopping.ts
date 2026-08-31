import {
  CATEGORY_ORDER,
  MEAL_ORDER,
  type Category,
  type DayIndex,
  type ExtraItem,
  type Ingredient,
  type Recipe,
  type Unit,
  type WeekPlan,
} from '../types';
import { roundShoppingAmount } from './format';

export interface ShoppingItem {
  /** Klucz do odhaczania — stabilny między przeliczeniami listy. */
  key: string;
  name: string;
  /** Ilość już zaokrąglona do „kupowalnej”. */
  amount: number;
  /** Dokładna suma przed zaokrągleniem — przydaje się przy debugowaniu. */
  exactAmount: number;
  unit: Unit;
  category: Category;
  /** Przybliżona masa, gdy jednostka jest policzalna (np. „6 szt (~350 g)”). */
  approxGrams?: number;
  /** Nazwy przepisów, do których ten składnik jest potrzebny. */
  usedIn: string[];
  pantry: boolean;
  manual: boolean;
}

export interface ShoppingSection {
  category: Category;
  items: ShoppingItem[];
}

export interface BuildListOptions {
  plan: WeekPlan;
  days: DayIndex[];
  recipes: Map<string, Recipe>;
  ingredients: Map<string, Ingredient>;
  extras: ExtraItem[];
  /** Czy dołączać sól, pieprz i przyprawy, które zwykle są w domu. */
  includePantry: boolean;
}

export const EXTRA_KEY_PREFIX = 'extra:';

export function extraKey(id: string): string {
  return `${EXTRA_KEY_PREFIX}${id}`;
}

/**
 * Zbiera wszystkie składniki z wybranych dni planu, sumuje ilości
 * i grupuje je po kategoriach sklepowych.
 */
export function buildShoppingList(options: BuildListOptions): ShoppingSection[] {
  const { plan, days, recipes, ingredients, extras, includePantry } = options;

  const totals = new Map<string, { exact: number; usedIn: Set<string> }>();

  for (const dayIndex of days) {
    const day = plan[dayIndex];
    if (!day) continue;

    for (const meal of MEAL_ORDER) {
      for (const entry of day[meal]) {
        const recipe = recipes.get(entry.recipeId);
        if (!recipe) continue;

        for (const item of recipe.ingredients) {
          const ingredient = ingredients.get(item.ingredientId);
          if (!ingredient) continue;
          if (!includePantry && ingredient.pantry) continue;

          const current = totals.get(ingredient.id) ?? { exact: 0, usedIn: new Set<string>() };
          current.exact += item.amount * entry.portions;
          current.usedIn.add(recipe.name);
          totals.set(ingredient.id, current);
        }
      }
    }
  }

  const items: ShoppingItem[] = [];

  for (const [ingredientId, total] of totals) {
    const ingredient = ingredients.get(ingredientId);
    if (!ingredient || total.exact <= 0) continue;

    items.push({
      key: ingredientId,
      name: ingredient.name,
      amount: roundShoppingAmount(total.exact, ingredient.unit),
      exactAmount: total.exact,
      unit: ingredient.unit,
      category: ingredient.category,
      approxGrams: ingredient.approxGrams,
      usedIn: [...total.usedIn].sort((a, b) => a.localeCompare(b, 'pl')),
      pantry: ingredient.pantry === true,
      manual: false,
    });
  }

  for (const extra of extras) {
    items.push({
      key: extraKey(extra.id),
      name: extra.name,
      amount: extra.amount,
      exactAmount: extra.amount,
      unit: extra.unit,
      category: extra.category,
      usedIn: [],
      pantry: false,
      manual: true,
    });
  }

  const byCategory = new Map<Category, ShoppingItem[]>();
  for (const item of items) {
    const bucket = byCategory.get(item.category) ?? [];
    bucket.push(item);
    byCategory.set(item.category, bucket);
  }

  const sections: ShoppingSection[] = [];
  for (const category of CATEGORY_ORDER) {
    const bucket = byCategory.get(category);
    if (!bucket || bucket.length === 0) continue;
    bucket.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    sections.push({ category, items: bucket });
  }

  return sections;
}

export function countItems(sections: ShoppingSection[]): number {
  return sections.reduce((sum, section) => sum + section.items.length, 0);
}

export function countChecked(
  sections: ShoppingSection[],
  checked: Record<string, boolean>,
): number {
  return sections.reduce(
    (sum, section) => sum + section.items.filter((item) => checked[item.key]).length,
    0,
  );
}

/**
 * Usuwa z mapy odhaczeń klucze, których nie ma już na liście — inaczej
 * po przegenerowaniu planu wracałyby „duchy” odhaczonych pozycji.
 */
export function pruneChecked(
  checked: Record<string, boolean>,
  sections: ShoppingSection[],
): Record<string, boolean> {
  const valid = new Set<string>();
  for (const section of sections) {
    for (const item of section.items) valid.add(item.key);
  }

  const next: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(checked)) {
    if (value && valid.has(key)) next[key] = true;
  }
  return next;
}
