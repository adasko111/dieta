import {
  type AppState,
  type DayIndex,
  type Preferences,
  type Profile,
} from '../types';
import { defaultMealShare, emptyWeek } from './planner';
import { suggestedMacroSplit } from './nutrition';

export const STORAGE_KEY = 'dieta.state.v1';
export const STATE_VERSION = 1;

export function defaultProfile(): Profile {
  const goal: Profile['goal'] = 'redukcja';
  const split = suggestedMacroSplit(goal);
  return {
    sex: 'm',
    age: 30,
    heightCm: 178,
    weightKg: 80,
    activity: 'srednia',
    goal,
    paceKgPerWeek: 0.5,
    autoKcal: true,
    manualKcal: 2200,
    ...split,
    mealsPerDay: 4,
    mealShare: defaultMealShare(4),
  };
}

export function defaultPreferences(): Preferences {
  return {
    diet: 'wszystko',
    excludedIngredientIds: [],
    favoriteTags: [],
    maxPrepMinutes: null,
    likedRecipeIds: [],
    dislikedRecipeIds: [],
  };
}

export function defaultState(): AppState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    profile: defaultProfile(),
    preferences: defaultPreferences(),
    customRecipes: [],
    customIngredients: [],
    hiddenRecipeIds: [],
    plan: emptyWeek(),
    checked: {},
    extras: [],
    shoppingDays: [0, 1, 2, 3, 4, 5, 6],
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Scala wczytany stan z domyślnym. Dzięki temu dołożenie nowego pola
 * w kolejnej wersji aplikacji nie wywraca zapisanych danych.
 */
export function mergeState(raw: unknown): AppState {
  const base = defaultState();
  if (!isObject(raw)) return base;

  const plan = Array.isArray(raw.plan) && raw.plan.length === 7 ? (raw.plan as AppState['plan']) : base.plan;

  const shoppingDays = Array.isArray(raw.shoppingDays)
    ? (raw.shoppingDays.filter(
        (day): day is DayIndex => typeof day === 'number' && day >= 0 && day <= 6,
      ) as DayIndex[])
    : base.shoppingDays;

  return {
    version: STATE_VERSION,
    onboarded: raw.onboarded === true,
    profile: { ...base.profile, ...(isObject(raw.profile) ? raw.profile : {}) },
    preferences: { ...base.preferences, ...(isObject(raw.preferences) ? raw.preferences : {}) },
    customRecipes: Array.isArray(raw.customRecipes) ? (raw.customRecipes as AppState['customRecipes']) : [],
    customIngredients: Array.isArray(raw.customIngredients)
      ? (raw.customIngredients as AppState['customIngredients'])
      : [],
    hiddenRecipeIds: Array.isArray(raw.hiddenRecipeIds) ? (raw.hiddenRecipeIds as string[]) : [],
    plan,
    checked: isObject(raw.checked) ? (raw.checked as Record<string, boolean>) : {},
    extras: Array.isArray(raw.extras) ? (raw.extras as AppState['extras']) : [],
    shoppingDays: shoppingDays.length > 0 ? shoppingDays : base.shoppingDays,
  };
}

export function loadState(): AppState {
  if (typeof localStorage === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return mergeState(JSON.parse(raw));
  } catch {
    // Uszkodzony wpis nie powinien blokować uruchomienia aplikacji.
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Brak miejsca albo tryb prywatny — trudno, pracujemy dalej w pamięci.
  }
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string): AppState {
  return mergeState(JSON.parse(json));
}
