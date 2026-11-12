"use client";
import { useState } from "react";
import { MacroBar, Ring } from "./Ring";
import { MEAL_LABELS, sumItems, todayStr, type Meal, type MealType } from "@/lib/storage";

const DAYS = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

function shift(date: string, days: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return todayStr(d);
}
function pretty(date: string) {
  if (date === todayStr()) return "Bugun";
  if (date === shift(todayStr(), -1)) return "Kecha";
  const d = new Date(date + "T12:00:00");
  return `${d.getDate()}-${MONTHS[d.getMonth()]}`;
}

export function Diary({
  meals,
  goal,
  onDelete,
  onScan,
}: {
  meals: Meal[];
  goal: number;
  onDelete: (id: string) => void;
  onScan: () => void;
}) {
  const [date, setDate] = useState(todayStr());
  const dayMeals = meals.filter((m) => m.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const total = sumItems(dayMeals.flatMap((m) => m.items));
  const left = goal - total.calories;

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = shift(date, i - 6);
    const kcal = sumItems(meals.filter((m) => m.date === d).flatMap((m) => m.items)).calories;
    return { d, kcal };
  });
  const maxBar = Math.max(goal * 1.2, ...week.map((w) => w.kcal));

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setDate(shift(date, -1))} className="icon-btn" aria-label="Oldingi kun">‹</button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{pretty(date)}</h2>
        <button onClick={() => setDate(shift(date, 1))} disabled={date >= todayStr()} className="icon-btn disabled:opacity-30" aria-label="Keyingi kun">›</button>
      </div>

      <div className="glass flex flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row">
        <Ring value={total.calories} max={goal}>
          <div className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">{Math.round(Math.abs(left))}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{left >= 0 ? "kkal qoldi" : "kkal ortiqcha"}</div>
        </Ring>
        <div className="w-full flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Iste&apos;mol</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums dark:text-white">{Math.round(total.calories)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Maqsad</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums dark:text-white">{goal}</div>
            </div>
          </div>
          <MacroBar label="Oqsil" value={total.protein} goal={(goal * 0.25) / 4} color="#0ea5e9" />
          <MacroBar label="Yog'" value={total.fat} goal={(goal * 0.3) / 9} color="#fbbf24" />
          <MacroBar label="Uglevod" value={total.carbs} goal={(goal * 0.45) / 4} color="#8b5cf6" />
        </div>
      </div>

      <div className="glass rounded-3xl p-5">
        <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">So&apos;nggi 7 kun</h3>
        <div className="relative flex h-36 items-end gap-2">
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-emerald-400/70" style={{ bottom: `${(goal / maxBar) * 100}%` }}>
            <span className="absolute -top-5 right-0 text-[10px] text-emerald-600 dark:text-emerald-400">maqsad</span>
          </div>
          {week.map((w) => {
            const h = (w.kcal / maxBar) * 100;
            const active = w.d === date;
            return (
              <button key={w.d} onClick={() => setDate(w.d)} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-slate-500 tabular-nums opacity-0 transition group-hover:opacity-100 dark:text-slate-400">{Math.round(w.kcal)}</span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    w.kcal > goal ? "bg-gradient-to-t from-orange-400 to-red-400" : "bg-gradient-to-t from-emerald-400 to-teal-400"
                  } ${active ? "opacity-100 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900" : "opacity-60"}`}
                  style={{ height: `${Math.max(h, w.kcal > 0 ? 3 : 1)}%` }}
                />
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          {week.map((w) => (
            <div key={w.d} className="flex-1 text-center text-xs text-slate-500 dark:text-slate-400">
              {DAYS[new Date(w.d + "T12:00:00").getDay()]}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {dayMeals.length === 0 && (
          <div className="glass rounded-3xl p-8 text-center">
            <div className="text-4xl">🥗</div>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Bu kunda hali ovqat qo&apos;shilmagan</p>
            {date === todayStr() && (
              <button onClick={onScan} className="btn-primary mx-auto mt-4">📷 Ovqatni skanerlash</button>
            )}
          </div>
        )}
        {(Object.keys(MEAL_LABELS) as MealType[]).map((t) => {
          const list = dayMeals.filter((m) => m.type === t);
          if (!list.length) return null;
          const kcal = sumItems(list.flatMap((m) => m.items)).calories;
          return (
            <div key={t} className="glass rounded-3xl p-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <h4 className="font-semibold text-slate-900 dark:text-white">{MEAL_LABELS[t]}</h4>
                <span className="text-sm font-medium text-emerald-600 tabular-nums dark:text-emerald-400">{Math.round(kcal)} kkal</span>
              </div>
              <ul className="space-y-2">
                {list.map((m) => {
                  const s = sumItems(m.items);
                  return (
                    <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2 dark:bg-white/5">
                      {m.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.thumb} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-2xl dark:bg-emerald-500/20">🍽️</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-slate-800 dark:text-white">{m.title}</div>
                        <div className="truncate text-xs text-slate-500 dark:text-slate-400">{m.items.map((i) => i.name).join(", ")}</div>
                        <div className="text-xs text-slate-400 tabular-nums">
                          {new Date(m.time).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })} · O {Math.round(s.protein)} · Y {Math.round(s.fat)} · U {Math.round(s.carbs)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 tabular-nums dark:text-white">{Math.round(s.calories)}</div>
                        <button
                          onClick={() => confirm("Ushbu yozuvni o'chirasizmi?") && onDelete(m.id)}
                          className="text-xs text-slate-400 hover:text-red-500"
                        >
                          o&apos;chirish
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
