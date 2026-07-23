# V2 UI (Mobile-First) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile-first V2 POS UI behind a single localStorage flag (`hiko.features.v2Ui`), unlocked via 5 taps on the Home greeting, without breaking V1 for users who never enable it.

**Architecture:** One boolean flag drives a conditional app shell (`V2Shell` with bottom nav vs existing sidebar). V2 components live alongside V1; pages branch on `useV2Ui()`. Phase 0 = flag + hidden toggle page. Phase 1 = shell + POS cart drawer + inline payment. Phase 2 = order card colors, storage cards, home V2. Phase 3 = schedule multi-view.

**Tech Stack:** React 18, Vite 6, Tailwind CSS, Redux Toolkit, React Router 7, existing design tokens in `src/styles/tokens.css`

**Mockups:** `.cursor/projects/.../canvases/pos-v2-feature-toggle.canvas.tsx`, `pos-mobile-ux-mockup.canvas.tsx`, `pos-features-mockup.canvas.tsx`

## Global Constraints

- **Single flag only:** `localStorage` key `hiko.features.v2Ui` — `"true"` | `"false"`, default `false`. No sub-flags.
- **Hidden entry:** 5 consecutive taps on Home greeting text; counter resets after 3 seconds without a tap.
- **Hidden route:** `/feature-toggles` — protected, NOT in sidebar or More menu links from V1.
- **V1 unchanged when flag off:** Existing sidebar, FAB, `/mobile-cart`, white invoice modal remain default.
- **Touch targets:** Payment CTAs minimum 48px height when V2 checkout ships.
- **Backend:** `createOrder` already accepts `paymentMethod` and `thirdPartyVendor` — use them at V2 checkout.
- **Minimal diffs:** Match existing code style; do not mass-reformat unrelated files.
- **No commits unless user requests** — subagents implement and test; parent agent commits when asked.

---

## File Structure

### New files
| File | Responsibility |
|------|----------------|
| `pos-frontend/src/utils/featureFlags.js` | Read/write `hiko.features.v2Ui` |
| `pos-frontend/src/context/V2UiContext.jsx` | React context + provider for reactive flag |
| `pos-frontend/src/hooks/useV2Ui.js` | Hook: `{ v2UiEnabled, setV2UiEnabled }` |
| `pos-frontend/src/hooks/useSecretTap.js` | 5-tap detector with 3s reset |
| `pos-frontend/src/pages/FeatureToggles.jsx` | Hidden page with one toggle |
| `pos-frontend/src/components/v2/BottomNav.jsx` | 5-tab mobile nav |
| `pos-frontend/src/components/v2/MoreMenuSheet.jsx` | Bottom sheet for overflow nav |
| `pos-frontend/src/components/v2/V2Shell.jsx` | V2 layout wrapper |
| `pos-frontend/src/components/v2/HomeHeader.jsx` | Greeting + secret tap + V2 badge |
| `pos-frontend/src/components/v2/CartDrawer.jsx` | Bottom sheet cart |
| `pos-frontend/src/components/v2/CheckoutBar.jsx` | Sticky total + open cart |
| `pos-frontend/src/components/v2/OrderTypePicker.jsx` | Walk-in / Grab / Shopee pills |
| `pos-frontend/src/components/v2/PaymentButtons.jsx` | Cash / Banking 48px CTAs |
| `pos-frontend/src/components/v2/orderCardTheme.js` | Status/payment/vendor/item color maps |

### Modified files (by phase)
- `main.jsx` — wrap `V2UiProvider`
- `App.jsx` — V2Shell vs V1 layout; `/feature-toggles` route
- `constants/index.js` — `FEATURE_TOGGLES` route; remove `MOBILE_CART` in Phase 1
- `pages/index.js` — export FeatureToggles
- `pages/Home.jsx` — V2 header when flag on
- `pages/MenuOrder.jsx` — cart drawer, no navigate to mobile-cart
- `components/menu/Bill.jsx` — inline payment, toast-only success
- `components/orders/OrderCard.jsx` — color-coded cards (V2)
- `pages/Storage.jsx` — card list on mobile (V2)
- `pages/WeeklySchedule.jsx` — view switcher (V2)

