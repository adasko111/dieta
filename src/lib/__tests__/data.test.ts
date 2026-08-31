import { describe, expect, it } from 'vitest';
import { BASE_INGREDIENTS } from '../../data/ingredients';
import { BASE_RECIPES } from '../../data/recipes';
import { COMMON_DISLIKES } from '../preferences';
import { recipeMacros } from '../nutrition';
import { CATEGORY_ORDER, MEAL_ORDER, baseAmount } from '../../types';
import type { Ingredient } from '../../types';

const ingredients = new Map<string, Ingredient>(BASE_INGREDIENTS.map((item) => [item.id, item]));

describe('baza składników', () => {
  it('nie ma zduplikowanych identyfikatorów', () => {
    const ids = BASE_INGREDIENTS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('używa wyłącznie znanych kategorii', () => {
    for (const ingredient of BASE_INGREDIENTS) {
      expect(CATEGORY_ORDER).toContain(ingredient.category);
    }
  });

  it('ma nieujemne wartości odżywcze', () => {
    for (const ingredient of BASE_INGREDIENTS) {
      expect(ingredient.kcal, ingredient.name).toBeGreaterThanOrEqual(0);
      expect(ingredient.protein, ingredient.name).toBeGreaterThanOrEqual(0);
      expect(ingredient.fat, ingredient.name).toBeGreaterThanOrEqual(0);
      expect(ingredient.carbs, ingredient.name).toBeGreaterThanOrEqual(0);
    }
  });

  it('ma kalorie spójne z makroskładnikami', () => {
    for (const ingredient of BASE_INGREDIENTS) {
      if (ingredient.kcal < 20) continue;

      const fromMacros = ingredient.protein * 4 + ingredient.fat * 9 + ingredient.carbs * 4;
      const ratio = fromMacros / ingredient.kcal;
      const label = `${ingredient.name}: ${fromMacros.toFixed(1)} kcal z makro vs ${ingredient.kcal}`;

      // Granice są celowo niesymetryczne. Węglowodany trzymamy jako przyswajalne,
      // więc energia z błonnika (ok. 2 kcal/g) nie jest ujęta w makro — przy
      // nasionach i strączkach makro tłumaczy zauważalnie mniej niż deklarowane
      // kcal i to jest poprawne. Odwrotny rozjazd oznacza już realny błąd danych.
      expect(ratio, label).toBeGreaterThan(0.6);
      expect(ratio, label).toBeLessThan(1.25);
    }
  });

  it('podaje przybliżoną masę dla jednostek policzalnych', () => {
    for (const ingredient of BASE_INGREDIENTS) {
      if (baseAmount(ingredient.unit) === 1) {
        expect(ingredient.approxGrams, ingredient.name).toBeGreaterThan(0);
      }
    }
  });
});

describe('baza przepisów', () => {
  it('nie ma zduplikowanych identyfikatorów', () => {
    const ids = BASE_RECIPES.map((recipe) => recipe.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('odwołuje się wyłącznie do istniejących składników', () => {
    for (const recipe of BASE_RECIPES) {
      for (const item of recipe.ingredients) {
        expect(ingredients.has(item.ingredientId), `${recipe.name} → ${item.ingredientId}`).toBe(true);
      }
    }
  });

  it('ma nazwę, składniki, kroki i typ posiłku', () => {
    for (const recipe of BASE_RECIPES) {
      expect(recipe.name.length, recipe.id).toBeGreaterThan(2);
      expect(recipe.ingredients.length, recipe.name).toBeGreaterThan(0);
      expect(recipe.steps.length, recipe.name).toBeGreaterThan(0);
      expect(recipe.mealTypes.length, recipe.name).toBeGreaterThan(0);
      for (const meal of recipe.mealTypes) {
        expect(MEAL_ORDER).toContain(meal);
      }
    }
  });

  it('nie powtarza tego samego składnika w jednym przepisie', () => {
    for (const recipe of BASE_RECIPES) {
      const ids = recipe.ingredients.map((item) => item.ingredientId);
      expect(new Set(ids).size, recipe.name).toBe(ids.length);
    }
  });

  it('ma dodatnie ilości składników', () => {
    for (const recipe of BASE_RECIPES) {
      for (const item of recipe.ingredients) {
        expect(item.amount, `${recipe.name} → ${item.ingredientId}`).toBeGreaterThan(0);
      }
    }
  });

  it('mieści się w sensownej kaloryczności porcji', () => {
    for (const recipe of BASE_RECIPES) {
      const kcal = recipeMacros(recipe, ingredients).kcal;
      expect(kcal, recipe.name).toBeGreaterThan(80);
      expect(kcal, recipe.name).toBeLessThan(1200);
    }
  });

  it('pokrywa każdy typ posiłku co najmniej pięcioma przepisami', () => {
    for (const meal of MEAL_ORDER) {
      const count = BASE_RECIPES.filter((recipe) => recipe.mealTypes.includes(meal)).length;
      expect(count, meal).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('propozycje w kreatorze', () => {
  it('wskazują istniejące składniki', () => {
    for (const id of COMMON_DISLIKES) {
      expect(ingredients.has(id), id).toBe(true);
    }
  });
});
