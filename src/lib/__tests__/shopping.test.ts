import { describe, expect, it } from 'vitest';
import { roundShoppingAmount } from '../format';
import {
  buildShoppingList,
  countChecked,
  countItems,
  extraKey,
  pruneChecked,
} from '../shopping';
import { createEntry, emptyWeek } from '../planner';
import type { DayIndex, ExtraItem, Ingredient, Recipe, WeekPlan } from '../../types';

const ingredients = new Map<string, Ingredient>([
  ['kurczak', { id: 'kurczak', name: 'Kurczak', unit: 'g', category: 'mieso', kcal: 108, protein: 21, fat: 1, carbs: 0 }],
  ['ryz', { id: 'ryz', name: 'Ryż', unit: 'g', category: 'sypkie', kcal: 349, protein: 7, fat: 1, carbs: 78 }],
  ['jajko', { id: 'jajko', name: 'Jajko', unit: 'szt', category: 'nabial', kcal: 78, protein: 6, fat: 5, carbs: 1, approxGrams: 58 }],
  ['sol', { id: 'sol', name: 'Sól', unit: 'g', category: 'przyprawy', kcal: 0, protein: 0, fat: 0, carbs: 0, pantry: true }],
]);

const obiad: Recipe = {
  id: 'obiad',
  name: 'Kurczak z ryżem',
  mealTypes: ['obiad'],
  prepMinutes: 20,
  ingredients: [
    { ingredientId: 'kurczak', amount: 150 },
    { ingredientId: 'ryz', amount: 60 },
    { ingredientId: 'sol', amount: 1 },
  ],
  steps: ['Ugotuj.'],
  tags: [],
};

const sniadanie: Recipe = {
  id: 'sniadanie',
  name: 'Jajecznica',
  mealTypes: ['sniadanie'],
  prepMinutes: 10,
  ingredients: [{ ingredientId: 'jajko', amount: 3 }],
  steps: ['Usmaż.'],
  tags: [],
};

const recipes = new Map<string, Recipe>([
  [obiad.id, obiad],
  [sniadanie.id, sniadanie],
]);

function planWith(days: { day: DayIndex; recipeId: string; portions: number }[]): WeekPlan {
  const plan = emptyWeek();
  for (const { day, recipeId, portions } of days) {
    const meal = recipeId === 'sniadanie' ? 'sniadanie' : 'obiad';
    plan[day][meal].push(createEntry(recipeId, portions));
  }
  return plan;
}

function build(plan: WeekPlan, days: DayIndex[], extras: ExtraItem[] = [], includePantry = false) {
  return buildShoppingList({ plan, days, recipes, ingredients, extras, includePantry });
}

function findItem(sections: ReturnType<typeof build>, key: string) {
  return sections.flatMap((section) => section.items).find((item) => item.key === key);
}

describe('zaokrąglanie do zakupów', () => {
  it('zaokrągla gramy do pełnych piątek powyżej 100', () => {
    expect(roundShoppingAmount(312, 'g')).toBe(310);
    expect(roundShoppingAmount(313, 'g')).toBe(315);
  });

  it('zostawia dokładność do grama poniżej 100', () => {
    expect(roundShoppingAmount(42.4, 'g')).toBe(42);
    expect(roundShoppingAmount(0.2, 'g')).toBe(1);
  });

  it('zaokrągla sztuki w górę — pół jajka się nie kupi', () => {
    expect(roundShoppingAmount(2.1, 'szt')).toBe(3);
    expect(roundShoppingAmount(3, 'szt')).toBe(3);
  });
});

describe('budowanie listy', () => {
  it('sumuje ten sam składnik z różnych dni i porcji', () => {
    const plan = planWith([
      { day: 0, recipeId: 'obiad', portions: 1 },
      { day: 1, recipeId: 'obiad', portions: 2 },
    ]);

    const kurczak = findItem(build(plan, [0, 1]), 'kurczak');
    expect(kurczak?.exactAmount).toBe(150 * 3);
    expect(kurczak?.amount).toBe(450);
  });

  it('liczy tylko wskazane dni', () => {
    const plan = planWith([
      { day: 0, recipeId: 'obiad', portions: 1 },
      { day: 3, recipeId: 'obiad', portions: 1 },
    ]);

    expect(findItem(build(plan, [0]), 'kurczak')?.exactAmount).toBe(150);
    expect(findItem(build(plan, [0, 3]), 'kurczak')?.exactAmount).toBe(300);
  });

  it('uwzględnia ułamkowe porcje', () => {
    const plan = planWith([{ day: 0, recipeId: 'obiad', portions: 1.5 }]);
    expect(findItem(build(plan, [0]), 'ryz')?.exactAmount).toBe(90);
  });

  it('pomija produkty domowe, dopóki nie poprosimy', () => {
    const plan = planWith([{ day: 0, recipeId: 'obiad', portions: 1 }]);

    expect(findItem(build(plan, [0]), 'sol')).toBeUndefined();
    expect(findItem(build(plan, [0], [], true), 'sol')).toBeDefined();
  });

  it('grupuje po kategoriach w kolejności sklepowej', () => {
    const plan = planWith([
      { day: 0, recipeId: 'obiad', portions: 1 },
      { day: 0, recipeId: 'sniadanie', portions: 1 },
    ]);

    const categories = build(plan, [0]).map((section) => section.category);
    expect(categories).toEqual(['nabial', 'mieso', 'sypkie']);
  });

  it('zapisuje, do których przepisów potrzebny jest składnik', () => {
    const plan = planWith([
      { day: 0, recipeId: 'obiad', portions: 1 },
      { day: 1, recipeId: 'obiad', portions: 1 },
    ]);

    expect(findItem(build(plan, [0, 1]), 'kurczak')?.usedIn).toEqual(['Kurczak z ryżem']);
  });

  it('dokłada pozycje dopisane ręcznie', () => {
    const extra: ExtraItem = {
      id: 'a1',
      name: 'Folia aluminiowa',
      amount: 1,
      unit: 'szt',
      category: 'inne',
    };

    const item = findItem(build(emptyWeek(), [0], [extra]), extraKey('a1'));
    expect(item?.name).toBe('Folia aluminiowa');
    expect(item?.manual).toBe(true);
  });

  it('nie zwraca pustych sekcji dla pustego planu', () => {
    expect(build(emptyWeek(), [0, 1, 2])).toEqual([]);
  });
});

describe('odhaczanie', () => {
  it('liczy pozycje i odhaczenia', () => {
    const plan = planWith([
      { day: 0, recipeId: 'obiad', portions: 1 },
      { day: 0, recipeId: 'sniadanie', portions: 1 },
    ]);
    const sections = build(plan, [0]);

    expect(countItems(sections)).toBe(3);
    expect(countChecked(sections, { kurczak: true, ryz: true })).toBe(2);
  });

  it('usuwa odhaczenia pozycji, których już nie ma na liście', () => {
    const plan = planWith([{ day: 0, recipeId: 'obiad', portions: 1 }]);
    const sections = build(plan, [0]);

    const pruned = pruneChecked({ kurczak: true, jajko: true }, sections);
    expect(pruned).toEqual({ kurczak: true });
  });

  it('nie przechowuje odznaczonych pozycji', () => {
    const plan = planWith([{ day: 0, recipeId: 'obiad', portions: 1 }]);
    const pruned = pruneChecked({ kurczak: false, ryz: true }, build(plan, [0]));

    expect(pruned).toEqual({ ryz: true });
  });
});
