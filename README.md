// FILE: README.md
# FamousFinds (US‑only) — Next.js MVP


**What’s included**
- Next.js 14 + Tailwind PWA shell
- Home, Categories, Product, Sell (simulated), Admin Review (simulated)
- Sample products with remote images
- US‑only messaging


**Quick start**
```bash
npm i
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000


**Deploy**
- Push to GitHub → Import in Vercel → Set env vars → Deploy


**Next steps**
- Replace simulated endpoints with your backend (Stripe Connect, DB, AI moderation, shipping labels)
- Add authentication & role‑based admin
- Add real Checkout flow and Orders state machine
