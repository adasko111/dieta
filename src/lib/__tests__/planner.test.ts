import { describe, expect, it } from 'vitest';
import { BASE_INGREDIENTS } from '../../data/ingredients';
import { BASE_RECIPES } from '../../data/recipes';
import { recipeMacros } from '../nutrition';
import {
  MAX_PORTIONS,
  MIN_PORTIONS,
  activeMeals,
  dayKcal,
  defaultMealShare,
  generateWeek,
  roundPortions,
  scaleDayToTarget,
  snackCount,
} from '../planner';
import { isIngredientAllowed } from '../preferences';
import { defaultPreferences, defaultProfile } from '../storage';
import { MEAL_ORDER, type Ingredient, type Preferences, type Profile } from '../../types';

const ingredients = new Map<string, Ingredient>(BASE_INGREDIENTS.map((item) => [item.id, item]));
const recipeKcal = (recipeId: string) => {
  const recipe = BASE_RECIPES.find((item) => item.id === recipeId);
  return recipe ? recipeMacros(recipe, ingredients).kcal : 0;
};

/** Deterministyczny generator, żeby testy nie migotały. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(profilePatch: Partial<Profile> = {}, prefsPatch: Partial<Preferences> = {}) {
  const profile: Profile = { ...defaultProfile(), ...profilePatch };
  const preferences: Preferences = { ...defaultPreferences(), ...prefsPatch };
  return { profile, preferences };
}

describe('porcje', () => {
  it('zaokrągla do ćwiartek', () => {
    expect(roundPortions(1.1)).toBe(1);
    expect(roundPortions(1.13)).toBe(1.25);
    expect(roundPortions(1.6)).toBe(1.5);
  });

  it('trzyma się granic', () => {
    expect(roundPortions(0.01)).toBe(MIN_PORTIONS);
    expect(roundPortions(99)).toBe(MAX_PORTIONS);
  });

  it('nie zostawia śmieci zmiennoprzecinkowych', () => {
    for (let i = 1; i <= 12; i += 1) {
      const value = roundPortions(i * 0.17);
      expect(Number.isInteger(value * 100)).toBe(true);
    }
  });
});

describe('liczba posiłków', () => {
  it('przelicza przekąski i aktywne sloty', () => {
    expect(snackCount(3)).toBe(0);
    expect(snackCount(4)).toBe(1);
    expect(snackCount(5)).toBe(2);
    expect(activeMeals(3)).toEqual(['sniadanie', 'obiad', 'kolacja']);
    expect(activeMeals(5)).toContain('przekaska');
  });

  it('rozkłada kalorie do stu procent', () => {
    for (const count of [3, 4, 5]) {
      const share = defaultMealShare(count);
      const sum = MEAL_ORDER.reduce((total, meal) => total + share[meal], 0);
      expect(sum, `posiłków: ${count}`).toBe(100);
    }
  });
});

describe('generowanie planu', () => {
  it('wypełnia wszystkie dni i sloty', () => {
    const { profile, preferences } = build({ mealsPerDay: 5 });
    const week = generateWeek({
      recipes: BASE_RECIPES,
      ingredients,
      profile,
      preferences,
      dailyKcal: 2200,
      rng: seeded(1),
    });

    expect(week).toHaveLength(7);
    for (const day of week) {
      expect(day.sniadanie).toHaveLength(1);
      expect(day.obiad).toHaveLength(1);
      expect(day.kolacja).toHaveLength(1);
      expect(day.przekaska).toHaveLength(2);
    }
  });

  it('pomija przekąski przy trzech posiłkach', () => {
    const { profile, preferences } = build({ mealsPerDay: 3 });
    const week = generateWeek({
      recipes: BASE_RECIPES,
      ingredients,
      profile,
      preferences,
      dailyKcal: 2000,
      rng: seeded(2),
    });

    for (const day of week) expect(day.przekaska).toHaveLength(0);
  });

  it('trafia w cel kaloryczny z dokładnością do 15%', () => {
    const { profile, preferences } = build({ mealsPerDay: 4 });
    const week = generateWeek({
      recipes: BASE_RECIPES,
      ingredients,
      profile,
      preferences,
      dailyKcal: 2200,
      rng: seeded(3),
    });

    for (const day of week) {
      const kcal = dayKcal(day, recipeKcal);
      expect(kcal).toBeGreaterThan(2200 * 0.85);
      expect(kcal).toBeLessThan(2200 * 1.15);
    }
  });

  it('nie używa wykluczonych składników', () => {
    const excluded = ['pieczarki', 'losos', 'twarog'];
    const { profile, preferences } = build({}, { excludedIngredientIds: excluded });
    const week = generateWeek({
      recipes: BASE_RECIPES,
      ingredients,
      profile,
      preferences,
      dailyKcal: 2200,
      rng: seeded(4),
    });

    for (const day of week) {
      for (const meal of MEAL_ORDER) {
        for (const entry of day[meal]) {
          const recipe = BASE_RECIPES.find((item) => item.id === entry.recipeId);
          const used = recipe?.ingredients.map((item) => item.ingredientId) ?? [];
          for (const id of excluded) expect(used, recipe?.name).not.toContain(id);
        }
      }
    }
  });

  it('respektuje dietę wegańską', () => {
    const { profile, preferences } = build({}, { diet: 'weganska' });
    const week = generateWeek({
      recipes: BASE_RECIPES,
      ingredients,
      profile,
      preferences,
      dailyKcal: 2000,
      rng: seeded(5),
    });

    for (const day of week) {
      for (const meal of MEAL_ORDER) {
        for (const entry of day[meal]) {
          const recipe = BASE_RECIPES.find((item) => item.id === entry.recipeId);
          for (const item of recipe?.ingredients ?? []) {
            const ingredient = ingredients.get(item.ingredientId);
            if (!ingredient) continue;
            expect(isIngredientAllowed(ingredient, 'weganska'), ingredient.name).toBe(true);
          }
        }
      }
    }
  });

  it('nie rusza dni spoza wskazanego zakresu', () => {
    const { profile, preferences } = build();
    const first = generateWeek({
      recipes: BASE_RECIPES,
      ingredients,
      profile,
      preferences,
      dailyKcal: 2000,
      rng: seeded(6),
    });

    const second = generateWeek({
      recipes: BASE_RECIPES,
      ingredients,
      profile,
      preferences,
      dailyKcal: 2000,
      days: [2],
      base: first,
      rng: seeded(7),
    });

    expect(second[0]).toEqual(first[0]);
    expect(second[6]).toEqual(first[6]);
    expect(second[2]).not.toEqual(first[2]);
  });

  it('nie powtarza tego samego przepisu dzień po dniu', () => {
    const { profile, preferences } = build({ mealsPerDay: 3 });
    const week = generateWeek({
      recipes: BASE_RECIPES,
      ingredients,
      profile,
      preferences,
      dailyKcal: 2200,
      rng: seeded(8),
    });

    for (let day = 1; day < week.length; day += 1) {
      for (const meal of ['sniadanie', 'obiad', 'kolacja'] as const) {
        const today = week[day][meal][0]?.recipeId;
        const yesterday = week[day - 1][meal][0]?.recipeId;
        expect(today, `dzień ${day}, ${meal}`).not.toBe(yesterday);
      }
    }
  });
});

describe('dopasowanie dnia do celu', () => {
  it('skaluje porcje w stronę celu', () => {
    const { profile, preferences } = build();
    const week = generateWeek({
      recipes: BASE_RECIPES,
      ingredients,
      profile,
      preferences,
      dailyKcal: 1600,
      autoPortions: false,
      rng: seeded(9),
    });

    const before = dayKcal(week[0], recipeKcal);
    const after = dayKcal(scaleDayToTarget(week[0], 2400, recipeKcal), recipeKcal);

    expect(Math.abs(after - 2400)).toBeLessThan(Math.abs(before - 2400));
  });

  it('zostawia pusty dzień w spokoju', () => {
    const empty = { sniadanie: [], obiad: [], kolacja: [], przekaska: [] };
    expect(scaleDayToTarget(empty, 2000, recipeKcal)).toEqual(empty);
  });
});
