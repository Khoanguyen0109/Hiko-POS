# ZNS Phone OTP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require Zalo ZNS OTP before first spin; persist `Customer.phoneVerifiedAt` so return visits skip OTP; lookup stays phone-only.

**Architecture:** `PhoneOtpService` + `ZaloZnsService` on pos-backend; `play` gates on verified phone; hiko-web OTP step + Astro proxies.

**Tech Stack:** Express/TS, Mongoose, Zalo OA OAuth refresh + `business.openapi.zalo.me/message/template`, Astro/React spin UI.

**Spec:** `docs/superpowers/specs/2026-08-06-zns-phone-otp-design.md`

## Global Constraints

- Phone: `/^\d{10}$/`; ZNS format `84xxxxxxxxx`
- Template ID `619202`, param `otp`
- OTP: 6 digits, 5 min TTL, 60s resend, 5 attempts
- Secrets in env only; dry-run in `NODE_ENV=test`
- No `any` in pos-backend

---

### Task 1: Customer + OTP challenge models + config

**Files:**
- Modify: `pos-backend/models/customerModel.ts`
- Create: `pos-backend/models/phoneOtpChallengeModel.ts`
- Modify: `pos-backend/config/config.ts`
- Modify: `pos-backend/.env.example`

- [x] Add `phoneVerifiedAt`
- [x] Add `PhoneOtpChallenge` model
- [x] Add Zalo/ZNS config keys

### Task 2: ZaloZnsService + PhoneOtpService

**Files:**
- Create: `pos-backend/services/zaloZnsService.ts`
- Create: `pos-backend/services/phoneOtpService.ts`
- Create: `pos-backend/utils/phoneOtpUtils.ts`

- [x] Token refresh + send template
- [x] send/verify OTP with hash, cooldown, attempts
- [x] Dry-run when `NODE_ENV=test` or `ZNS_OTP_DRY_RUN=true`

### Task 3: Controllers, routes, play gate

**Files:**
- Modify: `pos-backend/services/campaignService.ts` — gate play
- Modify: `pos-backend/controllers/campaignController.ts`
- Modify: `pos-backend/routes/campaignRoute.ts`
- Modify: `pos-backend/tests/campaignPlay.integration.test.ts`
- Create: `pos-backend/tests/phoneOtp.integration.test.ts`

- [x] Routes `otp/send`, `otp/verify`
- [x] Play returns 403 `Phone not verified` if unverified
- [x] Fix play tests (pre-verify phones)
- [x] OTP integration tests

### Task 4: hiko-web OTP UX + proxies

**Files:**
- Create: `hiko-web/src/pages/api/campaign/[slug]/otp/send.ts`
- Create: `hiko-web/src/pages/api/campaign/[slug]/otp/verify.ts`
- Create: `hiko-web/src/components/spin/OtpForm.tsx`
- Modify: `hiko-web/src/components/spin/SpinApp.tsx`
- Modify: `hiko-web/src/components/spin/PhoneForm.tsx` (if needed)

- [x] Proxies
- [x] OTP screen after spin if not verified
- [x] Then play

### Task 5: Spec status + smoke

- [x] Mark design spec Approved
- [x] `npm run build` backend; run OTP + campaignPlay integration tests
