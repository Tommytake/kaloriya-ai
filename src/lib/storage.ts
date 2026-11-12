"use client";
import type { FoodItem } from "./schema";

export type MealType = "nonushta" | "tushlik" | "kechki" | "gazak";

export const MEAL_LABELS: Record<MealType, string> = {
  nonushta: "Nonushta",
  tushlik: "Tushlik",
  kechki: "Kechki ovqat",
  gazak: "Gazak",
};

export type Meal = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // ISO
  type: MealType;
  title: string;
  thumb: string; // kichik dataURL
  items: FoodItem[];
};

export type Profile = {
  gender: "erkak" | "ayol";
  age: number;
  weight: number;
  height: number;
  activity: number;
  goal: "ozish" | "saqlash" | "semirish";
  customCalories: number | null;
};

export const DEFAULT_PROFILE: Profile = {
  gender: "erkak",
  age: 25,
  weight: 70,
  height: 175,
  activity: 1.375,
  goal: "saqlash",
  customCalories: null,
};

const MEALS_KEY = "kaloriya.meals.v1";
const PROFILE_KEY = "kaloriya.profile.v1";

export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadMeals(): Meal[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MEALS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveMeals(meals: Meal[]) {
  try {
    localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  } catch {
    // Joy tugasa eng eski yozuvlarning rasmlarini o'chiramiz
    const trimmed = meals.map((m, i) => (i > 30 ? { ...m, thumb: "" } : m));
    localStorage.setItem(MEALS_KEY, JSON.stringify(trimmed));
  }
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(p: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

/** Mifflin–St Jeor formulasi bo'yicha kunlik kaloriya me'yori */
export function calcGoal(p: Profile) {
  if (p.customCalories && p.customCalories > 0) return p.customCalories;
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.gender === "erkak" ? 5 : -161);
  const tdee = bmr * p.activity;
  const adj = p.goal === "ozish" ? -500 : p.goal === "semirish" ? 400 : 0;
  return Math.max(1200, Math.round((tdee + adj) / 10) * 10);
}

export function sumItems(items: FoodItem[]) {
  return items.reduce(
    (a, i) => ({
      calories: a.calories + i.calories,
      protein: a.protein + i.protein,
      fat: a.fat + i.fat,
      carbs: a.carbs + i.carbs,
      grams: a.grams + i.grams,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, grams: 0 },
  );
}

export function guessMealType(d = new Date()): MealType {
  const h = d.getHours();
  if (h < 11) return "nonushta";
  if (h < 16) return "tushlik";
  if (h < 22) return "kechki";
  return "gazak";
}
