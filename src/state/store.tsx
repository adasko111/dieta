import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { BASE_INGREDIENTS } from '../data/ingredients';
import { BASE_RECIPES } from '../data/recipes';
import { EMPTY_MACROS, kcalTarget, macroTargets, recipeMacros } from '../lib/nutrition';
import { createEntry, emptyWeek } from '../lib/planner';
import { buildShoppingList, pruneChecked, type ShoppingSection } from '../lib/shopping';
import { defaultState, loadState, saveState } from '../lib/storage';
import {
  type AppState,
  type DayIndex,
  type ExtraItem,
  type Ingredient,
  type Macros,
  type MealType,
  type Preferences,
  type Profile,
  type Recipe,
  type WeekPlan,
} from '../types';

export type Action =
  | { type: 'patchProfile'; patch: Partial<Profile> }
  | { type: 'patchPreferences'; patch: Partial<Preferences> }
  | { type: 'finishOnboarding'; profile: Profile; preferences: Preferences }
  | { type: 'restartOnboarding' }
  | { type: 'setPlan'; plan: WeekPlan }
  | { type: 'addEntry'; day: DayIndex; meal: MealType; recipeId: string; portions: number }
  | { type: 'removeEntry'; day: DayIndex; meal: MealType; entryId: string }
  | { type: 'setPortions'; day: DayIndex; meal: MealType; entryId: string; portions: number }
  | { type: 'clearDay'; day: DayIndex }
  | { type: 'clearWeek' }
  | { type: 'toggleChecked'; key: string }
  | { type: 'setChecked'; keys: string[]; value: boolean }
  | { type: 'addExtra'; item: ExtraItem }
  | { type: 'removeExtra'; id: string }
  | { type: 'setShoppingDays'; days: DayIndex[] }
  | { type: 'saveRecipe'; recipe: Recipe }
  | { type: 'deleteRecipe'; id: string }
  | { type: 'saveIngredient'; ingredient: Ingredient }
  | { type: 'toggleLiked'; recipeId: string }
  | { type: 'toggleDisliked'; recipeId: string }
  | { type: 'replaceState'; state: AppState }
  | { type: 'reset' };

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'patchProfile':
      return { ...state, profile: { ...state.profile, ...action.patch } };

    case 'patchPreferences':
      return { ...state, preferences: { ...state.preferences, ...action.patch } };

    case 'finishOnboarding':
      return {
        ...state,
        onboarded: true,
        profile: action.profile,
        preferences: action.preferences,
      };

    case 'restartOnboarding':
      return { ...state, onboarded: false };

    case 'setPlan':
      return { ...state, plan: action.plan };

    case 'addEntry': {
      const plan = state.plan.map((day) => ({ ...day }));
      const target = plan[action.day];
      if (!target) return state;
      target[action.meal] = [...target[action.meal], createEntry(action.recipeId, action.portions)];
      return { ...state, plan };
    }

    case 'removeEntry': {
      const plan = state.plan.map((day) => ({ ...day }));
      const target = plan[action.day];
      if (!target) return state;
      target[action.meal] = target[action.meal].filter((entry) => entry.id !== action.entryId);
      return { ...state, plan };
    }

    case 'setPortions': {
      const plan = state.plan.map((day) => ({ ...day }));
      const target = plan[action.day];
      if (!target) return state;
      target[action.meal] = target[action.meal].map((entry) =>
        entry.id === action.entryId ? { ...entry, portions: action.portions } : entry,
      );
      return { ...state, plan };
    }

    case 'clearDay': {
      const plan = state.plan.map((day, index) =>
        index === action.day
          ? { sniadanie: [], obiad: [], kolacja: [], przekaska: [] }
          : day,
      );
      return { ...state, plan };
    }

    case 'clearWeek':
      return { ...state, plan: emptyWeek() };

    case 'toggleChecked': {
      const checked = { ...state.checked };
      if (checked[action.key]) delete checked[action.key];
      else checked[action.key] = true;
      return { ...state, checked };
    }

    case 'setChecked': {
      const checked = { ...state.checked };
      for (const key of action.keys) {
        if (action.value) checked[key] = true;
        else delete checked[key];
      }
      return { ...state, checked };
    }

    case 'addExtra':
      return { ...state, extras: [...state.extras, action.item] };

    case 'removeExtra': {
      const checked = { ...state.checked };
      delete checked[`extra:${action.id}`];
      return {
        ...state,
        extras: state.extras.filter((item) => item.id !== action.id),
        checked,
      };
    }

    case 'setShoppingDays':
      return { ...state, shoppingDays: action.days };

    case 'saveRecipe': {
      const exists = state.customRecipes.some((recipe) => recipe.id === action.recipe.id);
      const customRecipes = exists
        ? state.customRecipes.map((recipe) =>
            recipe.id === action.recipe.id ? action.recipe : recipe,
          )
        : [...state.customRecipes, action.recipe];
      return { ...state, customRecipes };
    }

    case 'deleteRecipe': {
      const isCustom = state.customRecipes.some((recipe) => recipe.id === action.id);
      return {
        ...state,
        customRecipes: isCustom
          ? state.customRecipes.filter((recipe) => recipe.id !== action.id)
          : state.customRecipes,
        // Bazowego przepisu nie da się usunąć — chowamy go, żeby dało się wrócić.
        hiddenRecipeIds: isCustom
          ? state.hiddenRecipeIds
          : toggleInList(state.hiddenRecipeIds, action.id),
        plan: state.plan.map((day) => ({
          sniadanie: day.sniadanie.filter((entry) => entry.recipeId !== action.id),
          obiad: day.obiad.filter((entry) => entry.recipeId !== action.id),
          kolacja: day.kolacja.filter((entry) => entry.recipeId !== action.id),
          przekaska: day.przekaska.filter((entry) => entry.recipeId !== action.id),
        })),
      };
    }

    case 'saveIngredient': {
      const exists = state.customIngredients.some((item) => item.id === action.ingredient.id);
      return {
        ...state,
        customIngredients: exists
          ? state.customIngredients.map((item) =>
              item.id === action.ingredient.id ? action.ingredient : item,
            )
          : [...state.customIngredients, action.ingredient],
      };
    }

    case 'toggleLiked':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          likedRecipeIds: toggleInList(state.preferences.likedRecipeIds, action.recipeId),
          dislikedRecipeIds: state.preferences.dislikedRecipeIds.filter(
            (id) => id !== action.recipeId,
          ),
        },
      };

    case 'toggleDisliked':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          dislikedRecipeIds: toggleInList(state.preferences.dislikedRecipeIds, action.recipeId),
          likedRecipeIds: state.preferences.likedRecipeIds.filter((id) => id !== action.recipeId),
        },
      };

    case 'replaceState':
      return action.state;

    case 'reset':
      return defaultState();

    default:
      return state;
  }
}

