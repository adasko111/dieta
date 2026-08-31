import { useState } from 'react';
import { Onboarding } from './components/Onboarding';
import { PlanView } from './components/PlanView';
import { ProfileView } from './components/ProfileView';
import { RecipesView } from './components/RecipesView';
import { ShoppingView } from './components/ShoppingView';
import { countChecked, countItems } from './lib/shopping';
import { useStore } from './state/store';

type Tab = 'plan' | 'przepisy' | 'zakupy' | 'profil';

const TABS: { id: Tab; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'przepisy', label: 'Przepisy' },
  { id: 'zakupy', label: 'Zakupy' },
  { id: 'profil', label: 'Profil' },
];

export function App() {
  const { state, derived } = useStore();
  const [tab, setTab] = useState<Tab>('plan');

  if (!state.onboarded) return <Onboarding />;

  const remaining = countItems(derived.shopping) - countChecked(derived.shopping, state.checked);

  return (
    <div className="app">
      <header className="topbar no-print">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              ▨
            </span>
            Planer diety
          </div>
          <nav className="tabs" aria-label="Sekcje">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tab"
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                {item.id === 'zakupy' && remaining > 0 ? (
                  <span className="muted"> · {remaining}</span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {tab === 'plan' ? <PlanView /> : null}
        {tab === 'przepisy' ? <RecipesView /> : null}
        {tab === 'zakupy' ? <ShoppingView /> : null}
        {tab === 'profil' ? <ProfileView /> : null}
      </main>
    </div>
  );
}
