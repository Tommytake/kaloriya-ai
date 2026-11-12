import { z } from "zod";

export const FoodItemSchema = z.object({
  name: z.string().describe("Ovqat nomi, o'zbek tilida"),
  grams: z.number().describe("Taxminiy porsiya og'irligi, grammda"),
  calories: z.number().describe("Kaloriya, kkal"),
  protein: z.number().describe("Oqsil, g"),
  fat: z.number().describe("Yog', g"),
  carbs: z.number().describe("Uglevod, g"),
});

export const AnalysisSchema = z.object({
  is_food: z.boolean().describe("Rasmda ovqat yoki ichimlik bormi"),
  title: z.string().describe("Taomning qisqa umumiy nomi, o'zbek tilida"),
  items: z.array(FoodItemSchema),
  confidence: z.enum(["past", "o'rtacha", "yuqori"]),
  health_score: z.number().describe("1 dan 10 gacha foydalilik bahosi"),
  tip: z.string().describe("Qisqa foydali maslahat, o'zbek tilida, 1-2 gap"),
});

export type FoodItem = z.infer<typeof FoodItemSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
