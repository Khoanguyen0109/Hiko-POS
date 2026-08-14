# Redeem Reward — Feature Summary

**Last updated:** 2026-08-05  
**Status:** Deployed (MVP)  
**Related docs:** [Design spec](./superpowers/specs/2026-08-04-redeem-reward-design.md) · [Implementation plan](./superpowers/plans/2026-08-04-redeem-reward.md)

---

## What it is

A **brand-wide spin-game campaign** system for Hiko Matcha:

1. **Admin** creates campaigns and configures the prize wheel in Hiko-POS.
2. **Customer** plays on **hiko-web** with their phone number and receives a QR voucher if they win.
3. **Staff** scans the QR in Hiko-POS to validate and mark the voucher as redeemed (discount applied manually at checkout).
4. **Admin** reviews performance on the Dashboard **Redeem Reward** tab.

This is separate from **RewardProgram** (loyalty tiers) and **Promotion** (store coupons).

---

## Production URLs

| Surface | URL |
|---------|-----|
| Customer spin page | `https://www.hikomatcha.com/spin/{slug}` |
| Spin UI mock (preview) | `https://www.hikomatcha.com/spin/mock` |
| POS frontend | `https://hiko-pos.vercel.app` |
| Backend API | `https://divine-nature-production-1489.up.railway.app/api` |

**Spin link pattern (copy from Campaign Manager):**  
`https://hikomatcha.com/spin/{campaign-slug}`

---

## User flows

### Admin — create a campaign

1. Log in to POS as **Admin**.
2. Open **Campaign Manager** (`/campaigns`) from the sidebar or admin navigation.
3. Click **New Campaign** and fill in:
   - Name, slug, description (optional)
   - Start / end dates (optional)
   - Max plays per phone (default 1)
   - Wheel slots (label, reward type, weight, color)
4. Save and copy the spin link for marketing.

**Reward types per slot:**

| Type | Effect |
|------|--------|
| `percentage_discount` | Staff applies % off manually |
| `free_product` | Staff gives free dish manually |
| `no_prize` | “Try again” — no voucher |

### Customer — play & recover voucher