export interface Derived {
  ingredients: Map<string, Ingredient>;
  ingredientList: Ingredient[];
  recipes: Recipe[];
  recipeMap: Map<string, Recipe>;
  /** Kalorie jednej porcji, po id przepisu. */
  recipeKcal: (recipeId: string) => number;
  recipeMacrosOf: (recipeId: string) => Macros;
  target: ReturnType<typeof kcalTarget>;
  macros: Macros;
  shopping: ShoppingSection[];
}

interface Store {
  state: AppState;
  dispatch: (action: Action) => void;
  derived: Derived;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const derived = useMemo<Derived>(() => {
    // Wpisy użytkownika o tym samym id nadpisują bazowe, a nie dublują je.
    const customIngredientIds = new Set(state.customIngredients.map((item) => item.id));
    const ingredientList = [
      ...BASE_INGREDIENTS.filter((item) => !customIngredientIds.has(item.id)),
      ...state.customIngredients,
    ];
    const ingredients = new Map(ingredientList.map((item) => [item.id, item]));

    const hidden = new Set(state.hiddenRecipeIds);
    const customRecipeIds = new Set(state.customRecipes.map((recipe) => recipe.id));
    const recipes = [
      ...BASE_RECIPES.filter((recipe) => !hidden.has(recipe.id) && !customRecipeIds.has(recipe.id)),
      ...state.customRecipes,
    ];
    const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));

    const macroCache = new Map<string, Macros>();
    const recipeMacrosOf = (recipeId: string): Macros => {
      const cached = macroCache.get(recipeId);
      if (cached) return cached;
      const recipe = recipeMap.get(recipeId);
      const value = recipe ? recipeMacros(recipe, ingredients) : EMPTY_MACROS;
      macroCache.set(recipeId, value);
      return value;
    };

    const target = kcalTarget(state.profile);

    return {
      ingredients,
      ingredientList,
      recipes,
      recipeMap,
      recipeKcal: (recipeId: string) => recipeMacrosOf(recipeId).kcal,
      recipeMacrosOf,
      target,
      macros: macroTargets(target.kcal, state.profile),
      shopping: buildShoppingList({
        plan: state.plan,
        days: state.shoppingDays,
        recipes: recipeMap,
        ingredients,
        extras: state.extras,
        includePantry: false,
      }),
    };
  }, [
    state.customIngredients,
    state.customRecipes,
    state.hiddenRecipeIds,
    state.profile,
    state.plan,
    state.shoppingDays,
    state.extras,
  ]);

  // Po przegenerowaniu planu odhaczenia nieistniejących pozycji nie mają sensu.
  useEffect(() => {
    const pruned = pruneChecked(state.checked, derived.shopping);
    if (Object.keys(pruned).length !== Object.keys(state.checked).length) {
      dispatch({ type: 'replaceState', state: { ...state, checked: pruned } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived.shopping]);

  const value = useMemo(() => ({ state, dispatch, derived }), [state, derived]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore musi być użyte wewnątrz <StoreProvider>');
  return store;
}
