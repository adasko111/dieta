import { describe, expect, it } from 'vitest';
import { formatAmount, formatPortions, roundShoppingAmount, unitLabel } from '../format';

describe('odmiana jednostek', () => {
  it('używa liczby pojedynczej dla jedynki', () => {
    expect(unitLabel(1, 'ząbek')).toBe('ząbek');
    expect(unitLabel(1, 'łyżka')).toBe('łyżka');
  });

  it('używa formy „2–4” tam, gdzie trzeba', () => {
    expect(unitLabel(2, 'ząbek')).toBe('ząbki');
    expect(unitLabel(3, 'łyżka')).toBe('łyżki');
    expect(unitLabel(24, 'pęczek')).toBe('pęczki');
  });

  it('używa formy „wielu” dla 5+ oraz dla nastek', () => {
    expect(unitLabel(5, 'ząbek')).toBe('ząbków');
    expect(unitLabel(11, 'ząbek')).toBe('ząbków');
    expect(unitLabel(12, 'łyżka')).toBe('łyżek');
    expect(unitLabel(13, 'łyżka')).toBe('łyżek');
    expect(unitLabel(14, 'łyżka')).toBe('łyżek');
    expect(unitLabel(22, 'łyżka')).toBe('łyżki');
  });

  it('używa dopełniacza przy ułamkach', () => {
    expect(unitLabel(1.5, 'łyżka')).toBe('łyżki');
    expect(unitLabel(0.5, 'ząbek')).toBe('ząbka');
  });

  it('zostawia skróty bez zmian', () => {
    expect(unitLabel(5, 'g')).toBe('g');
    expect(unitLabel(3, 'szt')).toBe('szt');
  });
});

describe('formatowanie ilości', () => {
  it('przechodzi na kilogramy i litry powyżej tysiąca', () => {
    expect(formatAmount(1150, 'g')).toBe('1,15 kg');
    expect(formatAmount(2000, 'ml')).toBe('2 l');
    expect(formatAmount(950, 'g')).toBe('950 g');
  });

  it('składa liczbę z odmienioną jednostką', () => {
    expect(formatAmount(11, 'ząbek')).toBe('11 ząbków');
    expect(formatAmount(2, 'łyżka')).toBe('2 łyżki');
  });
});

describe('zaokrąglanie policzalnych', () => {
  it('zaokrągla w górę każdą jednostkę policzalną', () => {
    expect(roundShoppingAmount(10.3, 'ząbek')).toBe(11);
    expect(roundShoppingAmount(12.1, 'łyżka')).toBe(13);
    expect(roundShoppingAmount(0.25, 'szt')).toBe(1);
  });
});

describe('odmiana porcji', () => {
  it('odmienia zgodnie z liczbą', () => {
    expect(formatPortions(1)).toBe('1 porcja');
    expect(formatPortions(2)).toBe('2 porcje');
    expect(formatPortions(5)).toBe('5 porcji');
    expect(formatPortions(1.5)).toBe('1,5 porcji');
  });
});
