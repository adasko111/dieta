/** Wspólny model danych aplikacji. */

/** Kategoria w sklepie — po niej grupowana jest lista zakupów. */
export type Category =
  | 'warzywa'
  | 'owoce'
  | 'nabial'
  | 'mieso'
  | 'ryby'
  | 'pieczywo'
  | 'sypkie'
  | 'tluszcze'
  | 'przyprawy'
  | 'mrozonki'
  | 'napoje'
  | 'inne';

export const CATEGORY_LABEL: Record<Category, string> = {
  warzywa: 'Warzywa',
  owoce: 'Owoce',
  nabial: 'Nabiał i jaja',
  mieso: 'Mięso i wędliny',
  ryby: 'Ryby',
  pieczywo: 'Pieczywo',
  sypkie: 'Produkty sypkie',
  tluszcze: 'Tłuszcze',
  przyprawy: 'Przyprawy i dodatki',
  mrozonki: 'Mrożonki',
  napoje: 'Napoje',
  inne: 'Inne',
};

/** Kolejność sekcji na liście zakupów — mniej więcej trasa przez sklep. */
export const CATEGORY_ORDER: Category[] = [
  'warzywa',
  'owoce',
  'nabial',
  'mieso',
  'ryby',
  'pieczywo',
  'sypkie',
  'tluszcze',
  'przyprawy',
  'mrozonki',
  'napoje',
  'inne',
];

/**
 * Jednostka składnika. `g` i `ml` są ciągłe (wartości odżywcze podajemy
 * na 100), pozostałe są policzalne (wartości na 1 sztukę/łyżkę/ząbek).
 */
export type Unit = 'g' | 'ml' | 'szt' | 'łyżka' | 'łyżeczka' | 'ząbek' | 'garść' | 'pęczek';

export const CONTINUOUS_UNITS: Unit[] = ['g', 'ml'];

export function isContinuous(unit: Unit): boolean {
  return CONTINUOUS_UNITS.includes(unit);
}

/** Ilość, do której odnoszą się wartości odżywcze składnika. */
export function baseAmount(unit: Unit): number {
  return isContinuous(unit) ? 100 : 1;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  category: Category;
  /** Wartości odżywcze na `baseAmount(unit)` jednostek. */
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  /**
   * Przybliżona masa (lub objętość) jednej sztuki/łyżki/ząbka — używana tylko
   * do podpowiedzi na liście zakupów, np. „6 szt (~350 g)”.
   */
  approxGrams?: number;
  /**
   * Produkty, których nie warto dopisywać do listy zakupów
   * (woda, sól, pieprz — zwykle są w domu).
   */
  pantry?: boolean;
}

export type MealType = 'sniadanie' | 'obiad' | 'kolacja' | 'przekaska';

export const MEAL_LABEL: Record<MealType, string> = {
  sniadanie: 'Śniadanie',
  obiad: 'Obiad',
  kolacja: 'Kolacja',
  przekaska: 'Przekąska',
};

export const MEAL_ORDER: MealType[] = ['sniadanie', 'obiad', 'kolacja', 'przekaska'];

/** Biernik — do zdań w rodzaju „Dodaj kolację”. */
export const MEAL_LABEL_ACC: Record<MealType, string> = {
  sniadanie: 'śniadanie',
  obiad: 'obiad',
  kolacja: 'kolację',
  przekaska: 'przekąskę',
};

export interface RecipeIngredient {
  ingredientId: string;
  /** Ilość na jedną porcję przepisu, w jednostce składnika. */
  amount: number;
}

export interface Recipe {
  id: string;
  name: string;
  mealTypes: MealType[];
  /** Ile porcji wychodzi z podanych ilości — ilości są już „na porcję”. */
  prepMinutes: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  /** Przepis dodany przez użytkownika (można go usunąć/edytować bez ograniczeń). */
  custom?: boolean;
}

export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export type Sex = 'k' | 'm';

/** Współczynniki aktywności fizycznej (PAL). */
export type ActivityLevel = 'niska' | 'lekka' | 'srednia' | 'wysoka' | 'bardzo_wysoka';

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  niska: 1.2,
  lekka: 1.375,
  srednia: 1.55,
  wysoka: 1.725,
  bardzo_wysoka: 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  niska: 'Siedzący tryb życia (brak treningów)',
  lekka: 'Lekka aktywność (1–3 treningi w tygodniu)',
  srednia: 'Średnia aktywność (3–5 treningów)',
  wysoka: 'Wysoka aktywność (6–7 treningów)',
  bardzo_wysoka: 'Bardzo wysoka (praca fizyczna / 2 treningi dziennie)',
};

