import { describe, expect, it } from 'vitest';
import { bmr, kcalTarget, macroEnergyShare, macroTargets, recipeMacros, tdee } from '../nutrition';
import { defaultProfile } from '../storage';
import { BASE_INGREDIENTS } from '../../data/ingredients';
import type { Ingredient, Profile, Recipe } from '../../types';

const ingredients = new Map<string, Ingredient>(BASE_INGREDIENTS.map((item) => [item.id, item]));

function profileOf(patch: Partial<Profile>): Profile {
  return { ...defaultProfile(), ...patch };
}

describe('przemiana materii', () => {
  it('liczy BMR wzorem Mifflina-St Jeora dla mężczyzny', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    const value = bmr(profileOf({ sex: 'm', weightKg: 80, heightCm: 180, age: 30 }));
    expect(value).toBeCloseTo(1780, 5);
  });

  it('liczy BMR dla kobiety (stała -161)', () => {
    // 10*65 + 6.25*168 - 5*30 - 161 = 1389
    const value = bmr(profileOf({ sex: 'k', weightKg: 65, heightCm: 168, age: 30 }));
    expect(value).toBeCloseTo(1389, 5);
  });

  it('mnoży BMR przez współczynnik aktywności', () => {
    const profile = profileOf({ sex: 'm', weightKg: 80, heightCm: 180, age: 30, activity: 'srednia' });
    expect(tdee(profile)).toBeCloseTo(1780 * 1.55, 5);
  });
});

describe('cel kaloryczny', () => {
  it('odejmuje deficyt wynikający z tempa chudnięcia', () => {
    const profile = profileOf({
      sex: 'm',
      weightKg: 80,
      heightCm: 180,
      age: 30,
      activity: 'srednia',
      goal: 'redukcja',
      paceKgPerWeek: 0.5,
    });
    const target = kcalTarget(profile);

    // 0,5 kg/tydzień = 0,5 * 7700 / 7 = 550 kcal deficytu dziennie
    expect(target.adjustment).toBeCloseTo(-550, 5);
    expect(target.kcal).toBe(Math.round(1780 * 1.55 - 550));
    expect(target.clamped).toBe(false);
  });

  it('dodaje nadwyżkę przy budowie masy', () => {
    const target = kcalTarget(profileOf({ goal: 'masa', paceKgPerWeek: 0.25 }));
    expect(target.adjustment).toBeGreaterThan(0);
    expect(target.kcal).toBeGreaterThan(Math.round(target.tdee));
  });

  it('nie schodzi poniżej bezpiecznego minimum', () => {
    const profile = profileOf({
      sex: 'k',
      weightKg: 50,
      heightCm: 155,
      age: 60,
      activity: 'niska',
      goal: 'redukcja',
      paceKgPerWeek: 1,
    });
    const target = kcalTarget(profile);

    expect(target.raw).toBeLessThan(1200);
    expect(target.clamped).toBe(true);
    expect(target.kcal).toBe(1200);
  });

  it('respektuje ręcznie wpisaną wartość', () => {
    const target = kcalTarget(profileOf({ autoKcal: false, manualKcal: 1850 }));
    expect(target.manual).toBe(true);
    expect(target.kcal).toBe(1850);
  });
});

describe('makroskładniki', () => {
  it('rozbija kalorie na gramy według przeliczników 4/9/4', () => {
    const profile = profileOf({ proteinPct: 30, fatPct: 30, carbsPct: 40 });
    const macros = macroTargets(2000, profile);

    expect(macros.protein).toBeCloseTo((2000 * 0.3) / 4, 5);
    expect(macros.fat).toBeCloseTo((2000 * 0.3) / 9, 5);
    expect(macros.carbs).toBeCloseTo((2000 * 0.4) / 4, 5);
  });

  it('wraca do tych samych procentów przy liczeniu udziału energii', () => {
    const profile = profileOf({ proteinPct: 30, fatPct: 30, carbsPct: 40 });
    const share = macroEnergyShare(macroTargets(2000, profile));

    expect(share.protein).toBeCloseTo(30, 5);
    expect(share.fat).toBeCloseTo(30, 5);
    expect(share.carbs).toBeCloseTo(40, 5);
  });

  it('liczy wartości przepisu z jednostek ciągłych i policzalnych', () => {
    const recipe: Recipe = {
      id: 'test',
      name: 'Test',
      mealTypes: ['sniadanie'],
      prepMinutes: 5,
      // 2 jajka (2 × 78 kcal) + 100 g płatków owsianych (366 kcal)
      ingredients: [
        { ingredientId: 'jajko', amount: 2 },
        { ingredientId: 'platki-owsiane', amount: 100 },
      ],
      steps: [],
      tags: [],
    };

    const macros = recipeMacros(recipe, ingredients);
    expect(macros.kcal).toBeCloseTo(2 * 78 + 366, 5);
    expect(macros.protein).toBeCloseTo(2 * 6.3 + 12, 5);
  });

  it('pomija składniki, których nie ma w bazie', () => {
    const recipe: Recipe = {
      id: 'test2',
      name: 'Test',
      mealTypes: ['obiad'],
      prepMinutes: 5,
      ingredients: [
        { ingredientId: 'jajko', amount: 1 },
        { ingredientId: 'nie-istnieje', amount: 500 },
      ],
      steps: [],
      tags: [],
    };

    expect(recipeMacros(recipe, ingredients).kcal).toBeCloseTo(78, 5);
  });
});
