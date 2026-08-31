import { useMemo, useState } from 'react';
import { formatGrams, formatNumber } from '../lib/format';
import { kcalTarget, macroTargets, suggestedMacroSplit } from '../lib/nutrition';
import { defaultMealShare } from '../lib/planner';
import { COMMON_DISLIKES, PREFERENCE_TAGS, isRecipeAllowed } from '../lib/preferences';
import { defaultPreferences, defaultProfile } from '../lib/storage';
import { useStore } from '../state/store';
import {
  ACTIVITY_LABEL,
  DIET_LABEL,
  GOAL_LABEL,
  type ActivityLevel,
  type DietStyle,
  type Goal,
  type Preferences,
  type Profile,
} from '../types';
import { Chip, NumberField, Option } from './ui';

const STEP_TITLES = [
  'O Tobie',
  'Aktywność',
  'Cel',
  'Posiłki',
  'Sposób odżywiania',
  'Czego nie jadasz',
  'Co lubisz',
  'Podsumowanie',
];

/** Tempo do wyboru zależnie od celu — przy utrzymaniu wagi nie ma czego wybierać. */
const PACE_OPTIONS: Record<Goal, { value: number; title: string; description: string }[]> = {
  redukcja: [
    { value: 0.25, title: 'Spokojnie — 0,25 kg / tydzień', description: 'Najmniejszy deficyt, najłatwiej wytrwać.' },
    { value: 0.5, title: 'Standardowo — 0,5 kg / tydzień', description: 'Rozsądny kompromis tempa i komfortu.' },
    { value: 0.75, title: 'Szybko — 0,75 kg / tydzień', description: 'Duży deficyt, wymaga dyscypliny.' },
  ],
  masa: [
    { value: 0.15, title: 'Powoli — 0,15 kg / tydzień', description: 'Minimum zbędnego tłuszczu.' },
    { value: 0.25, title: 'Standardowo — 0,25 kg / tydzień', description: 'Typowe tempo budowy masy.' },
    { value: 0.4, title: 'Szybko — 0,4 kg / tydzień', description: 'Szybszy przyrost, także tkanki tłuszczowej.' },
  ],
  utrzymanie: [],
};

const PREP_TIME_OPTIONS: { value: number | null; title: string; description: string }[] = [
  { value: 15, title: 'Maksymalnie 15 minut', description: 'Tylko szybkie dania i kanapki.' },
  { value: 30, title: 'Do 30 minut', description: 'Zwykłe gotowanie w tygodniu.' },
  { value: null, title: 'Bez ograniczeń', description: 'Mam czas także na dłuższe przepisy.' },
];

