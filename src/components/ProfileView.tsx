import { useMemo, useRef, useState } from 'react';
import { formatGrams, formatNumber } from '../lib/format';
import { suggestedMacroSplit } from '../lib/nutrition';
import { defaultMealShare } from '../lib/planner';
import { COMMON_DISLIKES, PREFERENCE_TAGS, isRecipeAllowed } from '../lib/preferences';
import { exportState, importState } from '../lib/storage';
import { useStore } from '../state/store';
import {
  ACTIVITY_LABEL,
  DIET_LABEL,
  GOAL_LABEL,
  MEAL_LABEL,
  MEAL_ORDER,
  type ActivityLevel,
  type DietStyle,
  type Goal,
  type Profile,
} from '../types';
import { Chip, NumberField } from './ui';

export function ProfileView() {
  const { state, dispatch, derived } = useStore();
  const { profile, preferences } = state;
  const target = derived.target;
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const patch = (value: Partial<Profile>) => dispatch({ type: 'patchProfile', patch: value });

  const macroSum = profile.proteinPct + profile.fatPct + profile.carbsPct;
  const shareSum = MEAL_ORDER.reduce((sum, meal) => sum + (profile.mealShare[meal] ?? 0), 0);

  const matching = useMemo(
    () => derived.recipes.filter((recipe) => isRecipeAllowed(recipe, preferences, derived.ingredients)).length,
    [derived.recipes, derived.ingredients, preferences],
  );

  const dislikeChoices = useMemo(
    () =>
      [...new Set([...COMMON_DISLIKES, ...preferences.excludedIngredientIds])]
        .map((id) => derived.ingredients.get(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [derived.ingredients, preferences.excludedIngredientIds],
  );

  const download = () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dieta-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File) => {
    try {
      const text = await file.text();
      dispatch({ type: 'replaceState', state: importState(text) });
      setImportError(null);
    } catch {
      setImportError('Nie udało się wczytać pliku — czy to na pewno kopia z tej aplikacji?');
    }
  };

  return (
    <div>
      <div className="view-head">
        <div>
          <h1>Profil i preferencje</h1>
          <p>Tu zmienisz wszystko, o co pytał kreator.</p>
        </div>
      </div>

      <div className="stack">
        {/* ── Cel kaloryczny ─────────────────────────────────────────── */}
        <div className="card">
          <h2 style={{ marginBottom: '0.75rem' }}>Cel kaloryczny</h2>

          <div className="kcal-hero" style={{ marginBottom: '0.85rem' }}>
            <div className="value">{formatNumber(target.kcal, 0)}</div>
            <div className="small" style={{ color: 'var(--accent-text)' }}>
              kcal dziennie
            </div>
          </div>

          {!target.manual ? (
            <>
              <div className="calc-row">
                <span>Podstawowa przemiana materii</span>
                <strong>{formatNumber(target.bmr, 0)} kcal</strong>
              </div>
              <div className="calc-row">
                <span>Zapotrzebowanie z aktywnością</span>
                <strong>{formatNumber(target.tdee, 0)} kcal</strong>
              </div>
              <div className="calc-row">
                <span>Korekta na cel</span>
                <strong>
                  {target.adjustment > 0 ? '+' : ''}
                  {formatNumber(target.adjustment, 0)} kcal
                </strong>
              </div>
              <div className="calc-row total">
                <span>Razem</span>
                <strong>{formatNumber(target.kcal, 0)} kcal</strong>
              </div>
            </>
          ) : null}

          {target.clamped ? (
            <div className="notice notice-warn" style={{ marginTop: '0.6rem' }}>
              Wyliczony cel ({formatNumber(target.raw, 0)} kcal) był poniżej bezpiecznego minimum
              i został podniesiony. Zmniejsz tempo redukcji.
            </div>
          ) : null}

          <label className="row-tight small" style={{ marginTop: '0.75rem' }}>
            <input
              type="checkbox"
              checked={!profile.autoKcal}
              style={{ width: 'auto' }}
              onChange={(event) => patch({ autoKcal: !event.target.checked })}
            />
            Ustawię kaloryczność ręcznie
          </label>

          {!profile.autoKcal ? (
            <div style={{ marginTop: '0.5rem', maxWidth: '14rem' }}>
              <NumberField
                label="Moja kaloryczność"
                suffix="kcal"
                value={profile.manualKcal}
                min={800}
                max={6000}
                step={50}
                onChange={(manualKcal) => patch({ manualKcal })}
              />
            </div>
          ) : null}
        </div>

        {/* ── Dane ───────────────────────────────────────────────────── */}
        <div className="card stack">
          <h2>Dane i aktywność</h2>

          <div className="grid-4">
            <div className="field">
              <label htmlFor="p-sex">Płeć</label>
              <select
                id="p-sex"
                value={profile.sex}
                onChange={(event) => patch({ sex: event.target.value as Profile['sex'] })}
              >
                <option value="m">Mężczyzna</option>
                <option value="k">Kobieta</option>
              </select>
            </div>
            <NumberField label="Wiek" value={profile.age} min={12} max={100} onChange={(age) => patch({ age })} />
            <NumberField label="Wzrost" suffix="cm" value={profile.heightCm} min={120} max={230} onChange={(heightCm) => patch({ heightCm })} />
            <NumberField label="Waga" suffix="kg" value={profile.weightKg} min={35} max={250} step={0.5} onChange={(weightKg) => patch({ weightKg })} />
          </div>

          <div className="field">
            <label htmlFor="p-activity">Aktywność</label>
            <select
              id="p-activity"
              value={profile.activity}
              onChange={(event) => patch({ activity: event.target.value as ActivityLevel })}
            >
              {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((level) => (
                <option key={level} value={level}>
                  {ACTIVITY_LABEL[level]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="p-goal">Cel</label>
              <select
                id="p-goal"
                value={profile.goal}
                onChange={(event) => {
                  const goal = event.target.value as Goal;
                  patch({
                    goal,
                    paceKgPerWeek: goal === 'utrzymanie' ? 0 : profile.paceKgPerWeek || 0.5,
                    ...suggestedMacroSplit(goal),
                  });
                }}
              >
                {(Object.keys(GOAL_LABEL) as Goal[]).map((goal) => (
                  <option key={goal} value={goal}>
                    {GOAL_LABEL[goal]}
                  </option>
                ))}
              </select>
            </div>

            {profile.goal !== 'utrzymanie' ? (
              <NumberField
                label="Tempo"
                suffix="kg / tydzień"
                value={profile.paceKgPerWeek}
                min={0}
                max={1}
                step={0.05}
                onChange={(paceKgPerWeek) => patch({ paceKgPerWeek })}
                hint="0,5 kg tygodniowo to typowe, rozsądne tempo."
              />
            ) : null}
          </div>
        </div>

        {/* ── Makro ──────────────────────────────────────────────────── */}
        <div className="card stack">
          <div className="row">
            <h2 style={{ flex: 1 }}>Makroskładniki</h2>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => patch(suggestedMacroSplit(profile.goal))}
            >
              Ustaw sugerowane
            </button>
          </div>

          <div className="grid-3">
            <NumberField
              label="Białko"
              suffix="%"
              value={profile.proteinPct}
              min={10}
              max={60}
              onChange={(proteinPct) => patch({ proteinPct })}
              hint={formatGrams(derived.macros.protein)}
            />
            <NumberField
              label="Tłuszcz"
              suffix="%"
              value={profile.fatPct}
              min={15}
              max={60}
              onChange={(fatPct) => patch({ fatPct })}
              hint={formatGrams(derived.macros.fat)}
            />
            <NumberField
              label="Węglowodany"
              suffix="%"
              value={profile.carbsPct}
              min={10}
              max={70}
              onChange={(carbsPct) => patch({ carbsPct })}
              hint={formatGrams(derived.macros.carbs)}
            />
          </div>

          {macroSum !== 100 ? (
            <div className="notice notice-warn">
              Udziały sumują się do {macroSum}%, a powinny do 100%.
            </div>
          ) : null}
        </div>

        {/* ── Posiłki ────────────────────────────────────────────────── */}
        <div className="card stack">
          <h2>Rozkład posiłków</h2>

          <div className="field" style={{ maxWidth: '16rem' }}>
            <label htmlFor="p-meals">Posiłków dziennie</label>
            <select
              id="p-meals"
              value={profile.mealsPerDay}
              onChange={(event) => {
                const mealsPerDay = Number(event.target.value);
                patch({ mealsPerDay, mealShare: defaultMealShare(mealsPerDay) });
              }}
            >
              <option value={3}>3 — bez przekąsek</option>
              <option value={4}>4 — z jedną przekąską</option>
              <option value={5}>5 — z dwiema przekąskami</option>
            </select>
          </div>

          <div className="grid-4">
            {MEAL_ORDER.map((meal) => (
              <NumberField
                key={meal}
                label={MEAL_LABEL[meal]}
                suffix="%"
                value={profile.mealShare[meal] ?? 0}
                min={0}
                max={100}
                step={5}
                onChange={(value) =>
                  patch({ mealShare: { ...profile.mealShare, [meal]: value } })
                }
                hint={formatNumber((target.kcal * (profile.mealShare[meal] ?? 0)) / 100, 0) + ' kcal'}
              />
            ))}
          </div>

          {shareSum !== 100 ? (
            <div className="notice notice-warn">
              Udziały posiłków sumują się do {shareSum}%, a powinny do 100%.
            </div>
          ) : null}
        </div>

        {/* ── Preferencje ────────────────────────────────────────────── */}
        <div className="card stack">
          <h2>Preferencje smakowe</h2>

          <div className="field">
            <label htmlFor="p-diet">Sposób odżywiania</label>
            <select
              id="p-diet"
              value={preferences.diet}
              onChange={(event) =>
                dispatch({ type: 'patchPreferences', patch: { diet: event.target.value as DietStyle } })
              }
            >
              {(Object.keys(DIET_LABEL) as DietStyle[]).map((diet) => (
                <option key={diet} value={diet}>
                  {DIET_LABEL[diet]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Czego nie jadam</label>
            <div className="chips">
              {dislikeChoices.map((ingredient) => (
                <Chip
                  key={ingredient.id}
                  danger
                  active={preferences.excludedIngredientIds.includes(ingredient.id)}
                  onClick={() =>
                    dispatch({
                      type: 'patchPreferences',
                      patch: {
                        excludedIngredientIds: preferences.excludedIngredientIds.includes(ingredient.id)
                          ? preferences.excludedIngredientIds.filter((id) => id !== ingredient.id)
                          : [...preferences.excludedIngredientIds, ingredient.id],
                      },
                    })
                  }
                >
                  {ingredient.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Co lubię</label>
            <div className="chips">
              {PREFERENCE_TAGS.map(({ tag, label }) => (
                <Chip
                  key={tag}
                  active={preferences.favoriteTags.includes(tag)}
                  onClick={() =>
                    dispatch({
                      type: 'patchPreferences',
                      patch: {
                        favoriteTags: preferences.favoriteTags.includes(tag)
                          ? preferences.favoriteTags.filter((item) => item !== tag)
                          : [...preferences.favoriteTags, tag],
                      },
                    })
                  }
                >
                  {label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="field" style={{ maxWidth: '16rem' }}>
            <label htmlFor="p-prep">Maksymalny czas gotowania</label>
            <select
              id="p-prep"
              value={preferences.maxPrepMinutes === null ? 'brak' : String(preferences.maxPrepMinutes)}
              onChange={(event) =>
                dispatch({
                  type: 'patchPreferences',
                  patch: {
                    maxPrepMinutes: event.target.value === 'brak' ? null : Number(event.target.value),
                  },
                })
              }
            >
              <option value="15">do 15 minut</option>
              <option value="30">do 30 minut</option>
              <option value="45">do 45 minut</option>
              <option value="brak">bez ograniczeń</option>
            </select>
          </div>

          <div className="notice">
            Pasujących przepisów: <strong>{matching}</strong> z {derived.recipes.length}.
            {preferences.dislikedRecipeIds.length > 0
              ? ` Odrzuconych ręcznie: ${preferences.dislikedRecipeIds.length}.`
              : ''}
          </div>

          {preferences.dislikedRecipeIds.length > 0 ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => dispatch({ type: 'patchPreferences', patch: { dislikedRecipeIds: [] } })}
            >
              Przywróć odrzucone przepisy
            </button>
          ) : null}
        </div>

        {/* ── Dane aplikacji ─────────────────────────────────────────── */}
        <div className="card stack">
          <h2>Kopia zapasowa</h2>
          <p className="small muted">
            Wszystko trzymane jest w tej przeglądarce. Zrób kopię, zanim wyczyścisz dane albo
            przesiądziesz się na inne urządzenie.
          </p>

          <div className="row">
            <button type="button" className="btn" onClick={download}>
              Pobierz kopię
            </button>
            <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
              Wczytaj kopię
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = '';
              }}
            />
            <span className="spacer" />
            <button
              type="button"
              className="btn"
              onClick={() => dispatch({ type: 'restartOnboarding' })}
            >
              Uruchom kreator
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm('Usunąć plan, preferencje i własne przepisy? Tego nie da się cofnąć.')) {
                  dispatch({ type: 'reset' });
                }
              }}
            >
              Wyczyść dane
            </button>
          </div>

          {importError ? <div className="notice notice-warn">{importError}</div> : null}
        </div>
      </div>
    </div>
  );
}
