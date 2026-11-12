# KaloriyaAI 🥑

Ovqatni rasmga oling — sun'iy intellekt (Claude) kaloriya, oqsil, yog' va uglevodlarni hisoblab beradi.

## Imkoniyatlar
- 📷 Telefon kamerasi orqali rasmga olish, galereyadan tanlash yoki rasmni sudrab tashlash
- 🤖 Rasmdagi har bir taomni alohida aniqlash (o'zbek milliy taomlari ham)
- ⚖️ Porsiyani (grammni) o'zgartirsangiz, kaloriya avtomatik qayta hisoblanadi
- 📊 Kundalik: kunlik me'yor halqasi, makronutrientlar, 7 kunlik grafik, kunlar bo'yicha tarix
- 👤 Profil: jins, yosh, vazn, bo'y, faollik va maqsad bo'yicha kunlik kaloriya me'yori (Mifflin–St Jeor), tana massasi indeksi
- 📱 Mobil qurilmalarga moslashgan dizayn, tungi rejim, telefonga ilova sifatida o'rnatish (PWA)
- 🔒 Ma'lumotlar foydalanuvchining brauzerida saqlanadi, API kalit faqat serverda turadi

## Ishga tushirish
1. API kalitni https://console.anthropic.com saytidan oling.
2. `.env.local` faylini yarating:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. ```
   npm install
   npm run dev
   ```
4. Brauzerda http://localhost:3000 manzilini oching.

## Internetga joylash (Vercel)
1. Loyihani GitHub'ga yuklang.
2. https://vercel.com saytida **New Project** bo'limi orqali repozitoriyni tanlang.
3. **Environment Variables** bo'limiga `ANTHROPIC_API_KEY` qo'shing va **Deploy** tugmasini bosing.

## Tuzilishi
- `src/app/api/analyze/route.ts` — rasmni Claude'ga yuborib, natijani JSON sxema bo'yicha qaytaradi
- `src/components/Scanner.tsx` — rasmga olish va natija sahifasi
- `src/components/Diary.tsx` — kundalik va grafik
- `src/components/ProfileForm.tsx` — profil va me'yor
- `src/lib/storage.ts` — localStorage, me'yorni hisoblash
