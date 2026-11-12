"use client";
import { useEffect, useState } from "react";
import { Scanner } from "@/components/Scanner";
import { Diary } from "@/components/Diary";
import { ProfileForm } from "@/components/ProfileForm";
import { calcGoal, DEFAULT_PROFILE, loadMeals, loadProfile, saveMeals, saveProfile, sumItems, todayStr, type Meal, type Profile } from "@/lib/storage";

type Tab = "scan" | "diary" | "profile";

export default function Home() {
  const [tab, setTab] = useState<Tab>("scan");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeals(loadMeals());
    setProfile(loadProfile());
    setReady(true);
  }, []);

  const goal = calcGoal(profile);
  const todayKcal = sumItems(meals.filter((m) => m.date === todayStr()).flatMap((m) => m.items)).calories;

  function addMeal(m: Meal) {
    const next = [...meals, m];
    setMeals(next);
    saveMeals(next);
  }
  function deleteMeal(id: string) {
    const next = meals.filter((m) => m.id !== id);
    setMeals(next);
    saveMeals(next);
  }
  function updateProfile(p: Profile) {
    setProfile(p);
    saveProfile(p);
  }

  const tabs: [Tab, string, string][] = [
    ["scan", "Skaner", "📷"],
    ["diary", "Kundalik", "📊"],
    ["profile", "Profil", "👤"],
  ];

  return (
    <div className="relative min-h-dvh pb-28 sm:pb-10">
      <div className="bg-blobs" aria-hidden />
      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/60 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button onClick={() => setTab("scan")} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-lg shadow-md shadow-emerald-500/30">🥑</span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Kaloriya<span className="text-emerald-500">AI</span>
            </span>
          </button>
          <nav className="hidden gap-1 rounded-2xl bg-slate-100/80 p-1 sm:flex dark:bg-white/5">
            {tabs.map(([t, l]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
                  tab === t ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                {l}
              </button>
            ))}
          </nav>
          <button onClick={() => setTab("diary")} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 tabular-nums dark:bg-emerald-500/10 dark:text-emerald-300">
            {ready ? `${Math.round(todayKcal)} / ${goal}` : "…"} kkal
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 pt-6">
        {tab === "scan" && <Scanner onSave={addMeal} />}
        {tab === "diary" && ready && <Diary meals={meals} goal={goal} onDelete={deleteMeal} onScan={() => setTab("scan")} />}
        {tab === "profile" && ready && (
          <ProfileForm
            profile={profile}
            onChange={updateProfile}
            onClear={() => {
              setMeals([]);
              saveMeals([]);
            }}
          />
        )}
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-3xl border border-white/50 bg-white/80 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:hidden dark:border-white/10 dark:bg-slate-900/80"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-3">
          {tabs.map(([t, l, i]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-medium transition ${
                tab === t ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <span className="text-lg leading-none">{i}</span>
              {l}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
