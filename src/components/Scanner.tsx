"use client";
import { useRef, useState } from "react";
import type { Analysis, FoodItem } from "@/lib/schema";
import { fileToResizedJpeg } from "@/lib/image";
import { guessMealType, MEAL_LABELS, sumItems, todayStr, type Meal, type MealType } from "@/lib/storage";

type Stage = "idle" | "preview" | "loading" | "result" | "error";

export function Scanner({ onSave }: { onSave: (m: Meal) => void }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState("");
  const [payload, setPayload] = useState("");
  const [thumb, setThumb] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [baseGrams, setBaseGrams] = useState<number[]>([]);
  const [mealType, setMealType] = useState<MealType>("tushlik");
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Iltimos, rasm faylini tanlang");
      setStage("error");
      return;
    }
    try {
      const big = await fileToResizedJpeg(file, 1280, 0.85);
      const small = await fileToResizedJpeg(file, 220, 0.7);
      setPreview(big.dataUrl);
      setPayload(big.base64);
      setThumb(small.dataUrl);
      setAnalysis(null);
      setSaved(false);
      setNote("");
      setStage("preview");
    } catch {
      setError("Rasmni o'qib bo'lmadi");
      setStage("error");
    }
  }

  async function analyze() {
    setStage("loading");
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: payload, mediaType: "image/jpeg", note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xatolik");
      const a: Analysis = data.analysis;
      setAnalysis(a);
      setItems(a.items);
      setBaseGrams(a.items.map((i) => i.grams));
      setMealType(guessMealType());
      setStage("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
      setStage("error");
    }
  }

  function setGrams(idx: number, grams: number) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx || !analysis) return it;
        const orig = analysis.items[i];
        const k = baseGrams[i] > 0 ? grams / baseGrams[i] : 0;
        return {
          ...it,
          grams,
          calories: orig.calories * k,
          protein: orig.protein * k,
          fat: orig.fat * k,
          carbs: orig.carbs * k,
        };
      }),
    );
  }

  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx));
    setBaseGrams((p) => p.filter((_, i) => i !== idx));
    setAnalysis((a) => (a ? { ...a, items: a.items.filter((_, i) => i !== idx) } : a));
  }

  function save() {
    if (!analysis) return;
    onSave({
      id: crypto.randomUUID(),
      date: todayStr(),
      time: new Date().toISOString(),
      type: mealType,
      title: analysis.title,
      thumb,
      items: items.map((i) => ({
        ...i,
        calories: Math.round(i.calories),
        protein: +i.protein.toFixed(1),
        fat: +i.fat.toFixed(1),
        carbs: +i.carbs.toFixed(1),
      })),
    });
    setSaved(true);
  }

  function reset() {
    setStage("idle");
    setPreview("");
    setAnalysis(null);
    setItems([]);
    setError("");
  }

  const total = sumItems(items);
  const macroCals = total.protein * 4 + total.fat * 9 + total.carbs * 4 || 1;

  return (
    <div className="space-y-6">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />

      {stage === "idle" && (
        <section className="animate-fade-up">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Ovqatni rasmga oling —{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">kaloriyani biling</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400">
              Sun&apos;iy intellekt bir necha soniyada taom tarkibi, kaloriya, oqsil, yog&apos; va uglevodlarni hisoblab beradi.
            </p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
            className={`glass relative overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center transition sm:p-12 ${
              dragging ? "border-emerald-400 bg-emerald-50/70 dark:bg-emerald-500/10" : "border-emerald-200 dark:border-white/15"
            }`}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-300/30 blur-3xl" />
            <div className="relative">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-4xl shadow-lg shadow-emerald-500/30">
                🍽️
              </div>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={() => cameraRef.current?.click()} className="btn-primary">
                  <CameraIcon /> Rasmga olish
                </button>
                <button onClick={() => galleryRef.current?.click()} className="btn-secondary">
                  <ImageIcon /> Galereyadan tanlash
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-400">yoki rasmni shu yerga tashlang</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              ["⚡", "Tez", "5–15 soniya"],
              ["🎯", "Batafsil", "Har bir taom alohida"],
              ["🇺🇿", "Milliy taomlar", "Palov, manti, somsa…"],
            ].map(([i, t, d]) => (
              <div key={t} className="glass rounded-2xl p-3 sm:p-4">
                <div className="text-2xl">{i}</div>
                <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">{t}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{d}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(stage === "preview" || stage === "loading") && (
        <section className="glass animate-fade-up overflow-hidden rounded-3xl">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Ovqat" className="h-full w-full object-cover" />
            {stage === "loading" && (
              <>
                <div className="absolute inset-0 bg-emerald-900/30" />
                <div className="scan-line absolute inset-x-0 h-24" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span className="font-medium">AI ovqatni tahlil qilmoqda…</span>
                  </div>
                </div>
              </>
            )}
          </div>
          {stage === "preview" && (
            <div className="space-y-4 p-5">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Izoh (ixtiyoriy): masalan, “yarim porsiya”, “yog'siz”"
                className="input"
                maxLength={300}
              />
              <div className="flex gap-3">
                <button onClick={reset} className="btn-secondary flex-1">Bekor qilish</button>
                <button onClick={analyze} className="btn-primary flex-[2]">✨ Tahlil qilish</button>
              </div>
            </div>
          )}
        </section>
      )}

      {stage === "error" && (
        <section className="glass animate-fade-up rounded-3xl p-8 text-center">
          <div className="text-5xl">😕</div>
          <p className="mt-3 font-medium text-slate-800 dark:text-white">{error}</p>
          <div className="mt-5 flex justify-center gap-3">
            <button onClick={reset} className="btn-secondary">Boshqa rasm</button>
            {payload && <button onClick={analyze} className="btn-primary">Qayta urinish</button>}
          </div>
        </section>
      )}

      {stage === "result" && analysis && (
        <section className="animate-fade-up space-y-4">
          <div className="glass overflow-hidden rounded-3xl">
            <div className="relative h-48 sm:h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={analysis.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-white/20 px-2.5 py-1 backdrop-blur">Aniqlik: {analysis.confidence}</span>
                  {analysis.is_food && (
                    <span className="rounded-full bg-white/20 px-2.5 py-1 backdrop-blur">Foydalilik: {analysis.health_score}/10</span>
                  )}
                </div>
                <h2 className="mt-2 text-2xl font-bold">{analysis.title}</h2>
              </div>
            </div>

            {analysis.is_food && items.length > 0 ? (
              <div className="p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Jami</div>
                    <div className="text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                      {Math.round(total.calories)}
                      <span className="ml-1 text-xl font-semibold text-slate-400">kkal</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-500 dark:text-slate-400">≈ {Math.round(total.grams)} g</div>
                </div>

                <div className="mt-5 flex h-3 overflow-hidden rounded-full">
                  <div className="bg-sky-500" style={{ width: `${(total.protein * 4 / macroCals) * 100}%` }} />
                  <div className="bg-amber-400" style={{ width: `${(total.fat * 9 / macroCals) * 100}%` }} />
                  <div className="bg-violet-500" style={{ width: `${(total.carbs * 4 / macroCals) * 100}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Macro label="Oqsil" value={total.protein} dot="bg-sky-500" />
                  <Macro label="Yog'" value={total.fat} dot="bg-amber-400" />
                  <Macro label="Uglevod" value={total.carbs} dot="bg-violet-500" />
                </div>
              </div>
            ) : (
              <div className="p-5 text-slate-600 dark:text-slate-300">Rasmda ovqat aniqlanmadi.</div>
            )}
          </div>

          {analysis.is_food && items.length > 0 && (
            <div className="glass rounded-3xl p-5">
              <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">Tarkibi</h3>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Porsiyani o&apos;zgartirsangiz, kaloriya avtomatik qayta hisoblanadi</p>
              <ul className="divide-y divide-slate-100 dark:divide-white/10">
                {items.map((it, i) => (
                  <li key={i} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-800 dark:text-white">{it.name}</div>
                        <div className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                          O {it.protein.toFixed(1)} · Y {it.fat.toFixed(1)} · U {it.carbs.toFixed(1)} g
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">{Math.round(it.calories)} kkal</span>
                        <button onClick={() => removeItem(i)} className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="O'chirish">✕</button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={Math.max(50, Math.round(baseGrams[i] * 3))}
                        step={5}
                        value={Math.round(it.grams)}
                        onChange={(e) => setGrams(i, +e.target.value)}
                        className="flex-1 accent-emerald-500"
                      />
                      <div className="flex items-center rounded-lg bg-slate-100 px-2 py-1 dark:bg-white/10">
                        <input
                          type="number"
                          min={0}
                          value={Math.round(it.grams)}
                          onChange={(e) => setGrams(i, Math.max(0, +e.target.value || 0))}
                          className="w-14 bg-transparent text-right text-sm tabular-nums outline-none"
                        />
                        <span className="ml-1 text-xs text-slate-500">g</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.tip && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              💡 {analysis.tip}
            </div>
          )}

          {analysis.is_food && items.length > 0 && (
            <div className="glass space-y-4 rounded-3xl p-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(MEAL_LABELS) as MealType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setMealType(t)}
                    disabled={saved}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                      mealType === t
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300"
                    }`}
                  >
                    {MEAL_LABELS[t]}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={reset} className="btn-secondary flex-1">Yangi rasm</button>
                <button onClick={save} disabled={saved} className="btn-primary flex-[2] disabled:opacity-70">
                  {saved ? "✓ Kundalikka saqlandi" : "Kundalikka qo'shish"}
                </button>
              </div>
            </div>
          )}
          {(!analysis.is_food || items.length === 0) && (
            <button onClick={reset} className="btn-primary w-full">Boshqa rasm</button>
          )}
          <p className="text-center text-xs text-slate-400">Natijalar taxminiy. Aniq dietologik maslahat uchun mutaxassisga murojaat qiling.</p>
        </section>
      )}
    </div>
  );
}

function Macro({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <span className={`h-2 w-2 rounded-full ${dot}`} /> {label}
      </div>
      <div className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums dark:text-white">{value.toFixed(1)} g</div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