export function Onboarding() {
  const { dispatch, derived } = useStore();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);

  const patchProfile = (patch: Partial<Profile>) => setProfile((current) => ({ ...current, ...patch }));
  const patchPrefs = (patch: Partial<Preferences>) => setPrefs((current) => ({ ...current, ...patch }));

  const target = useMemo(() => kcalTarget(profile), [profile]);
  const macros = useMemo(() => macroTargets(target.kcal, profile), [target.kcal, profile]);

  const matchingRecipes = useMemo(
    () => derived.recipes.filter((recipe) => isRecipeAllowed(recipe, prefs, derived.ingredients)).length,
    [derived.recipes, derived.ingredients, prefs],
  );

  const dislikeChoices = useMemo(
    () =>
      COMMON_DISLIKES.map((id) => derived.ingredients.get(id)).filter(
        (item): item is NonNullable<typeof item> => Boolean(item),
      ),
    [derived.ingredients],
  );

  const setGoal = (goal: Goal) => {
    const paceOptions = PACE_OPTIONS[goal];
    const defaultPace = goal === 'utrzymanie' ? 0 : (paceOptions[1]?.value ?? 0.25);
    patchProfile({ goal, paceKgPerWeek: defaultPace, ...suggestedMacroSplit(goal) });
  };

  const setMealsPerDay = (mealsPerDay: number) => {
    patchProfile({ mealsPerDay, mealShare: defaultMealShare(mealsPerDay) });
  };

  const finish = () => {
    dispatch({ type: 'finishOnboarding', profile, preferences: prefs });
  };

  const canContinue = step !== 0 || (profile.age > 0 && profile.heightCm > 0 && profile.weightKg > 0);
  const isLast = step === STEP_TITLES.length - 1;

  return (
    <div className="onboarding">
      <div className="onboarding-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ▨
          </span>
          Planer diety
        </div>

        <div className="steps-bar" aria-hidden="true">
          {STEP_TITLES.map((title, index) => (
            <span key={title} className={index <= step ? 'step-dot done' : 'step-dot'} />
          ))}
        </div>

        <div className="step-label">
          Krok {step + 1} z {STEP_TITLES.length}
        </div>
        <h1 style={{ marginTop: '0.35rem', marginBottom: '1rem' }}>{STEP_TITLES[step]}</h1>

        {step === 0 ? (
          <div className="stack">
            <p className="muted">
              Kilka pytań, żeby policzyć Twoje zapotrzebowanie i dobrać przepisy. Wszystko zostaje
              w tej przeglądarce — nic nie jest nigdzie wysyłane.
            </p>
            <div className="card stack">
              <div className="field">
                <label htmlFor="sex">Płeć</label>
                <select
                  id="sex"
                  value={profile.sex}
                  onChange={(event) => patchProfile({ sex: event.target.value as Profile['sex'] })}
                >
                  <option value="m">Mężczyzna</option>
                  <option value="k">Kobieta</option>
                </select>
                <span className="hint">Potrzebne do wzoru na przemianę materii.</span>
              </div>
              <div className="grid-3">
                <NumberField label="Wiek" suffix="lata" value={profile.age} min={12} max={100} onChange={(age) => patchProfile({ age })} />
                <NumberField label="Wzrost" suffix="cm" value={profile.heightCm} min={120} max={230} onChange={(heightCm) => patchProfile({ heightCm })} />
                <NumberField label="Waga" suffix="kg" value={profile.weightKg} min={35} max={250} step={0.5} onChange={(weightKg) => patchProfile({ weightKg })} />
              </div>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="stack">
            <p className="muted">Jak dużo się ruszasz w typowym tygodniu?</p>
            <div className="options">
              {(Object.keys(ACTIVITY_LABEL) as ActivityLevel[]).map((level) => (
                <Option
                  key={level}
                  active={profile.activity === level}
                  onClick={() => patchProfile({ activity: level })}
                  title={ACTIVITY_LABEL[level]}
                />
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="stack">
            <p className="muted">Co chcesz osiągnąć?</p>
            <div className="options">
              {(Object.keys(GOAL_LABEL) as Goal[]).map((goal) => (
                <Option
                  key={goal}
                  active={profile.goal === goal}
                  onClick={() => setGoal(goal)}
                  title={GOAL_LABEL[goal]}
                />
              ))}
            </div>

            {PACE_OPTIONS[profile.goal].length > 0 ? (
              <>
                <h3 style={{ marginTop: '0.5rem' }}>W jakim tempie?</h3>
                <div className="options">
                  {PACE_OPTIONS[profile.goal].map((option) => (
                    <Option
                      key={option.value}
                      active={profile.paceKgPerWeek === option.value}
                      onClick={() => patchProfile({ paceKgPerWeek: option.value })}
                      title={option.title}
                      description={option.description}
                    />
                  ))}
                </div>
              </>
            ) : null}

            <div className="notice notice-accent">
              Przy tych ustawieniach wychodzi <strong>{formatNumber(target.kcal, 0)} kcal</strong> dziennie
              {target.adjustment !== 0
                ? ` (${target.adjustment > 0 ? '+' : ''}${formatNumber(target.adjustment, 0)} kcal względem zapotrzebowania).`
                : '.'}
            </div>

            {target.clamped ? (
              <div className="notice notice-warn">
                Tak duży deficyt zszedłby poniżej bezpiecznego minimum, więc cel został podniesiony
                do {formatNumber(target.kcal, 0)} kcal. Rozważ wolniejsze tempo.
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="stack">
            <p className="muted">Ile razy dziennie zwykle jesz?</p>
            <div className="options">
              {[3, 4, 5].map((count) => (
                <Option
                  key={count}
                  active={profile.mealsPerDay === count}
                  onClick={() => setMealsPerDay(count)}
                  title={`${count} posiłki dziennie`}
                  description={
                    count === 3
                      ? 'Śniadanie, obiad, kolacja.'
                      : count === 4
                        ? 'Trzy główne posiłki i jedna przekąska.'
                        : 'Trzy główne posiłki i dwie przekąski.'
                  }
                />
              ))}
            </div>

            <h3 style={{ marginTop: '0.5rem' }}>Ile czasu masz na gotowanie?</h3>
            <div className="options">
              {PREP_TIME_OPTIONS.map((option) => (
                <Option
                  key={String(option.value)}
                  active={prefs.maxPrepMinutes === option.value}
                  onClick={() => patchPrefs({ maxPrepMinutes: option.value })}
                  title={option.title}
                  description={option.description}
                />
              ))}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="stack">
            <p className="muted">Czy są produkty, których w ogóle nie jadasz?</p>
            <div className="options">
              {(Object.keys(DIET_LABEL) as DietStyle[]).map((diet) => (
                <Option
                  key={diet}
                  active={prefs.diet === diet}
                  onClick={() => patchPrefs({ diet })}
                  title={DIET_LABEL[diet]}
                />
              ))}
            </div>
            <div className="notice">
              Pasujących przepisów: <strong>{matchingRecipes}</strong> z {derived.recipes.length}.
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="stack">
            <p className="muted">
              Zaznacz to, czego nie lubisz — przepisy z tymi składnikami nie będą Ci proponowane.
              Możesz to później zmienić.
            </p>
            <div className="chips">
              {dislikeChoices.map((ingredient) => (
                <Chip
                  key={ingredient.id}
                  danger
                  active={prefs.excludedIngredientIds.includes(ingredient.id)}
                  onClick={() =>
                    patchPrefs({
                      excludedIngredientIds: prefs.excludedIngredientIds.includes(ingredient.id)
                        ? prefs.excludedIngredientIds.filter((id) => id !== ingredient.id)
                        : [...prefs.excludedIngredientIds, ingredient.id],
                    })
                  }
                >
                  {ingredient.name}
                </Chip>
              ))}
            </div>
            <div className="notice">
              Pasujących przepisów: <strong>{matchingRecipes}</strong> z {derived.recipes.length}.
              {matchingRecipes < 12 ? ' To już niewiele — rozważ odznaczenie kilku pozycji.' : ''}
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="stack">
            <p className="muted">
              A co lubisz? Takie dania będą częściej trafiać do wygenerowanego planu.
            </p>
            <div className="chips">
              {PREFERENCE_TAGS.map(({ tag, label }) => (
                <Chip
                  key={tag}
                  active={prefs.favoriteTags.includes(tag)}
                  onClick={() =>
                    patchPrefs({
                      favoriteTags: prefs.favoriteTags.includes(tag)
                        ? prefs.favoriteTags.filter((item) => item !== tag)
                        : [...prefs.favoriteTags, tag],
                    })
                  }
                >
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="stack">
            <div className="kcal-hero">
              <div className="small" style={{ color: 'var(--accent-text)' }}>
                Twój dzienny cel
              </div>
              <div className="value">{formatNumber(target.kcal, 0)}</div>
              <div className="small" style={{ color: 'var(--accent-text)' }}>
                kcal dziennie
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '0.5rem' }}>Skąd ta liczba</h3>
              <div className="calc-row">
                <span>Podstawowa przemiana materii</span>
                <strong>{formatNumber(target.bmr, 0)} kcal</strong>
              </div>
              <div className="calc-row">
                <span>Zapotrzebowanie z aktywnością</span>
                <strong>{formatNumber(target.tdee, 0)} kcal</strong>
              </div>
              <div className="calc-row">
                <span>Korekta na cel „{GOAL_LABEL[profile.goal].toLowerCase()}”</span>
                <strong>
                  {target.adjustment > 0 ? '+' : ''}
                  {formatNumber(target.adjustment, 0)} kcal
                </strong>
              </div>
              <div className="calc-row total">
                <span>Cel dzienny</span>
                <strong>{formatNumber(target.kcal, 0)} kcal</strong>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '0.5rem' }}>Makroskładniki</h3>
              <div className="grid-3">
                <div className="macro-cell">
                  <div className="label">Białko {profile.proteinPct}%</div>
                  <div className="value">{formatGrams(macros.protein)}</div>
                </div>
                <div className="macro-cell">
                  <div className="label">Tłuszcz {profile.fatPct}%</div>
                  <div className="value">{formatGrams(macros.fat)}</div>
                </div>
                <div className="macro-cell">
                  <div className="label">Węgle {profile.carbsPct}%</div>
                  <div className="value">{formatGrams(macros.carbs)}</div>
                </div>
              </div>
            </div>

            <div className="notice">
              Do wyboru masz <strong>{matchingRecipes}</strong> przepisów pasujących do Twoich
              preferencji. Wszystko da się później zmienić w zakładce „Profil”.
            </div>

            <p className="tiny muted">
              Wyliczenia są szacunkowe (wzór Mifflina-St Jeora). Przy chorobach przewlekłych,
              ciąży lub karmieniu skonsultuj dietę z lekarzem albo dietetykiem.
            </p>
          </div>
        ) : null}

        <div className="onboarding-actions">
          {step > 0 ? (
            <button type="button" className="btn" onClick={() => setStep(step - 1)}>
              Wstecz
            </button>
          ) : null}
          <span className="spacer" />
          {!isLast ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
            >
              Dalej
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={finish}>
              Zaczynamy
            </button>
          )}
        </div>

        {step === 0 ? (
          <p className="tiny muted center" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="btn-icon tiny"
              onClick={() => dispatch({ type: 'finishOnboarding', profile, preferences: prefs })}
            >
              Pomiń kreator i użyj ustawień domyślnych
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}