### Delete (Phase 1)
- `pages/MobileCart.jsx`

---

### Task 1: Feature flag utility + V2Ui context

**Files:**
- Create: `pos-frontend/src/utils/featureFlags.js`
- Create: `pos-frontend/src/context/V2UiContext.jsx`
- Create: `pos-frontend/src/hooks/useV2Ui.js`
- Modify: `pos-frontend/src/main.jsx`

**Interfaces — Produces:**
```js
// featureFlags.js
export const V2_UI_STORAGE_KEY = 'hiko.features.v2Ui';
export function isV2UiEnabled() => boolean;
export function setV2UiEnabled(enabled: boolean) => void;

// useV2Ui.js (re-export from context)
export function useV2Ui() => ({
  v2UiEnabled: boolean,
  setV2UiEnabled: (enabled: boolean) => void,
});
```

- [ ] **Step 1:** Create `featureFlags.js` with try/catch around localStorage
- [ ] **Step 2:** Create `V2UiContext.jsx` with state synced to localStorage on change
- [ ] **Step 3:** Create `useV2Ui.js` exporting the hook
- [ ] **Step 4:** Wrap `<App />` with `<V2UiProvider>` in `main.jsx`
- [ ] **Step 5:** Run `cd pos-frontend && npm run lint` — must pass

---

### Task 2: Secret tap + Feature toggles page + route

**Files:**
- Create: `pos-frontend/src/hooks/useSecretTap.js`
- Create: `pos-frontend/src/pages/FeatureToggles.jsx`
- Create: `pos-frontend/src/components/v2/HomeHeader.jsx`
- Modify: `pos-frontend/src/constants/index.js`
- Modify: `pos-frontend/src/pages/index.js`
- Modify: `pos-frontend/src/App.jsx`
- Modify: `pos-frontend/src/pages/Home.jsx`

**Interfaces — Consumes:** `useV2Ui()` from Task 1

**Interfaces — Produces:**
```js
// useSecretTap.js
export function useSecretTap({ requiredTaps = 5, resetMs = 3000, onUnlock: () => void })
  => { onTap: () => void, tapCount: number, remaining: number }
```

- [ ] **Step 1:** Implement `useSecretTap.js`
- [ ] **Step 2:** Add `ROUTES.FEATURE_TOGGLES = '/feature-toggles'` and PROTECTED_ROUTES entry (no sidebar link)
- [ ] **Step 3:** Build `FeatureToggles.jsx` — one toggle "Enable V2 UI", Back button, uses `useV2Ui`
- [ ] **Step 4:** Build `HomeHeader.jsx` — time-based greeting ("Good morning/afternoon/evening"), `useSecretTap` → `navigate(FEATURE_TOGGLES)`, V2 pill when enabled
- [ ] **Step 5:** In `Home.jsx`, when `v2UiEnabled`, render `HomeHeader` at top (V1 layout unchanged when flag off)
- [ ] **Step 6:** Register route in `App.jsx` COMPONENT_MAP
- [ ] **Step 7:** Run lint

---

### Task 3: V2Shell + BottomNav + MoreMenuSheet

**Files:**
- Create: `pos-frontend/src/components/v2/BottomNav.jsx`
- Create: `pos-frontend/src/components/v2/MoreMenuSheet.jsx`
- Create: `pos-frontend/src/components/v2/V2Shell.jsx`
- Modify: `pos-frontend/src/App.jsx`

**Interfaces — Consumes:** `useV2Ui()`, `ROUTES`

- [ ] **Step 1:** `BottomNav.jsx` — tabs: Home, Orders, POS, Storage, More; active state from `useLocation`; min 48px touch; safe-area padding
- [ ] **Step 2:** `MoreMenuSheet.jsx` — grouped links matching sidebar sections (Finance, Schedule, Admin); role-aware
- [ ] **Step 3:** `V2Shell.jsx` — hides sidebar offset on mobile; shows BottomNav; `pb-20` content padding; desktop `lg:` keeps sidebar if desired
- [ ] **Step 4:** `App.jsx` — when `v2UiEnabled`, wrap authenticated layout in `V2Shell`; hide sidebar FAB on mobile
- [ ] **Step 5:** Run lint + manual check flag on/off

