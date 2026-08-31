import type { Ingredient } from '../types';

/**
 * Baza składników. Wartości odżywcze podane na 100 g / 100 ml dla jednostek
 * ciągłych, a dla jednostek policzalnych (szt, łyżka, ząbek) — na 1 jednostkę.
 * Węglowodany podajemy jako **przyswajalne** (bez błonnika) — dzięki temu
 * kalorie zgadzają się z sumą makroskładników. Liczby są zaokrąglonymi
 * wartościami tabelarycznymi; dla konkretnego produktu z półki warto
 * sprawdzić etykietę, ale do planowania diety w zupełności wystarczają.
 */
export const BASE_INGREDIENTS: Ingredient[] = [
  // ── Nabiał i jaja ────────────────────────────────────────────────────────
  { id: 'jajko', name: 'Jajko', unit: 'szt', category: 'nabial', kcal: 78, protein: 6.3, fat: 5.3, carbs: 0.6, approxGrams: 58 },
  { id: 'mleko', name: 'Mleko 2%', unit: 'ml', category: 'nabial', kcal: 51, protein: 3.4, fat: 2, carbs: 4.9 },
  { id: 'jogurt-naturalny', name: 'Jogurt naturalny', unit: 'g', category: 'nabial', kcal: 61, protein: 3.5, fat: 3.2, carbs: 4.7 },
  { id: 'jogurt-grecki', name: 'Jogurt grecki', unit: 'g', category: 'nabial', kcal: 97, protein: 9, fat: 5, carbs: 4 },
  { id: 'skyr', name: 'Skyr / jogurt wysokobiałkowy', unit: 'g', category: 'nabial', kcal: 63, protein: 11, fat: 0.2, carbs: 4 },
  { id: 'kefir', name: 'Kefir', unit: 'ml', category: 'nabial', kcal: 51, protein: 3.3, fat: 2, carbs: 4.7 },
  { id: 'twarog', name: 'Twaróg półtłusty', unit: 'g', category: 'nabial', kcal: 133, protein: 18, fat: 5, carbs: 3.5 },
  { id: 'serek-wiejski', name: 'Serek wiejski', unit: 'g', category: 'nabial', kcal: 98, protein: 12, fat: 4.3, carbs: 3.4 },
  { id: 'ser-zolty', name: 'Ser żółty', unit: 'g', category: 'nabial', kcal: 356, protein: 25, fat: 28, carbs: 1.3 },
  { id: 'feta', name: 'Ser feta', unit: 'g', category: 'nabial', kcal: 264, protein: 14, fat: 21, carbs: 4 },
  { id: 'mozzarella', name: 'Mozzarella', unit: 'g', category: 'nabial', kcal: 253, protein: 18, fat: 19, carbs: 2.2 },
  { id: 'parmezan', name: 'Parmezan', unit: 'g', category: 'nabial', kcal: 392, protein: 36, fat: 26, carbs: 3.2 },
  { id: 'maslo', name: 'Masło', unit: 'g', category: 'nabial', kcal: 735, protein: 0.7, fat: 82, carbs: 0.7 },
  { id: 'smietana-18', name: 'Śmietana 18%', unit: 'g', category: 'nabial', kcal: 184, protein: 2.6, fat: 18, carbs: 3.6 },
  { id: 'mleko-kokosowe', name: 'Mleko kokosowe', unit: 'ml', category: 'nabial', kcal: 197, protein: 2, fat: 20, carbs: 3 },

  // ── Mięso i wędliny ──────────────────────────────────────────────────────
  { id: 'piers-kurczaka', name: 'Pierś z kurczaka', unit: 'g', category: 'mieso', kcal: 108, protein: 21.5, fat: 1.3, carbs: 0 },
  { id: 'udko-kurczaka', name: 'Udko z kurczaka (bez skóry)', unit: 'g', category: 'mieso', kcal: 135, protein: 19, fat: 6.5, carbs: 0 },
  { id: 'piers-indyka', name: 'Pierś z indyka', unit: 'g', category: 'mieso', kcal: 111, protein: 22, fat: 1.8, carbs: 0 },
  { id: 'schab', name: 'Schab wieprzowy', unit: 'g', category: 'mieso', kcal: 137, protein: 21, fat: 5.7, carbs: 0 },
  { id: 'mielone-wolowe', name: 'Mielone wołowe', unit: 'g', category: 'mieso', kcal: 176, protein: 20, fat: 10, carbs: 0 },
  { id: 'szynka', name: 'Szynka z indyka', unit: 'g', category: 'mieso', kcal: 110, protein: 18, fat: 4, carbs: 1 },
  { id: 'boczek', name: 'Boczek wędzony', unit: 'g', category: 'mieso', kcal: 340, protein: 15, fat: 31, carbs: 0.5 },

  // ── Ryby ─────────────────────────────────────────────────────────────────
  { id: 'losos', name: 'Łosoś (filet)', unit: 'g', category: 'ryby', kcal: 208, protein: 20, fat: 13, carbs: 0 },
  { id: 'dorsz', name: 'Dorsz (filet)', unit: 'g', category: 'ryby', kcal: 82, protein: 18, fat: 0.7, carbs: 0 },
  { id: 'tunczyk', name: 'Tuńczyk w sosie własnym', unit: 'g', category: 'ryby', kcal: 116, protein: 26, fat: 1, carbs: 0 },
  { id: 'makrela', name: 'Makrela wędzona', unit: 'g', category: 'ryby', kcal: 305, protein: 19, fat: 25, carbs: 0 },

  // ── Warzywa ──────────────────────────────────────────────────────────────
  { id: 'pomidor', name: 'Pomidor', unit: 'g', category: 'warzywa', kcal: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
  { id: 'pomidory-koktajlowe', name: 'Pomidorki koktajlowe', unit: 'g', category: 'warzywa', kcal: 20, protein: 0.9, fat: 0.2, carbs: 4 },
  { id: 'pomidory-puszka', name: 'Pomidory krojone (puszka)', unit: 'g', category: 'inne', kcal: 32, protein: 1.6, fat: 0.3, carbs: 5 },
  { id: 'passata', name: 'Passata pomidorowa', unit: 'g', category: 'inne', kcal: 32, protein: 1.4, fat: 0.2, carbs: 5.5 },
  { id: 'ogorek', name: 'Ogórek', unit: 'g', category: 'warzywa', kcal: 15, protein: 0.7, fat: 0.1, carbs: 3.6 },
  { id: 'ogorek-kiszony', name: 'Ogórek kiszony', unit: 'g', category: 'warzywa', kcal: 12, protein: 0.6, fat: 0.1, carbs: 2.2 },
  { id: 'papryka', name: 'Papryka czerwona', unit: 'g', category: 'warzywa', kcal: 31, protein: 1, fat: 0.3, carbs: 6 },
  { id: 'cebula', name: 'Cebula', unit: 'g', category: 'warzywa', kcal: 40, protein: 1.1, fat: 0.1, carbs: 9.3 },
  { id: 'czosnek', name: 'Czosnek', unit: 'ząbek', category: 'warzywa', kcal: 4, protein: 0.2, fat: 0, carbs: 1, approxGrams: 3 },
  { id: 'marchew', name: 'Marchew', unit: 'g', category: 'warzywa', kcal: 41, protein: 0.9, fat: 0.2, carbs: 9.6 },
  { id: 'ziemniaki', name: 'Ziemniaki', unit: 'g', category: 'warzywa', kcal: 77, protein: 2, fat: 0.1, carbs: 17 },
  { id: 'batat', name: 'Batat', unit: 'g', category: 'warzywa', kcal: 86, protein: 1.6, fat: 0.1, carbs: 20 },
  { id: 'brokul', name: 'Brokuł', unit: 'g', category: 'warzywa', kcal: 34, protein: 2.8, fat: 0.4, carbs: 4 },
  { id: 'kalafior', name: 'Kalafior', unit: 'g', category: 'warzywa', kcal: 25, protein: 1.9, fat: 0.3, carbs: 3 },
  { id: 'cukinia', name: 'Cukinia', unit: 'g', category: 'warzywa', kcal: 17, protein: 1.2, fat: 0.3, carbs: 3.1 },
  { id: 'baklazan', name: 'Bakłażan', unit: 'g', category: 'warzywa', kcal: 25, protein: 1, fat: 0.2, carbs: 6 },
  { id: 'szpinak', name: 'Szpinak świeży', unit: 'g', category: 'warzywa', kcal: 23, protein: 2.9, fat: 0.4, carbs: 1.4 },
  { id: 'salata', name: 'Sałata', unit: 'g', category: 'warzywa', kcal: 15, protein: 1.4, fat: 0.2, carbs: 2.9 },
  { id: 'rukola', name: 'Rukola', unit: 'g', category: 'warzywa', kcal: 25, protein: 2.6, fat: 0.7, carbs: 2.1 },
  { id: 'pieczarki', name: 'Pieczarki', unit: 'g', category: 'warzywa', kcal: 22, protein: 3.1, fat: 0.3, carbs: 2.3 },
  { id: 'por', name: 'Por', unit: 'g', category: 'warzywa', kcal: 61, protein: 1.5, fat: 0.3, carbs: 14 },
  { id: 'seler-naciowy', name: 'Seler naciowy', unit: 'g', category: 'warzywa', kcal: 16, protein: 0.7, fat: 0.2, carbs: 3 },
  { id: 'burak', name: 'Burak', unit: 'g', category: 'warzywa', kcal: 43, protein: 1.6, fat: 0.2, carbs: 10 },
  { id: 'kapusta-kiszona', name: 'Kapusta kiszona', unit: 'g', category: 'warzywa', kcal: 19, protein: 1.1, fat: 0.2, carbs: 4 },
  { id: 'dynia', name: 'Dynia', unit: 'g', category: 'warzywa', kcal: 26, protein: 1, fat: 0.1, carbs: 6.5 },
  { id: 'rzodkiewka', name: 'Rzodkiewka', unit: 'g', category: 'warzywa', kcal: 16, protein: 0.7, fat: 0.1, carbs: 3.4 },
  { id: 'awokado', name: 'Awokado', unit: 'g', category: 'warzywa', kcal: 160, protein: 2, fat: 15, carbs: 2 },
  { id: 'szczypiorek', name: 'Szczypiorek', unit: 'pęczek', category: 'warzywa', kcal: 10, protein: 1, fat: 0.2, carbs: 1.2, approxGrams: 30 },
  { id: 'natka-pietruszki', name: 'Natka pietruszki', unit: 'pęczek', category: 'warzywa', kcal: 11, protein: 0.9, fat: 0.2, carbs: 2, approxGrams: 30 },
  { id: 'kukurydza', name: 'Kukurydza konserwowa', unit: 'g', category: 'inne', kcal: 86, protein: 3.2, fat: 1.2, carbs: 19 },
  { id: 'oliwki', name: 'Oliwki', unit: 'g', category: 'inne', kcal: 145, protein: 1, fat: 15, carbs: 3.8 },
  { id: 'pomidory-suszone', name: 'Pomidory suszone w oleju', unit: 'g', category: 'inne', kcal: 213, protein: 5, fat: 14, carbs: 15 },

  // ── Owoce ────────────────────────────────────────────────────────────────
  { id: 'banan', name: 'Banan', unit: 'szt', category: 'owoce', kcal: 105, protein: 1.3, fat: 0.4, carbs: 27, approxGrams: 120 },
  { id: 'jablko', name: 'Jabłko', unit: 'szt', category: 'owoce', kcal: 94, protein: 0.5, fat: 0.3, carbs: 25, approxGrams: 180 },
  { id: 'gruszka', name: 'Gruszka', unit: 'szt', category: 'owoce', kcal: 101, protein: 0.6, fat: 0.2, carbs: 27, approxGrams: 180 },
  { id: 'pomarancza', name: 'Pomarańcza', unit: 'szt', category: 'owoce', kcal: 62, protein: 1.2, fat: 0.2, carbs: 15, approxGrams: 150 },
  { id: 'cytryna', name: 'Cytryna', unit: 'szt', category: 'owoce', kcal: 17, protein: 0.6, fat: 0.2, carbs: 5.4, approxGrams: 60 },
  { id: 'truskawki', name: 'Truskawki', unit: 'g', category: 'owoce', kcal: 32, protein: 0.7, fat: 0.3, carbs: 7.7 },
  { id: 'maliny', name: 'Maliny', unit: 'g', category: 'owoce', kcal: 52, protein: 1.2, fat: 0.7, carbs: 12 },
  { id: 'borowki', name: 'Borówki', unit: 'g', category: 'owoce', kcal: 57, protein: 0.7, fat: 0.3, carbs: 14 },
  { id: 'owoce-lesne-mrozone', name: 'Owoce leśne mrożone', unit: 'g', category: 'mrozonki', kcal: 45, protein: 1, fat: 0.4, carbs: 9 },

  // ── Pieczywo ─────────────────────────────────────────────────────────────
  { id: 'chleb-zytni', name: 'Chleb żytni', unit: 'g', category: 'pieczywo', kcal: 250, protein: 8, fat: 1.5, carbs: 48 },
  { id: 'chleb-pelnoziarnisty', name: 'Chleb pełnoziarnisty', unit: 'g', category: 'pieczywo', kcal: 247, protein: 9, fat: 3.4, carbs: 41 },
  { id: 'bulka-grahamka', name: 'Bułka grahamka', unit: 'szt', category: 'pieczywo', kcal: 160, protein: 5.5, fat: 1.2, carbs: 31, approxGrams: 60 },
  { id: 'tortilla', name: 'Tortilla pełnoziarnista', unit: 'szt', category: 'pieczywo', kcal: 180, protein: 6, fat: 4, carbs: 29, approxGrams: 62 },

  // ── Produkty sypkie ──────────────────────────────────────────────────────
  { id: 'ryz-bialy', name: 'Ryż biały (suchy)', unit: 'g', category: 'sypkie', kcal: 349, protein: 7, fat: 0.7, carbs: 78 },
  { id: 'ryz-brazowy', name: 'Ryż brązowy (suchy)', unit: 'g', category: 'sypkie', kcal: 353, protein: 7.5, fat: 2.7, carbs: 72 },
  { id: 'makaron', name: 'Makaron (suchy)', unit: 'g', category: 'sypkie', kcal: 356, protein: 12, fat: 1.5, carbs: 71 },
  { id: 'makaron-pelnoziarnisty', name: 'Makaron pełnoziarnisty (suchy)', unit: 'g', category: 'sypkie', kcal: 340, protein: 13, fat: 2.5, carbs: 64 },
  { id: 'kasza-gryczana', name: 'Kasza gryczana (sucha)', unit: 'g', category: 'sypkie', kcal: 336, protein: 12.6, fat: 3.1, carbs: 62 },
  { id: 'kasza-jaglana', name: 'Kasza jaglana (sucha)', unit: 'g', category: 'sypkie', kcal: 346, protein: 10.5, fat: 3.9, carbs: 67 },
  { id: 'kuskus', name: 'Kasza kuskus (sucha)', unit: 'g', category: 'sypkie', kcal: 376, protein: 13, fat: 0.6, carbs: 77 },
  { id: 'platki-owsiane', name: 'Płatki owsiane', unit: 'g', category: 'sypkie', kcal: 366, protein: 12, fat: 7, carbs: 59 },
  { id: 'quinoa', name: 'Komosa ryżowa (sucha)', unit: 'g', category: 'sypkie', kcal: 368, protein: 14, fat: 6, carbs: 57 },
  { id: 'soczewica-czerwona', name: 'Soczewica czerwona (sucha)', unit: 'g', category: 'sypkie', kcal: 353, protein: 24, fat: 1.5, carbs: 45 },
  { id: 'ciecierzyca', name: 'Ciecierzyca (puszka)', unit: 'g', category: 'inne', kcal: 119, protein: 7.5, fat: 2.6, carbs: 11 },
  { id: 'fasola-czerwona', name: 'Fasola czerwona (puszka)', unit: 'g', category: 'inne', kcal: 91, protein: 6.5, fat: 0.5, carbs: 8 },
  { id: 'maka-pszenna', name: 'Mąka pszenna', unit: 'g', category: 'sypkie', kcal: 364, protein: 10, fat: 1, carbs: 76 },
  { id: 'bulka-tarta', name: 'Bułka tarta', unit: 'g', category: 'sypkie', kcal: 395, protein: 13, fat: 5, carbs: 72 },
  { id: 'orzechy-wloskie', name: 'Orzechy włoskie', unit: 'g', category: 'sypkie', kcal: 654, protein: 15, fat: 65, carbs: 7 },
  { id: 'migdaly', name: 'Migdały', unit: 'g', category: 'sypkie', kcal: 579, protein: 21, fat: 50, carbs: 9 },
  { id: 'nerkowce', name: 'Orzechy nerkowca', unit: 'g', category: 'sypkie', kcal: 553, protein: 18, fat: 44, carbs: 27 },
  { id: 'pestki-dyni', name: 'Pestki dyni', unit: 'g', category: 'sypkie', kcal: 559, protein: 30, fat: 49, carbs: 5 },
  { id: 'sloneczik', name: 'Słonecznik łuskany', unit: 'g', category: 'sypkie', kcal: 584, protein: 21, fat: 51, carbs: 11 },
  { id: 'siemie-lniane', name: 'Siemię lniane', unit: 'g', category: 'sypkie', kcal: 534, protein: 18, fat: 42, carbs: 2 },
  { id: 'chia', name: 'Nasiona chia', unit: 'g', category: 'sypkie', kcal: 486, protein: 17, fat: 31, carbs: 8 },
  { id: 'maslo-orzechowe', name: 'Masło orzechowe', unit: 'g', category: 'sypkie', kcal: 588, protein: 25, fat: 50, carbs: 14 },
  { id: 'miod', name: 'Miód', unit: 'g', category: 'inne', kcal: 304, protein: 0.3, fat: 0, carbs: 82 },
  { id: 'rodzynki', name: 'Rodzynki', unit: 'g', category: 'sypkie', kcal: 299, protein: 3, fat: 0.5, carbs: 79 },
  { id: 'kakao', name: 'Kakao gorzkie', unit: 'g', category: 'sypkie', kcal: 355, protein: 21, fat: 11, carbs: 14 },
  { id: 'czekolada-gorzka', name: 'Czekolada gorzka 70%', unit: 'g', category: 'inne', kcal: 546, protein: 8, fat: 31, carbs: 46 },
  { id: 'odzywka-bialkowa', name: 'Odżywka białkowa', unit: 'g', category: 'inne', kcal: 380, protein: 78, fat: 5, carbs: 8 },

  // ── Tłuszcze ─────────────────────────────────────────────────────────────
  { id: 'oliwa', name: 'Oliwa z oliwek', unit: 'łyżka', category: 'tluszcze', kcal: 88, protein: 0, fat: 10, carbs: 0, approxGrams: 10 },
  { id: 'olej-rzepakowy', name: 'Olej rzepakowy', unit: 'łyżka', category: 'tluszcze', kcal: 90, protein: 0, fat: 10, carbs: 0, approxGrams: 10 },

  // ── Mrożonki ─────────────────────────────────────────────────────────────
  { id: 'warzywa-mrozone', name: 'Mieszanka warzyw mrożona', unit: 'g', category: 'mrozonki', kcal: 45, protein: 2.5, fat: 0.4, carbs: 7 },
  { id: 'szpinak-mrozony', name: 'Szpinak mrożony', unit: 'g', category: 'mrozonki', kcal: 26, protein: 3, fat: 0.4, carbs: 2 },
  { id: 'fasolka-szparagowa', name: 'Fasolka szparagowa mrożona', unit: 'g', category: 'mrozonki', kcal: 31, protein: 1.8, fat: 0.1, carbs: 7 },

  // ── Przyprawy i dodatki ──────────────────────────────────────────────────
  { id: 'sol', name: 'Sól', unit: 'g', category: 'przyprawy', kcal: 0, protein: 0, fat: 0, carbs: 0, pantry: true },
  { id: 'pieprz', name: 'Pieprz czarny', unit: 'g', category: 'przyprawy', kcal: 0, protein: 0, fat: 0, carbs: 0, pantry: true },
  { id: 'papryka-slodka', name: 'Papryka słodka mielona', unit: 'łyżeczka', category: 'przyprawy', kcal: 6, protein: 0.3, fat: 0.3, carbs: 1, approxGrams: 2, pantry: true },
  { id: 'oregano', name: 'Oregano suszone', unit: 'łyżeczka', category: 'przyprawy', kcal: 3, protein: 0.1, fat: 0.1, carbs: 0.7, approxGrams: 1, pantry: true },
  { id: 'bazylia', name: 'Bazylia suszona', unit: 'łyżeczka', category: 'przyprawy', kcal: 3, protein: 0.2, fat: 0.1, carbs: 0.5, approxGrams: 1, pantry: true },
  { id: 'tymianek', name: 'Tymianek suszony', unit: 'łyżeczka', category: 'przyprawy', kcal: 3, protein: 0.1, fat: 0.1, carbs: 0.6, approxGrams: 1, pantry: true },
  { id: 'curry', name: 'Curry w proszku', unit: 'łyżeczka', category: 'przyprawy', kcal: 7, protein: 0.3, fat: 0.3, carbs: 1.2, approxGrams: 2, pantry: true },
  { id: 'cynamon', name: 'Cynamon', unit: 'łyżeczka', category: 'przyprawy', kcal: 6, protein: 0.1, fat: 0.1, carbs: 2, approxGrams: 2, pantry: true },
  { id: 'sos-sojowy', name: 'Sos sojowy', unit: 'łyżka', category: 'przyprawy', kcal: 8, protein: 1.3, fat: 0, carbs: 0.8, approxGrams: 15 },
  { id: 'musztarda', name: 'Musztarda', unit: 'łyżeczka', category: 'przyprawy', kcal: 3, protein: 0.2, fat: 0.2, carbs: 0.3, approxGrams: 5 },
  { id: 'koncentrat-pomidorowy', name: 'Koncentrat pomidorowy', unit: 'łyżka', category: 'przyprawy', kcal: 12, protein: 0.6, fat: 0.1, carbs: 2.5, approxGrams: 15 },
  { id: 'bulion-kostka', name: 'Kostka bulionowa', unit: 'szt', category: 'przyprawy', kcal: 20, protein: 0.5, fat: 1, carbs: 2, approxGrams: 10 },
  { id: 'pesto', name: 'Pesto bazyliowe', unit: 'g', category: 'przyprawy', kcal: 450, protein: 5, fat: 45, carbs: 5 },
];