export type Goal = 'redukcja' | 'utrzymanie' | 'masa';

export const GOAL_LABEL: Record<Goal, string> = {
  redukcja: 'Redukcja (chudnięcie)',
  utrzymanie: 'Utrzymanie wagi',
  masa: 'Budowa masy',
};

/** Kierunek korekty kalorii względem zapotrzebowania. */
export const GOAL_DIRECTION: Record<Goal, number> = {
  redukcja: -1,
  utrzymanie: 0,
  masa: 1,
};

/** Przyjmuje się, że 1 kg tkanki tłuszczowej to ok. 7700 kcal. */
export const KCAL_PER_KG = 7700;

/** Dolne granice bezpieczeństwa dla dziennej puli kalorii. */
export const MIN_KCAL: Record<Sex, number> = { k: 1200, m: 1500 };

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  /** Zakładane tempo zmiany masy ciała w kg na tydzień (0 przy utrzymaniu). */
  paceKgPerWeek: number;
  /**
   * Gdy `true`, dzienny cel kaloryczny liczony jest z profilu.
   * Gdy `false`, używana jest ręcznie wpisana wartość `manualKcal`.
   */
  autoKcal: boolean;
  manualKcal: number;
  /** Rozkład makroskładników w procentach energii; suma powinna dawać 100. */
  proteinPct: number;
  fatPct: number;
  carbsPct: number;
  /** Liczba posiłków dziennie (3–5). Powyżej 3 dochodzą przekąski. */
  mealsPerDay: number;
  /** Udział poszczególnych posiłków w dziennej puli kalorii (w procentach). */
  mealShare: Record<MealType, number>;
}

/** Sposób odżywiania wybrany w kreatorze. */
export type DietStyle = 'wszystko' | 'bez_ryb' | 'wegetarianska' | 'weganska';

export const DIET_LABEL: Record<DietStyle, string> = {
  wszystko: 'Jem wszystko',
  bez_ryb: 'Bez ryb i owoców morza',
  wegetarianska: 'Wegetariańska (bez mięsa i ryb)',
  weganska: 'Wegańska (bez produktów odzwierzęcych)',
};

/** Preferencje smakowe — zbierane w kreatorze, używane przy filtrowaniu i losowaniu. */
export interface Preferences {
  diet: DietStyle;
  /** Składniki, których nie chcę jeść — przepisy z nimi są odfiltrowywane. */
  excludedIngredientIds: string[];
  /** Tagi, które lubię — przepisy z nimi są podbijane przy generowaniu planu. */
  favoriteTags: string[];
  /** Maksymalny czas przygotowania w minutach; `null` = bez ograniczeń. */
  maxPrepMinutes: number | null;
  /** Przepisy oznaczone gwiazdką. */
  likedRecipeIds: string[];
  /** Przepisy odrzucone („nie dla mnie”) — nie pojawią się w losowaniu. */
  dislikedRecipeIds: string[];
}

/** Jeden posiłek w planie. */
export interface PlanEntry {
  id: string;
  recipeId: string;
  /** Mnożnik porcji — 1 = jedna porcja przepisu. */
  portions: number;
}

/** Plan tygodnia: 7 dni × sloty posiłków. */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES = [
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela',
] as const;

export const DAY_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'] as const;

export type DayPlan = Record<MealType, PlanEntry[]>;

export type WeekPlan = DayPlan[];

/** Pozycja dopisana ręcznie do listy zakupów. */
export interface ExtraItem {
  id: string;
  name: string;
  amount: number;
  unit: Unit;
  category: Category;
}

export interface AppState {
  version: number;
  /** Czy kreator startowy został ukończony. */
  onboarded: boolean;
  profile: Profile;
  preferences: Preferences;
  /** Przepisy dodane przez użytkownika (bazowe siedzą w `data/recipes.ts`). */
  customRecipes: Recipe[];
  /** Składniki dodane przez użytkownika. */
  customIngredients: Ingredient[];
  /** Id bazowych przepisów ukrytych przez użytkownika. */
  hiddenRecipeIds: string[];
  plan: WeekPlan;
  /** Odhaczone pozycje listy zakupów (klucz: id składnika lub `extra:<id>`). */
  checked: Record<string, boolean>;
  extras: ExtraItem[];
  /** Dni brane pod uwagę przy generowaniu listy zakupów. */
  shoppingDays: DayIndex[];
}