1. Open spin link → enter **10-digit phone** (`+84` prefix shown in UI).
2. Tap **Quay Ngay** → server picks weighted outcome → wheel animates to result.
3. If win → QR voucher + code shown; staff scans at counter.
4. Tap **Xem Voucher Của Tôi** to recover an unredeemed voucher by phone.
5. Tap **Vô Hiko nè!** to return to [hikomatcha.com](https://www.hikomatcha.com).

**Phone rules (current):** 10 digits, normalized on client (`912345678` → `0912345678`). No OTP yet — format validation only.

### Staff — redeem at POS

1. Open **Redeem Reward** (`/redeem-reward`) — sidebar or **More** bottom sheet.
2. Scan customer QR (or paste token).
3. Preview reward → **Confirm redeem** (atomic one-time use).
4. Apply discount / free item manually on the order.

### Admin — analytics

1. Open **Dashboard** → tab **Redeem Reward**.
2. Filter by date range and optional campaign.
3. View plays, wins, redemptions, prize breakdown, store summaries, recent activity (masked phones).

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  hiko-web       │     │  Astro API proxy │     │  Hiko-POS API   │
│  /spin/[slug]   │────▶│  /api/campaign/* │────▶│  Railway        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          ▲
┌─────────────────┐                                       │
│  POS frontend   │───────────────────────────────────────┘
│  Campaign Mgr   │  JWT admin CRUD + analytics
│  Redeem Scanner │
└─────────────────┘
```

- **Spin fairness:** weighted random on the **server**; client wheel is animation only.
- **Voucher security:** opaque `qrToken` in QR; redeem is atomic (`active` → `redeemed`).
- **Expiry:** vouchers expire when campaign ends or is deactivated (lazy expiry on access).

---

## API reference (quick)

### Admin (JWT + Admin role)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/campaign` | List campaigns |
| POST | `/api/campaign` | Create |
| GET | `/api/campaign/:id` | Detail |
| PUT | `/api/campaign/:id` | Update |
| DELETE | `/api/campaign/:id` | Deactivate |
| GET | `/api/campaign/analytics/dashboard` | Dashboard metrics |

### Public (rate-limited, no auth)

| Method | Path | Body |
|--------|------|------|
| GET | `/api/campaign/:slug/public` | — |
| POST | `/api/campaign/:slug/play` | `{ phone }` |
| POST | `/api/campaign/:slug/lookup` | `{ phone }` |

### Staff (JWT)

| Method | Path | Body |
|--------|------|------|
| GET | `/api/voucher/validate/:qrToken` | — |
| POST | `/api/voucher/redeem` | `{ qrToken }` |

---

## Repos & key files

### Hiko-POS — Backend (`pos-backend/`)

| Area | Files |
|------|-------|
| Models | `models/campaignModel.ts`, `campaignParticipationModel.ts`, `campaignVoucherModel.ts` |
| Services | `services/campaignService.ts`, `campaignAnalyticsService.ts`, `voucherService.ts` |
| Controllers / routes | `controllers/campaignController.ts`, `voucherController.ts`, `routes/campaignRoute.ts`, `voucherRoute.ts` |
| Utils | `utils/campaignUtils.ts` (weighted pick, QR token, phone mask) |
| Middleware | `middlewares/campaignPlayLimiter.ts` |
| Tests | `tests/campaignPlay.integration.test.ts`, `voucherRedeem.integration.test.ts` |

### Hiko-POS — Frontend (`pos-frontend/`)

| Area | Files |
|------|-------|
| Admin UI | `pages/CampaignManager.jsx`, `components/campaign/*` |
| Staff scanner | `pages/RedeemReward.jsx` |
| Dashboard | `components/dashboard/RedeemRewardDashboard.jsx` |
| State | `redux/slices/campaignSlice.js` |
| Routes | `constants/index.js` → `/campaigns`, `/redeem-reward` |
| Navigation | `components/shared/Sidebar.jsx`, `components/v2/MoreMenuSheet.jsx` |

### hiko-web (`src/`)

| Area | Files |
|------|-------|
| Spin page | `pages/spin/[slug].astro` |
| UI mock | `pages/spin/mock.astro` |
| React | `components/spin/SpinApp.tsx`, `SpinWheel.tsx`, `PhoneForm.tsx`, `VoucherDisplay.tsx`, `GoHomeButton.tsx` |
| API proxy | `pages/api/campaign/[slug]/public.ts`, `play.ts`, `lookup.ts` |
| Proxy helper | `lib/posCampaignProxy.ts` |
| Styles | `assets/styles/spin.css` |

---

## Deployment & environment

### Railway (backend)

- Service: **divine-nature** in project **Hiko-pos**
- Auto-deploys from `Hiko-POS` repo `master` branch

### Vercel (POS frontend)

- Project: **hiko-pos**
- Auto-deploys from `Hiko-POS` repo `master` branch
- Uses existing `VITE_BACKEND_URL` → Railway API

### Vercel (hiko-web)

- Project: **hiko-web**
- Auto-deploys from `Hiko-web` repo `main` branch
- Domains: `hikomatcha.com`, `www.hikomatcha.com`

**hiko-web → POS API:**

| Variable | Value |
|----------|-------|
| `HIKO_POS_API_URL` (optional) | `https://divine-nature-production-1489.up.railway.app/api` |

If unset, production falls back to the Railway URL hardcoded in `posCampaignProxy.ts`.

**CORS (backend):** allows `localhost:4321`, `hikomatcha.vn`, `www.hikomatcha.vn`, `hiko-pos.vercel.app`, and Vercel preview origins.

---

## Running locally

```bash
# Backend
cd pos-backend && npm install && npm run dev
# → http://localhost:3000/api

# POS frontend
cd pos-frontend && yarn install && yarn dev
# → http://localhost:5173

# hiko-web
cd hiko-web && npm install && npm run dev
# → http://localhost:4321
# Set HIKO_POS_API_URL=http://localhost:3000/api in .env
```

**Integration tests:**

```bash
cd pos-backend && NODE_OPTIONS=--experimental-vm-modules npm run test:integration
```

---

## End-to-end smoke test

1. **Admin:** Create campaign → set 2+ wheel slots → activate → copy spin link.
2. **Customer:** Open link → enter phone → spin → win → note QR/code.
3. **Customer:** “Xem Voucher Của Tôi” with same phone → same voucher shown.
4. **Staff:** Redeem Reward → scan QR → confirm → status **redeemed**.
5. **Staff:** Scan again → “Already redeemed”.
6. **Admin:** Dashboard → Redeem Reward tab → verify play/win/redeem counts.

---

## Out of scope (v1)

- OTP / SMS phone verification
- Auto-apply voucher to cart
- Per-store campaign restrictions
- Integration with Promotion or RewardProgram
- SMS delivery of voucher link

**Possible next steps:** VN phone prefix validation, Cloudflare Turnstile (bot protection), OTP via eSMS/Zalo for high-value campaigns.

---

## Git history (initial ship)

### Hiko-POS (`master`)

- Campaign models, admin CRUD, public play/lookup, voucher validate/redeem
- Analytics dashboard + Campaign Manager UI
- Staff QR scanner, CORS, lazy voucher expiry
- Build fix: `campaignSlice` CRUD exports for Vercel

### Hiko-web (`main`)

- Production spin page + Astro API proxy
- Production POS API URL fallback for Vercel
- **Vô Hiko nè!** home button on spin and voucher screens
