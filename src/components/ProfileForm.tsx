"use client";
import { calcGoal, type Profile } from "@/lib/storage";

const ACTIVITIES: [number, string][] = [
  [1.2, "Kam harakat (o'tirib ishlash)"],
  [1.375, "Yengil (haftada 1–3 mashg'ulot)"],
  [1.55, "O'rtacha (haftada 3–5 mashg'ulot)"],
  [1.725, "Yuqori (har kuni sport)"],
  [1.9, "Juda yuqori (og'ir jismoniy ish)"],
];

export function ProfileForm({ profile, onChange, onClear }: { profile: Profile; onChange: (p: Profile) => void; onClear: () => void }) {
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => onChange({ ...profile, [k]: v });
  const goal = calcGoal(profile);
  const bmi = profile.weight / (profile.height / 100) ** 2;
  const bmiLabel = bmi < 18.5 ? "Vazn yetishmaydi" : bmi < 25 ? "Me'yorda" : bmi < 30 ? "Ortiqcha vazn" : "Semizlik";

  return (
    <div className="animate-fade-up space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/30">
          <div className="text-sm opacity-80">Kunlik me&apos;yor</div>
          <div className="text-3xl font-extrabold tabular-nums">{goal}</div>
          <div className="text-sm opacity-80">kkal</div>
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400">Tana massasi indeksi</div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums dark:text-white">{bmi.toFixed(1)}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{bmiLabel}</div>
        </div>
      </div>

      <div className="glass space-y-5 rounded-3xl p-5">
        <Field label="Jins">
          <Segmented value={profile.gender} options={[["erkak", "Erkak"], ["ayol", "Ayol"]]} onChange={(v) => set("gender", v)} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Yosh"><NumInput value={profile.age} onChange={(v) => set("age", v)} suffix="yosh" /></Field>
          <Field label="Vazn"><NumInput value={profile.weight} onChange={(v) => set("weight", v)} suffix="kg" /></Field>
          <Field label="Bo'y"><NumInput value={profile.height} onChange={(v) => set("height", v)} suffix="sm" /></Field>
        </div>
        <Field label="Faollik darajasi">
          <select value={profile.activity} onChange={(e) => set("activity", +e.target.value)} className="input">
            {ACTIVITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Maqsad">
          <Segmented value={profile.goal} options={[["ozish", "Ozish"], ["saqlash", "Saqlash"], ["semirish", "Vazn olish"]]} onChange={(v) => set("goal", v)} />
        </Field>
        <Field label="Me'yorni qo'lda belgilash (ixtiyoriy)">
          <input
            type="number"
            placeholder="Avtomatik hisoblanadi"
            value={profile.customCalories ?? ""}
            onChange={(e) => set("customCalories", e.target.value ? +e.target.value : null)}
            className="input"
          />
        </Field>
      </div>

      <div className="glass rounded-3xl p-5 text-sm text-slate-500 dark:text-slate-400">
        Ma&apos;lumotlaringiz faqat shu qurilmada (brauzerda) saqlanadi.
        <button onClick={() => confirm("Barcha kundalik yozuvlari o'chirilsinmi?") && onClear()} className="mt-3 block font-medium text-red-500 hover:underline">
          Kundalikni tozalash
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function NumInput({ value, onChange, suffix }: { value: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <div className="input flex items-center">
      <input type="number" value={value} onChange={(e) => onChange(+e.target.value || 0)} className="w-full min-w-0 bg-transparent tabular-nums outline-none" />
      <span className="ml-1 text-xs text-slate-400">{suffix}</span>
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/10">
      {options.map(([v, l]) => (
        <button
          type="button"
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            value === v ? "bg-white text-emerald-600 shadow dark:bg-slate-800 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
