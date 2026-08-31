import type { Unit } from '../types';

/** Zaokrągla do zadanej liczby miejsc po przecinku (bez śmieci zmiennoprzecinkowych). */
export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Zaokrągla ilość na liście zakupów do wartości, którą da się kupić: gramy
 * i mililitry do pełnych 5 powyżej 100, a rzeczy policzalne w górę do całości
 * — pół jajka ani 10,3 ząbka czosnku nikt w sklepie nie dostanie.
 */
export function roundShoppingAmount(amount: number, unit: Unit): number {
  if (unit === 'g' || unit === 'ml') {
    if (amount >= 100) return Math.round(amount / 5) * 5;
    return Math.max(1, Math.round(amount));
  }
  return Math.ceil(round(amount, 2));
}

/** Liczba bez zbędnych zer po przecinku: 1.5 → „1,5”, 2.0 → „2”. */
export function formatNumber(value: number, maxDecimals = 1): string {
  const rounded = round(value, maxDecimals);
  return rounded.toLocaleString('pl-PL', { maximumFractionDigits: maxDecimals });
}

/**
 * Formy odmiany jednostek: pojedyncza, „2–4”, „5+” oraz dopełniacz używany
 * przy ułamkach („1,5 łyżki”, „0,5 ząbka”).
 */
const UNIT_FORMS: Record<Unit, { one: string; few: string; many: string; fraction: string }> = {
  g: { one: 'g', few: 'g', many: 'g', fraction: 'g' },
  ml: { one: 'ml', few: 'ml', many: 'ml', fraction: 'ml' },
  szt: { one: 'szt', few: 'szt', many: 'szt', fraction: 'szt' },
  'łyżka': { one: 'łyżka', few: 'łyżki', many: 'łyżek', fraction: 'łyżki' },
  'łyżeczka': { one: 'łyżeczka', few: 'łyżeczki', many: 'łyżeczek', fraction: 'łyżeczki' },
  'ząbek': { one: 'ząbek', few: 'ząbki', many: 'ząbków', fraction: 'ząbka' },
  'garść': { one: 'garść', few: 'garście', many: 'garści', fraction: 'garści' },
  'pęczek': { one: 'pęczek', few: 'pęczki', many: 'pęczków', fraction: 'pęczka' },
};

/** Dobiera formę jednostki do liczby zgodnie z polską odmianą. */
export function unitLabel(amount: number, unit: Unit): string {
  const forms = UNIT_FORMS[unit];
  if (!Number.isInteger(amount)) return forms.fraction;
  if (amount === 1) return forms.one;

  const lastTwo = Math.abs(amount) % 100;
  const last = Math.abs(amount) % 10;
  // 12, 13, 14 idą do formy „wielu”, mimo że kończą się na 2–4.
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms.few;
  return forms.many;
}

export function formatAmount(amount: number, unit: Unit): string {
  // Powyżej kilograma/litra czyta się to znacznie lepiej w większej jednostce.
  if (unit === 'g' && amount >= 1000) return `${formatNumber(amount / 1000, 2)} kg`;
  if (unit === 'ml' && amount >= 1000) return `${formatNumber(amount / 1000, 2)} l`;

  const decimals = unit === 'g' || unit === 'ml' ? 0 : 2;
  return `${formatNumber(amount, decimals)} ${unitLabel(amount, unit)}`;
}

export function formatKcal(kcal: number): string {
  return `${Math.round(kcal)} kcal`;
}

export function formatGrams(grams: number): string {
  return `${formatNumber(grams, 1)} g`;
}

/** „1 porcja”, „1,5 porcji”, „2 porcje” — polska odmiana. */
export function formatPortions(portions: number): string {
  const text = formatNumber(portions, 2);
  if (portions === 1) return '1 porcja';
  const isWhole = Number.isInteger(portions);
  if (isWhole && portions >= 2 && portions <= 4) return `${text} porcje`;
  return `${text} porcji`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