---

### Task 4: CartDrawer + CheckoutBar + MenuOrder (V2 POS)

**Files:**
- Create: `pos-frontend/src/components/v2/CartDrawer.jsx`
- Create: `pos-frontend/src/components/v2/CheckoutBar.jsx`
- Modify: `pos-frontend/src/pages/MenuOrder.jsx`

- [ ] **Step 1:** `CartDrawer` — bottom sheet 70vh; embeds CustomerLookup, RewardSelector, CartInfo, Bill; drag handle
- [ ] **Step 2:** `CheckoutBar` — sticky bottom when cart has items: total + "View cart"
- [ ] **Step 3:** `MenuOrder` — header cart pill; open drawer state; remove `navigate(MOBILE_CART)` when V2
- [ ] **Step 4:** V1 path unchanged when flag off
- [ ] **Step 5:** Run lint

---

### Task 5: Inline payment + remove MobileCart route

**Files:**
- Create: `pos-frontend/src/components/v2/OrderTypePicker.jsx`
- Create: `pos-frontend/src/components/v2/PaymentButtons.jsx`
- Modify: `pos-frontend/src/components/menu/Bill.jsx`
- Modify: `pos-frontend/src/constants/index.js`
- Modify: `pos-frontend/src/App.jsx`
- Delete: `pos-frontend/src/pages/MobileCart.jsx`
- Modify: `pos-frontend/src/pages/index.js`

- [ ] **Step 1:** `OrderTypePicker` — dispatches `setThirdPartyVendor` (None/Grab/Shopee)
- [ ] **Step 2:** `PaymentButtons` — Cash/Banking; calls createOrder with `paymentMethod` + `orderStatus: 'completed'` when V2
- [ ] **Step 3:** `Bill.jsx` — when V2: skip Invoice modal, toast only; render PaymentButtons in drawer
- [ ] **Step 4:** Remove MOBILE_CART route and file
- [ ] **Step 5:** Run lint + build `npm run build`

---

### Task 6: Color-coded OrderCard (V2)

**Files:**
- Create: `pos-frontend/src/components/v2/orderCardTheme.js`
- Modify: `pos-frontend/src/components/orders/OrderCard.jsx`

- [ ] **Step 1:** Define STATUS, PAYMENT, VENDOR, ITEM_CATEGORY color maps (match mockup)
- [ ] **Step 2:** When V2: left status stripe, colored pills, item chips
- [ ] **Step 3:** V1 card unchanged when flag off
- [ ] **Step 4:** Run lint

---

### Task 7: Storage mobile cards (V2)

**Files:**
- Create: `pos-frontend/src/components/v2/StorageStockCard.jsx`
- Modify: `pos-frontend/src/pages/Storage.jsx`
- Modify: `pos-frontend/src/pages/Home.jsx` — tappable low-stock alert → storage

- [ ] **Step 1:** Card list for stock tab on `< md`
- [ ] **Step 2:** FAB for import/export on mobile V2
- [ ] **Step 3:** Home low-stock tap navigates to storage
- [ ] **Step 4:** Run lint

---

### Task 8: Schedule view modes (V2)

**Files:**
- Create: `pos-frontend/src/components/v2/ScheduleViewSwitcher.jsx`
- Modify: `pos-frontend/src/pages/WeeklySchedule.jsx` or `MyScheduleView.jsx`

- [ ] **Step 1:** Pills: Compact | Full week | Calendar
- [ ] **Step 2:** Full week grid (horizontal scroll)
- [ ] **Step 3:** Month calendar with day tap detail
- [ ] **Step 4:** Only when V2 flag on; run lint

---

## Execution Order

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8
```

Tasks 6–8 can run after Task 3 in parallel **only if** they touch disjoint files and flag-guard properly; default sequential to avoid merge conflicts.

## Testing Checklist (manual)

- [ ] Flag default off → identical to current production UI
- [ ] 5 taps on greeting → Feature toggles page
- [ ] Toggle on → bottom nav, V2 badge, cart drawer
- [ ] Toggle off → reverts to sidebar + FAB
- [ ] V2 order: add items → drawer → Cash → toast, no invoice modal
- [ ] `/mobile-cart` returns 404 after Task 5
