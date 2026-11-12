import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AnalysisSchema } from "@/lib/schema";

export const maxDuration = 60;

const client = new Anthropic();

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type MediaType = (typeof ALLOWED)[number];
const MAX_BASE64 = 6_000_000; // ~4.5 MB

const SYSTEM = `Siz professional dietolog va ovqat tahlilchisisiz. Foydalanuvchi ovqat rasmini yuboradi.
Vazifangiz:
- Rasmdagi har bir ovqat/ichimlikni alohida aniqlang (masalan: palov, salat, non, choy).
- Har birining porsiyasini idish, qoshiq, qo'l kabi o'lchov belgilariga qarab grammda taxmin qiling.
- Kaloriya va makronutrientlarni (oqsil, yog', uglevod) standart oziq-ovqat ma'lumotlari asosida hisoblang.
- O'zbek milliy taomlarini yaxshi biling (palov, manti, somsa, lag'mon, sho'rva, shashlik, chuchvara, norin, qozon kabob va h.k.) va ularning odatdagi yog'liligini hisobga oling.
- Barcha nomlar va matnlar o'zbek tilida (lotin yozuvida) bo'lsin.
- Agar rasmda ovqat bo'lmasa, is_food=false qiling, items bo'sh ro'yxat bo'lsin va tip maydonida nima ko'ringanini ayting.
- Raqamlarni butun yoki bir xona kasr bilan bering.`;

export async function POST(req: Request) {
  let body: { image?: string; mediaType?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  const { image, mediaType, note } = body;
  if (!image || typeof image !== "string") {
    return Response.json({ error: "Rasm topilmadi" }, { status: 400 });
  }
  if (!ALLOWED.includes(mediaType as MediaType)) {
    return Response.json({ error: "Rasm formati qo'llab-quvvatlanmaydi" }, { status: 400 });
  }
  if (image.length > MAX_BASE64) {
    return Response.json({ error: "Rasm juda katta" }, { status: 413 });
  }

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(AnalysisSchema) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType as MediaType, data: image } },
            {
              type: "text",
              text:
                "Ushbu rasmdagi ovqatni tahlil qiling." +
                (note ? `\nFoydalanuvchi izohi: ${String(note).slice(0, 300)}` : ""),
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json(
        { error: "Rasmni tahlil qilib bo'lmadi. Boshqa rasm bilan urinib ko'ring." },
        { status: 422 },
      );
    }

    return Response.json({ analysis: response.parsed_output });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "API kalit sozlanmagan yoki noto'g'ri" }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Juda ko'p so'rov. Birozdan so'ng urinib ko'ring." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error", err.status, err.message);
      return Response.json({ error: "AI xizmatida xatolik yuz berdi" }, { status: 502 });
    }
    console.error(err);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}
